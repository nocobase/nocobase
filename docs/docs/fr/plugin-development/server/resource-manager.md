:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ResourceManager

La fonctionnalité de gestion des ressources de NocoBase peut convertir automatiquement les collections et les associations existantes en ressources. Elle intègre également plusieurs types d'opérations pour vous aider à construire rapidement des opérations de ressources pour les API REST. Contrairement aux API REST traditionnelles, les opérations de ressources de NocoBase ne dépendent pas des méthodes de requête HTTP, mais déterminent l'opération spécifique à exécuter via des définitions explicites de `:action`.

## Génération automatique de ressources

NocoBase convertit automatiquement les `collection` et les `association` définies dans la base de données en ressources. Par exemple, si vous définissez deux collections, `posts` et `tags` :

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Ceci générera automatiquement les ressources suivantes :

*   ressource `posts`
*   ressource `tags`
*   ressource d'association `posts.tags`

Exemples de requêtes :

| Méthode | Chemin                     | Opération              |
| -------- | -------------------------- | ---------------------- |
| `GET`    | `/api/posts:list`          | Lister                 |
| `GET`    | `/api/posts:get/1`         | Obtenir un élément     |
| `POST`   | `/api/posts:create`        | Créer                  |
| `POST`   | `/api/posts:update/1`      | Mettre à jour          |
| `POST`   | `/api/posts:destroy/1`     | Supprimer              |

| Méthode | Chemin                     | Opération              |
| -------- | -------------------------- | ---------------------- |
| `GET`    | `/api/tags:list`           | Lister                 |
| `GET`    | `/api/tags:get/1`          | Obtenir un élément     |
| `POST`   | `/api/tags:create`         | Créer                  |
| `POST`   | `/api/tags:update/1`       | Mettre à jour          |
| `POST`   | `/api/tags:destroy/1`      | Supprimer              |

| Méthode | Chemin                             | Opération                                        |
| -------- | ---------------------------------- | ------------------------------------------------ |
| `GET`    | `/api/posts/1/tags:list`           | Interroger tous les `tags` associés à un `post`  |
| `GET`    | `/api/posts/1/tags:get/1`          | Interroger un seul `tag` sous un `post`          |
| `POST`   | `/api/posts/1/tags:create`         | Créer un seul `tag` sous un `post`               |
| `POST`   | `/api/posts/1/tags:update/1`       | Mettre à jour un seul `tag` sous un `post`       |
| `POST`   | `/api/posts/1/tags:destroy/1`      | Supprimer un seul `tag` sous un `post`           |
| `POST`   | `/api/posts/1/tags:add`            | Ajouter des `tags` associés à un `post`          |
| `POST`   | `/api/posts/1/tags:remove`         | Supprimer des `tags` associés d'un `post`        |
| `POST`   | `/api/posts/1/tags:set`            | Définir tous les `tags` associés pour un `post`  |
| `POST`   | `/api/posts/1/tags:toggle`         | Basculer l'association des `tags` pour un `post` |

:::tip Astuce

Les opérations de ressources NocoBase ne dépendent pas directement des méthodes de requête, mais déterminent les opérations via des définitions explicites de `:action`.

:::

## Opérations sur les ressources

NocoBase propose de nombreux types d'opérations intégrées pour répondre à divers besoins métier.

### Opérations CRUD de base

| Nom de l'opération | Description                                   | Types de ressources applicables | Méthode de requête | Exemple de chemin                   |
| ------------------ | --------------------------------------------- | ------------------------------- | ------------------ | ----------------------------------- |
| `list`             | Interroge les données d'une liste             | Toutes                          | GET/POST           | `/api/posts:list`                   |
| `get`              | Interroge un seul enregistrement              | Toutes                          | GET/POST           | `/api/posts:get/1`                  |
| `create`           | Crée un nouvel enregistrement                 | Toutes                          | POST               | `/api/posts:create`                 |
| `update`           | Met à jour un enregistrement                  | Toutes                          | POST               | `/api/posts:update/1`               |
| `destroy`          | Supprime un enregistrement                    | Toutes                          | POST               | `/api/posts:destroy/1`              |
| `firstOrCreate`    | Trouve le premier enregistrement, le crée s'il n'existe pas | Toutes                          | POST               | `/api/users:firstOrCreate`          |
| `updateOrCreate`   | Met à jour un enregistrement, le crée s'il n'existe pas | Toutes                          | POST               | `/api/users:updateOrCreate`         |

