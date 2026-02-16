
import asyncio
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

# Explicitly load the .env file
load_dotenv('.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase: {SUPABASE_URL}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: credentials missing")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def diagnose():
    print("\n========== DIAGNOSING DATABASE ==========")
    
    # 1. Check Projects
    print("\n--- Checking 'projects' table ---")
    try:
        res = supabase.table("projects").select("*", count="exact").execute()
        print(f"✅ 'projects' Access: OK")
        print(f"📊 Row Count: {len(res.data)}")
        if len(res.data) > 0:
            print(f"📝 First Row Sample: {json.dumps(res.data[0], indent=2)}")
        else:
            print("⚠️ Table is empty.")
    except Exception as e:
        print(f"❌ 'projects' Access FAILED: {e}")

    # 2. Check Tasks (Schema Check)
    print("\n--- Checking 'tasks' table ---")
    try:
        # Try to insert a dummy task to check schema compliance
        import uuid
        dummy_task = {
             "id": str(uuid.uuid4()),
             "project_id": None, # Will fail foreign key if checking, but we want to check column existence first
             "title": "Schema Check",
             "status": "Pending", # Checking this column
             "meta_data": {}      # Checking this column
        }
        # We don't verify execution success, we look for "Column not found" errors
        # To avoid FK error, we need a valid project ID if passing project_id
        # Let's try select first
        res = supabase.table("tasks").select("*", count="exact").execute()
        print(f"✅ 'tasks' Access: OK")
        print(f"📊 Row Count: {len(res.data)}")
        
    except Exception as e:
        print(f"❌ 'tasks' Access FAILED: {e}")
        if "schema cache" in str(e) or "column" in str(e):
            print("🚨 DIAGNOSIS: Schema Mismatch! The table columns do not match the code.")

    # 3. Check Crawl Results
    print("\n--- Checking 'crawl_results' table ---")
    try:
        res = supabase.table("crawl_results").select("*", count="exact").execute()
        print(f"✅ 'crawl_results' Access: OK")
        print(f"📊 Row Count: {len(res.data)}")
    except Exception as e:
        print(f"❌ 'crawl_results' Access FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose())
