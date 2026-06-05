:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Variables d'environnement globales

## TZ

Utilisée pour définir le fuseau horaire de l'application. Par défaut, elle utilise le fuseau horaire du système d'exploitation.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Les opérations liées à l'heure seront traitées en fonction de ce fuseau horaire. Modifier `TZ` peut affecter les valeurs de date dans la base de données. Pour plus de détails, consultez la section « [Aperçu des dates et heures](#) ».
:::

## APP_ENV

Environnement de l'application. La valeur par défaut est `development`. Les options disponibles sont :

- `production` Environnement de production
- `development` Environnement de développement

```bash
APP_ENV=production
```

## APP_KEY

Clé secrète de l'application, utilisée pour générer les jetons utilisateur, etc. Modifiez-la avec votre propre clé d'application et assurez-vous qu'elle ne soit pas divulguée.

:::warning
Si `APP_KEY` est modifiée, les anciens jetons deviendront invalides.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port de l'application. La valeur par défaut est `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Préfixe de l'adresse de l'API NocoBase. La valeur par défaut est `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Mode de démarrage multi-cœur (cluster). Si cette variable est configurée, elle sera transmise à la commande `pm2 start` comme paramètre `-i <instances>`. Les options sont les mêmes que celles du paramètre `-i` de pm2 (voir [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), notamment :

- `max` : utilise le nombre maximal de cœurs CPU
- `-1` : utilise le nombre maximal de cœurs CPU moins 1
- `<number>` : spécifie le nombre de cœurs

La valeur par défaut est vide, ce qui signifie que le mode n'est pas activé.

:::warning{title="Attention"}
Ce mode doit être utilisé avec des plugins liés au mode cluster, sinon les fonctionnalités de l'application pourraient être anormales.
:::

Pour plus d'informations, consultez : [Mode Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Préfixe du nom des paquets de **plugin**s. Par défaut : `@nocobase/plugin-,@nocobase/preset-`.

Par exemple, pour ajouter le **plugin** `hello` au projet `my-nocobase-app`, le nom complet du paquet du **plugin** serait `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` peut être configuré comme suit :

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La correspondance entre les noms de **plugin**s et les noms de paquets est alors la suivante :

- Le nom du paquet pour le **plugin** `users` est `@nocobase/plugin-users`
- Le nom du paquet pour le **plugin** `nocobase` est `@nocobase/preset-nocobase`
- Le nom du paquet pour le **plugin** `hello` est `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Type de base de données. Les options disponibles sont :

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Hôte de la base de données (à configurer lors de l'utilisation d'une base de données MySQL ou PostgreSQL).

La valeur par défaut est `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Port de la base de données (à configurer lors de l'utilisation d'une base de données MySQL ou PostgreSQL).

- Port par défaut pour MySQL, MariaDB : 3306
- Port par défaut pour PostgreSQL : 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nom de la base de données (à configurer lors de l'utilisation d'une base de données MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Utilisateur de la base de données (à configurer lors de l'utilisation d'une base de données MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Mot de passe de la base de données (à configurer lors de l'utilisation d'une base de données MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Préfixe des tables de données.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Indique si les noms de tables et de champs de la base de données doivent être convertis au format snake_case. La valeur par défaut est `false`. Si vous utilisez une base de données MySQL (MariaDB) et que `lower_case_table_names=1`, alors `DB_UNDERSCORED` doit être `true`.

:::warning
Lorsque `DB_UNDERSCORED=true`, les noms réels des tables et des champs dans la base de données ne correspondent pas à ce qui est affiché dans l'interface. Par exemple, `orderDetails` dans l'interface sera `order_details` dans la base de données.
:::

## DB_LOGGING

Interrupteur de journalisation de la base de données. La valeur par défaut est `off`. Les options disponibles sont :

- `on` Activé
- `off` Désactivé

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Méthode de sortie des logs. Séparez plusieurs valeurs par une virgule `,`. La valeur par défaut en environnement de développement est `console`, et en environnement de production est `console,dailyRotateFile`. Options disponibles :

- `console` - `console.log`
- `file` - `Fichier`
- `dailyRotateFile` - `Fichier rotatif quotidien`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Chemin de stockage des logs basés sur des fichiers. La valeur par défaut est `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Niveau de sortie des logs. La valeur par défaut en environnement de développement est `debug`, et en environnement de production est `info`. Options disponibles :

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Le niveau de sortie des logs de la base de données est `debug`. Son affichage est contrôlé par `DB_LOGGING` et n'est pas affecté par `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Nombre maximal de fichiers de log à conserver.

- Lorsque `LOGGER_TRANSPORT` est `file`, la valeur par défaut est `10`.
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile`, utilisez `[n]d` pour représenter le nombre de jours. La valeur par défaut est `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotation des logs par taille.

- Lorsque `LOGGER_TRANSPORT` est `file`, l'unité est le `byte`, et la valeur par défaut est `20971520 (20 * 1024 * 1024)`.
- Lorsque `LOGGER_TRANSPORT` est `dailyRotateFile`, vous pouvez utiliser `[n]k`, `[n]m`, `[n]g`. Non configuré par défaut.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format d'impression des logs. La valeur par défaut en environnement de développement est `console`, et en environnement de production est `json`. Options disponibles :

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Voir : [Format des logs](#)

## CACHE_DEFAULT_STORE

Identifiant unique de la méthode de cache à utiliser, spécifiant la méthode de cache par défaut côté serveur. La valeur par défaut est `memory`. Options intégrées :

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Nombre maximal d'éléments dans le cache mémoire. La valeur par défaut est `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Connexion Redis, facultative. Exemple : `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Active la collecte des données de télémétrie. La valeur par défaut est `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Collecteurs de métriques de surveillance activés. La valeur par défaut est `console`. Les autres valeurs doivent faire référence aux noms enregistrés des **plugin**s de collecteurs correspondants, tels que `prometheus`. Séparez plusieurs valeurs par une virgule `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Processeurs de données de trace activés. La valeur par défaut est `console`. Les autres valeurs doivent faire référence aux noms enregistrés des **plugin**s de processeurs correspondants. Séparez plusieurs valeurs par une virgule `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```