import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useOrganizations, useOrganizationFull } from './hooks/useOrganization';
import { metricsApi, MetricStats, PIR, IntelligenceSource, Report, DisseminationLog } from './services/api';
import { CTIPhase } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';

// Lazy load heavy components for better initial load
const Dashboard = lazy(() => import('./components/Dashboard'));
const PhaseView = lazy(() => import('./components/PhaseView'));
const ChatWindow = lazy(() => import('./components/ChatWindow'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
  </div>
);

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { organizations, isLoading: orgsLoading, refresh: refreshOrgs } = useOrganizations();
  
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<CTIPhase | 'dashboard' | 'cases'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stats, setStats] = useState<MetricStats | null>(null);
  
  const { organization, isLoading: orgLoading, refresh: refreshOrg } = useOrganizationFull(activeOrganizationId);

  // Set first organization as active when loaded
  useEffect(() => {
    if (organizations.length > 0 && !activeOrganizationId) {
      setActiveOrganizationId(organizations[0].id);
    }
  }, [organizations, activeOrganizationId]);

  // Fetch stats when organization changes
  useEffect(() => {
    if (activeOrganizationId) {
      metricsApi.getStats(activeOrganizationId)
        .then(setStats)
        .catch(() => setStats(null));
    }
  }, [activeOrganizationId]);

  // Handlers
  const handlePhaseChange = useCallback((phase: CTIPhase | 'dashboard' | 'cases') => {
    setActivePhase(phase);
  }, []);

  const handleOrganizationChange = useCallback((id: string) => {
    setActiveOrganizationId(id);
    setActivePhase('dashboard');
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleOrgDropdown = useCallback(() => {
    setIsOrgDropdownOpen(prev => !prev);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  // CRUD handlers (placeholders - implement modals as needed)
  const handleAddOrganization = useCallback(() => {
    console.log('Add organization');
    // TODO: Open organization modal
  }, []);

  const handleAddPir = useCallback(() => {
    console.log('Add PIR');
    // TODO: Open PIR modal
  }, []);

  const handleEditPir = useCallback((pir: PIR) => {
    console.log('Edit PIR', pir);
    // TODO: Open PIR modal with data
  }, []);

  const handleDeletePir = useCallback((id: string) => {
    console.log('Delete PIR', id);
    // TODO: Confirm and delete
  }, []);

  const handleAddSource = useCallback((pirId?: string) => {
    console.log('Add source', pirId);
  }, []);

  const handleEditSource = useCallback((source: IntelligenceSource) => {
    console.log('Edit source', source);
  }, []);

  const handleDeleteSource = useCallback((id: string) => {
    console.log('Delete source', id);
  }, []);

  const handleAddReport = useCallback((pirId?: string) => {
    console.log('Add report', pirId);
  }, []);

  const handleEditReport = useCallback((report: Report) => {
    console.log('Edit report', report);
  }, []);

  const handleDeleteReport = useCallback((id: string) => {
    console.log('Delete report', id);
  }, []);

  const handleAddDissemination = useCallback((pirId?: string) => {
    console.log('Add dissemination', pirId);
  }, []);

  const handleEditDissemination = useCallback((log: DisseminationLog) => {
    console.log('Edit dissemination', log);
  }, []);

  const handleDeleteDissemination = useCallback((id: string) => {
    console.log('Delete dissemination', id);
  }, []);

  const handleUpdateDisseminationStatus = useCallback((id: string, status: string) => {
    console.log('Update dissemination status', id, status);
    // TODO: Call API and refresh
  }, []);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const activeOrg = organizations.find(o => o.id === activeOrganizationId);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        activePhase={activePhase}
        onPhaseChange={handlePhaseChange}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        onOrganizationChange={handleOrganizationChange}
        onAddOrganization={handleAddOrganization}
        isOrgDropdownOpen={isOrgDropdownOpen}
        onOrgDropdownToggle={toggleOrgDropdown}
      />

      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        } p-6`}
      >
        <Suspense fallback={<LoadingFallback />}>
          {activePhase === 'dashboard' && (
            <Dashboard
              organization={organization}
              stats={stats}
              isLoading={orgLoading || orgsLoading}
            />
          )}

          {activePhase === 'cases' && (
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-4">Casos & Métricas</h1>
              <p className="text-slate-400">
                Gestão de casos e métricas de performance do programa CTI.
              </p>
              {/* TODO: Implement cases/metrics view */}
            </div>
          )}

          {activePhase !== 'dashboard' && activePhase !== 'cases' && (
            <PhaseView
              phase={activePhase}
              organization={organization}
              isLoading={orgLoading}
              onAddPir={handleAddPir}
              onEditPir={handleEditPir}
              onDeletePir={handleDeletePir}
              onAddSource={handleAddSource}
              onEditSource={handleEditSource}
              onDeleteSource={handleDeleteSource}
              onAddReport={handleAddReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              onAddDissemination={handleAddDissemination}
              onEditDissemination={handleEditDissemination}
              onDeleteDissemination={handleDeleteDissemination}
              onUpdateDisseminationStatus={handleUpdateDisseminationStatus}
            />
          )}
        </Suspense>
      </main>

      {/* Chat FAB */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-40 ${
          isChatOpen
            ? 'bg-slate-700 text-slate-300'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
        }`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <Suspense fallback={null}>
        <ChatWindow
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          organizationId={activeOrganizationId}
          organizationName={activeOrg?.name || null}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
