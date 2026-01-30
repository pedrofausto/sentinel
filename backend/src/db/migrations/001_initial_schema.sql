-- Sentinel CTI Initial Schema
-- Migration: 001_initial_schema
-- Created: 2025-01-16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (Clients)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    description TEXT,
    stakeholder_name VARCHAR(100),
    stakeholder_email VARCHAR(255),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Priority Intelligence Requirements (PIRs)
CREATE TABLE IF NOT EXISTS pirs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(10) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Active', 'Draft', 'Archived')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PIR History (audit trail)
CREATE TABLE IF NOT EXISTS pir_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pir_id UUID NOT NULL REFERENCES pirs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Created', 'Status Changed', 'Edited')),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence Sources
CREATE TABLE IF NOT EXISTS intelligence_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pir_id UUID NOT NULL REFERENCES pirs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Internal', 'OSINT', 'FeedComercial', 'FeedAberto', 'DarkWeb')),
    credibility CHAR(1) NOT NULL CHECK (credibility IN ('A', 'B', 'C', 'D', 'E', 'F')),
    reliability CHAR(1) NOT NULL CHECK (reliability IN ('A', 'B', 'C', 'D', 'E', 'F')),
    integration_date DATE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pir_id UUID NOT NULL REFERENCES pirs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(15) NOT NULL CHECK (type IN ('Strategic', 'Operational', 'Tactical')),
    content TEXT NOT NULL,
    report_date DATE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dissemination Logs
CREATE TABLE IF NOT EXISTS dissemination_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pir_id UUID NOT NULL REFERENCES pirs(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    type VARCHAR(15) NOT NULL CHECK (type IN ('Strategic', 'Operational', 'Tactical')),
    status VARCHAR(15) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disseminated', 'Acknowledged')),
    report_name VARCHAR(200) NOT NULL,
    delivery_channel VARCHAR(100),
    notified_team VARCHAR(100),
    observations TEXT,
    attachment_name VARCHAR(255),
    attachment_type VARCHAR(50),
    attachment_data TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Metric Records
CREATE TABLE IF NOT EXISTS metric_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pir_id UUID NOT NULL REFERENCES pirs(id) ON DELETE CASCADE,
    has_incident BOOLEAN NOT NULL DEFAULT false,
    incident_date TIMESTAMP WITH TIME ZONE,
    discovery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    dissemination_date TIMESTAMP WITH TIME ZONE NOT NULL,
    was_previously_reported BOOLEAN NOT NULL DEFAULT false,
    incident_prevented BOOLEAN NOT NULL DEFAULT false,
    impact_scale VARCHAR(10) NOT NULL CHECK (impact_scale IN ('Low', 'Medium', 'High', 'Critical')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens for session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pirs_organization ON pirs(organization_id);
CREATE INDEX IF NOT EXISTS idx_pirs_status ON pirs(status);
CREATE INDEX IF NOT EXISTS idx_sources_pir ON intelligence_sources(pir_id);
CREATE INDEX IF NOT EXISTS idx_reports_pir ON reports(pir_id);
CREATE INDEX IF NOT EXISTS idx_dissemination_pir ON dissemination_logs(pir_id);
CREATE INDEX IF NOT EXISTS idx_metrics_pir ON metric_records(pir_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pir_history_pir ON pir_history(pir_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pirs_updated_at BEFORE UPDATE ON pirs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON intelligence_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dissemination_updated_at BEFORE UPDATE ON dissemination_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metric_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
