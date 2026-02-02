"""
Firecrawl Service - Web scraping and crawling functionality
"""

from firecrawl import Firecrawl
from typing import Optional, Dict, Any, List
from api.config import get_settings

class FirecrawlService:
    """Service wrapper for Firecrawl SDK"""
    
    def __init__(self):
        settings = get_settings()
        self.app = Firecrawl(api_key=settings.firecrawl_api_key)
    
    async def scrape_url(
        self, 
        url: str, 
        formats: List[str] = ["markdown", "html"]
    ) -> Dict[str, Any]:
        """
        Scrape a single URL and return content in specified formats
        """
        try:
            result = self.app.scrape(url, formats=formats)
            # Handle both object and dict responses
            if hasattr(result, 'markdown'):
                data = {
                    "markdown": result.markdown,
                    "html": getattr(result, 'html', None),
                    "metadata": result.metadata if hasattr(result, 'metadata') else {}
                }
            else:
                data = result
            return {
                "success": True,
                "url": url,
                "data": data
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e)
            }
    
    async def crawl_website(
        self, 
        url: str, 
        max_pages: int = 10,
        include_paths: Optional[List[str]] = None,
        exclude_paths: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Crawl an entire website starting from the given URL
        """
        try:
            result = self.app.crawl(
                url=url, 
                limit=max_pages,
                include_paths=include_paths,
                exclude_paths=exclude_paths
            )
            return {
                "success": True,
                "url": url,
                "pages_crawled": len(result.data) if hasattr(result, 'data') else 0,
                "data": result
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e)
            }
    
    async def map_urls(self, url: str) -> Dict[str, Any]:
        """
        Get a sitemap of all URLs on a website
        """
        try:
            result = self.app.map(url=url)
            links = result.links if hasattr(result, 'links') else result.get('links', [])
            return {
                "success": True,
                "url": url,
                "urls": links,
                "total": len(links)
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e)
            }
    
    async def extract_structured(
        self, 
        url: str, 
        schema: Dict[str, Any],
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract structured data from a URL using AI
        Note: This uses scrape with LLM extraction built into Firecrawl
        """
        try:
            # Firecrawl extract is a separate method, not a param to scrape
            # Fall back to using the OpenAI service for structured extraction
            # For now, just scrape and return - let the router handle AI extraction
            result = self.app.scrape(url, formats=["markdown"])
            
            if hasattr(result, 'markdown'):
                data = {"markdown": result.markdown}
            else:
                data = result
                
            return {
                "success": True,
                "url": url,
                "data": data,
                "note": "Raw content returned - use AI service for structured extraction"
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e)
            }


# Singleton instance
_firecrawl_service: Optional[FirecrawlService] = None

def get_firecrawl_service() -> FirecrawlService:
    """Get or create Firecrawl service instance"""
    global _firecrawl_service
    if _firecrawl_service is None:
        _firecrawl_service = FirecrawlService()
    return _firecrawl_service
