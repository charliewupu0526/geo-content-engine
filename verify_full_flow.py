
import asyncio
import os
import uuid
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Explicitly load the .env file
load_dotenv('.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase: {SUPABASE_URL}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def verify_full_flow():
    print("\n--- 1. Creating Test Project ---")
    project_id = str(uuid.uuid4())
    project_name = f"VERIFICATION-{project_id[:4]}"
    
    try:
        data = {
            "id": project_id,
            "name": project_name,
            "domain": "verification.com",
            "status": "PROFILE_ENTRY",
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("projects").insert(data).execute()
        print(f"✅ Project Created: {project_id} - {project_name}")
        
    except Exception as e:
        print(f"❌ Project Creation Failed: {e}")
        return

    print("\n--- 2. Creating Test Task for Project ---")
    task_id = str(uuid.uuid4())
    task_title = f"Test Task {task_id[:4]}"
    
    try:
        task_data = {
            "id": task_id,
            "project_id": project_id,
            "batch_id": "BATCH-TEST",
            "title": task_title,
            "branch": "Article",
            "status": "Pending",
            "created_at": datetime.utcnow().isoformat(),
            "meta_data": {
                "type": "Article",
                "profile": {"name": "Test Profile"}
            }
        }
        
        supabase.table("tasks").insert(task_data).execute()
        print(f"✅ Task Created: {task_id} - {task_title}")
        
    except Exception as e:
        print(f"❌ Task Creation Failed: {e}")
        if "meta_data" in str(e):
             print("⚠️ HINT: 'meta_data' column might be missing in 'tasks' table.")

    print("\n--- 3. Verifying Read ---")
    
    # Read Project
    res_p = supabase.table("projects").select("*").eq("id", project_id).execute()
    if res_p.data:
        print(f"🔍 Project Found: {res_p.data[0]['name']}")
    else:
        print("❌ Project NOT Found (RLS Issue?)")
        
    # Read Task
    res_t = supabase.table("tasks").select("*").eq("id", task_id).execute()
    if res_t.data:
        print(f"🔍 Task Found: {res_t.data[0]['title']}")
    else:
        print("❌ Task NOT Found (RLS Issue?)")

if __name__ == "__main__":
    asyncio.run(verify_full_flow())
