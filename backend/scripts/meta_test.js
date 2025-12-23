// meta_test.js
// Node 18+ (uses native fetch)

const BASE = "https://graph.facebook.com/v19.0";

const USER_TOKEN = process.env.FB_USER_TOKEN;
const PAGE_ID = '606309952576379';  // String to match API response
const PSID = '25295224360087584';   // String to match API

if (!USER_TOKEN || !PAGE_ID) {
  console.error("❌ Missing USER_TOKEN or PAGE_ID");
  process.exit(1);
}

async function getJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

(async () => {
  console.log("\n==============================");
  console.log("1) pages_show_list -> /me/accounts");
  console.log("==============================");

  const accounts = await getJSON(
    `${BASE}/me/accounts?access_token=${USER_TOKEN}`
  );
  console.log(accounts);

  const page = accounts.data?.find(p => p.id === PAGE_ID);
  if (!page?.access_token) {
    console.error("❌ PAGE_TOKEN not found. Make sure user manages this Page.");
    process.exit(1);
  }
  const PAGE_TOKEN = page.access_token;
  console.log("✅ PAGE_TOKEN acquired");

  console.log("\n==============================");
  console.log("2) pages_manage_metadata -> subscribe webhooks");
  console.log("==============================");

  const subRes = await getJSON(
    `${BASE}/${PAGE_ID}/subscribed_apps`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        subscribed_fields:
          "messages,message_deliveries,message_reads,messaging_postbacks",
        access_token: PAGE_TOKEN
      })
    }
  );
  console.log(subRes);

  console.log("\n==============================");
  console.log("3) pages_read_engagement -> page insights");
  console.log("==============================");

  const insights = await getJSON(
    `${BASE}/${PAGE_ID}/insights?metric=page_post_engagements&period=day&date_preset=last_7d&access_token=${PAGE_TOKEN}`
  );
  console.log(insights);

  if (PSID) {
    console.log("\n==============================");
    console.log("4) pages_utility_messaging -> send message");
    console.log("==============================");

    const msg = await getJSON(
      `${BASE}/me/messages?access_token=${PAGE_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: PSID },
          messaging_type: "RESPONSE",
          message: { text: "Thanks! We will reply shortly." }
        })
      }
    );
    console.log(msg);
  } else {
    console.log("\nℹ️ PSID not provided — skipping pages_utility_messaging test");
  }

  console.log("\n✅ All test calls executed");
})();
