from urllib.parse import urlparse

def test_url(url):
    print(f"Testing: '{url}'")
    if not url:
        print("❌ URL is required")
        return

    cleaned_url = url.strip()
    if not cleaned_url.startswith(('http://', 'https://')):
        cleaned_url = 'https://' + cleaned_url
    
    print(f"  -> Normalized: '{cleaned_url}'")
    
    try:
        parsed = urlparse(cleaned_url)
        if not parsed.netloc or '.' not in parsed.netloc:
             print("  ❌ Invalid domain check failed")
        else:
             print(f"  ✅ Valid. Netloc: {parsed.netloc}")
    except Exception as e:
        print(f"  ❌ Exception: {e}")

test_url("google.com")
test_url(" https://www.example.com ")
test_url("invalid-url")
test_url("http://localhost:8000")
