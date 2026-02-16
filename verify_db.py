
import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Explicitly load the .env file
load_dotenv('.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase: {SUPABASE_URL}")
print(f"Key length: {len(SUPABASE_KEY) if SUPABASE_KEY else 0}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def test_db():
    print("\n--- Testing Projects Table ---")
    try:
        # Try to select
        res = supabase.table("projects").select("*").execute()
        print(f"Current Projects Count: {len(res.data)}")
        print(f"Projects Data: {res.data}")
        
        # Try to insert
        import uuid
        from datetime import datetime
        
        new_id = str(uuid.uuid4())
        print(f"\nAttempting to insert project {new_id}...")
        
        data = {
            "id": new_id,
            "name": f"Test Project {new_id[:4]}",
            "domain": "test.com",
            "status": "PROFILE_ENTRY",
            "created_at": datetime.utcnow().isoformat()
        }
        
        insert_res = supabase.table("projects").insert(data).execute()
        print(f"Insert Result Data: {insert_res.data}")
        
        # Verify insert
        res_after = supabase.table("projects").select("*").execute()
        print(f"Projects Count After Insert: {len(res_after.data)}")
        
    except Exception as e:
        print(f"OPERATION FAILED: {e}")
        if hasattr(e, 'message'):
            print(f"Error Message: {e.message}")
        if hasattr(e, 'code'):
            print(f"Error Code: {e.code}")
        if hasattr(e, 'details'):
            print(f"Error Details: {e.details}")

if __name__ == "__main__":
    asyncio.run(test_db())
