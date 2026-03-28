:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/data-source).
:::

# ctx.dataSource

L'instance `DataSource` liée au contexte d'exécution RunJS actuel, utilisée pour accéder aux collections, aux métadonnées des champs et pour gérer les configurations des collections **au sein de la source de données actuelle**. Elle correspond généralement à la source de données sélectionnée pour la page ou le bloc actuel (par exemple, la base de données principale `main`).

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Opérations sur une source de données unique** | Obtenir les métadonnées des collections et des champs lorsque la source de données actuelle est connue. |
| **Gestion des collections** | Obtenir, ajouter, mettre à jour ou supprimer des collections sous la source de données actuelle. |
| **Obtenir des champs par chemin** | Utiliser le format `nomCollection.cheminChamp` pour obtenir les définitions de champs (prend en charge les chemins d'association). |

> Remarque : `ctx.dataSource` représente une source de données unique pour le contexte actuel. Pour énumérer ou accéder à d'autres sources de données, veuillez utiliser [ctx.dataSourceManager](./data-source-manager.md).

## Définition du type

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Propriétés en lecture seule
  get flowEngine(): FlowEngine;   // Instance FlowEngine actuelle
  get displayName(): string;      // Nom d'affichage (prend en charge l'i18n)
  get key(): string;              // Clé de la source de données, ex : 'main'
  get name(): string;             // Identique à la clé

  // Lecture des collections
  getCollections(): Collection[];                      // Obtenir toutes les collections
  getCollection(name: string): Collection | undefined; // Obtenir une collection par son nom
  getAssociation(associationName: string): CollectionField | undefined; // Obtenir un champ d'association (ex : users.roles)

  // Gestion des collections
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Métadonnées des champs
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Propriétés communes

| Propriété | Type | Description |
|------|------|------|
| `key` | `string` | Clé de la source de données, ex : `'main'` |
| `name` | `string` | Identique à la clé |
| `displayName` | `string` | Nom d'affichage (prend en charge l'i18n) |
| `flowEngine` | `FlowEngine` | Instance FlowEngine actuelle |

## Méthodes communes

| Méthode | Description |
|------|------|
| `getCollections()` | Récupère toutes les collections de la source de données actuelle (triées, avec les collections masquées filtrées). |
| `getCollection(name)` | Récupère une collection par son nom ; `name` peut être `nomCollection.nomChamp` pour obtenir la collection cible d'une association. |
| `getAssociation(associationName)` | Récupère la définition d'un champ d'association par `nomCollection.nomChamp`. |
| `getCollectionField(fieldPath)` | Récupère la définition d'un champ par `nomCollection.cheminChamp`, prenant en charge les chemins d'association comme `users.profile.avatar`. |

## Relation avec ctx.dataSourceManager

| Besoin | Utilisation recommandée |
|------|----------|
| **Source de données unique liée au contexte actuel** | `ctx.dataSource` |
| **Point d'entrée pour toutes les sources de données** | `ctx.dataSourceManager` |
| **Obtenir une collection dans la source de données actuelle** | `ctx.dataSource.getCollection(name)` |
| **Obtenir une collection à travers les sources de données** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obtenir un champ dans la source de données actuelle** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obtenir un champ à travers les sources de données** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exemple

### Obtenir des collections et des champs

```ts
// Obtenir toutes les collections
const collections = ctx.dataSource.getCollections();

// Obtenir une collection par son nom
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Obtenir la définition du champ par "nomCollection.cheminChamp" (prend en charge les associations)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Obtenir des champs d'association

```ts
// Obtenir la définition d'un champ d'association par nomCollection.nomChamp
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Traitement basé sur la structure de la collection cible
}
```

### Parcourir les collections pour un traitement dynamique

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Effectuer une validation ou une UI dynamique basée sur les métadonnées du champ

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Effectuer la logique d'UI ou la validation basée sur l'interface, l'énumération, la validation, etc.
}
```

## Remarques

- Le format du chemin pour `getCollectionField(fieldPath)` est `nomCollection.cheminChamp`, où le premier segment est le nom de la collection et les segments suivants constituent le chemin du champ (prend en charge les associations, ex : `user.name`).
- `getCollection(name)` prend en charge le format `nomCollection.nomChamp`, retournant la collection cible du champ d'association.
- Dans le contexte RunJS, `ctx.dataSource` est généralement déterminé par la source de données du bloc ou de la page actuelle. Si aucune source de données n'est liée au contexte, il peut être `undefined` ; il est recommandé d'effectuer une vérification de valeur nulle avant utilisation.

## Voir aussi

- [ctx.dataSourceManager](./data-source-manager.md) : Gestionnaire de sources de données, gère toutes les sources de données.
- [ctx.collection](./collection.md) : La collection associée au contexte actuel.
- [ctx.collectionField](./collection-field.md) : La définition du champ de collection pour le champ actuel.