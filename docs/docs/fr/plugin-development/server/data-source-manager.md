:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# DataSourceManager : Gestion des Sources de Données

NocoBase met à votre disposition le `DataSourceManager` pour gérer plusieurs sources de données. Chaque `DataSource` possède ses propres instances de `Database`, de `ResourceManager` et d'ACL, ce qui permet aux développeurs de gérer et d'étendre plusieurs sources de données de manière flexible.

## Concepts de base

Chaque instance de `DataSource` contient les éléments suivants :

- **`dataSource.collectionManager`** : Utilisé pour gérer les collections et les champs.
- **`dataSource.resourceManager`** : Gère les opérations liées aux ressources (par exemple, la création, la lecture, la mise à jour, la suppression, etc.).
- **`dataSource.acl`** : Le contrôle d'accès (ACL) pour les opérations sur les ressources.

Pour un accès plus pratique, des alias sont fournis pour les membres de la source de données principale :

- `app.db` équivaut à `dataSourceManager.get('main').collectionManager.db`
- `app.acl` équivaut à `dataSourceManager.get('main').acl`
- `app.resourceManager` équivaut à `dataSourceManager.get('main').resourceManager`

## Méthodes courantes

### dataSourceManager.get(dataSourceKey)

Cette méthode renvoie l'instance `DataSource` spécifiée.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Enregistre un middleware pour toutes les sources de données. Cela affectera les opérations sur toutes les sources de données.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('Ce middleware s\'applique à toutes les sources de données.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

S'exécute avant le chargement d'une source de données. Couramment utilisé pour l'enregistrement de classes statiques, telles que les classes de modèles et l'enregistrement de types de champs :

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Type de champ personnalisé
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

S'exécute après le chargement d'une source de données. Couramment utilisé pour enregistrer des opérations, définir le contrôle d'accès, etc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Définir les permissions d'accès
});
```

## Extension des sources de données

Pour une extension complète des sources de données, veuillez vous référer au chapitre sur l'[extension des sources de données](#).