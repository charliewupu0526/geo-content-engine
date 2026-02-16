
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
  AlertCircle,
  Globe
} from 'lucide-react';
import { analyzeCompanyWebsite, generateCompanyProfile, generateGapReport, checkApiHealth, discoverCompanyCompetitors, discoverHiddenCompetitors } from '../services/geminiService';

interface Props {
  activeProject: Project | null;
  onNext: () => void;
  onBack: () => void;
  onCompetitorsDiscovered: (competitors: any[]) => void;
}

const IntelligenceView: React.FC<Props> = ({ activeProject, onNext, onBack, onCompetitorsDiscovered }) => {
  const [subStep, setSubStep] = useState<'check' | 'results'>('check');
  const [isScanning, setIsScanning] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [dataSourceNote, setDataSourceNote] = useState<string | null>(null);

  // New State for Discovery
  const [niche, setNiche] = useState(activeProject?.name || '');
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<any[]>([]);
  const [hiddenCompetitors, setHiddenCompetitors] = useState<any[]>([]);
  const [isHiddenScanning, setIsHiddenScanning] = useState(false);

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
          // Priority: use the user-edited landing page from profile first, then fallback to domain
          const landingPage = activeProject.companyProfile?.landingPage?.trim();
          const domain = (activeProject.domain || '').trim();

          const targetUrl = landingPage || domain;
          const safeUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

          console.log(`[IntelligenceView] useEffect scan for: ${safeUrl} (Source: ${landingPage ? 'Landing Page' : 'Domain'})`);

          // 调用后端 analyze-company API，已包含爬虫 + AI 分析
          const analysis = await analyzeCompanyWebsite(
            safeUrl,
            activeProject.name
          ) as any;

          if (analysis && analysis.company_profile) {
            // 后端直接返回 company_profile，可能为字符串或JSON对象
            let profileContent = analysis.company_profile;

            // 如果是对象（来自 Perplexity Fallback），则格式化为字符串
            if (typeof profileContent === 'object' && profileContent !== null) {
              const p = profileContent as any;
              profileContent = `【企业分析报告】\n\n` +
                `公司名称: ${p.company_name || '未知'}\n` +
                `所属行业: ${p.industry || '未知'}\n\n` +
                `核心产品/服务:\n${Array.isArray(p.products_services) ? p.products_services.map((s: string) => `- ${s}`).join('\n') : p.products_services}\n\n` +
                `目标受众:\n${p.target_audience || '未知'}\n\n` +
                `独特卖点 (USP):\n${Array.isArray(p.unique_selling_points) ? p.unique_selling_points.map((s: string) => `- ${s}`).join('\n') : p.unique_selling_points}\n\n` +
                `核心功能:\n${Array.isArray(p.key_features) ? p.key_features.map((s: string) => `- ${s}`).join('\n') : p.key_features}`;
            }

            setProfileText(profileContent);
            setAnalysisResult(analysis);
            setDataSource(analysis.data_source || null);
            setDataSourceNote(analysis.note || null);
            setScanProgress('AI 画像生成完成');
          } else if (analysis && analysis.error) {
            // API 返回错误
            setScanError(`分析失败: ${analysis.error}`);
            setProfileText(`⚠️ 网站分析失败\n\n错误: ${analysis.error}\n\n请检查域名是否正确，或稍后重试。`);
          } else {
            // 无数据返回
            setScanError('无法获取企业信息');
            setProfileText('⚠️ 无法获取企业信息，请检查域名配置或网络连接。');
          }
        } catch (error) {
          console.error('Failed to generate profile:', error);
          setScanError('AI 分析请求失败');
          setProfileText('⚠️ AI 分析请求失败，请稍后重试。');
        } finally {
          setIsScanning(false);
          setScanProgress('');
        }
      };

      generateInitialProfile();
    } else if (activeProject && apiStatus === 'offline') {
      // API 离线时显示提示
      setProfileText('⚠️ API 服务离线，无法进行 AI 分析。请检查后端服务状态。');
    }
  }, [activeProject, apiStatus]);


  const handleStartScan = async () => {
    if (!activeProject) return;

    setIsScanning(true);
    setScanError(null);
    setScanProgress('正在连接 AI 引擎...');

    try {
      // Step 0: Intelligent Discovery (New)
      if (niche) {
        setScanProgress(`正在扫描 "${niche}" 领域的竞争格局 (3步验证中: 候选发现→引用验证→评分过滤)...`);
        const competitors = await discoverCompanyCompetitors(
          niche,
          activeProject.name,
          activeProject.domain
        );
        if (competitors && Array.isArray(competitors)) {
          setDiscoveredCompetitors(competitors);
          onCompetitorsDiscovered(competitors); // Pass to parent
        }
      }

      // Step 1: Analyze company website using real crawler
      setScanProgress('正在爬取网站内容...');

      // Priority: use the user-edited landing page from profile first, then fallback to domain
      const landingPage = activeProject.companyProfile?.landingPage?.trim();
      const domain = (activeProject.domain || '').trim();

      const targetUrl = landingPage || domain;
      const safeUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

      console.log(`[IntelligenceView] Starting scan for: ${safeUrl} (Source: ${landingPage ? 'Landing Page' : 'Domain'})`);

      const analysis = await analyzeCompanyWebsite(
        safeUrl,
        activeProject.name
      ) as any;

      // 检查 API 返回的错误
      if (analysis && (analysis.error || analysis.success === false)) {
        const errorMsg = analysis.error || 'Unknown API Error';
        console.error("API returned error:", errorMsg);
        setScanError(`API 错误: ${JSON.stringify(errorMsg)}`);

        // 如果是 401 错误，给予明确提示
        if (JSON.stringify(errorMsg).includes('401') || JSON.stringify(errorMsg).includes('invalid_api_key')) {
          setScanError('OpenAI API Key 无效。请检查 Vercel 环境变量配置。');
        }

        // Don't return early, show what we have (e.g. competitors)
      }

      if (analysis) {
        // Capture data source info
        setDataSource(analysis.data_source || null);
        setDataSourceNote(analysis.note || null);

        setScanProgress('正在生成企业画像...');
        // Step 2: Generate profile using AI
        const profile = await generateCompanyProfile(
          activeProject.name,
          activeProject.domain,
          analysis
        ) as any;

        if (profile && profile.profile) {
          setProfileText(profile.profile);
        }

        setAnalysisResult(analysis);
        setScanProgress('分析完成!');
      } else {
        // Network failure or complete crash
        if (!scanError) setScanError('无法连接到分析服务，请检查网络');
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

  const handleDiscoverHiddenCompetitors = async () => {
    if (!analysisResult || !analysisResult.company_profile) return;

    setIsHiddenScanning(true);
    try {
      const results = await discoverHiddenCompetitors(analysisResult.company_profile);
      if (results && Array.isArray(results)) {
        setHiddenCompetitors(results);
      }
    } catch (e) {
      console.error("Hidden competitor discovery failed", e);
    } finally {
      setIsHiddenScanning(false);
    }
  };

  // Display Logic: Use real discovered competitors only (no mock fallback)
  const displayCompetitors = discoveredCompetitors.length > 0
    ? discoveredCompetitors.map((c: any) => ({
      name: c.name,
      score: c.ai_citation_score || c.score || '—',
      citation: c.data_source === 'ai_citation_validated'
        ? `AI引用率 ${c.ai_mention_rate || 0}%`
        : c.data_source === 'perplexity_search' ? '真实数据' : c.strengths ? 'AI 评估' : '—',
      url: c.url,
      strengths: c.strengths,
      products: c.products,
      data_source: c.data_source,
      ai_citation_score: c.ai_citation_score,
      ai_mention_rate: c.ai_mention_rate,
      validation_queries: c.validation_queries
    }))
    : []; // Empty array - no mock data

  // Dynamic insights based on discovered competitors (no hardcoded data)
  const insights = discoveredCompetitors.length > 0 ? [
    {
      title: '内容结构化策略',
      icon: FileSearch,
      content: `发现 ${discoveredCompetitors.length} 个核心竞品: ${discoveredCompetitors.slice(0, 3).map((c: any) => c.name).join('、')}。建议分析其内容结构和关键词策略。`,
      tag: `竞品数量: ${discoveredCompetitors.length}`
    },
    {
      title: '实体关键词布局',
      icon: Cpu,
      content: discoveredCompetitors[0]?.strengths || '正在分析竞品核心优势...',
      tag: '语义权重: 分析中'
    },
    {
      title: '权威引用分析',
      icon: ShieldCheck,
      content: discoveredCompetitors[1]?.strengths || '正在分析竞品引用权威来源...',
      tag: '信任标记: 分析中'
    }
  ] : [];

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

              {/* Data Source Indicator */}
              {dataSource && (
                <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 ${dataSource === 'website_scrape'
                  ? 'bg-emerald-50 border-emerald-200'
                  : dataSource === 'perplexity_search'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                  }`}>
                  <div className={`p-1.5 rounded-lg ${dataSource === 'website_scrape'
                    ? 'bg-emerald-100 text-emerald-600'
                    : dataSource === 'perplexity_search'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-red-100 text-red-600'
                    }`}>
                    {dataSource === 'website_scrape' ? <CheckSquare size={16} /> : dataSource === 'perplexity_search' ? <Search size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs font-black uppercase tracking-wider ${dataSource === 'website_scrape'
                      ? 'text-emerald-700'
                      : dataSource === 'perplexity_search'
                        ? 'text-amber-700'
                        : 'text-red-700'
                      }`}>
                      {dataSource === 'website_scrape'
                        ? '✅ 数据来源: 官网爬取'
                        : dataSource === 'perplexity_search'
                          ? '🔍 数据来源: Perplexity AI 搜索'
                          : '⚠️ 数据来源: AI 自动生成（无真实数据）'}
                    </span>
                    {dataSourceNote && (
                      <p className="text-xs mt-1 opacity-80">{dataSourceNote}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Discovery Input (New) */}
              <div className="mt-8 mb-4 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
                <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
                  <Globe size={18} className="text-indigo-600" />
                  智能侦察配置
                </h4>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">核心业务领域 (Niche)</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                      placeholder="例如: CRM System, AI Marketing Tools..."
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-indigo-400 mt-6">
                      系统将使用 Perplexity AI 实时搜索该领域，挖掘 Top 5-8 个竞争对手。
                    </p>
                  </div>
                </div>
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
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <TrendingUp size={14} /> 核心竞品引用图谱
                    </h4>
                    <button
                      onClick={handleDiscoverHiddenCompetitors}
                      disabled={isHiddenScanning || hiddenCompetitors.length > 0}
                      className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isHiddenScanning ? <Loader2 size={12} className="animate-spin" /> : <FileSearch size={12} />}
                      {isHiddenScanning ? '挖掘中...' : hiddenCompetitors.length > 0 ? '已挖掘隐形竞品' : '挖掘隐形竞品'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {displayCompetitors.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-300 transition-all hover:shadow-lg group">
                        <div className="flex items-center gap-5">
                          <span className="text-sm font-black text-indigo-600 bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">{i + 1}</span>
                          <div>
                            <span className="font-black text-slate-800 text-lg">{comp.name}</span>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">
                              {comp.data_source === 'ai_citation_validated' ? '✅ AI 引用验证' : 'Industry Leader'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-10">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-black uppercase mb-1">AI 引用评分</div>
                            <div className={`text-lg font-black ${(comp.ai_citation_score || comp.score) >= 70 ? 'text-emerald-600' : (comp.ai_citation_score || comp.score) >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>{comp.score}%</div>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-10">
                            <div className="text-[10px] text-slate-400 font-black uppercase mb-1">AI 提及率</div>
                            <div className="text-lg font-black text-indigo-600">{comp.citation}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {hiddenCompetitors.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <h5 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                          <ShieldCheck size={14} />
                          发现潜在隐形竞品 (Hidden Competitors)
                        </h5>
                        <div className="space-y-3">
                          {hiddenCompetitors.map((comp, i) => (
                            <div key={`hidden-${i}`} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3">
                              <div className="mt-1 p-1 bg-amber-100 text-amber-600 rounded-full">
                                <AlertCircle size={12} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{comp.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 bg-white border border-amber-200 text-amber-600 rounded-full">潜在威胁</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{comp.reason || comp.strengths}</p>
                                {comp.url_guess && <div className="text-[10px] text-slate-400 mt-1 truncate">{comp.url_guess}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
    </div >
  );
};

export default IntelligenceView;
