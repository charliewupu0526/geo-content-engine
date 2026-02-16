
import React, { useState, useEffect, useMemo } from 'react';
import { Project, KeywordItem, GapReport } from '../types';
import { generateKeywordsEnhanced } from '../services/geminiService';
import { apiClient } from '../services/apiClient';
import {
  Loader2,
  Sparkles,
  ChevronRight,
  Search,
  X,
  PencilLine,
  RefreshCcw,
  Globe,
  Zap,
  Bot,
  TrendingUp,
  Target,
  ArrowRight
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  keywords: KeywordItem[];
  report: GapReport | null;
  competitors: any[];
  onSetKeywords: (k: KeywordItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SOURCE_CONFIG = {
  google_serp: {
    label: 'Google SERP',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    dot: 'bg-blue-500'
  },
  competitor_gap: {
    label: '竞品差距',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500'
  },
  ai_generated: {
    label: 'AI 推荐',
    icon: Bot,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    dot: 'bg-violet-500'
  }
};

const KeywordListView: React.FC<Props> = ({
  activeProject, keywords, report, competitors, onSetKeywords, onNext, onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [filterIntent, setFilterIntent] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<KeywordItem | null>(null);
  const [sourcesStatus, setSourcesStatus] = useState<any>({});
  const [errorMsg, setErrorMsg] = useState('');

  const loadKeywords = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const projectId = activeProject?.id;
      // 1. Try to fetch saved keywords first (unless refreshing)
      if (projectId && !isRefresh) {
        const saved = await apiClient.getProjectKeywords(projectId);
        if (saved.success && saved.data && (saved.data as any[]).length > 0) {
          const formatted = (saved.data as any[]).map((k: any) => ({
            ...k.data, // Unpack the stored data
            id: k.id || k.data.id || Math.random().toString(36).substr(2, 9),
            selected: true
          }));
          onSetKeywords(formatted);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // 2. If no saved keywords or refreshing, generate new ones
      const niche = activeProject?.companyProfile?.industry || activeProject?.name || '';
      const domain = activeProject?.domain || '';
      const profile = activeProject?.companyProfile || {};
      const gapReport = report || {};
      const competitorUrls = competitors.map((c: any) => c.url || c.website || '').filter(Boolean);

      // Pass project_id to save results automatically
      const generatedResult = await generateKeywordsEnhanced(
        niche, domain, profile, gapReport, competitorUrls, projectId
      );

      if (generatedResult.keywords.length > 0) {
        // ... (existing formatting logic) ...
        const formatted: KeywordItem[] = generatedResult.keywords.map((kw: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: kw.title || kw.keyword,
          keyword: kw.keyword,
          intent: kw.intent || 'Informational',
          estimatedWords: kw.estimatedWords || 1500,
          template: kw.template || 'Article',
          selected: true,
          source: kw.source || 'ai_generated',
          serpPosition: kw.serp_position || null,
          ourRanking: kw.our_ranking || null,
          snippet: kw.snippet || '',
          isLongTail: kw.is_long_tail || false,
          isQuestion: kw.is_question || false,
          cluster: kw.cluster || '',
          priority: kw.priority || ''
        }));
        onSetKeywords(formatted);
        setSourcesStatus(generatedResult.sources);

        // Save manually if backend didn't (because we didn't pass project_id)
        if (projectId && formatted.length > 0) {
          // We can use the new save endpoint if we exposed it? 
          // actually `generateKeywordsEnhanced` backend saves it IF project_id is present.
          // I need to ensure project_id is passed.
        }

      } else {
        setErrorMsg('未能发现任何关键词，请检查 API 配置');
      }
    } catch (e) {
      console.error('Keyword generation failed:', e);
      setErrorMsg('关键词生成失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Reload if project changes, or if initial load
    if (activeProject?.id) {
      // If we have keywords but they might be from another project, we should reload
      // But to avoid infinite loops if parent doesn't update, we check if we need to load.
      // Simplest fix: Just load when project ID changes.

      // Optimization: If keywords are empty, load. 
      // If project changed, we want to try loading saved keywords for THAT project.
      loadKeywords();
    }
  }, [activeProject?.id]);

  const filteredKeywords = useMemo(() => {
    return (keywords || []).filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keyword.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = filterSource === 'All' || item.source === filterSource;
      const matchesIntent = filterIntent === 'All' || item.intent === filterIntent;
      return matchesSearch && matchesSource && matchesIntent;
    });
  }, [keywords, searchTerm, filterSource, filterIntent]);

  const toggleSelect = (id: string) => {
    onSetKeywords(keywords.map(k => k.id === id ? { ...k, selected: !k.selected } : k));
  };

  const handleSelectAllFiltered = (selected: boolean) => {
    const filteredIds = new Set(filteredKeywords.map(k => k.id));
    onSetKeywords(keywords.map(k => filteredIds.has(k.id) ? { ...k, selected } : k));
  };

  const handleNext = () => {
    const selected = keywords.filter(k => k.selected);
    if (selected.length === 0) {
      alert('请至少选择一个关键词继续。');
      return;
    }
    onNext();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onSetKeywords(keywords.map(k => k.id === editingItem.id ? editingItem : k));
    setEditingItem(null);
  };

  const translateIntent = (intent: string) => {
    const map: Record<string, string> = {
      'Informational': '信息型',
      'Commercial': '商业型',
      'Transactional': '交易型'
    };
    return map[intent] || intent;
  };

  const sourceCount = (src: string) => keywords.filter(k => k.source === src).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="animate-spin text-indigo-600 relative" size={48} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">正在从三大数据源挖掘关键词...</h3>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Globe size={14} className="text-blue-500" /> Google SERP</span>
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> 竞品差距</span>
            <span className="flex items-center gap-1.5"><Bot size={14} className="text-violet-500" /> AI 推荐</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">关键词研究中心</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadKeywords(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '刷新中...' : '刷新 SERP 数据'}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
          >
            ← 返回
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mx-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-600 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Source summary cards */}
      <div className="grid grid-cols-3 gap-4 px-4">
        {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
          const count = sourceCount(key);
          const status = sourcesStatus[key];
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setFilterSource(filterSource === key ? 'All' : key)}
              className={`relative p-5 rounded-[2rem] border transition-all text-left ${filterSource === key
                ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterSource === key ? 'bg-white/10' : config.color.split(' ')[0]
                  }`}>
                  <Icon size={18} className={filterSource === key ? 'text-white' : config.color.split(' ')[1]} />
                </div>
                <span className={`text-2xl font-black ${filterSource === key ? 'text-white' : 'text-slate-800'}`}>
                  {count}
                </span>
              </div>
              <div className={`text-xs font-black uppercase tracking-widest ${filterSource === key ? 'text-slate-300' : 'text-slate-400'
                }`}>
                {config.label}
              </div>
              {status?.status === 'ok' && (
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${config.dot}`}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-wrap items-center gap-4 mx-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索关键词..."
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
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterIntent === intent
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {intent === 'All' ? '全部' : translateIntent(intent)}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm mx-4">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-5 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 cursor-pointer"
                  checked={filteredKeywords.length > 0 && filteredKeywords.every(k => k.selected)}
                  onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                />
              </th>
              <th className="px-4 py-5">关键词</th>
              <th className="px-4 py-5">来源</th>
              <th className="px-4 py-5 text-center">意图</th>
              <th className="px-4 py-5 text-center">排名</th>
              <th className="px-4 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredKeywords.map((item) => {
              const srcConfig = SOURCE_CONFIG[item.source || 'ai_generated'];
              const SrcIcon = srcConfig.icon;
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${item.selected ? 'bg-indigo-50/30' : ''}`}
                >
                  <td className="px-6 py-5 text-center">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-black text-slate-800 text-sm mb-1">{item.keyword}</div>
                    {item.snippet && (
                      <div className="text-xs text-slate-400 font-medium truncate max-w-[400px]">{item.snippet}</div>
                    )}
                    {item.isLongTail && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black uppercase">
                        <TrendingUp size={10} /> 长尾词
                      </span>
                    )}
                    {item.isQuestion && (
                      <span className="inline-flex items-center gap-1 mt-1 ml-1 text-[9px] px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full border border-sky-100 font-black uppercase">
                        问答型
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full font-black border ${srcConfig.color}`}>
                      <SrcIcon size={12} />
                      {srcConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${item.intent === 'Informational' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      item.intent === 'Commercial' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                      {translateIntent(item.intent)}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    {item.serpPosition ? (
                      <span className={`text-sm font-black ${item.serpPosition <= 3 ? 'text-emerald-600' :
                        item.serpPosition <= 10 ? 'text-amber-600' :
                          'text-slate-400'
                        }`}>
                        #{item.serpPosition}
                      </span>
                    ) : item.priority ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${item.priority === 'High' || item.priority === '高' || item.priority === '极高'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {item.priority}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-5 text-right">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <PencilLine size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredKeywords.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Target size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">暂无匹配的关键词</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mx-4">
        <div className="text-sm text-slate-500 font-medium">
          已选择 <span className="font-black text-indigo-600">{keywords.filter(k => k.selected).length}</span> / {keywords.length} 个关键词
        </div>
        <button
          onClick={handleNext}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Sparkles size={18} />
          开始内容生产 (Start Production)
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h4 className="text-xl font-black tracking-tight">编辑关键词</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">微调关键词参数</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-10 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">关键词</label>
                  <input
                    type="text"
                    required
                    value={editingItem.keyword}
                    onChange={(e) => setEditingItem({ ...editingItem, keyword: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-black text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">标题</label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">意图类型</label>
                    <select
                      value={editingItem.intent}
                      onChange={(e) => setEditingItem({ ...editingItem, intent: e.target.value as any })}
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
                  取消
                </button>
                <button type="submit" className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                  保存
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
