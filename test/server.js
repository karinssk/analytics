// Lightweight API proxy to fetch ad data from Meta Marketing API and return JSON.
// Set env META_ACCESS_TOKEN and META_AD_ACCOUNT_ID (without "act_") before running.
const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.META_API_VERSION || 'v18.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAATlr4HTp6UBQePKJfSUWQRvxHN7OhX90YAskyv33e4wcF5fD7p5ZCwXI4kMMZA3ORGYl93hp6sKZBsYfZCsrsoHBv9DepE6HuyqnRxIZBuS8kfLyYtQOW3ewY6ott6Ry40yDZBXt3nIqfvokhK7YXa8kTYlmIYCjqEs55nQgsZCxKjAxt1kMhhItGrZB3fbGKnR3kv54Yiy82miQhXYcfAh';
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || '671040573751718'; // e.g. 123456789012345

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

async function fetchAds() {
  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    throw new Error('Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID');
  }

  const fields = [
    'id',
    'name',
    'status',
    'effective_status',
    'created_time',
    'creative{thumbnail_url,object_story_spec}',
    'insights.date_preset(lifetime){impressions,reach,clicks,spend,actions}',
  ].join(',');

  const endpoint = new URL(
    `https://graph.facebook.com/${API_VERSION}/act_${AD_ACCOUNT_ID}/ads`
  );
  endpoint.searchParams.set('fields', fields);
  endpoint.searchParams.set('access_token', ACCESS_TOKEN);

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta API error ${response.status}: ${errorText}`);
  }

  const raw = await response.json();
  const ads = (raw.data || []).map((ad) => {
    const firstInsight = ad.insights?.data?.[0];
    const actions = {};
    if (firstInsight?.actions) {
      for (const action of firstInsight.actions) {
        actions[action.action_type] = Number(action.value) || 0;
      }
    }

    return {
      id: ad.id,
      name: ad.name,
      status: ad.status || ad.effective_status,
      created_time: ad.created_time,
      image:
        ad.creative?.thumbnail_url ||
        ad.creative?.object_story_spec?.link_data?.picture ||
        null,
      message:
        ad.creative?.object_story_spec?.link_data?.message ||
        ad.creative?.object_story_spec?.video_data?.message ||
        null,
      insights: {
        impressions: Number(firstInsight?.impressions) || 0,
        reach: Number(firstInsight?.reach) || 0,
        clicks: Number(firstInsight?.clicks) || 0,
        spend: Number(firstInsight?.spend) || 0,
        actions,
      },
    };
  });

  return { ads, paging: raw.paging || null };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/ads') {
    try {
      const data = await fetchAds();
      return json(res, 200, data);
    } catch (error) {
      console.error('Failed to fetch ads', error);
      return json(res, 500, { error: error.message });
    }
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Ad data proxy running on port ${PORT}`);
});
