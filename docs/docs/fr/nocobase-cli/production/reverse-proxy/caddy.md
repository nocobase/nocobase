#Caddie

Si vous possédez déjà un nom de domaine et souhaitez configurer HTTPS dès que possible, alors `nb proxy caddy` est généralement la méthode de saisie la plus simple.

Plutôt que de gérer vous-même la configuration du certificat de Nginx, Caddy ressemble davantage au raccourci par défaut pour « parcourir d'abord la couche d'entrée ».

## Quand est-il plus approprié d'utiliser Caddy ?

De manière générale, Caddy est prioritaire dans les situations suivantes :

- Vous possédez déjà un nom de domaine et souhaitez accéder au HTTPS au plus vite
- Vous ne souhaitez pas conserver vous-même trop de détails sur les certificats et les TLS
- Tout ce dont vous avez besoin est une couche d'entrée simple et stable

Si vous avez déjà utilisé Nginx pour gérer de nombreux sites sur le serveur, ou si vous devez ultérieurement appliquer des règles de mise en cache, de contrôle d'accès et de personnalisation plus lourdes, il sera alors plus simple de continuer à regarder [Nginx](./nginx.md).

## Suivez d'abord ces trois commandes.

Si vous souhaitez simplement exécuter la couche d'entrée Caddy en premier, il suffit de retenir ces trois commandes par défaut :

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Si Caddy a été installé localement, remplacez simplement la première entrée par `nb proxy caddy use local`.

Dans la plupart des scénarios, il suffit d'exécuter d'abord `use`, puis `generate` et enfin `reload`. Pour d'autres détails et plus de commandes, consultez les chapitres suivants ou la référence CLI.

## Étape 1 : Choisissez comment exécuter Caddy vous-même

Si Caddy est déjà installé sur la machine actuelle, utilisez simplement `use local`.

Si vous souhaitez utiliser la version Docker de Caddy, utilisez `use docker`.

Le `local` / `docker` fait ici référence à la façon dont **Caddy lui-même fonctionne**.

Utilisation de la version Docker de Caddy :

```bash
nb proxy caddy use docker
```

Utilisation d'une installation locale de Caddy :

```bash
nb proxy caddy use local
```

Si vous oubliez ultérieurement quelle méthode est actuellement sélectionnée, vous pouvez exécuter :

```bash
nb proxy caddy current
```

## Étape 2 : Exécuter `generate`

`generate` est utilisé pour générer la configuration de Caddy en fonction de l'environnement spécifié. La façon la plus courante de l'écrire est la suivante :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Si vous souhaitez également spécifier le port d'entrée, vous pouvez également l'écrire ensemble :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

La signification des paramètres ici est :

- `--env` : spécifiez pour quel environnement CLI générer la configuration.
- `--host` : Spécifiez le nom de domaine pour l'accès externe
- `--port` : Spécifiez le port d'entrée du proxy

Pour Caddy, `--host` est particulièrement important. Dans un environnement formel, essayez de transmettre par défaut un nom de domaine résolu au serveur actuel, afin que l'accès HTTPS soit plus naturel.

Si la commande indique qu'il manque `appPort` à env, exécutez d'abord :

```bash
nb env update test2 --app-port 56575
```

Si vous modifiez ultérieurement des configurations telles que `app-port` et `app-public-path` qui affecteront les résultats du proxy, n'oubliez pas de réexécuter `generate`.

## Étape 3 : Exécuter `reload`

Après avoir généré la configuration, exécutez directement :

```bash
nb proxy caddy reload
```

Dans la plupart des scénarios, utilisez simplement cette commande directement. S'il n'est pas encore en cours d'exécution, le démarrage sera d'abord traité en interne ; s'il est déjà en cours d'exécution, il sera rechargé selon la dernière configuration.

## Quels fichiers la CLI conservera-t-elle ?

En prenant `test2` comme exemple, les commandes liées à Caddy conservent généralement ces fichiers et répertoires :

| chemin | fonction |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Configuration complète du site générée par CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Fichier d'entrée général Caddy, responsable de l'importation de tous les `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Page de secours du SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Page de secours v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Répertoire de produits de build front-end actuellement utilisé |
| `NB_CLI_ROOT/test2/storage/uploads` | Le répertoire de téléchargement de l'application actuelle |

dans:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Les fichiers suivants sont des fichiers auxiliaires d'agent gérés par CLI
- `NB_CLI_ROOT/test2/storage/...` Voici les ressources statiques et les répertoires de téléchargement de l'application.
- `nocobase.caddy` est un fichier d'entrée au niveau du fournisseur et n'a généralement pas besoin d'être modifié manuellement.
- `app.caddy` est la configuration complète du site Caddy d'un certain environnement. La réexécution de `generate` écrasera l'intégralité de

:::avertissement

Si vous souhaitez compenser la configuration au niveau du site Caddy, telle que des en-têtes supplémentaires, des stratégies d'authentification, de limitation de vitesse ou de compression, vous pouvez d'abord ajuster en fonction de `app.caddy` ; cependant, sachez que les réexécutions ultérieures de `generate` écraseront ce fichier.

:::

## Configuration manuscrite : que faire sans CLI

Si votre application n'est pas hébergée par CLI ou si vous souhaitez explicitement conserver vous-même la configuration complète de Caddy, vous pouvez également l'écrire à la main.

Cependant, pour NocoBase, l'entrée de production ne se limite généralement pas à un simple `reverse_proxy`. En plus de transmettre les requêtes API à l'application backend, une configuration Caddy complète et fonctionnelle doit généralement gérer le répertoire de téléversement, les ressources statiques frontales, la route d'accès aux fichiers `/files/`, le routage `.well-known`, WebSocket et les pages de secours de la SPA.

En prenant `test2` comme exemple, les répertoires clés liés à Caddy incluent généralement :

- Répertoire des pages de secours SPA : `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Répertoire de produits de build front-end : `NB_CLI_ROOT/test2/storage/dist-client`
- Répertoire de téléchargement : `NB_CLI_ROOT/test2/storage/uploads`

