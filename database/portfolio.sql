-- ============================================
-- SOUKAVISUALS Portfolio - Tables PostgreSQL
-- ============================================

-- ============================================
-- TABLE: portfolio_profile
-- Profil artiste (une seule ligne)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_profile (
    id SERIAL PRIMARY KEY,
    artist_name VARCHAR(255) NOT NULL DEFAULT 'Soukavisuals',
    subtitle VARCHAR(255) DEFAULT 'Créateur visuel',
    bio_title VARCHAR(255) DEFAULT 'Vision artistique & technologie',
    bio_text1 TEXT DEFAULT '',
    bio_text2 TEXT DEFAULT '',
    profile_image_url TEXT,
    badge_text VARCHAR(255) DEFAULT 'Disponible pour collaborer',
    badge_active BOOLEAN DEFAULT true,
    hero_title_line1 VARCHAR(255) DEFAULT 'Soukavisuals',
    hero_title_line2 VARCHAR(255) DEFAULT 'Créateur visuel',
    hero_subtitle TEXT DEFAULT '',
    email VARCHAR(255) DEFAULT 'hello@soukavisuals.com',
    phone VARCHAR(50) DEFAULT '+33 6 12 34 56 78',
    address VARCHAR(255) DEFAULT 'Paris, France',
    website VARCHAR(255) DEFAULT 'soukavisuals.com',
    contact_title VARCHAR(255) DEFAULT 'Envie de collaborer ?',
    contact_text TEXT DEFAULT '',
    social_dribbble VARCHAR(255) DEFAULT '',
    social_behance VARCHAR(255) DEFAULT '',
    social_github VARCHAR(255) DEFAULT '',
    social_linkedin VARCHAR(255) DEFAULT '',
    social_instagram VARCHAR(255) DEFAULT '',
    social_youtube VARCHAR(255) DEFAULT '',
    social_tiktok VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: portfolio_stats
-- Statistiques affichées sur le site
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_stats (
    id SERIAL PRIMARY KEY,
    value INT NOT NULL DEFAULT 0,
    label VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: portfolio_projects
-- Projets / travaux affichés
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    year VARCHAR(10) DEFAULT '',
    image_url TEXT,
    link_url TEXT DEFAULT '',
    gradient_from VARCHAR(50) DEFAULT 'accent-dim',
    gradient_to VARCHAR(50) DEFAULT 'warm-dim',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: portfolio_skills
-- Compétences / expertise
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(10) DEFAULT '◆',
    description VARCHAR(255) DEFAULT '',
    percentage INT DEFAULT 80 CHECK (percentage >= 0 AND percentage <= 100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: portfolio_marquee
-- Textes du bandeau défilant
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_marquee (
    id SERIAL PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: portfolio_messages
-- Messages reçus via le formulaire de contact
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_active ON portfolio_projects(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_skills_active ON portfolio_skills(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_messages_read ON portfolio_messages(is_read);

-- ============================================
-- TRIGGERS updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_portfolio_profile_updated_at ON portfolio_profile;
CREATE TRIGGER update_portfolio_profile_updated_at BEFORE UPDATE ON portfolio_profile
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_stats_updated_at ON portfolio_stats;
CREATE TRIGGER update_portfolio_stats_updated_at BEFORE UPDATE ON portfolio_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER update_portfolio_projects_updated_at BEFORE UPDATE ON portfolio_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_skills_updated_at ON portfolio_skills;
CREATE TRIGGER update_portfolio_skills_updated_at BEFORE UPDATE ON portfolio_skills
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNÉES PAR DÉFAUT
-- ============================================

-- Profil
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM portfolio_profile) THEN
INSERT INTO portfolio_profile (
    artist_name, subtitle, bio_title, bio_text1, bio_text2,
    badge_text, hero_title_line1, hero_title_line2, hero_subtitle,
    email, phone, address, website,
    contact_title, contact_text
) VALUES (
    'Soukavisuals',
    'Créateur visuel',
    'Vision artistique & technologie',
    'Passionné par l''intersection entre l''art et la technologie, je crée des expériences numériques qui marquent les esprits. Chaque pixel compte, chaque interaction raconte une histoire.',
    'Mon approche mêle direction artistique, développement créatif et design motion pour des interfaces qui transcendent l''ordinaire.',
    'Disponible pour collaborer',
    'Soukavisuals',
    'Créateur visuel',
    'Expériences digitales immersives — entre esthétique cinématique et design contemporain.',
    'hello@soukavisuals.com',
    '+33 6 12 34 56 78',
    'Paris, France',
    'soukavisuals.com',
    'Envie de collaborer ?',
    'Vous avez un projet ambitieux, une vision à concrétiser ? Chaque grande création commence par une conversation.'
);
END IF;
END $$;

-- Stats
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM portfolio_stats) THEN
INSERT INTO portfolio_stats (value, label, display_order) VALUES
(8, 'Années', 1),
(47, 'Projets', 2),
(12, 'Awards', 3);
END IF;
END $$;

-- Projets
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM portfolio_projects) THEN
INSERT INTO portfolio_projects (name, category, description, year, gradient_from, gradient_to, display_order) VALUES
('Nocturn Gallery', 'Direction Artistique', 'Galerie d''art immersive avec navigation 3D et transitions cinématiques.', '2026', 'accent-dim', 'warm-dim', 1),
('Analog Studio', 'Développement Web', 'Plateforme créative pour cinéastes et photographes argentiques.', '2025', 'silver-dim', 'accent-dim', 2),
('Maison Lumiere', 'Brand Identity', 'Identité visuelle pour une marque de luxe parisienne.', '2025', 'warm-dim', 'silver-dim', 3),
('Cadence Film', 'Motion Design', 'Expérience interactive pour un festival de cinéma.', '2024', 'accent-dim', 'glass', 4);
END IF;
END $$;

-- Skills
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM portfolio_skills) THEN
INSERT INTO portfolio_skills (name, icon, description, percentage, display_order) VALUES
('Direction Artistique', '◆', 'Vision créative, identité visuelle, storytelling', 95, 1),
('UI / UX Design', '○', 'Interfaces, prototypage, Figma', 90, 2),
('Front-End Dev', '△', 'React, Next.js, Three.js, GSAP', 88, 3),
('Motion Design', '◊', 'After Effects, Lottie, animations', 85, 4),
('Branding', '●', 'Logos, charte graphique, direction', 82, 5),
('Cinématographie', '✦', 'DaVinci, color grading, composition', 78, 6);
END IF;
END $$;

-- Marquee
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM portfolio_marquee) THEN
INSERT INTO portfolio_marquee (text, display_order) VALUES
('Design', 1), ('Développement', 2), ('Motion', 3),
('Branding', 4), ('Création', 5), ('Visuals', 6);
END IF;
END $$;

-- ============================================
SELECT 'Tables portfolio créées avec succès!' as status;
