import asyncio
import os
import sys
import json
from dotenv import load_dotenv

# Add project root to path to import app modules
sys.path.append(os.getcwd())

from api.services.supabase_service import SupabaseService
from api.routers.intelligence import AnalyzeCompetitorRequest

# Mock data
MOCK_PROFILE = {
    "company_name": "Test Company",
    "domain": "testcompany.com",
    "description": "A test company for verification."
}

MOCK_COMPETITORS = ["https://example.com"]

async def verify_flow():
    load_dotenv('.env.local')
    
    # 1. Initialize Service
    supabase = SupabaseService()
    print("✅ Supabase Service Initialized")

    # 2. Create a Test Project
    # We need a user_id. Let's try to get one or use a dummy if constraint allows (users table might enforce existance)
    # Since we can't easily login via script, we might need to pick an existing user or just create a project without user_id if allowed?
    # But we added user_id column.
    # Let's try to list projects and pick a real user_id if possible, or just None.
    
    projects = await supabase.get_projects()
    user_id = projects[0]['user_id'] if projects and 'user_id' in projects[0] else None
    print(f"ℹ️ Using User ID: {user_id}")
    
    try:
        project = await supabase.create_project(
            name="Verification Project " + str(asyncio.get_event_loop().time()),
            domain="test.com",
            company_profile=MOCK_PROFILE,
            user_id=user_id
        )
        project_id = project['id']
        print(f"✅ Project Created: {project_id}")
    except Exception as e:
        print(f"❌ Failed to create project: {e}")
        return

    # 3. Simulate Gap Analysis Saving (Directly calling Service or API logic)
    # Since calling API requires running server, let's call the SERVICE logic that API uses.
    # In `intelligence.py`, we call `supabase.save_analysis_report`.
    
    mock_report = {
        "summary": "This is a test report for verification.",
        "gap_analysis": {"score": 85},
        "meta": {"timestamp": "now"}
    }
    
    try:
        print("ℹ️ Saving Analysis Report...")
        await supabase.save_analysis_report(project_id, "gap_analysis", mock_report)
        print("✅ Report Saved.")
    except Exception as e:
        print(f"❌ Failed to save report: {e}")
        return

    # 4. Retrieve Report (Simulate App.tsx behavior)
    try:
        print("ℹ️ Retrieving Reports...")
        reports = await supabase.get_analysis_reports(project_id)
        if reports and len(reports) > 0:
            print(f"✅ Retrieved {len(reports)} reports.")
            print(f"   First report summary: {reports[0].get('data', {}).get('summary')}")
            
            if reports[0].get('data', {}).get('summary') == mock_report['summary']:
                print("🎉 VERIFICATION SUCCESS: Data persisted and retrieved correctly!")
            else:
                print("❌ Content mismatch.")
        else:
            print("❌ No reports found.")
    except Exception as e:
        print(f"❌ Failed to retrieve report: {e}")

    # Cleanup (Optional)
    # await supabase.delete_project(project_id)

if __name__ == "__main__":
    asyncio.run(verify_flow())
