-- ============================================
-- Table Offres (Packages & Projets ponctuels)
-- ============================================

CREATE TABLE IF NOT EXISTS offres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'package',       -- 'package' ou 'oneoff'
  target VARCHAR(255),                       -- Cible (PME, Entreprises, etc.)
  description TEXT,
  price INTEGER DEFAULT 0,                   -- Prix en FCFA
  period VARCHAR(50) DEFAULT '/ mois',       -- Periodicite
  features JSONB DEFAULT '[]'::jsonb,        -- Liste des features incluses
  not_included JSONB DEFAULT '[]'::jsonb,    -- Features non incluses
  cta VARCHAR(255) DEFAULT 'Choisir',        -- Texte du bouton CTA
  is_featured BOOLEAN DEFAULT false,         -- Mise en avant
  status VARCHAR(20) DEFAULT 'active',       -- active / inactive
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offres_status ON offres(status);
CREATE INDEX IF NOT EXISTS idx_offres_type ON offres(type);
CREATE INDEX IF NOT EXISTS idx_offres_order ON offres(display_order);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_offres_updated_at ON offres;
CREATE TRIGGER update_offres_updated_at
  BEFORE UPDATE ON offres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed : Packages mensuels
-- ============================================

INSERT INTO offres (name, type, target, description, price, period, features, not_included, cta, is_featured, display_order) VALUES
(
  'Essentiel',
  'package',
  'PME & Startups',
  'L''entree ideale pour une presence video reguliere et professionnelle.',
  200000,
  '/ mois',
  '["2 videos courtes / mois (30-90s)", "Tournage 1 jour", "Montage + sous-titres", "1 format livre (vertical ou horizontal)", "Livraison sous 5 jours", "2 revisions incluses"]',
  '["Multi-camera", "Motion design", "Version anglaise"]',
  'Demarrer',
  false,
  1
),
(
  'Corporate',
  'package',
  'Entreprises mid-size',
  'Le package prefere des directions marketing. Visibilite et recurrence.',
  400000,
  '/ mois',
  '["4 videos / mois (mix courts + moyen formats)", "Tournage 2 jours", "Montage pro + habillage graphique", "2 formats livres (vertical + horizontal)", "1 video institutionnelle / trimestre", "Livraison sous 4 jours", "3 revisions incluses"]',
  '["Version anglaise"]',
  'Choisir Corporate',
  true,
  2
),
(
  'Premium',
  'package',
  'Grandes entreprises & Institutions',
  'Une presence cinematographique complete. Pour ceux qui veulent dominer.',
  700000,
  '/ mois',
  '["6-8 videos / mois", "Tournage multi-camera inclus", "Montage cinematique + motion design", "Tous formats livres", "Version francaise + anglaise", "1 film corporate long format / trimestre", "Priorite planning - Livraison 3 jours", "Revisions illimitees"]',
  '[]',
  'Choisir Premium',
  false,
  3
);

-- ============================================
-- Seed : Projets ponctuels
-- ============================================

INSERT INTO offres (name, type, target, description, price, period, features, not_included, cta, is_featured, display_order) VALUES
(
  'Film institutionnel',
  'oneoff',
  NULL,
  '3-5 min · multi-cam · habillage',
  500000,
  '500 000 - 1 200 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  10
),
(
  'Couverture evenement corporate',
  'oneoff',
  NULL,
  'Regie multi-camera · montage J+2',
  300000,
  '300 000 - 700 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  11
),
(
  'Film de lancement produit',
  'oneoff',
  NULL,
  'Scenario + tournage + montage cinematique',
  400000,
  '400 000 - 900 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  12
),
(
  'Serie testimonials (x3)',
  'oneoff',
  NULL,
  'Tournage 1 jour · 3 videos livrees',
  250000,
  '250 000 - 450 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  13
),
(
  'Video formation / e-learning',
  'oneoff',
  NULL,
  'Script + tournage + sous-titres',
  350000,
  '350 000 - 750 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  14
),
(
  'Film immobilier / promotion',
  'oneoff',
  NULL,
  'Drone + terrain + montage',
  400000,
  '400 000 - 800 000',
  '[]',
  '[]',
  'Demander un devis',
  false,
  15
);
