
import React from 'react';
import { Target, Search, BarChart3, Share2 } from 'lucide-react';
import { CTIPhase } from './types';

export const PHASE_CONFIG: Record<CTIPhase, { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  inputs: string[];
  prerequisites: string[];
  interactions: string[];
  outputs: string[];
}> = {
  planning: {
    title: 'Direção e Planejamento',
    icon: <Target className="w-5 h-5" />,
    color: 'blue',
    inputs: ['Objetivos de negócio', 'Ativos críticos', 'Feedback da liderança'],
    prerequisites: ['Missão de inteligência', 'Apoio executivo', 'Stakeholders identificados'],
    interactions: ['Entrevistas com decisores', 'Alinhamento de risco'],
    outputs: ['PIRs (Requisitos de Inteligência)', 'Matriz de Coleta']
  },
  collection: {
    title: 'Coleta e Fontes',
    icon: <Search className="w-5 h-5" />,
    color: 'emerald',
    inputs: ['Fontes de Logs', 'Commercial Threat Feeds', 'OSINT/Dark Web'],
    prerequisites: ['Plataformas TIP/SIEM', 'Acordos de compartilhamento'],
    interactions: ['Gestão de confiança de fontes', 'Normalização Admiralty Scale'],
    outputs: ['Fontes integradas', 'Inventário de inteligência']
  },
  analysis: {
    title: 'Análise e Produção',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'amber',
    inputs: ['Dados processados', 'Contexto externo/tendências'],
    prerequisites: ['Analistas qualificados', 'MITRE ATT&CK / Diamond Model'],
    interactions: ['Correlação de dados', 'Atribuição de campanhas'],
    outputs: ['Relatórios Estratégicos', 'Mapeamento de TTPs']
  },
  dissemination: {
    title: 'Disseminação e Integração',
    icon: <Share2 className="w-5 h-5" />,
    color: 'purple',
    inputs: ['Alertas SIEM', 'Relatórios de TTPs', 'Tendências'],
    prerequisites: ['Canais de comunicação', 'Automação SOAR'],
    interactions: ['Triagem SOC', 'Cenários Red/Purple Team'],
    outputs: ['Regras de detecção', 'Hipóteses de Hunting', 'ROI']
  }
};
