/**
 * GEO Content Engine - AI Service (Frontend)
 * 
 * This service calls the backend API for AI operations.
 * The actual AI processing happens on the server.
 */

import { apiClient } from './apiClient';

// Mock data for fallback
export const MOCK_GAP_REPORT = {
  summary: "诊断结论：当前站点在生成式引擎中的'实体权威度'不足，由于缺乏结构化专家引用和高密度的 Markdown 数据矩阵。",
  competitorGaps: [
    { dimension: "实体权重", description: "竞品引用 2024 标准，我方缺乏规范引用。", impact: "极高" }
  ],
  missingKeywords: [
    { cluster: "技术底层", keywords: ["RAG 对齐", "Schema FAQ", "内容幻觉抑制"], priority: "高" },
    { cluster: "应用场景", keywords: ["GEO 转化率", "AI 搜索流量", "实体建模"], priority: "中" }
  ],
  structuralGaps: [
    { component: "Markdown 表格", whyNeeded: "Perplexity 优先抓取表格键值对。" }
  ],
  suggestions: [
    { action: "重构核心博客为数据矩阵", timeframe: "3天", expectedOutcome: "提升覆盖率" }
  ]
};

export const MOCK_KEYWORDS = [
  { keyword: "GEO 优化", title: "2025 GEO 实战手册", intent: "Commercial", estimatedWords: 2500, template: "行业蓝皮书" },
  { keyword: "AI 算法", title: "SearchGPT 排序逻辑", intent: "Informational", estimatedWords: 2000, template: "技术解析" }
];

/**
 * Generate keywords from company profile
 */
export const generateKeywords = async (profile: any) => {
  try {
    // For now, return mock data
    // TODO: Integrate with backend API when keyword endpoint is ready
    return MOCK_KEYWORDS;
  } catch (error) {
    console.error('Failed to generate keywords:', error);
    return MOCK_KEYWORDS;
  }
};

/**
 * Generate gap analysis report
 */
export const generateGapReport = async (profile: any, context: string) => {
  try {
    // For now, return mock data
    // TODO: Use apiClient.intelligence.analyzeCompetitor when ready
    return MOCK_GAP_REPORT;
  } catch (error) {
    console.error('Failed to generate gap report:', error);
    return MOCK_GAP_REPORT;
  }
};

/**
 * Generate production matrix from keywords
 */
export const generateProductionMatrix = async (keywords: string[], branches: string[], profile: any) => {
  try {
    // Generate mock matrix based on keywords and branches
    const results: any[] = [];
    keywords.forEach(kw => {
      if (branches.includes('Article')) {
        results.push({
          keyword: kw,
          branch: 'Article',
          title: `[深度文章] 如何在 2025 年通过 ${kw} 提升 AI 搜索引用权重？`,
          intent: 'Commercial',
          estimatedWords: 2000
        });
      }
      if (branches.includes('Social')) {
        results.push({
          keyword: kw,
          branch: 'Social',
          title: `🔥 AI 搜索避坑指南：关于 ${kw} 你必须知道的 3 件事！`,
          intent: 'Informational',
          estimatedWords: 300
        });
      }
    });
    return results;
  } catch (error) {
    console.error('Failed to generate production matrix:', error);
    return [];
  }
};

/**
 * Generate content for a task
 */
export const generateContentByBranch = async (task: any, profile: any) => {
  const isArticle = task.branch === 'Article';

  try {
    // For now, return mock content
    // TODO: Integrate with backend API
    if (isArticle) {
      return `# ${task.title}

## 核心见解

在 2025 年的 AI 搜索时代，${task.keyword} 已成为品牌获取流量的关键战场。

## 为什么这很重要？

| 维度 | 传统 SEO | GEO 优化 |
|-----|---------|---------|
| 内容形式 | 关键词堆砌 | 结构化数据 |
| 优化目标 | 排名靠前 | 被 AI 引用 |
| 核心指标 | 点击率 | 引用率 |

## FAQ

### Q: 什么是 GEO？
A: GEO (Generative Engine Optimization) 是专门针对 AI 搜索引擎的优化策略。

### Q: 如何开始 GEO 优化？
A: 首先确保内容结构化，添加清晰的标题层级和数据表格。

---

*本文由 GEO 内容引擎生成*`;
    } else {
      return `${task.title}

🚀 2025 GEO 新趋势！

1️⃣ 结构化内容是王道
2️⃣ 实体对齐不能少
3️⃣ AI 引用率决定流量

👉 点击链接了解更多...

#GEO #AI搜索 #内容营销 #数字营销`;
    }
  } catch (error) {
    console.error('Failed to generate content:', error);
    return isArticle
      ? `# ${task.title}\n\n## 核心见解\n内容生成失败，请稍后重试。`
      : `${task.title}\n\n🚀 内容生成中...\n\n#GEO #AI #Marketing`;
  }
};
