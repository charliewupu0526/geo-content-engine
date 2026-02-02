
import React, { useState, useEffect, useMemo } from 'react';
import { Project, KeywordItem, ContentBranch } from '../types';
import { generateProductionMatrix } from '../services/geminiService';
import { 
  Zap, 
  Layers, 
  FileText, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Hash,
  LayoutGrid,
  Sparkles,
  Search,
  ChevronRight,
  ArrowLeft,
  X,
  Edit3,
  Check,
  Filter
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  report: any | null;
  onStartTasks: (tasks: any[]) => void;
}

const ProductionView: React.FC<Props> = ({ activeProject, report, onStartTasks }) => {
  const [step, setStep] = useState<'setup' | 'selection'>('setup');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<ContentBranch[]>(['Article']);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // 搜索与过滤
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // 编辑弹窗
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    if (report?.missingKeywords) {
      const topKws = report.missingKeywords.flatMap((c: any) => c.keywords).slice(0, 4);
      setSelectedKeywords(topKws);
    }
  }, [report]);

  const toggleBranch = (branch: ContentBranch) => {
    if (selectedBranches.includes(branch)) {
      if (selectedBranches.length > 1) setSelectedBranches(selectedBranches.filter(b => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleGenerateTitles = async () => {
    if (selectedKeywords.length === 0) return alert('请先选择核心关键词');
    setIsGenerating(true);
    setIsReady(false);
    const data = await generateProductionMatrix(selectedKeywords, selectedBranches, activeProject?.companyProfile);
    setMatrix(data.map((item: any) => ({ 
      ...item, 
      id: Math.random().toString(36).substr(2, 9), 
      selected: true,
      estimatedWords: item.estimatedWords || (item.branch === 'Article' ? 2000 : 300)
    })));
    setIsGenerating(false);
    setIsReady(true);
  };

  const filteredMatrix = useMemo(() => {
    return matrix.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.keyword.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || item.branch === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [matrix, searchTerm, typeFilter]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setMatrix(matrix.map(m => m.id === editingItem.id ? editingItem : m));
    setEditingItem(null);
  };

  if (step === 'setup') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">选题/分支选择</h2>
          </div>
          <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            站点连接状态：<span className="text-emerald-500">已就绪 (geektech.io)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧：选择关键词 */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Hash size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">选择关键词 (Entity Selection)</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">从智能分析中提取的高权重实体</p>
                </div>
              </div>
              {isReady && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl animate-in zoom-in">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">选题矩阵已生成</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {report?.missingKeywords?.flatMap((c: any) => c.keywords).map((kw: string) => (
                <button
                  key={kw}
                  onClick={() => setSelectedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw])}
                  className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all border text-left flex items-center justify-between group ${
                    selectedKeywords.includes(kw) 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20' 
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <span className="truncate">{kw}</span>
                  {selectedKeywords.includes(kw) && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：选择分支 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#0F172A] text-white rounded-[3rem] p-10 shadow-2xl flex-1 flex flex-col">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-8 flex items-center gap-2">
                <Sparkles size={14} /> 生成分支选择 (多选)
              </h4>
              <div className="space-y-4 flex-1">
                <button 
                  onClick={() => toggleBranch('Article')}
                  className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between group ${
                    selectedBranches.includes('Article') ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${selectedBranches.includes('Article') ? 'bg-white/20' : 'bg-white/5'}`}>
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black">结构化深度文章</div>
                    </div>
                  </div>
                  {selectedBranches.includes('Article') && <Check size={18} />}
                </button>
                <button 
                  onClick={() => toggleBranch('Social')}
                  className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between group ${
                    selectedBranches.includes('Social') ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${selectedBranches.includes('Social') ? 'bg-white/20' : 'bg-white/5'}`}>
                      <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black">社交媒体图文</div>
                    </div>
                  </div>
                  {selectedBranches.includes('Social') && <Check size={18} />}
                </button>
              </div>
              
              <button 
                onClick={handleGenerateTitles}
                disabled={isGenerating}
                className={`mt-10 w-full py-5 rounded-2xl font-black shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                  isReady ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-cyan-400'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : (isReady ? <CheckCircle2 size={20} /> : <Zap size={20} />)}
                {isReady ? '重新生成选题' : '开始选题生成'}
              </button>
            </div>
            
            <button 
              onClick={() => {
                if (isReady) {
                  setStep('selection');
                } else {
                  alert('请先点击“开始选题生成”以准备内容矩阵。');
                }
              }} 
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isReady 
                  ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl' 
                  : 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              下一步 (预览清单)
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4 duration-700 pb-20">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">标题清单选择</h2>
        </div>
        <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          站点连接状态：<span className="text-emerald-500">已就绪 (geektech.io)</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索关键词/标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-600 outline-none cursor-pointer"
            >
              <option value="All">类型筛选</option>
              <option value="Article">深度文章</option>
              <option value="Social">社交媒体</option>
            </select>
          </div>
          
          <button 
            onClick={() => onStartTasks(matrix.filter(m => m.selected))}
            className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-500/30 hover:bg-slate-900 transition-all flex items-center gap-3 active:scale-95"
          >
            开始生成内容矩阵 <ArrowRight size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6 w-16 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredMatrix.length > 0 && filteredMatrix.every(m => m.selected)}
                    onChange={(e) => setMatrix(matrix.map(m => filteredMatrix.some(fm => fm.id === m.id) ? { ...m, selected: e.target.checked } : m))}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-6 min-w-[300px]">标题</th>
                <th className="px-6 py-6">关键词</th>
                <th className="px-6 py-6">类型分支</th>
                <th className="px-6 py-6">字数规模</th>
                <th className="px-10 py-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMatrix.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-all group ${item.selected ? 'bg-indigo-50/10' : ''}`}>
                  <td className="px-8 py-6 text-center">
                    <input 
                      type="checkbox" 
                      checked={item.selected}
                      onChange={() => setMatrix(matrix.map(m => m.id === item.id ? { ...m, selected: !m.selected } : m))}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-black text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">#{item.keyword}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${
                      item.branch === 'Article' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-indigo-600 border-indigo-200'
                    }`}>
                      {item.branch === 'Article' ? '深度文章' : '社媒分发'}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-bold text-slate-500">{item.estimatedWords} 字</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setEditingItem({...item})}
                      className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
           <button 
            onClick={() => setStep('setup')}
            className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
           >
             <ArrowLeft size={18} /> 返回上一步
           </button>
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
             共选中 {matrix.filter(m => m.selected).length} 个生成任务
           </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <header className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                     <Edit3 size={24} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">编辑标题弹窗</h3>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
             </header>

             <form onSubmit={handleSaveEdit} className="p-10 space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">标题 (Title)</label>
                   <input 
                    type="text" 
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">类型分支</label>
                     <select 
                      value={editingItem.branch}
                      onChange={(e) => setEditingItem({...editingItem, branch: e.target.value as ContentBranch})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none cursor-pointer"
                     >
                       <option value="Article">深度文章</option>
                       <option value="Social">社交媒体图文</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">字数设置</label>
                     <input 
                      type="number" 
                      value={editingItem.estimatedWords}
                      onChange={(e) => setEditingItem({...editingItem, estimatedWords: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">关键词 (Entity Tag)</label>
                   <input 
                    type="text" 
                    value={editingItem.keyword}
                    onChange={(e) => setEditingItem({...editingItem, keyword: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">取消</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-slate-900 transition-all uppercase tracking-widest text-xs">保存</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductionView;
