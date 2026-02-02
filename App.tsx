
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Project, ProjectStatus, User, KeywordItem, TaskItem, GapReport, TaskBatch } from './types';
import DashboardView from './views/DashboardView';
import ProjectListView from './views/ProjectListView';
import IntelligenceView from './views/IntelligenceView';
import ProductionView from './views/ProductionView';
import GapReportView from './views/GapReportView';
import SiteConnectView from './views/SiteConnectView';
import CompanyProfileView from './views/CompanyProfileView';
import TaskCenterView from './views/TaskCenterView';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  const [batches, setBatches] = useState<TaskBatch[]>([]);
  const [report, setReport] = useState<GapReport | null>(null);

  useEffect(() => {
    const mockProject: Project = {
      id: '1',
      name: '极客技术 SaaS',
      domain: 'geektech.io',
      status: ProjectStatus.READY,
      createdAt: Date.now(),
    };
    setProjects([mockProject]);
  }, []);

  const handleLogin = (email: string) => {
    setUser({ id: 'u-1', email, name: email.split('@')[0], role: '首席营销官' });
    setActiveTab('projects');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveProject(null);
    setActiveTab('projects');
  };

  const handleStartProduction = (selectedMatrixItems: any[]) => {
    const batchId = `BATCH-${Date.now()}`;
    const newTasks: TaskItem[] = selectedMatrixItems.map(item => ({
      id: `TASK-${Math.random().toString(36).substr(2, 6)}`,
      batchId,
      branch: item.branch,
      type: item.branch === 'Article' ? '深度文章' : '社媒短文',
      title: item.title,
      genStatus: 'Pending',
      pubStatus: 'Pending',
      timestamp: Date.now(),
      selected: false
    }));
    
    const newBatch: TaskBatch = {
      id: batchId,
      name: `批量产出 - ${new Date().toLocaleTimeString()}`,
      tasks: newTasks,
      timestamp: Date.now()
    };
    
    setBatches([newBatch, ...batches]);
    setActiveTab('results'); 
  };

  if (!user) return <LoginView onLogin={handleLogin} />;

  const renderContent = () => {
    if (activeTab === 'profile') return <ProfileView user={user} onLogout={handleLogout} />;
    
    if (activeTab === 'projects' || !activeProject) {
      return <ProjectListView 
        projects={projects} 
        onSelectProject={(p) => { setActiveProject(p); setActiveTab('dashboard'); }} 
        onCreateProject={(name, domain) => {
           const np: Project = { id: Date.now().toString(), name, domain, status: ProjectStatus.PROFILE_ENTRY, createdAt: Date.now() };
           setProjects([...projects, np]);
           setActiveProject(np);
           // 1. 修改跳转逻辑：创建项目后跳转到资料录入界面
           setActiveTab('gathering'); 
        }} 
      />;
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardView projects={projects} tasks={batches.flatMap(b => b.tasks)} report={report} />;
      case 'gathering': return <CompanyProfileView activeProject={activeProject} onUpdate={(p) => { setActiveProject({ ...activeProject, companyProfile: p }); setActiveTab('intelligence'); }} />;
      case 'intelligence': return <IntelligenceView activeProject={activeProject} onNext={() => setActiveTab('gap-analysis')} onBack={() => setActiveTab('gathering')} />;
      case 'gap-analysis': return <GapReportView activeProject={activeProject} report={report} onSetReport={setReport} onNext={() => setActiveTab('production')} onBack={() => setActiveTab('intelligence')} />;
      case 'production': return <ProductionView activeProject={activeProject} report={report} onStartTasks={handleStartProduction} />;
      case 'results': return <TaskCenterView batches={batches} activeProject={activeProject} onUpdateBatches={setBatches} />;
      case 'distribution': return <SiteConnectView activeProject={activeProject} onUpdate={(wp) => { setActiveProject({ ...activeProject, wpConnection: wp }); alert('发布通道已锁定！'); }} />;
      default: return <DashboardView projects={projects} tasks={batches.flatMap(b => b.tasks)} report={report} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      activeProjectName={activeProject?.name || null}
      onExitProject={() => { setActiveProject(null); setActiveTab('projects'); }}
      userName={user.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
