:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ResourceManager (Resourcebeheer)

De resourcebeheerfunctie van NocoBase kan bestaande **collecties** en associaties automatisch omzetten in resources. Het biedt ingebouwde bewerkingstypen om ontwikkelaars te helpen snel REST API-resourcebewerkingen te bouwen. In tegenstelling tot traditionele REST API's zijn NocoBase-resourcebewerkingen niet afhankelijk van HTTP-aanvraagmethoden, maar bepalen ze de specifieke uit te voeren bewerking via expliciete `:action`-definities.

## Automatisch genereren van resources

NocoBase zet automatisch `collecties` en associaties die in de database zijn gedefinieerd om in resources. Stel dat u bijvoorbeeld twee **collecties** definieert, `posts` en `tags`:

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

Dit genereert automatisch de volgende resources:

*   `posts` resource
*   `tags` resource
*   `posts.tags` associatie resource

Aanvraagvoorbeelden:

| Methode  | Pad                    | Bewerking           |
| -------- | ---------------------- | ------------------- |
| `GET`    | `/api/posts:list`      | Lijst opvragen      |
| `GET`    | `/api/posts:get/1`     | Enkel item opvragen |
| `POST`   | `/api/posts:create`    | Toevoegen           |
| `POST`   | `/api/posts:update/1`  | Bijwerken           |
| `POST`   | `/api/posts:destroy/1` | Verwijderen         |

| Methode  | Pad                    | Bewerking           |
| -------- | ---------------------- | ------------------- |
| `GET`    | `/api/tags:list`       | Lijst opvragen      |
| `GET`    | `/api/tags:get/1`      | Enkel item opvragen |
| `POST`   | `/api/tags:create`     | Toevoegen           |
| `POST`   | `/api/tags:update/1`   | Bijwerken           |
| `POST`   | `/api/tags:destroy/1`  | Verwijderen         |

| Methode  | Pad                            | Bewerking                                        |
| -------- | ------------------------------ | ------------------------------------------------ |
| `GET`    | `/api/posts/1/tags:list`       | Alle `tags` opvragen die aan een `post` zijn gekoppeld |
| `GET`    | `/api/posts/1/tags:get/1`      | Eén `tag` opvragen onder een `post`              |
| `POST`   | `/api/posts/1/tags:create`     | Eén `tag` aanmaken onder een `post`              |
| `POST`   | `/api/posts/1/tags:update/1`   | Eén `tag` bijwerken onder een `post`             |
| `POST`   | `/api/posts/1/tags:destroy/1`  | Eén `tag` verwijderen onder een `post`           |
| `POST`   | `/api/posts/1/tags:add`        | Gekoppelde `tags` toevoegen aan een `post`       |
| `POST`   | `/api/posts/1/tags:remove`     | Gekoppelde `tags` verwijderen van een `post`     |
| `POST`   | `/api/posts/1/tags:set`        | Alle gekoppelde `tags` instellen voor een `post` |
| `POST`   | `/api/posts/1/tags:toggle`     | De `tags`-associatie voor een `post` wisselen    |

:::tip Tip

NocoBase-resourcebewerkingen zijn niet direct afhankelijk van aanvraagmethoden, maar bepalen de uit te voeren bewerkingen via expliciete `:action`-definities.

:::

## Resourcebewerkingen

NocoBase biedt een breed scala aan ingebouwde bewerkingstypen om aan diverse bedrijfsbehoeften te voldoen.

### Basis CRUD-bewerkingen

| Bewerking        | Beschrijving                                | Toepasselijke resourcetypen | Aanvraagmethode | Voorbeeldpad                |
| ---------------- | ------------------------------------------- | --------------------------- | --------------- | --------------------------- |
| `list`           | Lijstgegevens opvragen                      | Alle                        | GET/POST        | `/api/posts:list`           |
| `get`            | Enkele gegevens opvragen                    | Alle                        | GET/POST        | `/api/posts:get/1`          |
| `create`         | Nieuw record aanmaken                       | Alle                        | POST            | `/api/posts:create`         |
| `update`         | Record bijwerken                            | Alle                        | POST            | `/api/posts:update/1`       |
| `destroy`        | Record verwijderen                          | Alle                        | POST            | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Eerste record zoeken, aanmaken indien niet aanwezig | Alle                        | POST            | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Record bijwerken, aanmaken indien niet aanwezig    | Alle                        | POST            | `/api/users:updateOrCreate` |

