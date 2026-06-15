# Comment déployer NocoBase plus rapidement

Beaucoup d'entre vous trouvent peut-être que la vitesse d'accès n'est pas idéale lors du déploiement de NocoBase. Cela vient souvent de l'environnement réseau, de la configuration serveur ou de l'architecture de déploiement. Avant d'aborder les techniques d'optimisation, voici à titre indicatif la vitesse d'accès d'une configuration normale, pour éviter toute inquiétude inutile.

### Vitesse de chargement standard de NocoBase à titre de référence

Voici les temps de chargement mesurés sur l'environnement de démonstration NocoBase :

- Saisir l'URL et entrer pour la première fois dans l'application : environ 2 secondes
- Naviguer entre les pages dans l'application : 50 à 300 millisecondes

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

Voici une série de techniques d'optimisation simples mais efficaces ; elles ne nécessitent aucune modification de code, juste un ajustement du déploiement, pour gagner sensiblement en vitesse :

## I. Optimisations réseau et infrastructure

### 1. Version du protocole HTTP : passez à HTTP/2 sans hésiter

[Prérequis]

- **Support HTTPS requis** : c'est essentiel ! Presque tous les navigateurs modernes ne prennent en charge HTTP/2 que sur des connexions HTTPS, donc vous devez configurer un certificat SSL au préalable.
- **Serveur compatible** : il vous faut un logiciel serveur compatible HTTP/2, par exemple Nginx 1.9.5+ ou Apache 2.4.17+.
- **Version TLS** : utilisez TLS 1.2 ou supérieur (idéalement TLS 1.3) ; les anciennes versions de SSL ne supportent pas HTTP/2.

[Astuce]

Le protocole HTTP/1.1 traditionnel est limité dans la gestion de plusieurs requêtes : en général, il ne traite que 6 à 8 connexions en parallèle, comme une file d'attente, ce qui peut générer du retard.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 utilise le « multiplexage » et peut traiter plusieurs requêtes en même temps, accélérant fortement le chargement des ressources ; HTTP/3 est encore plus performant sur des réseaux instables.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

[Recommandation]

- Vérifiez que votre serveur web a bien activé HTTP/2 ; la plupart des serveurs (Nginx, Caddy, etc.) sont faciles à configurer.
- Sous Nginx, il suffit d'ajouter `http2` après la directive listen :

```nginx
listen 443 ssl http2;
```

[Vérification]

Dans le panneau développeur du navigateur, ouvrez « Réseau », faites un clic droit et cochez « Protocole » : vous verrez la version du protocole utilisée pour la connexion :
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

D'après nos tests, le gain global est d'environ 10 % ; il est plus marqué quand le système comporte beaucoup de blocs et de ressources.

### 2. Bande passante : plus c'est large, mieux c'est, et facturez à la consommation

[Astuce]

Comme une autoroute par rapport à une route ordinaire, la bande passante détermine l'efficacité du transfert de données. Lors du premier chargement de NocoBase, beaucoup de ressources frontend sont téléchargées : si la bande passante est insuffisante, c'est rapidement le goulet d'étranglement.

[Recommandation]

