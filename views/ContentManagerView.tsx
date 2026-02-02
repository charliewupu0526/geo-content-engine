
import React, { useState, useMemo } from 'react';
import { TaskItem, Project } from '../types';
import { 
  Search, 
  Edit3, 
  Eye, 
  Globe, 
  ExternalLink, 
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  FileText,
  Save,
  Trash2,
  Maximize2,
  Layout,
  Type,
  Hash,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface Props {
  tasks: TaskItem[];
  activeProject: Project | null;
  onUpdateTask: (task: TaskItem) => void;
}

const ContentManagerView: React.FC<Props> = ({ tasks, activeProject, onUpdateTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');

  const publishedTasks = useMemo(() => {
    return tasks.filter(t => t.genStatus === 'Success');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return publishedTasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [publishedTasks, searchTerm]);

  const handleSyncToCMS = async () => {
    if (!editingTask) return;
    setIsSyncing(true);
    
    // 模拟同步到 WordPress 的网络延迟
    await new Promise(r => setTimeout(r, 2000));
    
    const updated = { ...editingTask, pubStatus: 'Success' as const, timestamp: Date.now() };
    onUpdateTask(updated);
    setIsSyncing(false);
    setEditingTask(null);
    alert('成功同步更新至 WordPress！');
  };

  const renderEditor = () => {
    if (!editingTask) return null;
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (confirm('确定要退出编辑吗？未保存的更改可能会丢失。')) setEditingTask(null);
              }} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm leading-tight">编辑 GEO 内容</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
                {activeProject?.domain} / {editingTask.id}
              </div>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setEditorMode('edit')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${editorMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Edit3 size={14} /> 编辑模式
            </button>
            <button 
              onClick={() => setEditorMode('preview')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${editorMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Eye size={14} /> 实时预览
            </button>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={handleSyncToCMS}
              disabled={isSyncing}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:bg-slate-400 disabled:shadow-none transition-all active:scale-95"
            >
              {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />}
              {isSyncing ? '正在同步更新...' : '更新至 WordPress'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* 主体编辑/预览区 */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-white min-h-full rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {editorMode === 'edit' ? (
                <div className="p-12 space-y-6 flex-1 flex flex-col">
                  <input 
                    type="text" 
                    className="w-full text-4xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-100 outline-none"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    placeholder="请输入文章标题..."
                  />
                  <div className="h-px bg-slate-100 w-full"></div>
                  <textarea 
                    className="w-full flex-1 text-slate-700 leading-relaxed border-none focus:ring-0 font-mono text-base resize-none outline-none"
                    value={editingTask.content}
                    onChange={(e) => setEditingTask({...editingTask, content: e.target.value})}
                    placeholder="在此输入您的 Markdown 正文内容..."
                  />
                </div>
              ) : (
                <div className="p-12 prose prose-slate max-w-none">
                  <h1 className="text-4xl font-black text-slate-900 mb-8 border-b pb-6 border-slate-100">{editingTask.title}</h1>
                  <div className="text-slate-700 leading-relaxed space-y-4">
                    {editingTask.content?.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧属性侧边栏 */}
          <div className="w-80 border-l border-slate-200 bg-white p-6 space-y-8 overflow-y-auto hidden lg:block">
             <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">SEO/GEO 状态</h4>
                <div className="space-y-3">
                   <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="text-[10px] text-green-600 font-bold uppercase mb-1">内容得分</div>
                      <div className="flex items-end gap-1">
                         <span className="text-2xl font-black text-green-700">92</span>
                         <span className="text-xs text-green-600 mb-1">/100</span>
                      </div>
                   </div>
                   <div className="flex items-center justify-between text-xs px-2">
                      <span className="text-slate-500">建议关键词密度</span>
                      <span className="font-bold text-slate-800">1.2% (优)</span>
                   </div>
                   <div className="flex items-center justify-between text-xs px-2">
                      <span className="text-slate-500">结构化 FAQ</span>
                      <span className="font-bold text-green-600 flex items-center gap-1">已检测 <CheckCircle2 size={12} /></span>
                   </div>
                </div>
             </section>

             <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">WordPress 元数据</h4>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">URL 别名 (Slug)</label>
                      <input 
                        type="text" 
                        value={editingTask.title.toLowerCase().replace(/\s+/g, '-')}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                        readOnly
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">文章分类</label>
                      <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                         <option>GEO 优化文章</option>
                         <option>行业洞察</option>
                         <option>产品教程</option>
                      </select>
                   </div>
                </div>
             </section>

             <div className="pt-4 mt-4 border-t border-slate-100">
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3">
                   <Sparkles className="text-indigo-600 shrink-0" size={20} />
                   <div className="text-xs text-indigo-700 leading-tight">
                      <strong>GEO 建议：</strong> 增加一段包含“对比”的列表，有助于在生成式答案中获得更高权重。
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderEditor()}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">已发布内容库</h3>
           <p className="text-sm text-slate-500">所有经过 AI 生成并已就绪的内容均在此统一管理与手动微调</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="搜索文章标题、关键词或 ID..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
              <FileText size={40} />
            </div>
            <h4 className="text-xl font-bold text-slate-400">暂无已生成内容</h4>
            <p className="text-slate-400 text-sm mt-2 max-w-sm">
              发布后的内容会自动出现在这里。请前往“选题策略”或“任务执行中心”开始生成流程。
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText size={100} />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                <div className="flex-1 space-y-3">
                   <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg">
                        <CheckCircle2 size={10} /> 已发布
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter">TASK_REF: {task.id.slice(0, 8)}</span>
                   </div>
                   <h4 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{task.title}</h4>
                   <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium text-indigo-600/70">
                        <Globe size={14} /> {activeProject?.domain || 'geektech.io'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Hash size={14} /> 关键词: {task.title.split(' ')[0]}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RefreshCw size={14} className="text-slate-400" /> 更新时间: {new Date(task.timestamp).toLocaleDateString()}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setEditingTask(task)}
                    className="h-11 px-6 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-slate-200 active:scale-95"
                   >
                     <Edit3 size={16} /> 修正正文
                   </button>
                   {task.url && (
                     <a 
                      href={task.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-11 w-11 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all border border-slate-200"
                      title="查看线上页面"
                     >
                       <ExternalLink size={18} />
                     </a>
                   )}
                   <button className="h-11 w-11 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200">
                      <Trash2 size={18} />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentManagerView;
