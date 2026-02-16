import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def verify_schema():
    print("Verifying database schema...")
    
    # 1. Check projects table for user_id
    try:
        # We can't easily checking schema definition via client, so we try to select user_id from projects
        # If it doesn't exist, it might error or return nothing useful if table is empty.
        # But a better way is to try to insert a dummy record with user_id or select with user_id.
        # For now, let's just inspect a record if one exists, or try to select empty with that column.
        
        print("Checking 'projects' table for 'user_id' column...")
        response = supabase.table("projects").select("user_id").limit(1).execute()
        print("✅ 'projects' table has 'user_id' column (query successful).")
    except Exception as e:
        print(f"❌ Error checking 'projects' table: {e}")
        print("It seems 'user_id' column might be missing.")

    # 2. Check analysis_reports table
    try:
        print("Checking 'analysis_reports' table...")
        supabase.table("analysis_reports").select("id").limit(1).execute()
        print("✅ 'analysis_reports' table exists.")
    except Exception as e:
        print(f"❌ Error checking 'analysis_reports' table: {e}")

    # 3. Check generated_keywords table
    try:
        print("Checking 'generated_keywords' table...")
        supabase.table("generated_keywords").select("id").limit(1).execute()
        print("✅ 'generated_keywords' table exists.")
    except Exception as e:
        print(f"❌ Error checking 'generated_keywords' table: {e}")

if __name__ == "__main__":
    asyncio.run(verify_schema())
