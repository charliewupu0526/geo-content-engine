"""
Analysis Service - Deep Gap Analysis Logic
"""

from typing import Dict, Any, List, Optional
import json
from api.services.supabase_service import get_supabase_service
from api.services.gemini_service import get_gemini_service
from api.prompts import get_deep_gap_analysis_prompt, SYSTEM_DEEP_ANALYSIS

class AnalysisService:
    def __init__(self):
        self.db = get_supabase_service()
        self.ai = get_gemini_service()

    async def perform_deep_gap_analysis(self, project_id: str) -> Dict[str, Any]:
        """
        Perform deep gap analysis using the Knowledge Base (DB)
        """
        # 1. Fetch Project & Crawl Results from DB
        # Note: In a real implementation, we would fetch the project profile too.
        # For now, we assume the profile is passed in or we fetch it.
        # Let's fetch project details first.
        project = await self.db.get_project(project_id)
        if not project:
            return {"error": "Project not found"}
        
        company_profile = project.get("company_profile", {})
        
        # 2. Fetch Crawl Results
        crawl_results = await self.db.get_crawl_results(project_id)
        
        if not crawl_results:
            return {
                "error": "No crawl data found. Please run 'Full Information Collection' first.",
                "status": "no_data"
            }

        # 3. Aggregate Content (Simple strategy: Concat summaries or first N chars)
        # In a production system, we would use RAG or vector search here.
        # For this MVP, we'll take snippets from top pages.
        aggregated_content = ""
        page_count = len(crawl_results)
        total_chars = 0
        
        for item in crawl_results[:20]: # Limit to top 20 pages
            content_snippet = item.get("content", "")[:1000] # Take first 1000 chars
            url = item.get("url", "Unknown URL")
            aggregated_content += f"Source: {url}\nContent: {content_snippet}\n---\n"
            total_chars += len(item.get("content", ""))

        kb_stats = {
            "page_count": page_count,
            "total_size_mb": round(total_chars / 1024 / 1024, 2)
        }
        
        # 4. Call AI for Deep Analysis
        prompt = get_deep_gap_analysis_prompt(company_profile, aggregated_content, kb_stats)
        
        try:
            response = await self.ai.client.chat.completions.create(
                model=self.ai.model,
                messages=[
                    {"role": "system", "content": SYSTEM_DEEP_ANALYSIS},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            analysis_result = json.loads(response.choices[0].message.content)
            
            # Add metadata
            analysis_result["meta"] = {
                "kb_stats": kb_stats,
                "analyzed_at": str(__import__('datetime').datetime.now())
            }
            
            # 5. Save Report to DB (Optional but good practice)
            # await self.db.save_gap_report(project_id, analysis_result)
            
            return analysis_result
            
        except Exception as e:
            print(f"Deep Analysis Failed: {e}")
            return {"error": str(e)}

# Singleton
_analysis_service = None

def get_analysis_service():
    global _analysis_service
    if _analysis_service is None:
        _analysis_service = AnalysisService()
    return _analysis_service
