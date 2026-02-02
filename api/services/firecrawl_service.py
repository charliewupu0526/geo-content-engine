"""
Firecrawl Service - Web scraping and crawling functionality
"""

from firecrawl import FirecrawlApp
from typing import Optional, Dict, Any, List
from api.config import get_settings

class FirecrawlService:
    """Service wrapper for Firecrawl SDK"""
    
    def __init__(self):
        settings = get_settings()
        self.app = FirecrawlApp(api_key=settings.firecrawl_api_key)
    
    async def scrape_url(
        self, 
        url: str, 
        formats: List[str] = ["markdown", "html"]
    ) -> Dict[str, Any]:
        """
        Scrape a single URL and return content in specified formats
        
        Args:
            url: The URL to scrape
            formats: Output formats (markdown, html, screenshot, etc.)
        
        Returns:
            Scraped content with metadata
        """
        try:
            # Firecrawl SDK uses scrape() not scrape_url()
            result = self.app.scrape(url, formats=formats)
            return {
                "success": True,
                "url": url,
                "data": result
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
        
        Args:
            url: Starting URL
            max_pages: Maximum pages to crawl
            include_paths: URL paths to include
            exclude_paths: URL paths to exclude
        
        Returns:
            Crawled pages data
        """
        try:
            # Firecrawl SDK uses crawl() not crawl_url()
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
        
        Args:
            url: Website URL to map
        
        Returns:
            List of discovered URLs
        """
        try:
            # Firecrawl SDK uses map() not map_url()
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
        
        Args:
            url: URL to extract from
            schema: JSON schema defining the data structure
            prompt: Optional prompt to guide extraction
        
        Returns:
            Extracted structured data
        """
        try:
            # Use scrape with extract format
            result = self.app.scrape(
                url, 
                formats=["extract"],
                extract={
                    "schema": schema,
                    "prompt": prompt
                } if prompt else {"schema": schema}
            )
            extract_data = result.extract if hasattr(result, 'extract') else result.get('extract', {})
            return {
                "success": True,
                "url": url,
                "data": extract_data
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
