import firebase_admin
from firebase_admin import credentials, firestore
import csv
import re

# --- CONFIGURATION ---
CSV_FILENAME = "lineups.csv"
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW"

ROUND_MAP = {
    0: "Wild Card Lineup",
    1: "Divisional Lineup"
}

# 1. DEFENSE MAPPER
TEAM_MAP = {
    "texans": "HOU", "ravens": "BAL", "packers": "GB", 
    "49ers": "SF", "niners": "SF", "lions": "DET", 
    "chiefs": "KC", "bills": "BUF", "buccaneers": "TB", "bucs": "TB",
    "rams": "LAR", "dolphins": "MIA", "cowboys": "DAL", 
    "browns": "CLE", "steelers": "PIT", "eagles": "PHI", 
    "seahawks": "SEA", "seahwaks": "SEA", "patriots": "NE", 
    "broncos": "DEN", "jaguars": "JAX", "bears": "CHI", 
    "raiders": "LV", "chargers": "LAC", "vikings": "MIN", 
    "cardinals": "ARI", "falcons": "ATL", "panthers": "CAR", 
    "saints": "NO", "giants": "NYG", "jets": "NYJ", 
    "titans": "TEN", "commanders": "WAS"
}
# ---------------------

if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower().strip()).strip('-')

def clean_string(text):
    text = text.split('(')[0]
    return re.sub(r"['’\.]", "", text).strip().lower()

def build_player_map():
    print("⏳ Loading ALL Players (This ensures we find 'N/A' positions)...")
    name_map = {} 
    
    # CRITICAL CHANGE: NO FILTER. Fetch everyone.
    players_ref = db.collection('players')
    docs = players_ref.stream()

    count = 0
    for doc in docs:
        p = doc.to_dict()
        pid = doc.id
        
        # Map Name (e.g. "eddy pineiro" -> ID)
        if p.get('name'): name_map[clean_string(p['name'])] = pid
        if p.get('longName'): name_map[clean_string(p['longName'])] = pid
        
        # Map Defense Teams (e.g. "hou" -> ID)
        # We check if it LOOKS like a defense (name contains "Defense" or team is mapped)
        if p.get('position') == 'DEF' and p.get('team'):
            name_map[p['team'].lower()] = pid
        
        count += 1

    print(f"✅ Loaded {count} players total.")
    return name_map

def fix_position_if_needed(pid, correct_pos):
    """
    If the player is found but has position='N/A', fix it.
    """
    ref = db.collection('players').document(pid)
    doc = ref.get()
    if doc.exists:
        curr_pos = doc.to_dict().get('position')
        if curr_pos != correct_pos:
            print(f"   🔧 Fixing Position for {pid}: '{curr_pos}' -> '{correct_pos}'")
            ref.update({"position": correct_pos})

def resolve_player(raw_val, name_map, expected_pos="K"):
    clean = clean_string(raw_val) # "cam little"
    
    # 1. Direct Name Match
    if clean in name_map:
        pid = name_map[clean]
        # Auto-fix position since we found them
        fix_position_if_needed(pid, expected_pos)
        return pid

    # 2. Defense Team Match
    if expected_pos == "DEF":
        if clean in TEAM_MAP:
            team_abbr = TEAM_MAP[clean].lower()
            if team_abbr in name_map: return name_map[team_abbr]

    return None

def run_fix():
    name_map = build_player_map()
    print(f"\n📂 Reading {CSV_FILENAME}...")

    with open(CSV_FILENAME, 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        rows = list(reader)

    def_rows_found = []
    k_rows_found = []

    for row in rows:
        if not row: continue
        label = row[0].strip()
        if "Defense" in label: def_rows_found.append(row)
        elif "Kicker" in label: k_rows_found.append(row)

    header_row = rows[0]
    batch = db.batch()
    count = 0

    for index, db_key in ROUND_MAP.items():
        if index >= len(def_rows_found): continue

        print(f"\n🚀 Processing Round: {db_key}...")
        
        def_row = def_rows_found[index]
        k_row = k_rows_found[index]

        for i in range(1, len(header_row), 2):
            user_name = header_row[i].strip()
            if not user_name or user_name == "0": continue

            raw_def = def_row[i]
            raw_k = k_row[i]

            if "No Player" in raw_def: continue

            # Resolve
            def_id = resolve_player(raw_def, name_map, expected_pos="DEF")
            k_id = resolve_player(raw_k, name_map, expected_pos="K")

            updates = {}
            if def_id: updates[f"{db_key}.DEF"] = def_id
            if k_id: updates[f"{db_key}.K"] = k_id

            # Log
            log = []
            if not def_id: log.append(f"DEF ❌ ({raw_def})")
            if not k_id: log.append(f"K ❌ ({raw_k})")
            
            if log:
                print(f"   ⚠️ {user_name}: {', '.join(log)}")
            else:
                # print(f"   ✅ {user_name}: OK") 
                pass

            if updates:
                user_slug = slugify(user_name)
                ref = db.collection('leagues').document(LEAGUE_ID).collection('Members').document(user_slug)
                batch.update(ref, updates)
                count += 1

            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0
                print("... committing batch ...")

    if count > 0:
        batch.commit()
    
    print(f"\n✅ COMPLETE.")

if __name__ == "__main__":
    run_fix()