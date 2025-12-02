:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Middleware

Le middleware du serveur NocoBase est, par essence, un **middleware Koa**. Vous pouvez manipuler l'objet `ctx` pour traiter les requêtes et les réponses, exactement comme vous le feriez avec Koa. Cependant, NocoBase doit gérer la logique de différentes couches métier. Si tous les middlewares étaient regroupés, leur maintenance et leur gestion deviendraient très complexes.

C'est pourquoi NocoBase a structuré le middleware en **quatre niveaux** distincts :

1.  **Middleware de niveau source de données** : `app.dataSourceManager.use()`  
    Ce middleware s'applique uniquement aux requêtes d'une **source de données spécifique**. Il est couramment utilisé pour gérer la connexion à la base de données, la validation des champs ou la logique de traitement des transactions pour cette source de données.

2.  **Middleware de niveau ressource** : `app.resourceManager.use()`  
    Il n'est actif que pour les ressources (Resource) que vous avez définies et convient parfaitement pour gérer la logique spécifique aux ressources, telle que les permissions d'accès aux données ou le formatage.

3.  **Middleware de niveau permission** : `app.acl.use()`  
    Ce middleware s'exécute avant toute vérification de permission. Il sert à valider les permissions ou les rôles des utilisateurs.

4.  **Middleware de niveau application** : `app.use()`  
    Il s'exécute pour chaque requête et est idéal pour des tâches telles que la journalisation (logging), la gestion générale des erreurs ou le traitement des réponses.

## Enregistrement du middleware

Vous enregistrez généralement le middleware dans la méthode `load` de votre plugin, par exemple :

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware de niveau application
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware de source de données
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware de permissions
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware de ressources
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Ordre d'exécution

Voici l'ordre d'exécution des middlewares :

1.  Exécution du middleware de permissions ajouté via `acl.use()`
2.  Puis, exécution du middleware de ressources ajouté via `resourceManager.use()`
3.  Ensuite, exécution du middleware de source de données ajouté via `dataSourceManager.use()`
4.  Enfin, exécution du middleware d'application ajouté via `app.use()`

## Mécanisme d'insertion before / after / tag

Pour vous offrir un contrôle plus flexible sur l'ordre d'exécution des middlewares, NocoBase met à votre disposition les paramètres `before`, `after` et `tag` :

-   **tag** : Permet de marquer un middleware afin qu'il puisse être référencé par d'autres middlewares ultérieurs.
-   **before** : Insère le middleware *avant* celui qui est identifié par le tag spécifié.
-   **after** : Insère le middleware *après* celui qui est identifié par le tag spécifié.

Exemple :

```ts
// Middleware standard
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 sera placé avant m1
app.use(m4, { before: 'restApi' });

// m5 sera inséré entre m2 et m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Si vous ne spécifiez pas de position, l'ordre d'exécution par défaut pour les middlewares nouvellement ajoutés est le suivant :  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Exemple du modèle en oignon

L'ordre d'exécution du middleware suit le **modèle en oignon** de Koa : les middlewares entrent dans la pile les uns après les autres, puis en sortent dans l'ordre inverse.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Voici des exemples de séquences de sortie pour différentes requêtes :

-   **Requête standard** : `/api/hello`  
    Sortie : `[1,2]` (La ressource n'étant pas définie, les middlewares `resourceManager` et `acl` ne sont pas exécutés.)

-   **Requête de ressource** : `/api/test:list`  
    Sortie : `[5,3,7,1,2,8,4,6]`  
    Ici, les middlewares s'exécutent selon l'ordre des couches et le modèle en oignon.

## Résumé

-   Le middleware NocoBase est une extension du middleware Koa.
-   Il est structuré en quatre niveaux : Application -> Source de données -> Ressource -> Permission.
-   Vous pouvez utiliser `before`, `after` et `tag` pour contrôler l'ordre d'exécution de manière flexible.
-   Il suit le modèle en oignon de Koa, ce qui garantit que les middlewares sont composables et peuvent être imbriqués.
-   Le middleware de niveau source de données n'affecte que les requêtes ciblant une source de données spécifique, tandis que le middleware de niveau ressource s'applique uniquement aux requêtes de ressources définies.