"""
Search Service - Intelligent Discovery & Competitor Mining
Uses a 3-step pipeline:
  1. Candidate Discovery via Perplexity
  2. AI Citation Validation (multi-query testing)
  3. Score & Filter (keep 50%+ citation rate)
"""

from typing import List, Dict, Any, Optional
import json
import asyncio
from api.services.gemini_service import get_gemini_service
from api.services.perplexity_service import get_perplexity_service
from api.prompts import get_discovery_prompt, get_hidden_competitor_prompt, SYSTEM_DISCOVERY

class SearchService:
    """Service to discover competitors using real search (Perplexity) + AI citation validation"""
    
    def __init__(self):
        self.ai = get_gemini_service()
        self.perplexity = get_perplexity_service()

    async def discover_competitors(self, niche: str, user_brand_info: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """
        3-step pipeline to find high-quality, AI-validated competitors.
        
        Step 1: Candidate Discovery — get 10-15 candidates via Perplexity
        Step 2: AI Citation Validation — test candidates (AND User Brand) across multiple queries
        Step 3: Score & Filter — keep only those with high citation rates
        """
        print(f"[SearchService] === Starting 3-step competitor discovery for '{niche}' ===")
        
        # === Step 1: Candidate Discovery ===
        print(f"[SearchService] Step 1: Discovering candidates...")
        candidates = await self._discover_candidates(niche)
        if not candidates:
            print(f"[SearchService] Step 1 failed, trying AI fallback")
            candidates = await self._discover_via_ai(niche)
        
        if not candidates and not user_brand_info:
            print(f"[SearchService] No candidates found at all")
            return []

        # Add User Brand to candidates list for validation (marked as 'is_user')
        if user_brand_info:
            print(f"[SearchService] Adding user brand to validation: {user_brand_info}")
            user_candidate = {
                "name": user_brand_info.get("name", "My Brand"),
                "url": user_brand_info.get("domain", ""),
                "is_user_brand": True,
                "score": 0,
                "strengths": "Your Brand",
                "products": "Your Products"
            }
            candidates.insert(0, user_candidate)
        
        candidate_names = [c.get("name", "") for c in candidates]
        print(f"[SearchService] Step 1 found {len(candidates)} candidates: {candidate_names}")
        
        # === Step 2: AI Citation Validation ===
        # This now includes the user brand!
        print(f"[SearchService] Step 2: Validating via AI citation testing...")
        validated = await self._validate_via_citations(niche, candidates)
        print(f"[SearchService] Step 2 validated {len(validated)} competitors")
        
        # === Step 3: Score & Filter ===
        print(f"[SearchService] Step 3: Scoring and filtering...")
        
        # Separate user brand from competitors for filtering
        user_result = None
        competitor_results = []
        
        for c in validated:
            if c.get("is_user_brand"):
                user_result = c
            else:
                competitor_results.append(c)

        # Sort competitors by citation score (highest first)
        competitor_results.sort(key=lambda x: x.get("ai_citation_score", 0), reverse=True)
        
        # Keep top 5-8 with score >= 30% (Lowered threshold to avoid empty results)
        filtered = [c for c in competitor_results if c.get("ai_citation_score", 0) >= 30]
        
        # If too few pass the threshold, relax and take top 5 anyway
        if len(filtered) < 3 and len(competitor_results) >= 3:
            print(f"[SearchService] Only {len(filtered)} passed 30% threshold, taking top 5 by score")
            filtered = competitor_results[:5]
        else:
             filtered = filtered[:8]
             
        # Re-attach user brand at the top (if exists)
        final_results = []
        if user_result:
             final_results.append(user_result)
             
        final_results.extend(filtered)
        
        print(f"[SearchService] === Pipeline complete: returning {len(final_results)} items ===")
        for c in final_results:
            is_user = "(USER)" if c.get("is_user_brand") else ""
            print(f"  - {c.get('name')} {is_user}: score={c.get('ai_citation_score')}%, citations={c.get('ai_citation_count')}")
        
        return final_results

    async def _discover_candidates(self, niche: str) -> List[Dict[str, Any]]:
        """Step 1: Use Perplexity to find 10-15 candidate competitors"""
        import httpx
        
        if not self.perplexity.api_key:
            print("[SearchService] No Perplexity API key, skipping real search")
            return []
        
        query = (
            f"目标: 寻找 '{niche}' 的竞争对手。\n"
            f"逻辑判断:\n"
            f"1. 如果 '{niche}' 是一个具体品牌 (如 Apple, Nike, Salesforce)，请列出其直接竞争对手 (如 Samsung, Adidas, HubSpot)。\n"
            f"2. 如果 '{niche}' 是一个行业/品类 (如 CRM, 跑鞋, 智能手机)，请列出该领域的市场领导者。\n"
            f"重要: 请列出 10-15 个最相关的竞争品牌/公司。\n"
            f"每个品牌必须包括: 名称、官方网站URL、核心产品/服务、竞争优势。\n"
            f"只列出真实存在的、在该领域有显著市场份额和影响力的品牌。"
        )
        
        headers = {
            "Authorization": f"Bearer {self.perplexity.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.perplexity.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是一位顶级市场竞争情报分析师。你的任务是找出真正的核心竞争对手——"
                        "那些在同一市场直接竞争的品牌。\n"
                        "关键原则:\n"
                        "- 如果输入是品牌，找其同品类直接对手（如 Apple -> Samsung, Huawei, Google Pixel）\n"
                        "- 如果输入是行业，找该行业的 Top 玩家\n"
                        "- 必须是真实品牌，提供准确的官方网站 URL\n"
                        "- 宁可多列几个让后续步骤筛选，也不要漏掉重要竞品"
                    )
                },
                {"role": "user", "content": query}
            ],
            "return_citations": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.post(
                    f"{self.perplexity.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"[SearchService] Perplexity API error: {response.status_code}")
                    return []
                
                data = response.json()
                answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                citations = data.get("citations", [])
                
                if not answer:
                    return []
                
                print(f"[SearchService] Perplexity returned {len(answer)} chars, {len(citations)} citations")
                
                # Parse with AI
                parse_prompt = (
                    f"以下是关于「{niche}」竞品的搜索结果，请从中提取结构化的竞品信息。\n\n"
                    f"搜索结果:\n{answer}\n\n"
                    f"引用来源: {json.dumps(citations, ensure_ascii=False)}\n\n"
                    f"请返回 JSON 格式:\n"
                    f'{{"competitors": [\n'
                    f'  {{"name": "品牌名", "url": "官方网站URL", "score": 85, '
                    f'"strengths": "核心优势描述", "products": "主要产品/服务"}}\n'
                    f']}}\n\n'
                    f"注意:\n"
                    f"- 尽可能多地提取 (10-15 个)\n"
                    f"- url 必须是真实可访问的官方网站链接\n"
                    f"- score 暂时设为 0，后续会通过 AI 引用验证重新计算"
                )
                
                ai_response = await self.ai.client.chat.completions.create(
                    model=self.ai.model,
                    messages=[
                        {"role": "system", "content": "你是数据解析专家，只返回有效的 JSON。"},
                        {"role": "user", "content": parse_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                parsed = json.loads(ai_response.choices[0].message.content)
                competitors = parsed.get("competitors", [])
                
                for comp in competitors:
                    comp["data_source"] = "perplexity_search"
                    comp["citations"] = citations
                
                return competitors
        except Exception as e:
            print(f"[SearchService] Candidate discovery failed: {e}")
            return []

    async def _validate_via_citations(self, niche: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Step 2: Validate candidates by running multiple AI queries and checking
        how often each candidate appears in citations.
        """
        # Build niche-specific test queries
        test_queries = [
            f"What are the best {niche} brands/products in 2025?",
            f"Top {niche} competitors comparison and market share analysis",
            f"Which {niche} companies are the market leaders for enterprises?",
            f"Expert recommendations: best {niche} alternatives",
            f"{niche} industry analysis: key players and trends 2025",
        ]
        
        # Extract candidate domains for matching
        candidate_domains = {}
        for c in candidates:
            name = c.get("name", "").lower()
            url = c.get("url", "")
            domain = self.perplexity._extract_domain(url) if url else ""
            candidate_domains[name] = {
                "candidate": c,
                "domain": domain,
                "mention_count": 0,
                "citation_count": 0
            }
        
        # Run all queries in parallel
        print(f"[SearchService] Running {len(test_queries)} validation queries...")
        
        tasks = [self.perplexity.test_citation(q) for q in test_queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_queries = len(test_queries)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"[SearchService] Query {i+1} failed: {result}")
                total_queries -= 1
                continue
            
            answer = result.get("answer", "").lower()
            cited_urls = [c.get("url", "") if isinstance(c, dict) else c for c in result.get("citations", [])]
            cited_domains = set()
            for url in cited_urls:
                if isinstance(url, str):
                    d = self.perplexity._extract_domain(url)
                    if d:
                        cited_domains.add(d.lower())
            
            # Check each candidate
            for name_lower, info in candidate_domains.items():
                # Check if brand name is mentioned in the answer text
                if name_lower in answer:
                    info["mention_count"] += 1
                
                # Check if domain appears in citations
                comp_domain = info["domain"].lower()
                if comp_domain and any(comp_domain in d for d in cited_domains):
                    info["citation_count"] += 1
        
        if total_queries == 0:
            print("[SearchService] All validation queries failed, returning candidates as-is")
            return candidates
        
        # Calculate scores and attach to candidates
        validated = []
        for name_lower, info in candidate_domains.items():
            c = info["candidate"].copy()
            
            # Combined score: mentions carry more weight than exact domain citations
            # because AI often mentions brands by name without linking
            mention_rate = (info["mention_count"] / total_queries) * 100
            citation_rate = (info["citation_count"] / total_queries) * 100
            
            # Weighted: 70% mention rate + 30% citation rate
            combined_score = int(mention_rate * 0.7 + citation_rate * 0.3)
            
            c["ai_citation_score"] = combined_score
            c["ai_citation_count"] = info["mention_count"] + info["citation_count"]
            c["ai_mention_rate"] = int(mention_rate)
            c["ai_citation_rate"] = int(citation_rate)
            c["score"] = combined_score  # Override placeholder score
            c["validation_queries"] = total_queries
            c["data_source"] = "ai_citation_validated"
            
            validated.append(c)
            print(f"  [{c.get('name')}] mentions={info['mention_count']}/{total_queries}, "
                  f"citations={info['citation_count']}/{total_queries}, score={combined_score}%")
        
        return validated

    async def _discover_via_ai(self, niche: str) -> List[Dict[str, Any]]:
        """Fallback: use pure AI to generate competitor list (less reliable)"""
        prompt = get_discovery_prompt(niche)
        
        try:
            response = await self.ai.client.chat.completions.create(
                model=self.ai.model,
                messages=[
                    {"role": "system", "content": SYSTEM_DISCOVERY},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            
            raw_list = data.get("competitors", data.get("products", []))
            if not raw_list and isinstance(data, list):
                raw_list = data
            elif not raw_list:
                for v in data.values():
                    if isinstance(v, list):
                        raw_list = v
                        break
            
            for comp in (raw_list or []):
                if isinstance(comp, dict):
                    comp["data_source"] = "ai_generated"
            
            return raw_list or []
            
        except Exception as e:
            print(f"[SearchService] AI fallback also failed: {e}")
            return []

    async def find_hidden_competitors(self, company_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify hidden competitors based on company profile"""
        profile_summary = json.dumps(company_profile, ensure_ascii=False)[:2000]
        prompt = get_hidden_competitor_prompt(profile_summary)
        
        try:
            response = await self.ai.client.chat.completions.create(
                model=self.ai.model,
                messages=[
                    {"role": "system", "content": SYSTEM_DISCOVERY},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            
            hidden_list = data.get("hidden_competitors", [])
            if not hidden_list:
                 for v in data.values():
                    if isinstance(v, list):
                        hidden_list = v
                        break
            
            return hidden_list or []
            
        except Exception as e:
            print(f"Error in find_hidden_competitors: {e}")
            return []

# Singleton instance
_search_service: Optional[SearchService] = None

def get_search_service() -> SearchService:
    """Get or create Search service instance"""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
