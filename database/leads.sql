-- ============================================
-- Tables Leads et Prospects
-- A charger apres init.sql (update_updated_at_column)
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  phone2 VARCHAR(30),
  phone3 VARCHAR(30),
  company VARCHAR(255),
  service VARCHAR(100),
  budget VARCHAR(50),
  message TEXT,
  source VARCHAR(50) DEFAULT 'site',
  channel VARCHAR(50) DEFAULT 'whatsapp',
  status VARCHAR(20) DEFAULT 'nouveau',
  notes TEXT,
  sent_date TIMESTAMP,
  rdv_date TIMESTAMP,
  relance_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(100),
  website TEXT,
  email VARCHAR(255),
  rating NUMERIC(2,1),
  reviews_count INTEGER DEFAULT 0,
  category VARCHAR(255),
  place_id VARCHAR(255) UNIQUE,
  search_query VARCHAR(255),
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'nouveau',
  channel VARCHAR(50) DEFAULT 'whatsapp',
  notes TEXT,
  sent_date TIMESTAMP,
  relance_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created ON prospects(created_at DESC);

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
