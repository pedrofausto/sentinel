import React, { memo, useCallback } from 'react';
import { 
  LayoutDashboard, Menu, LogOut, Zap, Plus, ChevronDown, ChevronUp,
  Target, Search, BarChart3, Share2, BrainCircuit
} from 'lucide-react';
import { CTIPhase } from '../types';
import { PHASE_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { Organization } from '../services/api';

const LOGO_URL = "https://shieldsec.com.br/wp-content/uploads/2024/04/shield.png";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activePhase: CTIPhase | 'dashboard' | 'cases';
  onPhaseChange: (phase: CTIPhase | 'dashboard' | 'cases') => void;
  organizations: Organization[];
  activeOrganizationId: string | null;
  onOrganizationChange: (id: string) => void;
  onAddOrganization: () => void;
  isOrgDropdownOpen: boolean;
  onOrgDropdownToggle: () => void;
}

const phaseOrder: CTIPhase[] = ['planning', 'collection', 'analysis', 'dissemination'];

const phaseIcons: Record<CTIPhase, React.ReactNode> = {
  planning: <Target className="w-5 h-5" />,
  collection: <Search className="w-5 h-5" />,
  analysis: <BarChart3 className="w-5 h-5" />,
  dissemination: <Share2 className="w-5 h-5" />,
};

const phaseColors: Record<CTIPhase, string> = {
  planning: 'blue',
  collection: 'emerald',
  analysis: 'amber',
  dissemination: 'purple',
};

const Sidebar = memo(function Sidebar({
  isOpen,
  onToggle,
  activePhase,
  onPhaseChange,
  organizations,
  activeOrganizationId,
  onOrganizationChange,
  onAddOrganization,
  isOrgDropdownOpen,
  onOrgDropdownToggle,
}: SidebarProps) {
  const { logout, user } = useAuth();
  
  const activeOrg = organizations.find(o => o.id === activeOrganizationId);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 z-50 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Shield" className="w-10 h-10 object-contain" />
            {isOpen && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Sentinel</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Organization Selector */}
      {isOpen && (
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <button
              onClick={onOrgDropdownToggle}
              className="w-full p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-left hover:border-cyan-500/50 transition-all flex items-center justify-between"
            >
              <div className="truncate">
                <p className="text-xs text-slate-500 mb-1">Organização</p>
                <p className="text-white font-medium truncate">
                  {activeOrg?.name || 'Selecionar...'}
                </p>
              </div>
              {isOrgDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => {
                      onOrganizationChange(org.id);
                      onOrgDropdownToggle();
                    }}
                    className={`w-full p-3 text-left hover:bg-slate-700/50 transition-colors first:rounded-t-lg ${
                      org.id === activeOrganizationId ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-xs text-slate-500">{org.sector}</p>
                  </button>
                ))}
                <button
                  onClick={() => {
                    onAddOrganization();
                    onOrgDropdownToggle();
                  }}
                  className="w-full p-3 text-left hover:bg-slate-700/50 transition-colors border-t border-slate-600/50 text-cyan-400 flex items-center gap-2 last:rounded-b-lg"
                >
                  <Plus className="w-4 h-4" />
                  Nova Organização
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => onPhaseChange('dashboard')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
            activePhase === 'dashboard'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          {isOpen && <span className="font-medium">Dashboard</span>}
        </button>

        {/* CTI Phases */}
        {isOpen && <p className="text-xs text-slate-500 uppercase tracking-wider pt-4 pb-2">Ciclo CTI</p>}
        
        {phaseOrder.map(phase => {
          const config = PHASE_CONFIG[phase];
          const color = phaseColors[phase];
          const isActive = activePhase === phase;

          return (
            <button
              key={phase}
              onClick={() => onPhaseChange(phase)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={isActive ? {
                backgroundColor: `rgb(var(--${color}-500) / 0.2)`,
              } : undefined}
            >
              {phaseIcons[phase]}
              {isOpen && <span className="font-medium truncate">{config.title}</span>}
            </button>
          );
        })}

        {/* Cases / Metrics */}
        <button
          onClick={() => onPhaseChange('cases')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
            activePhase === 'cases'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BrainCircuit className="w-5 h-5" />
          {isOpen && <span className="font-medium">Casos & Métricas</span>}
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {isOpen && user && (
          <div className="mb-3 p-2 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500">Logado como</p>
            <p className="text-sm text-white font-medium truncate">{user.username}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
