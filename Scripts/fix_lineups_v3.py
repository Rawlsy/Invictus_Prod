import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import re
import os

# --- CONFIGURATION ---
CSV_FILENAME = "Fantasy Football 2026 - Conference Championship - Prelim Results V2.xlsx - Scoring.csv"
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW"

ROUNDS = {
    "Wild Card Lineup":  {"start_row": 1},
    "Divisional Lineup": {"start_row": 13},
    "Conference Lineup": {"start_row": 25}
}

# --- THE FIX IS HERE: CHANGED "Flex" TO "FLEX" ---
POS_MAP_OFFSET = {
    0: "QB",
    1: "RB1",
    2: "RB2",
    3: "WR1",
    4: "WR2",
    5: "FLEX",  # <--- CHANGED FROM "Flex" TO "FLEX"
    6: "TE",
    7: "DEF",
    8: "K"
}

# TEAM MAPPER
TEAM_MAP = {
    "texans": "HOU", "ravens": "BAL", "packers": "GB", 
    "49ers": "SF", "niners": "SF", "lions": "DET", 
    "chiefs": "KC", "bills": "BUF", "buccaneers": "TB", "bucs": "TB",
    "rams": "LAR", "dolphins": "MIA", "cowboys": "DAL", 
    "browns": "CLE", "steelers": "PIT", "eagles": "PHI", 
    "seahawks": "SEA", "patriots": "NE", "new england": "NE",
    "broncos": "DEN", "jaguars": "JAX", "bears": "CHI", 
    "raiders": "LV", "chargers": "LAC", "vikings": "MIN", 
    "cardinals": "ARI", "falcons": "ATL", "panthers": "CAR", 
    "saints": "NO", "giants": "NYG", "jets": "NYJ", 
    "titans": "TEN", "commanders": "WAS"
}

if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower().strip()).strip('-')

def clean_string(text):
    if not isinstance(text, str): return ""
    text = text.split('(')[0]
    return re.sub(r"['’\.]", "", text).strip().lower()

def build_player_map():
    print("⏳ Loading Player Database...")
    name_map = {} 
    players_ref = db.collection('players')
    docs = players_ref.stream()
    for doc in docs:
        p = doc.to_dict()
        pid = doc.id
        if p.get('name'): name_map[clean_string(p['name'])] = pid
        if p.get('longName'): name_map[clean_string(p['longName'])] = pid
        if p.get('position') == 'DEF' and p.get('team'):
            name_map[p['team'].lower()] = pid
    print(f"✅ Loaded {len(name_map)} players.")
    return name_map

def get_or_create_player(raw_name, player_map, pos_hint="FLEX"):
    clean = clean_string(raw_name)
    if clean in player_map: return player_map[clean]
    if pos_hint == "DEF":
        team_abbr = TEAM_MAP.get(clean)
        if team_abbr and team_abbr.lower() in player_map: return player_map[team_abbr.lower()]

    new_id = slugify(raw_name.split('(')[0])
    if new_id in player_map.values(): return new_id

    # If the position is FLEX, we try to guess, otherwise just label it FLEX for now
    clean_pos = pos_hint if pos_hint != "FLEX" else "RB" # Default to RB if unknown, user can fix later
    
    print(f"   ✨ Auto-Creating: {raw_name} -> {new_id}")
    db.collection('players').document(new_id).set({
        "name": raw_name.split('(')[0].strip(),
        "position": clean_pos, 
        "team": "FA",
        "auto_created": True
    }, merge=True)
    player_map[clean] = new_id
    return new_id

def run_import():
    if not os.path.exists(CSV_FILENAME):
        print(f"❌ ERROR: Could not find '{CSV_FILENAME}'.")
        return

    print(f"📂 Reading {CSV_FILENAME}...")
    df = pd.read_csv(CSV_FILENAME, header=None)

    player_map = build_player_map()
    batch = db.batch()
    count = 0
    updated_users = 0

    print("🚀 Re-Running Import with corrected FLEX key...")

    num_cols = len(df.columns)
    
    for col_idx in range(1, num_cols, 2):
        user_name = df.iloc[0, col_idx]
        if pd.isna(user_name) or str(user_name).strip() == "": continue

        user_name = str(user_name).strip()
        updates = {}
        
        for round_name, bounds in ROUNDS.items():
            start = bounds['start_row']
            lineup_data = {}
            for offset in range(9):
                row_idx = start + offset
                pos_key = POS_MAP_OFFSET[offset] # This is now "FLEX"
                if row_idx >= len(df): continue
                raw_player = df.iloc[row_idx, col_idx]
                if pd.isna(raw_player) or "No Player" in str(raw_player): continue
                
                pid = get_or_create_player(str(raw_player), player_map, pos_hint=pos_key)
                if pid: lineup_data[pos_key] = pid

            if lineup_data: updates[round_name] = lineup_data

        if updates:
            user_slug = slugify(user_name)
            user_ref = db.collection('leagues').document(LEAGUE_ID).collection('Members').document(user_slug)
            batch.update(user_ref, updates)
            count += 1
            updated_users += 1

        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
            print("... committing batch ...")

    if count > 0: batch.commit()
    print(f"\n✅ COMPLETE. Fixed FLEX casing for {updated_users} users.")

if __name__ == "__main__":
    run_import()