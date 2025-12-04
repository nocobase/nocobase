:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Context

V NocoBase každý požadavek vygeneruje objekt `ctx`, což je instance Contextu. Context zapouzdřuje informace o požadavku a odpovědi a zároveň nabízí funkce specifické pro NocoBase, jako je přístup k databázi, operace s cache, správa oprávnění, internacionalizace a logování.

`Application` NocoBase je postavena na Koa, takže `ctx` je v podstatě Koa Context. NocoBase ho ale rozšířila o bohaté API, které vývojářům umožňuje pohodlně zpracovávat obchodní logiku v Middleware a Action. Každý požadavek má nezávislý `ctx`, což zajišťuje izolaci dat a bezpečnost mezi požadavky.

## ctx.action

`ctx.action` poskytuje přístup k Action, která se provádí pro aktuální požadavek. Zahrnuje:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Vypíše název aktuální Action
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Podpora internacionalizace (i18n).

- `ctx.i18n` poskytuje informace o jazykovém prostředí
- `ctx.t()` se používá k překladu řetězců na základě jazyka

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Vrátí překlad na základě jazyka požadavku
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` poskytuje rozhraní pro přístup k databázi, které vám umožňuje přímo pracovat s modely a provádět dotazy.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` poskytuje operace s cache, podporuje čtení a zápis do cache, běžně se používá k urychlení přístupu k datům nebo k ukládání dočasného stavu.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Uloží do cache na 60 sekund
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` je instance aplikace NocoBase, která umožňuje přístup ke globální konfiguraci, pluginům a službám.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Zkontrolujte konzoli pro aplikaci';
});
```

## ctx.auth.user

`ctx.auth.user` načítá informace o aktuálně ověřeném uživateli, vhodné pro použití při kontrole oprávnění nebo v obchodní logice.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` se používá ke sdílení dat v řetězci middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` poskytuje možnosti logování, podporuje výstup logů na více úrovních.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` se používá pro správu oprávnění, `ctx.can()` se používá k ověření, zda má aktuální uživatel oprávnění provést určitou operaci.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'Máte oprávnění upravovat příspěvky';
});
```

## Shrnutí

- Každý požadavek odpovídá nezávislému objektu `ctx`.
- `ctx` je rozšířením Koa Contextu, které integruje funkce NocoBase.
- Mezi běžné vlastnosti patří: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` atd.
- Použití `ctx` v Middleware a Action umožňuje pohodlně pracovat s požadavky, odpověďmi, oprávněními, logy a databází.