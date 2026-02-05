import firebase_admin
from firebase_admin import credentials, firestore
import csv
import re
import os

# --- CONFIGURATION ---
# Make sure your CSV is named this and in the same folder!
CSV_FILENAME = "kickers_fixed.csv"
LEAGUE_ID = "wtnd5Y0t5Tf4qFjc11DW"
# ---------------------

if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower().strip()).strip('-')

def run_import():
    if not os.path.exists(CSV_FILENAME):
        print(f"❌ ERROR: Could not find '{CSV_FILENAME}'.")
        print("   Please open Excel, go to 'Save As', and save your sheet as a CSV file in this folder.")
        return

    print(f"📂 Reading {CSV_FILENAME}...")

    with open(CSV_FILENAME, 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Skip header if it exists
    if "User" in rows[0][0]:
        rows = rows[1:]

    batch = db.batch()
    count = 0
    updated_users = 0

    print("🚀 Starting Update...")

    for row in rows:
        if not row or len(row) < 7: continue

        # PARSE COLUMNS BASED ON YOUR EXCEL LAYOUT
        # Col A [0] = User
        # Col B [1] = WC Name
        # Col C [2] = WC Trim
        # Col D [3] = WC ID  <-- TARGET
        # Col E [4] = Div Name
        # Col F [5] = Div Trim
        # Col G [6] = Div ID <-- TARGET

        user_name = row[0].strip()
        wc_id = row[3].strip()
        div_id = row[6].strip()

        if not user_name: continue

        # Prepare Update
        updates = {}
        
        # Only update if we have a valid ID (not empty, not "0", not #N/A)
        if wc_id and wc_id != "0" and "#" not in wc_id:
            updates["Wild Card Lineup.K"] = wc_id
            
        if div_id and div_id != "0" and "#" not in div_id:
            updates["Divisional Lineup.K"] = div_id

        if updates:
            user_slug = slugify(user_name)
            ref = db.collection('leagues').document(LEAGUE_ID).collection('Members').document(user_slug)
            
            batch.update(ref, updates)
            count += 1
            updated_users += 1
            print(f"   🔹 {user_name}: WC_ID={wc_id}, DIV_ID={div_id}")

        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
            print("... committing batch ...")

    if count > 0:
        batch.commit()

    print(f"\n✅ COMPLETE. Updated Kickers for {updated_users} users.")

if __name__ == "__main__":
    run_import()