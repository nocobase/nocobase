# Variables d'environnement

## Comment définir les variables d'environnement ?

### Méthode d'installation via le code source Git ou `create-nocobase-app`

Définissez les variables d'environnement dans le fichier `.env` situé à la racine de votre projet. Après avoir modifié ces variables, vous devrez arrêter le processus de l'application et le redémarrer.

### Méthode d'installation Docker

Modifiez la configuration de `docker-compose.yml` et définissez les variables d'environnement dans le paramètre `environment`. Exemple :

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Vous pouvez également utiliser `env_file` pour définir les variables d'environnement dans un fichier `.env`. Exemple :

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Après avoir modifié les variables d'environnement, vous devez reconstruire le conteneur de l'application :

```yml
docker compose up -d app
```

## Variables d'environnement globales

### TZ

Permet de définir le fuseau horaire de l'application. Par défaut, c'est celui du système d'exploitation.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Les opérations liées à l'heure seront traitées en fonction de ce fuseau horaire. La modification de `TZ` peut affecter les valeurs de date dans la base de données. Pour plus de détails, consultez l'« [Aperçu des dates et heures](/data-sources/data-modeling/collection-fields/datetime) ».
:::

### APP_ENV

Environnement de l'application. La valeur par défaut est `development`. Les options disponibles sont :

- `production` environnement de production
- `development` environnement de développement

```bash
APP_ENV=production
```

### APP_KEY

La clé secrète de l'application, utilisée notamment pour générer les jetons utilisateur. Modifiez-la pour utiliser votre propre clé d'application et assurez-vous qu'elle ne soit pas divulguée.

:::warning
Si `APP_KEY` est modifiée, les anciens jetons deviendront invalides.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Port de l'application. La valeur par défaut est `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Préfixe de l'adresse de l'API NocoBase. La valeur par défaut est `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

URL de base utilisée par le frontend pour accéder à l'API NocoBase. Elle est vide par défaut, ce qui signifie que `${APP_PUBLIC_PATH}api/` du même origin est utilisé.

```bash
API_BASE_URL=
```

Ne la configurez avec l'adresse complète de l'API que lorsque les pages et le service API sont sur des origins différents (protocole, domaine ou port différents) :

```bash
API_BASE_URL=https://api.example.com/api/
```

:::warning{title="Déploiements cross-origin"}
NocoBase utilise des cookies pour conserver l'état de connexion et autoriser l'accès aux [URL de fichiers stables](../../file-manager/stable-url.md). Lorsque `API_BASE_URL` pointe vers un origin différent de celui des pages :

- L'origin des pages doit être ajouté à [`CORS_ORIGIN_WHITELIST`](#cors_origin_whitelist). Sinon, le navigateur ignorera `Set-Cookie` dans les réponses API, le cookie de connexion ne sera pas enregistré et les fonctions dépendantes des cookies, comme l'aperçu et le téléchargement de fichiers, échoueront avec `403`.
- Les cookies sont stockés par `hostname`. Si les pages et l'API utilisent des domaines totalement différents, les requêtes vers les URL stables sous `/files/` depuis le domaine des pages n'enverront pas le cookie de connexion stocké sous le domaine de l'API ; l'accès au fichier échouera donc toujours.

Il est recommandé de servir les pages et l'API depuis le même origin via un proxy inverse et de laisser `API_BASE_URL` vide.
:::

### CORS_ORIGIN_WHITELIST

Liste blanche des origins autorisés à accéder à l'API en cross-origin avec des identifiants (cookies). Plusieurs origins sont séparés par des virgules. Vide par défaut.

```bash
CORS_ORIGIN_WHITELIST=https://www.example.com,https://admin.example.com
```

- Lorsqu'elle n'est pas configurée, seules les requêtes du même origin sont considérées comme fiables ; les requêtes cross-origin peuvent encore appeler l'API anonymement, mais le navigateur ne peut pas lire ni écrire de cookies pour elles.
- Lorsqu'elle est configurée, les origins de la liste blanche reçoivent un `Access-Control-Allow-Origin` qui reprend exactement l'origin ainsi que `Access-Control-Allow-Credentials: true`, ce qui permet au navigateur d'envoyer et de stocker les cookies de connexion sur les requêtes cross-origin.
- L'API de connexion valide les en-têtes `Origin` et `Referer` de la requête ; les requêtes de connexion cross-origin provenant d'origins hors liste blanche sont rejetées avec `403`.

### CLUSTER_MODE

> `v1.6.0+`

Le mode de démarrage multi-cœur (cluster) pour l'application. Si cette variable est configurée, elle sera transmise à la commande `pm2 start` comme paramètre `-i <instances>`. Les options sont cohérentes avec le paramètre `-i` de pm2 (référez-vous à [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), et incluent :

- `max` : Utilise le nombre maximal de cœurs CPU.
- `-1` : Utilise le nombre maximal de cœurs CPU moins un.
- `<number>` : Spécifie le nombre de cœurs.

