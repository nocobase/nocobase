# Configuration de l'application et `.env`

Cette page s'applique uniquement aux applications créées ou hébergées via la CLI NocoBase.

Si vous venez de terminer la lecture de [Installation à l'aide de CLI (recommandée)] (./cli.md) et que vous avez vu la section « Répertoire d'installation », les problèmes les plus courants que vous rencontrerez sont généralement les suivants :

- Où est placé le fichier `.env` ?
- Quelles configurations peuvent encore être écrites dans `.env`
- Quelles configurations sont désormais plus adaptées pour être confiées à `nb env update`

Parlons d’abord de la conclusion :

- Pour les applications installées en CLI, `.env` est placé dans `<app-path>/.env` par défaut
- Ce fichier est facultatif, tous les environnements ne doivent pas être créés manuellement
- Les configurations de base telles que `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH` et `DB_*` sont gérées par `nb env update` par défaut.
- `.env` est principalement utilisé pour compléter les variables d'exécution que la CLI n'a pas directement prises en charge, telles que le stockage, le cache, les journaux, les observations et certaines variables d'extension de plug-in.

## Trouvez d'abord `app-path`

Dans [Installer à l'aide de CLI (recommandé)] (répertoire ./cli.md#Installation), la structure de répertoires par défaut de l'environnement CLI est la suivante :

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Si vous n'êtes pas sûr de l'endroit où se trouve le `app-path` actuellement appliqué, vous pouvez vérifier directement :

```bash
nb env info app1 --field app.appPath
```

Remplacez simplement `app1` par votre nom d'environnement.

Autrement dit, pour une application créée ou hébergée via la CLI, l'emplacement le plus approprié pour le fichier `.env` est :

```text
<app-path>/.env
```

De manière générale, il n'est pas nécessaire de le mettre dans `source/.env`, et il n'est pas nécessaire de trouver `.env` dans le répertoire racine du projet Docker Compose selon l'ancienne méthode d'installation.

## Quand devez-vous créer vous-même `.env` ?

`.env` est facultatif.

Si vous souhaitez simplement exécuter l'application en premier ou simplement modifier les configurations de base telles que les ports, les fuseaux horaires, les connexions à la base de données et les chemins d'accès publics, dans de nombreux cas, il n'est pas nécessaire de créer manuellement `.env`.

Ajoutez-les uniquement à `<app-path>/.env` si vous devez ajouter des variables d'exécution que la CLI n'a pas directement prises en charge.

## La valeur par défaut consiste à utiliser `nb env update` en premier

Dans la nouvelle méthode d'installation CLI, il est recommandé que la configuration de base de l'application ait la priorité sur [`nb env update`](../../api/cli/env/update.md) par défaut.

Cela présente deux avantages :

- La configuration et l'environnement lui-même sont enregistrés dans le même esprit CLI, ce qui facilite la vérification et la modification
- À l'avenir, vous, les scripts et les agents IA pourrez continuer à utiliser le même ensemble de commandes pour la maintenance, il n'est donc pas facile de se retrouver dans la situation « un ensemble de modifications est apporté dans le fichier, mais un autre ensemble est enregistré dans la CLI »

### Ces configurations sont désormais plus adaptées pour être confiées à `nb env update`

Pour les éléments suivants, vous avez peut-être eu l'habitude de les écrire directement dans `.env` dans le passé. Cependant, en mode d'installation CLI, il est recommandé d'utiliser `nb env update` par défaut :

| Je veux changer... | Comment changer la valeur par défaut |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Type de base de données et paramètres de connexion, tels que `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| Schéma PostgreSQL, préfixe de table, trait de soulignement nommant les éléments supplémentaires de la base de données, tels que `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Par exemple, si vous souhaitez changer le port de l'application et le fuseau horaire, vous pouvez écrire directement comme ceci :

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Si vous souhaitez modifier les paramètres de connexion à la base de données, vous pouvez écrire comme ceci :

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Après avoir effectué les modifications, la CLI vous demandera généralement d'exécuter `nb app restart` plus tard. Pour une description plus complète des paramètres, consultez simplement [`nb env update`](../../api/cli/env/update.md).

## Quelles situations sont les plus appropriées pour être écrites dans `.env`

Si une variable n'a pas encore de paramètre CLI correspondant, ou si elle ressemble plus à une configuration étendue "passée directement au runtime de l'application", alors continuez simplement à écrire `<app-path>/.env`.

Incluez généralement ces catégories :

- Configurations de stockage de fichiers et de stockage d'objets, telles que `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Configuration du cache et de Redis, telle que `CACHE_*`, `REDIS_URL`
- Configurations de journal et d'observation, telles que `LOGGER_*`, `TELEMETRY_*`
- Certaines variables spécifiques au plug-in ou à l'extension, telles que l'exportation, les tâches asynchrones, le flux de travail et les variables liées à l'extension AI

Par exemple:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Ce type de variable est essentiellement une configuration d'exécution d'application, et la CLI ne la reprendra pas actuellement élément par élément. Il est plus naturel de le placer en `.env`.

## Comment répartir le travail entre `.env` et `nb env update`

Si vous ne savez pas où doit aller une certaine configuration, suivez simplement cette règle par défaut :

- Si `nb env update` possède déjà un paramètre correspondant, il sera utilisé en premier par défaut.
- S'il n'y a pas de paramètre correspondant, ou s'il appartient évidemment à la configuration de l'extension d'exécution telle que les plug-ins, le stockage, le cache et les journaux, placez-le dans `<app-path>/.env`

Dans la plupart des scénarios, cette division du travail est suffisante.

### Un malentendu courant

Ne conservez pas deux copies de la même configuration en même temps.

Par exemple, si vous avez enregistré des éléments de base tels que `APP_PORT`, `TZ`, `APP_PUBLIC_PATH` et `DB_HOST` avec `nb env update`, vous n'avez généralement pas besoin de les réécrire dans `.env`. Sinon, lors du dépannage ultérieur, il sera facile de ne pas savoir quelle couche correspond à la valeur que vous souhaitez réellement appliquer.

## Un exemple minimal de `.env`

Si votre configuration de base a été enregistrée via la CLI, alors `.env` n'a probablement besoin de conserver que quelques variables d'extension, telles que :

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

C’est aussi la mentalité que cette page souhaite le plus vous aider à construire :

`.env` est toujours utile, mais dans la nouvelle méthode d'installation CLI, il s'agit davantage de compléter la configuration de l'extension d'exécution plutôt que de continuer à assumer tous les paramètres d'installation de base.

## Où chercher ensuite

- Si vous n'avez pas confirmé la structure du répertoire de l'application, revenez d'abord à [Installer à l'aide de la CLI (recommandé)] (./cli.md#Répertoire d'installation)
- Si vous souhaitez modifier les configurations de base telles que les ports, les fuseaux horaires, les connexions à la base de données et les chemins d'accès publics, continuez à consulter [`nb env update`](../../api/cli/env/update.md)
- Si vous souhaitez démarrer, redémarrer ou afficher les journaux d'application, continuez à voir [Gérer l'application] (../operations/manage-app.md)
