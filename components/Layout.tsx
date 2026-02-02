
import React from 'react';
import { 
  LayoutGrid, 
  FileText,
  Search,
  BarChart4,
  Cpu,
  Eye,
  Share2,
  Command,
  LayoutDashboard,
  ChevronRight,
  FolderOpen,
  LogOut as ExitIcon,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeProjectName: string | null;
  onExitProject: () => void;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, activeProjectName, onExitProject, userName }) => {
  const workflowStages = [
    { id: 'dashboard', label: '仪表看板', icon: LayoutDashboard },
    { id: 'gathering', label: '1. 资料录入', icon: FileText },
    { id: 'intelligence', label: '2. 智能侦察', icon: Search },
    { id: 'gap-analysis', label: '3. 差距分析', icon: BarChart4 },
    { id: 'production', label: '4. 内容生产', icon: Cpu },
    { id: 'results', label: '5. 结果展示', icon: Eye },
    { id: 'distribution', label: '发布配置', icon: Share2 },
  ];

  const isProjectActive = !!activeProjectName;
  const showWorkflowMenu = isProjectActive;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* 侧边栏 */}
      <aside className="w-[280px] bg-[#020617] text-white flex flex-col shrink-0 transition-all duration-500 z-50 relative border-r border-white/5">
        <div className="p-8 flex flex-col h-full">
          
          {/* Logo & Project Section */}
          <div className="mb-12">
            {isProjectActive ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-5 rounded-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
                  <Sparkles size={60} />
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
                    <FolderOpen size={18} className="text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="text-xs font-black tracking-tight text-white truncate w-32 leading-none">
                      {activeProjectName}
                    </h1>
                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1.5">Project Active</p>
                  </div>
                </div>
                <button 
                  onClick={onExitProject}
                  className="absolute bottom-3 right-3 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm group/btn"
                >
                  <ExitIcon size={12} />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onTabChange('projects')}
              >
                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                  <Command size={22} className="text-white" />
                </div>
                <h1 className="text-xl font-black tracking-tighter uppercase italic tracking-[0.1em]">GEO<span className="text-indigo-500">ENGINE</span></h1>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-10 overflow-y-auto no-scrollbar pr-2">
            <div>
              <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Core Center</p>
              <button
                onClick={() => onTabChange('projects')}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <LayoutGrid size={18} />
                  <span className="font-bold text-sm">项目管理</span>
                </div>
                {activeTab !== 'projects' && <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />}
              </button>
            </div>

            {showWorkflowMenu && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Pipeline</p>
                <div className="space-y-1">
                  {workflowStages.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl transition-all duration-300 group relative ${
                        activeTab === item.id 
                          ? 'bg-white/10 text-white border border-white/10' 
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={16} className={activeTab === item.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'} />
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                      {activeTab === item.id && <div className="absolute right-4 w-1 h-3 bg-indigo-500 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="pt-8 border-t border-white/5">
            <div 
              onClick={() => onTabChange('profile')}
              className={`flex items-center gap-3 p-3 rounded-[1.5rem] cursor-pointer hover:bg-white/5 transition-all group ${activeTab === 'profile' ? 'bg-white/5 border border-white/10' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                {userName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate text-slate-200">{userName}</p>
                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Settings Center</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto flex flex-col relative bg-[#F8FAFC]">
        <header className="h-20 glass border-b border-slate-200/50 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-5">
             <h2 className="text-lg font-black text-slate-900 tracking-tight animate-in fade-in duration-500 uppercase">
                {activeTab === 'profile' 
                  ? 'Account & Settings' 
                  : (activeTab === 'projects' 
                      ? 'Global Projects' 
                      : (() => {
                          const stage = workflowStages.find(s => s.id === activeTab);
                          if (!stage) return 'Dashboard';
                          // 解析标题，过滤掉 "1. " 这种序号
                          return stage.label.includes('. ') ? stage.label.split('. ')[1] : stage.label;
                        })()
                    )
                }
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Agent Active</span>
             </div>
          </div>
        </header>

        <div className="p-10 max-w-[1440px] mx-auto w-full flex-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
