"""
Centralized AI Prompts Management
This file allows for easy modification and versioning of AI prompts.
"""

from typing import Optional, Dict, Any, List
import json

# ==========================================
# KEYWORD GENERATION PROMPTS
# ==========================================

SYSTEM_KEYWORD_GENERATION = (
    "你是一位精通消费者心理学和 SEO 的电商搜索策略专家。"
    "你的核心能力是精准捕捉用户在**购买决策过程**（Buying Journey）中会使用的具体搜索词。"
    "你深知**长尾理论**（Long Tail Theory）：虽然核心词流量大，但竞争激烈且转化率低；"
    "长尾词虽然流量少，但意图精准，转化率极高，是中小企业/新品牌的致胜关键。"
    "你的任务是为客户挖掘那些**具有强烈交易意图**且**竞争适度**的关键词。"
)

def get_keyword_generation_prompt(profile: Dict[str, Any]) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False)[:3000]
    return f"""
    基于以下企业/产品画像，挖掘 8-12 个具有**高商业价值**的 GEO 关键词。
    
    企业画像：
    {profile_json}
    
    请严格遵循以下**选词逻辑**：
    
    ### 1. 核心关键词 (Core Keywords) - 占比 20%
    - 定义：概括产品/服务的核心词（如“婚纱摄影”）。
    - 策略：选择**相关性极高**的词。拒绝“手机”这种大词（如果只卖手机壳），因为流量虽大但不精准。
    
    ### 2. 长尾关键词 (Long-tail Keywords) - 占比 80% (重点)
    - 定义：核心词的拓展，针对精准人群（如“深圳婚纱摄影哪家好”）。
    - 策略：
        - **模拟用户思维**：站在小白用户角度提问，不要用行业术语。
        - **规避巨头竞争**：不要盲目模仿行业老大（他们权重高能做大词），不仅要模仿，更要差异化。
        - **寻找有效流量**：确保词与业务高度强相关。不要为了流量做不相关的词（有流量无转化）。
        - **多维度切入**：打破定向思维，从价格、场景、人群、痛点、对比等维度发散。
    
    ### 3. 具体场景示例
    - **错误**：卖“蓝牙音箱”的去优化“蓝牙”（太泛，无转化）。
    - **正确**：优化“高音质便携蓝牙音箱推荐”（精准，有转化）。
    
    请返回 JSON 格式：
    {{
        "keywords": [
            {{
                "keyword": "用户实际搜索的词 (e.g. '适合新手的蓝牙音箱推荐')",
                "title": "能解答该搜索意图的标题 (e.g. '2024新手必看：這5款蓝牙音箱性价比最高')",
                "intent": "Commercial/Transactional",
                "estimatedWords": 1500,
                "template": "Buying Guide/Review",
                "priority": "High",
                "reason": "符合长尾理论，竞争适度且意图精准"
            }}
        ]
    }}
    """


# ==========================================
# 0. Discovery Prompts (New)
# ==========================================

SYSTEM_SEARCH_SIMULATION = (
    "你是一位精通用户搜索行为的搜索引擎优化专家。"
    "你的任务是模拟真实用户在**购买决策过程**（Buying Journey）中可能会在 Google/Bing 输入的搜索词。"
    "你需要站在用户的角度，思考他们会问什么问题，寻找什么解决方案。"
)

def get_search_simulation_prompt(profile: Dict[str, Any], n: int = 5) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False)[:3000]
    return f"""
    基于以下企业/产品画像，模拟 **{n} 个** 真实用户可能会使用的搜索查询（Search Queries）。
    
    企业画像：
    {profile_json}
    
    **模拟原则（基于长尾理论）**：
    1.  **拒绝大词**：绝对不要搜 "手机"、"婚纱" 这种泛词（竞争大、无转化）。
    2.  **具体化/长尾化**：
        -   "iPhone 15 Pro Max 防摔手机壳 推荐" (Specific Product + Feature + Intent)
        -   "深圳 婚纱摄影 哪家 性价比高" (Location + Service + Constraint)
    3.  **问题导向**：模拟用户遇到的问题，e.g. "如何解决...", "什么牌子的...好"
    4.  **对比意图**：e.g. "Brand A vs Brand B"
    5.  **场景/人群**：e.g. "适合新手的...", "送礼推荐..."
    
    请返回 JSON 格式：
    {{
        "queries": [
            "搜索词1",
            "搜索词2",
            ...
        ]
    }}
    """

SYSTEM_DISCOVERY = "你是一位专业的市场情报分析师，擅长发现细分领域的顶尖产品和潜在竞争对手。"

