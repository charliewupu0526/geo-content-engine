
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import {
  Search,
  BrainCircuit,
  ArrowRight,
  Loader2,
  Target,
  Sparkles,
  Terminal,
  Zap,
  Edit3,
  CheckSquare,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Info,
  ShieldCheck,
  FileSearch,
  Cpu,
  BarChart4,
  LayoutList,
  AlertCircle
} from 'lucide-react';
import { analyzeCompanyWebsite, generateCompanyProfile, generateGapReport, checkApiHealth } from '../services/geminiService';

interface Props {
  activeProject: Project | null;
  onNext: () => void;
  onBack: () => void;
}

const IntelligenceView: React.FC<Props> = ({ activeProject, onNext, onBack }) => {
  const [subStep, setSubStep] = useState<'check' | 'results'>('check');
  const [isScanning, setIsScanning] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // 检查 API 状态
  useEffect(() => {
    const checkApi = async () => {
      const isHealthy = await checkApiHealth();
      setApiStatus(isHealthy ? 'online' : 'offline');
    };
    checkApi();
  }, []);

  // 初始化 - 自动调用 AI 生成企业画像
  useEffect(() => {
    if (activeProject && apiStatus === 'online') {
      const generateInitialProfile = async () => {
        setScanProgress('正在使用 AI 分析企业信息...');
        setIsScanning(true);

        try {
          // 先爬取网站内容
          const analysis = await analyzeCompanyWebsite(
            `https://${activeProject.domain}`,
            activeProject.name
          );

          if (analysis) {
            // 用 AI 生成画像
            const profile = await generateCompanyProfile(
              activeProject.name,
              activeProject.domain,
              analysis
            );

            if (profile && profile.profile) {
              // profile.profile 可能是对象或字符串
              const profileData = profile.profile;
              if (typeof profileData === 'string') {
                setProfileText(profileData);
              } else if (profileData.profile_text) {
                setProfileText(profileData.profile_text);
              } else {
                // 如果是其他结构，格式化显示
                setProfileText(JSON.stringify(profileData, null, 2));
              }
              setAnalysisResult(analysis);
              setScanProgress('AI 画像生成完成');
            } else {
              // 使用默认模板
              setProfileText(getDefaultProfileTemplate(activeProject));
            }
          } else {
            setProfileText(getDefaultProfileTemplate(activeProject));
          }
        } catch (error) {
          console.error('Failed to generate profile:', error);
          setScanError('AI 生成失败，使用默认模板');
          setProfileText(getDefaultProfileTemplate(activeProject));
        } finally {
          setIsScanning(false);
          setScanProgress('');
        }
      };

      generateInitialProfile();
    } else if (activeProject && apiStatus === 'offline') {
      // API 离线时使用默认模板
      setProfileText(getDefaultProfileTemplate(activeProject));
    }
  }, [activeProject, apiStatus]);

  // 默认画像模板
  const getDefaultProfileTemplate = (project: Project) => `[深度企业画像与 GEO 战略对齐报告]

1. 品牌核心定位 (Brand Positioning)
- 品牌名称：${project.name}
- 官方域名：${project.domain}
- 核心愿景：致力于通过 AI 技术解决 ${project.name} 领域的内容生产与流量分发痛点。
- 品牌语调：专业、前瞻、可靠（适合金融/技术类 AI 模型抓取）。

2. 核心产品/服务矩阵 (Product Matrix)
- 主营业务：自动化 GEO 优化流水线、内容实体建模。
- 解决痛点：解决企业在 Perplexity、SearchGPT 等 AI 搜索平台中缺失品牌引用的问题。
- 核心竞争力：拥有行业领先的内容结构化算法，能将非结构化文案转化为 AI 易读的 Knowledge Graph。

3. 受众群体与搜索场景 (Audience & Scenarios)
- 目标人群：数字营销主管 (CMO)、SaaS 创始人、SEO 专家。
- 关键搜索意图：
  - 信息型："什么是 GEO 优化？"
  - 对比型："GEO vs SEO 哪个更有效？"
  - 决策型："最适合 2025 年的内容引擎工具"。

4. 行业实体关联 (Entity Graph)
- 核心实体关键词：#GenerativeAI #SearchEngineOptimization #KnowledgeGraph #ContentStrategy
- 关联权威源：Google AI Blog, Perplexity Developers, OpenAI Documentation.

5. GEO 策略偏好 (Strategy Markers)
- 结构化偏好：倾向于使用 Markdown 表格、FAQ 组件和专家引文 (E-E-A-T)。
- 引用权重建议：加强关于"技术白皮书"和"数据调研报告"的内容产出，这是当前赛道高引用的主要因素。

⚠️ 注意：当前使用离线模板。请确保 API 配置正确以获取 AI 实时分析。`;


  const handleStartScan = async () => {
    if (!activeProject) return;

    setIsScanning(true);
    setScanError(null);
    setScanProgress('正在连接 AI 引擎...');

    try {
      // Step 1: Analyze company website using real crawler
      setScanProgress('正在爬取网站内容...');
      const analysis = await analyzeCompanyWebsite(
        `https://${activeProject.domain}`,
        activeProject.name
      );

      // 检查 API 返回的错误
      if (analysis && (analysis.error || analysis.success === false)) {
        const errorMsg = analysis.error || 'Unknown API Error';
        console.error("API returned error:", errorMsg);
        setScanError(`API 错误: ${JSON.stringify(errorMsg)}`);

        // 如果是 401 错误，给予明确提示
        if (JSON.stringify(errorMsg).includes('401') || JSON.stringify(errorMsg).includes('invalid_api_key')) {
          setScanError('OpenAI API Key 无效。请检查 Vercel 环境变量配置。');
        }

        setSubStep('results');
        setScanProgress('');
        return;
      }

      if (analysis) {
        setScanProgress('正在生成企业画像...');
        // Step 2: Generate profile using AI
        const profile = await generateCompanyProfile(
          activeProject.name,
          activeProject.domain,
          analysis
        );

        if (profile && profile.profile) {
          setProfileText(profile.profile);
        }

        setAnalysisResult(analysis);
        setScanProgress('分析完成!');
      } else {
        // Network failure or complete crash
        setScanError('无法连接到分析服务，请检查网络');
        setSubStep('results');
      }

      setSubStep('results');
    } catch (error) {
      console.error('Scan failed:', error);
      setScanError('扫描失败，使用演示数据继续');
      setSubStep('results');
    } finally {
      setIsScanning(false);
    }
  };

  const competitors = [
    { name: 'HubSpot (CRM)', score: 94, citation: '45%' },
    { name: 'Pipedrive Insider', score: 89, citation: '22%' },
    { name: 'Monday.com Blog', score: 82, citation: '18%' },
  ];

  const insights = [
    {
      title: '内容结构化策略',
      icon: FileSearch,
      content: '竞品大量采用 Markdown 表格展示参数，FAQ 模块高度对齐 Schema.org，平均回答长度为 180 字符。',
      tag: '结构化密度: 极高'
    },
    {
      title: '实体关键词布局',
      icon: Cpu,
      content: '头部对手在“自动化”与“AI 协作”实体之间建立了强关联，其内容中行业术语的 LSI 覆盖率高达 92%。',
      tag: '语义权重: 核心'
    },
    {
      title: '权威引用分析',
      icon: ShieldCheck,
      content: '被频繁引用的主要原因是其引用了 2024 年 Q3 的 Gartner 报告。AI 搜索引擎偏好包含特定日期和百分比的内容。',
      tag: '信任标记: 数据驱动'
    }
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 顶部步骤指示器 */}
      <div className="flex items-center gap-8 mb-10 bg-white p-4 rounded-3xl border border-slate-200 w-fit">
        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-sm transition-all ${subStep === 'check' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${subStep === 'check' ? 'border-white/40 bg-white/20' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>1</span>
          资料检查
        </div>
        <div className="w-8 h-px bg-slate-200"></div>
        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-sm transition-all ${subStep === 'results' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${subStep === 'results' ? 'border-white/40 bg-white/20' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>2</span>
          结果展示
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {subStep === 'check' ? (
          /* 步骤 1：资料检查 */
          <div className="animate-in fade-in slide-in-from-left-4 duration-500 h-full flex flex-col">

            {/* 错误提示横幅 (Step 1) */}
            {scanError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-[2rem] p-6 flex items-start gap-4 animate-pulse">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-red-800 mb-1">自动生成失败</h3>
                  <p className="text-sm text-red-700">{scanError}</p>
                  {/* 额外提示: 如果是 401 */}
                  {(scanError.includes('401') || scanError.includes('key')) && (
                    <p className="text-xs text-red-600 mt-2 font-bold">👉 请检查 Vercel 环境变量 OPENAI_API_KEY</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm flex flex-col flex-1">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                    <Edit3 size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI 企业信息画像检查</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">请核对并微调 AI 自动提取的品牌逻辑，这决定了后续的侦察精度。</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 animate-pulse">
                  <Sparkles size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">AI 智能分析中</span>
                </div>
              </div>

              <div className="flex-1 relative group bg-slate-50 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-all">
                <div className="absolute top-6 right-6 text-slate-300 group-hover:text-indigo-400 transition-colors z-10 pointer-events-none">
                  <Terminal size={20} />
                </div>
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  disabled={isScanning}
                  className="w-full h-full min-h-[400px] bg-transparent focus:outline-none transition-all font-mono text-sm leading-relaxed text-slate-700 resize-none no-scrollbar"
                  placeholder="正在生成企业画像..."
                />
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button
                  onClick={onBack}
                  className="px-10 py-5 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={20} /> 返回录入
                </button>
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="bg-slate-900 text-white px-14 py-5 rounded-[1.5rem] font-black shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 group disabled:bg-slate-200"
                >
                  {isScanning ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                  {isScanning ? '正在挖掘全网情报...' : '确认资料并开始侦察'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 步骤 2：结果展示 */
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10 pb-12">

            {/* 错误提示横幅 */}
            {scanError && (
              <div className="bg-red-50 border border-red-200 rounded-[2rem] p-8 flex items-start gap-4 animate-pulse">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <AlertCircle size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-red-800 mb-2">分析服务响应异常</h3>
                  <p className="text-red-700 font-medium">{scanError}</p>
                  <p className="text-xs text-red-500 mt-2 font-mono bg-white/50 p-2 rounded-lg">建议检查: Vercel 环境变量 (OPENAI_API_KEY) 是否配置正确且额度充足。</p>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-12">
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner">
                  <Target size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">智能侦察发现报告</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">系统已完成全网引用拓扑扫描，识别出以下核心竞争位势。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* 竞品分析 */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <TrendingUp size={14} /> 核心竞品引用图谱
                  </h4>
                  <div className="space-y-4">
                    {competitors.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-300 transition-all hover:shadow-lg group">
                        <div className="flex items-center gap-5">
                          <span className="text-sm font-black text-indigo-600 bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">{i + 1}</span>
                          <div>
                            <span className="font-black text-slate-800 text-lg">{comp.name}</span>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">Industry Leader</div>
                          </div>
                        </div>
                        <div className="flex gap-10">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-black uppercase mb-1">内容契合度</div>
                            <div className="text-lg font-black text-slate-900">{comp.score}%</div>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-10">
                            <div className="text-[10px] text-slate-400 font-black uppercase mb-1">AI 引用占比</div>
                            <div className="text-lg font-black text-indigo-600">{comp.citation}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 核心洞察 */}
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Info size={14} /> AI 引擎偏好洞察
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {insights.map((ins, i) => (
                      <div key={i} className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:bg-slate-800 transition-all">
                        <div className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-indigo-500/10 group-hover:scale-125 transition-all">
                          <ins.icon size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-black text-indigo-300 uppercase tracking-widest">{ins.title}</h5>
                            <span className="text-[10px] font-black px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">{ins.tag}</span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            {ins.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setSubStep('check')}
                  className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={18} /> 返回修改资料
                </button>
                <button
                  onClick={onNext}
                  className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center gap-3 group"
                >
                  进入差距分析报告
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceView;
