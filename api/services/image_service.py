"""
Image Service - DALL-E Image Generation
"""

from typing import Optional
from api.services.gemini_service import get_gemini_service
from api.prompts import get_image_generation_prompt

class ImageService:
    def __init__(self):
        self.ai = get_gemini_service()

    async def generate_image(self, title: str, style: str = "tech") -> Optional[str]:
        """
        Generate an image using DALL-E 3
        """
        prompt = get_image_generation_prompt(title, style)
        print(f"Generating image with prompt: {prompt[:100]}...")
        
        try:
            response = self.ai.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            
            image_url = response.data[0].url
            return image_url
            
        except Exception as e:
            print(f"Image Generation Failed: {e}")
            # Mock URL for fallback or development (if no quota)
            # return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485" 
            return None

# Singleton
_image_service = None

def get_image_service():
    global _image_service
    if _image_service is None:
        _image_service = ImageService()
    return _image_service
