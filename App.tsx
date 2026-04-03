import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  LayoutDashboard, 
  Sparkles,
  Search,
  Settings,
  Menu,
  X,
  RefreshCw,
  Filter,
  Edit2,
  Archive,
  CheckCircle,
  MoreHorizontal,
  Save,
  Trash2,
  AlertCircle,
  Clock,
  Info,
  ArrowLeft,
  ArrowRight,
  Database,
  BarChart,
  BarChart3,
  Activity,
  Calendar,
  AlertTriangle,
  FileText,
  Paperclip,
  Trash,
  Share2,
  Link as LinkIcon,
  BookOpen,
  Eye,
  History,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Globe,
  Upload,
  FileDown,
  FileCode,
  File,
  MessageSquare,
  Send,
  Loader2,
  TrendingUp,
  Zap,
  Target as TargetIcon,
  Lock,
  LogIn,
  LogOut,
  BrainCircuit,
  PlusCircle
} from 'lucide-react';
import { ClientData, CTIPhase, PIR, IntelligenceSource, Report, StatusHistory, MetricRecord, DisseminationLog } from './types';
import { PHASE_CONFIG } from './constants';
import { generateCTIInsight } from './services/gemini';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart as ReBarChart, Bar, Cell, Legend,
  PieChart, Pie
} from 'recharts';

const LOGO_URL = "https://shieldsec.com.br/wp-content/uploads/2024/04/shield.png";

const INITIAL_CLIENTS: ClientData[] = [
  {
    id: 'c1',
    name: 'FinTech Global',
    sector: 'Financeiro',
    description: 'Líder global em soluções de pagamento digital e banking as a service.',
    stakeholderName: 'Carlos Silveira',
    stakeholderEmail: 'carlos.ciso@fintech.global',
    phases: {
      planning: { 
        pirs: [
          { 
            id: 'p1', 
            title: 'Fraudes em Transações Pix', 
            description: 'Monitorar novos esquemas de phishing visando usuários de bancos digitais.', 
            priority: 'High', 
            status: 'Active', 
            history: [
              { status: 'Active', date: '2024-01-10T09:00:00Z', action: 'Created' },
              { status: 'Active', date: '2024-02-15T14:30:00Z', action: 'Edited' }
            ] 
          },
          { 
            id: 'p2', 
            title: 'Vazamento de APIs', 
            description: 'Busca por chaves de API expostas em repositórios públicos e fóruns de crime cibernético.', 
            priority: 'Medium', 
            status: 'Draft', 
            history: [
              { status: 'Draft', date: '2024-01-20T10:00:00Z', action: 'Created' }
            ] 
          }
        ], 
        stakeholders: ['CISO', 'Fraud Team'] 
      },
      collection: { 
        sources: [
          { id: 's1', pirId: 'p1', name: 'AbuseIPDB', description: 'Banco de dados colaborativo de IPs maliciosos para enriquecimento de IOCs.', type: 'OSINT', credibility: 'B', reliability: 'B', integrationDate: '2024-01-15' },
          { id: 's2', pirId: 'p2', name: 'Flashpoint', description: 'Monitoramento deep & dark web focado em fóruns de vazamento de credenciais.', type: 'FeedComercial', credibility: 'A', reliability: 'A', integrationDate: '2024-02-10' }
        ]
      },
      analysis: { 
        reports: [
          { id: 'r1', pirId: 'p1', title: 'Análise de Campanha Phishing Pix Q1', type: 'Operational', content: 'Identificamos aumento de 20% em domínios falsos utilizando kits de phishing "PixFacil". Recomenda-se bloqueio dos domínios listados no anexo tático.', date: '2024-03-20' }
        ], 
        ttps: ['T1566.002'] 
      },
      dissemination: { 
        integrations: ['Slack', 'Jira'], 
        alertsCount: 1250,
        logs: [
          { id: 'l1', pirId: 'p1', reportId: 'r1', status: 'Pending', date: '2024-05-15', type: 'Tactical', reportName: 'Análise de Campanha Phishing Pix Q1', deliveryChannel: 'soc@fintech.global', notifiedTeam: 'SOC N2', observations: 'Enviado para o time de SOC e Resposta a Incidentes.' }
        ]
      }
    },
    metrics: [
      { id: 'm1', pirId: 'p1', hasIncident: true, incidentDate: '2024-05-10T08:00', discoveryDate: '2024-05-11T10:00', disseminationDate: '2024-05-12T14:00', wasPreviouslyReported: true, incidentPrevented: true, impactScale: 'High' },
      { id: 'm2', pirId: 'p1', hasIncident: false, discoveryDate: '2024-06-01T10:00', disseminationDate: '2024-06-01T11:30', wasPreviouslyReported: true, incidentPrevented: true, impactScale: 'Medium' },
      { id: 'm3', pirId: 'p2', hasIncident: true, incidentDate: '2024-06-15T22:00', discoveryDate: '2024-06-16T09:00', disseminationDate: '2024-06-16T15:00', wasPreviouslyReported: false, incidentPrevented: false, impactScale: 'Critical' }
    ]
  }
];

const COLOR_VARIANTS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SCALE_LABELS = {
  reliability: {
    A: 'Completamente Confiável',
    B: 'Geralmente Confiável',
    C: 'Razoavelmente Confiável',
    D: 'Não Usualmente Confiável',
    E: 'Não Confiável',
    F: 'Confiabilidade Não Julgável'
  },
  credibility: {
    A: 'Confirmado por outras fontes',
    B: 'Provavelmente Verdadeiro',
    C: 'Possivelmente Verdadeiro',
    D: 'Duvidoso',
    E: 'Improvável',
    F: 'Veracidade Não Julgável'
  }
};

