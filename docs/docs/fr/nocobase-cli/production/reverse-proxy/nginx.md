#Nginx

Si vous avez utilisé Nginx pour gérer le site sur le serveur, ou si vous devez gérer les certificats, les caches et le contrôle d'accès ultérieurement, alors `nb proxy nginx` est le chemin recommandé par défaut.

Si vous souhaitez simplement configurer HTTPS dès que possible et ne souhaitez pas conserver vous-même trop de détails de proxy, alors [Caddy](./caddy.md) sera plus serein. Mais tant que vous utilisez Nginx, ce document est le chemin par défaut.

## Quand est-il plus approprié d'utiliser Nginx ?

De manière générale, les situations suivantes donnent la priorité à la poursuite de l'utilisation de Nginx :

- Vous avez utilisé Nginx pour gérer plusieurs sites sur le serveur.
- Vous devrez gérer vous-même les certificats, les caches, les contrôles d'accès ou d'autres règles personnalisées plus tard
- Vous souhaitez que la couche d'entrée continue à utiliser la méthode d'exploitation et de maintenance Nginx existante

Si votre objectif est simplement de faire passer HTTPS le plus rapidement possible et que vous ne souhaitez pas conserver vous-même trop de détails TLS, alors [Caddy](./caddy.md) sera plus serein.

## Suivez d'abord ces trois commandes.

Si vous souhaitez simplement exécuter la couche d'entrée Nginx en premier, il suffit de retenir ces trois commandes par défaut :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Si Nginx a été installé localement, remplacez simplement la première entrée par `nb proxy nginx use local`.

Dans la plupart des scénarios, il suffit d'exécuter d'abord `use`, puis `generate` et enfin `reload`. Pour d'autres détails et plus de commandes, consultez les chapitres suivants ou la référence CLI.

## Étape 1 : Sélectionnez d'abord comment exécuter Nginx vous-même

Si Nginx est déjà installé sur la machine actuelle, utilisez simplement `use local`.

Si vous souhaitez utiliser la version Docker de Nginx, utilisez `use docker`.

Le `local` / `docker` fait ici référence au mode d'exécution de **Nginx lui-même**.

Utilisation de la version Docker de Nginx :

```bash
nb proxy nginx use docker
```

Utilisation d'un Nginx installé localement :

```bash
nb proxy nginx use local
```

Si vous oubliez ultérieurement quelle méthode est actuellement sélectionnée, vous pouvez exécuter :

```bash
nb proxy nginx current
```

## Étape 2 : Exécuter `generate`

`generate` est utilisé pour générer la configuration d'entrée Nginx en fonction de l'environnement spécifié. La façon la plus courante de l'écrire est la suivante :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Si vous souhaitez également spécifier le port d'entrée, vous pouvez également l'écrire ensemble :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

La signification des paramètres ici est :

- `--env` : spécifiez pour quel environnement CLI générer la configuration.
- `--host` : Spécifiez le nom de domaine pour l'accès externe
- `--port` : Spécifie le port d'entrée du proxy, pas le `appPort` de l'application NocoBase elle-même

Le port d'application en amont provient du `appPort` enregistré par cet environnement. Si la commande indique qu'il manque `appPort` à env, exécutez :

```bash
nb env update test2 --app-port 56575
```

Si vous modifiez ultérieurement des configurations telles que `app-port` et `app-public-path` qui affecteront les résultats du proxy, n'oubliez pas de réexécuter `generate`.

## Étape 3 : Exécuter `reload`

Après avoir généré la configuration, exécutez directement :

```bash
nb proxy nginx reload
```

Dans la plupart des scénarios, utilisez simplement cette commande directement. S'il n'est pas encore en cours d'exécution, le démarrage sera d'abord traité en interne ; s'il est déjà en cours d'exécution, il sera rechargé selon la dernière configuration.

## Quels fichiers la CLI conservera-t-elle ?

En prenant `test2` comme exemple, les commandes liées à Nginx conservent généralement ces fichiers et répertoires :

| chemin | fonction |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Répertoire d'extraits partagés Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Configuration d'entrée de site modifiable |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Page de secours du SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Page de secours v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Répertoire de produits de build front-end actuellement utilisé |
| `NB_CLI_ROOT/test2/storage/uploads` | Le répertoire de téléchargement de l'application actuelle |

dans:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Les fichiers suivants sont des fichiers auxiliaires d'agent gérés par CLI
- `NB_CLI_ROOT/test2/storage/...` Voici les ressources statiques et les répertoires de téléchargement de l'application.
- `app.conf` peut être modifié, mais le bloc géré NocoBase doit être conservé
- `index-v1.html` et `index-v2.html` réécriront automatiquement les adresses de ressources en fonction du sous-chemin d'environnement actuel, de la version active du client et de `CDN_BASE_URL`

:::avertissement

Si vous souhaitez ajouter une configuration Nginx au niveau du site, telle qu'une limitation de courant, des en-têtes supplémentaires et un contrôle d'accès, modifiez simplement `app.conf`. Les fichiers auxiliaires gérés par la CLI sont mis à jour de manière synchrone lors des reconstructions ultérieures.

