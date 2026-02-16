
import React, { useState, useEffect, useMemo } from 'react';
import { TaskItem, Project, ContentBranch, TaskBatch } from '../types';
import { apiClient } from '../services/apiClient';
import {
  FileText,
  Smartphone,
  Eye,
  Zap,
  X,
  Share2,
  Loader2,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Activity,
  History,
  Clipboard,
  Edit,
  Download,
  Calendar,
  Layers,
  Search,
  AlertCircle,
  Copy,
  Layout as LayoutIcon,
  ShieldAlert,
  CheckSquare,
  Square,
  ArrowLeft,
  Image as ImageIcon,
  Wand2,
  Check,
  Instagram,
  Twitter,
  Globe
} from 'lucide-react';

interface Props {
  batches: TaskBatch[];
  activeProject: Project | null;
  onUpdateBatches: (batches: TaskBatch[]) => void;
}

const TaskCenterView: React.FC<Props> = ({ batches, activeProject, onUpdateBatches }) => {
  const [viewTab, setViewTab] = useState<'queue' | 'history'>('queue');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(batches[0]?.id || null);
  const [activeFilter, setActiveFilter] = useState<ContentBranch | 'All'>('All');
  const [previewTask, setPreviewTask] = useState<TaskItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // 发布渠道选择弹窗状态
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingTasks, setPublishingTasks] = useState<TaskItem[]>([]);



  // 确保初始有活跃批次
  useEffect(() => {
    if (!activeBatchId && batches.length > 0) {
      setActiveBatchId(batches[0].id);
    }
  }, [batches, activeBatchId]);

  const activeBatch = batches.find(b => b.id === activeBatchId);
  const filteredTasks = (activeBatch?.tasks || []).filter(t => activeFilter === 'All' || t.branch === activeFilter);

  // 统计数据
  const stats = useMemo(() => {
    const allTasks = batches.flatMap(b => b.tasks);
    return {
      batchCount: batches.length,
      cumProduction: allTasks.filter(t => t.genStatus === 'Success').length,
      cumPublished: allTasks.filter(t => t.pubStatus === 'Success').length,
      queued: allTasks.filter(t => t.genStatus === 'Pending').length
    };
  }, [batches]);

  // 处理批量选择
  const handleToggleSelectAll = () => {
    const nextValue = !selectAll;
    setSelectAll(nextValue);
    const updatedBatches = batches.map(b => {
      if (b.id === activeBatchId) {
        return {
          ...b,
          tasks: b.tasks.map(t => {
            const isMatch = activeFilter === 'All' || t.branch === activeFilter;
            return isMatch ? { ...t, selected: nextValue } : t;
          })
        };
      }
      return b;
    });
    onUpdateBatches(updatedBatches);
  };

  const handleToggleTask = (taskId: string) => {
    const updatedBatches = batches.map(b => {
      if (b.id === activeBatchId) {
        return {
          ...b,
          tasks: b.tasks.map(t => t.id === taskId ? { ...t, selected: !t.selected } : t)
        };
      }
      return b;
    });
    onUpdateBatches(updatedBatches);
  };

  // Regenerate Modal State
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regenerateTask, setRegenerateTask] = useState<TaskItem | null>(null);
  const [regenerateFeedback, setRegenerateFeedback] = useState('');

  const handleAction = async (task: TaskItem, action: string) => {
    setIsProcessingAction(true);

    if (action === 'Regenerate') {
      setRegenerateTask(task);
      setRegenerateFeedback("优化这段内容，使其更具吸引力"); // Default prompt
      setRegenerateModalOpen(true);
      setIsProcessingAction(false);
      return;
    } else if (action === 'Save') {
      // Logic to save to DB if needed, currently just updates local state
      updateTaskState(task);
      alert('保存更新成功！');
    } else if (action === 'Publish') {
      // This is handled by openPublishModal usually, but for quick publish:
      alert('请使用底部的"发布批次"按钮进行批量发布');
    }

    setIsProcessingAction(false);
  };

  const confirmRegeneration = async () => {
    if (!regenerateTask || !regenerateFeedback) return;

    setRegenerateModalOpen(false);
    // Optimistically update UI to show loading if needed, or just let the user wait
    const currentTask = regenerateTask;

    // We can show a loading state in the preview or list if we want, 
    // but for now let's just do the async call

    try {
      // Show some global loading or toast? For now, we'll just rely on the existing update logic
      // But since we closed the modal, maybe we want to keep it open with a loader?
      // Let's close it and update the Task to a "Generating" state ideally, 
      // but the current type system might mostly support "Pending".
      // Let's just block the UI slightly or show an alert after.

      const res = await apiClient.regenerateContent(currentTask.content || "", regenerateFeedback, currentTask.branch);
      if (res.success && res.data) {
        const updated = { ...currentTask, content: (res.data as any).content, genStatus: 'Success' as const };
        updateTaskState(updated);
        if (previewTask && previewTask.id === currentTask.id) {
          setPreviewTask(updated);
        }
        alert('内容已根据您的意见重新生成！');
      } else {
        alert('重生成失败: ' + (res.error || '未知错误'));
      }
    } catch (e) {
      alert('系统错误');
    } finally {
      setRegenerateTask(null);
      setRegenerateFeedback('');
    }
  };

  const updateTaskState = (updatedTask: TaskItem) => {
    const updatedBatches = batches.map(b => {
      if (b.id === activeBatchId) {
        return {
          ...b,
          tasks: b.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        };
      }
      return b;
    });
    onUpdateBatches(updatedBatches);
  };

  const openPublishModal = () => {
    const selected = filteredTasks.filter(t => t.selected);
    if (selected.length === 0) {
      alert('请先选择需要发布的任务');
      return;
    }
    setPublishingTasks(selected);
    setPublishModalOpen(true);
  };

  // --------------------------------------------------------------------------
  // 预览沉浸式布局 (根据手绘稿 1 和 2)
  // --------------------------------------------------------------------------
  if (previewTask) {
    return (
      <div className="flex flex-col h-full bg-[#F8FAFC] animate-in fade-in duration-500 overflow-hidden -m-12 min-h-screen">
        {/* 顶部栏 */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPreviewTask(null)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all font-black text-slate-500 text-sm group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {previewTask.branch === 'Article' ? '深化文章内容预览' : '社媒内容预览'}
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest mr-4 flex items-center gap-2 shadow-sm shadow-emerald-100/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              站点连接状态：<span className="text-emerald-500">已就绪</span>
            </div>
            <button
              onClick={() => handleAction(previewTask, 'Regenerate')}
              className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              {isProcessingAction ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 重新生成
            </button>
            <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <Eye size={16} /> 预览
            </button>
            <button
              onClick={() => handleAction(previewTask, 'Publish')}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
            >
              <Share2 size={16} /> 保存/更新发布
            </button>
          </div>
        </header>

        {/* 内容主体 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧详情区 */}
          <div className="flex-1 overflow-y-auto p-12 bg-slate-50/40 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-10">
              {/* 标题控制块 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">标题</label>
                <textarea
                  value={previewTask.title}
                  onChange={(e) => setPreviewTask({ ...previewTask, title: e.target.value })}
                  className="w-full text-3xl font-black text-slate-900 bg-transparent text-center focus:outline-none border-b-2 border-slate-100 focus:border-indigo-400 pb-3 transition-all resize-none overflow-hidden"
                  rows={Math.max(1, Math.ceil(previewTask.title.length / 25))}
                  style={{ minHeight: '60px' }}
                />
              </div>

              {previewTask.branch === 'Article' ? (
                /* 深度文章布局 */
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-sm min-h-[800px] flex flex-col">
                  <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
                    <FileText className="text-indigo-600" size={24} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">生成内容 (Generated Content)</span>
                  </div>
                  <textarea
                    className="flex-1 w-full text-slate-700 leading-relaxed font-medium text-xl focus:outline-none resize-none bg-transparent no-scrollbar min-h-[600px]"
                    value={previewTask.content || ''}
                    placeholder="内容生成中..."
                    onChange={(e) => setPreviewTask({ ...previewTask, content: e.target.value })}
                  />
                </div>
              ) : (
                /* 社媒内容布局 (参考手绘稿 2) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm space-y-10">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Hook 导语 (Preview)</label>
                        <textarea
                          className="w-full bg-slate-50 rounded-2xl p-6 text-slate-800 font-bold border-none focus:ring-1 focus:ring-indigo-100 transition-all resize-none min-h-[100px]"
                          value={(() => {
                            const content = previewTask.content || "";
                            const parts = content.split('\n').filter(p => p.trim().length > 0);
                            return parts.length > 0 ? parts[0] : "";
                          })()}
                          placeholder="生成中..."
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">文章内容</label>
                        <textarea
                          className="w-full bg-slate-50 rounded-2xl p-6 text-slate-700 font-medium border-none focus:ring-1 focus:ring-indigo-100 transition-all resize-none min-h-[400px]"
                          value={previewTask.content || ''}
                          placeholder="内容生成中..."
                          onChange={(e) => setPreviewTask({ ...previewTask, content: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">标签 / Tag</label>
                        <input
                          className="w-full bg-slate-50 rounded-2xl p-6 text-indigo-600 font-black border-none focus:ring-1 focus:ring-indigo-100 transition-all"
                          value={(() => {
                            const content = previewTask.content || "";
                            const tags = content.match(/#[^\s#]+/g);
                            return tags ? tags.join(' ') : "";
                          })()}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* 配图栏 */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">封面</label>
                      <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-200 hover:text-indigo-400 cursor-pointer transition-all">
                        <ImageIcon size={48} />
                        <span className="text-[10px] font-black uppercase mt-2">上传封面</span>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">配图</label>
                      <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">配图</label>
                      <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧边栏：合规性与优化 */}
          <aside className="w-[380px] border-l border-slate-200 bg-white p-10 space-y-10 shrink-0 overflow-y-auto no-scrollbar">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform"><ShieldCheck size={180} /></div>
              <div className="flex items-center gap-3 relative z-10">
                <ShieldCheck className="text-indigo-400" size={24} />
                <h4 className="text-xs font-black uppercase tracking-widest">合规性检查</h4>
              </div>
              <div className="space-y-6 relative z-10">
                {[
                  { l: "GEO 对齐度", v: "98.2%", c: "text-emerald-400" },
                  { l: "幻觉识别", v: "Safe", c: "text-emerald-400" },
                  { l: "E-E-A-T 分值", v: "A+", c: "text-indigo-400" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.l}</span>
                    <span className={`text-sm font-black ${item.c}`}>{item.v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 italic leading-relaxed relative z-10">
                当前内容符合 Perplexity 与 SearchGPT 的结构化抓取规范。
              </p>
            </div>

            <div className="space-y-4 pt-6">
              <button className="w-full py-5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm group">
                <Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> AI 结构优化
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 发布方式弹窗 (根据手绘稿 3)
  // --------------------------------------------------------------------------
  const PublishModal = () => {
    if (!publishModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
          <header className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                <Share2 size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">发布方式弹窗 / 渠道选择</h3>
            </div>
            <button onClick={() => setPublishModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
          </header>

          <div className="p-10 flex-1 overflow-y-auto max-h-[500px] no-scrollbar">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-6">
              <div className="col-span-8">标题 (Title)</div>
              <div className="col-span-2 text-center">ins</div>
              <div className="col-span-2 text-center">X</div>
            </div>

            <div className="space-y-3">
              {publishingTasks.map(task => (
                <div key={task.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="col-span-8 font-black text-slate-800 text-sm truncate">{task.title}</div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => alert('已选择/取消 ins 渠道')}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${task.branch === 'Social' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-200'}`}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => alert('已选择/取消 X 渠道')}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${task.branch === 'Social' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-200'}`}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="p-10 border-t border-slate-100 bg-white flex justify-end gap-6">
            <button
              onClick={() => setPublishModalOpen(false)}
              className="px-12 py-4 border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={() => {
                alert('正在全渠道分发...');
                setPublishModalOpen(false);
              }}
              className="px-16 py-4 bg-rose-400 text-white rounded-2xl font-black shadow-xl hover:bg-slate-900 transition-all active:scale-95"
            >
              发布
            </button>
          </footer>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // 主列表视图
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Regeneration Modal */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Wand2 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">内容重生成优化</h3>
              </div>
              <button
                onClick={() => setRegenerateModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-500 font-medium">请告诉 AI 您希望如何调整这段内容。具体的指令（如"缩短篇幅"、"增加数据"）效果更好。</p>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">优化指令 (Prompt)</label>
                <textarea
                  value={regenerateFeedback}
                  onChange={(e) => setRegenerateFeedback(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  placeholder="例如：请让语气更专业一些，并补充关于 GEO 的具体案例..."
                  autoFocus
                />
              </div>
            </div>

            <footer className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setRegenerateModalOpen(false)}
                className="flex-1 py-3.5 border border-slate-200 rounded-xl font-black text-slate-500 hover:bg-white transition-all text-xs"
              >
                取消
              </button>
              <button
                onClick={confirmRegeneration}
                disabled={!regenerateFeedback.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap size={16} fill="currentColor" /> 开始重生成
              </button>
            </footer>
          </div>
        </div>
      )}

      <PublishModal />

      {/* 顶部统计卡片区 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '执行批次数量', value: stats.batchCount, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '累计生产', value: stats.cumProduction, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '累计发布', value: stats.cumPublished, icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '排队任务数量', value: stats.queued, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
            </div>
            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{stat.label}</h4>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 导航控制栏 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewTab('queue')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${viewTab === 'queue' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            任务队列
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${viewTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            历史批次
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
            站点连接状态：<span className="text-emerald-500">已就绪 ({activeProject?.domain || 'geektech.io'})</span>
          </span>
        </div>
      </div>

      {viewTab === 'queue' ? (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">{activeBatch?.name || '活跃执行任务队列'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {activeBatchId?.slice(-6) || 'BATCH-01'}</p>
                </div>
              </div>

              <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
                {['All', 'Article', 'Social'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f as any); setSelectAll(false); }}
                    className={`px-6 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {f === 'All' ? '全部' : f === 'Article' ? '深度文章' : '社交媒体'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-10 py-6 w-16 text-center">
                      <button
                        onClick={handleToggleSelectAll}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${selectAll ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-200 hover:border-indigo-300'}`}
                      >
                        {selectAll ? <CheckSquare size={14} /> : <Square size={14} />}
                      </button>
                    </th>
                    <th className="px-6 py-6 min-w-[300px]">任务标题</th>
                    <th className="px-6 py-6">状态</th>
                    <th className="px-6 py-6">链接地址</th>
                    <th className="px-10 py-6 text-right">操作动作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan={5} className="py-40 text-center text-slate-300 italic font-black">队列暂无任务记录...</td></tr>
                  ) : (
                    filteredTasks.map(task => (
                      <tr key={task.id} className={`group hover:bg-slate-50/50 transition-all ${task.selected ? 'bg-indigo-50/20' : ''}`}>
                        <td className="px-10 py-8 text-center">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center mx-auto transition-all ${task.selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-200 hover:border-indigo-300'}`}
                          >
                            {task.selected ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${task.branch === 'Article' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-violet-50 border-violet-100 text-violet-600'
                              }`}>
                              {task.branch === 'Article' ? <FileText size={18} /> : <Smartphone size={18} />}
                            </div>
                            <h5 className="text-sm font-black text-slate-800 leading-tight truncate max-w-sm group-hover:text-indigo-600 transition-colors">{task.title}</h5>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          {renderStatusBadge(task)}
                        </td>
                        <td className="px-6 py-8">
                          {task.pubStatus === 'Success' ? (
                            <a href="#" className="flex items-center gap-2 text-xs font-black text-indigo-500 hover:underline">
                              <ExternalLink size={14} /> 查看线上版本
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {renderTaskActions(task, setPreviewTask, handleAction)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-8 flex justify-between items-center">
              <button className="flex items-center gap-2 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 transition-all shadow-sm">
                <Download size={16} /> xml/csv 下载
              </button>
              <button
                onClick={openPublishModal}
                className="px-10 py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-3"
              >
                <Share2 size={18} /> 发布批次
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500 min-h-[500px]">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <History size={22} className="text-indigo-600" /> 历史批次存档
            </h4>
            <button className="px-6 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">时间筛选</button>
          </div>
          <div className="space-y-4">
            {batches.map(batch => (
              <div key={batch.id} className="p-8 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all flex items-center justify-between group">
                <div>
                  <h5 className="text-lg font-black text-slate-800">{batch.name}</h5>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(batch.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-black uppercase mb-1">规模</div>
                    <div className="text-xl font-black text-slate-900">{batch.tasks.length} 项</div>
                  </div>
                  <button
                    onClick={() => { setActiveBatchId(batch.id); setViewTab('queue'); }}
                    className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    查看批次详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const renderStatusBadge = (task: TaskItem) => {
  if (task.genStatus === 'Pending') return <div className="flex items-center gap-2 text-amber-500 font-black text-[11px] uppercase italic animate-pulse"><Loader2 size={14} className="animate-spin" /> 生成中...</div>;
  if (task.genStatus === 'Failed') return <div className="flex items-center gap-2 text-rose-500 font-black text-[11px] uppercase italic"><ShieldAlert size={14} /> 生产失败</div>;
  if (task.pubStatus === 'Success') return <div className="flex items-center gap-2 text-emerald-500 font-black text-[11px] uppercase italic"><CheckCircle size={14} /> 已发布</div>;
  if (task.pubStatus === 'Failed') return <div className="flex items-center gap-2 text-rose-500 font-black text-[11px] uppercase italic"><AlertCircle size={14} /> 发布失败</div>;
  return <div className="flex items-center gap-2 text-indigo-500 font-black text-[11px] uppercase italic"><CheckCircle size={14} /> 已产出</div>;
};

const renderTaskActions = (task: TaskItem, onPreview: (task: TaskItem) => void, onAction: (task: TaskItem, action: string) => void) => {
  const btn = "h-9 px-4 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 shadow-sm";
  const accentBtn = "h-9 px-4 bg-slate-900 text-white border border-slate-900 rounded-lg text-[10px] font-black hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-sm";

  if (task.genStatus === 'Failed') {
    return <button onClick={() => onAction(task, 'Regenerate')} className={accentBtn}><RefreshCw size={12} /> 重试</button>;
  }

  return (
    <>
      <button onClick={() => onPreview(task)} className={btn}><Eye size={12} /> 预览</button>
      <button onClick={() => alert('已复制 ID: ' + task.id)} className={btn}><Copy size={12} /> 复制</button>
      <button onClick={() => onPreview(task)} className={btn}><Edit size={12} /> 编辑</button>
      {task.pubStatus === 'Failed' && <button onClick={() => onAction(task, 'Publish')} className={accentBtn}><RefreshCw size={12} /> 重试发布</button>}
    </>
  );
};

export default TaskCenterView;
