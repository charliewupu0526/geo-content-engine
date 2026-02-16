import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Project, ProjectStatus, User, KeywordItem, TaskItem, GapReport, TaskBatch } from './types';
import DashboardView from './views/DashboardView';
import ProjectListView from './views/ProjectListView';
import IntelligenceView from './views/IntelligenceView';
import ProductionView from './views/ProductionView';
import GapReportView from './views/GapReportView';
import KeywordListView from './views/KeywordListView';
import SiteConnectView from './views/SiteConnectView';
import CompanyProfileView from './views/CompanyProfileView';
import TaskCenterView from './views/TaskCenterView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ProfileView from './views/ProfileView';
import { useTaskProcessor } from './hooks/useTaskProcessor';
import { supabase } from './services/supabaseClient';
import { apiClient } from './services/apiClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<GapReport | null>(null);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [batches, setBatches] = useState<TaskBatch[]>([]);

  // Initialize task processor with local state management
  useTaskProcessor(batches, setBatches, activeProject);

  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email!.split('@')[0],
          role: 'Admin'
        });
      }
      setIsLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email!.split('@')[0],
          role: 'Admin'
        });
      } else {
        setUser(null);
        setActiveProject(null);
        setActiveTab('projects');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore State from LocalStorage
  useEffect(() => {
    const restoreState = async () => {
      if (!user) return;

      const savedProjectId = localStorage.getItem('activeProjectId');
      const savedTab = localStorage.getItem('activeTab');

      if (savedProjectId && savedProjectId !== 'undefined') {
        setIsLoading(true);
        try {
          // Fetch the project details from Supabase (Database Read)
          const res = await apiClient.listProjects(user.id); // Or getProject(id) if available
          if (res.success && res.data) {
            const allProjects = res.data as Project[];
            setProjects(allProjects);


            const target = allProjects.find(p => p.id === savedProjectId);
            if (target) {
              console.log("✅ [App] Restoring active project from session:", target.name);
              setActiveProject(target);
              if (savedTab) {
                setActiveTab(savedTab);
              }
            } else {
              console.warn("⚠️ [App] Saved activeProjectId found but not in fetched projects list.", { savedProjectId, projectsAvailable: allProjects.length });
              // Fallback: Clear invalid session
              localStorage.removeItem('activeProjectId');
            }
          } else {
            console.error("❌ [App] Failed to fetch projects during restore:", res);
          }
        } catch (e) {
          console.error("❌ [App] Exception in restoreState:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      restoreState();
    }
  }, [user]);

  // Persist State
  useEffect(() => {
    if (activeProject?.id) {
      localStorage.setItem('activeProjectId', activeProject.id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [activeProject]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Fetch Projects from Backend (General List)
  useEffect(() => {
    if (user && user.id) {
      const fetchProjects = async () => {
        try {
          console.log("Fetching projects for user:", user.id);
          const res = await apiClient.listProjects(user.id);
          console.log("Fetch projects response:", res);
          if (res.success && res.data) {
            setProjects(res.data as Project[]);
          }
        } catch (e) {
          console.error("Failed to fetch projects", e);
        }
      };

      // Only fetch if we haven't already restored them
      if (projects.length === 0) {
        fetchProjects();
      }
    } else {
      setProjects([]);
    }
  }, [user]);

  // Sync Tasks & History from Backend
  useEffect(() => {
    if (activeProject && activeProject.id && activeProject.id !== 'undefined') {
      const loadProjectData = async () => {
        try {
          // 1. Load Tasks
          const taskRes = await apiClient.getProjectTasks(activeProject.id);
          if (taskRes.success && taskRes.data) {
            const tasks = taskRes.data as TaskItem[];
            const batchMap = new Map<string, TaskItem[]>();

            tasks.forEach(t => {
              const bid = t.batchId || 'default';
              if (!batchMap.has(bid)) batchMap.set(bid, []);
              batchMap.get(bid)?.push(t);
            });

            const loadedBatches: TaskBatch[] = Array.from(batchMap.entries()).map(([bid, tasks]) => ({
              id: bid,
              name: `Loaded Batch ${bid.slice(-4)}`,
              timestamp: tasks[0]?.timestamp || Date.now(),
              tasks: tasks
            })).sort((a, b) => b.timestamp - a.timestamp);

            setBatches(loadedBatches);
          }

          // 2. Load Reports (History)
          const reportRes = await apiClient.getProjectReports(activeProject.id);
          if (reportRes.success && reportRes.data && (reportRes.data as any[]).length > 0) {
            // Get the most recent report
            const latestReport = reportRes.data[0];
            // The logic to parse 'data' depends on how it was saved. 
            // In intelligence.py we saved 'gap_analysis' object directly into 'data' column?
            // Let's check supabase_service.py: "data": data (which is the result dict)
            // So we should use latestReport.data
            console.log("Loaded historical report:", latestReport);
            setReport(latestReport.data);
          } else {
            setReport(null);
          }

          // 3. Load Keywords (History)
          // We don't necessarily load them here because KeywordListView handles its own loading.
          // BUT, to keep state consistent at App level, let's load them.
          const keywordRes = await apiClient.getProjectKeywords(activeProject.id);
          if (keywordRes.success && keywordRes.data && (keywordRes.data as any[]).length > 0) {
            const loadedKeywords = (keywordRes.data as any[]).map(k => ({
              ...k.data,
              id: k.id, // Use DB ID
              selected: true // Default to selected if loaded from DB? Or keep original state?
            }));
            setKeywords(loadedKeywords);
          } else {
            setKeywords([]);
          }

        } catch (e) {
          console.error("Failed to load project data", e);
        }
      };
      loadProjectData();
    } else {
      setBatches([]);
      setReport(null);
      setKeywords([]);
    }
  }, [activeProject]);


  const handleLogin = (email: string) => {
    // Session is handled by onAuthStateChange
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveProject(null);
    setActiveTab('projects');
  };

  const handleStartProduction = async (selectedMatrixItems: any[]) => {
    if (!activeProject) return;

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
      selected: false,
      profile: activeProject?.companyProfile
    }));

    // Optimistic update
    const newBatch: TaskBatch = {
      id: batchId,
      name: `批量产出 - ${new Date().toLocaleTimeString()}`,
      tasks: newTasks,
      timestamp: Date.now()
    };
    setBatches([newBatch, ...batches]);
    setActiveTab('results');

    // Save batch to backend
    try {
      await apiClient.createTaskBatch(activeProject.id, newTasks);
    } catch (e) {
      console.error("Failed to save task batch", e);
    }
  };

  if (isLoading && user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-600/20"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Restoring Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return (
        <RegisterView
          onLogin={(email) => handleLogin(email)}
          onCancel={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginView
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  const renderContent = () => {
    if (activeTab === 'profile') return <ProfileView user={user} onLogout={handleLogout} />;

    if (activeTab === 'projects' || !activeProject) {
      return <ProjectListView
        projects={projects}
        onSelectProject={(p) => { setActiveProject(p); setActiveTab('dashboard'); }}
        onCreateProject={async (name, domain) => {
          // Optimistic UI update
          const tempId = Date.now().toString();
          const np: Project = { id: tempId, name, domain, status: ProjectStatus.PROFILE_ENTRY, createdAt: Date.now() };
          setProjects([...projects, np]);

          try {
            if (!user?.id) {
              alert('Please login first');
              return;
            }
            const res = await apiClient.createProject(name, domain, undefined, user.id);
            if (res.success && res.data) {
              // Replace temp project with real one
              const realProject = res.data as Project;
              setProjects(prev => prev.map(p => p.id === tempId ? realProject : p));
              setActiveProject(realProject);
              setActiveTab('gathering');
            } else {
              alert('Project creation failed: ' + res.error);
              // Revert
              setProjects(prev => prev.filter(p => p.id !== tempId));
            }
          } catch (e) {
            console.error("Failed to create project", e);
            setProjects(prev => prev.filter(p => p.id !== tempId));
          }
        }}
      />;
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardView projects={projects} tasks={batches.flatMap(b => b.tasks)} report={report} />;
      case 'gathering': return <CompanyProfileView activeProject={activeProject} onUpdate={async (p) => {
        // Update local state first for responsiveness
        const updatedProject = { ...activeProject, companyProfile: p };
        setActiveProject(updatedProject);
        setActiveTab('intelligence');

        // Persist to backend
        try {
          console.log("Persisting profile update to backend...", p);
          await apiClient.updateProject(activeProject.id, { company_profile: p });
          // Update project list state as well
          setProjects(prev => prev.map(proj => proj.id === activeProject.id ? updatedProject : proj));
        } catch (e) {
          console.error("Failed to update project profile", e);
          alert("Failed to save profile changes. Please try again.");
        }
      }} />;
      case 'intelligence': return <IntelligenceView activeProject={activeProject} onCompetitorsDiscovered={setCompetitors} onNext={() => setActiveTab('gap-analysis')} onBack={() => setActiveTab('gathering')} />;
      case 'gap-analysis': return <GapReportView activeProject={activeProject} report={report} competitors={competitors} onSetReport={setReport} onNext={() => setActiveTab('keywords')} onBack={() => setActiveTab('intelligence')} />;
      case 'keywords': return <KeywordListView activeProject={activeProject} keywords={keywords} report={report} competitors={competitors} onSetKeywords={setKeywords} onNext={() => setActiveTab('production')} onBack={() => setActiveTab('gap-analysis')} />;
      case 'production': return <ProductionView activeProject={activeProject} report={report} keywords={keywords} onStartTasks={handleStartProduction} onBack={() => setActiveTab('keywords')} />;
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
      onExitProject={() => {
        setActiveProject(null);
        setActiveTab('projects');
        console.log("Exited project");
      }}
      userName={user.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
