:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Database

`Database` est un composant essentiel des sources de données de base de données (`DataSource`). Chaque source de données de base de données possède une instance `Database` correspondante, accessible via `dataSource.db`. L'instance de base de données de la source de données principale offre également l'alias pratique `app.db`. Bien connaître les méthodes courantes de `db` est fondamental pour le développement de plugins côté serveur.

## Composants de Database

Un `Database` typique se compose des éléments suivants :

- **Collection** : Définit la structure des tables de données.
- **Model** : Correspond aux modèles ORM (généralement gérés par Sequelize).
- **Repository** : La couche de dépôt qui encapsule la logique d'accès aux données, offrant des méthodes d'opération de plus haut niveau.
- **FieldType** : Types de champs.
- **FilterOperator** : Opérateurs utilisés pour le filtrage.
- **Event** : Événements de cycle de vie et événements de base de données.

## Moment d'utilisation dans les plugins

### Ce qu'il convient de faire pendant l'étape `beforeLoad`

À cette étape, les opérations de base de données ne sont pas autorisées. Elle est appropriée pour l'enregistrement de classes statiques ou l'écoute d'événements.

- `db.registerFieldTypes()` — Types de champs personnalisés
- `db.registerModels()` — Enregistrer des classes de modèles personnalisées
- `db.registerRepositories()` — Enregistrer des classes de dépôts personnalisées
- `db.registerOperators()` — Enregistrer des opérateurs de filtre personnalisés
- `db.on()` — Écouter les événements liés à la base de données

### Ce qu'il convient de faire pendant l'étape `load`

À cette étape, toutes les définitions de classes et les événements précédents ont été chargés, de sorte que le chargement des tables de données ne présentera aucune omission.

- `db.defineCollection()` — Définir de nouvelles tables de données
- `db.extendCollection()` — Étendre les configurations de tables de données existantes

Pour la définition des tables intégrées aux plugins, il est recommandé de les placer dans le répertoire `./src/server/collections`. Pour plus de détails, consultez [Collections](./collections.md).

## Opérations sur les données

`Database` offre deux méthodes principales pour accéder et manipuler les données :

### Opérations via le Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

La couche Repository est généralement utilisée pour encapsuler la logique métier, telle que la pagination, le filtrage, les vérifications de permissions, etc.

### Opérations via le Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

La couche Model correspond directement aux entités ORM et est adaptée aux opérations de base de données de plus bas niveau.

## Quelles étapes autorisent les opérations de base de données ?

### Cycle de vie des plugins

| Étape | Opérations de base de données autorisées |
|------|------------------------------------|
| `staticImport` | Non |
| `afterAdd` | Non |
| `beforeLoad` | Non |
| `load` | Non |
| `install` | Oui |
| `beforeEnable` | Oui |
| `afterEnable` | Oui |
| `beforeDisable` | Oui |
| `afterDisable` | Oui |
| `remove` | Oui |
| `handleSyncMessage` | Oui |

### Événements de l'application

| Étape | Opérations de base de données autorisées |
|------|------------------------------------|
| `beforeLoad` | Non |
| `afterLoad` | Non |
| `beforeStart` | Oui |
| `afterStart` | Oui |
| `beforeInstall` | Non |
| `afterInstall` | Oui |
| `beforeStop` | Oui |
| `afterStop` | Non |
| `beforeDestroy` | Oui |
| `afterDestroy` | Non |
| `beforeLoadPlugin` | Non |
| `afterLoadPlugin` | Non |
| `beforeEnablePlugin` | Oui |
| `afterEnablePlugin` | Oui |
| `beforeDisablePlugin` | Oui |
| `afterDisablePlugin` | Oui |
| `afterUpgrade` | Oui |

### Événements/Hooks de la base de données

| Étape | Opérations de base de données autorisées |
|------|------------------------------------|
| `beforeSync` | Non |
| `afterSync` | Oui |
| `beforeValidate` | Oui |
| `afterValidate` | Oui |
| `beforeCreate` | Oui |
| `afterCreate` | Oui |
| `beforeUpdate` | Oui |
| `afterUpdate` | Oui |
| `beforeSave` | Oui |
| `afterSave` | Oui |
| `beforeDestroy` | Oui |
| `afterDestroy` | Oui |
| `afterCreateWithAssociations` | Oui |
| `afterUpdateWithAssociations` | Oui |
| `afterSaveWithAssociations` | Oui |
| `beforeDefineCollection` | Non |
| `afterDefineCollection` | Non |
| `beforeRemoveCollection` | Non |
| `afterRemoveCollection` | Non |