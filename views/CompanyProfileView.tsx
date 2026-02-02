
import React, { useState } from 'react';
import { Project, CompanyProfile } from '../types';
import { Database, Info, CheckCircle, Loader2, Search, ArrowRight, Zap, Target, Layout, Globe, FileText } from 'lucide-react';

interface Props {
  activeProject: Project | null;
  onUpdate: (profile: CompanyProfile) => void;
}

const CompanyProfileView: React.FC<Props> = ({ activeProject, onUpdate }) => {
  const [profile, setProfile] = useState<CompanyProfile>(activeProject?.companyProfile || {
    industry: '',
    region: '',
    targetAudience: '',
    productName: '',
    uniqueSellingPoint: '',
    landingPage: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(profile);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 shrink-0">
              <FileText size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">品牌情报核心录入</h3>
               <p className="text-slate-500 font-medium mt-1 text-lg">定义您的战略景观，为 AI 引擎提供底层逻辑指引。</p>
            </div>
          </div>
          <div className="px-5 py-2 bg-slate-900 rounded-2xl text-[10px] font-black uppercase text-white tracking-[0.2em] shadow-lg">精准录入模式</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Layout size={14} className="text-indigo-400" /> 所属行业
              </label>
              <input 
                type="text" 
                value={profile.industry}
                onChange={(e) => setProfile({...profile, industry: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                placeholder="例如：AI SaaS 自动化"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Globe size={14} className="text-indigo-400" /> 目标地区
              </label>
              <input 
                type="text" 
                value={profile.region}
                onChange={(e) => setProfile({...profile, region: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                placeholder="例如：华东地区、北美、APAC"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Target size={14} className="text-indigo-400" /> 目标受众 (Audience Segmentation)
            </label>
            <input 
              type="text" 
              value={profile.targetAudience}
              onChange={(e) => setProfile({...profile, targetAudience: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
              placeholder="例如：CTO、数字营销经理、中小企业主"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">产品/品牌官方名称</label>
              <input 
                type="text" 
                value={profile.productName}
                onChange={(e) => setProfile({...profile, productName: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">转化落地页 (URL)</label>
              <input 
                type="url" 
                value={profile.landingPage}
                onChange={(e) => setProfile({...profile, landingPage: e.target.value})}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">核心卖点与差异化 (USP)</label>
            <textarea 
              rows={5}
              value={profile.uniqueSellingPoint}
              onChange={(e) => setProfile({...profile, uniqueSellingPoint: e.target.value})}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-800 resize-none leading-relaxed"
              placeholder="在生成式搜索（GEO）环境中，是什么让您的品牌在 AI 答案中不可替代？"
            />
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-4 group"
            >
              锁定品牌资料并开启智能侦察
              <ArrowRight size={26} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfileView;
