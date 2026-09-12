---
title: "Migration"
description: "Référence de l'API Migration NocoBase : classe de base Migration, méthodes up/down, timing d'exécution on, contrôle de version appVersion, propriétés disponibles."
keywords: "Migration,migration de données,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration est la classe de base de migration de données de NocoBase, utilisée pour gérer les modifications de structure de base de données et les migrations de données lors de la mise à niveau d'un plugin. Elle s'importe depuis `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Logique de mise à niveau
  }
}
```

## Propriétés de classe

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Contrôle le moment d'exécution de la migration dans le flux d'upgrade. Par défaut `'afterLoad'`.

| Valeur | Moment d'exécution | Cas d'usage |
|--------|--------------------|-------------|
| `'beforeLoad'` | Avant le chargement du plugin | Opérations DDL bas niveau (par exemple ajouter une colonne, ajouter une contrainte) ; l'API Repository n'est pas utilisable à ce stade |
| `'afterSync'` | Après `db.sync()`, avant l'upgrade du plugin | Migrations de données nécessitant la nouvelle structure de table mais ne dépendant pas de la logique du plugin |
| `'afterLoad'` | Après le chargement de tous les plugins | **Valeur par défaut** ; la plupart des migrations utilisent ce mode. L'API Repository complète est disponible |

### appVersion

```ts
appVersion: string;
```

Chaîne de plage semver qui détermine sur quelles versions d'application cette migration s'exécutera. Le framework utilise `semver.satisfies()` pour vérifier : la migration ne s'exécutera que si la version de l'application courante satisfait à cette plage.

```ts
// Ne s'exécute que lors de la mise à niveau depuis une version inférieure à 1.0.0
appVersion = '<1.0.0';

// Ne s'exécute que lors de la mise à niveau depuis une version inférieure à 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// Si laissé vide, s'exécute à chaque upgrade
appVersion = '';
```

## Propriétés d'instance

### app

```ts
get app(): Application
```

Instance Application de NocoBase. Elle vous permet d'accéder à tous les modules de l'application :

```ts
async up() {
  // Récupérer la version de l'application
  const version = this.app.version;

  // Récupérer le logger
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Instance Database de NocoBase, permettant d'obtenir des Repository, d'exécuter des requêtes, etc. :

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Instance du plugin courant. Disponible uniquement dans les migrations au niveau plugin (vaut `undefined` dans les migrations core).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Instance Sequelize, permet d'exécuter directement du SQL brut :

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

QueryInterface de Sequelize, utilisée pour exécuter des opérations DDL (ajouter/supprimer des colonnes, ajouter des contraintes, modifier des types de colonnes, etc.) :

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Ajouter une colonne
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Ajouter une contrainte d'unicité
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Gestionnaire de plugins. Via `this.pm.repository`, vous pouvez interroger et modifier les métadonnées des plugins :

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Modification en lot des enregistrements de plugin
  }
}
```

## Méthodes d'instance

### up()

```ts
async up(): Promise<void>
```

**Exécutée lors de la mise à niveau.** Les sous-classes doivent override cette méthode pour écrire la logique de migration.

### down()

```ts
async down(): Promise<void>
```

**Exécutée lors du rollback.** La plupart des migrations la laissent vide. Si vous avez besoin de prendre en charge le rollback, écrivez ici l'opération inverse.

## Exemples complets

### Utiliser l'API Repository pour mettre à jour des données (afterLoad)

Le scénario le plus courant : après le chargement de tous les plugins, mettre à jour des données en lot avec l'API Repository :

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Utiliser QueryInterface pour modifier la structure des tables (beforeLoad)

Exécuter du DDL bas niveau avant le chargement du plugin — par exemple ajouter une nouvelle colonne et une contrainte d'unicité à une table :

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Vérifier d'abord si le champ existe déjà
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Utiliser du SQL brut (afterSync)

Une fois la structure de la table synchronisée, faire la migration de données avec du SQL brut :

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Créer un fichier de migration

Création via la commande CLI :

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

La commande génère un fichier horodaté dans le répertoire `src/server/migrations/` du plugin, avec ce template :

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<version courante>';

  async up() {
    // coding
  }
}
```

Paramètres de la commande :

| Paramètre | Description |
|-----------|-------------|
| `<name>` | Nom de la migration, utilisé pour générer le nom du fichier |
| `--pkg <pkg>` | Nom du paquet, détermine l'emplacement du fichier |
| `--on <on>` | Moment d'exécution, par défaut `'afterLoad'` |

## Liens connexes

- [Scripts de mise à niveau Migration (développement de plugin)](../../plugin-development/server/migration.md) — Tutoriel d'utilisation des migrations dans le développement de plugins
- [Collections - tables de données](../../plugin-development/server/collections.md) — defineCollection et synchronisation de la structure des tables
- [Database - opérations de base de données](../../plugin-development/server/database.md) — API Repository et opérations de base de données
- [Plugin](../../plugin-development/server/plugin.md) — Relation entre `install()` et migration dans le cycle de vie du plugin
