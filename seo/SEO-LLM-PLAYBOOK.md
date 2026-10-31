# Playbook SEO + LLM-friendly pour SPA

> Guide pratique pour rendre un site (SPA React/Vue/Vite/Next) **lisible par
> Google ET par les LLMs** (ChatGPT, Claude, Perplexity, Gemini).
>
> Methode eprouvee sur Tribal Print et Tribal Studio. 100% statique,
> deployable en rsync, 0 dependance backend pour le SEO.

---

## 🎯 Pourquoi ce systeme ?

### Le probleme
Une SPA (React, Vue, Vite, etc.) renvoie un `index.html` quasi-vide aux bots :
les meta tags, le contenu et les liens internes ne sont disponibles **qu'apres
execution du JavaScript**. Resultat :
- Google indexe mais avec retard et parfois mal le contenu dynamique
- Facebook / Twitter / LinkedIn / WhatsApp ne montrent **aucun preview**
  (ils n'executent pas le JS)
- ChatGPT / Claude / Perplexity n'ont **aucun moyen** de comprendre ton offre
  quand un utilisateur leur demande "trouve-moi un studio qui fait X"

### La solution : 3 fichiers texte + miroirs (+ knowledge base)
On genere automatiquement, **a chaque build**, des fichiers statiques que les
bots lisent directement. Pas besoin de SSR, pas besoin de Next.js.

---

## 📦 Les 4 piliers

| # | Fichier(s) | Audience | Genere par |
|---|---|---|---|
| 1 | `dist/seo/<page>.html` | Bots reseaux sociaux (FB, Twitter, LinkedIn, WhatsApp) + Google | `generate-seo-pages.mjs` |
| 2 | `dist/llms.txt` + `dist/llms-full.txt` + `dist/md/<page>.md` | LLMs (ChatGPT, Claude, Perplexity, Gemini) | `generate-llms-and-mirrors.mjs` |
| 3 | `dist/sitemap.xml` + `dist/robots.txt` | Bots de crawl | Les deux scripts |
| 4 | `rag/<brand>-knowledge-base.md` | Agent IA proprietaire (RAG) | A maintenir a la main |

---

## 1️⃣ Pages HTML statiques pour les bots

### But
Pour chaque URL de l'app (`/`, `/about`, `/services/branding`...), generer un
fichier HTML minimal avec :
- `<title>`, `<meta description>`
- Open Graph (`og:title`, `og:description`, `og:image`)
- Twitter Card
- `<link rel="canonical">`
- Schema.org JSON-LD (au moins sur la home)
- Un `<script>` qui redirige les vrais utilisateurs vers la SPA

### Exemple de fichier genere

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Branding & Identity Services · Tribal Studio</title>
  <meta name="description" content="A distinctive brand identity..." />
  <meta property="og:title" content="..." />
  <meta property="og:image" content="https://tribalstudio.dev/og/og-default.jpg" />
  <link rel="canonical" href="https://tribalstudio.dev/services/branding" />
  <script>
    if (!/bot|crawl|spider|facebook|twitter|linkedin|whatsapp|telegram|slack/i.test(navigator.userAgent)) {
      window.location.replace('https://tribalstudio.dev/services/branding')
    }
  </script>
</head>
<body>
  <h1>Branding & Identity Services · Tribal Studio</h1>
  <p>A distinctive brand identity...</p>
</body>
</html>
```

### Servir avec Nginx
Nginx detecte le bot et sert le HTML statique au lieu de la SPA :

```nginx
map $http_user_agent $is_bot {
  default 0;
  ~*(bot|crawl|spider|facebook|twitter|linkedin|whatsapp|telegram|slack|discord|preview) 1;
}

server {
  server_name tribalstudio.dev;
  root /var/www/tribalstudio.dev/dist;

  # Bots sociaux + Google : sert dist/seo/<path>.html
  location / {
    if ($is_bot) {
      rewrite ^/$ /seo/index.html break;
      rewrite ^/(.+)$ /seo/$1.html break;
    }
    # Sinon : SPA classique
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 2️⃣ llms.txt + miroirs Markdown

### Le standard llms.txt
[llmstxt.org](https://llmstxt.org/) propose un format standard pour aider les
LLMs a comprendre un site rapidement, place a la racine `/llms.txt`.

### Que mettre dedans ?
- Un titre H1 et un paragraphe d'intro
- Les contacts (email, tel, adresse)
- La liste des services + prix
- Les pages importantes
- Les liens vers les miroirs markdown

### Pourquoi des miroirs Markdown ?
ChatGPT et Claude indexent **infiniment mieux** du markdown que du HTML SPA.
Pour chaque page importante, on genere `dist/md/<slug>.md` avec :
- Le titre canonique
- La description
- Le contenu principal (eventuellement extrait des composants React)
- Le lien canonique
- Les contacts

Resultat : quand un user demande a ChatGPT "agence de branding a Londres",
ton site peut apparaitre dans la reponse.

### Exemple de structure `llms.txt`

```text
# Tribal Studio — Creative & Tech Studio

Last updated: 2026-04-28

## About
Tribal Studio LLC is a senior multi-disciplinary studio shipping branding, web,
mobile and AI products. HQ in Albuquerque, NM. Original team in Abidjan, CI.

## Contact
- Website: https://tribalstudio.dev
- Email: hello@tribalstudio.dev
- Phone: +1 505 523 2241

## Services and Pricing
- **Branding & Identity** — from $2,500 — https://tribalstudio.dev/services/branding
- **Web Design & Development** — from $4,000 — https://tribalstudio.dev/services/web-design-development
- **AI Agents & Automation** — from $5,000 — https://tribalstudio.dev/services/ai-agents-automation
[...]

## Markdown mirrors
- https://tribalstudio.dev/md/services/branding.md
- https://tribalstudio.dev/md/services/web-design-development.md
[...]
```

---

## 3️⃣ sitemap.xml + robots.txt

### sitemap.xml
Genere automatiquement avec **toutes** les URLs (pages services, locations,
work, blog...). Mis a jour a chaque build avec `lastmod` au jour J.

### robots.txt — autoriser explicitement les bots IA

C'est **crucial** : par defaut, beaucoup de bots IA respectent un opt-in. Si
tu ne les listes pas, ils n'indexent pas. Voici la liste minimale a autoriser :

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# AI bots — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

Sitemap: https://tonsite.com/sitemap.xml
```

---

## 4️⃣ Knowledge base RAG (`rag/*.md`)

### A quoi ca sert ?
Si tu deploies un **agent IA / chatbot** sur ton site (via OpenAI Assistant,
Claude API, ou un agent maison avec RAG), il a besoin d'une **source unique de
verite** pour repondre aux questions des visiteurs.

### Que mettre dedans ?
Un seul fichier markdown structure :
- Identite (raison sociale, contacts, marches)
- Catalogue produits/services + prix
- Processus d'engagement
- Stack technique
- FAQ exhaustive (15-30 questions)
- Valeurs et differentiateurs
- Portfolio

Le fichier sert ensuite a alimenter une base vectorielle (Pinecone, pgvector,
local embeddings) que l'agent IA interroge a chaque question.

### Bonus : meme pour ton agent, ce fichier sert de :
- Brief unique pour les nouveaux membres de l'equipe
- Source pour les LLMs externes (publie aussi en `/llms-full.txt`)
- Reference pour les pitch decks et propositions commerciales

---

## 🛠️ Architecture des scripts

```
project/
├── scripts/
│   ├── generate-seo-pages.mjs           # 1. HTML statiques + sitemap.xml
│   └── generate-llms-and-mirrors.mjs    # 2. llms.txt + miroirs MD + robots.txt
├── rag/
│   └── <brand>-knowledge-base.md        # 4. RAG agent IA (manuel)
├── public/
│   └── og/                              # Images Open Graph 1200x630
└── package.json                         # scripts: build a hooke les 2 generateurs
```

### Hook dans `package.json`

```json
{
  "scripts": {
    "build": "tsc -b && vite build && pnpm build:seo",
    "build:seo": "node scripts/generate-seo-pages.mjs && node scripts/generate-llms-and-mirrors.mjs"
  }
}
```

A chaque `pnpm build`, les fichiers statiques sont regeneres a partir du
catalogue de pages defini dans le script.

---

## 📋 Checklist de mise en place

### Setup initial
- [ ] Definir le **catalogue des pages** (URL, title, description, og:image, priorite, frequence) dans `scripts/generate-seo-pages.mjs`
- [ ] Definir les **donnees business** (services, prix, contacts, FAQ) dans `scripts/generate-llms-and-mirrors.mjs`
- [ ] Creer le fichier `rag/<brand>-knowledge-base.md` (single source of truth)
- [ ] Preparer une image OG par defaut (1200×630 px) dans `public/og/og-default.jpg`
- [ ] Hooker les scripts dans `pnpm build`

### Configuration Nginx
- [ ] Detecter les bots avec `map $http_user_agent`
- [ ] Servir `dist/seo/<path>.html` aux bots
- [ ] Servir `dist/index.html` (SPA) aux utilisateurs
- [ ] Verifier que `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` sont bien servis a la racine

### Schema.org
- [ ] `Organization` sur la home
- [ ] `Service` sur chaque page service
- [ ] `BreadcrumbList` partout
- [ ] `LocalBusiness` sur les pages locations
- [ ] `FAQPage` sur les FAQ
- [ ] `Article` / `BlogPosting` sur les articles de blog

### Validation
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — verifie OG
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] [Schema Validator](https://validator.schema.org/)
- [ ] Ouvrir `/llms.txt` dans le navigateur — il doit etre lisible
- [ ] Tester avec un user-agent bot via curl :
  ```bash
  curl -A "facebookexternalhit/1.1" https://tonsite.com/services/branding
  ```

### Authentification email (pour ne pas finir en spam)
Si tu envoies des emails depuis le domaine (formulaire de contact, newsletter,
notifications transactionnelles), tu **dois** :
- [ ] Configurer **DKIM** chez ton fournisseur d'envoi (Brevo, Resend, Mailgun, etc.)
- [ ] Configurer **SPF** dans la zone DNS
- [ ] Configurer **DMARC** dans la zone DNS
- [ ] Valider l'expediteur (Brevo : Senders & IP > Add sender)

Sans ca, Gmail t'envoie en Promotions / Spam.

---

## 🚀 Resultats attendus

### Court terme (J+0 a J+7)
- Les liens partages sur Facebook / WhatsApp / LinkedIn affichent un preview riche
- `view-source:` sur Twitter / LinkedIn voit ton meta og:image et ton title
- Google Search Console reconnait le sitemap

### Moyen terme (J+30 a J+90)
- Les pages services apparaissent dans les recherches Google ("agence branding londres", "studio saas paris")
- ChatGPT, Claude, Perplexity peuvent te citer dans leurs reponses
- Le trafic organique decolle si le contenu est de qualite

### Long terme (3-6 mois)
- Tu deviens une **reference indexee** pour les LLMs sur ton secteur
- Les agents IA externes (assistants commerciaux d'autres marques) peuvent te recommander automatiquement
- L'authority du domaine se construit naturellement

---

## 💡 Conseils tires de l'experience Tribal

1. **Commence par les pages services**. C'est la qu'on rank sur les money keywords.
2. **Pages locations** = local SEO instantane. "Studio in London", "Agence a Abidjan" rankent en quelques semaines avec une seule page bien faite.
3. **Pricing transparent** = trust + SEO. Affiche les prix de depart publiquement. Google et les users adorent.
4. **Updated frequemment** > **parfait une seule fois**. Mets le `lastmod` dans le sitemap a jour automatiquement.
5. **Ne neglige pas la knowledge base RAG**. C'est le seul fichier vraiment irremplacable — tout le reste est genere automatiquement.
6. **Utilise les deux noms `xkeysib-` (API) et `xsmtpsib-` (SMTP) pour Brevo** — selon le cas d'usage. L'API REST est plus simple, le SMTP est plus universel.

---

## 📁 Fichiers a recuperer

Pour deployer ce systeme sur un autre projet :

1. `scripts/generate-seo-pages.mjs` — catalogue des pages + generateur HTML/sitemap
2. `scripts/generate-llms-and-mirrors.mjs` — generateur llms.txt + markdown + robots
3. `rag/<brand>-knowledge-base.md` — base de connaissances pour l'agent IA
4. Hook dans `package.json` :
   ```json
   "build": "vite build && node scripts/generate-seo-pages.mjs && node scripts/generate-llms-and-mirrors.mjs"
   ```
5. Config Nginx pour le routage bots / users (cf section "Servir avec Nginx")

Adapter les **donnees** (catalogue de pages, services, FAQ, contacts) au site
cible. La structure des scripts reste identique.

---

*Playbook redige par Joseph Kakou (Tribal Studio) — partage sous licence libre*
