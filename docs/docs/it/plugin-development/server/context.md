:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Contesto

In NocoBase, ogni richiesta genera un oggetto `ctx`, che è un'istanza di Context. Il Context incapsula le informazioni della richiesta e della risposta, fornendo al contempo funzionalità specifiche di NocoBase, come l'accesso al database, le operazioni di cache, la gestione dei permessi, l'internazionalizzazione e la registrazione dei log.

L'Application di NocoBase è basata su Koa, quindi `ctx` è essenzialmente un Koa Context. Tuttavia, NocoBase lo estende con ricche API, consentendo agli sviluppatori di gestire comodamente la logica di business nei Middleware e negli Action. Ogni richiesta ha un `ctx` indipendente, garantendo l'isolamento e la sicurezza dei dati tra le richieste.

## ctx.action

`ctx.action` fornisce l'accesso all'Action in esecuzione per la richiesta corrente. Include:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Stampa il nome dell'Action corrente
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Supporto all'internazionalizzazione (i18n).

- `ctx.i18n` fornisce le informazioni sulla lingua e la localizzazione
- `ctx.t()` viene utilizzato per tradurre le stringhe in base alla lingua

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Restituisce la traduzione in base alla lingua della richiesta
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` fornisce un'interfaccia per l'accesso al database, consentendovi di operare direttamente sui modelli ed eseguire query.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` fornisce operazioni di cache, supportando la lettura e la scrittura nella cache, comunemente utilizzato per accelerare l'accesso ai dati o salvare stati temporanei.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Memorizza nella cache per 60 secondi
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` è l'istanza dell'applicazione NocoBase, che consente di accedere alla configurazione globale, ai plugin e ai servizi.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` recupera le informazioni dell'utente attualmente autenticato, adatto per l'uso nei controlli di permesso o nella logica di business.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` viene utilizzato per condividere dati nella catena di middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` fornisce capacità di registrazione dei log, supportando l'output di log a più livelli.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` viene utilizzato per la gestione dei permessi, mentre `ctx.can()` serve a verificare se l'utente corrente ha il permesso di eseguire una determinata operazione.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Riepilogo

- Ogni richiesta corrisponde a un oggetto `ctx` indipendente
- `ctx` è un'estensione di Koa Context, che integra le funzionalità di NocoBase
- Le proprietà comuni includono: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, ecc.
- L'utilizzo di `ctx` nei Middleware e negli Action consente di gestire comodamente richieste, risposte, permessi, log e il database.