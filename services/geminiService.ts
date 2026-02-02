
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const MOCK_GAP_REPORT = {
  summary: "诊断结论：当前站点在生成式引擎中的‘实体权威度’不足，由于缺乏结构化专家引用和高密度的 Markdown 数据矩阵。",
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

// Added generateKeywords to fix the export error in views/KeywordListView.tsx
export const generateKeywords = async (profile: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `根据品牌资料生成 GEO 选题矩阵: ${JSON.stringify(profile)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              title: { type: Type.STRING },
              intent: { type: Type.STRING },
              estimatedWords: { type: Type.NUMBER },
              template: { type: Type.STRING }
            },
            required: ["keyword", "title", "intent", "estimatedWords", "template"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return MOCK_KEYWORDS;
  }
};

export const generateGapReport = async (profile: any, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析资料: ${JSON.stringify(profile)}。生成 GEO 差距分析。`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return MOCK_GAP_REPORT;
  }
};

export const generateProductionMatrix = async (keywords: string[], branches: string[], profile: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `根据关键词 [${keywords.join(',')}] 和生产分支 [${branches.join(',')}] 生成选题矩阵。资料: ${JSON.stringify(profile)}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              branch: { type: Type.STRING, description: "'Article' or 'Social'" },
              title: { type: Type.STRING },
              intent: { type: Type.STRING },
              estimatedWords: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    // 模拟多分支数据
    const results: any[] = [];
    keywords.forEach(kw => {
      if (branches.includes('Article')) {
        results.push({ keyword: kw, branch: 'Article', title: `[深度文章] 如何在 2025 年通过 ${kw} 提升 AI 搜索引用权重？`, intent: 'Commercial', estimatedWords: 2000 });
      }
      if (branches.includes('Social')) {
        results.push({ keyword: kw, branch: 'Social', title: `🔥 AI 搜索避坑指南：关于 ${kw} 你必须知道的 3 件事！`, intent: 'Informational', estimatedWords: 300 });
      }
    });
    return results;
  }
};

export const generateContentByBranch = async (task: any, profile: any) => {
  const model = task.branch === 'Article' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const prompt = task.branch === 'Article' 
    ? `撰写深度 GEO 文章: "${task.title}"，包含 Markdown 表格和 FAQ。`
    : `撰写社交媒体爆款短文: "${task.title}"，包含 Emoji 和热门标签，适合 Instagram/Twitter。`;
    
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: task.branch === 'Article' ? { thinkingConfig: { thinkingBudget: 2000 } } : {}
    });
    return response.text;
  } catch (error) {
    return task.branch === 'Article' 
      ? `# ${task.title}\n\n## 核心见解\n这里是深度文章内容...` 
      : `${task.title}\n\n🚀 2025 GEO 新趋势！\n\n1️⃣ 结构化内容是王道\n2️⃣ 实体对齐不能少\n\n#GEO #AI #Marketing`;
  }
};
