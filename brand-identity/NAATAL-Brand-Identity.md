# NAATAL STUDIO — Brand Identity Guide

---

## 1. A PROPOS DE LA MARQUE

### Nom
**NAATAL STUDIO**

### Signification
"Naatal" signifie "Vision" en wolof. La marque incarne la capacite a voir au-dela du visible, a transformer une idee en image de marque puissante.

### Baseline
**"Nous donnons une image de Marque a vos ambitions."**

### Mission
Offrir aux entreprises et institutions une production audiovisuelle d'excellence qui valorise leur image, raconte leur histoire et amplifie leur impact.

### Vision
Devenir la reference de la production audiovisuelle corporate en Afrique de l'Ouest, en alliant creativite cinematographique et rigueur professionnelle.

### Valeurs
- **Excellence** — Chaque projet est traite avec une exigence cinematographique
- **Creativite** — Des approches visuelles distinctives et memorables
- **Engagement** — Un accompagnement de A a Z, de la conception a la diffusion
- **Authenticite** — Des histoires vraies, des recits qui resonnent
- **Innovation** — Technologies et techniques de pointe au service du recit

---

## 2. LOGO

### Versions du logo

| Fichier | Usage |
|---------|-------|
| `logo.png` | Logo principal — texte "NAATAL STUDIO" complet |
| `logo.jpg` | Version alternative (fond sombre) |
| `Logo 2.png` | Version secondaire / icone |
| `logo 3.png` | Version compacte "N" — pour favicon, admin, espaces reduits |
| `logo app.png` | Version pour applications mobiles et reseaux sociaux |

