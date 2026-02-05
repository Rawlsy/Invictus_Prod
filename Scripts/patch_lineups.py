import firebase_admin
from firebase_admin import credentials, firestore

# 1. Initialize Firebase (Replace path with your key)
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- CONFIGURATION ---
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW" # Copy from URL: /league/xyz...

# 2. MAP: Define the correct Player IDs for the missing units
# You must look these IDs up in your 'players' collection first!
# Example format: "TEAM_ABBREV": "FIRESTORE_DOC_ID"
DEFENSE_IDS = {
    "BAL": "PLAYER_ID_FOR_RAVENS_DEF",
    "HOU": "PLAYER_ID_FOR_TEXANS_DEF",
    "SF":  "PLAYER_ID_FOR_49ERS_DEF",
    "GB":  "PLAYER_ID_FOR_PACKERS_DEF",
    "TB":  "PLAYER_ID_FOR_BUCS_DEF",
    "DET": "PLAYER_ID_FOR_LIONS_DEF",
    "KC":  "PLAYER_ID_FOR_CHIEFS_DEF",
    "BUF": "PLAYER_ID_FOR_BILLS_DEF"
}

# 3. FUNCTION: Patch a specific user's lineup
def patch_user_lineup(user_id, round_key, position, correct_player_id):
    user_ref = db.collection('leagues').document(LEAGUE_ID).collection('Members').document(user_id)
    
    # Update the specific field
    # Example field path: "Divisional Lineup.DEF"
    field_path = f"{round_key}.{position}"
    
    print(f"Patching {user_id} -> {field_path} = {correct_player_id}")
    
    user_ref.update({
        field_path: correct_player_id
    })

# --- MAIN EXECUTION ---
def run_audit_and_fix():
    print(f"Scanning League: {LEAGUE_ID}...")
    
    members_ref = db.collection('leagues').document(LEAGUE_ID).collection('Members')
    docs = members_ref.stream()

    for doc in docs:
        data = doc.to_dict()
        user_id = doc.id
        
        # Check Divisional Lineup
        div_lineup = data.get("Divisional Lineup", {})
        
        # CHECK DEFENSE
        if div_lineup.get("DEF") is None:
            print(f"⚠️  User {user_id} is missing DIVISIONAL DEFENSE")
            
            # LOGIC: You need to know which defense they picked.
            # If you have a CSV source, you can look it up here.
            # For now, this script just ALERTS you.
            
            # UNCOMMENT TO APPLY FIX (Example: Giving everyone Ravens)
            # patch_user_lineup(user_id, "Divisional Lineup", "DEF", DEFENSE_IDS["BAL"])

        # CHECK KICKER
        if div_lineup.get("K") is None:
            print(f"⚠️  User {user_id} is missing DIVISIONAL KICKER")

if __name__ == "__main__":
    run_audit_and_fix()