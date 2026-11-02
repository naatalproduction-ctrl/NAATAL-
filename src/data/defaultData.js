// ============================================
// NAATAL - Données par défaut du site
// ============================================

// Catégories de médias
export const mediaCategories = [
  { 
    id: 'documentaire', 
    label: 'Documentaire', 
    icon: 'film', 
    color: '#8b5cf6',
    description: 'Films documentaires et reportages' 
  },
  { 
    id: 'corporate', 
    label: 'Corporate', 
    icon: 'briefcase', 
    color: '#3b82f6',
    description: 'Vidéos institutionnelles et entreprises' 
  },
  { 
    id: 'publicite', 
    label: 'Publicité', 
    icon: 'megaphone', 
    color: '#ec4899',
    description: 'Spots publicitaires et promotionnels' 
  }
]

// Médias par défaut
export const defaultMedias = [
  // === DOCUMENTAIRES ===
  { 
    id: 1, 
    name: 'Documentaire',
    type: 'youtube', 
    url: 'https://www.youtube.com/embed/P4MzYbSNYEI', 
    thumbnail: '',
    category: 'documentaire', 
    description: '',
    featured: true,
    order: 1
  },
  // === CORPORATE ===
  { 
    id: 3, 
    name: 'AMS & HITACHI',
    type: 'youtube',
    url: 'https://www.youtube.com/embed/GYvw3r4pHo8',
    thumbnail: '',
    category: 'corporate',
    description: 'Vidéo de conférence pour AMS & HITACHI',
    featured: true,
    order: 1
  },
  { 
    id: 4, 
    name: 'Cosy Home', 
    type: 'youtube', 
    url: 'https://www.youtube.com/embed/Xnahc3dyxI8', 
    thumbnail: '',
    category: 'corporate',
    description: 'Présentation de la marque Cosy Home',
    featured: true,
    order: 2
  },
]

// Informations du site
export const defaultSiteInfo = {
  name: 'NAATAL Production',
  slogan: 'L\'Art de Raconter des Histoires',
  email: 'hello@naatalstudio.com',
  phone: '+225 07 19 95 65 86',
  address: 'Abidjan, Côte d\'Ivoire',
  social: {
    facebook: 'https://facebook.com/naatalproduction',
    instagram: 'https://instagram.com/naatalproduction',
    youtube: 'https://youtube.com/@naatalproduction',
    linkedin: ''
  },
  logo: '/img/logo.png'
}

// Services proposés
export const defaultServices = [
  {
    id: 'production',
    title: 'Production Audiovisuelle',
    description: 'De la conception à la post-production, nous réalisons vos projets audiovisuels.',
    icon: 'video'
  },
  {
    id: 'documentaire',
    title: 'Documentaire',
    description: 'Capturer la réalité et raconter des histoires authentiques.',
    icon: 'film'
  },
  {
    id: 'corporate',
    title: 'Films Corporate',
    description: 'Valoriser votre entreprise à travers des vidéos professionnelles.',
    icon: 'briefcase'
  },
  {
    id: 'publicite',
    title: 'Publicité',
    description: 'Créer des spots publicitaires percutants et mémorables.',
    icon: 'megaphone'
  }
]

// Pages du site
export const defaultPages = [
  { id: 'hero', name: 'Accueil (Hero)', file: 'Hero.jsx', status: 'active', editable: true },
  { id: 'audiovisuel', name: 'Audiovisuel', file: 'Audiovisuel.jsx', status: 'active', editable: true },
  { id: 'cinema', name: 'Cinéma', file: 'Cinema.jsx', status: 'active', editable: true },
  { id: 'boutique', name: 'Boutique', file: 'Boutique.jsx', status: 'active', editable: true },
  { id: 'contact', name: 'Contact', file: 'Contact.jsx', status: 'active', editable: true },
  { id: 'header', name: 'Header', file: 'Header.jsx', status: 'active', editable: false },
  { id: 'footer', name: 'Footer', file: 'Footer.jsx', status: 'active', editable: false }
]