En d’autres termes, la configuration manuscrite doit généralement couvrir au moins les types d’entrées suivants :

- `v` : rediriger `/v` vers `/v/`
- `uploads` : exposer le répertoire de téléchargement
- `dist` : exposer le répertoire du produit de build front-end
- `oauth well-known` : gérer les chemins de découverte OAuth
- `openid well-known` : gérer les chemins de découverte OpenID
- `files` : transmettre les requêtes d'accès aux fichiers sous `/files/` à l'application backend
- `api` : transmettre la requête `/api/` à l'application backend
- `ws` : transmettre les requêtes WebSocket à l'application backend
- `spa v2` : fournit une page d'entrée et de retour frontale pour `/v/`
- `spa v1` : fournit une page d'entrée et de retour frontale pour `/`

Par conséquent, une configuration Caddy complète n’est généralement pas simplement écrite de la manière générale suivante :

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Pour une application hébergée par CLI comme `test2`, une structure plus proche d'un déploiement réel ressemblerait généralement à ceci :

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

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /files/* {
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

Il y a également deux points clés ici :

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Ce qui suit est le répertoire des pages de restauration SPA géré par CLI
- `NB_CLI_ROOT/test2/storage/...` Ce qui suit est l'utilisation de votre propre répertoire de produits de construction et de votre répertoire de téléchargement

Si votre application utilise le déploiement de sous-chemins ou si les ressources frontales, le répertoire de téléchargement et la couche d'entrée ne sont pas dans la même perspective de chemin, la configuration manuscrite sera plus sujette aux erreurs. Dans ce scénario, il est généralement plus recommandé d'exécuter :

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Effectuez ensuite des ajustements en fonction des résultats générés.

Si vous souhaitez laisser la CLI vous aider à parcourir les chemins et les itinéraires en premier, la structure générée sera généralement :

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

dans:

- `nocobase.caddy` est responsable de l'unification de `import */app.caddy`
- `test2/app.caddy` est la configuration complète du site de cet environnement `test2`
- `public/index-v1.html` et `public/index-v2.html` sont des pages de secours SPA générées par la CLI

Une approche plus prudente est généralement la suivante :

1. Laissez d'abord la CLI générer la configuration du Caddy
2. Confirmez la structure de routage et le chemin réel en fonction des résultats générés.
3. Effectuez ensuite des ajustements manuels en fonction de votre nom de domaine, de votre mode d'exécution et du chemin de montage.

Il est généralement moins probable de manquer des détails liés à `/files/`, aux WebSockets, aux ressources statiques, aux répertoires de téléversement, aux routes `.well-known` ou aux pages de secours de la SPA que d'écrire une configuration à partir de zéro.

:::warning Attention

`/files/` est une route applicative qui doit passer par l'autorisation NocoBase. Ne la traitez pas comme un répertoire statique et ne la laissez pas atteindre le fallback de la SPA. Transmettez-la au backend NocoBase et placez la règle avant `handle_path /*` et les autres règles de fallback du front-end.

Si `APP_PUBLIC_PATH=/nocobase/` est configuré, transmettez également `/nocobase/files/*`. Conservez la règle `/files/*` à la racine pour assurer la compatibilité avec les URL de fichiers existantes.

:::

## Vérifier et recharger la configuration

Si vous écrivez ou ajustez manuellement la configuration du Caddy, vérifiez-la d'abord après avoir apporté les modifications, puis rechargez :

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Si vous n'utilisez pas `systemd` pour gérer Caddy, vous pouvez utiliser vos propres méthodes de démarrage et de rechargement à la place.

Si vous gérez la couche d'entrée via `nb proxy caddy`, il est généralement préférable d'utiliser :

```bash
nb proxy caddy reload
```

Si vous souhaitez voir le pilote actuel, le chemin total du fichier d'entrée, le répertoire racine d'exécution et les informations sur le conteneur ou le binaire local, vous pouvez exécuter :

```bash
nb proxy caddy info
```

Si vous souhaitez simplement confirmer rapidement s'il est en cours d'exécution, vous pouvez exécuter :

```bash
nb proxy caddy status
```

## Instructions communes

- `nb proxy caddy generate` est destiné aux applications installées par `nb init`
- Si vous disposez déjà d'un nom de domaine qui peut être résolu normalement sur le serveur, Caddy est souvent le moyen le plus rapide d'obtenir HTTPS.
- Si vous modifiez par la suite des configurations telles que `app-port` et `app-public-path` qui affecteront les résultats du proxy, pensez à réexécuter `generate`

## Liens connexes

- [Proxy inverse de l'environnement de production](./index.md)
- [Nginx](./nginx.md)
- [Installer à l'aide de CLI (recommandé)](../../installation/cli.md)
- [Configuration de l'application avec `.env`](../../installation/env.md)
- [Référence de commande `nb proxy caddy`](../../../api/cli/proxy/caddy/index.md)