const SCALE_VALUES = { A: 6, B: 5, C: 4, D: 3, E: 2, F: 1 };
const SCALE_ORDER: (keyof typeof SCALE_VALUES)[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [clients, setClients] = useState<ClientData[]>(INITIAL_CLIENTS);
  const [activeClientId, setActiveClientId] = useState<string | null>(INITIAL_CLIENTS[0].id);
  const [activePhase, setActivePhase] = useState<CTIPhase | 'dashboard' | 'cases'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isDisseminationModalOpen, setIsDisseminationModalOpen] = useState(false);
  const [isPirModalOpen, setIsPirModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  const [editingMetric, setEditingMetric] = useState<MetricRecord | null>(null);
  const [editingPir, setEditingPir] = useState<PIR | null>(null);
  const [editingSource, setEditingSource] = useState<IntelligenceSource | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<Report | null>(null);
  const [editingOrg, setEditingOrg] = useState<ClientData | null>(null);
  const [editingDissemination, setEditingDissemination] = useState<DisseminationLog | null>(null);
  
  const [sourceModalPirId, setSourceModalPirId] = useState<string | null>(null);
  const [analysisModalPirId, setAnalysisModalPirId] = useState<string | null>(null);
  const [disseminationModalPirId, setDisseminationModalPirId] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isAlert?: boolean;
    confirmText?: string;
    variant?: 'danger' | 'info';
  } | null>(null);

  const activeClient = useMemo(() => 
    clients.find(c => c.id === activeClientId) || null
  , [clients, activeClientId]);

  const performanceStats = useMemo(() => {
    if (!activeClient || activeClient.metrics.length === 0) return null;
    const diffHours = (d1: string, d2: string) => Math.max(0, (new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60));
    
    const mttd = activeClient.metrics.reduce((acc, m) => acc + diffHours(m.discoveryDate, m.incidentDate || m.discoveryDate), 0) / activeClient.metrics.length;
    const mttdis = activeClient.metrics.reduce((acc, m) => acc + diffHours(m.disseminationDate, m.discoveryDate), 0) / activeClient.metrics.length;
    
    const reportedCount = activeClient.metrics.filter(m => m.wasPreviouslyReported).length;
    const preventedCount = activeClient.metrics.filter(m => m.incidentPrevented).length;
    return {
      mttd: mttd.toFixed(1),
      mttdis: mttdis.toFixed(1),
      accuracy: ((reportedCount / activeClient.metrics.length) * 100).toFixed(0),
      prevention: ((preventedCount / activeClient.metrics.length) * 100).toFixed(0),
      total: activeClient.metrics.length,
      incidents: activeClient.metrics.filter(m => m.hasIncident).length,
      potentials: activeClient.metrics.filter(m => !m.hasIncident).length,
      mapped: reportedCount,
      unmapped: activeClient.metrics.length - reportedCount,
      mitigated: preventedCount,
      consummated: activeClient.metrics.filter(m => m.hasIncident && !m.incidentPrevented).length
    };
  }, [activeClient]);

  const getContextString = () => {
    if (!activeClient) return "Nenhum cliente ativo.";

    const pirLookup = activeClient.phases.planning.pirs.reduce((acc, p) => {
      acc[p.id] = p.title;
      return acc;
    }, {} as Record<string, string>);

    return JSON.stringify({
      organizacao: {
        nome: activeClient.name,
        setor: activeClient.sector,
        missao: activeClient.description,
        stakeholder: activeClient.stakeholderName
      },
      requisitos_inteligencia: activeClient.phases.planning.pirs.map(p => ({
        titulo: p.title,
        status: p.status,
        prioridade: p.priority,
        descricao: p.description
      })),
      fontes_coleta: activeClient.phases.collection.sources.map(s => ({
        nome: s.name,
        tipo: s.type,
        credibilidade: s.credibility,
        confiabilidade: s.reliability
      })),
      historico_casos_incidentes: activeClient.metrics.map(m => {
        const incidentTimestamp = m.incidentDate ? new Date(m.incidentDate).getTime() : 0;
        const discoveryTimestamp = new Date(m.discoveryDate).getTime();
        return {
          foi_incidente: m.hasIncident,
          impacto: m.impactScale,
          mitigado: m.incidentPrevented,
          mapeado_previamente: m.wasPreviouslyReported,
          pir_associado: pirLookup[m.pirId],
          mttd_horas: incidentTimestamp ? (discoveryTimestamp - incidentTimestamp) / 3600000 : 0
        };
      }),
      relatorios_analise: activeClient.phases.analysis.reports.map(r => ({
        titulo: r.title,
        tipo: r.type,
        sumario: r.content
      })),
      disseminacao: activeClient.phases.dissemination.logs.map(l => ({
        arquivo: l.reportName,
        tipo: l.type,
        canal: l.deliveryChannel,
        time: l.notifiedTeam,
        obs: l.observations,
        vinc_pir: pirLookup[l.pirId]
      }))
    }, null, 2);
  };

  const handleSendMessage = async () => {
    if (!currentChatInput.trim() || isAiTyping) return;
    const userMsg: ChatMessage = { role: 'user', content: currentChatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setCurrentChatInput('');
    setIsAiTyping(true);
    try {
      const context = getContextString();
      const response = await generateCTIInsight(userMsg.content, context);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response || 'Desculpe, não consegui processar sua dúvida.' }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a inteligência artificial.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiTyping]);

  // --- Handlers ---
  const handleAddOrEditOrg = (orgData: Partial<ClientData>) => {
    if (editingOrg) {
      setClients(prev => prev.map(c => c.id === editingOrg.id ? { ...c, ...orgData } : c));
    } else {
      const newOrg: ClientData = {
        id: Math.random().toString(36).substr(2, 9),
        name: orgData.name || 'Nova Org',
        sector: orgData.sector || 'N/A',
        description: orgData.description || '',
        stakeholderName: orgData.stakeholderName || '',
        stakeholderEmail: orgData.stakeholderEmail || '',
        phases: {
          planning: { pirs: [], stakeholders: [] },
          collection: { sources: [] },
          analysis: { reports: [], ttps: [] },
          dissemination: { integrations: [], alertsCount: 0, logs: [] }
        },
        metrics: []
      };
      setClients(prev => [...prev, newOrg]);
      setActiveClientId(newOrg.id);
    }
    setIsOrgModalOpen(false);
    setEditingOrg(null);
  };

  const handleDeleteOrg = (id: string) => {
    if (clients.length <= 1) {
      setConfirmState({
        isOpen: true,
        title: "Ação Não Permitida",
        message: "Deve haver pelo menos uma organização no sistema.",
        isAlert: true,
        onConfirm: () => setConfirmState(null)
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Excluir Organização",
      message: "Tem certeza que deseja excluir esta organização e todos os dados CTI associados? Esta ação é irreversível.",
      confirmText: "Excluir Definitivamente",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.filter(c => c.id !== id));
        if (activeClientId === id) {
          const remaining = clients.filter(c => c.id !== id);
          setActiveClientId(remaining[0]?.id || null);
        }
        setConfirmState(null);
      }
    });
  };

  const handleAddOrEditPir = (pir: Omit<PIR, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
      if (c.id !== activeClientId) return c;
      let updatedPirs = [...c.phases.planning.pirs];
      const now = new Date().toISOString();
      if (editingPir) {
        updatedPirs = updatedPirs.map(p => p.id === editingPir.id ? { ...pir, id: editingPir.id, history: [...(p.history || []), { status: pir.status, date: now, action: p.status !== pir.status ? 'Status Changed' : 'Edited' }] } : p);
      } else {
        updatedPirs.push({ ...pir, id: Math.random().toString(36).substr(2, 9), history: [{ status: pir.status, date: now, action: 'Created' }] });
      }
      return { ...c, phases: { ...c.phases, planning: { ...c.phases.planning, pirs: updatedPirs } } };
    }));
    setIsPirModalOpen(false);
    setEditingPir(null);
  };

  const handleDeletePir = (id: string) => {
    if (!activeClientId) return;
    setConfirmState({
      isOpen: true,
      title: "Excluir PIR",
      message: "Excluir este PIR removerá também TODOS os dados dependentes (fontes, análises, métricas e disseminações vinculadas). Deseja prosseguir?",
      confirmText: "Sim, Excluir Tudo",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.map(c => {
          if (c.id !== activeClientId) return c;
          return {
            ...c,
            phases: {
              ...c.phases,
              planning: { ...c.phases.planning, pirs: c.phases.planning.pirs.filter(p => p.id !== id) },
              collection: { ...c.phases.collection, sources: c.phases.collection.sources.filter(s => s.pirId !== id) },
              analysis: { ...c.phases.analysis, reports: c.phases.analysis.reports.filter(r => r.pirId !== id) },
              dissemination: { ...c.phases.dissemination, logs: c.phases.dissemination.logs.filter(l => l.pirId !== id) }
            },
            metrics: c.metrics.filter(m => m.pirId !== id)
          };
        }));
        setConfirmState(null);
      }
    });
  };

  const handleDeleteSource = (id: string) => {
    if (!activeClientId) return;
    setConfirmState({
      isOpen: true,
      title: "Excluir Fonte",
      message: "Deseja realmente remover esta fonte de coleta de inteligência?",
      confirmText: "Excluir Fonte",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.map(c => {
          if (c.id !== activeClientId) return c;
          return {
            ...c,
            phases: {
              ...c.phases,
              collection: {
                ...c.phases.collection,
                sources: c.phases.collection.sources.filter(s => s.id !== id)
              }
            }
          };
        }));
        setConfirmState(null);
      }
    });
  };

  const handleDeleteAnalysis = (id: string) => {
    if (!activeClientId) return;
    setConfirmState({
      isOpen: true,
      title: "Excluir Relatório",
      message: "Este relatório de análise será apagado permanentemente. A disseminação obrigatória vinculada também será removida. Confirmar?",
      confirmText: "Excluir Relatório",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.map(c => {
          if (c.id !== activeClientId) return c;
          return {
            ...c,
            phases: {
              ...c.phases,
              analysis: {
                ...c.phases.analysis,
                reports: c.phases.analysis.reports.filter(r => r.id !== id)
              },
              dissemination: {
                ...c.phases.dissemination,
                logs: c.phases.dissemination.logs.filter(l => l.reportId !== id)
              }
            }
          };
        }));
        setConfirmState(null);
      }
    });
  };

  const handleDeleteDissemination = (id: string) => {
    if (!activeClientId) return;
    const logToDelete = activeClient?.phases.dissemination.logs.find(l => l.id === id);
    if (logToDelete?.reportId) {
        setConfirmState({
            isOpen: true,
            title: "Ação não permitida",
            message: "Esta disseminação é obrigatória pois está vinculada a uma Análise. Para removê-la, você deve excluir o relatório de análise correspondente.",
            isAlert: true,
            onConfirm: () => setConfirmState(null)
        });
        return;
    }

    setConfirmState({
      isOpen: true,
      title: "Excluir Log",
      message: "Deseja excluir este registro de disseminação de inteligência?",
      confirmText: "Remover Log",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.map(c => {
          if (c.id !== activeClientId) return c;
          return {
            ...c,
            phases: {
              ...c.phases,
              dissemination: {
                ...c.phases.dissemination,
                logs: c.phases.dissemination.logs.filter(l => l.id !== id)
              }
            }
          };
        }));
        setConfirmState(null);
      }
    });
  };

  const handleUpdateDisseminationStatus = (id: string, newStatus: DisseminationLog['status']) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
      if (c.id !== activeClientId) return c;
      return {
        ...c,
        phases: {
          ...c.phases,
          dissemination: {
            ...c.phases.dissemination,
            logs: c.phases.dissemination.logs.map(l => l.id === id ? { ...l, status: newStatus } : l)
          }
        }
      };
    }));
  };

  const handleAddOrEditSource = (source: Omit<IntelligenceSource, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
      if (c.id !== activeClientId) return c;
      const updatedSources = editingSource
        ? c.phases.collection.sources.map(s => s.id === editingSource.id ? { ...source, id: editingSource.id } : s)
        : [...c.phases.collection.sources, { ...source, id: Math.random().toString(36).substr(2, 9) }];
      return { ...c, phases: { ...c.phases, collection: { ...c.phases.collection, sources: updatedSources } } };
    }));
    setIsSourceModalOpen(false);
    setEditingSource(null);
  };

  // Improved handleAddOrEditAnalysis to accept status from form
  const handleAddOrEditAnalysis = (report: Omit<Report, 'id'>, status?: DisseminationLog['status']) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
      if (c.id !== activeClientId) return c;
      
      let updatedReports = [...c.phases.analysis.reports];
      let updatedLogs = [...c.phases.dissemination.logs];
      
      if (editingAnalysis) {
        updatedReports = updatedReports.map(r => {
          if (r.id === editingAnalysis.id) {
            // Atualiza os dados do log vinculado se houver alteração no relatório
            updatedLogs = updatedLogs.map(l => 
              l.reportId === editingAnalysis.id ? { ...l, reportName: report.title, type: report.type, status: status || l.status } : l
            );
            return { ...report, id: editingAnalysis.id };
          }
          return r;
        });
      } else {
        const reportId = Math.random().toString(36).substr(2, 9);
        updatedReports.push({ ...report, id: reportId });
        
        // CRIAÇÃO OBRIGATÓRIA DA DISSEMINAÇÃO
        updatedLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          pirId: report.pirId,
          reportId: reportId,
          date: new Date().toISOString().split('T')[0],
          type: report.type,
          status: status || 'Pending',
          reportName: report.title,
          observations: 'Gerado automaticamente: Disseminação obrigatória para nova análise.'
        });
      }
      
      return { 
        ...c, 
        phases: { 
          ...c.phases, 
          analysis: { ...c.phases.analysis, reports: updatedReports },
          dissemination: { ...c.phases.dissemination, logs: updatedLogs }
        } 
      };
    }));
    setIsAnalysisModalOpen(false);
    setEditingAnalysis(null);
  };

  const handleAddOrEditMetric = (metric: Omit<MetricRecord, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, metrics: editingMetric ? c.metrics.map(m => m.id === editingMetric.id ? { ...metric, id: editingMetric.id } : m) : [...c.metrics, { ...metric, id: Math.random().toString(36).substr(2, 9) }] } : c));
    setIsMetricModalOpen(false);
    setEditingMetric(null);
  };

  const handleDeleteMetric = (id: string) => {
    if (!activeClientId) return;
    setConfirmState({
      isOpen: true,
      title: "Excluir Registro de Caso",
      message: "Deseja realmente excluir este registro de caso e suas métricas?",
      confirmText: "Excluir Caso",
      variant: "danger",
      onConfirm: () => {
        setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, metrics: c.metrics.filter(m => m.id !== id) } : c));
        setConfirmState(null);
      }
    });
  };

  const handleAddOrEditDissemination = (log: Omit<DisseminationLog, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
        if (c.id !== activeClientId) return c;
        const updatedLogs = editingDissemination 
            ? c.phases.dissemination.logs.map(l => l.id === editingDissemination.id ? { ...log, id: editingDissemination.id } : l)
            : [...c.phases.dissemination.logs, { ...log, id: Math.random().toString(36).substr(2, 9) }];
        return { ...c, phases: { ...c.phases, dissemination: { ...c.phases.dissemination, logs: updatedLogs } } };
    }));
    setIsDisseminationModalOpen(false);
    setEditingDissemination(null);
  };

  const LoginScreen = () => {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      // Mock Authentication Logic
      setTimeout(() => {
        if (user === 'admin' && password === 'admin') {
          setIsAuthenticated(true);
        } else {
          setError('Credenciais inválidas. Verifique usuário e senha.');
        }
        setLoading(false);
      }, 1000);
    };

    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative z-10">
          <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl overflow-hidden">
            <div className="text-center mb-10">
              <div className="inline-flex p-4 bg-white/5 border border-white/10 rounded-[1.5rem] shadow-2xl mb-6 rotate-3">
                <img src={LOGO_URL} alt="ShieldSec Logo" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Sentinel CTI</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">Intelligence Lifecycle Management</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificação do Analista</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={user} 
                    onChange={e => setUser(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-500 transition-all outline-none" 
                    placeholder="usuário"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de Acesso</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-500 transition-all outline-none" 
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-[11px] font-bold text-rose-500">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Autenticar no Sistema
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Zap className="w-3 h-3" /> Sentinel v2.5 Enterprise Intelligence
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center px-10">
            <p className="text-xs text-slate-500 leading-relaxed italic opacity-50">
              "A inteligência é o que nos permite ver as ameaças antes que elas se tornem incidentes."
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  const ConfirmationModal = () => {
    if (!confirmState || !confirmState.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${confirmState.variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{confirmState.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{confirmState.message}</p>
          </div>
          <div className="flex border-t border-slate-800">
            {!confirmState.isAlert && (
              <button 
                onClick={() => setConfirmState(null)} 
                className="flex-1 py-5 text-sm font-bold text-slate-500 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button 
              onClick={confirmState.onConfirm} 
              className={`flex-1 py-5 text-sm font-black transition-colors ${confirmState.variant === 'danger' ? 'bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'} ${confirmState.isAlert ? 'w-full' : ''}`}
            >
              {confirmState.confirmText || 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AnalysisModal = () => {
    const associatedLog = useMemo(() => 
      activeClient?.phases.dissemination.logs.find(l => l.reportId === editingAnalysis?.id), 
      [activeClient, editingAnalysis]
    );

    const [form, setForm] = useState<{
      pirId: string;
      title: string;
      type: Report['type'];
      content: string;
      date: string;
      disseminationStatus: DisseminationLog['status'];
    }>(editingAnalysis ? { 
      ...editingAnalysis,
      disseminationStatus: associatedLog?.status || 'Pending' 
    } : { 
      pirId: analysisModalPirId || activeClient?.phases.planning.pirs[0]?.id || '', 
      title: '', 
      type: 'Operational', 
      content: '', 
      date: new Date().toISOString().split('T')[0],
      disseminationStatus: 'Pending'
    });

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsAnalysisModalOpen(false); setEditingAnalysis(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><BarChart3 className="w-6 h-6 text-amber-500" /> {editingAnalysis ? 'Editar Relatório' : 'Novo Relatório de Análise'}</h3>
            <button onClick={() => { setIsAnalysisModalOpen(false); setEditingAnalysis(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500" placeholder="Ex: Análise Campanha Q2" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500">
                  <option value="Operational">Operacional</option><option value="Strategic">Estratégico</option><option value="Tactical">Tático</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a PIR</label>
                <select value={form.pirId} onChange={e => setForm({...form, pirId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500">
                  {activeClient?.phases.planning.pirs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status da Disseminação</label>
                <select value={form.disseminationStatus} onChange={e => setForm({...form, disseminationStatus: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500">
                  <option value="Pending">Não Disseminada</option>
                  <option value="Disseminated">Disseminada</option>
                  <option value="Acknowledged">Reconhecida pelo Stakeholder</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Conteúdo</label>
              <textarea rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500 resize-none" placeholder="Sumário executivo e descobertas técnicas..." />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsAnalysisModalOpen(false); setEditingAnalysis(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditAnalysis(form, form.disseminationStatus)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Relatório</button>
          </div>
        </div>
      </div>
    );
  };

  const DisseminationModal = () => {
    const [form, setForm] = useState<Omit<DisseminationLog, 'id'>>(editingDissemination ? { ...editingDissemination } : { pirId: disseminationModalPirId || activeClient?.phases.planning.pirs[0]?.id || '', date: new Date().toISOString().split('T')[0], type: 'Tactical', status: 'Pending', reportName: '', deliveryChannel: '', notifiedTeam: '', observations: '' });
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSave = () => {
        if (!form.pirId) {
            setError('Por favor, selecione um PIR para vincular este log.');
            return;
        }
        if (form.deliveryChannel && !validateEmail(form.deliveryChannel)) {
            setError('Por favor, insira um e-mail válido no Canal de Envio.');
            return;
        }
        setError('');
        handleAddOrEditDissemination(form);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Share2 className="w-6 h-6 text-purple-500" /> {editingDissemination ? 'Editar Log' : 'Nova Disseminação/Alerta'}</h3>
            <button onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a PIR</label>
              <select value={form.pirId} onChange={e => setForm({...form, pirId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500">
                <option value="" className="bg-slate-950 text-slate-300">Selecione um PIR...</option>
                {activeClient?.phases.planning.pirs.map(p => <option key={p.id} value={p.id} className="bg-slate-950 text-slate-300">{p.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500">
                  <option value="Tactical" className="bg-slate-950 text-slate-300">Tático</option>
                  <option value="Operational" className="bg-slate-950 text-slate-300">Operacional</option>
                  <option value="Strategic" className="bg-slate-950 text-slate-300">Estratégico</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Atual</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500">
                   <option value="Pending" className="bg-slate-950 text-slate-300">Pendente / Não Enviado</option>
                   <option value="Disseminated" className="bg-slate-950 text-slate-300">Disseminado / Enviado</option>
                   <option value="Acknowledged" className="bg-slate-950 text-slate-300">Reconhecido (Ack)</option>
                </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Relatório (Fonte de Dados)</label>
              <input type="text" value={form.reportName} onChange={e => setForm({...form, reportName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500" placeholder="Ex: IOC_Feed_May.csv" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Canal de Envio (Email)</label>
                <input type="email" value={form.deliveryChannel} onChange={e => { setForm({...form, deliveryChannel: e.target.value}); setError(''); }} className={`w-full bg-slate-950 border ${error.includes('e-mail') ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500`} placeholder="ex: soc@empresa.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time Notificado</label>
                <input type="text" value={form.notifiedTeam} onChange={e => setForm({...form, notifiedTeam: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500" placeholder="ex: SOC N2, Incident Response" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Demais Observações</label>
              <textarea rows={3} value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500 resize-none" placeholder="Contexto adicional da disseminação..." />
            </div>
            {error && <p className="text-xs text-rose-500 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Log</button>
          </div>
        </div>
      </div>
    );
  };

  const PirModal = () => {
    const [form, setForm] = useState<Omit<PIR, 'id' | 'history'>>(editingPir ? { title: editingPir.title, description: editingPir.description, priority: editingPir.priority, status: editingPir.status } : { title: '', description: '', priority: 'Medium', status: 'Draft' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsPirModalOpen(false); setEditingPir(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><TargetIcon className="w-6 h-6 text-blue-500" /> {editingPir ? 'Editar PIR' : 'Novo Requisito (PIR)'}</h3>
            <button onClick={() => { setIsPirModalOpen(false); setEditingPir(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Requisito</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500" placeholder="Ex: Ameaças ao sistema SWIFT" />
            </div>
            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prioridade</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500">
                    <option value="High">Alta</option><option value="Medium">Média</option><option value="Low">Baixa</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500">
                    <option value="Active">Ativo</option><option value="Draft">Rascunho</option><option value="Archived">Arquivado</option>
                  </select>
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 resize-none" placeholder="Descreva o que precisamos monitorar..." />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsPirModalOpen(false); setEditingPir(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditPir(form)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar PIR</button>
          </div>
        </div>
      </div>
    );
  };

  const SourceModal = () => {
    const [form, setForm] = useState<Omit<IntelligenceSource, 'id'>>(editingSource ? { ...editingSource } : { pirId: sourceModalPirId || activeClient?.phases.planning.pirs[0]?.id || '', name: '', description: '', type: 'OSINT', credibility: 'B', reliability: 'B', integrationDate: new Date().toISOString().split('T')[0] });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsSourceModalOpen(false); setEditingSource(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Search className="w-6 h-6 text-emerald-500" /> {editingSource ? 'Editar Fonte' : 'Nova Fonte de Coleta'}</h3>
            <button onClick={() => { setIsSourceModalOpen(false); setEditingSource(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a PIR</label>
              <select value={form.pirId} onChange={e => setForm({...form, pirId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                {activeClient?.phases.planning.pirs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Fonte</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500" placeholder="Ex: Recorded Future" />
            </div>
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição / Detalhes</label>
              <textarea rows={3} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500 resize-none" placeholder="Contexto sobre esta fonte de inteligência..." />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                  <option value="OSINT">OSINT</option><option value="FeedComercial">Feed Comercial</option><option value="FeedAberto">Feed Aberto</option><option value="Internal">Interna</option><option value="DarkWeb">Dark Web</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confiabilidade (Fonte)</label>
                  <select value={form.reliability} onChange={e => setForm({...form, reliability: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                    {SCALE_ORDER.map(k => <option key={k} value={k}>{k} - {SCALE_LABELS.reliability[k].split(' ')[0]}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Credibilidade (Info)</label>
                  <select value={form.credibility} onChange={e => setForm({...form, credibility: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                    {SCALE_ORDER.map(k => <option key={k} value={k}>{k} - {SCALE_LABELS.credibility[k].split(' ')[0]}</option>)}
                  </select>
               </div>
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsSourceModalOpen(false); setEditingSource(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditSource(form)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Fonte</button>
          </div>
        </div>
      </div>
    );
  };

  const OrgModal = () => {
    const [form, setForm] = useState<Partial<ClientData>>(editingOrg ? { ...editingOrg } : { name: '', sector: '', description: '', stakeholderName: '', stakeholderEmail: '' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Users className="w-6 h-6 text-indigo-500" /> {editingOrg ? 'Editar Organização' : 'Nova Organização'}</h3>
            <button onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Organização</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Setor de Atuação</label>
              <input type="text" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stakeholder Principal</label>
                 <input type="text" value={form.stakeholderName} onChange={e => setForm({...form, stakeholderName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-indigo-500" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                 <input type="email" value={form.stakeholderEmail} onChange={e => setForm({...form, stakeholderEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-indigo-500" />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Missão / Descrição</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-indigo-500 resize-none" />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditOrg(form)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Org</button>
          </div>
        </div>
      </div>
    );
  };

  const PhaseView = ({ phase }: { phase: CTIPhase }) => {
    const config = PHASE_CONFIG[phase];

    const sourcesByPirId = useMemo(() => {
      const map: Record<string, IntelligenceSource[]> = {};
      if (!activeClient) return map;
      activeClient.phases.collection.sources.forEach(s => {
        if (!map[s.pirId]) map[s.pirId] = [];
        map[s.pirId].push(s);
      });
      return map;
    }, [activeClient?.phases.collection.sources]);

    const logsByPirId = useMemo(() => {
      const map: Record<string, DisseminationLog[]> = {};
      if (!activeClient) return map;
      activeClient.phases.dissemination.logs.forEach(l => {
        if (!map[l.pirId]) map[l.pirId] = [];
        map[l.pirId].push(l);
      });
      return map;
    }, [activeClient?.phases.dissemination.logs]);

    if (!activeClient) return null;

    const renderPhaseContent = () => {
      switch (phase) {
        case 'planning':
          return (
            <div className="space-y-4">
              {activeClient.phases.planning.pirs.map(p => (
                <div key={p.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/30 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-slate-100">{p.title}</h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${p.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{p.priority}</span>
                         </div>
                         <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPir(p); setIsPirModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePir(p.id); }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
              ))}
              {activeClient.phases.planning.pirs.length === 0 && <p className="text-center py-10 text-slate-600 italic">Nenhum PIR definido.</p>}
            </div>
          );
        case 'collection':
          return (
            <div className="space-y-8">
              {activeClient.phases.planning.pirs.map(pir => {
                const pirSources = sourcesByPirId[pir.id] || [];
                return (
                  <div key={pir.id} className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800/50 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl"><TargetIcon className="w-5 h-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-100 uppercase tracking-tight">{pir.title}</h4>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pirSources.length} FONTES DE COLETA</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSourceModalPirId(pir.id); setEditingSource(null); setIsSourceModalOpen(true); }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl transition-all"
                        title="Adicionar Fonte para este PIR"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {pirSources.map(s => (
                        <div key={s.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition-all group">
                           <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Globe className="w-4 h-4" /></div>
                                 <div>
                                    <h4 className="font-bold text-slate-100">{s.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                       <span>{s.type}</span>
                                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                       <span className="text-emerald-400">ADMIRALTY: {s.reliability}{s.credibility}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingSource(s); setIsSourceModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSource(s.id); }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </div>
                           {s.description && <p className="text-xs text-slate-500 leading-relaxed pl-14 pr-4">{s.description}</p>}
                        </div>
                      ))}
                      {pirSources.length === 0 && (
                        <p className="text-center py-6 text-slate-600 italic text-xs">Nenhuma fonte de coleta vinculada a este PIR ainda.</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={() => { setSourceModalPirId(null); setEditingSource(null); setIsSourceModalOpen(true); }} 
                className="w-full py-6 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-xs font-black uppercase tracking-widest"
              >
                + Adicionar Fonte Geral
              </button>
            </div>
          );
        case 'analysis':
          return (
            <div className="space-y-4">
              {activeClient.phases.analysis.reports.map(r => (
                <div key={r.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-amber-500/30 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><FileText className="w-4 h-4" /></div>
                        <div>
                          <h4 className="font-bold text-slate-100">{r.title}</h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{r.type} • {r.date}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingAnalysis(r); setIsAnalysisModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAnalysis(r.id); }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{r.content}</p>
                </div>
              ))}
              <button onClick={() => { setEditingAnalysis(null); setIsAnalysisModalOpen(true); }} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-amber-400 hover:border-amber-500/50 transition-all text-xs font-black uppercase tracking-widest">+ Novo Relatório de Análise</button>
            </div>
          );
        case 'dissemination':
          return (
            <div className="space-y-8">
              {activeClient.phases.planning.pirs.map(pir => {
                const pirLogs = logsByPirId[pir.id] || [];
                return (
                  <div key={pir.id} className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800/50 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl"><TargetIcon className="w-5 h-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-100 uppercase tracking-tight">{pir.title}</h4>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pirLogs.length} DISSEMINAÇÕES REGISTRADAS</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setDisseminationModalPirId(pir.id); setEditingDissemination(null); setIsDisseminationModalOpen(true); }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl transition-all"
                        title="Adicionar Disseminação para este PIR"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {pirLogs.map(l => (
                        <div key={l.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Share2 className="w-4 h-4" /></div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <h4 className="font-bold text-slate-100">{l.reportName}</h4>
                                      <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${
                                          l.status === 'Disseminated' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                          l.status === 'Acknowledged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                          'bg-slate-800 text-slate-400 border-slate-700'
                                      }`}>
                                        {l.status === 'Pending' ? 'Pendente' : l.status === 'Disseminated' ? 'Disseminado' : 'Reconhecido'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{l.type} • {l.date}</span>
                                    <div className="flex flex-wrap gap-x-3 mt-1">
                                       {l.deliveryChannel && <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 rounded uppercase">{l.deliveryChannel}</span>}
                                       {l.notifiedTeam && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded uppercase">{l.notifiedTeam}</span>}
                                       {l.reportId && <span className="text-[9px] text-amber-500 font-black border border-amber-500/30 px-1.5 rounded uppercase">Vínculo: Análise</span>}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingDissemination(l); setIsDisseminationModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDissemination(l.id); }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </div>
                           {l.observations && <p className="text-xs text-slate-500 italic mt-2">"{l.observations}"</p>}
                        </div>
                      ))}
                      {pirLogs.length === 0 && (
                        <p className="text-center py-6 text-slate-600 italic text-xs">Nenhuma disseminação vinculada a este PIR ainda.</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={() => { setDisseminationModalPirId(null); setEditingDissemination(null); setIsDisseminationModalOpen(true); }} 
                className="w-full py-6 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 hover:text-purple-400 hover:border-purple-500/50 transition-all text-xs font-black uppercase tracking-widest"
              >
                + Registrar Disseminação Geral
              </button>
            </div>
          );
        default:
          return (
            <div className="text-slate-500 italic text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <div className="flex flex-col items-center gap-4">
                  <Database className="w-12 h-12 opacity-20" />
                  <p>Funcionalidade em desenvolvimento para esta fase.</p>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        <header className="mb-10">
           <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 bg-${config.color}-500/20 text-${config.color}-400 rounded-2xl shadow-lg`}>{config.icon}</div>
              <h1 className="text-4xl font-black text-white tracking-tight">{config.title}</h1>
           </div>
           <p className="text-slate-400 font-medium ml-1">Ciclo de vida de inteligência - Fase: {phase.toUpperCase()}</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
             <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-lg font-bold text-slate-200">Registros Atuais</h3>
                   {phase === 'planning' && <button onClick={() => { setEditingPir(null); setIsPirModalOpen(true); }} className="bg-blue-600 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest">+ Novo PIR</button>}
                </div>
                {renderPhaseContent()}
             </div>
          </div>
          <div className="space-y-6">
             <div className="bg-indigo-600/5 border border-indigo-500/10 p-8 rounded-[2.5rem]">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Guia Rápido</h4>
                <ul className="space-y-4">
                   {config.outputs.map(o => (
                     <li key={o} className="flex gap-3 text-sm text-slate-400 font-medium">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        {o}
                     </li>
                   ))}
                </ul>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    if (!activeClient) return null;

    const stats = [
      { label: 'PIRs Ativos', value: activeClient.phases.planning.pirs.filter(p => p.status === 'Active').length, total: activeClient.phases.planning.pirs.length, color: 'blue', icon: TargetIcon },
      { label: 'Fontes Monitoradas', value: activeClient.phases.collection.sources.length, total: null, color: 'emerald', icon: Search },
      { label: 'Relatórios Produzidos', value: activeClient.phases.analysis.reports.length, total: null, color: 'amber', icon: BarChart3 },
      { label: 'Alertas Disseminados', value: activeClient.phases.dissemination.logs.filter(l => l.status === 'Disseminated' || l.status === 'Acknowledged').length, total: activeClient.phases.dissemination.logs.length, color: 'purple', icon: Share2 },
    ];

    const alertCounts: Record<string, number> = {};
    for (const log of activeClient.phases.dissemination.logs) {
      const date = log.date.substring(5); // MM-DD
      alertCounts[date] = (alertCounts[date] || 0) + 1;
    }
    const alertsData = Object.entries(alertCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const responseTimeData = activeClient.metrics.map(m => {
        const incidentTime = m.incidentDate ? new Date(m.incidentDate).getTime() : new Date(m.discoveryDate).getTime();
        const discoveryTime = new Date(m.discoveryDate).getTime();
        const disseminationTime = new Date(m.disseminationDate).getTime();

        const mttd = Math.max(0, (discoveryTime - incidentTime) / (1000 * 60 * 60));
        const mttdis = Math.max(0, (disseminationTime - discoveryTime) / (1000 * 60 * 60));

        return {
            name: `CAS-${m.id.substring(0,4)}`,
            mttd: parseFloat(mttd.toFixed(1)),
            mttdis: parseFloat(mttdis.toFixed(1))
        };
    }).slice(-10); // Show last 10 cases

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-end">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Visão Geral</h1>
              <p className="text-slate-400 font-medium">Monitoramento em tempo real do programa de inteligência.</p>
           </div>
           <button 
              onClick={() => { setSourceModalPirId(null); setEditingSource(null); setIsSourceModalOpen(true); }}
              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-500 shadow-lg"
           >
              <PlusCircle className="w-4 h-4" /> Nova Fonte
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {stats.map((s, i) => (
             <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.color}-500/10 rounded-full -mr-10 -mt-10 blur-3xl transition-all group-hover:bg-${s.color}-500/20`}></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className={`p-3 bg-${s.color}-500/10 text-${s.color}-400 rounded-2xl`}>
                      <s.icon className="w-6 h-6" />
                   </div>
                   {s.total !== null && <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">{s.total} Total</span>}
                </div>
                <div className="relative z-10">
                   <h3 className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{s.value}</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Activity className="w-4 h-4 text-indigo-500" /> Volume de Alertas & Disseminações
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alertsData}>
                    <defs>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAlerts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
               <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-500" /> Métricas Rápidas
               </h3>
               <div className="space-y-6">
                  <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Eficácia de Prevenção</p>
                     <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-emerald-400">{performanceStats?.prevention || 0}%</span>
                        <span className="text-xs text-slate-500 mb-1.5">dos casos mitigados</span>
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${performanceStats?.prevention || 0}%` }}></div>
                     </div>
                  </div>
                  <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Precisão de Mapeamento</p>
                     <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-indigo-400">{performanceStats?.accuracy || 0}%</span>
                        <span className="text-xs text-slate-500 mb-1.5">dos casos antecipados</span>
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${performanceStats?.accuracy || 0}%` }}></div>
                     </div>
                  </div>
               </div>
           </div>
        </div>

        {/* Novo Histograma de Resposta (Curva) */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Curva de Tempos de Resposta (MTTD vs MTTDis)
                </h3>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                        <span className="text-slate-400">MTTD (Detecção)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-slate-400">MTTDis (Disseminação)</span>
                    </div>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseTimeData}>
                        <defs>
                          <linearGradient id="colorMttd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMttdis" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="h" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="mttd" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMttd)" name="MTTD (Horas)" />
                        <Area type="monotone" dataKey="mttdis" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMttdis)" name="MTTDis (Horas)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
        <div className="p-6 flex items-center gap-4 mb-8">
           <div className="relative">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                 <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></div>
           </div>
           {isSidebarOpen && (
             <div>
               <h2 className="font-black text-lg tracking-tighter text-white leading-none">SENTINEL</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise CTI</p>
             </div>
           )}
        </div>

        <nav className="px-4 space-y-2">
           <button 
             onClick={() => setActivePhase('dashboard')}
             className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${activePhase === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
           >
              <LayoutDashboard className={`w-5 h-5 ${activePhase === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              {isSidebarOpen && <span className="font-bold text-sm">Dashboard</span>}
           </button>
           
           <div className="pt-6 pb-2 px-4">
              {isSidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ciclo de Vida</p>}
           </div>

           {(Object.keys(PHASE_CONFIG) as CTIPhase[]).map(phase => (
             <button 
               key={phase}
               onClick={() => setActivePhase(phase)}
               className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative overflow-hidden ${activePhase === phase ? `bg-${PHASE_CONFIG[phase].color}-500/10 text-${PHASE_CONFIG[phase].color}-400 border border-${PHASE_CONFIG[phase].color}-500/20` : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
             >
                <div className={`${activePhase === phase ? '' : 'text-slate-500 group-hover:text-white'}`}>
                   {PHASE_CONFIG[phase].icon}
                </div>
                {isSidebarOpen && <span className="font-bold text-sm">{PHASE_CONFIG[phase].title.split(' ')[0]}</span>}
                {activePhase === phase && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${PHASE_CONFIG[phase].color}-500`}></div>}
             </button>
           ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-800 bg-slate-950/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">JS</div>
              {isSidebarOpen && (
                 <div className="flex-1">
                    <p className="text-xs font-bold text-white">John Smith</p>
                    <p className="text-[10px] text-slate-500 font-medium">Analista Senior</p>
                 </div>
              )}
              {isSidebarOpen && <button onClick={() => setIsAuthenticated(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-500"><LogOut className="w-4 h-4" /></button>}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-24'} p-6 lg:p-10 relative overflow-hidden`}>
         {/* Top Bar */}
         <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
               <button onClick={toggleSidebar} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <Menu className="w-5 h-5" />
               </button>
               <div className="h-8 w-px bg-slate-800"></div>
               
               <div className="relative group">
                  <button className="flex items-center gap-3 bg-slate-900 border border-slate-800 pl-4 pr-10 py-2.5 rounded-2xl text-sm font-bold text-slate-300 hover:border-slate-700 transition-all min-w-[200px]">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     {activeClient?.name || 'Selecione Organização'}
                     <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </button>
                  <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50">
                     {clients.map(c => (
                        <button key={c.id} onClick={() => setActiveClientId(c.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-colors flex justify-between items-center">
                           {c.name}
                           {c.id === activeClientId && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </button>
                     ))}
                     <div className="h-px bg-slate-800 my-1"></div>
                     <button onClick={() => { setEditingOrg(null); setIsOrgModalOpen(true); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-600/10 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Organização
                     </button>
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all shadow-lg ${isChatOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
               >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Sentinel AI</span>
               </button>
            </div>
         </div>

         {/* Content Area */}
         {activePhase === 'dashboard' && <Dashboard />}
         {activePhase !== 'dashboard' && activePhase !== 'cases' && <PhaseView phase={activePhase} />}
      </main>

      {/* Floating Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-8 right-8 w-96 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl z-[100] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 h-[600px]">
           <div className="px-6 py-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                 <div>
                    <h3 className="font-bold text-white text-sm">Sentinel Assistant</h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online</p>
                 </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900 custom-scrollbar" ref={chatScrollRef}>
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                 <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed">Olá! Sou sua IA de inteligência cibernética. Analiso todos os dados da {activeClient?.name} em tempo real. Como posso ajudar hoje?</p>
                 </div>
              </div>

              {chatMessages.map((msg, idx) => (
                 <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                       {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Sparkles className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`rounded-2xl p-4 border max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800 border-slate-700 rounded-tr-none' : 'bg-indigo-900/20 border-indigo-500/20 rounded-tl-none'}`}>
                       <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                 </div>
              ))}
              
              {isAiTyping && (
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700 flex items-center gap-2">
                       <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                       <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
              )}
           </div>

           <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="relative">
                 <input 
                    type="text" 
                    value={currentChatInput}
                    onChange={e => setCurrentChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Faça uma pergunta sobre os dados..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-4 text-sm text-white focus:border-indigo-500 outline-none"
                 />
                 <button 
                    onClick={handleSendMessage}
                    disabled={!currentChatInput.trim() || isAiTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                 >
                    <Send className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modals */}
      {isPirModalOpen && <PirModal />}
      {isSourceModalOpen && <SourceModal />}
      {isAnalysisModalOpen && <AnalysisModal />}
      {isDisseminationModalOpen && <DisseminationModal />}
      {isOrgModalOpen && <OrgModal />}
      {confirmState && <ConfirmationModal />}
    </div>
  );
}