:::

## Configuration manuscrite : que faire sans CLI

Si votre application n'est pas hébergée par CLI ou si vous souhaitez explicitement conserver vous-même la configuration complète de Nginx, vous pouvez également l'écrire à la main.

Cependant, pour NocoBase, le proxy inverse de production est généralement plus qu'un simple `proxy_pass`. En plus de transmettre les requêtes API à l'application backend, une configuration complète et utilisable doit généralement gérer le répertoire de téléversement, les ressources statiques frontales, la route d'accès aux fichiers `/files/`, WebSocket, la route `.well-known` et les pages de secours de la SPA.

En prenant `test2` comme exemple, les fichiers et répertoires clés liés à Nginx incluent généralement :

- Extraits Nginx : `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Configuration d'entrée modifiable : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Page de secours SPA (v1) : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Page de secours SPA (v2) : `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Répertoire de produits de build front-end : `NB_CLI_ROOT/test2/storage/dist-client`
- Répertoire de téléchargement : `NB_CLI_ROOT/test2/storage/uploads`

En d’autres termes, la configuration manuscrite doit généralement couvrir au moins les types d’entrées suivants :

- `uploads` : exposez le répertoire de téléchargement via `alias`
- `dist` : exposez le répertoire du produit de build frontal via `alias`
- `well-known` : gérer les chemins de découverte liés à OAuth/OpenID
- `files` : transmettre les requêtes d'accès aux fichiers sous `/files/` à l'application backend
- `api` : transmettre la requête `/api/` à l'application backend
- `ws` : transmettre les requêtes WebSocket à l'application backend
- `spa` : fournit une entrée frontale et une solution de repli `try_files` pour `/` et `/v/`

Par conséquent, une configuration Nginx complète ne se limite généralement pas à la méthode générale d’écriture de proxy inverse suivante :

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Pour une application hébergée par CLI comme `test2`, une structure plus proche d'un déploiement réel ressemblerait généralement à ceci :

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

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /files/ {
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

Il y a deux points clés ici :

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Les fichiers suivants sont des fichiers auxiliaires d'agent gérés par CLI
- `NB_CLI_ROOT/test2/storage/...` Ce qui suit consiste à utiliser votre propre répertoire de produits et votre répertoire de téléchargement

Si votre application utilise un déploiement de sous-chemin ou si les ressources frontales, le répertoire de téléchargement et le proxy inverse ne se trouvent pas dans la même perspective de chemin, la configuration manuscrite sera plus sujette aux erreurs. Dans ce scénario, il est généralement plus recommandé d'exécuter :

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Effectuez ensuite des ajustements en fonction des résultats générés.

Une approche plus prudente est généralement la suivante :

1. Laissez d'abord la CLI générer la configuration Nginx
2. Confirmez la structure de routage et le chemin réel en fonction des résultats générés.
3. Effectuez ensuite des ajustements manuels en fonction de votre nom de domaine, de votre mode d'exécution et du chemin de montage.

Il est généralement moins probable de manquer des détails liés à `/files/`, aux WebSockets, aux ressources statiques, aux répertoires de téléversement ou aux pages de secours de la SPA que d'écrire une configuration à partir de zéro.

:::warning Attention

`/files/` est une route applicative qui doit passer par l'autorisation NocoBase. Ne la traitez pas comme un répertoire statique et ne la laissez pas atteindre le fallback de la SPA. Transmettez-la au backend NocoBase et placez la règle avant `location /` et les autres règles de fallback du front-end.

Si `APP_PUBLIC_PATH=/nocobase/` est configuré, transmettez également `/nocobase/files/`. Conservez la règle `/files/` à la racine pour assurer la compatibilité avec les URL de fichiers existantes.

:::

## Comment gérer HTTPS

Si vous avez décidé de continuer à utiliser Nginx, HTTPS peut également continuer à être configuré dans Nginx. Une pratique courante consiste à étendre `listen 80` en `80/443` à double entrée, puis à ajouter le chemin du certificat et la configuration TLS.

Cependant, si vous souhaitez simplement obtenir le HTTPS disponible le plus rapidement possible et que vous ne souhaitez pas gérer vous-même la demande et le renouvellement du certificat, il sera alors plus simple d'utiliser directement [Caddy](./caddy.md).

## Instructions communes

- `nb proxy nginx generate` est destiné aux applications installées par `nb init`
- Si vous modifiez par la suite des configurations telles que `app-port` et `app-public-path` qui affecteront les résultats du proxy, pensez à réexécuter `generate`

## Liens connexes

- [Proxy inverse de l'environnement de production](./index.md)
- [Caddy](./caddy.md)
- [Installer à l'aide de CLI (recommandé)](../../installation/cli.md)
- [Configuration de l'application avec `.env`](../../installation/env.md)
- [Référence de commande `nb proxy nginx`](../../../api/cli/proxy/nginx/index.md)
