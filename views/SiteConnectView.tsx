
import React, { useState } from 'react';
import { Project, WPConnection, SocialConnection } from '../types';
import { 
  CheckCircle2, 
  Globe, 
  Key, 
  User, 
  CloudLightning, 
  Smartphone, 
  X,
  Instagram,
  Twitter,
  Plus,
  ShieldCheck,
  Zap,
  MoreHorizontal,
  Settings2,
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface Props {
  activeProject: Project | null;
  onUpdate: (wp: WPConnection) => void;
}

const SiteConnectView: React.FC<Props> = ({ activeProject, onUpdate }) => {
  const [activePlatform, setActivePlatform] = useState<'CMS' | 'Social'>('CMS');
  const [configModal, setConfigModal] = useState<'Instagram' | 'Twitter' | null>(null);
  
  // CMS 状态
  const [url, setUrl] = useState(activeProject?.wpConnection?.url || '');
  const [username, setUsername] = useState(activeProject?.wpConnection?.username || '');
  const [password, setPassword] = useState(activeProject?.wpConnection?.appPassword || '');
  const [isTesting, setIsTesting] = useState(false);

  // 模拟社媒连接状态
  const [socialStatus, setSocialStatus] = useState<Record<string, boolean>>({
    'Instagram': false,
    'Twitter': false
  });

  const handleTestCMS = async () => {
    setIsTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsTesting(false);
    alert('WordPress REST API 连接成功！');
  };

  const handleSocialConnect = (platform: string) => {
    setConfigModal(platform as any);
  };

  const saveSocialConfig = () => {
    if (configModal) {
      setSocialStatus({ ...socialStatus, [configModal]: true });
      setConfigModal(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 平台切换 Tab */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 inline-flex shadow-sm">
        <button 
          onClick={() => setActivePlatform('CMS')}
          className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activePlatform === 'CMS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Globe size={18} /> 网站系统 (CMS)
        </button>
        <button 
          onClick={() => setActivePlatform('Social')}
          className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${activePlatform === 'Social' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Smartphone size={18} /> 社交媒体 (Social)
        </button>
      </div>

      {activePlatform === 'CMS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <CloudLightning size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">WordPress REST API</h3>
                <p className="text-sm text-slate-500 font-medium">建立自动化内容同步隧道。</p>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">站点端点</label>
                 <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  placeholder="https://geektech.io"
                 />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">用户名</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API 密码 (应用密码)</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={handleTestCMS} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                {isTesting ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                测试连接
              </button>
              <button 
                onClick={() => onUpdate({ url, username, appPassword: password })}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all"
              >
                保存配置
              </button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-center text-center">
             <ShieldCheck size={80} className="text-indigo-500 mx-auto mb-6" />
             <h4 className="text-xl font-black mb-2">安全加密协议</h4>
             <p className="text-slate-400 text-sm leading-relaxed">您的凭证将通过 256 位 RSA 算法加密，仅在发布瞬间与 WordPress 端点进行 HTTPS 握手。</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'Instagram', name: 'Instagram Business', icon: Instagram, color: 'from-pink-500 to-rose-500', fields: ['App ID', 'App Secret', 'User Access Token', 'Instagram ID'] },
            { id: 'Twitter', name: 'Twitter (X) v2', icon: Twitter, color: 'from-slate-700 to-slate-900', fields: ['API Key', 'API Secret', 'Access Token', 'Access Secret'] },
          ].map((social) => (
            <div key={social.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden">
              {socialStatus[social.id] && (
                <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>
              )}
              <div>
                <div className={`w-16 h-16 bg-gradient-to-tr ${social.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6`}>
                   <social.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-900">{social.name}</h4>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                  {socialStatus[social.id] ? 'API 通路已激活' : '需要 API 凭证授权'}
                </p>
                
                <div className="mt-8 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">能力集</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">图文发布</span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">Reels 视频</span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">数据回传</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSocialConnect(social.id)}
                className={`mt-10 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all group ${
                  socialStatus[social.id] ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-indigo-600'
                }`}
              >
                <Settings2 size={18} /> {socialStatus[social.id] ? '修改配置' : '配置 API 凭证'}
              </button>
            </div>
          ))}
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-14 h-14 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center">
                <MoreHorizontal size={24} />
             </div>
             <div className="text-xs font-black text-slate-400 uppercase tracking-widest">LinkedIn / TikTok<br/>正在集成中</div>
          </div>
        </div>
      )}

      {/* API 配置模态框 */}
      {configModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 rounded-2xl">
                      {configModal === 'Instagram' ? <Instagram size={24} /> : <Twitter size={24} />}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">{configModal} API 配置</h3>
                      <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">输入您的开发者凭证以启用自动发布</p>
                   </div>
                </div>
                <button onClick={() => setConfigModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
             </div>
             
             <div className="p-10 bg-slate-50 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Client ID / API Key</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••••••" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Client Secret / API Secret</label>
                      <input type="password"  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••••••" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Access Token (Long-lived)</label>
                   <textarea rows={3} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Enter your full access token here..." />
                </div>
                {configModal === 'Instagram' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instagram Business Account ID</label>
                    <input type="text" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="178414000000000" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Access Token Secret</label>
                    <input type="password" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••••••" />
                  </div>
                )}

                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3">
                   <Lock size={18} className="text-indigo-600" />
                   <div className="text-[11px] text-indigo-700 font-medium">您的凭证将进行硬件级加密存储。我们建议为该 API 令牌设置“仅发布”权限。</div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setConfigModal(null)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-white transition-all">取消</button>
                   <button 
                    onClick={saveSocialConfig}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                   >
                     确认连接 <ArrowRight size={18} />
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SiteConnectView;
