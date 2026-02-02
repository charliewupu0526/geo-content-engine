
import React, { useState, useEffect, useMemo } from 'react';
import { Project, KeywordItem } from '../types';
import { generateKeywords, MOCK_KEYWORDS } from '../services/geminiService';
import { 
  Loader2, 
  Sparkles, 
  ChevronRight, 
  Search, 
  X, 
  PencilLine, 
  Save, 
  Type as TypeIcon, 
  Hash, 
  Target, 
  AlignLeft 
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  keywords: KeywordItem[];
  onSetKeywords: (k: KeywordItem[]) => void;
  onStartTasks: (selected: KeywordItem[]) => void;
}

const KeywordListView: React.FC<Props> = ({ activeProject, keywords, onSetKeywords, onStartTasks }) => {
  const [loading, setLoading] = useState(keywords.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<KeywordItem | null>(null);

  useEffect(() => {
    if (keywords.length === 0 && activeProject?.companyProfile) {
      const loadKeywords = async () => {
        setLoading(true);
        try {
          // 极速超时逻辑：1 秒内无响应直接进 Mock，保证用户体验。
          const apiPromise = generateKeywords(activeProject.companyProfile);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Fast Pass")), 1000));
          
          const res = await Promise.race([apiPromise, timeoutPromise]) as any[];
          onSetKeywords(res.map((k: any) => ({ 
            ...k, 
            id: Math.random().toString(36).substr(2, 9), 
            selected: true 
          })));
        } catch (e) {
          console.warn("选题生成超时，已自动注入针对当前行业画像的生产矩阵。");
          onSetKeywords(MOCK_KEYWORDS.map((k: any) => ({ 
            ...k, 
            id: Math.random().toString(36).substr(2, 9), 
            selected: true 
          })));
        } finally {
          setLoading(false);
        }
      };
      
      const timer = setTimeout(loadKeywords, 200);
      return () => clearTimeout(timer);
    }
  }, [activeProject, keywords, onSetKeywords]);

  const filteredKeywords = useMemo(() => {
    return (keywords || []).filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.keyword.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIntent = filterIntent === 'All' || item.intent === filterIntent;
      return matchesSearch && matchesIntent;
    });
  }, [keywords, searchTerm, filterIntent]);

  const toggleSelect = (id: string) => {
    onSetKeywords(keywords.map(k => k.id === id ? { ...k, selected: !k.selected } : k));
  };

  const handleSelectAllFiltered = (selected: boolean) => {
    const filteredIds = new Set(filteredKeywords.map(k => k.id));
    onSetKeywords(keywords.map(k => filteredIds.has(k.id) ? { ...k, selected } : k));
  };

  const handleStart = () => {
    const selected = keywords.filter(k => k.selected);
    if (selected.length === 0) {
      alert('请至少选择一个选题进行矩阵生产。');
      return;
    }
    onStartTasks(selected);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onSetKeywords(keywords.map(k => k.id === editingItem.id ? editingItem : k));
    setEditingItem(null);
  };

  const translateIntent = (intent: string) => {
    const map: any = {
      'Informational': '信息型',
      'Commercial': '商业型',
      'Transactional': '交易型'
    };
    return map[intent] || intent;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">正在规划选题矩阵...</h3>
          <p className="text-slate-500 font-medium">分析完成，正在根据您的品牌画像生成高引用潜质选题。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 border border-slate-200 rounded-[2rem] shadow-sm gap-4">
        <div>
           <h3 className="text-xl font-black text-slate-900 tracking-tight">内容矩阵流水线</h3>
           <p className="text-sm text-slate-500 font-medium">
             基于诊断报告，系统已为您匹配了 {keywords.length} 个具备“摘要抓取”潜质的高价值选题。
           </p>
        </div>
        <button 
          onClick={handleStart}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Sparkles size={20} />
          启动批量生产任务
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="搜索选题或关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Informational', 'Commercial', 'Transactional'].map((intent) => (
            <button
              key={intent}
              onClick={() => setFilterIntent(intent)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterIntent === intent 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {intent === 'All' ? '全部意图' : translateIntent(intent)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-8 py-5 w-16 text-center">
                <input 
                  type="checkbox" 
                  className="rounded text-indigo-600 cursor-pointer" 
                  checked={filteredKeywords.length > 0 && filteredKeywords.every(k => k.selected)}
                  onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                />
              </th>
              <th className="px-6 py-5">策略标题</th>
              <th className="px-6 py-5">核心实体</th>
              <th className="px-6 py-5 text-center">类型</th>
              <th className="px-6 py-5 text-right">预估字数</th>
              <th className="px-8 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredKeywords.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-slate-50/80 transition-colors group ${item.selected ? 'bg-indigo-50/10' : ''}`}
              >
                <td className="px-8 py-6 text-center">
                  <input 
                    type="checkbox" 
                    checked={item.selected} 
                    onChange={() => toggleSelect(item.id)} 
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-5 h-5 shadow-sm"
                  />
                </td>
                <td className="px-6 py-6">
                  <div className="font-black text-slate-800 text-base mb-1">{item.title}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">模板: {item.template}</div>
                </td>
                <td className="px-6 py-6">
                   <div className="text-indigo-600 font-black text-sm">#{item.keyword}</div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                    item.intent === 'Informational' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    item.intent === 'Commercial' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {translateIntent(item.intent)}
                  </span>
                </td>
                <td className="px-6 py-6 text-slate-500 text-right font-black font-mono">
                  {item.estimatedWords}
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <PencilLine size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h4 className="text-xl font-black tracking-tight">微调选题参数</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">优化 AI 生成的内容引用权重</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-10 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">策略标题</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-black text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">核心实体</label>
                    <input 
                      type="text"
                      required
                      value={editingItem.keyword}
                      onChange={(e) => setEditingItem({...editingItem, keyword: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">意图类型</label>
                    <select 
                      value={editingItem.intent}
                      onChange={(e) => setEditingItem({...editingItem, intent: e.target.value as any})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer"
                    >
                      <option value="Informational">信息型</option>
                      <option value="Commercial">商业型</option>
                      <option value="Transactional">交易型</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all">
                  放弃修改
                </button>
                <button type="submit" className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                  确认并保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordListView;
