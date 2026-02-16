
export enum ProjectStatus {
  PROJECT_MGMT = '项目管理',
  PROFILE_ENTRY = '资料录入',
  INTELLIGENCE = '智能侦察',
  GAP_ANALYSIS = '差距分析',
  PRODUCTION = '内容生产',
  RESULTS = '结果展示',
  DISTRIBUTION = '发布配置',
  READY = '已就绪'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface WPConnection {
  url: string;
  username: string;
  appPassword: string;
}

export interface SocialAuthConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  pageId?: string;
}

export interface SocialConnection {
  platform: 'Instagram' | 'Twitter';
  status: 'Connected' | 'Disconnected';
  accountName?: string;
  config?: SocialAuthConfig;
}

export interface CompanyProfile {
  industry: string;
  region: string;
  targetAudience: string;
  productName: string;
  uniqueSellingPoint: string;
  landingPage: string;
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  status: ProjectStatus;
  wpConnection?: WPConnection;
  socialConnections?: SocialConnection[];
  companyProfile?: CompanyProfile;
  createdAt: number;
}

export type ContentBranch = 'Article' | 'Social';

export interface TaskItem {
  id: string;
  batchId?: string;
  branch: ContentBranch;
  type: string;
  title: string;
  content?: string;
  socialMediaPreview?: string;
  genStatus: 'Pending' | 'Success' | 'Failed';
  pubStatus: 'Pending' | 'Success' | 'Failed';
  timestamp: number;
  url?: string;
  selected?: boolean;
  profile?: CompanyProfile;
}

export interface KeywordItem {
  id: string;
  title: string;
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional';
  estimatedWords: number;
  template: string;
  selected?: boolean;
  // Enhanced fields
  source?: 'google_serp' | 'competitor_gap' | 'ai_generated';
  serpPosition?: number | null;
  ourRanking?: number | null;
  snippet?: string;
  isLongTail?: boolean;
  isQuestion?: boolean;
  cluster?: string;
  priority?: string;
}

export interface GapReport {
  summary: string;
  competitorGaps: Array<{ dimension: string; description: string; impact: string }>;
  missingKeywords: Array<{ cluster: string; keywords: string[]; priority: string }>;
  structuralGaps: Array<{ component: string; whyNeeded: string }>;
  suggestions: Array<{ action: string; timeframe: string; expectedOutcome: string }>;
}

export interface TaskBatch {
  id: string;
  name: string;
  tasks: TaskItem[];
  timestamp: number;
}
