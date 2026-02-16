
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Plus, Search, Globe, Calendar, LayoutGrid, Command, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onCreateProject: (name: string, domain: string) => void;
}

const ProjectListView: React.FC<Props> = ({ projects, onSelectProject, onCreateProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Control Center</h2>
          <p className="text-slate-400 font-bold mt-1 tracking-widest text-[10px] uppercase">Master your generative search presence</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter Projects..."
              className="pl-14 pr-6 py-4 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 w-full md:w-80 shadow-sm transition-all font-bold text-sm"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2.5 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[4rem] p-32 text-center flex flex-col items-center animate-float">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <Command size={40} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Workspace Empty</h3>
          <p className="text-slate-400 mt-4 max-w-sm font-bold uppercase tracking-widest text-[10px] leading-loose">
            Start your optimization journey by creating your first digital asset project.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-12 px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all active:scale-95 shadow-2xl text-xs uppercase tracking-[0.2em]"
          >
            Init First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-slate-200/60 rounded-[3rem] p-10 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer group relative overflow-hidden"
              onClick={() => onSelectProject(project)}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 group-hover:scale-125 transition-all duration-700 pointer-events-none">
                <Globe size={220} />
              </div>

              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  {(project.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${project.status === ProjectStatus.READY ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                  {project.status === ProjectStatus.READY ? 'Active' : (project.status || 'Draft')}
                </div>
              </div>

              <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors uppercase italic">{project.name || 'Untitled Project'}</h3>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-2 tracking-wide">
                  <Globe size={14} className="text-indigo-400" />
                  {project.domain || 'No Domain'}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  <Calendar size={14} />
                  Est. Apr 2025
                </div>
                <div className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建项目 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center z-[100] p-10 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-16 w-full max-w-2xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none animate-pulse">
              <Sparkles size={200} />
            </div>
            <div className="mb-12 text-center relative z-10">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Plus size={36} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Create Project</h3>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[9px]">Define your strategic digital landscape</p>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Internal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-black text-lg placeholder:text-slate-300"
                  placeholder="GeekTech SaaS..."
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Root Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-black text-lg placeholder:text-slate-300"
                  placeholder="domain.com..."
                />
              </div>
              <div className="flex gap-4 pt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-5 border-2 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (name && domain) {
                      onCreateProject(name, domain);
                      setIsModalOpen(false);
                      setName('');
                      setDomain('');
                    }
                  }}
                  className="flex-1 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                >
                  Init Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectListView;
