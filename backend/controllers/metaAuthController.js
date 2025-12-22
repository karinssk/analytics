const axios = require('axios');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:4299/auth/meta/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Required permissions for the app
const SCOPES = [
  'pages_show_list',
  'pages_manage_metadata',
  'pages_messaging',
  'pages_read_engagement'
].join(',');

// Redirect to Meta OAuth
function redirectToMeta(req, res) {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;

  res.redirect(authUrl);
}

// Handle OAuth callback
async function handleCallback(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('Meta OAuth error:', error, error_description);
    return res.redirect(`${process.env.FRONTEND_URL}/connect/meta?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/connect/meta?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code: code
      }
    });

    const { access_token, expires_in } = tokenResponse.data;

    // Get user info from Meta
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: access_token,
        fields: 'id,name,email'
      }
    });

    const { id: metaId, name, email } = userResponse.data;

    // Find or create admin user
    let admin = await prisma.admin.findUnique({
      where: { metaId: metaId }
    });

    if (!admin && email) {
      // Try to find by email
      admin = await prisma.admin.findUnique({
        where: { email: email }
      });

      if (admin) {
        // Link Meta account to existing admin
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: {
            metaId: metaId,
            metaAccessToken: access_token,
            name: admin.name || name
          }
        });
      }
    }

    if (!admin) {
      // Create new admin
      admin = await prisma.admin.create({
        data: {
          email: email || `meta_${metaId}@temp.local`,
          metaId: metaId,
          metaAccessToken: access_token,
          name: name
        }
      });

      // Create default workspace for new admin
      const workspace = await prisma.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          admins: {
            create: {
              adminId: admin.id,
              role: 'owner'
            }
          }
        }
      });
    } else {
      // Update access token
      admin = await prisma.admin.update({
        where: { id: admin.id },
        data: {
          metaAccessToken: access_token
        }
      });
    }

    // Create JWT token for session
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        name: admin.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/connect/callback?token=${token}`);

  } catch (error) {
    console.error('Meta OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/connect/meta?error=oauth_failed`);
  }
}

// Get current user's Meta pages
async function getPages(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId }
    });

    if (!admin || !admin.metaAccessToken) {
      return res.status(401).json({ error: 'Not connected to Meta' });
    }

    // Fetch pages from Meta Graph API
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: admin.metaAccessToken,
        fields: 'id,name,access_token,category'
      }
    });

    const metaPages = pagesResponse.data.data || [];

    // Get already connected pages from database
    const connectedPages = await prisma.page.findMany({
      select: { pageId: true, isConnected: true }
    });

    const connectedMap = new Map(connectedPages.map(p => [p.pageId, p.isConnected]));

    // Merge Meta pages with connection status
    const pages = metaPages.map(page => ({
      id: page.id,
      name: page.name,
      category: page.category,
      isConnected: connectedMap.get(page.id) || false,
      accessToken: page.access_token // Will be stored when connecting
    }));

    res.json({ pages });

  } catch (error) {
    console.error('Error fetching pages:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
}

// Connect a page (save token and subscribe webhook)
async function connectPage(req, res) {
  const { pageId } = req.params;
  const { accessToken, name } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Page access token required' });
  }

  try {
    // Get admin's workspace
    const adminWorkspace = await prisma.adminWorkspace.findFirst({
      where: { adminId: req.adminId },
      include: { workspace: true }
    });

    // Create or update page in database
    const page = await prisma.page.upsert({
      where: { pageId: pageId },
      update: {
        name: name,
        isConnected: true,
        workspaceId: adminWorkspace?.workspaceId
      },
      create: {
        pageId: pageId,
        name: name,
        isConnected: true,
        workspaceId: adminWorkspace?.workspaceId
      }
    });

    // Store page token
    await prisma.pageToken.upsert({
      where: { pageId: page.id },
      update: {
        accessToken: accessToken
      },
      create: {
        pageId: page.id,
        accessToken: accessToken
      }
    });

    // Subscribe to webhook
    const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-domain.com/webhook/meta';

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins'],
          access_token: accessToken
        }
      );
      console.log(`Webhook subscription successful for page ${pageId}`);
    } catch (webhookError) {
      console.error('Webhook subscription error:', webhookError.response?.data || webhookError.message);
      // Continue anyway - page is connected, webhook might fail
    }

    res.json({
      success: true,
      page: {
        id: page.id,
        pageId: page.pageId,
        name: page.name,
        isConnected: page.isConnected
      }
    });

  } catch (error) {
    console.error('Error connecting page:', error);
    res.status(500).json({ error: 'Failed to connect page' });
  }
}

// Disconnect a page
async function disconnectPage(req, res) {
  const { pageId } = req.params;

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId },
      include: { pageToken: true }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Unsubscribe from webhook
    if (page.pageToken?.accessToken) {
      try {
        await axios.delete(
          `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
          {
            params: { access_token: page.pageToken.accessToken }
          }
        );
      } catch (error) {
        console.error('Webhook unsubscribe error:', error.response?.data || error.message);
      }
    }

    // Update page as disconnected
    await prisma.page.update({
      where: { pageId: pageId },
      data: { isConnected: false }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Error disconnecting page:', error);
    res.status(500).json({ error: 'Failed to disconnect page' });
  }
}

module.exports = {
  redirectToMeta,
  handleCallback,
  getPages,
  connectPage,
  disconnectPage
};
