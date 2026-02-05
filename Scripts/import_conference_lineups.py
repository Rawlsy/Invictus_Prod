import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import re
import os

# --- CONFIGURATION ---
CSV_FILENAME = "Fantasy Football 2026 - Conference Championship - Prelim Results V2.xlsx - Scoring.csv"
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW"

# Row mappings based on your file structure
ROUNDS = {
    "Wild Card Lineup":  {"start_row": 1},
    "Divisional Lineup": {"start_row": 13},
    "Conference Lineup": {"start_row": 25}
}

# The order of positions in the block (0 to 8)
POS_MAP_OFFSET = {
    0: "QB",
    1: "RB1",
    2: "RB2",
    3: "WR1",
    4: "WR2",
    5: "Flex",  # <--- This checks rows 6, 18, and 30
    6: "TE",
    7: "DEF",
    8: "K"
}

# TEAM MAPPER (For Defenses)
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
    text = text.split('(')[0] # Remove (Team)
    return re.sub(r"['’\.]", "", text).strip().lower()

def build_player_map():
    print("⏳ Loading Player Database...")
    name_map = {} 
    
    players_ref = db.collection('players')
    docs = players_ref.stream()

    for doc in docs:
        p = doc.to_dict()
        pid = doc.id
        
        # Map Clean Names
        if p.get('name'): name_map[clean_string(p['name'])] = pid
        if p.get('longName'): name_map[clean_string(p['longName'])] = pid
        
        # Map Teams (for Defense lookup)
        if p.get('position') == 'DEF' and p.get('team'):
            name_map[p['team'].lower()] = pid

    print(f"✅ Loaded {len(name_map)} players.")
    return name_map

def get_or_create_player(raw_name, player_map, pos_hint="FLEX"):
    """
    If player exists, return ID.
    If not, CREATE them and return new ID.
    """
    clean = clean_string(raw_name)
    
    # 1. Try finding in map
    if clean in player_map:
        return player_map[clean]
    
    # 2. Try Team Map (for Defenses)
    if pos_hint == "DEF":
        team_abbr = TEAM_MAP.get(clean)
        if team_abbr and team_abbr.lower() in player_map:
            return player_map[team_abbr.lower()]

    # 3. CREATE MISSING PLAYER
    new_id = slugify(raw_name.split('(')[0]) # e.g. "woody-marks"
    
    # Double check we didn't just create him in this run
    if new_id in player_map.values():
        return new_id

    print(f"   ✨ Auto-Creating Missing Player: {raw_name} -> {new_id}")
    
    db.collection('players').document(new_id).set({
        "name": raw_name.split('(')[0].strip(),
        "position": pos_hint, # We don't know real pos, so use hint
        "team": "FA",        # Unknown team
        "auto_created": True
    }, merge=True)
    
    # Add to map so we don't create him twice
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

    print("🚀 Starting Full Import (with Auto-Create)...")

    num_cols = len(df.columns)
    
    # Iterate Users (Cols 1, 3, 5...)
    for col_idx in range(1, num_cols, 2):
        user_name = df.iloc[0, col_idx]
        
        if pd.isna(user_name) or str(user_name).strip() == "":
            continue

        user_name = str(user_name).strip()
        updates = {}
        
        # Process Wild Card, Divisional, Conference
        for round_name, bounds in ROUNDS.items():
            start = bounds['start_row']
            lineup_data = {}
            
            for offset in range(9):
                row_idx = start + offset
                pos_key = POS_MAP_OFFSET[offset]
                
                if row_idx >= len(df): continue
                
                raw_player = df.iloc[row_idx, col_idx]
                
                if pd.isna(raw_player) or str(raw_player) == "nan" or "No Player" in str(raw_player):
                    continue
                
                # GET OR CREATE
                pid = get_or_create_player(str(raw_player), player_map, pos_hint=pos_key)
                
                if pid:
                    lineup_data[pos_key] = pid

            if lineup_data:
                updates[round_name] = lineup_data

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

    if count > 0:
        batch.commit()

    print(f"\n✅ COMPLETE. Updated {updated_users} users.")

if __name__ == "__main__":
    run_import()