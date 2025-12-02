:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Contexte

Dans NocoBase, chaque requête génère un objet `ctx`, qui est une instance de Contexte. Le Contexte encapsule les informations de la requête et de la réponse, tout en offrant des fonctionnalités spécifiques à NocoBase, telles que l'accès à la base de données, les opérations de cache, la gestion des permissions, l'internationalisation et la journalisation.

L'`Application` de NocoBase est basée sur Koa. Par conséquent, `ctx` est essentiellement un Contexte Koa, mais NocoBase l'étend avec de riches API, permettant aux développeurs de gérer facilement la logique métier dans les Middleware et les Actions. Chaque requête possède son propre `ctx` indépendant, ce qui garantit l'isolation et la sécurité des données entre les requêtes.

## ctx.action

`ctx.action` vous donne accès à l'Action en cours d'exécution pour la requête actuelle. Il inclut :

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Affiche le nom de l'Action actuelle
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Prise en charge de l'internationalisation (i18n).

- `ctx.i18n` fournit les informations de locale (paramètres régionaux).
- `ctx.t()` est utilisé pour traduire des chaînes de caractères en fonction de la langue.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Renvoie la traduction basée sur la langue de la requête
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` fournit une interface d'accès à la base de données, vous permettant d'opérer directement sur les modèles et d'exécuter des requêtes.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` offre des opérations de cache, prenant en charge la lecture et l'écriture dans le cache. Il est couramment utilisé pour accélérer l'accès aux données ou pour sauvegarder un état temporaire.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Met en cache pendant 60 secondes
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` est l'instance de l'application NocoBase, vous permettant d'accéder à la configuration globale, aux plugins et aux services.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Vérifiez la console pour l\'application';
});
```

## ctx.auth.user

`ctx.auth.user` récupère les informations de l'utilisateur actuellement authentifié, ce qui est utile pour les vérifications de permissions ou la logique métier.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` est utilisé pour partager des données au sein de la chaîne de middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` offre des capacités de journalisation, prenant en charge la sortie de logs à plusieurs niveaux.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` est utilisé pour la gestion des permissions, et `ctx.can()` permet de vérifier si l'utilisateur actuel a la permission d'exécuter une certaine opération.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Résumé

- Chaque requête correspond à un objet `ctx` indépendant.
- `ctx` est une extension du Contexte Koa, intégrant les fonctionnalités de NocoBase.
- Les propriétés courantes incluent : `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, etc.
- L'utilisation de `ctx` dans les Middleware et les Actions facilite la manipulation des requêtes, des réponses, des permissions, des logs et de la base de données.