def get_discovery_prompt(niche_or_domain: str) -> str:
    return f"""
    请列出在 "{niche_or_domain}" 领域中目前表现最好的 5-8 个产品/公司。
    
    你的目标是模拟“Perplexity”或“SearchGPT”的搜索结果，提供高质量的市场情报。
    
    请用 JSON 格式返回，包含：
    1. name: 产品/公司名称
    2. url: 官方网址 (如果确切知道，否则留空或填 "Search Required")
    3. strengths: 核心优势 (1-2 句)
    4. pricing_model: 预估价格模式 (e.g., Freemium, Enterprise)
    
    请只返回 JSON 数据。
    """

def get_hidden_competitor_prompt(company_profile_summary: str) -> str:
    return f"""
    基于以下我方企业画像，寻找 3 个“隐形竞品” (Hidden Competitors)。
    
    我方画像摘要：
    {company_profile_summary}
    
    “隐形竞品”定义：
    - 并非直接大众熟知的巨头
    - 但在特定垂直领域或特定功能上与我们高度重合
    - 可能会抢走我们的潜在客户
    
    请用 JSON 返回 3 个隐形竞品的信息 (name, reason, url_guess)。
    """

# ==========================================
# 1. Company Analysis Prompts
# ==========================================

SYSTEM_COMPANY_ANALYSIS = "你是一位专业的企业分析师，擅长从网站内容中提取结构化信息。"

def get_company_analysis_prompt(content: str) -> str:
    return f"""
    分析以下网站内容，提取公司信息。请用 JSON 格式返回：

    {content[:8000]}

    请提取：
    1. company_name: 公司名称
    2. industry: 所属行业
    3. products_services: 产品或服务列表
    4. target_audience: 目标受众
    5. unique_selling_points: 独特卖点
    6. key_features: 核心功能/特点

    请直接返回 JSON，不要包含 markdown 代码块。
    """

# ==========================================
# 2. Company Profile Prompts (Target for Optimization)
# ==========================================

SYSTEM_COMPANY_PROFILE = (
    "你是一位世界级的品牌战略专家和行业分析师，擅长为企业制定 GEO (Generative Engine Optimization) 优化战略。"
    "你的分析应该深刻、具体、富有洞察力，展示出你对品牌和行业的深度理解。"
    "你必须引用真实的数据、事件和趋势，让客户相信你确实做了深入调研。"
)

def get_company_profile_prompt(company_name: str, domain: str, content_context: str, latest_news: str = "") -> str:
    news_section = ""
    if latest_news:
        news_section = f"""
    
    === 以下是通过实时搜索获取的品牌最新动态 ===
    {latest_news}
    === 最新动态结束 ===
    """
    
    return f"""
    为以下企业生成一份**深度专业级** GEO 优化战略画像。
    
    你的目标是：
    1. 展示你对品牌的深度理解 — 不是泛泛而谈，而是引用具体的产品线、市场策略、最新动向
    2. 挖掘品牌在 AI 搜索引擎（Perplexity, ChatGPT, Gemini）中的知识图谱位置
    3. 让客户看到这份报告后认为"这个系统真的懂我们"
    
    企业名称：{company_name}
    域名：{domain}
    {content_context}
    {news_section}
    
    请生成一份详细的战略画像，必须包含以下 **7 个核心模块**，用结构化的中文返回：

    #### 1. 品牌核心定位与市场地位 (Brand Positioning & Market Status)
    - **一句话定位**：用简练的语言定义品牌在市场中的位置
    - **市场地位**：全球/区域排名、市场份额（如有）、行业影响力
    - **品牌原型**：(创新者/挑战者/领导者/专家等)
    - **品牌语调**：(专业、亲切、权威、技术驱动等)
    - **核心价值主张**：品牌区别于竞品的根本承诺

    #### 2. 产品/服务矩阵与关键词簇 (Product Matrix & Keywords)
    - **核心产品线**：列出主打产品及各自定位（请具体到产品名称）
    - **差异化功能**：相比竞品的独特优势
    - **GEO 关键词簇**：用户可能搜索的 8-12 个高价值关键词（含长尾词）

    #### 3. 用户画像与痛点分析 (Audience & Pain Points)
    - **理想客户画像 (ICP)**：具体到行业、规模、职位、使用场景
    - **核心痛点**：客户在寻找该产品前遇到的具体困难
    - **决策驱动力**：客户购买的主要理由

    #### 4. 最新品牌动态与战略方向 (Latest News & Strategic Direction)
    - **近期重大事件**：最近 6 个月内的产品发布、融资、合作等关键事件
    - **战略方向**：品牌目前的增长策略（如扩展市场、新产品线、AI 整合等）
    - **行业趋势关联**：品牌如何回应当下行业大趋势

    #### 5. 竞争格局速览 (Competitive Landscape Quick View)
    - **直接竞品 TOP 3**：列出核心对手及各自优劣势
    - **竞争维度**：在哪些维度上领先/落后？（价格、技术、品牌力、生态等）
    - **差异化壁垒**：竞品难以复制的优势

    #### 6. 行业实体图谱位置 (Entity Graph Positioning)
    - **关联实体**：品牌应与哪些核心概念强关联？
    - **知识图谱共现**：品牌通常与哪些品牌/概念一起出现？
    - **权威认证**：行业奖项、合作伙伴、认证

    #### 7. GEO 搜索意图映射 (Search Intent Mapping)
    - **信息类意图**：用户会问什么问题？
    - **商业类意图**：用户在比较时会搜什么？
    - **导航类意图**：用户如何找到官网？

    **重要要求**：
    - 引用具体的产品名称、数据、事件，不要泛泛而谈
    - 如果有最新动态信息，务必整合到分析中
    - 让客户感受到这是一份专业的、基于真实调研的报告
    """

