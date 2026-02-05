import firebase_admin
from firebase_admin import credentials, firestore
import csv
import re

# --- CONFIGURATION ---
CSV_FILENAME = "lineups.csv"
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW"

# MAPPER: CSV Name -> Database Team Abbreviation or Name
# Add any missing teams here if you see "Not Found" errors.
TEAM_MAP = {
    "texans": "HOU",
    "ravens": "BAL",
    "packers": "GB",
    "49ers": "SF",
    "niners": "SF",
    "lions": "DET",
    "chiefs": "KC",
    "bills": "BUF",
    "buccaneers": "TB",
    "bucs": "TB",
    "rams": "LAR",
    "dolphins": "MIA",
    "cowboys": "DAL",
    "browns": "CLE",
    "steelers": "PIT",
    "eagles": "PHI",
    "seahawks": "SEA",
    "seahwaks": "SEA", # Typo fix
    "patriots": "NE",
    "broncos": "DEN",
    "jaguars": "JAX",
    "bears": "CHI",
}
# ---------------------

if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower().strip()).strip('-')

def clean_player_name(name):
    # Remove parenthesis parts like "(Jaguars)"
    name = name.split('(')[0]
    return name.lower().strip()

def build_player_map():
    print("⏳ Loading Player Database...")
    player_map = {}
    
    # Fetch all DEF and K
    players_ref = db.collection('players')
    docs = players_ref.where('position', 'in', ['DEF', 'K']).stream()

    for doc in docs:
        p = doc.to_dict()
        pid = doc.id
        
        # 1. Map Full Names and "LongNames"
        if p.get('name'): player_map[p['name'].lower()] = pid
        if p.get('longName'): player_map[p['longName'].lower()] = pid
        
        # 2. Map Abbreviations for Defenses (e.g. "HOU" -> ID)
        if p.get('team'): 
            team_key = p['team'].lower()
            player_map[team_key] = pid 
            
            # Also map "Defense" specific keys if possible
            # (If your DB has name="Texans", this catches it)
            if p.get('position') == 'DEF':
                player_map[team_key] = pid

    print(f"✅ Loaded {len(player_map)} player reference keys.")
    return player_map

def resolve_defense_id(csv_name, player_map):
    """ Tries to find a Defense ID using the Map and Team Abbreviations """
    clean_name = clean_player_name(csv_name)
    
    # 1. Direct Lookup
    if clean_name in player_map:
        return player_map[clean_name]
    
    # 2. Map Nickname to Abbreviation (Texans -> HOU)
    if clean_name in TEAM_MAP:
        abbrev = TEAM_MAP[clean_name].lower()
        if abbrev in player_map:
            return player_map[abbrev]
            
    return None

def process_pivot_csv():
    player_map = build_player_map()
    
    print(f"\n📂 Reading {CSV_FILENAME}...")
    
    # Use latin-1 to handle the weird spacing characters
    with open(CSV_FILENAME, 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        rows = list(reader)

    header_row = rows[0]
    def_row = None
    k_row = None

    # --- FIX: Stop at the first valid row found ---
    for row in rows:
        if not row: continue
        label = row[0].strip()
        
        # Look for "Defense" but ignore rows that might be empty/headers
        if "Defense" in label and not def_row:
            # check if row has data to be sure
            if len(row) > 2 and row[2] != "0": 
                def_row = row
        
        if "Kicker" in label and not k_row:
            if len(row) > 2 and row[2] != "0":
                k_row = row
        
        if def_row and k_row:
            break

    if not def_row or not k_row:
        print("❌ Error: Could not find valid 'Defense' or 'Kicker' rows.")
        return

    print(f"✅ Found Data Rows. Processing {len(header_row)//2} users...")

    batch = db.batch()
    batch_count = 0
    updates_count = 0

    # Loop Users (Skip index 0, Step 2)
    for i in range(1, len(header_row), 2):
        user_name = header_row[i].strip()
        if not user_name or user_name == "0": continue

        raw_def = def_row[i]
        raw_k = k_row[i]
        
        # Skip empty picks
        if "No Player" in raw_def or "No Player" in raw_k:
            continue

        # 1. Solve Defense
        def_id = resolve_defense_id(raw_def, player_map)
        
        # 2. Solve Kicker
        clean_k = clean_player_name(raw_k)
        k_id = player_map.get(clean_k)

        # Debug if missing
        if not def_id:
            print(f"⚠️ DEF Miss: '{raw_def}' -> ? ({user_name})")
        if not k_id:
            print(f"⚠️ KICKER Miss: '{raw_k}' -> '{clean_k}'? ({user_name})")

        # 3. Update
        if def_id or k_id:
            user_slug = slugify(user_name)
            update_data = {}
            if def_id: update_data["Divisional Lineup.DEF"] = def_id
            if k_id: update_data["Divisional Lineup.K"] = k_id
            
            doc_ref = db.collection('leagues').document(LEAGUE_ID).collection('Members').document(user_slug)
            batch.update(doc_ref, update_data)
            batch_count += 1
            updates_count += 1

        if batch_count >= 400:
            batch.commit()
            batch = db.batch()
            batch_count = 0
            print(f"... committed batch ...")

    if batch_count > 0:
        batch.commit()

    print(f"\n✅ COMPLETE. Updated {updates_count} user lineups.")

if __name__ == "__main__":
    process_pivot_csv()