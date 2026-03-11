:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/resource/sql-resource).
:::

# SQLResource

En resurs (Resource) för att köra frågor baserat på **sparade SQL-konfigurationer** eller **dynamisk SQL**. Datakällan kommer från gränssnitt som `flowSql:run` / `flowSql:runById`. Den är lämplig för rapporter, statistik, anpassade SQL-listor och andra scenarier. Till skillnad från [MultiRecordResource](./multi-record-resource.md) är SQLResource inte beroende av samlingar (collections); den kör SQL-frågor direkt och stöder sidbrytning (pagination), parameterbindning, mallvariabler (`{{ctx.xxx}}`) och kontroll av resultattyp.

**Arv**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Skapande**: `ctx.makeResource('SQLResource')` eller `ctx.initResource('SQLResource')`. För att köra baserat på en sparad konfiguration, använd `setFilterByTk(uid)` (UID för SQL-mallen). För felsökning, använd `setDebug(true)` + `setSQL(sql)` för att köra SQL direkt. I RunJS injiceras `ctx.api` av körtidsmiljön.

---

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **Rapporter / Statistik** | Komplexa aggregeringar, frågor över flera tabeller och anpassade statistiska mätvärden. |
| **JSBlock anpassade listor** | Implementering av speciell filtrering, sortering eller kopplingar med SQL och anpassad rendering. |
| **Diagramblock** | Driv datakällor för diagram med sparade SQL-mallar, med stöd för sidbrytning. |
| **Valet mellan SQLResource och ctx.sql** | Använd SQLResource när sidbrytning, händelser eller reaktiva data krävs; använd `ctx.sql.run()` / `ctx.sql.runById()` för enkla engångsfrågor. |

---

## Dataformat

- `getData()` returnerar olika format baserat på `setSQLType()`:
  - `selectRows` (standard): **Array**, resultat med flera rader.
  - `selectRow`: **Ett enskilt objekt**.
  - `selectVar`: **Skalärvärde** (t.ex. COUNT, SUM).
- `getMeta()` returnerar metadata som sidbrytning: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## SQL-konfiguration och exekveringslägen

| Metod | Beskrivning |
|------|------|
| `setFilterByTk(uid)` | Ställer in UID för den SQL-mall som ska köras (motsvarar `runById`; måste först sparas i administratörsgränssnittet). |
| `setSQL(sql)` | Ställer in rå SQL (används endast för `runBySQL` när felsökningsläge `setDebug(true)` är aktiverat). |
| `setSQLType(type)` | Resultattyp: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | När den är `true` anropar `refresh` `runBySQL()`; annars anropas `runById()`. |
| `run()` | Anropar `runBySQL()` eller `runById()` baserat på felsökningsstatus. |
| `runBySQL()` | Körs med den SQL som definierats i `setSQL` (kräver `setDebug(true)`). |
| `runById()` | Kör den sparade SQL-mallen med nuvarande UID. |

---

## Parametrar och kontext

| Metod | Beskrivning |
|------|------|
| `setBind(bind)` | Binder variabler. Använd ett objekt för `:name`-platshållare eller en array för `?`-platshållare. |
| `setLiquidContext(ctx)` | Mallkontext (Liquid), används för att tolka `{{ctx.xxx}}`. |
| `setFilter(filter)` | Ytterligare filtervillkor (skickas med i begäransdata). |
| `setDataSourceKey(key)` | Identifierare för datakälla (används i miljöer med flera datakällor). |

---

## Sidbrytning

| Metod | Beskrivning |
|------|------|
| `setPage(page)` / `getPage()` | Aktuell sida (standard är 1). |
| `setPageSize(size)` / `getPageSize()` | Antal objekt per sida (standard är 20). |
| `next()` / `previous()` / `goto(page)` | Navigerar mellan sidor och utlöser `refresh`. |

I SQL kan ni använda `{{ctx.limit}}` och `{{ctx.offset}}` för att referera till sidbrytningsparametrar. SQLResource injicerar automatiskt `limit` och `offset` i kontexten.

---

## Datahämtning och händelser

| Metod | Beskrivning |
|------|------|
| `refresh()` | Kör SQL (`runById` eller `runBySQL`), skriver resultatet till `setData(data)`, uppdaterar meta och utlöser händelsen `'refresh'`. |
| `runAction(actionName, options)` | Anropar underliggande åtgärder (t.ex. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Utlöses när uppdateringen är klar eller när laddning startar. |

---

## Exempel

### Exekvering via sparad mall (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID för den sparade SQL-mallen
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Felsökningsläge: Kör SQL direkt (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Sidbrytning och navigering

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigering
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Resultattyper

```js
// Flera rader (standard)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Enskild rad
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Enskilt värde (t.ex. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Använd mallvariabler

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Lyssna på refresh-händelsen

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Observera

- **runById kräver att mallen sparas först**: UID som används i `setFilterByTk(uid)` måste vara ett SQL-mall-ID som redan sparats i administratörsgränssnittet. Ni kan spara det via `ctx.sql.save({ uid, sql })`.
- **Felsökningsläge kräver behörighet**: `setDebug(true)` använder `flowSql:run`, vilket kräver att den nuvarande rollen har behörighet för SQL-konfiguration. `runById` kräver endast att användaren är inloggad.
- **Refresh-debouncing**: Flera anrop till `refresh()` inom samma händelseloop kommer endast att köra det sista anropet för att undvika redundanta förfrågningar.
- **Parameterbindning för att förhindra injicering**: Använd `setBind()` med `:name` eller `?` som platshållare istället för strängkonkatenering för att förhindra SQL-injicering.

---

## Relaterat

- [ctx.sql](../context/sql.md) – SQL-exekvering och hantering; `ctx.sql.runById` är lämplig för enkla engångsfrågor.
- [ctx.resource](../context/resource.md) – Resursinstansen i den aktuella kontexten.
- [ctx.initResource()](../context/init-resource.md) – Initierar och binder till `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) – Skapar en ny resursinstans utan bindning.
- [APIResource](./api-resource.md) – Allmän API-resurs.
- [MultiRecordResource](./multi-record-resource.md) – Designad för samlingar (collections) och listor.