:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Context

I NocoBase genererar varje förfrågan ett `ctx`-objekt, som är en instans av Context. Context kapslar in information om förfrågan och svaret, samtidigt som den tillhandahåller NocoBase-specifika funktioner som databasåtkomst, cache-operationer, behörighetshantering, internationalisering och loggning.

NocoBase's `Application` bygger på Koa, så `ctx` är i grunden en Koa Context. NocoBase har dock utökat den med rika API:er, vilket gör att utvecklare smidigt kan hantera affärslogik i Middleware och Actions. Varje förfrågan har ett oberoende `ctx`, vilket säkerställer dataseparation och säkerhet mellan förfrågningarna.

## ctx.action

`ctx.action` ger åtkomst till den Action som utförs för den aktuella förfrågan. Den inkluderar:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Skriver ut namnet på den aktuella Action
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Stöd för internationalisering (i18n).

- `ctx.i18n` tillhandahåller information om språkinställningar.
- `ctx.t()` används för att översätta strängar baserat på språket.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Returnerar översättning baserat på förfrågans språk
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` tillhandahåller ett gränssnitt för databasåtkomst, vilket gör att ni direkt kan manipulera modeller och utföra frågor.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` tillhandahåller cache-operationer, med stöd för att läsa från och skriva till cachen. Detta används ofta för att snabba upp dataåtkomst eller spara temporära tillstånd.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Cachelagrar i 60 sekunder
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` är NocoBase-applikationsinstansen, som ger åtkomst till global konfiguration, plugin och tjänster.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app'; // Kontrollera konsolen för app-objektet
});
```

## ctx.auth.user

`ctx.auth.user` hämtar information om den för närvarande autentiserade användaren. Detta är lämpligt att använda vid behörighetskontroller eller i affärslogik.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` används för att dela data i middleware-kedjan.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` tillhandahåller loggningsfunktioner och stöder loggutskrifter på flera nivåer.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` används för behörighetshantering, och `ctx.can()` används för att kontrollera om den aktuella användaren har behörighet att utföra en viss operation.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Sammanfattning

- Varje förfrågan motsvarar ett oberoende `ctx`-objekt.
- `ctx` är en utökning av Koa Context som integrerar NocoBase-funktionalitet.
- Vanliga egenskaper inkluderar: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` med mera.
- Genom att använda `ctx` i Middleware och Actions kan ni enkelt hantera förfrågningar, svar, behörigheter, loggar och databasen.