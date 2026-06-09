---
title: "Nginx"
description: "Utilisez nb proxy nginx pour générer et gérer la configuration de reverse proxy Nginx des env NocoBase gérés par la CLI."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

Si vous utilisez déjà Nginx sur le serveur pour gérer des sites, ou si vous voulez continuer à gérer vous-même les certificats, le cache et le contrôle d'accès, `nb proxy nginx` est la voie recommandée.

Si votre objectif est simplement d'activer HTTPS le plus vite possible, sans maintenir trop de détails de proxy, [Caddy](./caddy.md) est souvent plus simple. Mais si Nginx fait déjà partie de votre environnement serveur, cette page est la voie par défaut.

## Quand Nginx est le meilleur choix

En pratique, Nginx convient généralement mieux quand :

- vous utilisez déjà Nginx pour gérer plusieurs sites sur le même serveur
- vous devez encore maintenir vous-même les certificats, le cache, le contrôle d'accès ou d'autres règles personnalisées
- vous voulez garder une couche d'entrée alignée avec votre flux d'exploitation Nginx existant

Si votre seul objectif est de mettre HTTPS en ligne rapidement avec moins de travail côté TLS, [Caddy](./caddy.md) est souvent la voie la plus simple.

## Ordre recommandé : choisir un driver, générer la configuration, puis démarrer

Pour un env géré par la CLI de type `local` ou `docker`, l'ordre conseillé est :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Ou avec un processus local :

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Les commandes de suivi les plus courantes sont :

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

Dans la plupart des cas :

- `current` est le moyen le plus rapide de confirmer le driver d'exécution actif
- `status` indique si Nginx fonctionne actuellement normalement
- `info` affiche le chemin de configuration actuel, la racine d'exécution et les détails associés
- après avoir régénéré la configuration, `reload` est généralement la première commande à utiliser
- utilisez `restart` lorsque vous avez besoin d'un redémarrage complet

## Ce que `generate` attend en entrée

La forme la plus courante est :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Si vous voulez aussi préciser le port d'entrée :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Où :

- `--env` : l'env CLI pour lequel générer la configuration
- `--host` : le nom de domaine public
- `--port` : le port d'entrée du proxy, et non le `appPort` de l'application

Le port de l'application amont provient du `appPort` enregistré dans cet env. Si la commande indique que l'env ne contient pas `appPort`, enregistrez-le d'abord avec :

```bash
nb env update test2 --app-port 56575
```

Si vous modifiez ensuite des réglages comme `app-port` ou `app-public-path` qui influencent le comportement du proxy, relancez `generate`.

## Fichiers maintenus par la CLI

En prenant `test2` comme exemple, le flux Nginx maintient généralement :

| Chemin | Rôle |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Répertoire partagé des snippets Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Configuration d'entrée du site, modifiable |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Page de repli SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Page de repli SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Sortie de build frontend de l'application actuelle |
| `NB_CLI_ROOT/test2/storage/uploads` | Répertoire des uploads de l'application actuelle |

Où :

- les fichiers sous `NB_CLI_ROOT/.nocobase/proxy/nginx/...` sont des fichiers d'assistance de proxy gérés par la CLI
- les fichiers sous `NB_CLI_ROOT/test2/storage/...` appartiennent à l'application elle-même
- `app.conf` peut être modifié, mais le bloc géré par NocoBase doit rester intact
- `index-v1.html` et `index-v2.html` sont réécrits selon le sous-chemin de l'env, la version de client active et `CDN_BASE_URL`

:::warning Note

Si vous avez besoin d'une configuration Nginx au niveau du site, comme la limitation de débit, des en-têtes supplémentaires ou un contrôle d'accès, modifiez `app.conf`. Les fichiers d'assistance gérés par la CLI sont remis à jour quand vous régénérez la configuration.

:::

## Configuration manuelle : quand vous n'utilisez pas la CLI

Si l'application n'est pas gérée par la CLI, ou si vous voulez volontairement maintenir toute la configuration Nginx vous-même, vous pouvez bien sûr l'écrire à la main.

Pour NocoBase, un reverse proxy de production est généralement plus qu'un simple `proxy_pass`. En plus de transférer les requêtes API vers l'application backend, une configuration complète doit généralement gérer ensemble les uploads, les ressources frontend, WebSocket, les routes `.well-known` et les pages de repli SPA.

En prenant `test2` comme exemple, voici les fichiers et répertoires Nginx les plus importants :

- Snippets Nginx : `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Configuration d'entrée modifiable : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Page de repli SPA pour v1 : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Page de repli SPA pour v2 : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Sortie de build frontend : `NB_CLI_ROOT/test2/storage/dist-client`
- Répertoire des uploads : `NB_CLI_ROOT/test2/storage/uploads`

Autrement dit, une configuration manuelle doit généralement couvrir au moins ces zones :

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Une configuration Nginx complète dépasse donc généralement un exemple générique comme celui-ci :

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Pour une application gérée par la CLI comme `test2`, une structure de déploiement plus réaliste ressemble plutôt à ceci :

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Deux points sont particulièrement importants ici :

- les fichiers sous `NB_CLI_ROOT/.nocobase/proxy/nginx/...` sont des fichiers d'assistance gérés par la CLI
- les fichiers sous `NB_CLI_ROOT/test2/storage/...` correspondent à la sortie de build et aux uploads propres à l'application

Si l'application utilise un déploiement en sous-chemin, ou si les ressources frontend, les uploads et le reverse proxy ne partagent pas la même vue des chemins, une configuration manuelle devient plus facile à rater. Dans ce cas, il est généralement plus sûr de générer d'abord la configuration avec :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Puis d'utiliser le résultat généré comme base pour les ajustements manuels.
