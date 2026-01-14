// debug-week.js
const API_KEY = '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e';
const HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';

async function getCurrentWeekInfo() {
  console.log("🔍 Asking Tank01 for current Season Info...");

  // Get Today's Date in YYYYMMDD format (e.g., "20260112")
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  const url = `https://${HOST}/getNFLCurrentInfo?date=${today}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': HOST
      }
    });
    
    const data = await res.json();
    console.log("\n--- TANK01 RESPONSE ---");
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Error:", err);
  }
}

getCurrentWeekInfo();