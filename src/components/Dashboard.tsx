import React, { memo, useMemo } from 'react';
import { 
  Target, Search, BarChart3, Share2, Activity, TrendingUp, 
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { OrganizationFull, MetricStats } from '../services/api';

interface DashboardProps {
  organization: OrganizationFull | null;
  stats: MetricStats | null;
  isLoading: boolean;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const Dashboard = memo(function Dashboard({ organization, stats, isLoading }: DashboardProps) {
  // Calculate phase statistics
  const phaseStats = useMemo(() => {
    if (!organization) return null;

    const pirs = organization.phases.planning.pirs || [];
    const sources = organization.phases.collection.sources || [];
    const reports = organization.phases.analysis.reports || [];
    const logs = organization.phases.dissemination.logs || [];

    return [
      {
        label: 'PIRs Ativos',
        value: pirs.filter(p => p.status === 'Active').length,
        total: pirs.length,
        color: 'blue',
        icon: Target,
      },
      {
        label: 'Fontes Monitoradas',
        value: sources.length,
        total: null,
        color: 'emerald',
        icon: Search,
      },
      {
        label: 'Relatórios Produzidos',
        value: reports.length,
        total: null,
        color: 'amber',
        icon: BarChart3,
      },
      {
        label: 'Alertas Disseminados',
        value: logs.filter(l => l.status === 'Disseminated' || l.status === 'Acknowledged').length,
        total: logs.length,
        color: 'purple',
        icon: Share2,
      },
    ];
  }, [organization]);

  // Prepare chart data
  const alertsChartData = useMemo(() => {
    if (!organization?.phases.dissemination.logs) return [];

    const grouped: Record<string, number> = {};
    organization.phases.dissemination.logs.forEach(log => {
      const date = new Date(log.log_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .slice(-10);
  }, [organization]);

  const impactDistribution = useMemo(() => {
    if (!organization?.metrics) return [];

    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    organization.metrics.forEach(m => {
      counts[m.impact_scale] = (counts[m.impact_scale] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [organization]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Target className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">Selecione uma organização</p>
        <p className="text-sm text-slate-500">para visualizar o dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
          <p className="text-slate-400">{organization.sector}</p>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-5 h-5 text-green-400" />
          <span className="text-sm">Sistema Operacional</span>
        </div>
      </div>

      {/* Phase Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phaseStats?.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                {stat.total !== null && (
                  <span className="text-xs text-slate-500">
                    de {stat.total}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-400">MTTD</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.mttd}</p>
            <p className="text-xs text-slate-500">Tempo Médio de Detecção</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-400">MTTDis</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.mttdis}</p>
            <p className="text-xs text-slate-500">Tempo Médio de Disseminação</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Acurácia</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.accuracy}</p>
            <p className="text-xs text-slate-500">Alertas Confirmados</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-400">Prevenção</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.preventionRate}</p>
            <p className="text-xs text-slate-500">Incidentes Prevenidos</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Timeline */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Alertas Disseminados</h3>
          {alertsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={alertsChartData}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  fillOpacity={1}
                  fill="url(#colorAlerts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Sem dados de alertas
            </div>
          )}
        </div>

        {/* Impact Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Impacto</h3>
          {impactDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={impactDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {impactDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Sem dados de métricas
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.totalRecords}</p>
            <p className="text-xs text-slate-400">Total de Registros</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.incidents}</p>
            <p className="text-xs text-slate-400">Incidentes</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.prevented}</p>
            <p className="text-xs text-slate-400">Prevenidos</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.potentials}</p>
            <p className="text-xs text-slate-400">Potenciais</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default Dashboard;
