-- ============================================
-- NAATAL Production - Base de données PostgreSQL
-- ============================================

-- Créer la base de données
-- CREATE DATABASE naatal_db;

-- Se connecter à la base
-- \c naatal_db;

-- ============================================
-- TABLE: categories
-- Catégories de médias (documentaire, corporate, publicité)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'video',
    color VARCHAR(20) DEFAULT '#ffffff',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: medias
-- Vidéos YouTube et autres médias
-- ============================================
CREATE TABLE IF NOT EXISTS medias (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'youtube' CHECK (type IN ('youtube', 'video', 'image')),
    url TEXT NOT NULL,
    thumbnail TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    featured BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: messages
-- Messages du formulaire de contact
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: settings
-- Paramètres du site (clé-valeur)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: admins
-- Utilisateurs administrateurs
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX pour performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_medias_category ON medias(category_id);
CREATE INDEX IF NOT EXISTS idx_medias_active ON medias(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- DONNÉES PAR DÉFAUT
-- ============================================

-- Catégories
INSERT INTO categories (slug, name, description, icon, color, display_order) VALUES
('documentaire', 'Documentaire', 'Films documentaires et reportages', 'film', '#8b5cf6', 1),
('corporate', 'Corporate', 'Vidéos institutionnelles et entreprises', 'briefcase', '#3b82f6', 2),
('publicite', 'Publicité', 'Spots publicitaires et promotionnels', 'megaphone', '#ec4899', 3)
ON CONFLICT (slug) DO NOTHING;

-- Médias par défaut
INSERT INTO medias (name, description, type, url, category_id, featured, display_order) VALUES
-- Documentaires
('Documentaire - Les Racines', 'Un voyage au coeur des traditions africaines', 'youtube', 'https://www.youtube.com/embed/P4MzYbSNYEI', 1, true, 1),
('Documentaire - Horizons', 'Exploration des paysages ivoiriens', 'youtube', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1, false, 2),
-- Corporate
('MAS & HITACHI', 'Film institutionnel pour MAS & HITACHI', 'youtube', 'https://www.youtube.com/embed/ldC0Da_dF3E', 2, true, 1),
('Cosy Home', 'Présentation de la marque Cosy Home', 'youtube', 'https://www.youtube.com/embed/Xnahc3dyxI8', 2, true, 2),
('Groupe Azalai', 'Film corporate pour le Groupe Azalai', 'youtube', 'https://www.youtube.com/embed/example3', 2, false, 3),
-- Publicité
('Spot TV - Orange CI', 'Campagne publicitaire Orange Côte d''Ivoire', 'youtube', 'https://www.youtube.com/embed/example4', 3, true, 1),
('Pub - Solibra', 'Spot publicitaire pour Solibra', 'youtube', 'https://www.youtube.com/embed/example5', 3, false, 2)
ON CONFLICT DO NOTHING;

-- Paramètres du site
INSERT INTO settings (key, value, type, description) VALUES
('site_name', 'NAATAL Production', 'text', 'Nom du site'),
('site_slogan', 'L''Art de Raconter des Histoires', 'text', 'Slogan du site'),
('contact_email', 'naatalproduction@gmail.com', 'text', 'Email de contact'),
('contact_phone', '+225 07 19 95 65 86', 'text', 'Téléphone de contact'),
('contact_address', 'Abidjan, Côte d''Ivoire', 'text', 'Adresse'),
('social_facebook', 'https://facebook.com/naatalproduction', 'text', 'Lien Facebook'),
('social_instagram', 'https://instagram.com/naatalproduction', 'text', 'Lien Instagram'),
('social_youtube', 'https://youtube.com/@naatalproduction', 'text', 'Lien YouTube'),
('social_linkedin', '', 'text', 'Lien LinkedIn')
ON CONFLICT (key) DO NOTHING;

-- Admin par défaut (mot de passe: REDACTED)
-- Username: admin
INSERT INTO admins (username, email, password, role) VALUES
('admin', 'admin@naatalstudio.com', 'REDACTED', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- FONCTION: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medias_updated_at ON medias;
CREATE TRIGGER update_medias_updated_at BEFORE UPDATE ON medias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: storyboards
-- Tableaux de storyboard (inspiré Freeform d'Apple)
-- ============================================
CREATE TABLE IF NOT EXISTS storyboards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Sans titre',
    description TEXT,
    thumbnail TEXT,
    color VARCHAR(20) DEFAULT '#007aff',
    zoom DECIMAL(5,2) DEFAULT 1.00,
    pan_x DECIMAL(10,2) DEFAULT 0,
    pan_y DECIMAL(10,2) DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: storyboard_elements
-- Éléments du canvas (textes, images, formes, notes, liens)
-- ============================================
CREATE TABLE IF NOT EXISTS storyboard_elements (
    id SERIAL PRIMARY KEY,
    storyboard_id INT NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
    element_type VARCHAR(20) NOT NULL CHECK (element_type IN ('text', 'image', 'link', 'sticky', 'shape', 'line', 'arrow', 'arc')),
    pos_x DECIMAL(10,2) DEFAULT 0,
    pos_y DECIMAL(10,2) DEFAULT 0,
    width DECIMAL(10,2) DEFAULT 200,
    height DECIMAL(10,2) DEFAULT 200,
    content TEXT,
    properties JSONB DEFAULT '{}',
    z_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les storyboards
CREATE INDEX IF NOT EXISTS idx_storyboards_favorite ON storyboards(is_favorite);
CREATE INDEX IF NOT EXISTS idx_storyboards_archived ON storyboards(is_archived);
CREATE INDEX IF NOT EXISTS idx_storyboard_elements_board ON storyboard_elements(storyboard_id);

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_storyboards_updated_at ON storyboards;
CREATE TRIGGER update_storyboards_updated_at BEFORE UPDATE ON storyboards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_storyboard_elements_updated_at ON storyboard_elements;
CREATE TRIGGER update_storyboard_elements_updated_at BEFORE UPDATE ON storyboard_elements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DU SCRIPT
-- ============================================
SELECT 'Base de données NAATAL initialisée avec succès!' as status;
