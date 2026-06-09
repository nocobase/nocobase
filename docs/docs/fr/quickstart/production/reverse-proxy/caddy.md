---
title: "Caddy"
description: "Utilisez nb proxy caddy pour générer et gérer la configuration de reverse proxy Caddy des env NocoBase gérés par la CLI."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

Si vous avez déjà un nom de domaine et que vous voulez activer HTTPS rapidement, `nb proxy caddy` est généralement le chemin le plus simple.

Par rapport au fait de maintenir vous-même la configuration des certificats dans Nginx, Caddy ressemble davantage à un raccourci par défaut pour mettre rapidement la couche d'entrée en ligne.

## Quand Caddy est le meilleur choix

En pratique, Caddy convient généralement mieux quand :

- vous avez déjà un nom de domaine et souhaitez mettre HTTPS en ligne rapidement
- vous ne voulez pas gérer vous-même trop de détails liés aux certificats et à TLS
- vous cherchez surtout une couche d'entrée simple et stable

Si vous utilisez déjà Nginx pour gérer de nombreux sites sur le même serveur, ou si vous avez encore besoin d'un cache plus poussé, de contrôles d'accès ou de règles personnalisées, [Nginx](./nginx.md) est généralement plus adapté.

## Ordre recommandé : choisir un driver, générer la configuration, puis démarrer

Pour un env géré par la CLI de type `local` ou `docker`, l'ordre conseillé est :

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Ou avec un processus local :

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Les commandes de suivi les plus courantes sont :

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

Dans la plupart des cas :

- `current` est le moyen le plus rapide de confirmer le driver d'exécution actif
- `status` indique si Caddy fonctionne actuellement normalement
- `info` affiche le chemin de configuration actuel, la racine d'exécution et les détails associés
- après avoir régénéré la configuration, `reload` est généralement la première commande à utiliser
- utilisez `restart` lorsque vous avez besoin d'un redémarrage complet

## Ce que `generate` attend en entrée

La forme la plus courante est :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Si vous voulez aussi préciser le port d'entrée :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Où :

- `--env` : l'env CLI pour lequel générer la configuration
- `--host` : le nom de domaine public
- `--port` : le port d'entrée du proxy

Pour Caddy, `--host` est particulièrement important, car l'adresse du site influence fortement le flux HTTPS. En production, il est généralement préférable de fournir un domaine déjà résolu vers le serveur courant.

Si la commande indique que l'env ne contient pas `appPort`, enregistrez-le d'abord avec :

```bash
nb env update test2 --app-port 56575
```

Si vous modifiez ensuite des réglages comme `app-port` ou `app-public-path` qui influencent le comportement du proxy, relancez `generate`.

## Fichiers maintenus par la CLI

En prenant `test2` comme exemple, le flux Caddy maintient généralement :

| Chemin | Rôle |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Configuration complète du site générée par la CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Fichier d'entrée Caddy au niveau du provider, qui importe tous les `app.caddy` des env |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Page de repli SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Page de repli SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Sortie de build frontend de l'application actuelle |
| `NB_CLI_ROOT/test2/storage/uploads` | Répertoire des uploads de l'application actuelle |

Où :

- les fichiers sous `NB_CLI_ROOT/.nocobase/proxy/caddy/...` sont des fichiers d'assistance de proxy gérés par la CLI
- les fichiers sous `NB_CLI_ROOT/test2/storage/...` appartiennent à l'application elle-même
- `nocobase.caddy` est le fichier d'entrée au niveau du provider et n'a généralement pas besoin d'être modifié manuellement
- `app.caddy` est la configuration complète du site pour un env, et il est entièrement écrasé quand vous le régénérez

:::warning Note

Si vous avez besoin d'une configuration Caddy au niveau du site, comme des en-têtes supplémentaires, de l'authentification, de la limitation de débit ou des politiques de compression, vous pouvez utiliser `app.caddy` comme base. Gardez simplement en tête qu'un nouveau `generate` écrasera ce fichier.

:::

## Configuration manuelle : quand vous n'utilisez pas la CLI

Si l'application n'est pas gérée par la CLI, ou si vous souhaitez volontairement maintenir toute la configuration Caddy vous-même, vous pouvez bien sûr l'écrire à la main.

Pour NocoBase, une entrée de production est généralement plus qu'un simple `reverse_proxy`. En plus de transférer les requêtes API vers l'application backend, une configuration Caddy complète doit généralement gérer ensemble les uploads, les ressources frontend, les routes `.well-known`, WebSocket et les pages de repli SPA.

En prenant `test2` comme exemple, les chemins Caddy les plus importants incluent généralement :

- Répertoire des pages de repli SPA : `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Sortie de build frontend : `NB_CLI_ROOT/test2/storage/dist-client`
- Répertoire des uploads : `NB_CLI_ROOT/test2/storage/uploads`

Autrement dit, une configuration manuelle doit généralement couvrir au moins ces zones :

- `v` : rediriger `/v` vers `/v/`
- `uploads` : exposer le répertoire des uploads
- `dist` : exposer la sortie de build frontend
- `oauth well-known` : gérer le chemin de découverte OAuth
- `openid well-known` : gérer le chemin de découverte OpenID
- `api` : transférer les requêtes `/api/` vers l'application backend
- `ws` : transférer les requêtes WebSocket vers l'application backend
- `spa v2` : servir `/v/` avec l'entrée v2 et la page de repli
- `spa v1` : servir `/` avec l'entrée v1 et la page de repli

Une configuration Caddy complète dépasse donc généralement un exemple générique comme celui-ci :

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Pour une application gérée par la CLI comme `test2`, une structure de déploiement plus réaliste ressemble plutôt à ceci :

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Deux points sont particulièrement importants ici :

- les fichiers sous `NB_CLI_ROOT/.nocobase/proxy/caddy/...` sont des fichiers de repli SPA gérés par la CLI
- les fichiers sous `NB_CLI_ROOT/test2/storage/...` correspondent à la sortie de build et aux uploads propres à l'application

Si l'application utilise un déploiement en sous-chemin, ou si les ressources frontend, les uploads et la couche d'entrée ne partagent pas la même vue des chemins, une configuration manuelle devient plus facile à rater. Dans ce cas, il est généralement plus sûr de générer d'abord la configuration avec :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Puis d'utiliser le résultat généré comme base pour les ajustements manuels.
