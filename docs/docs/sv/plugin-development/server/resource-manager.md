:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Resurshanteraren

NocoBase:s resurshanteringsfunktion kan automatiskt omvandla befintliga datatabeller (samlingar) och associationer till resurser, och har inbyggda operationstyper som hjälper utvecklare att snabbt bygga REST API-resursoperationer. Till skillnad från traditionella REST API:er förlitar sig NocoBase:s resursoperationer inte på HTTP-förfrågningsmetoder, utan bestämmer den specifika operationen som ska utföras genom att explicit definiera `:action`.

## Automatisk resursgenerering

NocoBase omvandlar automatiskt `samlingar` och `associationer` som definieras i databasen till resurser. Till exempel, om ni definierar två samlingar, `posts` och `tags`:

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

Detta kommer automatiskt att generera följande resurser:

*   `posts`-resurs
*   `tags`-resurs
*   `posts.tags`-associationsresurs

Exempel på förfrågningar:

| Förfrågningsmetod | Sökväg                     | Operation     |
| ---------------- | -------------------------- | ------------- |
| `GET`            | `/api/posts:list`          | Hämta lista   |
| `GET`            | `/api/posts:get/1`         | Hämta enstaka |
| `POST`           | `/api/posts:create`        | Skapa ny      |
| `POST`           | `/api/posts:update/1`      | Uppdatera     |
| `POST`           | `/api/posts:destroy/1`     | Radera        |

| Förfrågningsmetod | Sökväg                     | Operation     |
| ---------------- | -------------------------- | ------------- |
| `GET`            | `/api/tags:list`           | Hämta lista   |
| `GET`            | `/api/tags:get/1`          | Hämta enstaka |
| `POST`           | `/api/tags:create`         | Skapa ny      |
| `POST`           | `/api/tags:update/1`       | Uppdatera     |
| `POST`           | `/api/tags:destroy/1`      | Radera        |

| Förfrågningsmetod | Sökväg                             | Operation                                   |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| `GET`            | `/api/posts/1/tags:list`           | Hämta alla `tags` associerade med ett `post`  |
| `GET`            | `/api/posts/1/tags:get/1`          | Hämta en enstaka `tag` under ett `post`       |
| `POST`           | `/api/posts/1/tags:create`         | Skapa en enstaka `tag` under ett `post`       |
| `POST`           | `/api/posts/1/tags:update/1`       | Uppdatera en enstaka `tag` under ett `post`   |
| `POST`           | `/api/posts/1/tags:destroy/1`      | Radera en enstaka `tag` under ett `post`      |
| `POST`           | `/api/posts/1/tags:add`            | Lägg till associerade `tags` till ett `post`  |
| `POST`           | `/api/posts/1/tags:remove`         | Ta bort associerade `tags` från ett `post`    |
| `POST`           | `/api/posts/1/tags:set`            | Ställ in alla associerade `tags` för ett `post` |
| `POST`           | `/api/posts/1/tags:toggle`         | Växla `tags`-association för ett `post`       |

:::tip Tips

NocoBase:s resursoperationer är inte direkt beroende av förfrågningsmetoder, utan bestämmer operationer genom explicita `:action`-definitioner.

:::

## Resursoperationer

NocoBase tillhandahåller ett brett utbud av inbyggda operationstyper för att möta olika affärsbehov.

### Grundläggande CRUD-operationer

| Operationsnamn   | Beskrivning                           | Tillämpliga resurstyper | Förfrågningsmetod | Exempel på sökväg           |
| ---------------- | ------------------------------------- | ----------------------- | ---------------- | --------------------------- |
| `list`           | Hämta listdata                        | Alla                    | GET/POST         | `/api/posts:list`           |
| `get`            | Hämta enstaka data                    | Alla                    | GET/POST         | `/api/posts:get/1`          |
| `create`         | Skapa ny post                         | Alla                    | POST             | `/api/posts:create`         |
| `update`         | Uppdatera post                        | Alla                    | POST             | `/api/posts:update/1`       |
| `destroy`        | Radera post                           | Alla                    | POST             | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Hitta första posten, skapa om den inte finns | Alla                    | POST             | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Uppdatera post, skapa om den inte finns | Alla                    | POST             | `/api/users:updateOrCreate` |

### Relationsoperationer

| Operationsnamn | Beskrivning                   | Tillämpliga relationstyper                        | Exempel på sökväg              |
| -------------- | ----------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`          | Lägg till association         | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | Ta bort association           | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Återställ association         | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Lägg till eller ta bort association | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Operationsparametrar

Vanliga operationsparametrar inkluderar:

*   `filter`: Sökfilter
*   `values`: Värden att ställa in
*   `fields`: Ange fält som ska returneras
*   `appends`: Inkludera associerad data
*   `except`: Exkludera fält
*   `sort`: Sorteringsregler
*   `page`, `pageSize`: Pagineringparametrar
*   `paginate`: Om paginering ska aktiveras
*   `tree`: Om trädstruktur ska returneras
*   `whitelist`, `blacklist`: Vitlista/svartlista för fält
*   `updateAssociationValues`: Om associerade värden ska uppdateras

---

## Anpassade resursoperationer

NocoBase tillåter registrering av ytterligare operationer för befintliga resurser. Ni kan använda `registerActionHandlers` för att anpassa operationer för alla eller specifika resurser.

### Registrera globala operationer

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Registrera resursspecifika operationer

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Exempel på förfrågningar:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Namngivningsregel: `resourceName:actionName`, använd punktnotation (`posts.comments`) när associationer inkluderas.

## Anpassade resurser

Om ni behöver tillhandahålla resurser som är oberoende av samlingar, kan ni använda metoden `resourceManager.define` för att definiera dem:

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

Förfrågningsmetoderna överensstämmer med automatiskt genererade resurser:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (stöder GET/POST som standard)

## Anpassade mellanprogram

Använd metoden `resourceManager.use()` för att registrera globala mellanprogram. Till exempel:

Globalt loggningsmellanprogram

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Specifika Context-egenskaper

Att kunna komma åt mellanprogram eller åtgärder på `resourceManager`-nivån innebär att resursen måste existera.

### ctx.action

*   `ctx.action.actionName`: Operationsnamn
*   `ctx.action.resourceName`: Kan vara en samling eller association
*   `ctx.action.params`: Operationsparametrar

### ctx.dataSource

Det aktuella datakälleobjektet.

### ctx.getCurrentRepository()

Det aktuella repository-objektet.

## Hur man hämtar resourceManager-objekt för olika datakällor

`resourceManager` tillhör en datakälla, och operationer kan registreras separat för olika datakällor.

### Huvuddatakälla

För huvuddatakällan kan ni direkt använda `app.resourceManager` för operationer:

```ts
app.resourceManager.registerActionHandlers();
```

### Andra datakällor

För andra datakällor kan ni hämta en specifik datakälleinstans via `dataSourceManager` och använda den instansens `resourceManager` för operationer:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterera över alla datakällor

Om ni behöver utföra samma operationer på alla tillagda datakällor, kan ni använda metoden `dataSourceManager.afterAddDataSource` för att iterera, vilket säkerställer att varje datakällas `resourceManager` kan registrera de motsvarande operationerna:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```