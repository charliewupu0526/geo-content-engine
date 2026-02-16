
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def print_result(name, success, data=None):
    if success:
        print(f"✅ [PASS] {name}")
    else:
        print(f"❌ [FAIL] {name}: {data}")

def verify_flow():
    print("Starting GEO Content Engine Verification...\n")
    
    # 1. Test Discovery
    print("Testing Phase 1: Discovery...")
    try:
        # Mock payload
        res = requests.post(f"{BASE_URL}/intelligence/discover-competitors", json={
            "niche": "AI Project Management Tools"
        }, timeout=30)
        if res.status_code == 200:
            print_result("Discover Competitors", True)
        else:
            print_result("Discover Competitors", False, res.text)
    except Exception as e:
        print_result("Discover Competitors", False, str(e))

    # 2. Test Publishing (Mock Social)
    print("\nTesting Phase 5: Publishing...")
    try:
        res = requests.post(f"{BASE_URL}/publishing/publish", json={
            "project_id": "test_id",
            "platform": "twitter",
            "content_data": {
                "content": "Test tweet from automation!",
                "image_url": "http://example.com/test.jpg"
            }
        }, timeout=30)
        if res.status_code == 200:
            data = res.json()
            if data.get("success"):
                print_result("Publish to Twitter (Mock)", True)
            else:
                print_result("Publish to Twitter (Mock)", False, data)
        else:
            print_result("Publish to Twitter (Mock)", False, res.text)
    except Exception as e:
        print_result("Publish to Twitter (Mock)", False, str(e))

if __name__ == "__main__":
    verify_flow()