La valeur par défaut est vide, ce qui signifie que le mode n'est pas activé.

:::warning{title="Attention"}
Ce mode nécessite l'utilisation de plugins liés au mode cluster. Dans le cas contraire, les fonctionnalités de l'application pourraient rencontrer des problèmes inattendus.
:::

Pour plus d'informations, consultez : [Mode Cluster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Préfixe du nom de package des plugins. La valeur par défaut est : `@nocobase/plugin-,@nocobase/preset-`.

Par exemple, pour ajouter le `plugin` `hello` au projet `my-nocobase-app`, le nom complet du package du `plugin` serait `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` peut être configuré comme suit :

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La correspondance entre le nom du `plugin` et le nom du package est la suivante :

- Le nom du package du `plugin` `users` est `@nocobase/plugin-users`.
- Le nom du package du `plugin` `nocobase` est `@nocobase/preset-nocobase`.
- Le nom du package du `plugin` `hello` est `@my-nocobase-app/plugin-hello`.

### DB_DIALECT

Type de base de données. Les options disponibles sont :

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Hôte de la base de données (requis lors de l'utilisation de bases de données MySQL ou PostgreSQL).

La valeur par défaut est `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Port de la base de données (requis lors de l'utilisation de bases de données MySQL ou PostgreSQL).

- Le port par défaut pour MySQL et MariaDB est `3306`.
- Le port par défaut pour PostgreSQL est `5432`.

```bash
DB_PORT=3306
```

### DB_DATABASE

Nom de la base de données (requis lors de l'utilisation de bases de données MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Utilisateur de la base de données (requis lors de l'utilisation de bases de données MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Mot de passe de la base de données (requis lors de l'utilisation de bases de données MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Préfixe des tables de données.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Indique si les noms de tables et de champs de la base de données doivent être convertis au format `snake_case`. La valeur par défaut est `false`. Si vous utilisez une base de données MySQL (MariaDB) avec `lower_case_table_names=1`, alors `DB_UNDERSCORED` doit être défini sur `true`.

:::warning
Lorsque `DB_UNDERSCORED=true`, les noms réels des tables et des champs dans la base de données ne correspondront pas à ce qui est affiché dans l'interface utilisateur. Par exemple, `orderDetails` sera stocké comme `order_details` dans la base de données.
:::

### DB_LOGGING

Commutateur de journalisation de la base de données. La valeur par défaut est `off`. Les options disponibles sont :

- `on` activé
- `off` désactivé

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Nombre maximal de connexions dans le pool de connexions de la base de données. La valeur par défaut est `5`.

### DB_POOL_MIN

Nombre minimal de connexions dans le pool de connexions de la base de données. La valeur par défaut est `0`.

### DB_POOL_IDLE

Durée maximale, en millisecondes, pendant laquelle une connexion peut rester inactive avant d'être libérée. La valeur par défaut est `10000` (10 secondes).

### DB_POOL_ACQUIRE

Durée maximale, en millisecondes, pendant laquelle le pool tentera d'obtenir une connexion avant de générer une erreur. La valeur par défaut est `60000` (60 secondes).

### DB_POOL_EVICT

Intervalle de temps, en millisecondes, après lequel le pool de connexions supprimera les connexions inactives. La valeur par défaut est `1000` (1 seconde).

### DB_POOL_MAX_USES

Nombre de fois qu'une connexion peut être utilisée avant d'être abandonnée et remplacée. La valeur par défaut est `0` (illimité).

### LOGGER_TRANSPORT

Méthode de sortie des logs. Plusieurs valeurs peuvent être séparées par des virgules. La valeur par défaut est `console` en environnement de développement, et `console,dailyRotateFile` en production.
Options :

- `console` - `console.log`
- `file` - Sortie vers un fichier
- `dailyRotateFile` - Sortie vers des fichiers rotatifs quotidiens

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_LEVEL

Niveau de sortie des logs. La valeur par défaut est `debug` en environnement de développement et `info` en production. Options :

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Le niveau de sortie des logs de la base de données est `debug`, contrôlé par `DB_LOGGING`, et n'est pas affecté par `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Nombre maximal de fichiers de log à conserver.

- Lorsque `LOGGER_TRANSPORT` est `file` : La valeur par défaut est `10`.
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile` : Utilisez `[n]d` pour représenter le nombre de jours. La valeur par défaut est `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotation des logs par taille.

- Lorsque `LOGGER_TRANSPORT` est `file` : L'unité est le `byte`. La valeur par défaut est `20971520` (20 * 1024 * 1024).
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile` : Vous pouvez utiliser `[n]k`, `[n]m`, `[n]g`. Non configuré par défaut.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Format d'impression des logs. La valeur par défaut est `console` en environnement de développement et `json` en production. Options :

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Référence : [Format des logs](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Identifiant unique pour la méthode de mise en cache, spécifiant la méthode de cache par défaut du serveur. La valeur par défaut est `memory`. Les options intégrées incluent :

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Nombre maximal d'éléments dans le cache mémoire. La valeur par défaut est `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL de connexion Redis, facultative. Exemple : `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Active la collecte de données de télémétrie. La valeur par défaut est `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Collecteurs de métriques de surveillance activés. La valeur par défaut est `console`. Les autres valeurs doivent faire référence aux noms enregistrés par les `plugins` de collecteurs correspondants, tels que `prometheus`. Plusieurs valeurs sont séparées par des virgules.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Processeurs de données de trace activés. La valeur par défaut est `console`. Les autres valeurs doivent faire référence aux noms enregistrés par les `plugins` de processeurs correspondants. Plusieurs valeurs sont séparées par des virgules.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

### SERVER_REQUEST_WHITELIST

Liste blanche des cibles autorisées pour les requêtes HTTP sortantes initiées par le serveur NocoBase. Accepte une liste séparée par des virgules d'IPs exactes, de plages CIDR, de noms d'hôtes exacts et de sous-domaines génériques à un seul niveau.

```bash
SERVER_REQUEST_WHITELIST=api.example.com,*.trusted.com,10.0.0.0/8,127.0.0.1
```

**S'applique à** : Les nœuds « Requête HTTP » dans les workflows, les boutons d'action de requête personnalisée, les services AI et les autres requêtes côté serveur. Les requêtes avec chemin relatif (appels à l'API NocoBase elle-même) ne sont pas affectées.

**Non configuré** : Toutes les requêtes sortantes `http` / `https` restent autorisées pour conserver le comportement existant. Toutefois, si la cible est une adresse loopback, privée, link-local ou metadata, ou si un domaine se résout vers l'une de ces adresses, le serveur écrit un warning dans les logs.

**Configuré** : La requête initiale et chaque destination de redirection doivent correspondre à la liste blanche. Sans correspondance, NocoBase génère une erreur avant d'envoyer la requête suivante. Les versions futures pourront durcir progressivement le comportement par défaut. Si votre déploiement doit accéder à des services internes, configurez une liste blanche explicite à l'avance.

Formats pris en charge :

| Format | Exemple | Correspond à |
| --- | --- | --- |
| IPv4 exacte | `1.2.3.4` | Uniquement cette IP |
| IPv4 CIDR | `10.0.0.0/8` | Toutes les IPs du sous-réseau |
| IPv6 exacte | `::1` | Uniquement cette IP |
| IPv6 CIDR | `fc00::/7` | Toutes les IPs du sous-réseau |
| Nom d'hôte exact | `api.example.com` | Uniquement ce nom d'hôte |
| Sous-domaine générique | `*.example.com` | Un niveau de sous-domaine, ex. `foo.example.com` ; **pas** `example.com` ni `a.b.example.com` |

:::warning Note

Si un domaine est configuré dans la liste blanche, la vérification utilise le host de l'URL de la requête. Autrement dit, après avoir configuré `internal.example.com`, cette cible est considérée comme explicitement autorisée même si le domaine se résout vers `127.0.0.1` ou une adresse privée.

:::

## Variables d'environnement expérimentales

### APPEND_PRESET_LOCAL_PLUGINS

Utilisée pour ajouter des `plugins` locaux prédéfinis et non activés. La valeur est le nom du package du `plugin` (le paramètre `name` dans `package.json`), avec plusieurs `plugins` séparés par des virgules.

:::info

1. Assurez-vous que le `plugin` est téléchargé localement et qu'il se trouve dans le répertoire `node_modules`. Pour plus de détails, consultez l'« [Organisation des plugins](/plugin-development/project-structure) ».
2. Après avoir ajouté la variable d'environnement, le `plugin` n'apparaîtra sur la page du gestionnaire de `plugins` qu'après une installation initiale (`nocobase install`) ou une mise à jour (`nocobase upgrade`).

:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Utilisée pour ajouter des `plugins` intégrés et installés par défaut. La valeur est le nom du package du `plugin` (le paramètre `name` dans `package.json`), avec plusieurs `plugins` séparés par des virgules.

:::info

1. Assurez-vous que le `plugin` est téléchargé localement et qu'il se trouve dans le répertoire `node_modules`. Pour plus de détails, consultez l'« [Organisation des plugins](/plugin-development/project-structure) ».
2. Après avoir ajouté la variable d'environnement, le `plugin` sera automatiquement installé ou mis à jour lors de l'installation initiale (`nocobase install`) ou de la mise à jour (`nocobase upgrade`).

:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Variables d'environnement temporaires

Lors de l'installation de NocoBase, vous pouvez utiliser des variables d'environnement temporaires pour faciliter le processus, par exemple :

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Équivalent à
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Équivalent à
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Langue lors de l'installation. La valeur par défaut est `en-US`. Les options disponibles sont :

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

E-mail de l'utilisateur Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Mot de passe de l'utilisateur Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Surnom de l'utilisateur Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```