# ==========================================
# 3. Gap Analysis Prompts
# ==========================================

SYSTEM_GAP_ANALYSIS = (
    "你是一位高级 GEO 竞品分析专家，擅长通过对比真实网站内容来发现差距。"
    "你的分析必须基于实际内容证据，而非空洞的理论判断。"
    "你需要引用双方网站的真实内容片段来支撑你的分析结论。"
)

def get_gap_analysis_prompt(company_profile: Dict[str, Any], competitor_summary: str, our_content: str = "") -> str:
    profile_json = json.dumps(company_profile, ensure_ascii=False)
    
    our_content_section = ""
    if our_content:
        our_content_section = f"""
    
    ## 我方网站实际内容（爬取摘要）：
    {our_content[:5000]}
    """
    
    return f"""
    基于以下**真实网站内容**进行深度差距分析。
    
    重要：你的分析必须**引用双方网站的具体内容**来说明差距，而非空洞的判断。
    
    ## 我方企业画像 (User Brand Profile):
    {profile_json}
    
    {our_content_section}
    (如果提供了我方网站内容，请务必从中提取具体的产品描述、价值主张作为“我方内容”的证据)
    
    ## 竞品网站实际内容 (Competitor Content):
    {competitor_summary}
    
    请生成详细的差距分析报告，返回 JSON 格式：
    
    {{
        "summary": "核心诊断结论（2-3句，点出最关键的差距）",
        "contentComparisons": [
            {{
                "dimension": "对比维度（如：产品价值传递、SEO结构、信任信号等）",
                "our_content": "我方网站内容摘录（**必须**从我方内容中提取具体文字，严禁留空或写'无'，如果内容不足请基于画像推断但需注明）",
                "our_score": 0-100,
                "competitor_name": "竞品名称",
                "competitor_content": "竞品网站在此维度的实际内容摘录",
                "competitor_score": 0-100,
                "gap_analysis": "具体差距分析（说明为什么竞品做得更好，并引用内容为证）",
                "recommendation": "具体的改进建议"
            }}
        ],
        "competitorGaps": [
            {{"dimension": "维度名", "description": "差距描述（引用实际内容为证）", "impact": "极高/高/中"}}
        ],
        "missingKeywords": [
            {{"cluster": "关键词簇", "keywords": ["关键词1", "关键词2"], "priority": "高/中/低"}}
        ],
        "structuralGaps": [
            {{"component": "组件类型（如 FAQ、Price Table、Case Study）", "whyNeeded": "为何需要（引用竞品的做法作证据）"}}
        ],
        "suggestions": [
            {{"action": "具体可执行的建议", "timeframe": "立即/1周内/1月内", "expectedOutcome": "预期效果", "priority": "High/Medium/Low"}}
        ]
    }}
    
    **关键要求**：
    1. contentComparisons 必须至少有 4-6 个维度的对比
    2. **绝不允许** "our_content" 字段为空。如果由于某种原因没有爬取到内容，请根据我方企业画像 (Profile) 编写合理的内容描述。
    3. 每个对比必须引用双方网站的**真实内容片段**
    4. 评分要客观，基于实际内容质量
    5. 建议要具体可执行，不要泛泛而谈
    """

# ==========================================
# 4. Deep Gap Analysis Prompts (Phase 3)
# ==========================================

SYSTEM_DEEP_ANALYSIS = "你是一位高级 GEO 策略顾问，擅长通过海量数据对比，挖掘企业在 AI 搜索引擎中的结构性短板。"

