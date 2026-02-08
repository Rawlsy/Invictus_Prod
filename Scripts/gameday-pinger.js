// gameday-pinger.js
const fetch = require('node-fetch'); // You might need to install this: npm install node-fetch

// REPLACE WITH YOUR LIVE SITE URL
const SITE_URL = "https://invictussports.app"; 

console.log(`🏈 STARTING GAME DAY PINGER: Targeting ${SITE_URL}`);

async function ping() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Pinging API...`);
        const res = await fetch(`${SITE_URL}/api/pigskin/sync`);
        const data = await res.json();
        console.log(`✅ Success: ${data.updates} updates processed.`);
    } catch (err) {
        console.error("❌ Ping Failed:", err.message);
    }
}

// Run immediately
ping();

// Then run every 20 seconds
setInterval(ping, 20000);