### Regles d'utilisation
- **Zone de protection** : Laisser un espace minimum egal a la hauteur du "N" autour du logo
- **Taille minimale** : 80px de large pour le logo complet, 32px pour l'icone "N"
- **Fond prefere** : Noir (#060606) ou tres sombre
- **Ne jamais** : Deformer, pivoter, changer les couleurs du logo, placer sur fond clair sans adaptation

---

## 3. PALETTE DE COULEURS

### Couleurs principales

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Noir profond** | `#060606` | 6, 6, 6 | Fond principal du site et supports |
| **Noir pur** | `#000000` | 0, 0, 0 | Fond secondaire, contrastes |
| **Or NAATAL** | `#c9a84c` | 201, 168, 76 | Couleur d'accent principale — titres, CTA, elements cles |
| **Or clair** | `#e8c96d` | 232, 201, 109 | Accent secondaire, hover states |
| **Jaune Marque** | `#FFD700` | 255, 215, 0 | Accent special — mot "Marque" dans le hero |
| **Blanc** | `#ffffff` | 255, 255, 255 | Texte principal |
| **Blanc attenue** | `#f0f0f0` | 240, 240, 240 | Texte courant |

### Couleurs secondaires

| Nom | Valeur | Usage |
|-----|--------|-------|
| **Texte secondaire** | `rgba(240, 240, 240, 0.6)` | Sous-titres, descriptions |
| **Texte discret** | `rgba(240, 240, 240, 0.35)` | Labels, placeholders |
| **Surface** | `rgba(255, 255, 255, 0.03)` | Cartes, zones sureleves |
| **Bordure** | `rgba(255, 255, 255, 0.08)` | Separateurs, contours de cartes |
| **Or attenue** | `rgba(201, 168, 76, 0.15)` | Fonds d'accent subtils |
| **Or glow** | `rgba(201, 168, 76, 0.25)` | Effets lumineux, halos |
| **Vert WhatsApp** | `#25D366` | Bouton CTA WhatsApp |

### Degradeges signature
- **Fond de section** : `linear-gradient(165deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98))`
- **Hover carte** : `linear-gradient(165deg, rgba(25,22,15,0.98), rgba(12,12,10,0.98))`
- **Bouton CTA** : `linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))`

---

## 4. TYPOGRAPHIE

### Police principale
**System Font Stack** (performance optimale)
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif
```

### Hierarchie typographique

| Element | Taille | Poids | Espacement | Usage |
|---------|--------|-------|------------|-------|
| **H1 — Hero** | clamp(42px, 5.5vw, 72px) | 700 | -2px | Titre principal de page |
| **H2 — Section** | clamp(42px, 5.5vw, 72px) | 700 | -2px | Titres de sections |
| **H3 — Carte** | 24px | 600 | -0.5px | Titres de cartes/elements |
| **Label** | 11px uppercase | 600 | 3-4px | Sous-titres au-dessus des H2 |
| **Body** | 17px | 400 | 0.3px | Texte courant |
| **Small** | 14px | 400 | 0.2px | Descriptions, details |
| **Caption** | 12px | 500 | 0.5px | Tags, compteurs, metadata |

### Style special
- Le mot **"Marque"** dans le hero est en `font-style: italic` + couleur `#FFD700`
- Les labels de section utilisent `text-transform: uppercase` avec `letter-spacing: 3-4px`
- Les numeros de prestation (01, 02...) : `font-size: 48px`, `font-weight: 800`, couleur or tres attenue

---

## 5. ICONOGRAPHIE

### Style des icones
- **Type** : SVG inline, trait (stroke)
- **Epaisseur** : `strokeWidth="1.5"`
- **Couleur** : Or NAATAL (`#c9a84c`) ou blanc selon le contexte
- **Taille standard** : 24px pour la navigation, 56px pour les cartes prestations

### Icones metier
Chaque prestation a une icone dediee representant son domaine :
- Conception — Maison/plan architectural
- Gestion — Mallette/organisation
- Pre-production — Ecran avec elements
- Production — Camera avec clap
- Post-production — Timeline de montage
- Diffusion — Ondes de diffusion

---

## 6. PHOTOGRAPHIE & VIDEO

### Direction artistique
- **Tonalite** : Sombre, cinematographique, contrastee
- **Eclairage** : Low-key, eclairages dramatiques, jeux d'ombres
- **Couleurs** : Desaturees avec touches dorees/chaudes
- **Cadrage** : Compositions soignees, regle des tiers, profondeur de champ

### Specifications techniques
- **Videos** : MP4 H.264, attributs `autoPlay muted loop playsInline`
- **Images** : WebP ou PNG, optimisees pour le web
- **Ratio prefere** : 16:9 pour les videos, libre pour les visuels

---

## 7. COMPOSANTS UI

### Cartes
- `border-radius: 20px`
- `background: linear-gradient(165deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98))`
- `border: 1px solid rgba(255,255,255,0.06)`
- Hover : bordure doree, `translateY(-8px)`, ombre portee profonde

### Boutons

| Type | Style |
|------|-------|
| **Primaire** | Fond or attenue, bordure doree, texte or, `border-radius: 60px` |
| **Secondaire** | Transparent, bordure blanche subtile, texte blanc |
| **WhatsApp** | Rond, fond `#25D366`, icone blanche, ombre verte |

### Animations
- **Framework** : Framer Motion
- **Entree** : `fadeInUp` (opacity 0→1, y 30→0), duration 0.6-0.8s
- **Stagger** : Delai de 0.1s entre chaque element d'une liste
- **Hover** : `scale(1.02-1.1)`, transitions `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Viewport** : `once: true` — les animations ne jouent qu'une fois

### Effets visuels
- **Glow** : Halos radiaux dores avec `filter: blur(120px)`
- **Grille** : Lignes subtiles dorees en fond (`background-size: 80px 80px`)
- **Backdrop blur** : `backdrop-filter: blur(20px)` sur les overlays

---

## 8. TONE OF VOICE

### Personnalite
- **Professionnel** mais accessible
- **Confiant** sans arrogance
- **Inspire** et inspirant
- **Direct** — aller a l'essentiel

### Langue
- **Site web** : Francais (sans accents dans le code JSX)
- **Code** : Anglais pour les commentaires techniques
- **Reseaux sociaux** : Francais, ton plus decontracte

### Exemples de formulations
| A faire | A eviter |
|---------|----------|
| "Nous donnons une image de Marque a vos ambitions" | "Nous faisons des videos" |
| "Production audiovisuelle d'excellence" | "On est les meilleurs" |
| "Transformons votre vision en realite" | "Contactez-nous pour un devis" |
| "Tournage professionnel avec materiel de pointe" | "On a du bon matos" |

---

## 9. APPLICATIONS

### Site web
- **URL** : https://naatalstudio.com
- **Stack** : React + Vite (frontend), Express + PostgreSQL (backend)
- **Hebergement** : Serveur dedie, SSL via Certbot, Nginx

### Reseaux sociaux
- **Facebook** : @naatalproduction
- **Instagram** : @naatalproduction
- **YouTube** : @naatalproduction

### Supports print
- Utiliser le logo sur fond noir ou tres sombre
- Couleur d'accent or `#c9a84c` pour les titres et elements graphiques
- Typographie : Utiliser une police sans-serif premium (Montserrat, Inter, ou SF Pro)

### Email professionnel
- **Contact** : info.naatalstudio@gmail.com
- **Telephone** : +225 07 19 95 65 86
- **Localisation** : Abidjan, Cote d'Ivoire

---

## 10. PRESTATIONS

### Services proposes
1. **Conception** — Brainstorming, script, storyboard, note d'intention, reperages
2. **Production** — Tournage complet, materiel pro, decors sur mesure, multi-cameras
3. **Post-Production** — Montage, etalonnage, mixage sonore, motion design, sous-titrage

### Services video specifiques
- Film Corporate Institutionnel
- Video de Recrutement & Marque Employeur
- Film de Lancement de Produit
- Reportage d'Evenement Corporate
- Interview & Temoignage Client
- Video Pedagogique & Formation Interne
- Publicite Digitale Courte
- Couverture de Chantier & Immobilier

---

*Document de reference — NAATAL STUDIO Brand Identity*
*Derniere mise a jour : Mars 2026*
