
export type CTIPhase = 'planning' | 'collection' | 'analysis' | 'dissemination' | 'feedback' | 'metrics';

export interface StatusHistory {
  status: string;
  date: string;
  action: 'Created' | 'Status Changed' | 'Edited';
}

export interface PIR {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Draft' | 'Archived';
  history?: StatusHistory[];
}

export interface IntelligenceSource {
  id: string;
  pirId: string; // Relationship with PIR
  name: string;
  type: 'Internal' | 'OSINT' | 'FeedComercial' | 'FeedAberto' | 'DarkWeb';
  confidence: number; // 0-100 (OpenCTI standard)
  integrationDate: string;
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Admiralty Scale
}

export interface MetricRecord {
  id: string;
  pirId: string;
  hasIncident: boolean;
  incidentDate?: string;
  discoveryDate: string;
  disseminationDate: string;
  wasPreviouslyReported: boolean;
  incidentPrevented: boolean;
  impactScale: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface DisseminationLog {
  id: string;
  date: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  reportName: string;
  observations?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentData?: string; // Base64 simulated storage
}

export interface Report {
  id: string;
  pirId: string; // Relationship with PIR
  title: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  content: string;
  date: string;
}

export interface KPI {
  name: string;
  value: number;
  unit: string;
}

export interface ClientData {
  id: string;
  name: string;
  sector: string;
  description?: string;
  stakeholderName?: string;
  stakeholderEmail?: string;
  phases: {
    planning: { pirs: PIR[]; stakeholders: string[] };
    collection: { sources: IntelligenceSource[] };
    analysis: { reports: Report[]; ttps: string[] };
    dissemination: { 
      integrations: string[]; 
      alertsCount: number;
      logs: DisseminationLog[];
    };
    feedback: { kpis: KPI[]; improvements: string[] };
  };
  metrics: MetricRecord[];
}

export interface AppState {
  clients: ClientData[];
  activeClientId: string | null;
}
