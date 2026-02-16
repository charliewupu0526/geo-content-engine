"""
Publishing Service - Multi-mode publishing (WordPress, Social, Export)
"""

import base64
import httpx
from typing import Optional, Dict, Any, List

class PublishingService:
    def __init__(self):
        # In a real app, these should come from DB/User settings
        # For MVP, we use env vars or passed credentials
        pass

    async def publish_to_wordpress(self, 
                                   wp_url: str, 
                                   username: str, 
                                   app_password: str, 
                                   title: str, 
                                   content: str, 
                                   status: str = "draft",
                                   featured_media_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Publish post to WordPress via REST API
        """
        if not wp_url.endswith("/"):
            wp_url += "/"
        
        endpoint = f"{wp_url}wp-json/wp/v2/posts"
        
        # Basic Auth
        credentials = f"{username}:{app_password}"
        token = base64.b64encode(credentials.encode()).decode()
        headers = {
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "title": title,
            "content": content,
            "status": status, 
        }
        
        if featured_media_id:
            payload["featured_media"] = featured_media_id

        async with httpx.AsyncClient() as client:
            try:
                # 1. Check if we have an image to upload first? 
                # (Skipped for MVP, assuming text only or external image handling separately)
                
                response = await client.post(endpoint, json=payload, headers=headers, timeout=30.0)
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except Exception as e:
                print(f"WordPress Publish Error: {e}")
                return {"success": False, "error": str(e)}

    async def upload_media_to_wordpress(self,
                                      wp_url: str,
                                      username: str,
                                      app_password: str,
                                      image_url: str) -> Optional[int]:
        """
        Upload an image from a URL to WordPress Media Library
        Returns media ID
        """
        # This is a bit complex as we need to download image first then upload
        # For MVP, we might skip this or implement if time permits
        return None

    async def simulate_social_publish(self, platform: str, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Simulate publishing to Social Media (Twitter/LinkedIn)
        """
        # Mock delay
        import asyncio
        await asyncio.sleep(1.5)
        
        return {
            "success": True,
            "platform": platform,
            "status": "scheduled",
            "preview_url": f"https://{platform}.com/status/mock-id-123",
            "message": "Content successfully queued for publishing"
        }

# Singleton
_publishing_service = None

def get_publishing_service():
    global _publishing_service
    if _publishing_service is None:
        _publishing_service = PublishingService()
    return _publishing_service
