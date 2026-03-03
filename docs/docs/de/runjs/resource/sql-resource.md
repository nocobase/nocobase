:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/resource/sql-resource).
:::

# SQLResource

Eine Resource zum Ausführen von Abfragen basierend auf **gespeicherten SQL-Konfigurationen** oder **dynamischem SQL**. Die Datenquelle stammt von Schnittstellen wie `flowSql:run` / `flowSql:runById`. Sie eignet sich für Berichte, Statistiken, benutzerdefinierte SQL-Listen und andere Szenarien. Im Gegensatz zur [MultiRecordResource](./multi-record-resource.md) ist die SQLResource nicht von Sammlungen (Collections) abhängig; sie führt SQL-Abfragen direkt aus und unterstützt Paginierung, Parameterbindung, Vorlagenvariablen (`{{ctx.xxx}}`) sowie die Steuerung des Ergebnistyps.

**Vererbungshierarchie**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Erstellungsmethode**: `ctx.makeResource('SQLResource')` oder `ctx.initResource('SQLResource')`. Zur Ausführung basierend auf einer gespeicherten Konfiguration verwenden Sie `setFilterByTk(uid)` (die UID der SQL-Vorlage). Zum Debuggen können Sie `setDebug(true)` + `setSQL(sql)` verwenden, um SQL direkt auszuführen. In RunJS wird `ctx.api` durch die Laufzeitumgebung injiziert.

---

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **Berichte / Statistiken** | Komplexe Aggregationen, tabellenübergreifende Abfragen und benutzerdefinierte statistische Kennzahlen. |
| **JSBlock Benutzerdefinierte Listen** | Implementierung spezieller Filterungen, Sortierungen oder Verknüpfungen mittels SQL mit benutzerdefiniertem Rendering. |
| **Diagramm-Blöcke** | Speichern von SQL-Vorlagen als Datenquelle für Diagramme, inklusive Unterstützung für Paginierung. |
| **Wahl zwischen SQLResource und ctx.sql** | Verwenden Sie SQLResource, wenn Paginierung, Ereignisse oder reaktive Daten erforderlich sind; verwenden Sie `ctx.sql.run()` / `ctx.sql.runById()` für einfache, einmalige Abfragen. |

---

## Datenformat

- `getData()` gibt je nach `setSQLType()` unterschiedliche Formate zurück:
  - `selectRows` (Standard): **Array**, Ergebnisse mehrerer Zeilen.
  - `selectRow`: **Einzelnes Objekt**.
  - `selectVar`: **Skalarer Wert** (z. B. COUNT, SUM).
- `getMeta()` gibt Metainformationen wie die Paginierung zurück: `page`, `pageSize`, `count`, `totalPage` usw.

---

## SQL-Konfiguration und Ausführungsmodi

| Methode | Beschreibung |
|------|------|
| `setFilterByTk(uid)` | Legt die UID der auszuführenden SQL-Vorlage fest (entspricht `runById`; muss zuvor in der Administrationsoberfläche gespeichert werden). |
| `setSQL(sql)` | Legt das rohe SQL fest (wird nur für `runBySQL` verwendet, wenn der Debug-Modus `setDebug(true)` aktiviert ist). |
| `setSQLType(type)` | Ergebnistyp: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Wenn auf `true` gesetzt, ruft `refresh` die Methode `runBySQL()` auf; andernfalls wird `runById()` aufgerufen. |
| `run()` | Ruft je nach Debug-Status `runBySQL()` oder `runById()` auf. |
| `runBySQL()` | Führt die Abfrage mit dem in `setSQL` definierten SQL aus (erfordert `setDebug(true)`). |
| `runById()` | Führt die gespeicherte SQL-Vorlage unter Verwendung der aktuellen UID aus. |

---

## Parameter und Kontext

| Methode | Beschreibung |
|------|------|
| `setBind(bind)` | Bindet Variablen. Verwenden Sie ein Objekt für `:name`-Platzhalter oder ein Array für `?`-Platzhalter. |
| `setLiquidContext(ctx)` | Vorlagenkontext (Liquid), wird zum Parsen von `{{ctx.xxx}}` verwendet. |
| `setFilter(filter)` | Zusätzliche Filterbedingungen (werden in die Anforderungsdaten übergeben). |
| `setDataSourceKey(key)` | Identifikator der Datenquelle (wird in Umgebungen mit mehreren Datenquellen verwendet). |

---

## Paginierung

| Methode | Beschreibung |
|------|------|
| `setPage(page)` / `getPage()` | Aktuelle Seite (Standard ist 1). |
| `setPageSize(size)` / `getPageSize()` | Einträge pro Seite (Standard ist 20). |
| `next()` / `previous()` / `goto(page)` | Navigiert durch die Seiten und löst `refresh` aus. |

In SQL können Sie `{{ctx.limit}}` und `{{ctx.offset}}` verwenden, um auf Paginierungsparameter zuzugreifen. Die SQLResource injiziert `limit` und `offset` automatisch in den Kontext.

---

## Datenabruf und Ereignisse

| Methode | Beschreibung |
|------|------|
| `refresh()` | Führt das SQL aus (`runById` oder `runBySQL`), schreibt das Ergebnis in `setData(data)`, aktualisiert die Metadaten und löst das Ereignis `'refresh'` aus. |
| `runAction(actionName, options)` | Ruft zugrunde liegende Aktionen auf (z. B. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Wird ausgelöst, wenn die Aktualisierung abgeschlossen ist oder der Ladevorgang beginnt. |

---

## Beispiele

### Ausführung über eine gespeicherte Vorlage (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID der gespeicherten SQL-Vorlage
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count usw.
```

### Debug-Modus: SQL direkt ausführen (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginierung und Navigation

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigation
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Ergebnistypen

```js
// Mehrere Zeilen (Standard)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Einzelne Zeile
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Einzelner Wert (z. B. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Verwendung von Vorlagenvariablen

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Auf das refresh-Ereignis hören

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Wichtige Hinweise

- **runById erfordert vorheriges Speichern der Vorlage**: Die in `setFilterByTk(uid)` verwendete UID muss eine SQL-Vorlagen-ID sein, die bereits in der Administrationsoberfläche gespeichert wurde. Sie können diese über `ctx.sql.save({ uid, sql })` speichern.
- **Debug-Modus erfordert Berechtigungen**: `setDebug(true)` nutzt `flowSql:run`, was voraussetzt, dass die aktuelle Rolle über Berechtigungen zur SQL-Konfiguration verfügt. `runById` erfordert lediglich, dass der Benutzer angemeldet ist.
- **Refresh-Debouncing**: Mehrfache Aufrufe von `refresh()` innerhalb desselben Ereigniszyklus führen nur die letzte Anfrage aus, um redundante Anfragen zu vermeiden.
- **Parameterbindung zur Vermeidung von Injektionen**: Verwenden Sie `setBind()` mit `:name` oder `?` Platzhaltern anstelle von String-Verkettungen, um SQL-Injektionen zu verhindern.

---

## Verwandte Themen

- [ctx.sql](../context/sql.md) – SQL-Ausführung und -Verwaltung; `ctx.sql.runById` eignet sich für einfache, einmalige Abfragen.
- [ctx.resource](../context/resource.md) – Die Resource-Instanz im aktuellen Kontext.
- [ctx.initResource()](../context/init-resource.md) – Initialisiert und bindet an `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) – Erstellt eine neue Resource-Instanz ohne Bindung.
- [APIResource](./api-resource.md) – Allgemeine API-Resource.
- [MultiRecordResource](./multi-record-resource.md) – Konzipiert für Sammlungen und Listen.