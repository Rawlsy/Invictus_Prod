// gameday-pinger.js
// ✅ Use full http://localhost:3000 paths for local testing
const INGEST_URL = "http://localhost:3000/api/pigskin/ingest?secret=pigskin_super_bowl_2026";
const SYNC_URL = "http://localhost:3000/api/pigskin/sync";

async function ping() {
    console.log(`\n🚀 [${new Date().toLocaleTimeString()}] Starting Game Day Heartbeat...`);
    
    try {
        // 1. Trigger Ingest
        console.log("📡 Ingesting latest plays from Tank01...");
        const ingestRes = await fetch(INGEST_URL);
        const ingestData = await ingestRes.json().catch(() => ({ error: "Ingest: Invalid JSON" }));
        
        if (ingestRes.ok) {
            console.log("✅ Ingest Success:", ingestData.message);
        } else {
            console.error("⚠️ Ingest Failed:", ingestData.error || ingestRes.statusText);
        }

        // 2. Trigger Sync
        console.log("🔄 Syncing scores for all leagues...");
        const syncRes = await fetch(SYNC_URL);
        const syncData = await syncRes.json().catch(() => ({ error: "Sync: Invalid JSON" }));

        if (syncRes.ok) {
            console.log("✅ Sync Success:", syncData.message);
        } else {
            console.error("⚠️ Sync Failed:", syncData.error || syncRes.statusText);
        }

    } catch (err) {
        // This will trigger if localhost:3000 is not running
        console.error("❌ Pinger Connection Error: Is your Next.js server running on localhost:3000?");
    }

    console.log("😴 Sleeping for 20s...");
    setTimeout(ping, 20000); 
}

console.log("🔥 Super Bowl LX Pinger Started (Local Mode).");
ping();