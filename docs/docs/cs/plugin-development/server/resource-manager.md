:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# ResourceManager Správa zdrojů

Funkce správy zdrojů v NocoBase dokáže automaticky převádět existující databázové tabulky (kolekce) a asociace na zdroje. Obsahuje vestavěné typy operací, které vývojářům pomáhají rychle vytvářet operace se zdroji REST API. Na rozdíl od tradičních REST API se operace se zdroji v NocoBase nespoléhají na metody HTTP požadavků, ale určují konkrétní operaci k provedení prostřednictvím explicitních definic `:action`.

## Automatické generování zdrojů

NocoBase automaticky převádí `kolekce` a `asociace` definované v databázi na zdroje. Například, pokud definujete dvě kolekce, `posts` a `tags`:

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

Tím se automaticky vygenerují následující zdroje:

*   `posts` zdroj
*   `tags` zdroj
*   `posts.tags` asociační zdroj

Příklady požadavků:

| Metoda   | Cesta                     | Operace             |
| -------- | ---------------------- | ------------------- |
| `GET`  | `/api/posts:list`      | Dotaz na seznam     |
| `GET`  | `/api/posts:get/1`     | Dotaz na jednu položku |
| `POST` | `/api/posts:create`    | Přidat novou        |
| `POST` | `/api/posts:update/1`  | Aktualizovat        |
| `POST` | `/api/posts:destroy/1` | Smazat              |

| Metoda   | Cesta                  | Operace             |
| -------- | ---------------------- | ------------------- |
| `GET`  | `/api/tags:list`       | Dotaz na seznam     |
| `GET`  | `/api/tags:get/1`      | Dotaz na jednu položku |
| `POST` | `/api/tags:create`     | Přidat novou        |
| `POST` | `/api/tags:update/1`   | Aktualizovat        |
| `POST` | `/api/tags:destroy/1`  | Smazat              |

| Metoda   | Cesta                            | Operace                                   |
| -------- | ------------------------------ | ----------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Dotaz na všechny `tagy` spojené s `postem` |
| `GET`  | `/api/posts/1/tags:get/1`      | Dotaz na jeden `tag` pod `postem`         |
| `POST` | `/api/posts/1/tags:create`     | Vytvořit jeden `tag` pod `postem`         |
| `POST` | `/api/posts/1/tags:update/1`   | Aktualizovat jeden `tag` pod `postem`     |
| `POST` | `/api/posts/1/tags:destroy/1`  | Smazat jeden `tag` pod `postem`           |
| `POST` | `/api/posts/1/tags:add`        | Přidat spojené `tagy` k `postu`           |
| `POST` | `/api/posts/1/tags:remove`     | Odebrat spojené `tagy` od `postu`         |
| `POST` | `/api/posts/1/tags:set`        | Nastavit všechny spojené `tagy` pro `post` |
| `POST` | `/api/posts/1/tags:toggle`     | Přepnout spojení `tagů` pro `post`        |

:::tip Tip

Operace se zdroji v NocoBase přímo nezávisí na metodách požadavků, ale určují operace prostřednictvím explicitních definic `:action`.

:::

## Operace se zdroji

NocoBase nabízí bohaté vestavěné typy operací, které splňují různé obchodní potřeby.

### Základní CRUD operace

| Název operace    | Popis                             | Použitelné typy zdrojů | Metoda požadavku | Příklad cesty               |
| ---------------- | --------------------------------- | ---------------------- | -------------- | --------------------------- |
| `list`           | Dotaz na data seznamu             | Všechny                | GET/POST       | `/api/posts:list`           |
| `get`            | Dotaz na jednu položku dat        | Všechny                | GET/POST       | `/api/posts:get/1`          |
| `create`         | Vytvořit nový záznam              | Všechny                | POST           | `/api/posts:create`         |
| `update`         | Aktualizovat záznam               | Všechny                | POST           | `/api/posts:update/1`       |
| `destroy`        | Smazat záznam                     | Všechny                | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Najít první záznam, vytvořit pokud neexistuje | Všechny                | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Aktualizovat záznam, vytvořit pokud neexistuje | Všechny                | POST           | `/api/users:updateOrCreate` |

### Relační operace

| Název operace | Popis                     | Použitelné typy vztahů                            | Příklad cesty                  |
| -------------- | ------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`          | Přidat asociaci           | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | Odebrat asociaci          | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Resetovat asociaci        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Přidat nebo odebrat asociaci | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Parametry operací

Mezi běžné parametry operací patří:

*   `filter`: Podmínky dotazu
*   `values`: Hodnoty k nastavení
*   `fields`: Určení vrácených polí
*   `appends`: Zahrnout asociovaná data
*   `except`: Vyloučit pole
*   `sort`: Pravidla řazení
*   `page`, `pageSize`: Parametry stránkování
*   `paginate`: Zda povolit stránkování
*   `tree`: Zda vrátit stromovou strukturu
*   `whitelist`, `blacklist`: Whitelist/blacklist polí
*   `updateAssociationValues`: Zda aktualizovat asociované hodnoty

---

## Vlastní operace se zdroji

NocoBase umožňuje registrovat dodatečné operace pro existující zdroje. Můžete použít `registerActionHandlers` k přizpůsobení operací pro všechny nebo specifické zdroje.

### Registrace globálních operací

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Registrace operací pro konkrétní zdroje

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Příklady požadavků:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Pravidlo pojmenování: `resourceName:actionName`, při zahrnutí asociací použijte tečkovou syntaxi (`posts.comments`).

## Vlastní zdroje

Pokud potřebujete poskytovat zdroje, které nesouvisí s kolekcemi, můžete je definovat pomocí metody `resourceManager.define`:

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

Metody požadavků jsou konzistentní s automaticky generovanými zdroji:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (standardně podporuje GET/POST)

## Vlastní middleware

Použijte metodu `resourceManager.use()` k registraci globálního middleware. Například:

Globální logovací middleware

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Speciální vlastnosti Contextu

Možnost vstoupit do middleware nebo akce vrstvy `resourceManager` znamená, že daný zdroj musí existovat.

### ctx.action

*   `ctx.action.actionName`: Název operace
*   `ctx.action.resourceName`: Může být kolekce nebo asociace
*   `ctx.action.params`: Parametry operace

### ctx.dataSource

Aktuální objekt zdroje dat.

### ctx.getCurrentRepository()

Aktuální objekt repozitáře.

## Jak získat objekty resourceManager pro různé zdroje dat

`resourceManager` patří ke zdroji dat a operace lze registrovat samostatně pro různé zdroje dat.

### Hlavní zdroj dat

Pro hlavní zdroj dat můžete přímo použít `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Ostatní zdroje dat

Pro ostatní zdroje dat můžete získat konkrétní instanci zdroje dat prostřednictvím `dataSourceManager` a použít `resourceManager` této instance:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterace přes všechny zdroje dat

Pokud potřebujete provést stejné operace na všech přidaných zdrojích dat, můžete použít metodu `dataSourceManager.afterAddDataSource` k iteraci, čímž zajistíte, že `resourceManager` každého zdroje dat bude moci registrovat odpovídající operace:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```