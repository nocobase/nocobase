---
title: "Définition des Collections"
description: "Définition des Collections dans les plugins NocoBase : defineCollection, extendCollection, fields, convention de répertoire src/server/collections."
keywords: "Collections,defineCollection,extendCollection,table de données,définition de Collection,NocoBase"
---

# Collections - tables de données

Dans le développement de plugins NocoBase, la **Collection (table de données)** est l'un des concepts les plus fondamentaux. Vous pouvez ajouter ou modifier la structure des tables d'un plugin en définissant ou en étendant des Collections. Contrairement aux tables créées via l'interface « Gestion des sources de données », **les Collections définies par code sont en général des tables de métadonnées au niveau système** et n'apparaissent pas dans la liste de gestion des sources de données.

## Définir une table

Selon la convention de répertoire, les fichiers de Collection doivent être placés dans `./src/server/collections`. Pour créer une nouvelle table, utilisez `defineCollection()` ; pour étendre une table existante, utilisez `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Articles d\'exemple',
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

- `name` : nom de la table (une table portant le même nom est générée automatiquement dans la base de données).  
- `title` : nom d'affichage de la table dans l'interface.  
- `fields` : ensemble des champs ; chaque champ contient des propriétés telles que `type`, `name`, etc.  

Lorsque vous avez besoin d'ajouter des champs ou de modifier la configuration de la Collection d'un autre plugin, utilisez `extendCollection()` :

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

Une fois le plugin activé, le système ajoute automatiquement le champ `isPublished` à la table `articles` existante.

:::tip Astuce

Les répertoires conventionnels sont chargés avant l'exécution de la méthode `load()` de tous les plugins, ce qui évite les problèmes de dépendance liés à des tables non encore chargées.

:::

## Aide-mémoire des types de champs

Dans les `fields` de `defineCollection`, le `type` détermine le type de colonne dans la base de données. Voici tous les types de champs intégrés :

### Texte

| type | Type en base | Description | Paramètres spécifiques |
|------|--------------|-------------|------------------------|
| `string` | VARCHAR(255) | Texte court | `length?: number` (longueur personnalisée), `trim?: boolean` |
| `text` | TEXT | Texte long | `length?: 'tiny' \| 'medium' \| 'long'` (MySQL uniquement) |

### Numérique

| type | Type en base | Description | Paramètres spécifiques |
|------|--------------|-------------|------------------------|
| `integer` | INTEGER | Entier | — |
| `bigInt` | BIGINT | Entier long | — |
| `float` | FLOAT | Nombre à virgule flottante | — |
| `double` | DOUBLE | Double précision | — |
| `decimal` | DECIMAL(p,s) | Nombre à virgule fixe | `precision: number`, `scale: number` |

### Booléen

| type | Type en base | Description |
|------|--------------|-------------|
| `boolean` | BOOLEAN | Valeur booléenne |

### Date et heure

| type | Type en base | Description | Paramètres spécifiques |
|------|--------------|-------------|------------------------|
| `date` | DATE(3) | Date et heure (avec millisecondes) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Date seule, sans heure | — |
| `time` | TIME | Heure seule | — |
| `unixTimestamp` | BIGINT | Timestamp Unix | `accuracy?: 'second' \| 'millisecond'` |

:::tip Astuce

`date` est le type de date le plus utilisé. Si vous devez distinguer la gestion du fuseau horaire, vous disposez aussi de `datetimeTz` (avec fuseau) et `datetimeNoTz` (sans fuseau).

:::

### Données structurées

| type | Type en base | Description | Paramètres spécifiques |
|------|--------------|-------------|------------------------|
| `json` | JSON / JSONB | Données JSON | `jsonb?: boolean` (utilise JSONB sous PostgreSQL) |
| `jsonb` | JSONB / JSON | Privilégie JSONB | — |
| `array` | ARRAY / JSON | Tableau | Sous PostgreSQL, le type ARRAY natif est disponible |

### Génération d'ID

| type | Type en base | Description | Paramètres spécifiques |
|------|--------------|-------------|------------------------|
| `uid` | VARCHAR(255) | ID court généré automatiquement | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (true par défaut) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (12 par défaut), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (true par défaut) |

### Types spéciaux

| type | Type en base | Description |
|------|--------------|-------------|
| `password` | VARCHAR(255) | Stocké automatiquement avec hash et sel |
| `virtual` | aucune colonne | Champ virtuel, ne crée pas de colonne en base |
| `context` | configurable | Rempli automatiquement depuis le contexte de la requête (par exemple `currentUser.id`) |

### Types de relation

Les champs de relation ne créent pas de colonnes en base, mais établissent des relations entre tables au niveau ORM :

| type | Description | Paramètres clés |
|------|-------------|-----------------|
| `belongsTo` | Plusieurs-à-un | `target` (table cible), `foreignKey` (clé étrangère) |
| `hasOne` | Un-à-un | `target`, `foreignKey` |
| `hasMany` | Un-à-plusieurs | `target`, `foreignKey` |
| `belongsToMany` | Plusieurs-à-plusieurs | `target`, `through` (table intermédiaire), `foreignKey`, `otherKey` |

Exemples d'utilisation des champs de relation :

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Plusieurs-à-un : un article appartient à un auteur
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Un-à-plusieurs : un article a plusieurs commentaires
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Plusieurs-à-plusieurs : un article a plusieurs tags
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // Nom de la table intermédiaire
    },
  ],
});
```

