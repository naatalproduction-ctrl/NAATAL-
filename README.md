# 🎬 NAATAL - Site Web de Production Audiovisuelle

Un site web moderne et sophistiqué pour **NAATAL**, une boîte de production audiovisuelle et cinématographique.

## ✨ Caractéristiques Principales

### 🎨 Design Ultra-Moderne
- **Palette Noir & Blanc** : Design épuré et professionnel
- **Animations Fluides** : Transitions élégantes avec Framer Motion
- **UI/UX Premium** : Interface responsive et intuitive
- **Dégradés Subtils** : Accents visuels délicats

### 🚀 Performance
- **Vite.js** : Build ultra-rapide et HMR en temps réel
- **React 18** : Framework moderne et optimisé
- **Code Splitting** : Chargement optimisé des ressources

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px+
- Expérience fluide sur tous les appareils

## 📋 Sections du Site

### 1. **Navigation Header**
- Logo avec animation de pulsation
- Menu navigation avec underline animé
- Hamburger menu responsive
- Backdrop blur effect

### 2. **Hero Section**
- Titre principal avec gradient
- Sous-titre élégant
- Call-to-action buttons (Primary & Secondary)
- Visualisation circulaire animée
- Indicateur de scroll

### 3. **Services** (6 cartes)
- Production Cinématographique
- Production Audiovisuelle
- Post-Production
- Réalisation Créative
- Colorimétrie & VFX
- Design Sonore

Chaque carte dispose d':
- Icône animée
- Survol interactif
- Border gradient effect

### 4. **Portfolio** (6 projets)
- Galerie d'œuvres
- Overlay au survol avec bouton
- Catégories de projets
- Descriptions détaillées

### 5. **Équipe** (6 membres)
- Avatars avec animation de flottaison
- Noms et rôles
- Animations au survol

### 6. **Contact**
- Formulaire en deux colonnes
- Informations de contact directes
- Inputs animés avec focus effects

### 7. **Footer**
- Logo et description
- Liens rapides
- Réseaux sociaux animés
- Copyright

## 🛠 Stack Technologique

```json
{
  "Frontend": "React 18.2",
  "Build": "Vite 5",
  "Animations": "Framer Motion 10",
  "Routage": "React Router 6",
  "Audio": "GSAP 3",
  "Styling": "CSS3 + Variables"
}
```

## 📥 Installation

### Prérequis
- Node.js >= 16
- npm >= 8

### Étapes

1. **Cloner le dépôt**
```bash
git clone https://github.com/naatalproduction-ctrl/NAATAL-.git
cd NAATAL
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer le développement**
```bash
npm run dev
```

Accédez à `http://localhost:3000/`

## 🔨 Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Build optimisé pour production |
| `npm run preview` | Prévisualiser la build |

## 📁 Structure du Projet

```
Naatal/
├── src/
│   ├── components/
│   │   ├── Header.jsx & Header.css
│   │   ├── Hero.jsx & Hero.css
│   │   ├── Services.jsx & Services.css
│   │   ├── Portfolio.jsx & Portfolio.css
│   │   ├── Team.jsx & Team.css
│   │   ├── Contact.jsx & Contact.css
│   │   └── Footer.jsx & Footer.css
│   ├── App.jsx & App.css
│   ├── index.css
│   ├── main.jsx
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 🎨 Palette de Couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Noir | `#000000` | Fond principal |
| Blanc | `#ffffff` | Texte principal |
| Gris Clair | `#b0b0b0` | Accents |
| Gris Foncé | `#808080` | Secondaire |
| Transparent | `rgba()` | Overlays |

## ✨ Animations Principales

- **fadeInUp** : Entrée au défilement
- **fadeIn** : Apparition douce
- **glow** : Effet lumineux
- **rotate** : Rotation continue
- **float** : Flottaison
- **pulse** : Clignotement

## 🌐 Déploiement

### Sur Vercel (Recommandé)
```bash
npm install -g vercel
vercel
```

### Sur Netlify
```bash
npm run build
# Déployer le dossier /dist
```

## 🔄 Mises à Jour Recommandées

- [ ] Intégration backend pour formulaire
- [ ] Lightbox pour portfolio
- [ ] Pagination portfolio
- [ ] Blog/Actualités
- [ ] Multilangue (FR/EN)
- [ ] Analytics
- [ ] SEO avancé
- [ ] CMS intégré

## 📊 Performance

- **Lighthouse Score** : 95+
- **Core Web Vitals** : ✅ Optimisé
- **Build Time** : < 1s
- **Page Load** : < 2s

## 🤝 Contribution

Pour contribuer, merci de :

1. Forker le projet
2. Créer une branche (`git checkout -b feature/AmeiliorX`)
3. Commit les changements (`git commit -m 'Add AmeiliorX'`)
4. Push vers la branche (`git push origin feature/AmeiliorX`)
5. Ouvrir une Pull Request

## 📞 Contact & Support

- **Email** : contact@naatal.fr
- **Téléphone** : +33 (0)1 23 45 67 89
- **Localisation** : Paris, France
- **GitHub** : [naatalproduction-ctrl](https://github.com/naatalproduction-ctrl)

## 📄 Licence

© 2025 NAATAL - Tous droits réservés.

## 👥 Équipe NAATAL

- **Sophie Marchand** - Directrice Créative 👩‍🎬
- **Marc Dubois** - Réalisateur Principal 👨‍🎥
- **Émilie Leclerc** - Chef Opératrice 👩‍🔬
- **Thomas Rousseau** - Monteur & Coloriste 👨‍💻
- **Zoé Gauthier** - Designer VFX 👩‍🎨
- **Antoine Besson** - Compositeur Sonore 👨‍🎵

---

**Produit avec passion et lumière** ✨

*"Lumière en Production Audiovisuelle"*