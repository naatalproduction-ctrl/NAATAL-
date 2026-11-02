// ============================================
// Informations du site : source unique pour React et les scripts SEO.
// Sans JSX ni import, pour rester lisible par Node au build.
// ============================================

export const SITE_URL = 'https://naatalstudio.com'
export const OG_IMAGE = `${SITE_URL}/og-image.png`
export const LOGO_URL = `${SITE_URL}/favicon-512x512.png`

export const BUSINESS = {
  name: 'NAATAL Studio',
  alternateName: 'NAATAL Production',
  pitch: "Studio de production audiovisuelle et cinéma à Abidjan, Côte d'Ivoire.",
  description: "NAATAL Studio est un studio de production audiovisuelle et cinéma basé à Koumassi, Abidjan. Il réalise des films corporate et institutionnels, des publicités, des clips musicaux, des documentaires, des couvertures d'événements et des vidéos immobilières par drone, de la conception à la diffusion.",
  email: 'hello@naatalstudio.com',
  phone: '+225 07 19 95 65 86',
  whatsappLink: 'https://wa.me/2250719956586',
  hours: 'Du lundi au vendredi, de 9h à 18h (GMT)',
  address: {
    street: 'Koumassi',
    city: 'Abidjan',
    region: "District d'Abidjan",
    country: 'CI',
    countryName: "Côte d'Ivoire",
  },
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/_naatal.studio' },
    { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61578385959318' },
    { name: 'YouTube', url: 'https://www.youtube.com/@NaatalStudio-p4i' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/naatal-studio-b378983b9' },
  ],
}

export const telHref = (phone) => `tel:${phone.replace(/[^+\d]/g, '')}`

export const ABOUT = {
  label: 'Production audiovisuelle à Abidjan',
  tagline: "L'image que vous donnez commence avant que vous parliez",
  subtitle: "Avant votre premier rendez-vous, votre prospect vous a déjà jugé. Sur votre site. Sur votre LinkedIn. Sur la vidéo de présentation que vous n'avez peut-être pas encore.",
  stats: [
    { value: '5+', label: "Années d'expérience" },
    { value: '120+', label: 'Projets réalisés' },
    { value: '80+', label: 'Clients satisfaits' },
    { value: '∞', label: 'Ambition' },
  ],
  // Les ** entourent les mots en gras
  story: [
    "Née de la passion pour l'image et le storytelling, NAATAL Studio s'est imposée comme un acteur incontournable de la production audiovisuelle en Côte d'Ivoire. Notre nom, issu du wolof, signifie **révéler** — mettre en lumière ce qui existe déjà. Chaque projet est pour nous une nouvelle opportunité de révéler votre vision, de la sortir de l'ombre pour la donner à voir au monde.",
    "Chez Naatal Studio, nous ne faisons pas des vidéos. Nous construisons des récits visuels qui ancrent votre marque dans l'esprit de vos clients. Une vidéo de marque bien conçue, c'est votre meilleur commercial — disponible 24h/24, sans salaire à payer.",
    "De la publicité aux films d'entreprise, en passant par la promotion immobilière et la couverture événementielle, nous maîtrisons toute la chaîne de production avec un seul objectif : l'excellence visuelle au service de votre message. Basé à Abidjan, nous travaillons avec les entreprises qui comprennent qu'aujourd'hui, ce que l'on voit, on le croit.",
  ],
  values: [
    { title: 'Excellence', desc: 'Chaque image, chaque plan, chaque montage est pensé pour refléter le meilleur de votre marque.' },
    { title: 'Créativité', desc: "Des concepts originaux et audacieux qui captent l'attention et marquent les esprits." },
    { title: 'Proximité', desc: 'Un accompagnement sur mesure, de la conception à la livraison, avec une écoute attentive.' },
  ],
}

// Repli du build si l'API de production ne repond pas
export const PRESTATIONS_FALLBACK = [
  { title: 'Conception', description: "De l'idée au projet structuré, nous transformons votre vision en un plan de production concret et créatif.", details: ['Brainstorming créatif', 'Écriture de script & scénario', 'Storyboard détaillé', "Note d'intention artistique", 'Repérages de lieux', 'Plan de travail complet'] },
  { title: 'Production', description: 'Tournage professionnel avec une équipe expérimentée et du matériel de pointe.', details: ['Gestion complète de tournage', "Location d'espace avec équipe", 'Matériel professionnel haut de gamme', 'Construction de décors sur mesure', 'Direction de la photographie', 'Captation multi-caméras'] },
  { title: 'Post-Production', description: 'Sublimer vos images avec un montage créatif et une finition irréprochable.', details: ['Montage créatif & narratif', 'Étalonnage colorimétrique', 'Mixage sonore professionnel', 'Motion design & effets visuels', 'Sous-titrage & localisation', 'Exports multi-formats'] },
]

export const PROCESS = [
  { title: 'Premier contact', desc: 'Vous décrivez votre besoin en quelques lignes, sur WhatsApp ou par email.' },
  { title: 'Échange de cadrage', desc: 'Un échange de 20 minutes pour comprendre vos objectifs, votre audience, votre budget et vos délais.' },
  { title: 'Devis ferme', desc: 'Vous recevez un devis gratuit sous 24 à 48h pour une demande standard.' },
  { title: 'Production', desc: 'Préparation, tournage et post-production, avec un planning défini à l’avance.' },
  { title: 'Livraison', desc: 'Votre vidéo est livrée dans les formats prévus, révisions incluses.' },
]

export const CINEMA_INTRO = "NAATAL Studio produit des films de cinéma, des fictions et des documentaires depuis Abidjan. Notre équipe couvre toute la chaîne : développement, écriture, tournage en Sony FX3 avec optiques Sigma Art, post-production et étalonnage."

export const VIDEO_DESCRIPTIONS = {
  P4MzYbSNYEI: "Vidéo de campagne législative pour Djé Bi Landry, candidat indépendant à Gohitafla. Un message de remerciement sincère à ses concitoyens, porté par la détermination et la conviction d'un homme engagé pour sa région.",
  GYvw3r4pHo8: "Couverture d'une conférence de presse B2B organisée par Hitachi à Abidjan, réunissant les prestataires de climatisation de la région. Présentation des solutions innovantes et des partenariats stratégiques pour le marché ivoirien.",
  Xnahc3dyxI8: "Vidéo promotionnelle pour Cosy Home, boutique de décoration intérieure basée à Abidjan. Mise en valeur de son univers déco, de sa boutique en ligne et de son showroom, pour une jeune entreprise qui sublime les intérieurs ivoiriens.",
}

// Dates et durees YouTube exigees par le balisage VideoObject
export const VIDEO_METADATA = {
  GYvw3r4pHo8: { uploadDate: '2026-03-15T09:59:05-07:00', duration: 'PT2M2S' },
  Xnahc3dyxI8: { uploadDate: '2026-02-02T09:11:46-08:00', duration: 'PT1M57S' },
  P4MzYbSNYEI: { uploadDate: '2026-02-02T09:11:34-08:00', duration: 'PT2M30S' },
}

export const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export const SERVICE_PAGES = [
  {
    slug: 'film-institutionnel-abidjan',
    name: 'Film institutionnel et corporate',
    title: 'Film institutionnel et corporate à Abidjan | NAATAL Studio',
    description: "Film institutionnel et vidéo corporate à Abidjan : écriture, tournage cinéma, montage et étalonnage pour présenter votre entreprise. Devis gratuit.",
    h1: 'Film institutionnel et vidéo corporate à Abidjan',
    intro: [
      "Un film institutionnel présente votre entreprise, vos équipes et vos engagements en quelques minutes. NAATAL Studio le réalise à Abidjan, de l'écriture du message à la diffusion, pour qu'il serve vos rendez-vous commerciaux, votre site et vos réseaux.",
      "Nous appliquons les standards du cinéma à la communication d'entreprise : une écriture sur mesure, des images soignées et un étalonnage qui donne à votre marque une présence à la hauteur de vos ambitions.",
    ],
    includes: [
      'Échange de cadrage et écriture du script',
      'Repérages et plan de tournage',
      'Tournage multi-caméra en Sony FX3 avec optiques Sigma Art',
      'Montage, étalonnage et mixage sonore',
      'Sous-titrage et exports multi-formats',
    ],
    audience: ['Entreprises et PME', 'Banques et finance', 'Télécommunications', 'Institutions publiques', 'ONG'],
    faq: [
      { question: "Quelle est la durée d'un film institutionnel ?", answer: "Le format le plus courant dure de 3 à 5 minutes. Nous ajustons la durée selon votre message et l'endroit où le film sera diffusé." },
      { question: 'Quel est le délai de livraison ?', answer: 'Comptez 2 à 3 semaines pour un film corporate. Nous fixons un planning précis dès le lancement du projet.' },
      { question: 'Le film peut-il être livré en anglais ?', answer: 'Oui, nous proposons des sous-titres anglais et une version anglaise sur demande.' },
    ],
  },
  {
    slug: 'couverture-evenementielle-abidjan',
    name: 'Couverture événementielle',
    title: "Couverture vidéo d'événements à Abidjan | NAATAL Studio",
    description: "Captation vidéo de vos événements à Abidjan : conférences, séminaires et lancements. Tournage multi-caméra, aftermovie, capsules et témoignages.",
    h1: "Couverture vidéo d'événements à Abidjan",
    intro: [
      "Conférence, séminaire, lancement de produit ou cérémonie : NAATAL Studio filme vos événements d'entreprise à Abidjan pour prolonger leur impact bien après le jour J.",
      "Notre équipe s'adapte au déroulé de l'événement avec une captation multi-caméra, puis transforme ces images en contenus prêts à publier : aftermovie, capsules d'intervenants et témoignages.",
    ],
    includes: [
      'Préparation du déroulé et repérage du lieu',
      "Captation multi-caméra, jusqu'à 4 caméras synchronisées",
      'Prise de son professionnelle',
      'Aftermovie de 90 secondes',
      'Capsules des intervenants et témoignages',
    ],
    audience: ['Entreprises', 'Agences de communication', 'Institutions', "Organisateurs d'événements B2B"],
    faq: [
      { question: "En combien de temps recevons-nous l'aftermovie ?", answer: 'Comptez 5 jours pour un aftermovie événementiel de 90 secondes.' },
      { question: "Pouvez-vous diffuser l'événement en direct ?", answer: 'Oui, sur devis. Notre régie multi-caméra diffuse vers YouTube, Facebook, LinkedIn ou Twitch.' },
      { question: 'Travaillez-vous le week-end ?', answer: 'Oui, pour les événements et les tournages programmés.' },
    ],
    videoId: 'GYvw3r4pHo8',
  },
  {
    slug: 'publicite-video-abidjan',
    name: 'Publicité vidéo et spot TV',
    title: 'Publicité vidéo et spot TV à Abidjan | NAATAL Studio',
    description: "Spots publicitaires et vidéos promotionnelles à Abidjan : concept, tournage, montage et formats pour la TV, le web, Reels, TikTok et Shorts.",
    h1: 'Publicité vidéo et spot TV à Abidjan',
    intro: [
      "Une publicité vidéo doit capter l'attention en quelques secondes et donner envie d'agir. NAATAL Studio conçoit et produit à Abidjan des spots et des vidéos promotionnelles pour les marques ivoiriennes.",
      'Nous prenons en charge le concept, l’écriture, le tournage et le montage, puis livrons chaque film dans les formats utiles à votre campagne, de la télévision aux réseaux sociaux.',
    ],
    includes: [
      'Concept créatif et écriture',
      "Storyboard et note d'intention",
      'Casting et repérages',
      'Tournage et direction de la photographie',
      'Montage, étalonnage, mixage et motion design',
      'Formats 16:9, 9:16 et 1:1',
    ],
    audience: ['Marques', 'Commerces', 'Lancements de produit', 'Agences de communication'],
    faq: [
      { question: 'Quels formats livrez-vous ?', answer: "Nous livrons en horizontal 16:9 pour le web et la TV, en vertical 9:16 pour Reels, TikTok et Stories, et en carré 1:1 pour le fil d'actualité." },
      { question: 'Travaillez-vous pour des agences ?', answer: 'Oui, nous travaillons régulièrement en sous-traitance pour des agences, avec des accords de confidentialité et en marque blanche.' },
      { question: 'Quel est le délai pour une vidéo courte ?', answer: 'Une vidéo courte peut être livrée en 5 à 7 jours ouvrés.' },
    ],
    videoId: 'Xnahc3dyxI8',
  },
  {
    slug: 'clip-musical-abidjan',
    name: 'Clip musical',
    title: 'Réalisation de clip musical à Abidjan | NAATAL Studio',
    description: "Réalisation de clips musicaux à Abidjan pour artistes de Côte d'Ivoire et d'Afrique de l'Ouest : concept, tournage cinéma, montage et étalonnage.",
    h1: 'Réalisation de clip musical à Abidjan',
    intro: [
      "Un clip donne une image à votre musique et installe votre univers. NAATAL Studio réalise des clips musicaux à Abidjan pour les artistes de Côte d'Ivoire et d'Afrique de l'Ouest.",
      "Avec un pôle cinéma actif, nous abordons chaque clip comme un court film : écriture du concept, choix des décors, direction de la photographie et étalonnage sur mesure.",
    ],
    includes: [
      'Concept et écriture',
      'Repérages et décors',
      'Tournage en matériel cinéma Sony FX3 et optiques Sigma Art',
      'Montage et étalonnage',
      'Exports pour YouTube et formats verticaux',
    ],
    audience: ['Artistes', 'Labels', 'Managers'],
    faq: [
      { question: "Tournez-vous hors d'Abidjan ?", answer: "Oui, nous nous déplaçons dans toute la Côte d'Ivoire et en Afrique de l'Ouest, sur devis." },
      { question: 'Pouvez-vous construire un décor ?', answer: 'Oui, la construction de décors sur mesure fait partie de nos prestations de production.' },
      { question: 'Comment démarrer un clip ?', answer: 'Envoyez-nous votre morceau et vos idées par WhatsApp ou par email. Nous proposons un échange de 20 minutes pour cadrer le projet.' },
    ],
  },
  {
    slug: 'video-immobiliere-drone-abidjan',
    name: 'Vidéo immobilière et drone',
    title: 'Vidéo immobilière et drone à Abidjan | NAATAL Studio',
    description: "Vidéos immobilières et prises de vue par drone à Abidjan pour promoteurs et agences : film de programme, visite virtuelle et images aériennes.",
    h1: 'Vidéo immobilière et drone à Abidjan',
    intro: [
      "Une vidéo immobilière montre un programme, un quartier et ses volumes mieux qu'une série de photos. NAATAL Studio accompagne les promoteurs et les agences à Abidjan et en Côte d'Ivoire avec des films et des images aériennes par drone.",
      'Nous préparons le tournage avec vous, filmons au sol et depuis les airs, puis livrons une vidéo prête pour vos annonces, votre site et vos réseaux sociaux.',
    ],
    includes: [
      'Repérage du bien ou du programme',
      'Prises de vue aériennes par drone certifié',
      'Tournage intérieur et extérieur',
      'Visite virtuelle en vidéo',
      'Montage, étalonnage et habillage graphique',
    ],
    audience: ['Promoteurs immobiliers', 'Agences immobilières', 'Hôtellerie'],
    faq: [
      { question: 'Utilisez-vous un drone certifié ?', answer: 'Oui, nos prises de vue aériennes sont réalisées avec un drone certifié pour la captation aérienne.' },
      { question: 'Et si la météo empêche le tournage ?', answer: 'Nous replanifions gratuitement le tournage extérieur dans un délai de 2 semaines.' },
      { question: "Intervenez-vous hors d'Abidjan ?", answer: "Oui, partout en Côte d'Ivoire et en Afrique de l'Ouest, sur devis." },
    ],
  },
]

export const ROUTE_META = {
  '/': {
    title: 'NAATAL Studio — Production audiovisuelle à Abidjan',
    description: "Studio de production audiovisuelle à Abidjan : films corporate et institutionnels, publicités, clips, couverture d'événements et vidéos immobilières.",
  },
  '/cinema': {
    title: 'Cinéma — Films produits par NAATAL Studio à Abidjan',
    description: "Découvrez les films et projets cinéma produits par NAATAL Studio à Abidjan : fictions et documentaires tournés en Côte d'Ivoire.",
  },
  '/boutique': {
    title: 'Boutique — Outils pour créateurs | NAATAL Studio',
    description: 'Boutique NAATAL Studio : outils professionnels pour créateurs visuels, proposés par un studio de production audiovisuelle basé à Abidjan.',
  },
  '/offres': {
    title: 'Offres et tarifs vidéo à Abidjan | NAATAL Studio',
    description: 'Packages mensuels, offres signature et projets ponctuels de production vidéo à Abidjan par NAATAL Studio. Tarifs en FCFA.',
  },
  ...Object.fromEntries(SERVICE_PAGES.map(service => [
    `/services/${service.slug}`,
    { title: service.title, description: service.description },
  ])),
}

export const PACKAGES = [
  { name: 'Essentiel', price: '300 000 FCFA / mois', amount: 300000, target: 'PME & Startups', features: '2 vidéos courtes/mois, montage + sous-titres, livraison 5 jours, 2 révisions' },
  { name: 'Corporate', price: '700 000 FCFA / mois', amount: 700000, target: 'Entreprises mid-size', features: '4 vidéos/mois, tournage 2 jours, habillage graphique, vidéo institutionnelle trimestrielle' },
  { name: 'Premium', price: '1 100 000 FCFA / mois', amount: 1100000, target: 'Grandes entreprises & institutions', features: '6–8 vidéos/mois, multi-caméra, motion design, version FR+EN, film corporate trimestriel, révisions illimitées' },
]

export const SIGNATURE_OFFERS = [
  { name: 'Naatal Brand Film', price: '3 000 000 – 5 000 000 FCFA', desc: 'Film corporate signature 2–3 min, qualité cinéma. La carte de visite vidéo annuelle.' },
  { name: 'Naatal Event Coverage', price: '1 500 000 – 4 000 000 FCFA', desc: 'Captation événement corporate + aftermovie 90s, capsules speakers, témoignages.' },
  { name: 'Production sur-mesure', price: 'Sur devis', desc: 'Films longs, séries documentaires, productions hors Abidjan, projets multi-épisodes.' },
]

export const ONE_OFF_PROJECTS = [
  { name: 'Film institutionnel', price: '500 000 – 1 200 000 FCFA' },
  { name: 'Couverture événement corporate', price: '300 000 – 700 000 FCFA' },
  { name: 'Film de lancement produit', price: '400 000 – 900 000 FCFA' },
  { name: 'Série testimonials (×3)', price: '250 000 – 450 000 FCFA' },
  { name: 'Vidéo formation / e-learning', price: '350 000 – 750 000 FCFA' },
  { name: 'Film immobilier / promotion', price: '400 000 – 800 000 FCFA' },
]

// email et phone viennent des reglages de l'admin cote site, de BUSINESS au build
export const buildFaq = ({ email, phone }) => [
  {
    question: 'Où se trouve NAATAL Studio à Abidjan ?',
    answer: `NAATAL Studio est basé à ${BUSINESS.address.street}, à ${BUSINESS.address.city}, en ${BUSINESS.address.countryName}.`,
  },
  {
    question: 'Quels types de vidéos réalisez-vous ?',
    answer: 'Nous réalisons des films corporate et institutionnels, des publicités vidéo et spots TV, des clips musicaux, des documentaires, des couvertures événementielles, des vidéos drone pour la promotion immobilière, du motion design et du montage professionnel.',
  },
  {
    question: 'Proposez-vous des packages vidéos pour des entreprises ?',
    answer: 'Nous proposons plusieurs formules : le Package Essentiel (2 vidéos courtes par mois), le Package Corporate (4 vidéos par mois avec habillage graphique) et le Package Premium (6 à 8 vidéos avec motion design et version bilingue). Contactez-nous pour un devis adapté à votre projet.',
  },
  {
    question: "Intervenez-vous en dehors d'Abidjan ?",
    answer: "Oui, bien que basés à Abidjan, nous nous déplaçons dans toute la Côte d'Ivoire et en Afrique de l'Ouest pour vos projets de production audiovisuelle.",
  },
  {
    question: "Quel est le délai de livraison d'une vidéo ?",
    answer: 'Les délais varient selon le type de projet. Une vidéo courte peut être livrée en 5 à 7 jours ouvrés, un film corporate en 2 à 3 semaines. Nous définissons ensemble un planning précis dès le lancement du projet.',
  },
  {
    question: 'Comment vous contacter pour un projet vidéo ?',
    answer: `Vous pouvez nous joindre par téléphone ou WhatsApp au ${phone}, par email à ${email}, ou directement via le formulaire de contact sur notre site.`,
  },
]