- Choisissez une bande passante suffisante (avec beaucoup d'utilisateurs, 50 Mbit/s ou plus est conseillé), n'économisez pas sur ce poste clé.
- Privilégiez la facturation « à la consommation » : de nombreux fournisseurs cloud proposent ce mode, qui vous offre plus de bande passante en heures de pointe et limite le coût en heures creuses.

### 3. Latence réseau et localisation du serveur : plus c'est près, plus c'est rapide

[Astuce]

La latence, c'est le temps d'attente du transfert de données. Même avec une bande passante suffisante, si le serveur est trop loin de l'utilisateur (utilisateur en Chine, serveur aux États-Unis), chaque requête est ralentie par la distance.

[Recommandation]

- Déployez NocoBase au plus près de vos utilisateurs principaux.
- Si vos utilisateurs sont mondiaux, envisagez un service d'accélération mondiale (par exemple Alibaba Cloud Global Accelerator ou AWS Global Accelerator) pour optimiser le routage et réduire la latence.

[Vérification]

Avec la commande ping, mesurez la latence vers les serveurs des différentes régions.
C'est l'optimisation la plus visible : selon les régions, la vitesse d'accès peut être multipliée par 1 à 3 ou plus.
12 fuseaux horaires de distance, 13 secondes :
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

2 fuseaux horaires de distance, 8 secondes :
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Même région, environ 3 secondes :
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Optimisations de l'architecture de déploiement

### 4. Déploiement serveur et reverse proxy : choisissez l'architecture adaptée

[Prérequis]

- **Permissions serveur** : il vous faut les droits root ou sudo pour configurer Nginx et autres services.
- **Compétences de base** : un peu de configuration serveur est nécessaire, mais pas d'inquiétude, vous trouverez ici des exemples concrets.
- **Accès aux ports** : vérifiez que le pare-feu autorise les ports 80 (HTTP) et 443 (HTTPS).

[Astuce]

Quand un utilisateur accède à NocoBase, la requête arrive directement sur votre serveur. Un déploiement adapté permet à votre serveur de gérer les requêtes plus efficacement, et donc de répondre plus vite.

[Différentes options et conseils]

**Démarrer NocoBase sans reverse proxy pour les ressources statiques (non recommandé) :**

- Inconvénients : c'est simple, mais peu performant en cas de fortes charges ou pour servir des fichiers statiques ; à réserver au développement et aux tests ;
- Conseil : à éviter autant que possible.

> Voir « [Documentation d'installation](https://v2.docs.nocobase.com/cn/get-started/quickstart) »

Sans reverse proxy, le chargement de la page d'accueil est d'environ 6,1 secondes
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Utiliser Nginx / Caddy comme reverse proxy (très recommandé) :**

- Avantages : un reverse proxy gère efficacement les connexions concurrentes, sert les fichiers statiques, équilibre la charge, et configure facilement HTTP/2 ;
- Conseil : en production, après le déploiement de l'application (sources / create-nocobase-app / image Docker), utilisez Nginx ou Caddy en reverse proxy.

> Voir « [Documentation de déploiement](https://v2.docs.nocobase.com/cn/get-started/deployment/production) »

Avec Nginx en proxy, le chargement de la page d'accueil est d'environ 3 à 4 secondes
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Déploiement en cluster avec équilibrage de charge (pour les scénarios à forte concurrence et haute disponibilité) :**

- Avantages : en déployant plusieurs instances pour traiter les requêtes, vous améliorez sensiblement la stabilité et la capacité de concurrence ;
- Pour le déploiement, voir le **[mode cluster](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. Utiliser un CDN pour accélérer les ressources statiques

[Prérequis]

- **Nom de domaine** : vous devez disposer d'un nom de domaine enregistré et pouvoir gérer ses paramètres DNS.
- **Certificat SSL** : la plupart des CDN nécessitent un certificat SSL (vous pouvez utiliser Let's Encrypt gratuitement).
- **Choix du service** : choisissez un fournisseur CDN adapté à la zone de vos utilisateurs (en Chine continentale, optez pour un CDN avec dépôt ICP).

[Astuce]

Un CDN (réseau de distribution de contenu) met en cache vos ressources statiques sur des nœuds répartis dans le monde entier ; les utilisateurs récupèrent ces ressources sur le nœud le plus proche, comme on irait chercher de l'eau au puits voisin, ce qui réduit fortement la latence de chargement.

L'autre grand avantage du CDN, c'est qu'il **réduit considérablement la charge et la pression sur la bande passante de votre serveur applicatif**. Quand de nombreux utilisateurs accèdent simultanément à NocoBase sans CDN, toutes les requêtes pour les ressources statiques (JavaScript, CSS, images, etc.) tombent directement sur votre serveur, ce qui peut saturer la bande passante, dégrader les performances, voire provoquer une panne. En passant par un CDN, votre serveur peut se concentrer sur la logique métier principale, pour offrir une expérience plus stable.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

[Recommandation] • Configurez votre serveur pour distribuer les ressources statiques via le CDN. • Choisissez un fournisseur adapté à la zone de vos utilisateurs :

- Utilisateurs mondiaux : Cloudflare, Akamai, AWS CloudFront ;
- Utilisateurs en Chine continentale : Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration. Exemple de configuration :

```nginx
# Rediriger les ressources statiques vers le domaine CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Pour les petits projets, l'offre gratuite Cloudflare offre déjà une bonne accélération CDN :

1. Créez un compte Cloudflare et ajoutez-y votre domaine ;
2. Modifiez les DNS pour pointer le domaine vers les serveurs Cloudflare ;
3. Réglez le niveau de cache approprié dans le panneau de contrôle.

**Note importante** : même si tous vos utilisateurs sont dans la même région, l'utilisation d'un CDN reste très recommandée, car elle réduit la charge serveur et améliore la stabilité, surtout en cas de fort trafic.

## III. Optimisations des ressources statiques

### 6. Compression et cache côté serveur

[Prérequis]

- **Ressources CPU** : la compression sollicite davantage le CPU ; votre serveur doit avoir suffisamment de puissance.
- **Modules Nginx** : la compression Gzip est généralement intégrée, mais Brotli peut nécessiter un module additionnel.
- **Permissions** : vous devez pouvoir modifier la configuration du serveur.

[Astuce]

Activer la compression et configurer correctement le cache permet de réduire fortement le volume transmis et le nombre de requêtes répétées, comme une « cure d'amincissement » pour vos ressources, qui accélère le chargement.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

[Recommandation]

- Solution la plus simple : utilisez le service CDN gratuit Cloudflare, qui active automatiquement la compression Gzip.
- Activez la compression Gzip ou Brotli, par exemple sous Nginx :

```nginx
# Activer la compression Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Si Brotli est disponible, vous pouvez l'activer pour une compression encore plus efficace
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• Définissez des en-têtes de cache adaptés sur les ressources statiques pour réduire les chargements répétés :

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Utiliser SSL/TLS et optimiser les performances

[Prérequis]

- **Certificat SSL** : il vous faut un certificat SSL valide (vous pouvez utiliser Let's Encrypt gratuitement).
- **Permissions de configuration** : vous devez pouvoir modifier la configuration SSL.
- **Configuration DNS** : configurez un résolveur DNS fiable pour OCSP Stapling.

[Astuce]

La sécurité passe avant tout, mais une mauvaise configuration HTTPS peut ajouter de la latence. Voici quelques astuces pour rester à la fois sécurisé et performant.

[Recommandation]

- Utilisez TLS 1.3, la version la plus rapide actuellement. Configuration Nginx :

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Activez OCSP Stapling pour réduire le temps de validation du certificat :

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Mettez en place la réutilisation de session pour éviter des handshakes répétés :

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

[Optimisation en contexte international]
**Note** : voici les effets de l'optimisation dans un scénario international / 12 fuseaux horaires de distance, à différencier du contexte local évoqué plus haut (environ 3 secondes). La latence réseau due à la distance est inévitable, mais l'optimisation peut quand même améliorer significativement la vitesse :

Avec Http2 + cache CDN + compression Gzip + compression Brotli combinés :
Avant optimisation (accès international), 13 secondes :
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Après optimisation (accès international), 8 secondes :
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Cet exemple montre que même très éloigné géographiquement, on peut réduire le temps de chargement d'environ 40 % avec les bonnes optimisations, ce qui améliore nettement l'expérience utilisateur.

## IV. Surveillance et diagnostic

### 8. Suivi de performances et analyse de base

[Prérequis]

- **Accessibilité** : votre site doit être accessible publiquement pour utiliser la plupart des outils de test en ligne.
- **Compétences de base** : vous devez comprendre la signification des indicateurs de performance ; nous expliquerons les principaux.

[Astuce]

Sans savoir où se situe le goulet d'étranglement, il est difficile d'optimiser précisément. Nous vous suggérons d'utiliser des outils gratuits pour surveiller la performance du site et identifier les problèmes.

[Recommandation]

**Utilisez les outils gratuits suivants pour vérifier la performance du site :**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Surveillez les indicateurs clés suivants :**

- Temps de chargement de la page
- Temps de réponse du serveur
- Temps de résolution DNS
- Temps de handshake SSL

**Réponses aux problèmes courants :**

- Résolution DNS lente ? Envisagez de changer de service DNS ou d'activer le DNS prefetch.
- Handshake SSL lent ? Optimisez la configuration SSL et activez la réutilisation de session.
- Réponse serveur lente ? Vérifiez les ressources serveur et envisagez une montée en gamme si nécessaire.
- Ressources statiques lentes ? Mettez en place un CDN et ajustez la stratégie de cache.

## Liste de contrôle pour optimiser le déploiement

Cette liste vous aide à vérifier et optimiser rapidement le déploiement de NocoBase :

1. **Vérification de la version HTTP**

   - [ ]  HTTPS activé (prérequis pour HTTP/2)
   - [ ]  HTTP/2 activé
   - [ ]  Si possible, prise en charge de HTTP/3
2. **Évaluation de la bande passante**

   - [ ]  Bande passante suffisante (au moins 10 Mbit/s, idéalement 50 Mbit/s ou plus)
   - [ ]  Possibilité de facturation à la consommation plutôt qu'en bande passante fixe
3. **Choix de l'emplacement du serveur**

   - [ ]  Serveur situé près de la zone des utilisateurs
   - [ ]  Pour des utilisateurs mondiaux, envisager un service d'accélération mondiale
4. **Architecture de déploiement**

   - [ ]  Utiliser Nginx/Caddy en reverse proxy, en séparant ressources statiques et API
   - [ ]  Si nécessaire, mettre en place plusieurs instances et de l'équilibrage de charge
5. **Mise en place du CDN**

   - [ ]  Distribuer les ressources statiques via un CDN
   - [ ]  Configurer une stratégie de cache adaptée
   - [ ]  Vérifier que le CDN supporte HTTP/2 ou HTTP/3
6. **Compression et cache**

   - [ ]  Activer la compression Gzip ou Brotli
   - [ ]  Configurer des en-têtes de cache navigateur appropriés
7. **Optimisation SSL/TLS**

   - [ ]  Utiliser TLS 1.3 pour accélérer le handshake
   - [ ]  Activer OCSP Stapling
   - [ ]  Configurer la réutilisation de session SSL
8. **Surveillance des performances**

   - [ ]  Évaluer régulièrement le site avec des outils de test
   - [ ]  Surveiller les indicateurs clés (chargement, réponse, résolution, handshake)
   - [ ]  Optimiser en fonction des problèmes détectés

## Questions fréquentes

[Q] Mon serveur est déployé à l'étranger, et les utilisateurs en Chine ont un accès lent ; que faire ?

[R] Le mieux est de redéployer sur un serveur cloud situé en Chine. Si ce n'est vraiment pas possible :

1. Utilisez un CDN national pour accélérer les ressources statiques ;
2. Utilisez un service d'accélération mondiale pour optimiser le routage ;
3. Activez autant que possible toutes les options de compression et de cache.

[Q] Pourquoi mon premier chargement de NocoBase est-il lent, alors qu'ensuite c'est rapide ?

[R] Un premier chargement plus lent est normal : il faut télécharger beaucoup de ressources. Sur notre démo officielle, le premier chargement prend environ 3 secondes.

Ensuite, saisir l'URL et entrer dans l'application prend 1 à 2 secondes, et les changements de page dans l'application 50 à 300 millisecondes : la latence est faible.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Si le temps de chargement reste long, vous pouvez encore l'améliorer :

1. Vérifiez que HTTP/2 est activé ;
2. Mettez en place un CDN ;
3. Activez la compression Gzip / Brotli ;
4. Vérifiez que la bande passante du serveur est suffisante.

[Q] J'utilise un hébergement mutualisé et je ne peux pas modifier la configuration Nginx ; que faire ?

[R] Dans ce cas, les options sont limitées, mais nous vous suggérons :

1. D'utiliser un service CDN (Cloudflare par exemple) ;
2. D'optimiser les paramètres ajustables au sein de l'application ;
3. Si possible, de passer à un VPS qui permet plus de personnalisation.

---

Avec ces stratégies simples et efficaces, vous pouvez sensiblement améliorer la vitesse d'accès à NocoBase et offrir une expérience plus fluide. La plupart de ces optimisations peuvent être mises en place en quelques heures, sans modifier le code, pour des résultats visibles très rapidement.
