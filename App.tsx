
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Shield, 
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
  ShieldCheck,
  Zap,
  Target as TargetIcon
} from 'lucide-react';
import { ClientData, CTIPhase, PIR, IntelligenceSource, Report, StatusHistory, MetricRecord, DisseminationLog } from './types';
import { PHASE_CONFIG } from './constants';
import { generateCTIInsight } from './services/gemini';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart as ReBarChart, Bar, Cell, Legend,
  PieChart, Pie
} from 'recharts';

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
          { id: 's1', pirId: 'p1', name: 'AbuseIPDB', type: 'OSINT', credibility: 'B', reliability: 'B', integrationDate: '2024-01-15' },
          { id: 's2', pirId: 'p2', name: 'Flashpoint', type: 'FeedComercial', credibility: 'A', reliability: 'A', integrationDate: '2024-02-10' }
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
          { id: 'l1', date: '2024-05-15', type: 'Tactical', reportName: 'IOC_Feed_May_2024.pdf', observations: 'Enviado para o time de SOC e Resposta a Incidentes.' }
        ]
      },
      feedback: { kpis: [], improvements: [] }
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
  const [clients, setClients] = useState<ClientData[]>(INITIAL_CLIENTS);
  const [activeClientId, setActiveClientId] = useState<string | null>(INITIAL_CLIENTS[0].id);
  const [activePhase, setActivePhase] = useState<CTIPhase | 'dashboard' | 'cases'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [expandedPirId, setExpandedPirId] = useState<string | null>(null);

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
      historico_casos_incidentes: activeClient.metrics.map(m => ({
        foi_incidente: m.hasIncident,
        impacto: m.impactScale,
        mitigado: m.incidentPrevented,
        mapeado_previamente: m.wasPreviouslyReported,
        pir_associado: activeClient.phases.planning.pirs.find(p => p.id === m.pirId)?.title,
        mttd_horas: m.incidentDate ? (new Date(m.discoveryDate).getTime() - new Date(m.incidentDate).getTime()) / 3600000 : 0
      })),
      relatorios_analise: activeClient.phases.analysis.reports.map(r => ({
        titulo: r.title,
        tipo: r.type,
        sumario: r.content
      })),
      disseminacao: activeClient.phases.dissemination.logs.map(l => ({
        arquivo: l.reportName,
        tipo: l.type,
        obs: l.observations
      }))
    }, null, 2);
  };

  const handleAiInsight = async () => {
    if (!activeClient) return;
    setLoadingAi(true);
    setAiInsight(null);
    try {
      const context = getContextString();
      const prompt = "Analise profundamente a eficácia do programa. Compare os incidentes reais com os PIRs mapeados. Identifique se o programa está sendo reativo ou proativo e sugira 3 ações estratégicas baseadas nos dados de desempenho.";
      const result = await generateCTIInsight(prompt, context);
      setAiInsight(result);
    } catch (e) { 
      console.error(e); 
      setAiInsight("Erro ao gerar correlação de dados.");
    } finally { 
      setLoadingAi(false); 
    }
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
          dissemination: { integrations: [], alertsCount: 0, logs: [] },
          feedback: { kpis: [], improvements: [] }
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
    if (clients.length <= 1) return alert("Deve haver pelo menos uma organização.");
    if (window.confirm("Excluir organização e todos os dados CTI associados?")) {
      setClients(prev => prev.filter(c => c.id !== id));
      if (activeClientId === id) setActiveClientId(clients.filter(c => c.id !== id)[0]?.id || null);
    }
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
    if (window.confirm("Excluir este PIR e dados associados?")) {
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, phases: { ...c.phases, planning: { ...c.phases.planning, pirs: c.phases.planning.pirs.filter(p => p.id !== id) } } } : c));
    }
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

  const handleDeleteSource = (id: string) => {
    if (!activeClientId) return;
    if (window.confirm("Excluir esta fonte de coleta?")) {
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, phases: { ...c.phases, collection: { ...c.phases.collection, sources: c.phases.collection.sources.filter(s => s.id !== id) } } } : c));
    }
  };

  const handleAddOrEditAnalysis = (report: Omit<Report, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => {
      if (c.id !== activeClientId) return c;
      const updatedReports = editingAnalysis
        ? c.phases.analysis.reports.map(r => r.id === editingAnalysis.id ? { ...report, id: editingAnalysis.id } : r)
        : [...c.phases.analysis.reports, { ...report, id: Math.random().toString(36).substr(2, 9) }];
      return { ...c, phases: { ...c.phases, analysis: { ...c.phases.analysis, reports: updatedReports } } };
    }));
    setIsAnalysisModalOpen(false);
    setEditingAnalysis(null);
  };

  const handleDeleteAnalysis = (id: string) => {
    if (!activeClientId) return;
    if (window.confirm("Excluir este relatório de análise?")) {
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, phases: { ...c.phases, analysis: { ...c.phases.analysis, reports: c.phases.analysis.reports.filter(r => r.id !== id) } } } : c));
    }
  };

  const handleAddOrEditMetric = (metric: Omit<MetricRecord, 'id'>) => {
    if (!activeClientId) return;
    setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, metrics: editingMetric ? c.metrics.map(m => m.id === editingMetric.id ? { ...metric, id: editingMetric.id } : m) : [...c.metrics, { ...metric, id: Math.random().toString(36).substr(2, 9) }] } : c));
    setIsMetricModalOpen(false);
    setEditingMetric(null);
  };

  const handleDeleteMetric = (id: string) => {
    if (!activeClientId) return;
    if (window.confirm("Excluir registro do caso?")) {
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, metrics: c.metrics.filter(m => m.id !== id) } : c));
    }
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

  const handleDeleteDissemination = (id: string) => {
    if (!activeClientId) return;
    if (window.confirm("Excluir este log de disseminação?")) {
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, phases: { ...c.phases, dissemination: { ...c.phases.dissemination, logs: c.phases.dissemination.logs.filter(l => l.id !== id) } } } : c));
    }
  };

  // --- Modal Components ---

  const OrgModal = () => {
    const [form, setForm] = useState({ 
      name: editingOrg?.name || '', 
      sector: editingOrg?.sector || '',
      description: editingOrg?.description || '',
      stakeholderName: editingOrg?.stakeholderName || '',
      stakeholderEmail: editingOrg?.stakeholderEmail || ''
    });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Globe className="w-6 h-6 text-indigo-400" /> {editingOrg ? 'Editar Organização' : 'Nova Organização'}</h3>
            <button onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Organização</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-indigo-500 transition-all outline-none" placeholder="ex: Banco Central" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Setor / Indústria</label>
                <input type="text" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-indigo-500 transition-all outline-none" placeholder="ex: Financeiro, Saúde" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Estratégica</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white resize-none focus:border-indigo-500 transition-all outline-none" placeholder="Área de atuação e ativos críticos..." />
            </div>
            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-5 flex items-center gap-2"><User className="w-4 h-4" /> Gestor Responsável</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" value={form.stakeholderName} onChange={e => setForm({...form, stakeholderName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none" placeholder="ex: João Silva" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                  <input type="email" value={form.stakeholderEmail} onChange={e => setForm({...form, stakeholderEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none" placeholder="ex: joao@org.com" />
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsOrgModalOpen(false); setEditingOrg(null); }} className="text-sm text-slate-400 font-bold hover:text-white transition-colors">Cancelar</button>
            <button onClick={() => handleAddOrEditOrg(form)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-900/20 transition-all active:scale-95">Salvar Organização</button>
          </div>
        </div>
      </div>
    );
  };

  const MetricEntryModal = () => {
    const [form, setForm] = useState<Omit<MetricRecord, 'id'>>(editingMetric ? { ...editingMetric } : { pirId: activeClient?.phases.planning.pirs[0]?.id || '', hasIncident: false, incidentDate: '', discoveryDate: new Date().toISOString().substring(0, 16), disseminationDate: new Date().toISOString().substring(0, 16), wasPreviouslyReported: false, incidentPrevented: false, impactScale: 'Medium' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsMetricModalOpen(false); setEditingMetric(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Activity className="w-6 h-6 text-rose-500" /> {editingMetric ? 'Editar Registro' : 'Novo Registro de Caso'}</h3>
            <button onClick={() => { setIsMetricModalOpen(false); setEditingMetric(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a PIR</label>
                <select value={form.pirId} onChange={e => setForm({...form, pirId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-rose-500 outline-none">
                  {activeClient?.phases.planning.pirs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Severidade/Impacto</label>
                <select value={form.impactScale} onChange={e => setForm({...form, impactScale: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-rose-500 outline-none">
                  <option value="Low">Baixo</option><option value="Medium">Médio</option><option value="High">Alto</option><option value="Critical">Crítico</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
               <input type="checkbox" id="hasIncident" checked={form.hasIncident} onChange={e => setForm({...form, hasIncident: e.target.checked})} className="w-5 h-5 rounded-lg bg-slate-950 border-slate-800 text-rose-600 focus:ring-rose-600" />
               <label htmlFor="hasIncident" className="text-sm text-slate-300 font-bold">Este caso foi um incidente de segurança real?</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {form.hasIncident && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início do Incidente</label>
                  <input type="datetime-local" value={form.incidentDate} onChange={e => setForm({...form, incidentDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-rose-500 outline-none" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Descoberta</label>
                <input type="datetime-local" value={form.discoveryDate} onChange={e => setForm({...form, discoveryDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-rose-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Disseminação</label>
                <input type="datetime-local" value={form.disseminationDate} onChange={e => setForm({...form, disseminationDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white focus:border-rose-500 outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.wasPreviouslyReported} onChange={e => setForm({...form, wasPreviouslyReported: e.target.checked})} className="w-5 h-5 rounded-lg bg-slate-950 border-slate-800 text-indigo-600" />
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">A ameaça já constava em nossos relatórios de inteligência?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.incidentPrevented} onChange={e => setForm({...form, incidentPrevented: e.target.checked})} className="w-5 h-5 rounded-lg bg-slate-950 border-slate-800 text-emerald-600" />
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Conseguimos mitigar ou impedir o dano total?</span>
              </label>
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsMetricModalOpen(false); setEditingMetric(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditMetric(form)} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-rose-900/20 transition-all">{editingMetric ? 'Atualizar' : 'Salvar Caso'}</button>
          </div>
        </div>
      </div>
    );
  };

  const PirModal = () => {
    const [form, setForm] = useState<Omit<PIR, 'id'>>(editingPir ? { ...editingPir } : { title: '', description: '', priority: 'Medium', status: 'Active' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsPirModalOpen(false); setEditingPir(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><TargetIcon className="w-6 h-6 text-blue-500" /> {editingPir ? 'Editar PIR' : 'Novo Requisito (PIR)'}</h3>
            <button onClick={() => { setIsPirModalOpen(false); setEditingPir(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Requisito</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500" placeholder="Ex: Monitoramento de Phishing" />
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
              <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 resize-none" placeholder="O que precisamos saber sobre esta ameaça?" />
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
    const [form, setForm] = useState<Omit<IntelligenceSource, 'id'>>(editingSource ? { ...editingSource } : { 
      pirId: sourceModalPirId || activeClient?.phases.planning.pirs[0]?.id || '', 
      name: '', 
      type: 'OSINT', 
      credibility: 'C', 
      reliability: 'C', 
      integrationDate: new Date().toISOString().split('T')[0] 
    });

    const getScoreColor = (rel: keyof typeof SCALE_VALUES, cred: keyof typeof SCALE_VALUES) => {
      const sum = SCALE_VALUES[rel] + SCALE_VALUES[cred];
      if (sum >= 10) return 'bg-emerald-500';
      if (sum >= 7) return 'bg-amber-500';
      return 'bg-rose-500';
    };

    const handleMatrixClick = (rel: keyof typeof SCALE_VALUES, cred: keyof typeof SCALE_VALUES) => {
      setForm(prev => ({ ...prev, reliability: rel, credibility: cred }));
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsSourceModalOpen(false); setEditingSource(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Search className="w-6 h-6 text-emerald-500" /> {editingSource ? 'Editar Fonte' : 'Nova Coleta e Fonte'}</h3>
            <button onClick={() => { setIsSourceModalOpen(false); setEditingSource(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Fonte</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500" placeholder="Ex: Shodan.io" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Coleta</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                  <option value="OSINT">OSINT</option><option value="FeedComercial">Feed Comercial</option><option value="Internal">Interna</option><option value="DarkWeb">Dark Web</option><option value="FeedAberto">Feed Aberto</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confiabilidade Admiralty (A-F)</label>
                <select value={form.reliability} onChange={e => setForm({...form, reliability: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                   {SCALE_ORDER.map(s => <option key={s} value={s}>{s} - {SCALE_LABELS.reliability[s]}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Credibilidade Admiralty (A-F)</label>
                <select value={form.credibility} onChange={e => setForm({...form, credibility: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500">
                   {SCALE_ORDER.map(s => <option key={s} value={s}>{s} - {SCALE_LABELS.credibility[s]}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-center">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Matriz de Inteligência 6x6</h4>
              <div className="grid grid-cols-7 gap-1">
                <div />
                {SCALE_ORDER.map(s => <div key={s} className="w-6 h-6 text-[8px] flex items-center justify-center font-black text-slate-600">{s}</div>)}
                {SCALE_ORDER.map(r => (
                  <React.Fragment key={r}>
                    <div className="w-6 h-6 text-[8px] flex items-center justify-center font-black text-slate-600">{r}</div>
                    {SCALE_ORDER.map(c => (
                      <div 
                        key={c} 
                        onClick={() => handleMatrixClick(r, c)}
                        className={`w-6 h-6 rounded-sm border border-slate-900 transition-all cursor-pointer hover:border-white/20 ${
                          form.reliability === r && form.credibility === c 
                            ? `${getScoreColor(r, c)} shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-110 z-10` 
                            : 'bg-slate-800/20'
                        }`}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Pontuação de Matriz</p>
                <p className={`text-4xl font-black ${form.reliability === 'A' && form.credibility === 'A' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {form.reliability}{form.credibility}
                </p>
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

  const AnalysisModal = () => {
    const [form, setForm] = useState<Omit<Report, 'id'>>(editingAnalysis ? { ...editingAnalysis } : { pirId: analysisModalPirId || activeClient?.phases.planning.pirs[0]?.id || '', title: '', type: 'Operational', content: '', date: new Date().toISOString().split('T')[0] });
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular a PIR</label>
              <select value={form.pirId} onChange={e => setForm({...form, pirId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500">
                {activeClient?.phases.planning.pirs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Conteúdo</label>
              <textarea rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-amber-500 resize-none" placeholder="Sumário executivo e descobertas técnicas..." />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsAnalysisModalOpen(false); setEditingAnalysis(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditAnalysis(form)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Relatório</button>
          </div>
        </div>
      </div>
    );
  };

  const DisseminationModal = () => {
    const [form, setForm] = useState<Omit<DisseminationLog, 'id'>>(editingDissemination ? { ...editingDissemination } : { date: new Date().toISOString().split('T')[0], type: 'Tactical', reportName: '', observations: '' });
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }} />
        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-bold text-xl flex items-center gap-3"><Share2 className="w-6 h-6 text-purple-500" /> {editingDissemination ? 'Editar Log' : 'Nova Disseminação/Alerta'}</h3>
            <button onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }}><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500">
                  <option value="Tactical">Tático</option><option value="Operational">Operacional</option><option value="Strategic">Estratégico</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Report/Arquivo</label>
              <input type="text" value={form.reportName} onChange={e => setForm({...form, reportName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500" placeholder="Ex: IOC_Feed_May.csv" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações</label>
              <textarea rows={3} value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-purple-500 resize-none" placeholder="Canais de envio, times notificados..." />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-800/20 border-t border-slate-800 flex justify-end gap-4">
            <button onClick={() => { setIsDisseminationModalOpen(false); setEditingDissemination(null); }} className="text-sm text-slate-400 font-bold">Cancelar</button>
            <button onClick={() => handleAddOrEditDissemination(form)} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all">Salvar Log</button>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Page Components ---
  const Dashboard = () => {
    if (!activeClient) return null;
    const chartData = activeClient.metrics.map(m => {
      const diffHours = (d1: string, d2: string) => Math.max(0, (new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60));
      return { date: new Date(m.discoveryDate).toLocaleDateString(), mttd: diffHours(m.discoveryDate, m.incidentDate || m.discoveryDate), mttdis: diffHours(m.disseminationDate, m.discoveryDate) };
    });
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Sentinel Dashboard</h1>
            <p className="text-slate-400 font-medium">Insights operacionais e eficácia do ciclo de inteligência.</p>
          </div>
          {activeClient && (
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2rem] flex gap-8 items-center shadow-2xl backdrop-blur-xl">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Setor Alvo</span>
                  <span className="text-sm font-bold text-slate-200">{activeClient.sector}</span>
               </div>
               <div className="w-px h-10 bg-slate-800" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ponto de Contato</span>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-200">{activeClient.stakeholderName || 'N/A'}</span>
                  </div>
               </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="MTTD Médio" value={`${performanceStats?.mttd || '0.0'}h`} color="rose" description="Tempo médio de detecção" />
          <StatCard title="MTTDis Médio" value={`${performanceStats?.mttdis || '0.0'}h`} color="indigo" description="Tempo para disseminação" />
          <StatCard title="Precisão de Inteligência" value={`${performanceStats?.accuracy || '0'}%`} color="emerald" description="Ameaças mapeadas em PIRs" />
          <StatCard title="Total de Casos" value={performanceStats?.total || 0} color="amber" description="Incidentes e potenciais" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] h-[400px] shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-8 flex items-center gap-3 tracking-widest"><TrendingUp className="w-4 h-4 text-emerald-400" /> Histórico Temporal de Resposta</h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMttd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorMttdis" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="mttd" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorMttd)" name="MTTD" />
                <Area type="monotone" dataKey="mttdis" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMttdis)" name="MTTDis" />
                <Legend verticalAlign="top" align="right" height={36}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-2xl relative group cursor-pointer" onClick={handleAiInsight}>
             <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" />
             </div>
             <div>
                <h3 className="text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Eficácia Preventiva</h3>
                <p className="text-5xl font-black text-white">{performanceStats?.prevention}%</p>
                <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed italic">Clique para o Analista de IA correlacionar as métricas de prevenção com a matriz de coleta atual.</p>
             </div>
             <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95">
                Correlacionar com IA
             </button>
          </div>
        </div>
      </div>
    );
  };

  const PhaseView = ({ phase }: { phase: CTIPhase }) => {
    const config = PHASE_CONFIG[phase];
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
                        <button onClick={() => { setEditingPir(p); setIsPirModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePir(p.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
              ))}
              {activeClient.phases.planning.pirs.length === 0 && <p className="text-center py-10 text-slate-600 italic">Nenhum PIR definido.</p>}
            </div>
          );
        case 'collection':
          return (
            <div className="space-y-4">
              {activeClient.phases.collection.sources.map(s => (
                <div key={s.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition-all group">
                   <div className="flex justify-between items-center">
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
                        <button onClick={() => { setEditingSource(s); setIsSourceModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteSource(s.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
              ))}
              <button onClick={() => { setEditingSource(null); setIsSourceModalOpen(true); }} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-xs font-black uppercase tracking-widest">+ Adicionar Coleta e Fonte</button>
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
                        <button onClick={() => { setEditingAnalysis(r); setIsAnalysisModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteAnalysis(r.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
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
            <div className="space-y-4">
               {activeClient.phases.dissemination.logs.map(l => (
                 <div key={l.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition-all group">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Share2 className="w-4 h-4" /></div>
                          <div>
                             <h4 className="font-bold text-slate-100">{l.reportName}</h4>
                             <span className="text-[10px] font-bold text-slate-500 uppercase">{l.type} • {l.date}</span>
                          </div>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingDissemination(l); setIsDisseminationModalOpen(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => handleDeleteDissemination(l.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    {l.observations && <p className="text-xs text-slate-500 italic">"{l.observations}"</p>}
                 </div>
               ))}
               <button onClick={() => { setEditingDissemination(null); setIsDisseminationModalOpen(true); }} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-purple-400 hover:border-purple-500/50 transition-all text-xs font-black uppercase tracking-widest">+ Registrar Disseminação</button>
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

  const NavItem = ({ active, onClick, icon, label, color = 'indigo' }: any) => {
    const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.indigo;
    return (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${active ? `${variant.bg} ${variant.text} border ${variant.border} shadow-lg shadow-${color}-500/10` : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}><div className={`shrink-0 ${active ? variant.text : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</div><span className="text-sm font-bold tracking-tight">{label}</span></button>);
  }

  const StatCard = ({ title, value, color, description }: any) => {
    const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.indigo;
    return (<div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-slate-600 transition-all shadow-xl group relative overflow-hidden"><div className={`absolute top-0 right-0 w-24 h-24 ${variant.bg} rounded-full -mr-12 -mt-12 blur-3xl opacity-50`}></div><p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest relative z-10">{title}</p><div className="flex items-baseline gap-2 relative z-10"><span className="text-4xl font-bold text-white group-hover:scale-105 transition-transform inline-block origin-left">{value}</span></div>{description && <p className="text-[11px] text-slate-500 mt-2 font-medium relative z-10">{description}</p>}</div>);
  }

  const CasesManager = () => {
    if (!activeClient) return null;
    const typeData = [
      { name: 'Incidente', value: performanceStats?.incidents || 0, color: '#f43f5e' },
      { name: 'Potencial', value: performanceStats?.potentials || 0, color: '#f59e0b' }
    ];
    const accuracyData = [
      { name: 'Antecipado', value: performanceStats?.mapped || 0, color: '#10b981' },
      { name: 'Não Mapeado', value: performanceStats?.unmapped || 0, color: '#6366f1' }
    ];
    const resultData = [
      { name: 'Mitigado', value: performanceStats?.mitigated || 0, color: '#10b981' },
      { name: 'Consumado', value: performanceStats?.consummated || 0, color: '#f43f5e' }
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestão de Casos</h1>
            <p className="text-slate-400">Visão técnica detalhada e análise de eficácia preventiva.</p>
          </div>
          <button onClick={() => { setEditingMetric(null); setIsMetricModalOpen(true); }} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-900/20 active:scale-95">
            <Plus className="w-5 h-5" /> Registrar Caso
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-rose-500" /> Distribuição por Tipo</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" innerRadius={45} outerRadius={60} stroke="none" paddingAngle={5}>
                    {typeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><TargetIcon className="w-3.5 h-3.5 text-indigo-500" /> Precisão (Mapeado vs Não)</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={accuracyData} dataKey="value" innerRadius={45} outerRadius={60} stroke="none" paddingAngle={5}>
                    {accuracyData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Resultado Operacional</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resultData} dataKey="value" innerRadius={45} outerRadius={60} stroke="none" paddingAngle={5}>
                    {resultData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 uppercase tracking-widest text-[10px] font-black bg-slate-900/80 backdrop-blur">
                  <th className="py-5 px-6">Identificação & PIR</th>
                  <th className="py-5 px-6">Tipo & Temporalidade</th>
                  <th className="py-5 px-6">Impacto & Status</th>
                  <th className="py-5 px-6">Métricas (H)</th>
                  <th className="py-5 px-6">Resultado</th>
                  <th className="py-5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeClient.metrics.map(m => {
                  const pir = activeClient.phases.planning.pirs.find(p => p.id === m.pirId);
                  const mttd = m.incidentDate ? (new Date(m.discoveryDate).getTime() - new Date(m.incidentDate).getTime()) / 3600000 : 0;
                  const mttdis = (new Date(m.disseminationDate).getTime() - new Date(m.discoveryDate).getTime()) / 3600000;
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-all group">
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-100 font-bold leading-tight">{pir?.title || 'PIR Não Encontrado'}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-950 w-fit px-1.5 rounded border border-slate-800">CAS-{m.id.substring(0,6)}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1.5">
                          {m.hasIncident ? (
                            <span className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]"><AlertTriangle className="w-3 h-3" /> INCIDENTE REAL</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px]"><Zap className="w-3 h-3" /> POTENCIAL/DISCOVERY</span>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <Calendar className="w-3 h-3" /> {new Date(m.discoveryDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                              m.impactScale === 'Critical' ? 'bg-rose-500/20 text-rose-500 border-rose-500/20' :
                              m.impactScale === 'High' ? 'bg-orange-500/20 text-orange-500 border-orange-500/20' :
                              'bg-slate-700/50 text-slate-400 border-slate-600/50'
                            }`}>{m.impactScale}</span>
                            {m.wasPreviouslyReported ? (
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" /> Antecipado
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20 uppercase">Não Mapeado</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center justify-between gap-4 text-[10px]">
                              <span className="text-slate-500 uppercase font-black tracking-tighter">MTTD</span>
                              <span className={`font-mono font-bold ${mttd > 24 ? 'text-rose-400' : 'text-emerald-400'}`}>{mttd.toFixed(1)}h</span>
                           </div>
                           <div className="flex items-center justify-between gap-4 text-[10px]">
                              <span className="text-slate-500 uppercase font-black tracking-tighter">MTTDis</span>
                              <span className="text-indigo-400 font-mono font-bold">{mttdis.toFixed(1)}h</span>
                           </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {m.incidentPrevented ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/5 border border-emerald-400/10 px-3 py-1.5 rounded-xl w-fit">
                            <ShieldCheck className="w-4 h-4" /> Mitigado
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-500 font-bold bg-rose-500/5 border border-rose-500/10 px-3 py-1.5 rounded-xl w-fit">
                            <Activity className="w-4 h-4" /> Consumado
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingMetric(m); setIsMetricModalOpen(true); }} className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteMetric(m.id)} className="p-2.5 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {isMetricModalOpen && <MetricEntryModal />}
      {isDisseminationModalOpen && <DisseminationModal />}
      {isPirModalOpen && <PirModal />}
      {isSourceModalOpen && <SourceModal />}
      {isAnalysisModalOpen && <AnalysisModal />}
      {isOrgModalOpen && <OrgModal />}

      <aside className={`bg-slate-900/60 border-r border-slate-800/50 transition-all duration-500 flex flex-col z-20 backdrop-blur-2xl ${isSidebarOpen ? 'w-80' : 'w-0 -translate-x-full overflow-hidden'}`}>
        <div className="p-10 flex items-center gap-4 border-b border-slate-800/30">
          <div className="bg-indigo-600 p-3 rounded-[1.25rem] shadow-2xl shadow-indigo-600/30 rotate-3 group-hover:rotate-0 transition-transform">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white uppercase italic">Sentinel</span>
        </div>
        
        <div className="px-6 py-10 flex-1 space-y-10 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase px-4 mb-6 block tracking-[0.2em]">Organizações</label>
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="group/org relative">
                  <button onClick={() => setActiveClientId(c.id)} className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all truncate pr-20 ${activeClientId === c.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${activeClientId === c.id ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-700'}`}></div>
                    <span className="truncate">{c.name}</span>
                  </button>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/org:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); setEditingOrg(c); setIsOrgModalOpen(true); }} className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteOrg(c.id); }} className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingOrg(null); setIsOrgModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] text-xs text-slate-500 font-black border-2 border-dashed border-slate-800 hover:border-slate-700 hover:text-slate-400 transition-all mt-4 uppercase tracking-widest">
                <Plus className="w-4 h-4" /> Novo Cliente
              </button>
            </div>
          </div>
          <nav className="space-y-10">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase px-4 mb-6 block tracking-[0.2em]">Principal</label>
              <div className="space-y-2">
                <NavItem active={activePhase === 'dashboard'} onClick={() => setActivePhase('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label="Visão Sentinel" />
                <NavItem active={activePhase === 'cases'} onClick={() => setActivePhase('cases')} icon={<Activity className="w-5 h-5" />} label="Gestão de Casos" color="rose" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase px-4 mb-6 block tracking-[0.2em]">Ciclo de Inteligência</label>
              <div className="space-y-2">
                {(Object.keys(PHASE_CONFIG) as CTIPhase[]).filter(p => p !== 'metrics').map(p => (
                  <NavItem key={p} active={activePhase === p} onClick={() => setActivePhase(p)} icon={PHASE_CONFIG[p].icon} label={p === 'collection' ? PHASE_CONFIG[p].title : PHASE_CONFIG[p].title.split(' ')[0]} color={PHASE_CONFIG[p].color} />
                ))}
              </div>
            </div>
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <header className="h-24 border-b border-slate-800/30 px-12 flex items-center justify-between bg-slate-950/60 backdrop-blur-3xl sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <button onClick={toggleSidebar} className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg active:scale-95">
              {isSidebarOpen ? <ArrowLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
              <span className="text-slate-600">CLIENT_ID</span>
              <ChevronRight className="w-4 h-4 text-slate-800" />
              <span className="text-slate-100 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{activeClient?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button disabled={loadingAi} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 disabled:opacity-50" onClick={handleAiInsight}>
                {loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Analista de IA
             </button>
             <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3.5 rounded-2xl border transition-all shadow-xl ${isChatOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                <MessageSquare className="w-6 h-6" />
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto px-12 py-12 relative custom-scrollbar">
          {aiInsight && (
            <div className="mb-12 p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] flex gap-8 animate-in slide-in-from-top-6 duration-700 relative group overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
              <div className="bg-indigo-600/10 p-5 rounded-3xl h-fit border border-indigo-500/20 shadow-inner">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                   <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">Correlação Estratégica AI</h4>
                   <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full font-black border border-indigo-500/30 uppercase">Gemini 3 Pro Active Thinking</span>
                </div>
                <div className="text-base text-slate-200 leading-relaxed font-medium whitespace-pre-wrap selection:bg-indigo-500/30">{aiInsight}</div>
              </div>
              <button onClick={() => setAiInsight(null)} className="shrink-0 text-slate-700 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full h-fit"><X className="w-6 h-6" /></button>
            </div>
          )}
          
          <div className="max-w-[1600px] mx-auto">
            {activePhase === 'dashboard' ? <Dashboard /> : activePhase === 'cases' ? <CasesManager /> : <PhaseView phase={activePhase as CTIPhase} />}
          </div>
        </div>

        <div className={`fixed right-10 top-28 bottom-10 w-[420px] bg-slate-900 border border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-30 transition-all duration-500 flex flex-col rounded-[2.5rem] overflow-hidden ${isChatOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95 pointer-events-none'}`}>
           <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg rotate-3"><MessageSquare className="w-5 h-5 text-white" /></div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">CTI Analyst</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Gemini 3 Pro Intelligence</p>
                 </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
           </div>
           
           <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/40 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                   <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mb-8 border border-indigo-500/20">
                      <Sparkles className="w-10 h-10 text-indigo-500" />
                   </div>
                   <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">Assistente Sentinel Online</p>
                   <p className="text-xs text-slate-500 mt-2">Como posso auxiliar no cruzamento de dados CTI hoje?</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[90%] p-4 rounded-3xl text-sm leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-slate-700 backdrop-blur-sm'}`}>
                      {msg.content}
                   </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                   <div className="bg-slate-800/50 p-4 rounded-3xl rounded-tl-none border border-slate-800 shadow-xl">
                      <div className="flex gap-2">
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                 <input 
                    type="text" 
                    value={currentChatInput}
                    onChange={(e) => setCurrentChatInput(e.target.value)}
                    placeholder="Analisar riscos para este cliente..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:border-indigo-500 transition-all outline-none shadow-inner"
                 />
                 <button type="submit" disabled={!currentChatInput.trim() || isAiTyping} className="absolute right-2.5 top-2.5 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg active:scale-90 disabled:opacity-30 disabled:grayscale">
                    <Send className="w-5 h-5" />
                 </button>
              </form>
           </div>
        </div>
      </main>
    </div>
  );
}
