:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Context

In NocoBase genereert elk verzoek een `ctx` object, een instantie van Context. Context omvat informatie over het verzoek en de respons, en biedt tegelijkertijd NocoBase-specifieke functionaliteiten, zoals databasetoegang, cachebewerkingen, rechtenbeheer, internationalisering en logging.

De `Application` van NocoBase is gebaseerd op Koa, dus `ctx` is in wezen een Koa Context. NocoBase heeft deze echter uitgebreid met uitgebreide API's, waardoor ontwikkelaars eenvoudig bedrijfslogica kunnen afhandelen in Middleware en Actions. Elk verzoek heeft een onafhankelijke `ctx`, wat zorgt voor data-isolatie en veiligheid tussen verzoeken.

## ctx.action

`ctx.action` geeft toegang tot de Action die wordt uitgevoerd voor het huidige verzoek. Dit omvat:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Toont de naam van de huidige Action
  ctx.body = `Actie: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Ondersteuning voor internationalisering (i18n).

- `ctx.i18n` biedt informatie over de taalinstellingen (locale).
- `ctx.t()` wordt gebruikt om strings te vertalen op basis van de taal.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Geeft de vertaling terug op basis van de taal van het verzoek
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` biedt een interface voor databasetoegang, waarmee u direct modellen kunt bewerken en query's kunt uitvoeren.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` biedt cachebewerkingen, ondersteunt het lezen uit en schrijven naar de cache, en wordt vaak gebruikt om datatoegang te versnellen of tijdelijke status op te slaan.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Cache voor 60 seconden
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` is de NocoBase applicatie-instantie, die toegang geeft tot de globale configuratie, **plugins** en services.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Controleer de console voor de app';
});
```

## ctx.auth.user

`ctx.auth.user` haalt de informatie op van de momenteel geauthenticeerde gebruiker, geschikt voor gebruik bij rechtencontroles of bedrijfslogica.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Niet geautoriseerd');
  }
  ctx.body = `Hallo ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` wordt gebruikt om gegevens te delen binnen de middleware-keten.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Huidige gebruiker: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` biedt loggingmogelijkheden, met ondersteuning voor loguitvoer op meerdere niveaus.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Verzoek verwerken voor:', ctx.path);
  ctx.body = 'Succesvol gelogd';
});
```

## ctx.permission & ctx.can()

`ctx.permission` wordt gebruikt voor rechtenbeheer, en `ctx.can()` om te controleren of de huidige gebruiker toestemming heeft om een bepaalde bewerking uit te voeren.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Verboden');
  }
  ctx.body = 'U heeft toestemming om berichten te bewerken';
});
```

## Samenvatting

- Elk verzoek komt overeen met een onafhankelijk `ctx` object.
- `ctx` is een uitbreiding van Koa Context en integreert NocoBase functionaliteit.
- Veelgebruikte eigenschappen zijn: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, enz.
- Het gebruik van `ctx` in Middleware en Actions maakt het gemakkelijk om verzoeken, responsen, rechten, logs en de database af te handelen.