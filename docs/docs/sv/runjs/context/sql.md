:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` erbjuder funktioner för exekvering och hantering av SQL, vilket ofta används i RunJS (såsom JSBlock och arbetsflöden) för att få direktåtkomst till databasen. Den stöder temporär SQL-exekvering, körning av sparade SQL-mallar via ID, parameterbindning, mallvariabler (`{{ctx.xxx}}`) samt kontroll av resultattyp.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | Anpassade statistikrapporter, komplexa filtrerade listor och aggregeringsfrågor över flera tabeller. |
| **Diagramblock** | Sparar SQL-mallar för att driva datakällor för diagram. |
| **Arbetsflöde / Länkning** | Exekverar förinställd SQL för att hämta data till efterföljande logik. |
| **SQLResource** | Används tillsammans med `ctx.initResource('SQLResource')` för scenarier som sidnumrerade listor. |

> Observera: `ctx.sql` ansluter till databasen via `flowSql`-API:et. Säkerställ att den aktuella användaren har exekveringsbehörighet för motsvarande datakälla.

## Behörigheter

| Behörighet | Metod | Beskrivning |
|------|------|------|
| **Inloggad användare** | `runById` | Exekvera baserat på ett konfigurerat SQL-mall-ID. |
| **Behörighet för SQL-konfiguration** | `run`, `save`, `destroy` | Exekvera temporär SQL, eller spara/uppdatera/radera SQL-mallar. |

Gränssnittslogik avsedd för vanliga användare bör använda `ctx.sql.runById(uid, options)`. När dynamisk SQL eller mallhantering krävs, måste ni säkerställa att den aktuella rollen har behörighet för SQL-konfiguration.

## Typdefinition

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

## Vanliga metoder

| Metod | Beskrivning | Behörighetskrav |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Exekverar temporär SQL; stöder parameterbindning och mallvariabler. | Behörighet för SQL-konfiguration |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Sparar eller uppdaterar en SQL-mall via ID för återanvändning. | Behörighet för SQL-konfiguration |
| `ctx.sql.runById(uid, options?)` | Exekverar en tidigare sparad SQL-mall via dess ID. | Alla inloggade användare |
| `ctx.sql.destroy(uid)` | Raderar en specifik SQL-mall via ID. | Behörighet för SQL-konfiguration |

Observera:

- `run` används för felsökning av SQL och kräver konfigurationsbehörighet.
- `save` och `destroy` används för att hantera SQL-mallar och kräver konfigurationsbehörighet.
- `runById` är öppen för vanliga användare; den kan endast exekvera sparade mallar och kan inte användas för att felsöka eller ändra SQL.
- När en SQL-mall ändras måste `save` anropas för att spara ändringarna.

## Parametrar

### options för run / runById

| Parameter | Typ | Beskrivning |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Bindningsvariabler. Använd ett objekt för `:name`-platshållare eller en array för `?`-platshållare. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Resultattyp: flera rader, enstaka rad eller enstaka värde. Standardvärde är `selectRows`. |
| `dataSourceKey` | `string` | Identifierare för datakälla. Standardvärdet är huvuddatakällan. |
| `filter` | `Record<string, any>` | Ytterligare filtreringsvillkor (beroende på gränssnittsstöd). |

### options för save

| Parameter | Typ | Beskrivning |
|------|------|------|
| `uid` | `string` | Unik identifierare för mallen. När den sparats kan den exekveras via `runById(uid, ...)`. |
| `sql` | `string` | SQL-innehåll. Stöder `{{ctx.xxx}}`-mallvariabler och `:name` / `?`-platshållare. |
| `dataSourceKey` | `string` | Valfritt. Identifierare för datakälla. |

## SQL-mallvariabler och parameterbindning

### Mallvariabler `{{ctx.xxx}}`

Ni kan använda `{{ctx.xxx}}` i SQL för att referera till kontextvariabler. Dessa tolkas till faktiska värden före exekvering:

```js
// Referera till ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Källorna för refererbara variabler är desamma som för `ctx.getVar()` (t.ex. `ctx.user.*`, `ctx.record.*`, anpassade `ctx.defineProperty`, etc.).

### Parameterbindning

- **Namngivna parametrar**: Använd `:name` i SQL och skicka ett objekt `{ name: value }` i `bind`.
- **Positionella parametrar**: Använd `?` i SQL och skicka en array `[value1, value2]` i `bind`.

```js
// Namngivna parametrar
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Positionella parametrar
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Stockholm', 'active'], type: 'selectVar' }
);
```

## Exempel

### Exekvera temporär SQL (Kräver behörighet för SQL-konfiguration)

```js
// Flera rader (standard)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Enstaka rad
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Enstaka värde (t.ex. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Använda mallvariabler

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Spara och återanvända mallar

```js
// Spara (Kräver behörighet för SQL-konfiguration)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Alla inloggade användare kan exekvera detta
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Radera mall (Kräver behörighet för SQL-konfiguration)
await ctx.sql.destroy('active-users-report');
```

### Sidnumrerad lista (SQLResource)

```js
// Använd SQLResource när sidnumrering eller filtrering behövs
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID för den sparade SQL-mallen
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Innehåller page, pageSize, etc.
```

## Relation till ctx.resource och ctx.request

| Syfte | Rekommenderad användning |
|------|----------|
| **Exekvera SQL-fråga** | `ctx.sql.run()` eller `ctx.sql.runById()` |
| **SQL-sidnumrerad lista (Block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Allmän HTTP-begäran** | `ctx.request()` |

`ctx.sql` kapslar in `flowSql`-API:et och är specialiserat för SQL-scenarier; `ctx.request` kan användas för att anropa vilket API som helst.

## Observera

- Använd parameterbindning (`:name` / `?`) istället för strängkonkatenering för att förhindra SQL-injektion.
- `type: 'selectVar'` returnerar ett skalärt värde, vilket vanligtvis används för `COUNT`, `SUM`, etc.
- Mallvariabler `{{ctx.xxx}}` matchas före exekvering; säkerställ att motsvarande variabler är definierade i kontexten.

## Relaterat

- [ctx.resource](./resource.md): Datatillgångar; SQLResource anropar `flowSql`-API:et internt.
- [ctx.initResource()](./init-resource.md): Initierar SQLResource för sidnumrerade listor etc.
- [ctx.request()](./request.md): Allmänna HTTP-begäranden.