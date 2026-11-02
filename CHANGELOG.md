# Journal des versions

Les évolutions du site NAATAL Studio sont notées ici. Le projet suit le [versionnage sémantique](https://semver.org/lang/fr/) :

- **patch** (1.0.1) : correction
- **minor** (1.1.0) : nouvelle page ou nouvelle fonctionnalité
- **major** (2.0.0) : refonte ou changement incompatible

`npm run release` publie une version sur GitHub. Cette commande ne touche jamais au serveur : une version publiée n'est pas forcément en ligne. `https://naatalstudio.com/version.json` indique la version réellement déployée.

## [Non publié]

### Ajouté

- Scripts `deploy.sh` et `nginx-update.sh` : sauvegarde du serveur, simulation et retour arrière automatique.
- Interrupteur Actif / Désactivé de l'onglet Offres dans les paramètres de l'admin, enregistré en base dans `offres_enabled`.
- Commande `npm run db:sync` qui recopie le contenu public de production dans la base locale.

### Modifié

- Règle nginx des pages de services documentée dans `seo/nginx-seo.conf`.

### Corrigé

- Les fichiers SQL ne recréent plus les données d'exemple quand on les relance.
- Titres des vidéos dans les données d'exemple alignés sur la production, dont « AMS & HITACHI ».
- La page d'accueil ne clignote plus au chargement de la section Offres.
- `nginx-update.sh` fait revalider le HTML à chaque visite : une nouvelle version s'affiche sans vider le cache du navigateur.
- Le bouton WhatsApp et les liens des offres suivent le téléphone enregistré dans l'admin.

## [1.0.0] - 2026-11-02

### Ajouté

- Cinq pages de services : film institutionnel, couverture événementielle, publicité vidéo, clip musical, vidéo immobilière et drone.
- Modification du nom du site, de l'email et du téléphone dans les paramètres de l'admin, avec affichage sur le site public.
- Système de versions : numéro affiché dans l'admin, fichier `version.json`, journal des versions et commande `npm run release`.
- Contrôle SEO automatique au build et blocage des secrets avant chaque commit et chaque push.
- Fichier `database/leads.sql` et commande `npm run admin:create`.

### Modifié

- Pages lues par les robots enrichies avec le contenu réel du site et des données structurées valides.
- `llms.txt` au format standard, miroirs Markdown de chaque page et `robots.txt` qui protège `/admin` et `/api/` pour tous les robots.
- Le SEO suit le réglage `offres_enabled` : aucun prix publié quand les offres sont masquées.
- Sitemap enrichi des images et des vidéos ; boutique vide retirée de l'indexation.
- Nouveau favicon lisible en petite taille, limité au N de la charte.
- Email de contact unifié sur `hello@naatalstudio.com`.

### Corrigé

- Boutons invisibles de l'accueil supprimés.
- La limite de messages ne bloque plus les requêtes de l'admin.
- Scripts d'initialisation de la base de données.
- Dossier `public/` suivi par git avec la bonne casse.

### Sécurité

- Secrets et accès au serveur retirés du code et de l'historique git.
