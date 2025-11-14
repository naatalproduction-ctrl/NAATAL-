# Architecture & Techniques - NAATAL

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────┐
│         Browser / Client Side           │
├─────────────────────────────────────────┤
│  React Router - Navigation & Routing    │
│  React Components - UI & Logic          │
│  Framer Motion - Animations             │
│  CSS3 - Styling & Layouts               │
└─────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│       Vite Build & Dev Server           │
│  - HMR (Hot Module Replacement)         │
│  - Code Splitting                       │
│  - Asset Optimization                   │
└─────────────────────────────────────────┘
```

## 📦 Dépendances Principales

### Production
- **react@18.2.0** : Framework UI
- **react-dom@18.2.0** : DOM API
- **framer-motion@10.16.4** : Animations avancées
- **react-router-dom@6.20.0** : Routage SPA
- **gsap@3.12.2** : Animations audio-visuelles

### Développement
- **vite@5.0.2** : Build tool ultra-rapide
- **@vitejs/plugin-react@4.2.0** : Support JSX

## 🎨 Système de Design

### Composants Principaux

#### 1. **Header Component**
```jsx
Props: N/A
State: isOpen (mobile menu)
Features:
  - Logo avec pulse animation
  - Navigation avec underline hover
  - Hamburger menu responsive
```

#### 2. **Hero Component**
```jsx
Props: N/A
Features:
  - Staggered text animations
  - Circular visual animation
  - Smooth scroll indicator
```

#### 3. **Services Component**
```jsx
Props: N/A
Data: Array of 6 services
Features:
  - Grid responsive
  - Card hover effects
  - Icon scaling
```

#### 4. **Portfolio Component**
```jsx
Props: N/A
Data: Array of 6 projects
Features:
  - Image overlay on hover
  - Project categories
  - Responsive gallery
```

#### 5. **Team Component**
```jsx
Props: N/A
Data: Array of 6 members
Features:
  - Avatar float animation
  - Hover glow effect
  - Expandable member line
```

#### 6. **Contact Component**
```jsx
Props: N/A
Features:
  - Form validation
  - Two-column layout
  - Contact info sections
```

#### 7. **Footer Component**
```jsx
Props: N/A
Features:
  - Social links animated
  - Quick navigation
  - Dynamic year copyright
```

## 🎯 Patterns Utilisés

### 1. **Component Composition**
```jsx
<App>
  <Header />
  <Hero />
  <Services />
  <Portfolio />
  <Team />
  <Contact />
  <Footer />
</App>
```

### 2. **Animation Variants**
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}
```

### 3. **Scroll Animations**
```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
/>
```

## 🎨 Système de Couleurs

### Palette
```css
--color-black: #000000
--color-white: #ffffff
--color-gray-light: #b0b0b0
--color-gray-dark: #808080
--color-transparent: rgba(255, 255, 255, 0.x)
```

### Gradients
```css
/* Texte principal */
linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)

/* Backgrounds */
radial-gradient(circle, rgba(255, 255, 255, 0.05), transparent)
```

## 📱 Responsive Breakpoints

| Breakpoint | Taille | Usage |
|-----------|--------|-------|
| Mobile | 320px - 768px | Phones & small tablets |
| Tablet | 768px - 1024px | Medium devices |
| Desktop | 1024px+ | Large screens |

## ⚡ Performance Optimizations

### 1. **Code Splitting**
Vite split automatiquement le code par routes

### 2. **Lazy Loading**
```jsx
const Header = lazy(() => import('./Header'))
```

### 3. **Image Optimization**
- Formats modernes (WebP)
- Responsive images
- Lazy loading attributes

### 4. **CSS Optimization**
- CSS modules ou scoped styling
- PurgeCSS en production
- Minification automatique

## 🔄 State Management

Actuellement utilise React Hooks:
- `useState` pour les états locaux
- `useContext` optionnel pour état global

**Future**: Possibilité d'ajouter Redux ou Zustand

## 🧪 Testing (À Implémenter)

```bash
npm install -D vitest @testing-library/react
```

Tests recommandés:
- Unit tests pour components
- Integration tests pour navigatio
- E2E tests avec Playwright

## 📊 SEO Considerations

### Current
- Meta tags dans `index.html`
- Semantic HTML
- Open Graph meta tags

### Future
- SSG with Next.js
- Dynamic sitemap
- Structured data (JSON-LD)

## 🔐 Security

- ✅ No hardcoded secrets
- ✅ Environment variables pour sensibles data
- ✅ XSS protection via React
- ✅ CSRF tokens si backend nécessaire

## 🚀 Deployment Checklist

- [ ] `npm run build` sans erreurs
- [ ] Lighthouse score 90+
- [ ] Tests passent
- [ ] Env variables configurées
- [ ] CORS configuré si API
- [ ] SSL/HTTPS activé
- [ ] Analytics configurée

## 📚 Ressources Externes

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Framer Motion](https://www.framer.com/motion/)
- [Web.dev Performance](https://web.dev)

---

**Version** : 1.0.0
**Last Updated** : 14 Nov 2025
