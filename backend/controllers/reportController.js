const prisma = require('../config/prisma');
const axios = require('axios');

const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_REPORT_TO = process.env.LINE_REPORTER_USER_OR_ROOM_ID;

// Build Facebook PSID stats for a date range (per page)
async function buildFacebookStats(adminId, startDate, endDate) {
  const adminWorkspaces = await prisma.adminWorkspace.findMany({
    where: { adminId },
    select: { workspaceId: true }
  });
  const workspaceIds = adminWorkspaces.map(w => w.workspaceId);

  const pages = await prisma.page.findMany({
    where: workspaceIds.length ? { workspaceId: { in: workspaceIds } } : {},
    select: { id: true, pageId: true, name: true }
  });

  if (!pages.length) {
    return { pages: [], totalNewPsids: 0 };
  }

  const grouped = await prisma.conversation.groupBy({
    by: ['pageId'],
    where: {
      pageId: { in: pages.map(p => p.id) },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: { id: true }
  });

  const rows = pages.map(page => {
    const match = grouped.find(g => g.pageId === page.id);
    return {
      pageId: page.pageId,
      pageName: page.name,
      newPsids: match?._count.id || 0
    };
  });

  const totalNewPsids = rows.reduce((sum, r) => sum + r.newPsids, 0);
  return { pages: rows, totalNewPsids };
}

// Build LINE stats for a date range
async function buildLineStats(startDate, endDate) {
  const chats = await prisma.chat.findMany({
    where: { user: { lineId: { not: null } } },
    include: { user: true }
  });

  const usersMap = new Map();
  let totalMessages = 0;

  for (const chat of chats) {
    const lineId = chat.user?.lineId;
    if (!lineId) continue;
    const messages = Array.isArray(chat.messages) ? chat.messages : [];

    const filtered = messages.filter(msg => {
      const ts = msg?.createdAt ? new Date(msg.createdAt) : null;
      if (!ts || isNaN(ts.getTime())) return false;
      if (startDate && ts < startDate) return false;
      if (endDate && ts > endDate) return false;
      return true;
    });

    if (!usersMap.has(lineId)) {
      usersMap.set(lineId, {
        lineId,
        name: chat.user?.name || 'Unknown User',
        messageCount: 0
      });
    }

    const current = usersMap.get(lineId);
    current.messageCount += filtered.length;
    totalMessages += filtered.length;
  }

  return {
    totalUsers: usersMap.size,
    totalMessages,
    users: Array.from(usersMap.values()).sort((a, b) => b.messageCount - a.messageCount)
  };
}

function normalizeDateRange(dateStr) {
  const target = dateStr ? new Date(dateStr) : new Date();
  target.setHours(0, 0, 0, 0);
  const startDate = new Date(target);
  const endDate = new Date(target);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate, label: target.toISOString().split('T')[0] };
}

async function getLineReport(req, res) {
  try {
    const { date } = req.query;
    const { startDate, endDate, label } = normalizeDateRange(date);

    const facebook = await buildFacebookStats(req.adminId, startDate, endDate);
    const line = await buildLineStats(startDate, endDate);

    res.json({
      date: label,
      facebook,
      line
    });
  } catch (error) {
    console.error('Error building line report:', error);
    res.status(500).json({ error: 'Failed to build line report' });
  }
}

async function sendLineReportNow(req, res) {
  try {
    const report = await getReportData(req.adminId);
    await deliverReport(report);
    res.json({ sent: true, report });
  } catch (error) {
    console.error('Error sending line report now:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
}

let scheduledTimeout = null;
let scheduledTime = null; // "HH:mm"

function scheduleNextRun(adminId) {
  if (!scheduledTime) return;
  const [hour, minute] = scheduledTime.split(':').map(n => parseInt(n, 10));
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  const delay = next.getTime() - now.getTime();

  if (scheduledTimeout) clearTimeout(scheduledTimeout);
  scheduledTimeout = setTimeout(async () => {
    try {
      const report = await getReportData(adminId);
      await deliverReport(report);
    } catch (err) {
      console.error('Scheduled report failed:', err);
    } finally {
      scheduleNextRun(adminId);
    }
  }, delay);
}

async function scheduleLineReport(req, res) {
  try {
    const { time } = req.body; // Expect "HH:mm"
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Invalid time format, expected HH:mm' });
    }
    scheduledTime = time;
    scheduleNextRun(req.adminId);
    res.json({ scheduled: true, time: scheduledTime });
  } catch (error) {
    console.error('Error scheduling line report:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
}

async function getReportData(adminId) {
  const { startDate, endDate, label } = normalizeDateRange();
  const facebook = await buildFacebookStats(adminId, startDate, endDate);
  const line = await buildLineStats(startDate, endDate);
  return { date: label, facebook, line };
}

function formatReportMessage(report) {
  const header = `report ${report.date}`;
  const fbLines = report.facebook.pages.map(p => `${p.pageName || p.pageId}: ${p.newPsids}`);
  const fbSection = ['facebook statics   New PSIDs', ...fbLines].join('\n');
  const lineSection = [
    'line statics',
    `total users: ${report.line.totalUsers || 0}`,
    `total messages: ${report.line.totalMessages || 0}`
  ].join('\n');
  return [header, fbSection, '', lineSection].join('\n');
}

async function deliverReport(report) {
  if (!LINE_ACCESS_TOKEN || !LINE_REPORT_TO) {
    throw new Error('LINE reporting env vars missing');
  }
  const text = formatReportMessage(report);
  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: LINE_REPORT_TO,
      messages: [{ type: 'text', text }]
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

module.exports = {
  getLineReport,
  sendLineReportNow,
  scheduleLineReport
};
