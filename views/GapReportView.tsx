
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { generateGapReport, performDeepGapAnalysis } from '../services/geminiService';
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Globe,
  FileSearch,
  AlertCircle,
  Clock,
  Target,
  FileText,
  Lock,
  Search,
  BookOpen,
  UserCheck,
  Layers,
  ShieldCheck,
  ArrowLeft,
  RefreshCcw
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  report: any | null;
  onSetReport: (r: any) => void;
  onNext: () => void;
  onBack: () => void;
  competitors: any[];
}

const GapReportView: React.FC<Props> = ({ activeProject, report, onSetReport, onNext, onBack, competitors }) => {
  const [loading, setLoading] = useState(!report);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!report && activeProject?.companyProfile) {
      const loadReport = async () => {
        setLoading(true);
        setLoadError(null);
        try {
          // Attempt Deep Analysis if project ID exists (Phase 3)
          if (activeProject.id) {
            console.log("Triggering Deep Gap Analysis for Project:", activeProject.id);
            const deepReport = await performDeepGapAnalysis(activeProject.id);
            if (deepReport) {
              onSetReport(deepReport);
              return;
            }
          }

          // Fallback to Shallow Analysis (real API call, no mock)
          // Extract URLs from competitors, or basic names if no URL
          const competitorUrls = competitors && competitors.length > 0
            ? competitors.map(c => c.url || c.name)
            : ["real_analysis"]; // Fallback if no competitors found

          console.log("Generating gap report with competitors:", competitorUrls);
          const apiResult = await generateGapReport(activeProject.companyProfile, competitorUrls);

          if (apiResult) {
            onSetReport(apiResult);
          } else {
            setLoadError('差距分析 API 未返回有效数据，请确保后端服务正常并已配置 API Key。');
          }
        } catch (e) {
          console.error("Analysis failed:", e);
          setLoadError(`分析失败: ${e instanceof Error ? e.message : '未知错误'}`);
        } finally {
          setLoading(false);
        }
      };

      const timer = setTimeout(loadReport, 500);
      return () => clearTimeout(timer);
    }
  }, [activeProject, report, onSetReport]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse"></div>
          <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">正在进行全网深度差距对齐...</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">系统正在通过 AI 引擎分析竞品差距，识别内容与结构漏洞。</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-50 border border-red-200 rounded-[2rem] flex items-center justify-center shadow-xl">
          <AlertCircle className="text-red-500" size={40} />
        </div>
        <div className="text-center max-w-lg">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">差距分析失败</h3>
          <p className="text-red-600 font-medium">{loadError}</p>
          <p className="text-slate-400 text-sm mt-4">请确保后端 API 服务正常运行，且 OPENAI_API_KEY 等环境变量已正确配置。</p>
        </div>
        <button
          onClick={onBack}
          className="px-10 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3"
        >
          <ArrowLeft size={20} /> 返回智能侦察
        </button>
      </div>
    );
  }

  // Safely extract data from report
  const summary = report?.summary || report?.gap_analysis?.summary || null;
  const contentComparisons = report?.contentComparisons || report?.gap_analysis?.contentComparisons || [];
  const competitorGaps = report?.competitorGaps || report?.gap_analysis?.competitorGaps || [];
  const missingKeywords = report?.missingKeywords || report?.gap_analysis?.missingKeywords || [];
  const structuralGaps = report?.structuralGaps || report?.gap_analysis?.structuralGaps || [];
  const suggestions = report?.suggestions || report?.gap_analysis?.suggestions || [];
  const entityGaps = report?.entity_gaps || [];
  const structuralBlindspots = report?.structural_blindspots || [];
  const score = report?.score || null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* 顶部功能区：模块名称与站点状态 */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">竞品差距分析</h2>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={() => onSetReport(null)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              title="重新生成并覆盖当前报告"
            >
              <RefreshCcw size={12} /> 重新分析
            </button>
          )}
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
              站点连接状态：<span className="text-emerald-500">已就绪 ({activeProject?.domain || '—'})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 诊断报告展示区 */}
      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <ShieldAlert className="text-indigo-400" size={24} />
            <h3 className="text-xl font-black tracking-tighter uppercase italic">Diagnosis Report Display</h3>
          </div>
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {activeProject?.name || 'GEO'} Gap Report
          </div>
        </div>

        <div className="p-12 md:p-16 space-y-16">

          {/* 1. 诊断摘要 */}
          {summary && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Target size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">诊断摘要 (Diagnosis Summary)</h4>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                "{summary}"
              </p>
            </section>
          )}

          {/* 1.5. 内容对比分析 (NEW - Side-by-side comparison) */}
          {contentComparisons.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Globe size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">网站内容实证对比 (Content Evidence Comparison)</h4>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 font-black uppercase">基于真实网页内容</span>
              </div>
              <div className="space-y-6">
                {contentComparisons.map((comp: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    {/* Dimension Header */}
                    <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-sm">{i + 1}</span>
                        <span className="text-white font-black text-sm">{comp.dimension}</span>
                      </div>
                      {comp.competitor_name && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">vs {comp.competitor_name}</span>
                      )}
                    </div>

                    {/* Side-by-side Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      {/* Our Content */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">我方内容</span>
                          {comp.our_score !== undefined && (
                            <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${comp.our_score >= 70 ? 'bg-emerald-50 text-emerald-600' :
                              comp.our_score >= 40 ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                              {comp.our_score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                          "{comp.our_content || '未检测到相关内容'}"
                        </p>
                      </div>

                      {/* Competitor Content */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{comp.competitor_name || '竞品'}内容</span>
                          {comp.competitor_score !== undefined && (
                            <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${comp.competitor_score >= 70 ? 'bg-emerald-50 text-emerald-600' :
                              comp.competitor_score >= 40 ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                              {comp.competitor_score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed bg-indigo-50 p-4 rounded-xl border border-indigo-100 italic">
                          "{comp.competitor_content || '未检测到相关内容'}"
                        </p>
                      </div>
                    </div>

                    {/* Gap Analysis & Recommendation */}
                    <div className="bg-slate-50 px-8 py-4 space-y-2 border-t border-slate-100">
                      {comp.gap_analysis && (
                        <div className="flex gap-2 items-start">
                          <Search size={14} className="text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 font-medium leading-relaxed"><span className="font-black text-rose-600">差距：</span>{comp.gap_analysis}</p>
                        </div>
                      )}
                      {comp.recommendation && (
                        <div className="flex gap-2 items-start">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 font-medium leading-relaxed"><span className="font-black text-emerald-600">建议：</span>{comp.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. 竞品差距维度 */}
          {competitorGaps.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FileSearch size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">核心维度差距评估 (Core Dimension Assessment)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pl-4">
                {competitorGaps.map((gap: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h5 className={`text-sm font-black flex items-center gap-2 ${gap.impact === '极高' || gap.impact === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                      <Zap size={16} /> {gap.dimension}
                      <span className="text-[10px] ml-2 px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100">{gap.impact}</span>
                    </h5>
                    <p className="text-sm text-slate-500 font-medium leading-loose pl-6 border-l-2 border-rose-100">
                      {gap.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Deep Analysis Score (Phase 3) */}
          {score && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Layers size={20} className="text-violet-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">GEO 健康度深度审计 (Deep Audit Score)</h4>
              </div>
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row gap-12 items-center">
                {/* Overall Score Circle */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-violet-500"
                      strokeDasharray={440} strokeDashoffset={440 - (440 * score.overall / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{score.overall}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">综合得分</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="flex-1 w-full space-y-6">
                  {score.authority !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-indigo-300">AUTHORITY (权威度)</span>
                        <span>{score.authority}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${score.authority}%` }}></div>
                      </div>
                    </div>
                  )}
                  {score.structure !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-emerald-300">STRUCTURE (结构化)</span>
                        <span>{score.structure}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${score.structure}%` }}></div>
                      </div>
                    </div>
                  )}
                  {report.meta?.kb_stats && (
                    <div className="pt-4 mt-4 border-t border-white/10 flex gap-6 text-[10px] text-slate-400">
                      <span>基于知识库数据: {report.meta.kb_stats.page_count} 页面</span>
                      <span>样本量: {report.meta.kb_stats.total_size_mb} MB</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 3. 实体与标记缺位审计 */}
          {(entityGaps.length > 0 || structuralBlindspots.length > 0 || missingKeywords.length > 0 || structuralGaps.length > 0) && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">实体与标记缺位审计 (Entity & Markup Audit)</h4>
              </div>
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-10">

                {/* Entity Gaps from Deep Analysis */}
                {entityGaps.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest">待补全核心实体类 (Deep Analyzed)</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {entityGaps.map((gap: any, i: number) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-sm">#{gap.entity}</span>
                            <span className="text-[10px] text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded uppercase">Missing</span>
                          </div>
                          <p className="text-xs text-slate-400">竞品用法: {gap.competitor_usage}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords from API */}
                {missingKeywords.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest">缺失关键词簇 (Missing Keyword Clusters)</h5>
                    {missingKeywords.map((cluster: any, i: number) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white text-sm">{cluster.cluster}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${cluster.priority === '高' ? 'text-rose-400 bg-rose-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                            优先级: {cluster.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(cluster.keywords || []).map((kw: string, j: number) => (
                            <span key={j} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold">{kw}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {entityGaps.length > 0 && (structuralBlindspots.length > 0 || structuralGaps.length > 0) && (
                  <div className="h-px bg-white/10 w-full"></div>
                )}

                {/* Structural Blindspots from Deep Analysis */}
                {structuralBlindspots.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest">结构化盲点 (Structural Blindspots)</h5>
                    <div className="space-y-3">
                      {structuralBlindspots.map((blindspot: any, i: number) => (
                        <div key={i} className="flex gap-3 bg-amber-400/5 p-4 rounded-xl border border-amber-400/10">
                          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-amber-200">{blindspot.component}</div>
                            <p className="text-xs text-amber-500/80 mt-1">{blindspot.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structural Gaps from Shallow Analysis */}
                {structuralGaps.length > 0 && structuralBlindspots.length === 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest">结构化差距 (Structural Gaps)</h5>
                    <div className="space-y-3">
                      {structuralGaps.map((gap: any, i: number) => (
                        <div key={i} className="flex gap-3 bg-amber-400/5 p-4 rounded-xl border border-amber-400/10">
                          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-amber-200">{gap.component}</div>
                            <p className="text-xs text-amber-500/80 mt-1">{gap.whyNeeded}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 4. 执行建议 */}
          {suggestions.length > 0 && (
            <section className="space-y-8 pb-10">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">执行建议 (Execution Roadmap)</h4>
              </div>
              <div className="space-y-4">
                {suggestions.map((sug: any, i: number) => (
                  <div key={i} className="flex gap-6 items-start p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-lg shrink-0">
                      {sug.timeframe || sug.term || `建议 ${i + 1}`}
                    </span>
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">{sug.action}</p>
                    {sug.expectedOutcome && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shrink-0">
                        预期: {sug.expectedOutcome}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fallback: no data at all */}
          {!summary && competitorGaps.length === 0 && !score && entityGaps.length === 0 && missingKeywords.length === 0 && suggestions.length === 0 && (
            <div className="text-center py-20">
              <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-black text-slate-400">暂无分析数据</h4>
              <p className="text-sm text-slate-400 mt-2">API 返回的报告不包含可展示的差距分析维度。请检查后端配置。</p>
            </div>
          )}
        </div>

        {/* 底部行动区域 */}
        <div className="bg-slate-50 border-t border-slate-200 p-12 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-10 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3"
          >
            <ArrowLeft size={20} /> 返回智能侦察
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pr-2">（付费操作：消耗 GEO 算力点数）</span>
            <button
              onClick={onNext}
              className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-500/40 hover:bg-slate-900 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
            >
              生成话题/内容矩阵
              <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapReportView;
