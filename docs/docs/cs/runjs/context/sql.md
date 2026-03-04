:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` poskytuje možnosti pro spouštění a správu SQL, běžně se používá v RunJS (jako JSBlock, pracovní postupy) pro přímý přístup k databázi. Podporuje dočasné spouštění SQL, spouštění uložených SQL šablon podle ID, vazbu parametrů (binding), proměnné šablon (`{{ctx.xxx}}`) a řízení typu výsledku.

## Vhodné scénáře

| Scénář | Popis |
|------|------|
| **JSBlock** | Vlastní statistické přehledy, složité filtrované seznamy a agregační dotazy napříč tabulkami. |
| **Grafický blok** | Ukládání SQL šablon pro napájení datových zdrojů grafů. |
| **Pracovní postup / Propojení** | Spouštění přednastavených SQL pro získání dat pro následnou logiku. |
| **SQLResource** | Používá se ve spojení s `ctx.initResource('SQLResource')` pro scénáře, jako jsou stránkované seznamy. |

> Poznámka: `ctx.sql` přistupuje k databázi prostřednictvím API `flowSql`. Ujistěte se, že aktuální uživatel má oprávnění ke spuštění pro odpovídající zdroj dat.

## Oprávnění

| Oprávnění | Metoda | Popis |
|------|------|------|
| **Přihlášený uživatel** | `runById` | Spuštění na základě ID nakonfigurované SQL šablony. |
| **Oprávnění ke konfiguraci SQL** | `run`, `save`, `destroy` | Spouštění dočasného SQL nebo ukládání/aktualizace/mazání SQL šablon. |

Front-endová logika určená pro běžné uživatele by měla používat `ctx.sql.runById(uid, options)`. Pokud je vyžadováno dynamické SQL nebo správa šablon, ujistěte se, že aktuální role disponuje oprávněním ke konfiguraci SQL.

## Definice typů

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Časté metody

| Metoda | Popis | Požadavek na oprávnění |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Spustí dočasné SQL; podporuje vazbu parametrů a proměnné šablon. | Oprávnění ke konfiguraci SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Uloží nebo aktualizuje SQL šablonu podle ID pro opakované použití. | Oprávnění ke konfiguraci SQL |
| `ctx.sql.runById(uid, options?)` | Spustí dříve uloženou SQL šablonu podle jejího ID. | Jakýkoliv přihlášený uživatel |
| `ctx.sql.destroy(uid)` | Smaže specifikovanou SQL šablonu podle ID. | Oprávnění ke konfiguraci SQL |

Poznámka:

- `run` se používá pro ladění SQL a vyžaduje oprávnění ke konfiguraci.
- `save` a `destroy` se používají pro správu SQL šablon a vyžadují oprávnění ke konfiguraci.
- `runById` je otevřeno běžným uživatelům; může pouze spouštět uložené šablony a nemůže ladit ani upravovat SQL.
- Při úpravě SQL šablony musí být zavoláno `save`, aby se změny uložily.

## Parametry

### options pro run / runById

| Parametr | Typ | Popis |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Vazební proměnné. Použijte objekt pro zástupné symboly `:name` nebo pole pro zástupné symboly `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Typ výsledku: více řádků, jeden řádek nebo jedna hodnota. Výchozí je `selectRows`. |
| `dataSourceKey` | `string` | Identifikátor zdroje dat. Výchozí je hlavní zdroj dat. |
| `filter` | `Record<string, any>` | Dodatečné podmínky filtru (v závislosti na podpoře rozhraní). |

### options pro save

| Parametr | Typ | Popis |
|------|------|------|
| `uid` | `string` | Unikátní identifikátor šablony. Po uložení ji lze spustit pomocí `runById(uid, ...)`. |
| `sql` | `string` | Obsah SQL. Podporuje proměnné šablon `{{ctx.xxx}}` a zástupné symboly `:name` / `?`. |
| `dataSourceKey` | `string` | Volitelné. Identifikátor zdroje dat. |

## SQL proměnné šablon a vazba parametrů

### Proměnné šablon `{{ctx.xxx}}`

V SQL můžete použít `{{ctx.xxx}}` pro odkazování na proměnné kontextu. Ty jsou před spuštěním převedeny na skutečné hodnoty:

```js
// Odkaz na ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Zdroje pro odkazovatelné proměnné jsou stejné jako u `ctx.getVar()` (např. `ctx.user.*`, `ctx.record.*`, vlastní `ctx.defineProperty` atd.).

### Vazba parametrů (Parameter Binding)

- **Pojmenované parametry**: Použijte `:name` v SQL a předejte objekt `{ name: value }` v `bind`.
- **Poziční parametry**: Použijte `?` v SQL a předejte pole `[value1, value2]` v `bind`.

```js
// Pojmenované parametry
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Poziční parametry
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## Příklady

### Spuštění dočasného SQL (vyžaduje oprávnění ke konfiguraci SQL)

```js
// Více řádků (výchozí)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Jeden řádek
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Jedna hodnota (např. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Použití proměnných šablon

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Uložení a opakované použití šablon

```js
// Uložit (vyžaduje oprávnění ke konfiguraci SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Spustit může jakýkoliv přihlášený uživatel
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Smazat šablonu (vyžaduje oprávnění ke konfiguraci SQL)
await ctx.sql.destroy('active-users-report');
```

### Stránkovaný seznam (SQLResource)

```js
// Použijte SQLResource, pokud je vyžadováno stránkování nebo filtrování
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID uložené SQL šablony
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Obsahuje page, pageSize atd.
```

## Vztah k ctx.resource a ctx.request

| Účel | Doporučené použití |
|------|----------|
| **Spuštění SQL dotazu** | `ctx.sql.run()` nebo `ctx.sql.runById()` |
| **SQL stránkovaný seznam (blok)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Obecný HTTP požadavek** | `ctx.request()` |

`ctx.sql` obaluje API `flowSql` a specializuje se na SQL scénáře; `ctx.request` lze použít k volání jakéhokoli API.

## Poznámky

- Používejte vazbu parametrů (`:name` / `?`) namísto spojování řetězců, abyste zabránili SQL injection.
- `type: 'selectVar'` vrací skalární hodnotu, obvykle se používá pro `COUNT`, `SUM` atd.
- Proměnné šablon `{{ctx.xxx}}` jsou vyhodnoceny před spuštěním; ujistěte se, že odpovídající proměnné jsou v kontextu definovány.

## Související

- [ctx.resource](./resource.md): Datové zdroje; SQLResource interně volá API `flowSql`.
- [ctx.initResource()](./init-resource.md): Inicializuje SQLResource pro stránkované seznamy atd.
- [ctx.request()](./request.md): Obecné HTTP požadavky.