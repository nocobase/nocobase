:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Middleware

Middleware NocoBase Serveru je v podstatě **Koa middleware**. Můžete pracovat s objektem `ctx` a zpracovávat požadavky a odpovědi stejně jako v Koa. Protože však NocoBase potřebuje spravovat logiku na různých obchodních vrstvách, bylo by velmi obtížné udržovat a spravovat všechna middleware, kdyby byla umístěna pohromadě.

Z tohoto důvodu NocoBase rozděluje middleware do **čtyř úrovní**:

1.  **Middleware na úrovni zdroje dat**: `app.dataSourceManager.use()`  
    Působí pouze na požadavky pro **konkrétní zdroj dat**, často se používá pro logiku připojení k databázi, validaci polí nebo zpracování transakcí pro daný zdroj dat.

2.  **Middleware na úrovni zdrojů**: `app.resourceManager.use()`  
    Je účinné pouze pro definované zdroje (Resource), hodí se pro zpracování logiky na úrovni zdrojů, jako jsou datová oprávnění, formátování apod.

3.  **Middleware na úrovni oprávnění**: `app.acl.use()`  
    Spouští se před kontrolou oprávnění, slouží k ověření uživatelských oprávnění nebo rolí.

4.  **Middleware na úrovni aplikace**: `app.use()`  
    Spouští se pro každý požadavek, hodí se pro logování, obecné zpracování chyb, zpracování odpovědí atd.

## Registrace middleware

Middleware se obvykle registruje v metodě `load` pluginu, například:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware na úrovni aplikace
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware zdroje dat
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware oprávnění
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware zdrojů
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Pořadí spouštění

Pořadí spouštění middleware je následující:

1.  Nejprve se spustí middleware oprávnění přidané pomocí `acl.use()`.
2.  Poté se spustí middleware zdrojů přidané pomocí `resourceManager.use()`.
3.  Následně se spustí middleware zdroje dat přidané pomocí `dataSourceManager.use()`.
4.  Nakonec se spustí middleware aplikace přidané pomocí `app.use()`.

## Mechanismus vkládání `before` / `after` / `tag`

Pro flexibilnější kontrolu pořadí middleware poskytuje NocoBase parametry `before`, `after` a `tag`:

-   **tag**: Označí middleware pro referenci následným middlewarem.
-   **before**: Vloží se před middleware se zadaným tagem.
-   **after**: Vloží se za middleware se zadaným tagem.

Příklad:

```ts
// Běžné middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 bude umístěno před m1
app.use(m4, { before: 'restApi' });

// m5 bude vloženo mezi m2 a m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Pokud není specifikována pozice, výchozí pořadí spouštění nově přidaného middleware je:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Příklad cibulového modelu

Pořadí spouštění middleware se řídí **cibulovým modelem** Koa, což znamená, že middleware nejprve vstupuje do zásobníku a nakonec ze zásobníku vystupuje.

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

Příklady výstupu pro různá rozhraní:

-   **Běžný požadavek**: `/api/hello`  
    Výstup: `[1,2]` (zdroj není definován, nespouští se middleware `resourceManager` a `acl`)  

-   **Požadavek na zdroj**: `/api/test:list`  
    Výstup: `[5,3,7,1,2,8,4,6]`  
    Middleware se spouští podle pořadí úrovní a cibulového modelu.

## Shrnutí

-   NocoBase Middleware je rozšířením Koa Middleware.
-   Čtyři úrovně: Aplikace -> Zdroj dat -> Zdroj -> Oprávnění
-   Pro flexibilní kontrolu pořadí spouštění můžete použít `before` / `after` / `tag`.
-   Řídí se cibulovým modelem Koa, což zajišťuje, že middleware je kompozovatelné a vnořitelné.
-   Middleware na úrovni zdroje dat působí pouze na požadavky pro zadaný zdroj dat, middleware na úrovni zdrojů působí pouze na definované požadavky na zdroje.