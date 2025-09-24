-- Creazione delle tabelle per l'app CRM

-- Tabella users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'commercial', 'master')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  level VARCHAR(30) CHECK (level IN ('junior', 'senior', 'team_leader', 'partner', 'executive_director', 'managing_director')) DEFAULT 'junior',
  admin_id UUID REFERENCES users(id),
  leader_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  gross_margin DECIMAL(10,2) NOT NULL,
  monthly_margin DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 1,
  developer_id UUID REFERENCES users(id) NOT NULL,
  recruiter_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'prospect')) DEFAULT 'prospect',
  created_by UUID REFERENCES users(id) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact TIMESTAMPTZ
);

-- Tabella consultants
CREATE TABLE IF NOT EXISTS consultants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience VARCHAR(50) CHECK (experience IN ('Junior (1-2 anni)', 'Mid-level (3-4 anni)', 'Senior (5+ anni)', 'Lead/Architect (8+ anni)')) NOT NULL,
  availability VARCHAR(20) CHECK (availability IN ('available', 'busy', 'unavailable')) DEFAULT 'available',
  daily_rate DECIMAL(8,2),
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact TIMESTAMPTZ
);

-- Tabella deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  consultant_id UUID REFERENCES consultants(id),
  consultant_name VARCHAR(255),
  value DECIMAL(10,2) NOT NULL,
  daily_margin DECIMAL(8,2),
  status VARCHAR(30) CHECK (status IN ('cv_sent', 'initial_interview', 'final_interview', 'feedback_pending', 'closed_won', 'closed_lost')) DEFAULT 'cv_sent',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100) DEFAULT 0,
  expected_close_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_leader_id ON users(leader_id);

CREATE INDEX IF NOT EXISTS idx_contracts_developer_id ON contracts(developer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_recruiter_id ON contracts(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts(date);

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_consultants_created_by ON consultants(created_by);
CREATE INDEX IF NOT EXISTS idx_consultants_assigned_to ON consultants(assigned_to);
CREATE INDEX IF NOT EXISTS idx_consultants_availability ON consultants(availability);

CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_consultant_id ON deals(consultant_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Opzionale per sicurezza avanzata
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Politiche RLS di esempio (da personalizzare in base alle esigenze)
-- CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
-- CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master')
--   )
-- );