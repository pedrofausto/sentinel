import React, { memo, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Globe, FileText, Database, AlertTriangle,
  CheckCircle, Clock, Target, Search, BarChart3, Share2, ExternalLink
} from 'lucide-react';
import { CTIPhase } from '../types';
import { PHASE_CONFIG } from '../constants';
import { OrganizationFull, PIR, IntelligenceSource, Report, DisseminationLog } from '../services/api';

interface PhaseViewProps {
  phase: CTIPhase;
  organization: OrganizationFull | null;
  isLoading: boolean;
  onAddPir: () => void;
  onEditPir: (pir: PIR) => void;
  onDeletePir: (id: string) => void;
  onAddSource: (pirId?: string) => void;
  onEditSource: (source: IntelligenceSource) => void;
  onDeleteSource: (id: string) => void;
  onAddReport: (pirId?: string) => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (id: string) => void;
  onAddDissemination: (pirId?: string) => void;
  onEditDissemination: (log: DisseminationLog) => void;
  onDeleteDissemination: (id: string) => void;
  onUpdateDisseminationStatus: (id: string, status: string) => void;
}

const SCALE_LABELS: Record<string, string> = {
  A: 'Completamente Confiável',
  B: 'Usualmente Confiável',
  C: 'Razoavelmente Confiável',
  D: 'Não Usualmente Confiável',
  E: 'Não Confiável',
  F: 'Não Pode Ser Julgado',
};

const phaseIcons: Record<CTIPhase, React.ReactNode> = {
  planning: <Target className="w-6 h-6" />,
  collection: <Search className="w-6 h-6" />,
  analysis: <BarChart3 className="w-6 h-6" />,
  dissemination: <Share2 className="w-6 h-6" />,
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-500/20 text-green-400',
  Draft: 'bg-slate-500/20 text-slate-400',
  Archived: 'bg-red-500/20 text-red-400',
  Pending: 'bg-amber-500/20 text-amber-400',
  Disseminated: 'bg-blue-500/20 text-blue-400',
  Acknowledged: 'bg-green-500/20 text-green-400',
};

const typeColors: Record<string, string> = {
  Strategic: 'bg-purple-500/20 text-purple-400',
  Operational: 'bg-blue-500/20 text-blue-400',
  Tactical: 'bg-cyan-500/20 text-cyan-400',
};

const PhaseView = memo(function PhaseView({
  phase,
  organization,
  isLoading,
  onAddPir,
  onEditPir,
  onDeletePir,
  onAddSource,
  onEditSource,
  onDeleteSource,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onAddDissemination,
  onEditDissemination,
  onDeleteDissemination,
  onUpdateDisseminationStatus,
}: PhaseViewProps) {
  const config = PHASE_CONFIG[phase];

  const phaseData = useMemo(() => {
    if (!organization) return { pirs: [], sources: [], reports: [], logs: [] };

    return {
      pirs: organization.phases.planning.pirs || [],
      sources: organization.phases.collection.sources || [],
      reports: organization.phases.analysis.reports || [],
      logs: organization.phases.dissemination.logs || [],
    };
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
        {phaseIcons[phase]}
        <p className="text-lg mt-4">Selecione uma organização</p>
        <p className="text-sm text-slate-500">para visualizar {config.title}</p>
      </div>
    );
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case 'planning':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                PIRs ({phaseData.pirs.length})
              </h3>
              <button
                onClick={onAddPir}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo PIR
              </button>
            </div>

            {phaseData.pirs.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum PIR cadastrado</p>
                <p className="text-sm text-slate-500 mt-1">
                  Comece criando um requisito de inteligência
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {phaseData.pirs.map(pir => (
                  <div
                    key={pir.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{pir.title}</h4>
                        {pir.description && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {pir.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onEditPir(pir)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePir(pir.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[pir.priority]}`}>
                        {pir.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[pir.status]}`}>
                        {pir.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'collection':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Fontes de Inteligência ({phaseData.sources.length})
              </h3>
              <button
                onClick={() => onAddSource()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Fonte
              </button>
            </div>

            {phaseData.sources.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Nenhuma fonte cadastrada</p>
                <p className="text-sm text-slate-500 mt-1">
                  Adicione fontes de inteligência para coleta
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {phaseData.sources.map(source => (
                  <div
                    key={source.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          {source.type === 'OSINT' && <Globe className="w-5 h-5 text-emerald-400" />}
                          {source.type === 'Internal' && <Database className="w-5 h-5 text-emerald-400" />}
                          {source.type === 'DarkWeb' && <AlertTriangle className="w-5 h-5 text-emerald-400" />}
                          {!['OSINT', 'Internal', 'DarkWeb'].includes(source.type) && (
                            <ExternalLink className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{source.name}</h4>
                          <p className="text-xs text-slate-500">{source.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditSource(source)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSource(source.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Credibilidade:</span>
                        <span className="ml-1 text-white font-medium">{source.credibility}</span>
                        <span className="ml-1 text-xs text-slate-500">
                          ({SCALE_LABELS[source.credibility]?.split(' ')[0]})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Confiabilidade:</span>
                        <span className="ml-1 text-white font-medium">{source.reliability}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Relatórios de Análise ({phaseData.reports.length})
              </h3>
              <button
                onClick={() => onAddReport()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Relatório
              </button>
            </div>

            {phaseData.reports.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum relatório cadastrado</p>
                <p className="text-sm text-slate-500 mt-1">
                  Crie relatórios de análise de inteligência
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {phaseData.reports.map(report => (
                  <div
                    key={report.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{report.title}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(report.report_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[report.type]}`}>
                          {report.type}
                        </span>
                        <button
                          onClick={() => onEditReport(report)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(report.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{report.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'dissemination':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Logs de Disseminação ({phaseData.logs.length})
              </h3>
              <button
                onClick={() => onAddDissemination()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Disseminação
              </button>
            </div>

            {phaseData.logs.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <Share2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Nenhuma disseminação registrada</p>
                <p className="text-sm text-slate-500 mt-1">
                  Registre o compartilhamento de inteligência
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {phaseData.logs.map(log => (
                  <div
                    key={log.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          {log.status === 'Acknowledged' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : log.status === 'Disseminated' ? (
                            <Share2 className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{log.report_name}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(log.log_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[log.type]}`}>
                          {log.type}
                        </span>
                        <select
                          value={log.status}
                          onChange={(e) => onUpdateDisseminationStatus(log.id, e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Disseminated">Disseminated</option>
                          <option value="Acknowledged">Acknowledged</option>
                        </select>
                        <button
                          onClick={() => onEditDissemination(log)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDissemination(log.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {log.notified_team && (
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-500">Time:</span> {log.notified_team}
                      </p>
                    )}
                    {log.delivery_channel && (
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-500">Canal:</span> {log.delivery_channel}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${config.color}-500/20`}>
          {phaseIcons[phase]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{config.title}</h1>
          <p className="text-slate-400">{organization.name}</p>
        </div>
      </div>

      {/* Phase Info Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Entradas</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            {config.inputs.map((input, i) => (
              <li key={i} className="truncate">• {input}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pré-requisitos</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            {config.prerequisites.map((prereq, i) => (
              <li key={i} className="truncate">• {prereq}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Interações</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            {config.interactions.map((interaction, i) => (
              <li key={i} className="truncate">• {interaction}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Saídas</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            {config.outputs.map((output, i) => (
              <li key={i} className="truncate">• {output}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Phase Content */}
      {renderPhaseContent()}
    </div>
  );
});

export default PhaseView;
