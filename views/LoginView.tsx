import React, { useState } from 'react';
import { Mail, Lock, Loader2, Command, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Props {
  onLogin: (email: string) => void;
  onRegister: () => void;
}

const LoginView: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For MVP, we'll use a hardcoded password or simple check if the user entered both
    // But since the UI only has 'Access Key' which acts as password
    // We'll update state to capture password too.

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        onLogin(email);
      } else {
        alert('登录失败: ' + (data.detail || data.error || '未知错误'));
      }
    } catch (error) {
      alert('登录请求失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[180px] animate-pulse"></div>

      <div className="max-w-[500px] w-full relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-[2.2rem] shadow-2xl shadow-indigo-500/50 mb-10 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
            <Command className="text-white" size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter italic mb-4">GEO ENGINE</h1>
          <p className="text-slate-500 text-xl font-medium tracking-tight">AI 驱动的内容引擎与流量分发专家</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-2">Enterprise Email</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-all" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ml-2">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-all" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-900 font-black py-6 rounded-3xl shadow-2xl hover:bg-indigo-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 text-xl group"
            >
              {loading ? (
                <Loader2 className="animate-spin text-indigo-600" size={28} />
              ) : (
                <>
                  登录并进入控制台
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={onRegister}
              className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-bold tracking-wide uppercase"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