### Relatiebewerkingen

| Bewerking | Beschrijving                      | Toepasselijke relatietypen                        | Voorbeeldpad                   |
| --------- | --------------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`     | Associatie toevoegen              | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`  | Associatie verwijderen            | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`     | Associatie resetten               | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`  | Associatie toevoegen of verwijderen | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Bewerkingparameters

Veelvoorkomende bewerkingparameters zijn:

*   `filter`: Zoekvoorwaarden
*   `values`: In te stellen waarden
*   `fields`: Op te geven velden voor retour
*   `appends`: Gekoppelde gegevens opnemen
*   `except`: Velden uitsluiten
*   `sort`: Sorteerregels
*   `page`, `pageSize`: Paginatieparameters
*   `paginate`: Paginatie inschakelen
*   `tree`: Boomstructuur retourneren
*   `whitelist`, `blacklist`: Whitelist/blacklist voor velden
*   `updateAssociationValues`: Associatiewaarden bijwerken

---

## Aangepaste resourcebewerkingen

NocoBase maakt het mogelijk om extra bewerkingen te registreren voor bestaande resources. U kunt `registerActionHandlers` gebruiken om bewerkingen aan te passen voor alle of specifieke resources.

### Globale bewerkingen registreren

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Resource-specifieke bewerkingen registreren

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Aanvraagvoorbeelden:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Naamgevingsregel: `resourceName:actionName`. Gebruik de puntnotatie (`posts.comments`) wanneer associaties zijn inbegrepen.

## Aangepaste resources

Als u resources wilt aanbieden die niet gerelateerd zijn aan **collecties**, kunt u deze definiëren met de methode `resourceManager.define`:

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

Aanvraagmethoden komen overeen met automatisch gegenereerde resources:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (ondersteunt standaard zowel GET als POST)

## Aangepaste middleware

Gebruik de methode `resourceManager.use()` om globale middleware te registreren. Bijvoorbeeld:

Globale logging-middleware

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Speciale Context-eigenschappen

Wanneer u de middleware of actie van de `resourceManager`-laag kunt betreden, betekent dit dat de resource gegarandeerd bestaat.

### ctx.action

*   `ctx.action.actionName`: Naam van de bewerking
*   `ctx.action.resourceName`: Kan een **collectie** of associatie zijn
*   `ctx.action.params`: Parameters van de bewerking

### ctx.dataSource

Het huidige **gegevensbron**-object.

### ctx.getCurrentRepository()

Het huidige repository-object.

## Hoe u resourceManager-objecten voor verschillende gegevensbronnen krijgt

`resourceManager` behoort tot een **gegevensbron**, en bewerkingen kunnen afzonderlijk voor verschillende **gegevensbronnen** worden geregistreerd.

### Hoofdgegevensbron

Voor de hoofd**gegevensbron** kunt u direct `app.resourceManager` gebruiken om bewerkingen uit te voeren:

```ts
app.resourceManager.registerActionHandlers();
```

### Andere gegevensbronnen

Voor andere **gegevensbronnen** kunt u via `dataSourceManager` een specifieke **gegevensbron**-instantie ophalen en de `resourceManager` van die instantie gebruiken om bewerkingen uit te voeren:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Alle gegevensbronnen doorlopen

Als u dezelfde bewerkingen op alle toegevoegde **gegevensbronnen** wilt uitvoeren, kunt u de methode `dataSourceManager.afterAddDataSource` gebruiken om deze te doorlopen. Dit zorgt ervoor dat de `resourceManager` van elke **gegevensbron** de bijbehorende bewerkingen kan registreren:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```