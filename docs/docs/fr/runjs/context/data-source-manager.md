# ctx.dataSourceManager

Le gestionnaire de sources de données (instance de `DataSourceManager`) est utilisé pour gérer et accéder à plusieurs sources de données (par exemple, la base de données principale `main`, la base de données de journaux `logging`, etc.). Il est utilisé lorsque plusieurs sources de données existent ou lorsqu'un accès aux métadonnées entre plusieurs sources de données est requis.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Multi-sources de données** | Énumérer toutes les sources de données ou obtenir une source de données spécifique par sa clé. |
| **Accès multi-sources** | Accéder aux métadonnées en utilisant le format « clé de la source de données + nom de la collection » lorsque la source de données du contexte actuel est inconnue. |
| **Obtenir un champ par chemin complet** | Utiliser le format `dataSourceKey.collectionName.fieldPath` pour récupérer les définitions de champs à travers différentes sources de données. |

> **Remarque :** Si vous travaillez uniquement sur la source de données actuelle, utilisez de préférence `ctx.dataSource`. Utilisez `ctx.dataSourceManager` uniquement lorsque vous avez besoin d'énumérer ou de basculer entre les sources de données.

## Définition du type

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Gestion des sources de données
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Lecture des sources de données
  getDataSources(): DataSource[];                     // Obtenir toutes les sources de données
  getDataSource(key: string): DataSource | undefined;  // Obtenir une source de données par sa clé

  // Accès direct aux métadonnées par source de données + collection
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relation avec ctx.dataSource

| Besoin | Utilisation recommandée |
|------|----------|
| **Source de données unique liée au contexte actuel** | `ctx.dataSource` (ex: source de données de la page ou du bloc actuel) |
| **Point d'entrée pour toutes les sources de données** | `ctx.dataSourceManager` |
| **Lister ou changer de source de données** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Obtenir une collection dans la source de données actuelle** | `ctx.dataSource.getCollection(name)` |
| **Obtenir une collection à travers les sources de données** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obtenir un champ dans la source de données actuelle** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obtenir un champ à travers les sources de données** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exemples

### Obtenir une source de données spécifique

```ts
// Obtenir la source de données nommée 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Obtenir toutes les collections de cette source de données
const collections = mainDS?.getCollections();
```

### Accéder aux métadonnées d'une collection à travers les sources de données

```ts
// Obtenir une collection par dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Obtenir la clé primaire de la collection
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Obtenir la définition d'un champ par son chemin complet

```ts
// Format : dataSourceKey.collectionName.fieldPath
// Obtenir la définition du champ par « clé de la source de données.nom de la collection.chemin du champ »
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Prend en charge les chemins de champs d'association
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Parcourir toutes les sources de données

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Source de données : ${ds.key}, Nom d'affichage : ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collection : ${col.name}`);
  }
}
```

### Sélectionner dynamiquement une source de données basée sur des variables

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Précautions

- Le format du chemin pour `getCollectionField` est `dataSourceKey.collectionName.fieldPath`, où le premier segment est la clé de la source de données, suivi du nom de la collection et du chemin du champ.
- `getDataSource(key)` retourne `undefined` si la source de données n'existe pas ; il est recommandé d'effectuer une vérification de valeur nulle avant utilisation.
- `addDataSource` lèvera une exception si la clé existe déjà ; `upsertDataSource` écrasera la source existante ou en ajoutera une nouvelle.

## Voir aussi

- [ctx.dataSource](./data-source.md) : Instance de la source de données actuelle
- [ctx.collection](./collection.md) : Collection associée au contexte actuel
- [ctx.collectionField](./collection-field.md) : Définition du champ de collection pour le champ actuel