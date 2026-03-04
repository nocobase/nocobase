:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` bietet Funktionen zur Ausführung und Verwaltung von SQL, die häufig in RunJS (wie JSBlock, Ereignis-Workflows) verwendet werden, um direkt auf die Datenbank zuzugreifen. Es unterstützt die temporäre SQL-Ausführung, die Ausführung gespeicherter SQL-Vorlagen nach ID, Parameterbindung, Vorlagenvariablen (`{{ctx.xxx}}`) sowie die Steuerung des Ergebnistyps.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | Benutzerdefinierte Statistikberichte, komplexe Filterlisten und tabellenübergreifende Aggregationsabfragen. |
| **Diagramm-Block** | Speichern von SQL-Vorlagen zur Steuerung von Diagramm-Datenquellen. |
| **Workflow / Verknüpfung** | Ausführen von vordefiniertem SQL zum Abrufen von Daten für die nachfolgende Logik. |
| **SQLResource** | Verwendung in Kombination mit `ctx.initResource('SQLResource')` für Szenarien wie paginierte Listen. |

> Hinweis: `ctx.sql` greift über die `flowSql`-API auf die Datenbank zu. Stellen Sie sicher, dass der aktuelle Benutzer über die entsprechenden Ausführungsberechtigungen für die Datenquelle verfügt.

## Berechtigungen

| Berechtigung | Methode | Beschreibung |
|------|------|------|
| **Angemeldeter Benutzer** | `runById` | Ausführung basierend auf einer konfigurierten SQL-Vorlagen-ID. |
| **SQL-Konfigurationsberechtigung** | `run`, `save`, `destroy` | Temporäres SQL ausführen oder SQL-Vorlagen speichern, aktualisieren oder löschen. |

Die Frontend-Logik für reguläre Benutzer sollte `ctx.sql.runById(uid, options)` verwenden. Wenn dynamisches SQL oder die Verwaltung von Vorlagen erforderlich ist, stellen Sie sicher, dass die aktuelle Rolle über SQL-Konfigurationsberechtigungen verfügt.

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

## Gängige Methoden

| Methode | Beschreibung | Berechtigungsanforderung |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Führt temporäres SQL aus; unterstützt Parameterbindung und Vorlagenvariablen. | SQL-Konfigurationsberechtigung |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Speichert oder aktualisiert eine SQL-Vorlage nach ID zur Wiederverwendung. | SQL-Konfigurationsberechtigung |
| `ctx.sql.runById(uid, options?)` | Führt eine zuvor gespeicherte SQL-Vorlage anhand ihrer ID aus. | Jeder angemeldete Benutzer |
| `ctx.sql.destroy(uid)` | Löscht eine angegebene SQL-Vorlage nach ID. | SQL-Konfigurationsberechtigung |

Hinweis:

- `run` wird zum Debuggen von SQL verwendet und erfordert Konfigurationsberechtigungen.
- `save` und `destroy` werden zur Verwaltung von SQL-Vorlagen verwendet und erfordern Konfigurationsberechtigungen.
- `runById` ist für reguläre Benutzer offen; es kann nur gespeicherte Vorlagen ausführen und das SQL weder debuggen noch ändern.
- Wenn eine SQL-Vorlage geändert wird, muss `save` aufgerufen werden, um die Änderungen zu speichern.

## Parameter

### Optionen für run / runById

| Parameter | Typ | Beschreibung |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Bindungsvariablen. Objektform für `:name`-Platzhalter, Array-Form für `?`-Platzhalter. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Ergebnistyp: Mehrere Zeilen, einzelne Zeile oder Einzelwert. Standard ist `selectRows`. |
| `dataSourceKey` | `string` | Kennung der Datenquelle. Standardmäßig wird die Hauptdatenquelle verwendet. |
| `filter` | `Record<string, any>` | Zusätzliche Filterbedingungen (je nach Schnittstellenunterstützung). |

### Optionen für save

| Parameter | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | Eindeutige Kennung für die Vorlage. Nach dem Speichern kann sie über `runById(uid, ...)` ausgeführt werden. |
| `sql` | `string` | SQL-Inhalt. Unterstützt `{{ctx.xxx}}`-Vorlagenvariablen und `:name` / `?`-Platzhalter. |
| `dataSourceKey` | `string` | Optional. Kennung der Datenquelle. |

## SQL-Vorlagenvariablen und Parameterbindung

### Vorlagenvariablen `{{ctx.xxx}}`

Sie können `{{ctx.xxx}}` in SQL verwenden, um auf Kontextvariablen zu verweisen. Diese werden vor der Ausführung in tatsächliche Werte aufgelöst:

```js
// Verweis auf ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Die Quellen für referenzierbare Variablen sind dieselben wie bei `ctx.getVar()` (z. B. `ctx.user.*`, `ctx.record.*`, benutzerdefinierte `ctx.defineProperty` usw.).

### Parameterbindung

- **Benannte Parameter**: Verwenden Sie `:name` im SQL und übergeben Sie ein Objekt `{ name: value }` in `bind`.
- **Positionsparameter**: Verwenden Sie `?` im SQL und übergeben Sie ein Array `[value1, value2]` in `bind`.

```js
// Benannte Parameter
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Positionsparameter
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Berlin', 'active'], type: 'selectVar' }
);
```

## Beispiele

### Temporäres SQL ausführen (Erfordert SQL-Konfigurationsberechtigung)

```js
// Mehrere Zeilen (Standard)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Einzelne Zeile
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Einzelwert (z. B. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Verwendung von Vorlagenvariablen

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Vorlagen speichern und wiederverwenden

```js
// Speichern (Erfordert SQL-Konfigurationsberechtigung)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Jeder angemeldete Benutzer kann dies ausführen
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Vorlage löschen (Erfordert SQL-Konfigurationsberechtigung)
await ctx.sql.destroy('active-users-report');
```

### Paginierte Liste (SQLResource)

```js
// Verwenden Sie SQLResource, wenn Paginierung oder Filterung erforderlich ist
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID der gespeicherten SQL-Vorlage
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Enthält page, pageSize usw.
```

## Beziehung zu ctx.resource und ctx.request

| Zweck | Empfohlene Verwendung |
|------|----------|
| **SQL-Abfrage ausführen** | `ctx.sql.run()` oder `ctx.sql.runById()` |
| **SQL-paginierte Liste (Block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Allgemeine HTTP-Anfrage** | `ctx.request()` |

`ctx.sql` kapselt die `flowSql`-API und ist auf SQL-Szenarien spezialisiert; `ctx.request` kann verwendet werden, um jede beliebige API aufzurufen.

## Wichtige Hinweise

- Verwenden Sie Parameterbindung (`:name` / `?`) anstelle von String-Verkettung, um SQL-Injection zu vermeiden.
- `type: 'selectVar'` gibt einen skalaren Wert zurück, der normalerweise für `COUNT`, `SUM` usw. verwendet wird.
- Vorlagenvariablen `{{ctx.xxx}}` werden vor der Ausführung aufgelöst; stellen Sie sicher, dass die entsprechenden Variablen im Kontext definiert sind.

## Verwandte Themen

- [ctx.resource](./resource.md): Datenressourcen; SQLResource ruft intern die `flowSql`-API auf.
- [ctx.initResource()](./init-resource.md): Initialisiert SQLResource für paginierte Listen usw.
- [ctx.request()](./request.md): Allgemeine HTTP-Anfragen.