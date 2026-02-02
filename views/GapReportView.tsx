
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { generateGapReport, MOCK_GAP_REPORT } from '../services/geminiService';
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
  ArrowLeft
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  report: any | null;
  onSetReport: (r: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const GapReportView: React.FC<Props> = ({ activeProject, report, onSetReport, onNext, onBack }) => {
  const [loading, setLoading] = useState(!report);

  useEffect(() => {
    if (!report && activeProject?.companyProfile) {
      const loadReport = async () => {
        setLoading(true);
        try {
          const apiPromise = generateGapReport(activeProject.companyProfile, "系统已完成全网情报对齐。");
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Fast Pass")), 1500));
          
          const res = await Promise.race([apiPromise, timeoutPromise]);
          onSetReport(res);
        } catch (e) {
          onSetReport(MOCK_GAP_REPORT);
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
          <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">系统正在模拟 AI 搜索引擎抓取逻辑，识别内容与结构漏洞。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 顶部功能区：模块名称与站点状态 */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">竞品差距分析</h2>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
            站点连接状态：<span className="text-emerald-500">已就绪 (geektech.io)</span>
          </span>
        </div>
      </div>

      {/* 诊断报告展示区 */}
      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
           <div className="flex items-center gap-4">
              <ShieldAlert className="text-indigo-400" size={24} />
              <h3 className="text-xl font-black tracking-tighter uppercase italic">Diagnosis Report Display</h3>
           </div>
           <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Report ID: GEO-2025-0428</div>
        </div>

        <div className="p-12 md:p-16 space-y-16">
          
          {/* 1. 目标与摘要 */}
          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
                <Target size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">目标定位 (Optimization Target)</h4>
             </div>
             <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
               "{activeProject?.name}：在 2025 年 Q3 前建立在生成式搜索中的核心实体权威，目标是通过高质量的结构化内容占据行业关键词的 AI 摘要首位。"
             </p>
          </section>

          {/* 2. 核心维度差距评估 */}
          <section className="space-y-8">
             <div className="flex items-center gap-3 mb-2">
                <FileSearch size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">核心维度差距评估 (Core Dimension Assessment)</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pl-4">
                <div className="space-y-4">
                   <h5 className="text-sm font-black text-rose-600 flex items-center gap-2">
                      <Zap size={16} /> 权威度差距 (Authority Gap)
                   </h5>
                   <p className="text-sm text-slate-500 font-medium leading-loose pl-6 border-l-2 border-rose-100">
                     当前站点核心页面缺少至少 <span className="text-rose-600 font-black">50%</span> 的行业专家背书引用。与竞品 HubSpot 相比，外部真实案例的引用深度不足，导致 AI 抓取时的可信度权重较低。
                   </p>
                </div>
                <div className="space-y-4">
                   <h5 className="text-sm font-black text-amber-600 flex items-center gap-2">
                      <Layers size={16} /> 结构化差距 (Structural Gap)
                   </h5>
                   <p className="text-sm text-slate-500 font-medium leading-loose pl-6 border-l-2 border-amber-100">
                     现存内容中 <span className="text-amber-600 font-black">70%</span> 属于 AI 难以结构化提取的纯长文本。缺乏“AI 易读的模块化内容”，如 Markdown 数据矩阵、对比表格和明确的层级标题。
                   </p>
                </div>
             </div>
          </section>

          {/* 3. 待补全实体类与 Schema 标记 */}
          <section className="space-y-8">
             <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">实体与标记缺位审计 (Entity & Markup Audit)</h4>
             </div>
             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-10">
                <div className="space-y-4">
                   <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest">待补全核心实体类</h5>
                   <div className="flex flex-wrap gap-3">
                      {["#GenerativeSearch", "#RAGArchitecture", "#SemanticSEO", "#E-E-A-T-Framework"].map(tag => (
                        <span key={tag} className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">{tag}</span>
                      ))}
                   </div>
                   <p className="text-[11px] text-slate-500 italic mt-2">提示：不只是在文中列出关键词，需围绕上述实体产出具有独立观点的“话题内容”。</p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <div className="space-y-4">
                   <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest">Schema.org 结构化资料标记缺口</h5>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <AlertCircle size={14} className="text-amber-500" />
                         <span className="text-sm font-mono text-slate-300">具体的 <span className="text-amber-300">JSON-LD</span> 标记严重缺失：Review, FAQPage, TechnicalArticle 节点未对齐。</span>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* 4. 执行建议 */}
          <section className="space-y-8 pb-10">
             <div className="flex items-center gap-3 mb-2">
                <Clock size={20} className="text-indigo-600" />
                <h4 className="text-base font-black text-slate-900 tracking-tight">分阶段执行建议 (Execution Roadmap)</h4>
             </div>
             <div className="space-y-4">
                {[
                  { term: "短期建议 (1-2周)", action: "立即重构核心落地页，注入 FAQ 模块与专家引文，补全基础 Schema 标记。" },
                  { term: "中期建议 (1-2月)", action: "产出针对“实体聚类”的深度文章矩阵，建立行业实体的强关联引用。" },
                  { term: "长期建议 (3个月+)", action: "通过持续的内容更新与数据矩阵建设，稳固 AI 搜索引擎的权威源地位。" },
                ].map((sug, i) => (
                  <div key={i} className="flex gap-6 items-start p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-lg shrink-0">{sug.term}</span>
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">{sug.action}</p>
                  </div>
                ))}
             </div>
          </section>
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
