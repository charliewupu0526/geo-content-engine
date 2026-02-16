"""
Configuration management for the backend
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env.local if present, otherwise .env
if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local", override=True)
else:
    load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Firecrawl
    firecrawl_api_key: str = os.getenv("FIRECRAWL_API_KEY", "")
    
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    
    # Perplexity API
    perplexity_api_key: str = os.getenv("PERPLEXITY_API_KEY", "")
    
    # SerpApi (for SEO rankings)
    serpapi_key: str = os.getenv("SERPAPI_KEY", "")
    
    # App settings
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