### Opérations de relation

| Nom de l'opération | Description                   | Types de relations applicables                            | Exemple de chemin                   |
| ------------------ | ----------------------------- | --------------------------------------------------------- | ----------------------------------- |
| `add`              | Ajoute une association        | `hasMany`, `belongsToMany`                                | `/api/posts/1/tags:add`             |
| `remove`           | Supprime une association      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo`         | `/api/posts/1/comments:remove`      |
| `set`              | Réinitialise une association  | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo`         | `/api/posts/1/comments:set`         |
| `toggle`           | Ajoute ou supprime une association | `belongsToMany`                                           | `/api/posts/1/tags:toggle`          |

### Paramètres d'opération

Les paramètres d'opération courants incluent :

*   `filter` : Conditions de requête
*   `values` : Valeurs à définir
*   `fields` : Spécifie les champs à retourner
*   `appends` : Inclut les données associées
*   `except` : Exclut les champs
*   `sort` : Règles de tri
*   `page`, `pageSize` : Paramètres de pagination
*   `paginate` : Indique si la pagination est activée
*   `tree` : Indique si une structure arborescente doit être retournée
*   `whitelist`, `blacklist` : Liste blanche/noire de champs
*   `updateAssociationValues` : Indique si les valeurs d'association doivent être mises à jour

---

## Opérations de ressources personnalisées

NocoBase permet d'enregistrer des opérations supplémentaires pour les ressources existantes. Vous pouvez utiliser `registerActionHandlers` pour personnaliser les opérations pour toutes les ressources ou pour des ressources spécifiques.

### Enregistrer des opérations globales

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Enregistrer des opérations spécifiques à une ressource

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Exemples de requêtes :

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Règle de nommage : `resourceName:actionName`. Utilisez la syntaxe à points (`posts.comments`) lorsque vous incluez des associations.

## Ressources personnalisées

Si vous avez besoin de fournir des ressources qui ne sont pas liées à des collections, vous pouvez les définir en utilisant la méthode `resourceManager.define` :

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Les méthodes de requête sont cohérentes avec les ressources générées automatiquement :

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (prend en charge GET/POST par défaut)

## Middleware personnalisé

Utilisez la méthode `resourceManager.use()` pour enregistrer un middleware global. Par exemple :

Middleware de journalisation global

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Propriétés de contexte spéciales

Le fait de pouvoir accéder au middleware ou à l'action de la couche `resourceManager` signifie que la ressource existe nécessairement.

### ctx.action

*   `ctx.action.actionName` : Nom de l'opération
*   `ctx.action.resourceName` : Peut être une collection ou une association
*   `ctx.action.params` : Paramètres de l'opération

### ctx.dataSource

L'objet source de données actuel.

### ctx.getCurrentRepository()

L'objet repository actuel.

## Comment obtenir les objets resourceManager pour différentes sources de données

Le `resourceManager` appartient à une source de données, et vous pouvez enregistrer des opérations séparément pour différentes sources de données.

### Source de données principale

Pour la source de données principale, vous pouvez utiliser directement `app.resourceManager` :

```ts
app.resourceManager.registerActionHandlers();
```

### Autres sources de données

Pour les autres sources de données, vous pouvez obtenir une instance de source de données spécifique via `dataSourceManager` et utiliser le `resourceManager` de cette instance :

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Parcourir toutes les sources de données

Si vous devez effectuer les mêmes opérations sur toutes les sources de données ajoutées, vous pouvez utiliser la méthode `dataSourceManager.afterAddDataSource` pour itérer, en vous assurant que le `resourceManager` de chaque source de données peut enregistrer les opérations correspondantes :

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```