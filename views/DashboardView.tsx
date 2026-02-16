
import React from 'react';
import { Project, TaskItem, GapReport } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users,
  FileCheck2,
  Globe,
  TrendingUp,
  Sparkles,
  Calendar,
  AlertCircle,
  ChevronRight,
  Search,
  Zap,
  Activity,
  ArrowUpRight,
  Target
} from 'lucide-react';

interface Props {
  projects: Project[];
  tasks: TaskItem[];
  report?: GapReport | null;
}

const DashboardView: React.FC<Props> = ({ projects, tasks, report }) => {
  const chartData = [
    { name: 'Mon', views: 240, clicks: 140 },
    { name: 'Tue', views: 320, clicks: 180 },
    { name: 'Wed', views: 290, clicks: 160 },
    { name: 'Thu', views: 480, clicks: 280 },
    { name: 'Fri', views: 560, clicks: 320 },
    { name: 'Sat', views: 490, clicks: 290 },
    { name: 'Sun', views: 720, clicks: 450 },
  ];

  const stats = [
    { label: 'Published Content', value: tasks.filter(t => t.pubStatus === 'Success').length, icon: FileCheck2, color: 'text-indigo-600', bg: 'bg-indigo-50/50', trend: '+22.5%' },
    { label: 'GEO Authority Score', value: '94.2', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50/50', trend: 'A+' },
    { label: 'Agent Reach Rate', value: '88.4%', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50/50', trend: 'Optimal' },
    { label: 'Active Branches', value: '12', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50/50', trend: 'Stable' },
  ];

  const schedule = [
    { date: 'TODAY', title: '2025 AI Strategy Blueprint', status: 'Success', type: 'ARTICLE' },
    { date: 'APR 25', title: 'Generative SEO: Why Entities Matter', status: 'Pending', type: 'SOCIAL' },
    { date: 'APR 26', title: 'Expert Citation Data Matrix', status: 'Pending', type: 'TECH' },
  ];

  return (
    <div className="space-y-10">

      {/* 核心指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={22} />
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                {stat.trend} <ArrowUpRight size={10} />
              </div>
            </div>
            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h4>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 趋势图与矩阵排期 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Visibility Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-[3rem] p-10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-20"></div>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Visibility Index</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">AI Search Performance</p>
            </div>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
              <button className="px-5 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black text-slate-900 uppercase">Weekly</button>
              <button className="px-5 py-1.5 rounded-lg text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">Monthly</button>
            </div>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '15px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px', color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIndex)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schedule */}
        <div className="lg:col-span-4 bg-[#0F172A] text-white border border-white/5 rounded-[3rem] p-10 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Calendar size={280} />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-black tracking-tight">Timeline</h3>
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
              <Activity size={18} />
            </div>
          </div>
          <div className="space-y-4 flex-1 relative z-10">
            {schedule.map((item, idx) => (
              <div key={idx} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all cursor-pointer group/item">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.date}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Success' ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                </div>
                <h4 className="text-xs font-black text-slate-200 leading-tight group-hover/item:text-indigo-400 transition-colors">{item.title}</h4>
                <div className="text-[8px] text-indigo-500 font-black uppercase mt-1.5 tracking-widest">{item.type}</div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 relative z-10">
            Full Map <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
        <div className="absolute top-0 left-0 p-12 opacity-[0.02] pointer-events-none group-hover:rotate-6 transition-transform duration-1000">
          <AlertCircle size={300} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl">
                <Target size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight italic uppercase">Gap Diagnosis Summary</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Strategic Intelligence Report</p>
              </div>
            </div>
            <p className="text-slate-300 font-bold leading-relaxed text-2xl lg:text-3xl max-w-4xl tracking-tight">
              {report?.summary || "暂无最新诊断报告"}
            </p>
          </div>
          <div className="w-full lg:w-72 space-y-4 shrink-0">
            <button className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
              <Search size={18} /> Rescan
            </button>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
              <Zap size={18} /> Auto Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