### Paramètres communs

Tous les champs de colonne prennent en charge les paramètres suivants :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Nom du champ (obligatoire) |
| `defaultValue` | `any` | Valeur par défaut |
| `allowNull` | `boolean` | Autoriser ou non `null` |
| `unique` | `boolean` | Champ unique ou non |
| `primaryKey` | `boolean` | Clé primaire ou non |
| `autoIncrement` | `boolean` | Auto-incrémenté ou non |
| `index` | `boolean` | Indexé ou non |
| `comment` | `string` | Commentaire du champ |

## Synchroniser la structure de la base

Lors de la première activation du plugin, le système synchronise automatiquement la configuration des Collections avec la structure de la base de données. Si le plugin est déjà installé et en cours d'exécution, après l'ajout ou la modification de Collections, vous devez exécuter manuellement la commande de mise à niveau :

```bash
yarn nocobase upgrade
```

En cas d'anomalie ou de données corrompues lors de la synchronisation, vous pouvez reconstruire la structure des tables en réinstallant l'application :

```bash
yarn nocobase install -f
```

Si la mise à niveau du plugin nécessite une migration des données existantes — par exemple renommer un champ, scinder une table ou remplir des valeurs par défaut —, utilisez les [scripts de migration](./migration.md) plutôt que de modifier la base de données à la main.

## Faire apparaître une Collection dans la liste des tables de l'UI

Une table définie via `defineCollection` est une table interne au serveur ; **par défaut elle n'apparaît pas** dans la liste de « Gestion des sources de données » et n'apparaît pas non plus dans la liste de sélection de table lors de l'« Ajout d'un bloc ».

**Approche recommandée** : ajoutez la table correspondante via « [Gestion des sources de données](../../data-sources/data-source-main/index.md) » dans l'interface NocoBase ; une fois les champs et les types d'interface configurés, la table apparaîtra automatiquement dans la liste de sélection de table des blocs.

![Sélectionner sa propre table lors de l'ajout d'un bloc](https://static-docs.nocobase.com/20260409143839.png)

S'il est vraiment nécessaire de l'enregistrer côté code (par exemple dans un scénario de démonstration de plugin), vous pouvez l'enregistrer manuellement dans le plugin client via `addCollection`. Attention : il faut impérativement passer par le mode `eventBus` ; vous ne pouvez pas l'appeler directement dans `load()` — `ensureLoaded()` videra et redéfinira l'ensemble des collections après `load()`. Voir l'exemple complet dans [Construire un plugin de gestion de données front-end + back-end](../client/examples/fullstack-plugin.md).

## Ressources (Resource) générées automatiquement

Une fois la Collection définie, NocoBase génère automatiquement des ressources REST API correspondantes : les opérations CRUD prêtes à l'emploi (`list`, `get`, `create`, `update`, `destroy`) ne nécessitent aucun code supplémentaire. Si les opérations CRUD intégrées ne suffisent pas — par exemple si vous avez besoin d'une API d' « import en lot » ou d' « agrégation statistique » —, vous pouvez enregistrer une action personnalisée via `resourceManager`. Voir [ResourceManager - gestion des ressources](./resource-manager.md) pour plus de détails.

## Liens connexes

- [Database](./database.md) — CRUD, Repository, transactions et événements de base de données
- [DataSourceManager - gestion des sources de données](./data-source-manager.md) — Gérer plusieurs sources de données et leurs collections
- [Migration de données](./migration.md) — Scripts de migration de données lors de la mise à niveau d'un plugin
- [Plugin](./plugin.md) — Cycle de vie d'une classe de plugin, méthodes membres et objet `app`
- [ResourceManager - gestion des ressources](./resource-manager.md) — API REST personnalisées et handlers d'action
- [Construire un plugin de gestion de données front-end + back-end](../client/examples/fullstack-plugin.md) — Exemple complet defineCollection + addCollection
- [Structure du projet](../project-structure.md) — Détail de la convention du répertoire `src/server/collections`
