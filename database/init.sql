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
-- TABLE: boutique_items
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    description TEXT,
    features JSONB DEFAULT '[]',
    image_url TEXT,
    purchase_url TEXT,
    color VARCHAR(50) DEFAULT 'rgba(107, 174, 255, 0.2)',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: transactions (comptabilité)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('revenu', 'depense')),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    client VARCHAR(255),
    project VARCHAR(255),
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    notes TEXT,
    payment_type VARCHAR(20) DEFAULT 'comptant',
    total_project DECIMAL(12,2),
    acompte_number INT DEFAULT 1,
    total_acomptes INT DEFAULT 1,
    created_by INT REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: projets
-- ============================================
CREATE TABLE IF NOT EXISTS projets (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'film',
    statut VARCHAR(50) DEFAULT 'en_developpement',
    synopsis TEXT,
    logline TEXT,
    genre VARCHAR(100),
    duree_prevue VARCHAR(50),
    format VARCHAR(50),
    langue VARCHAR(50) DEFAULT 'Français',
    realisateur VARCHAR(255),
    producteur VARCHAR(255),
    scenariste VARCHAR(255),
    directeur_photo VARCHAR(255),
    casting TEXT,
    client VARCHAR(255),
    production VARCHAR(255) DEFAULT 'NAATAL Production',
    date_debut DATE,
    date_fin_prevue DATE,
    budget_prevu DECIMAL(12,2),
    notes TEXT,
    priorite INT DEFAULT 3,
    progression INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: attachments (pièces jointes)
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
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
-- Corporate
('MAS & HITACHI', 'Film institutionnel pour MAS & HITACHI', 'youtube', 'https://www.youtube.com/embed/ldC0Da_dF3E', 2, true, 1),
('Cosy Home', 'Présentation de la marque Cosy Home', 'youtube', 'https://www.youtube.com/embed/Xnahc3dyxI8', 2, true, 2)
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
-- TABLE: cinema_items
-- Films et productions cinematographiques
-- ============================================
CREATE TABLE IF NOT EXISTS cinema_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT,
    director VARCHAR(255),
    genre VARCHAR(100),
    duration VARCHAR(20),
    description TEXT,
    video_url TEXT,
    poster_url TEXT,
    trailer_url TEXT,
    cover_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cinema_status ON cinema_items(status);

DROP TRIGGER IF EXISTS update_cinema_items_updated_at ON cinema_items;
CREATE TRIGGER update_cinema_items_updated_at BEFORE UPDATE ON cinema_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: partners
-- Logos des partenaires
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);

-- ============================================
-- TABLE: prestations
-- Services et prestations proposées
-- ============================================
CREATE TABLE IF NOT EXISTS prestations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'video',
    details JSONB DEFAULT '[]',
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prestations_status ON prestations(status);

DROP TRIGGER IF EXISTS update_prestations_updated_at ON prestations;
CREATE TRIGGER update_prestations_updated_at BEFORE UPDATE ON prestations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données par défaut: Prestations
INSERT INTO prestations (title, description, icon, details, display_order, status) VALUES
('Conception', 'De l''idée au projet structuré, nous transformons votre vision en un plan de production concret et créatif.', 'conception', '["Brainstorming créatif", "Écriture de script & scénario", "Storyboard détaillé", "Note d''intention artistique", "Repérages de lieux", "Plan de travail complet"]', 1, 'active'),
('Gestion de Projet', 'Un accompagnement stratégique de A à Z pour garantir le succès de votre production audiovisuelle.', 'gestion', '["Sélection des prestataires", "Organisation du planning", "Conseils techniques avancés", "Devis & gestion budgétaire", "Accompagnement complet", "Suivi qualité"]', 2, 'active'),
('Pré-Production', 'La phase cruciale qui prépare chaque détail pour un tournage fluide et professionnel.', 'preproduction', '["Casting & direction artistique", "Gestion éditoriale", "Gestion budgétaire détaillée", "Scénographie & décors", "Charte graphique", "Planification logistique"]', 3, 'active'),
('Production', 'Tournage professionnel avec une équipe expérimentée et du matériel de pointe.', 'production', '["Gestion complète de tournage", "Location d''espace avec équipe", "Matériel professionnel haut de gamme", "Construction de décors sur mesure", "Direction de la photographie", "Captation multi-caméras"]', 4, 'active'),
('Post-Production', 'Sublimer vos images avec un montage créatif et une finition irréprochable.', 'postproduction', '["Montage créatif & narratif", "Étalonnage colorimétrique", "Mixage sonore professionnel", "Motion design & effets visuels", "Sous-titrage & localisation", "Exports multi-formats"]', 5, 'active'),
('Diffusion', 'Optimiser la distribution de votre contenu pour atteindre votre audience cible sur tous les supports.', 'diffusion', '["Supports de diffusion adaptés", "Encodages multiples (SD/HD/4K)", "PAD régie numérique", "Distribution dématérialisée", "Stratégie de diffusion", "Optimisation multi-plateformes"]', 6, 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLE: tasks
-- Gestion des tâches / todo
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    assigned_to VARCHAR(255),
    category VARCHAR(100),
    created_by INT REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DU SCRIPT
-- ============================================
SELECT 'Base de données NAATAL initialisée avec succès!' as status;
