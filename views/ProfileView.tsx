
import React, { useState } from 'react';
import { User } from '../types';
import {
  User as UserIcon,
  Shield,
  Key,
  Bell,
  LogOut,
  CheckCircle2,
  Settings2,
  Mail,
  Smartphone,
  Globe,
  Zap,
  ArrowRight,
  ShieldAlert,
  Lock
} from 'lucide-react';

interface Props {
  user: User | null;
  onLogout: () => void;
}

const ProfileView: React.FC<Props> = ({ user, onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'security' | 'api'>('general');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('更改已保存！');
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* 左侧侧边栏导航 */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-2 sticky top-24">
            <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">账号设置</h4>
            <button
              onClick={() => setActiveSubTab('general')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeSubTab === 'general' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <UserIcon size={20} /> 个人资料
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeSubTab === 'security' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Shield size={20} /> 安全验证
            </button>
            <button
              onClick={() => setActiveSubTab('api')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeSubTab === 'api' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Key size={20} /> API 引擎
            </button>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm text-rose-500 hover:bg-rose-50 transition-all group"
              >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 退出当前登录
              </button>
            </div>
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1">
          {activeSubTab === 'general' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <UserIcon size={300} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/30">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                      <Settings2 size={18} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h3>
                    <p className="text-indigo-600 font-bold tracking-widest text-xs uppercase mt-1">{user.role} · 企业版授权</p>
                    <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm font-medium">
                      <Mail size={14} /> {user.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">用户名</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">电子邮箱</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isSaving ? <Zap className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? '正在应用更改...' : '保存个人资料'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'api' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
                  <Key size={300} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl">
                      <Zap className="text-white" size={24} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Gemini 3 Pro API 核心配置</h3>
                  </div>
                  <p className="text-slate-400 font-medium mb-10 max-w-xl leading-relaxed">
                    系统默认使用环境注入密钥。如果您需要使用自有 API 密钥以提升并发限额，请在此手动配置。
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">当前主密钥 (已脱敏)</label>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-mono text-sm tracking-widest flex items-center">
                          ••••••••••••••••••••••••7254
                        </div>
                        <button className="px-6 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-95">
                          更新密钥
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 w-fit px-3 py-1.5 rounded-full font-bold">
                      <CheckCircle2 size={14} /> 诊断引擎正常连接 · 延迟 &lt; 450ms
                    </div>

                    {/* Knowledge Base Stats */}
                    <div className="pt-6 border-t border-white/10 mt-6">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1 block mb-3">知识库状态</label>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                          <span className="block text-2xl font-black text-white">12</span>
                          <span className="text-xs text-slate-400">已索引页面</span>
                        </div>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                          <span className="block text-2xl font-black text-white">4.2 MB</span>
                          <span className="text-xs text-slate-400">数据总量</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Globe className="text-indigo-600" size={20} />
                    <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs">WordPress 发布隧道</h5>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500">连接状态</span>
                      <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">活跃</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500">端点 URL</span>
                      <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-[150px]">geektech.io/wp-json</span>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-4 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    重新测试连接 <ArrowRight size={14} />
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Smartphone className="text-violet-600" size={20} />
                    <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs">多渠道发布令牌</h5>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl opacity-50">
                      <span className="text-xs font-bold text-slate-500">Twitter (X)</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">未授权</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl opacity-50">
                      <span className="text-xs font-bold text-slate-500">LinkedIn</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">未授权</span>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    去集成中心配置 <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">安全与验证设置</h3>
                  <p className="text-slate-500 font-medium">保护您的账号安全并管理会话。</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                      <Lock size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">修改登录密码</div>
                      <div className="text-xs text-slate-400 font-medium">建议定期更新密码以保证安全。</div>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-900 hover:text-white transition-all">
                    去修改
                  </button>
                </div>

                <div className="p-6 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">双因素验证 (2FA)</div>
                      <div className="text-xs text-slate-400 font-medium">通过手机短信或身份验证器进行二次加固。</div>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all">
                    立即开启
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default ProfileView;
