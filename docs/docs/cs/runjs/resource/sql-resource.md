:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/resource/sql-resource).
:::

# SQLResource

Resource pro provádění dotazů založených na **uložených konfiguracích SQL** nebo **dynamickém SQL**, přičemž data pocházejí z rozhraní jako `flowSql:run` / `flowSql:runById`. Je vhodný pro reporty, statistiky, vlastní seznamy založené na SQL a další scénáře. Na rozdíl od [MultiRecordResource](./multi-record-resource.md) SQLResource nezávisí na kolekcích; provádí SQL dotazy přímo a podporuje stránkování, vazbu parametrů (binding), šablonové proměnné (`{{ctx.xxx}}`) a řízení typu výsledku.

**Dědičnost**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Způsob vytvoření**: `ctx.makeResource('SQLResource')` nebo `ctx.initResource('SQLResource')`. Pro spuštění na základě uložené konfigurace použijte `setFilterByTk(uid)` (UID SQL šablony). Pro ladění použijte `setDebug(true)` + `setSQL(sql)` pro přímé spuštění SQL. V RunJS je `ctx.api` injektováno prostředím běhu.

---

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Reporty / Statistiky** | Komplexní agregace, dotazy přes více tabulek a vlastní statistické metriky. |
| **JSBlock vlastní seznamy** | Implementace speciálního filtrování, řazení nebo vazeb pomocí SQL s vlastním vykreslováním. |
| **Bloky grafů** | Řízení datových zdrojů grafů pomocí uložených SQL šablon s podporou stránkování. |
| **Volba mezi SQLResource a ctx.sql** | SQLResource použijte, pokud je vyžadováno stránkování, události nebo reaktivní data; `ctx.sql.run()` / `ctx.sql.runById()` použijte pro jednoduché jednorázové dotazy. |

---

## Datový formát

- `getData()` vrací různé formáty na základě `setSQLType()`:
  - `selectRows` (výchozí): **Pole**, výsledky o více řádcích.
  - `selectRow`: **Jeden objekt**.
  - `selectVar`: **Skalární hodnota** (např. COUNT, SUM).
- `getMeta()` vrací metadata, jako je stránkování: `page`, `pageSize`, `count`, `totalPage` atd.

---

## Konfigurace SQL a režimy provádění

| Metoda | Popis |
|------|------|
| `setFilterByTk(uid)` | Nastaví UID SQL šablony, která se má provést (odpovídá `runById`; musí být nejprve uložena v administrátorském rozhraní). |
| `setSQL(sql)` | Nastaví surové SQL (používá se pro `runBySQL` pouze tehdy, když je povolen režim ladění `setDebug(true)`). |
| `setSQLType(type)` | Typ výsledku: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Pokud je nastaveno na `true`, `refresh` volá `runBySQL()`; v opačném případě volá `runById()`. |
| `run()` | Volá `runBySQL()` nebo `runById()` na základě stavu ladění (debug). |
| `runBySQL()` | Provede dotaz pomocí SQL definovaného v `setSQL` (vyžaduje `setDebug(true)`). |
| `runById()` | Provede uloženou SQL šablonu pomocí aktuálního UID. |

---

## Parametry a kontext

| Metoda | Popis |
|------|------|
| `setBind(bind)` | Naváže proměnné. Použijte objekt pro zástupné znaky `:name` nebo pole pro zástupné znaky `?`. |
| `setLiquidContext(ctx)` | Kontext šablony (Liquid), používaný k parsování `{{ctx.xxx}}`. |
| `setFilter(filter)` | Dodatečné filtrační podmínky (předávané do dat požadavku). |
| `setDataSourceKey(key)` | Identifikátor zdroje dat (používá se v prostředí s více zdroji dat). |

---

## Stránkování

| Metoda | Popis |
|------|------|
| `setPage(page)` / `getPage()` | Aktuální stránka (výchozí je 1). |
| `setPageSize(size)` / `getPageSize()` | Počet položek na stránku (výchozí je 20). |
| `next()` / `previous()` / `goto(page)` | Přechází mezi stránkami a spouští `refresh`. |

V SQL můžete použít `{{ctx.limit}}` a `{{ctx.offset}}` pro odkazování na parametry stránkování. SQLResource automaticky vkládá `limit` a `offset` do kontextu.

---

## Načítání dat a události

| Metoda | Popis |
|------|------|
| `refresh()` | Provede SQL (`runById` nebo `runBySQL`), zapíše výsledek do `setData(data)`, aktualizuje meta a vyvolá událost `'refresh'`. |
| `runAction(actionName, options)` | Volá podkladové akce (např. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Spustí se při dokončení obnovy nebo při zahájení načítání. |

---

## Příklady

### Provádění přes uloženou šablonu (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID uložené SQL šablony
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count atd.
```

### Režim ladění: Přímé provádění SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Stránkování a navigace

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigace
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Typy výsledků

```js
// Více řádků (výchozí)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Jeden řádek
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Jedna hodnota (např. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Použití šablonových proměnných

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Naslouchání události refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Poznámky

- **runById vyžaduje nejprve uložit šablonu**: UID použité v `setFilterByTk(uid)` musí být ID SQL šablony již uložené v administrátorském rozhraní. Můžete ji uložit pomocí `ctx.sql.save({ uid, sql })`.
- **Režim ladění vyžaduje oprávnění**: `setDebug(true)` využívá `flowSql:run`, což vyžaduje, aby aktuální role měla oprávnění ke konfiguraci SQL. `runById` vyžaduje pouze přihlášení uživatele.
- **Debouncing obnovy (refresh)**: Více volání `refresh()` v rámci stejné smyčky událostí (event loop) provede pouze to poslední, aby se předešlo nadbytečným požadavkům.
- **Vazba parametrů pro prevenci injekce**: Používejte `setBind()` se zástupnými znaky `:name` nebo `?` namísto spojování řetězců, abyste zabránili SQL injection.

---

## Související

- [ctx.sql](../context/sql.md) - Provádění a správa SQL; `ctx.sql.runById` je vhodný pro jednoduché jednorázové dotazy.
- [ctx.resource](../context/resource.md) - Instance resource v aktuálním kontextu.
- [ctx.initResource()](../context/init-resource.md) - Inicializuje a váže na `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Vytvoří novou instanci resource bez vazby.
- [APIResource](./api-resource.md) - Obecný API resource.
- [MultiRecordResource](./multi-record-resource.md) - Určeno pro kolekce a seznamy.