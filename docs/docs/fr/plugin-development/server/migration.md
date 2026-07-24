---
title: "Migration : Scripts de mise à niveau"
description: "Migration de base de données pour les plugins NocoBase : classe Migration, up/down, mise à niveau de version, modification de schéma."
keywords: "Migration,migration de base de données,up,down,script de mise à niveau,modification de schéma,NocoBase"
---

# Migration : Scripts de mise à niveau

Lors du développement et des mises à jour des plugins NocoBase, la structure de la base de données ou la configuration de ces plugins peuvent subir des modifications incompatibles. Pour garantir une exécution fluide des mises à niveau, NocoBase propose un mécanisme de **Migration** — en écrivant des fichiers de migration pour gérer ces changements.

## Concept de la Migration

Une Migration est un script qui s'exécute automatiquement lors des mises à niveau de plugins, et qui sert à résoudre les problèmes suivants :

- Ajustements de la structure des tables de données (ajout de champs, modification de types de champs, etc.)
- Migration de données (par exemple, mises à jour par lot des valeurs de champs)
- Mises à jour de la configuration ou de la logique interne des plugins

Le moment d'exécution des Migrations est divisé en trois catégories :

| Type | Moment de déclenchement | Scénario d'exécution |
|------|-------------------------|----------------------|
| `beforeLoad` | Avant le chargement de toutes les configurations de plugins | |
| `afterSync`  | Après la synchronisation des configurations de tables avec la base de données (la structure des tables a déjà été modifiée) | |
| `afterLoad`  | Après le chargement de toutes les configurations de plugins | |

## Créer des fichiers de Migration

Les fichiers de Migration doivent être placés dans le répertoire `src/server/migrations/*.ts` du dossier de votre plugin. Le CLI NocoBase fournit la commande `nb scaffold migration` pour générer rapidement ces fichiers.

```bash
nb scaffold migration <name> --pkg <pkg> [--on <timing>]
```

Paramètres

| Paramètre | Description |
|-----------|-------------|
| `<name>` | Nom de la migration, obligatoire |
| `--pkg <pkg>` | Spécifie le nom du package du plugin, obligatoire |
| `--on <timing>` | Spécifie le moment d'exécution, options : `beforeLoad`, `afterSync`, `afterLoad` |

Exemple

```bash
$ nb scaffold migration update-ui --pkg @nocobase/plugin-client
```

Le chemin du fichier de migration généré est le suivant :

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Contenu initial du fichier :

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Écrivez votre logique de mise à niveau ici
  }
}
```

:::tip Astuce

`appVersion` est utilisé pour identifier la version ciblée par la mise à niveau. Les environnements dont la version est inférieure à celle spécifiée exécuteront cette migration.

:::

## Écrire une Migration

Dans les fichiers de Migration, vous pouvez accéder aux propriétés et API courantes suivantes via `this` pour manipuler facilement la base de données, les plugins et les instances d'application :

Propriétés courantes

- **`this.app`**
  Instance de l'application NocoBase actuelle. Peut être utilisée pour accéder aux services globaux, aux plugins ou à la configuration.
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**
  Instance du service de base de données, qui fournit des interfaces pour manipuler les modèles (Tables).
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**
  Instance du plugin actuel, qui peut être utilisée pour accéder aux méthodes personnalisées du plugin.
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**
  Instance de Sequelize, qui permet d'exécuter directement des requêtes SQL brutes ou des opérations transactionnelles.
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**
  QueryInterface de Sequelize, couramment utilisée pour modifier la structure des tables, par exemple pour ajouter des champs, supprimer des tables, etc.
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Exemple d'écriture d'une Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Utiliser queryInterface pour ajouter un champ
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Utiliser db pour accéder aux modèles de données
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Exécuter la méthode personnalisée du plugin
    await this.plugin.customMethod();
  }
}
```

En plus des propriétés courantes listées ci-dessus, la Migration offre également de nombreuses API. Pour une documentation détaillée, veuillez consulter l'[API de Migration](../../api/server/migration.md).

## Déclencher une Migration

L'exécution des Migrations est déclenchée par la commande de mise à niveau :

```bash
$ nb app upgrade
```

Lors de la mise à niveau, le système détermine l'ordre d'exécution en fonction du type de Migration et de la propriété `appVersion`.

## Tester une Migration

Lors du développement de plugins, il est recommandé d'utiliser un **Mock Server** pour vérifier que la migration s'exécute correctement, afin d'éviter d'endommager des données réelles.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nom du plugin
      version: '0.18.0-alpha.5', // Version avant la mise à niveau
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Écrivez la logique de vérification, par exemple, vérifiez si le champ existe, si la migration des données a réussi
  });
});
```

:::tip Astuce

L'utilisation d'un Mock Server permet de simuler rapidement des scénarios de mise à niveau et de vérifier l'ordre d'exécution des Migrations ainsi que les modifications de données.

:::

## Recommandations pour la pratique de développement

1. **Divisez vos Migrations**
   Essayez de générer un seul fichier de migration par mise à niveau pour maintenir l'atomicité et simplifier le dépannage.
2. **Spécifiez le moment d'exécution**
   Choisissez `beforeLoad`, `afterSync` ou `afterLoad` en fonction des objets manipulés, afin d'éviter de dépendre de modules non chargés.
3. **Gérez le versionnement**
   Utilisez `appVersion` pour spécifier clairement la version à laquelle la migration s'applique, afin d'éviter les exécutions répétées.
4. **Couverture de test**
   Validez la migration sur un Mock Server avant d'exécuter la mise à niveau dans un environnement réel.

## Liens connexes

- [Collections : Tables de données](./collections.md) — Définition de la structure des tables souvent ajustée dans les Migrations
- [Database : Opérations sur la base de données](./database.md) — API pour manipuler les données via `this.db` dans les Migrations
- [Plugin](./plugin.md) — Organisation et chargement des fichiers de Migration dans un plugin
- [Command : Ligne de commande](./command.md) — Déclenchement des migrations via `nb app upgrade` et `nb scaffold migration`
- [Test](./test.md) — Test de l'exécution des Migrations avec Mock Server
- [API de Migration](../../api/server/migration.md) — Référence complète de l'API de la classe Migration