def get_deep_gap_analysis_prompt(company_profile: Dict[str, Any], aggregated_competitor_content: str, kb_stats: Dict[str, Any]) -> str:
    profile_json = json.dumps(company_profile, ensure_ascii=False)
    
    return f"""
    基于全网情报知识库（Knowledge Base）进行深度差距审计。
    
    ## 审计背景
    - 知识库覆盖竞品页面数：{kb_stats.get('page_count', 0)}
    - 数据总量：{kb_stats.get('total_size_mb', 0)} MB
    
    ## 我方企业画像 (User Profile)：
    {profile_json}
    
    ## 竞品知识库聚合摘要 (Competitor Knowledge Base Aggregation)：
    {aggregated_competitor_content}
    
    ## 任务要求
    请进行深度差距分析，找出我方在“被 AI 引用”方面的致命弱点。
    请返回 JSON 格式，包含以下字段：
    
    1. "score": {{ 
        "overall": 0-100 (整体 GEO 健康度),
        "authority": 0-100 (权威度评分),
        "structure": 0-100 (结构化评分)
    }}
    2. "entity_gaps": [
        {{ "entity": "实体名", "competitor_usage": "竞品是如何使用的", "missing_reason": "我方缺失原因" }}
    ] (至少 5 个)
    3. "structural_blindspots": [
        {{ "component": "组件类型 (e.g. Price Table)", "impact": "对 AI 抓取的影响", "recommendation": "改进建议" }}
    ] (至少 3 个)
    4. "citation_opportunities": [
        {{ "source": "建议引用的权威来源", "relevance": "相关性说明" }}
    ]
    5. "action_plan": [
        {{ "step": "步骤", "action": "具体操作", "priority": "High/Medium/Low" }}
    ]
    """

SYSTEM_CONTENT_ARTICLE = (
    "你是一位精通‘产品驱动增长’(Product-Led Growth) 的内容营销专家。"
    "你的核心目标是通过高价值的内容，潜移默化地让读者意识到：‘使用该产品是解决问题的最佳方案’。"
    "你不只在科普知识，更是在通过专业度建立信任，最终引导转化。"
)

SYSTEM_CONTENT_SOCIAL = (
    "你是一位擅长‘种草’和‘转化’的社交媒体营销专家。"
    "你的每一条贴文都必须有明确的商业目的：要么展示产品核心优势，要么解决用户痛点并推荐产品。"
    "拒绝自嗨式文案，必须以产品为英雄 (Product as Hero)。"
)

def get_content_generation_prompt(title: str, content_type: str, profile: Dict[str, Any], context_data: Optional[Dict[str, Any]] = None) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False)
    product_name = profile.get('productName', '我们产品')
    usp = profile.get('uniqueSellingPoint', '核心优势')
    
    context_section = ""
    if context_data:
        if content_type == "Article":
            context_section = f"""
            
            ### 权威调研数据 (Deep Research Data):
            {context_data.get('content', '')[:3000]}
            
            必须引用上述调研中的数据或观点，增加文章权威性。
            """
        else:
            context_section = f"""
            
            ### 社交媒体热点趋势 (Social Trends):
            {context_data.get('content', '')[:2000]}
            
            必须结合上述热点趋势，让贴文更具传播力。
            """
    
    if content_type == "Article":
        return f"""
        撰写一篇深度 GEO 优化文章，标题："{title}"
        
        企业背景：{profile_json}
        {context_section}
        
        ### 核心指令 (Product-Led Strategy):
        1. **产品植入 (Crucial)**: 你的文章必须围绕 **{product_name}** 展开。不要只写通用知识。
        2. **痛点-解决方案 (Problem-Agitation-Solution)**: 
           - 先指出用户面临的困难 (Problem)。
           - 强调不解决的后果 (Agitation)。
           - 顺理成章地引出 **{product_name}** 作为最佳解决方案 (Solution)。
        3. **强调 USP**: 在文中多次自然地提及核心卖点："{usp}"。
        
        ### 结构要求：
        1. **结构化输出**：必须包含 1 个 Markdown 表格（将 {product_name} 与传统方案/竞品进行对比，突出我方优势）。
        2. **FAQ 模块**：文末包含 3-5 个高价值 FAQ，其中至少 1 个问题要与 {product_name} 直接相关（e.g. "{product_name} 适合新手吗？"）。
        3. **权威引用**：引用行业数据/专家观点（优先使用调研数据中的来源）。
        4. **E-E-A-T**：展示专业性 (Expertise) 和权威性 (Authoritativeness)。
        5. **字数**：2000+ 字，逻辑严密，适合技术/B2B 读者。
        """
    else:  # Social
        return f"""
        撰写一条社交媒体爆款短文，话题："{title}"
        
        企业背景：{profile_json}
        {context_section}
        
        ### 核心指令 (Conversion Focus):
        1. **产品为王**: 贴文的核心目的是推广 **{product_name}**。
        2. **场景化种草**: 描述一个具体的使用场景或痛点，展示 **{product_name}** 如何轻松解决它。
        3. **卖点强化**: 确保体现 "{usp}"。
        
        ### 格式要求：
        1. **黄金前三行**：开头必须抓住眼球（Hook），结合当下热点。
        2. **情绪调动**：使用 Emoji 和口语化表达，引发共鸣。
        3. **强力 CTA**: 文末必须引导用户尝试/购买/了解产品（e.g. "点击主页链接试用 {product_name}..."）。
        4. **标签策略**：包含 3-5 个高流量 Hashtags (必须混合 **行业词** 和 **趋势热词**)。
        5. **平台风格**：模仿 LinkedIn/小红书/Twitter 的高赞风。
        6. **字数**：150 字左右，短小精悍，适合快速阅读。
        """

