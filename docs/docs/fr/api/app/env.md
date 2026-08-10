---
title: "Variables d'environnement globales"
description: "Variables d'environnement NocoBase : description des options de configuration TZ, APP_KEY, DB, etc."
keywords: "variables d'environnement,APP_KEY,TZ,configuration,NocoBase"
---

# Variables d'environnement globales

## TZ

Définit le fuseau horaire de l'application. Par défaut, il s'agit du fuseau horaire du système d'exploitation.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning Attention
Les opérations liées au temps seront traitées selon ce fuseau horaire. Modifier TZ peut affecter les valeurs de date dans la base de données. Pour plus de détails, consultez « [Aperçu des dates et heures](#) ».
:::

## APP_ENV

Environnement de l'application. Valeur par défaut `development`. Les options possibles incluent :

- `production` environnement de production
- `development` environnement de développement

```bash
APP_ENV=production
```

## APP_KEY

Clé de l'application, utilisée pour générer les tokens utilisateur, etc. Modifiez-la pour utiliser votre propre clé d'application et assurez-vous qu'elle ne soit pas divulguée.

:::warning Attention
Si APP_KEY est modifié, les anciens tokens deviendront également invalides.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port de l'application. Valeur par défaut `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Préfixe de l'adresse de l'API NocoBase. Valeur par défaut `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## SERVER_REQUEST_WHITELIST

Liste blanche des cibles autorisées pour les requêtes HTTP sortantes initiées par le serveur. Elle s'applique aux requêtes côté serveur issues de fonctionnalités comme les nœuds de requête HTTP des workflows, les requêtes personnalisées et les services AI.

Lorsque cette variable n'est pas configurée, NocoBase continue d'autoriser les requêtes `http` / `https` pour conserver la compatibilité avec les déploiements existants. Toutefois, si la cible est une adresse loopback, privée, link-local ou metadata, ou si un domaine se résout vers l'une de ces adresses, le serveur écrit un warning dans les logs. Les versions futures pourront durcir progressivement le comportement par défaut. Si votre déploiement doit accéder à des services internes, configurez une liste blanche explicite à l'avance.

Lorsque cette variable est configurée, la requête initiale et chaque destination de redirection doivent correspondre à une entrée de la liste blanche. Si une redirection pointe vers un hôte non correspondant, NocoBase s'arrête avant d'envoyer la requête redirigée.

Entrées prises en charge :

- Adresse IPv4 exacte, par exemple `192.168.1.10`
- Plage CIDR IPv4, par exemple `10.0.0.0/8`
- Adresse IPv6 exacte, par exemple `::1`
- Plage CIDR IPv6, par exemple `fc00::/7`
- Domaine exact, par exemple `api.example.com`
- Sous-domaine générique à un seul niveau, par exemple `*.example.com`

Utilisez `,` pour séparer plusieurs cibles :

```bash
SERVER_REQUEST_WHITELIST=api.example.com,*.trusted.com,10.0.0.0/8,127.0.0.1
```

:::warning Note

Si un domaine est configuré dans la liste blanche, la vérification utilise le host de l'URL de la requête. Autrement dit, après avoir configuré `internal.example.com`, cette cible est considérée comme explicitement autorisée même si le domaine se résout vers `127.0.0.1` ou une adresse privée.

:::

## CLUSTER_MODE

> `v1.6.0+`

Mode de démarrage multi-cœurs (cluster). Si cette variable est configurée, elle sera transmise à la commande `pm2 start` comme paramètre `-i <instances>`. Les options possibles correspondent au paramètre `-i` de pm2 (voir [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) et incluent :

- `max` : utilise le nombre maximum de cœurs CPU
- `-1` : utilise le nombre maximum de cœurs CPU moins un
- `<number>` : nombre de cœurs spécifié

La valeur par défaut est vide, ce qui signifie que le mode n'est pas activé.

:::warning{title="Attention"}
Ce mode doit être utilisé avec des plugins liés au mode cluster, sinon les fonctionnalités de l'application peuvent présenter des anomalies.
:::

Pour plus d'informations, consultez : [Mode cluster](#).

## PLUGIN_PACKAGE_PREFIX

Préfixe du nom de package des plugins. Valeur par défaut : `@nocobase/plugin-,@nocobase/preset-`.

Par exemple, si vous ajoutez le plugin `hello` au projet `my-nocobase-app`, le nom complet du package du plugin sera `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX peut être configuré comme suit :

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Les correspondances entre les noms des plugins et les noms des packages seront alors :

- Le package du plugin `users` est `@nocobase/plugin-users`
- Le package du plugin `nocobase` est `@nocobase/preset-nocobase`
- Le package du plugin `hello` est `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Type de base de données. Les options possibles incluent :

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Hôte de la base de données (à configurer lors de l'utilisation de MySQL ou PostgreSQL).

Valeur par défaut `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Port de la base de données (à configurer lors de l'utilisation de MySQL ou PostgreSQL).

- Port par défaut MySQL, MariaDB : 3306
- Port par défaut PostgreSQL : 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nom de la base de données (à configurer lors de l'utilisation de MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Utilisateur de la base de données (à configurer lors de l'utilisation de MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Mot de passe de la base de données (à configurer lors de l'utilisation de MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Préfixe des tables de la base de données.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Indique si les noms des tables et des champs de la base de données doivent être convertis en style snake case. Par défaut `false`. Si vous utilisez MySQL (MariaDB) avec `lower_case_table_names=1`, alors DB_UNDERSCORED doit être `true`.

:::warning Attention
Lorsque `DB_UNDERSCORED=true`, les noms réels des tables et champs dans la base de données ne correspondent pas à ceux affichés dans l'interface. Par exemple, `orderDetails` est stocké comme `order_details` dans la base de données.
:::

## DB_LOGGING

Active ou désactive les logs de la base de données. Valeur par défaut `off`. Les options possibles incluent :

- `on` activé
- `off` désactivé

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Mode de sortie des logs. Plusieurs valeurs sont séparées par `,`. Valeur par défaut en environnement de développement : `console`. En environnement de production : `console,dailyRotateFile`.
Options possibles :

- `console` - `console.log`
- `file` - `fichier`
- `dailyRotateFile` - `fichier rotatif quotidien`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_LEVEL

Niveau de log de sortie. Valeur par défaut en environnement de développement : `debug`. En environnement de production : `info`. Options possibles :

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Le niveau de log de la base de données est `debug`. Sa sortie est contrôlée par `DB_LOGGING` et n'est pas affectée par `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Nombre maximum de fichiers de logs conservés.

- Lorsque `LOGGER_TRANSPORT` est `file`, la valeur par défaut est `10`.
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile`, utilisez `[n]d` pour représenter le nombre de jours. Valeur par défaut : `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotation des logs basée sur la taille.

- Lorsque `LOGGER_TRANSPORT` est `file`, l'unité est `byte`. Valeur par défaut : `20971520 (20 * 1024 * 1024)`.
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile`, vous pouvez utiliser `[n]k`, `[n]m`, `[n]g`. Non configuré par défaut.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format d'impression des logs. Valeur par défaut en environnement de développement : `console`. En environnement de production : `json`. Options possibles :

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Référence : [Format des logs](#)

## CACHE_DEFAULT_STORE

Identifiant unique du mode de cache. Spécifie le mode de cache par défaut côté serveur. Valeur par défaut `memory`. Options intégrées :

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Nombre maximum d'éléments dans le cache mémoire. Valeur par défaut `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Connexion Redis (facultatif). Exemple : `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Active la collecte de données de télémétrie. Par défaut `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Collecteurs de métriques activés. Par défaut `console`. Les autres valeurs doivent correspondre aux noms enregistrés par les plugins de collecteurs correspondants, comme `prometheus`. Plusieurs valeurs séparées par `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Processeurs de données de traçage activés. Par défaut `console`. Les autres valeurs doivent correspondre aux noms enregistrés par les plugins de processeurs correspondants. Plusieurs valeurs séparées par `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
