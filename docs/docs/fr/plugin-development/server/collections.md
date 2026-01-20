:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Collections

Dans le développement de **plugins** NocoBase, la **collection** (table de données) est l'un des concepts les plus fondamentaux. Vous pouvez ajouter ou modifier des structures de tables de données dans les **plugins** en définissant ou en étendant des **collections**. Contrairement aux tables de données créées via l'interface de gestion des **sources de données**, les **collections** définies par code sont généralement des tables de métadonnées au niveau du système et n'apparaîtront pas dans la liste de gestion des **sources de données**.

## Définir des tables de données

Conformément à la structure de répertoire conventionnelle, les fichiers de **collection** doivent être placés dans le répertoire `./src/server/collections`. Utilisez `defineCollection()` pour créer de nouvelles tables et `extendCollection()` pour étendre des tables existantes.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Exemple d\'articles',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Titre', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Contenu' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Auteur' },
    },
  ],
});
```

Dans l'exemple ci-dessus :

- `name` : Le nom de la table (une table portant le même nom sera automatiquement générée dans la base de données).
- `title` : Le nom d'affichage de la table dans l'interface.
- `fields` : La collection de champs, chaque champ comprenant des attributs tels que `type`, `name`, etc.

Lorsque vous avez besoin d'ajouter des champs ou de modifier des configurations pour les **collections** d'autres **plugins**, vous pouvez utiliser `extendCollection()` :

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Après l'activation du **plugin**, le système ajoutera automatiquement le champ `isPublished` à la table `articles` existante.

:::tip
Le répertoire conventionnel sera chargé avant l'exécution de toutes les méthodes `load()` des **plugins**, évitant ainsi les problèmes de dépendance causés par le non-chargement de certaines tables de données.
:::

## Synchronisation de la structure de la base de données

Lors de la première activation d'un **plugin**, le système synchronise automatiquement les configurations de **collection** avec la structure de la base de données. Si le **plugin** est déjà installé et en cours d'exécution, après avoir ajouté ou modifié des **collections**, vous devrez exécuter manuellement la commande de mise à niveau :

```bash
yarn nocobase upgrade
```

En cas d'exceptions ou de données corrompues pendant la synchronisation, vous pouvez reconstruire la structure de la table en réinstallant l'application :

```bash
yarn nocobase install -f
```

## Génération automatique de ressources

Après avoir défini une **collection**, le système génère automatiquement une ressource correspondante, sur laquelle vous pouvez directement effectuer des opérations CRUD via l'API. Pour plus de détails, consultez [Gestionnaire de ressources](./resource-manager.md).