def get_regenerate_content_prompt(original_content: str, feedback: str, content_type: str) -> str:
    return f"""
    请根据用户反馈，对以下内容进行修改优化。
    
    ### 原内容：
    {original_content[:3000]}
    
    ### 用户修改意见 (Feedback)：
    "{feedback}"
    
    ### 任务：
    保持原内容的优点，重点针对用户的意见进行修改。
    { "请保持 GEO 结构（表格、FAQ）不变，仅修改正文。" if content_type == "Article" else "请调整语气和传播点，使其更符合用户期望。" }
    
    请直接返回修改后的完整内容。
    """


# ==========================================
# 5. Image Generation Prompts (Phase 4)
# ==========================================

def get_image_generation_prompt(title: str, style: str = "tech") -> str:
    """
    Generate a DALL-E prompt based on content title and style
    """
    if style == "tech":
        return f"""
        (Cyberpunk / Futuristic Tech Style)
        A high-quality, abstract featured image for a tech blog article titled: "{title}".
        Digital art, 3D render, glowing neon circuits, data visualization elements, deep blue and violet color palette.
        Professional, sleek, suitable for a SaaS company blog. No text overlay.
        """
    elif style == "infographic":
        return f"""
        (Flat Vector Art / Infographic Style)
        An engaging illustration representing the concept of: "{title}".
        Clean lines, minimal design, isometric perspective.
        Visualizing data flow, optimization, or analytics growth.
        Soft business colors (Indigo, Emerald, White). White background. No text inside the image.
        """
    else:
        return f"A creative image representing {title}, high quality, digital art."


# ==========================================
# 6. Title Generation Prompts (Phase 5)
# ==========================================

SYSTEM_TITLE_GENERATION = (
    "你是一位爆款内容标题大师，擅长结合行业趋势及品牌特性创作极具吸引力的标题。"
    "你深谙用户心理 (FOMO, 好奇心, 利益点) 和平台算法推荐机制。"
)

def get_title_generation_prompt(topic: str, niche: str, profile: Dict[str, Any], trends_context: str = "", n: int = 10) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False)
    
    trends_section = ""
    if trends_context:
        trends_section = f"""
        ### 当前行业流行趋势/热点 (Trends):
        {trends_context[:3000]}
        
        请务必结合上述趋势，让标题蹭上热点流量。
        """
        
    return f"""
    请为话题 "{topic}" 生成 {n} 个爆款内容标题。
    
    所属领域 (Niche): {niche}
    企业画像 (Profile): {profile_json}
    {trends_section}
    
    要求：
    1. **严格比例控制**：必须包含 **50% 深度文章标题**（适合长文 SEO）和 **50% 社交媒体短文标题**（适合高互动）。
    2. **多样化风格**：覆盖 深度干货型 / 数据揭秘型 / 争议话题型 / 故事型 / 紧跟热点型
    3. **GEO 友好**：包含核心关键词，利于被 AI 搜索引擎引用
    4. **符合品牌调性**：即专业又不失吸引力
    
    请返回 JSON 格式：
    {{
        "titles": [
            {{
                "title": "标题文本",
                "style": "风格类型 (必须明确标记为 '深度干货' 或 '社交爆款')",
                "reason": "推荐理由 (e.g. 结合了X趋势，利用了恐失心理)",
                "predicted_viral_score": 85 (0-100)
            }}
        ]
    }}
    """
