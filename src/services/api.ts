const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/login', { username, password }),

  register: (username: string, email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/register', { username, email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<{ token: string }>('/auth/refresh', { refreshToken }),

  me: () => api.get<{ user: AuthUser }>('/auth/me'),
};

// Organizations API
export const organizationsApi = {
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Organization>>('/organizations', { page: String(page), limit: String(limit) }),

  get: (id: string) => api.get<Organization>(`/organizations/${id}`),

  getFull: (id: string) => api.get<OrganizationFull>(`/organizations/${id}/full`),

  create: (data: CreateOrganizationData) =>
    api.post<Organization>('/organizations', data),

  update: (id: string, data: CreateOrganizationData) =>
    api.put<Organization>(`/organizations/${id}`, data),

  delete: (id: string) => api.delete(`/organizations/${id}`),
};

// PIRs API
export const pirsApi = {
  list: (organizationId?: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<PIR>>('/pirs', {
      page: String(page),
      limit: String(limit),
      ...(organizationId && { organizationId }),
    }),

  get: (id: string) => api.get<PIR>(`/pirs/${id}`),

  create: (data: CreatePIRData) => api.post<PIR>('/pirs', data),

  update: (id: string, data: CreatePIRData) => api.put<PIR>(`/pirs/${id}`, data),

  delete: (id: string) => api.delete(`/pirs/${id}`),
};

// Sources API
export const sourcesApi = {
  list: (pirId?: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<IntelligenceSource>>('/sources', {
      page: String(page),
      limit: String(limit),
      ...(pirId && { pirId }),
    }),

  get: (id: string) => api.get<IntelligenceSource>(`/sources/${id}`),

  create: (data: CreateSourceData) =>
    api.post<IntelligenceSource>('/sources', data),

  update: (id: string, data: CreateSourceData) =>
    api.put<IntelligenceSource>(`/sources/${id}`, data),

  delete: (id: string) => api.delete(`/sources/${id}`),
};

// Reports API
export const reportsApi = {
  list: (pirId?: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<Report>>('/reports', {
      page: String(page),
      limit: String(limit),
      ...(pirId && { pirId }),
    }),

  get: (id: string) => api.get<Report>(`/reports/${id}`),

  create: (data: CreateReportData) => api.post<Report>('/reports', data),

  update: (id: string, data: CreateReportData) =>
    api.put<Report>(`/reports/${id}`, data),

  delete: (id: string) => api.delete(`/reports/${id}`),

  analyze: (id: string) =>
    api.post<{ analysis: string }>(`/reports/${id}/analyze`),
};

// Disseminations API
export const disseminationsApi = {
  list: (pirId?: string, status?: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<DisseminationLog>>('/disseminations', {
      page: String(page),
      limit: String(limit),
      ...(pirId && { pirId }),
      ...(status && { status }),
    }),

  get: (id: string) => api.get<DisseminationLog>(`/disseminations/${id}`),

  create: (data: CreateDisseminationData) =>
    api.post<DisseminationLog>('/disseminations', data),

  update: (id: string, data: Partial<CreateDisseminationData>) =>
    api.put<DisseminationLog>(`/disseminations/${id}`, data),

  updateStatus: (id: string, status: string) =>
    api.patch<DisseminationLog>(`/disseminations/${id}/status`, { status }),

  delete: (id: string) => api.delete(`/disseminations/${id}`),
};

// Metrics API
export const metricsApi = {
  list: (organizationId?: string, pirId?: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<MetricRecord>>('/metrics', {
      page: String(page),
      limit: String(limit),
      ...(organizationId && { organizationId }),
      ...(pirId && { pirId }),
    }),

  getStats: (organizationId: string) =>
    api.get<MetricStats>(`/metrics/stats/${organizationId}`),

  get: (id: string) => api.get<MetricRecord>(`/metrics/${id}`),

  create: (data: CreateMetricData) =>
    api.post<MetricRecord>('/metrics', data),

  update: (id: string, data: CreateMetricData) =>
    api.put<MetricRecord>(`/metrics/${id}`, data),

  delete: (id: string) => api.delete(`/metrics/${id}`),
};

// Chat API
export const chatApi = {
  insight: (prompt: string, organizationId?: string) =>
    api.post<{ insight: string }>('/chat/insight', { prompt, organizationId }),

  message: (message: string, history: ChatMessage[], organizationId?: string) =>
    api.post<{ response: string }>('/chat/message', { message, history, organizationId }),
};

// Types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  description?: string;
  stakeholder_name?: string;
  stakeholder_email?: string;
  created_at: string;
  updated_at: string;
  pir_count?: number;
}

export interface OrganizationFull extends Organization {
  phases: {
    planning: { pirs: PIR[] };
    collection: { sources: IntelligenceSource[] };
    analysis: { reports: Report[] };
    dissemination: { logs: DisseminationLog[] };
  };
  metrics: MetricRecord[];
  counts: {
    pirs: number;
    sources: number;
    reports: number;
    disseminations: number;
    metrics: number;
  };
}

export interface PIR {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Draft' | 'Archived';
  organization_id: string;
  organization_name?: string;
  history?: { status: string; action: string; created_at: string }[];
  created_at: string;
  updated_at: string;
}

export interface IntelligenceSource {
  id: string;
  pir_id: string;
  pir_title?: string;
  name: string;
  description?: string;
  type: 'Internal' | 'OSINT' | 'FeedComercial' | 'FeedAberto' | 'DarkWeb';
  credibility: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  integration_date: string;
  created_at: string;
}

export interface Report {
  id: string;
  pir_id: string;
  pir_title?: string;
  title: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  content: string;
  report_date: string;
  created_at: string;
}

export interface DisseminationLog {
  id: string;
  pir_id: string;
  pir_title?: string;
  report_id?: string;
  log_date: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  status: 'Pending' | 'Disseminated' | 'Acknowledged';
  report_name: string;
  delivery_channel?: string;
  notified_team?: string;
  observations?: string;
  created_at: string;
}

export interface MetricRecord {
  id: string;
  pir_id: string;
  pir_title?: string;
  has_incident: boolean;
  incident_date?: string;
  discovery_date: string;
  dissemination_date: string;
  was_previously_reported: boolean;
  incident_prevented: boolean;
  impact_scale: 'Low' | 'Medium' | 'High' | 'Critical';
  created_at: string;
}

export interface MetricStats {
  totalRecords: number;
  incidents: number;
  potentials: number;
  prevented: number;
  consummated: number;
  mttd: string;
  mttdis: string;
  accuracy: string;
  preventionRate: string;
  pirsWithMetrics: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Create data types
export interface CreateOrganizationData {
  name: string;
  sector: string;
  description?: string;
  stakeholderName?: string;
  stakeholderEmail?: string;
}

export interface CreatePIRData {
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Draft' | 'Archived';
  organizationId: string;
}

export interface CreateSourceData {
  name: string;
  description?: string;
  type: 'Internal' | 'OSINT' | 'FeedComercial' | 'FeedAberto' | 'DarkWeb';
  credibility: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  pirId: string;
  integrationDate?: string;
}

export interface CreateReportData {
  title: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  content: string;
  pirId: string;
  date?: string;
}

export interface CreateDisseminationData {
  pirId: string;
  reportId?: string;
  date?: string;
  type: 'Strategic' | 'Operational' | 'Tactical';
  status: 'Pending' | 'Disseminated' | 'Acknowledged';
  reportName: string;
  deliveryChannel?: string;
  notifiedTeam?: string;
  observations?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentData?: string;
}

export interface CreateMetricData {
  pirId: string;
  hasIncident: boolean;
  incidentDate?: string;
  discoveryDate: string;
  disseminationDate: string;
  wasPreviouslyReported: boolean;
  incidentPrevented: boolean;
  impactScale: 'Low' | 'Medium' | 'High' | 'Critical';
}

export default api;
