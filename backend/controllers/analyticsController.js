const prisma = require('../config/prisma');
const axios = require('axios');

function getDateRange(range, from, to) {
  const now = new Date();
  const endDate = to ? new Date(to) : new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate;
  if (from) {
    startDate = new Date(from);
  } else {
    switch (range) {
      case 'today': {
        startDate = new Date(endDate);
        break;
      }
      case 'month': {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      }
      case 'week':
      default: {
        startDate = new Date(endDate);
        const day = startDate.getDay();
        const offset = day === 0 ? 6 : day - 1; // Start week on Monday
        startDate.setDate(startDate.getDate() - offset);
      }
    }
  }

  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

// Get today's metrics for a page
async function getMetricsToday(req, res) {
  const { pageId } = req.params;

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get message count for today
    const messagesResult = await prisma.message.aggregate({
      where: {
        conversation: { pageId: page.id },
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: { id: true }
    });

    // Get unique senders today (inbound messages only)
    const uniqueSendersResult = await prisma.message.findMany({
      where: {
        conversation: { pageId: page.id },
        direction: 'INBOUND',
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        conversationId: true
      },
      distinct: ['conversationId']
    });

    // Get stored daily metric for video views and engagement
    const dailyMetric = await prisma.dailyMetric.findUnique({
      where: {
        pageId_date: {
          pageId: page.id,
          date: today
        }
      }
    });

    res.json({
      date: today.toISOString().split('T')[0],
      messagesCount: messagesResult._count.id || 0,
      uniqueSenders: uniqueSendersResult.length || 0,
      videoViews: dailyMetric?.videoViews || 0,
      engagement: dailyMetric?.engagement || 0
    });

  } catch (error) {
    console.error('Error fetching today metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

// Get metrics for a date range
async function getMetricsRange(req, res) {
  const { pageId } = req.params;
  const { from, to, days = 7 } = req.query;

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days) + 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get daily metrics from database
    const dailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        pageId: page.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Generate all dates in range
    const metrics = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = dailyMetrics.find(
        m => m.date.toISOString().split('T')[0] === dateStr
      );

      // Get actual message count from database for accuracy
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const messagesResult = await prisma.message.aggregate({
        where: {
          conversation: { pageId: page.id },
          timestamp: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _count: { id: true }
      });

      const uniqueSendersResult = await prisma.message.findMany({
        where: {
          conversation: { pageId: page.id },
          direction: 'INBOUND',
          timestamp: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: { conversationId: true },
        distinct: ['conversationId']
      });

      metrics.push({
        date: dateStr,
        messagesCount: messagesResult._count.id || 0,
        uniqueSenders: uniqueSendersResult.length || 0,
        videoViews: existing?.videoViews || 0,
        engagement: existing?.engagement || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ metrics });

  } catch (error) {
    console.error('Error fetching metrics range:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

// Get new PSIDs (first-time conversations) for a date range
async function getNewPsids(req, res) {
  const { pageId } = req.params;
  const { range = 'week', from, to } = req.query;

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId },
      select: { id: true, name: true, pageId: true }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const { startDate, endDate } = getDateRange(range, from, to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        pageId: page.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        psid: true,
        createdAt: true
      }
    });

    const countsByDate = conversations.reduce((acc, conv) => {
      const dateKey = conv.createdAt.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    const rows = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= endDate) {
      const dateKey = cursor.toISOString().split('T')[0];
      rows.push({
        date: dateKey,
        newPsids: countsByDate[dateKey] || 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayNewPsids = await prisma.conversation.count({
      where: {
        pageId: page.id,
        createdAt: {
          gte: todayStart,
          lt: tomorrow
        }
      }
    });

    res.json({
      pageId: page.pageId,
      pageName: page.name,
      range: {
        preset: from || to ? 'custom' : range,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totals: {
        newPsids: conversations.length
      },
      todayNewPsids,
      rows
    });
  } catch (error) {
    console.error('Error fetching new PSIDs:', error);
    res.status(500).json({ error: 'Failed to fetch new PSIDs' });
  }
}

// Get new PSIDs grouped by page for a date range
async function getNewPsidsAllPages(req, res) {
  const { range = 'week', from, to } = req.query;

  try {
    const { startDate, endDate } = getDateRange(range, from, to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const adminWorkspaces = await prisma.adminWorkspace.findMany({
      where: { adminId: req.adminId },
      select: { workspaceId: true }
    });
    const workspaceIds = adminWorkspaces.map(w => w.workspaceId);

    const pageWhere = workspaceIds.length
      ? { workspaceId: { in: workspaceIds } }
      : {};

    const pages = await prisma.page.findMany({
      where: pageWhere,
      select: { id: true, pageId: true, name: true }
    });

    if (!pages.length) {
      return res.json({
        range: {
          preset: from || to ? 'custom' : range,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        totalNewPsids: 0,
        pages: []
      });
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

    res.json({
      range: {
        preset: from || to ? 'custom' : range,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalNewPsids,
      pages: rows
    });
  } catch (error) {
    console.error('Error fetching new PSIDs for all pages:', error);
    res.status(500).json({ error: 'Failed to fetch new PSIDs by page' });
  }
}

// Sync metrics from Meta (for video views and engagement)
async function syncMetrics(req, res) {
  const { pageId } = req.params;
  const { date } = req.body; // Optional specific date

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId },
      include: { pageToken: true }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (!page.pageToken?.accessToken) {
      return res.status(400).json({ error: 'Page token not found' });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Fetch page insights from Meta
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${page.pageId}/insights`,
        {
          params: {
            access_token: page.pageToken.accessToken,
            metric: 'page_video_views,page_engaged_users',
            period: 'day',
            since: Math.floor(targetDate.getTime() / 1000),
            until: Math.floor(targetDate.getTime() / 1000) + 86400
          }
        }
      );

      let videoViews = 0;
      let engagement = 0;

      if (insightsResponse.data?.data) {
        for (const metric of insightsResponse.data.data) {
          if (metric.name === 'page_video_views' && metric.values?.length > 0) {
            videoViews = metric.values[0].value || 0;
          }
          if (metric.name === 'page_engaged_users' && metric.values?.length > 0) {
            engagement = metric.values[0].value || 0;
          }
        }
      }

      // Update or create daily metric
      await prisma.dailyMetric.upsert({
        where: {
          pageId_date: {
            pageId: page.id,
            date: targetDate
          }
        },
        update: {
          videoViews: videoViews,
          engagement: engagement
        },
        create: {
          pageId: page.id,
          date: targetDate,
          videoViews: videoViews,
          engagement: engagement
        }
      });

      res.json({
        success: true,
        date: targetDate.toISOString().split('T')[0],
        videoViews,
        engagement
      });

    } catch (insightError) {
      console.error('Error fetching insights:', insightError.response?.data || insightError.message);
      // Still return success but with zero values
      res.json({
        success: true,
        date: targetDate.toISOString().split('T')[0],
        videoViews: 0,
        engagement: 0,
        warning: 'Could not fetch insights from Meta'
      });
    }

  } catch (error) {
    console.error('Error syncing metrics:', error);
    res.status(500).json({ error: 'Failed to sync metrics' });
  }
}

module.exports = {
  getMetricsToday,
  getMetricsRange,
  getNewPsids,
  getNewPsidsAllPages,
  syncMetrics
};
