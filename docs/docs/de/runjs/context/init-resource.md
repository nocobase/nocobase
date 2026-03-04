:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/init-resource).
:::

# ctx.initResource()

**Initialisiert** die Ressource für den aktuellen Kontext: Falls `ctx.resource` noch nicht existiert, wird eine Ressource des angegebenen Typs erstellt und an den Kontext gebunden; falls sie bereits existiert, wird sie direkt verwendet. Danach kann über `ctx.resource` darauf zugegriffen werden.

## Anwendungsfälle

Wird im Allgemeinen nur in **JSBlock**-Szenarien (unabhängige Blöcke) verwendet. Die meisten Blöcke, Popups und andere Komponenten haben `ctx.resource` bereits vorab gebunden, sodass kein manueller Aufruf erforderlich ist. JSBlock verfügt standardmäßig über keine Ressource, daher müssen Sie zuerst `ctx.initResource(type)` aufrufen, bevor Sie Daten über `ctx.resource` laden können.

## Typdefinition

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Typ | Beschreibung |
|-----------|------|-------------|
| `type` | `string` | Ressourcentyp: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Rückgabewert**: Die Ressourcen-Instanz im aktuellen Kontext (d. h. `ctx.resource`).

## Unterschied zu ctx.makeResource()

| Methode | Verhalten |
|--------|----------|
| `ctx.initResource(type)` | Erstellt und bindet die Ressource, falls `ctx.resource` nicht existiert; gibt die vorhandene zurück, falls sie bereits existiert. Stellt sicher, dass `ctx.resource` verfügbar ist. |
| `ctx.makeResource(type)` | Erstellt nur eine neue Instanz und gibt diese zurück, schreibt jedoch **nicht** in `ctx.resource`. Geeignet für Szenarien, die mehrere unabhängige Ressourcen oder eine temporäre Nutzung erfordern. |

## Beispiele

### Listendaten (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Einzelner Datensatz (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Primärschlüssel angeben
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Datenquelle angeben

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Hinweise

- In den meisten Block-Szenarien (Formulare, Tabellen, Details usw.) und Popups ist `ctx.resource` bereits durch die Laufzeitumgebung vorab gebunden, sodass der Aufruf von `ctx.initResource` nicht erforderlich ist.
- Eine manuelle Initialisierung ist nur in Kontexten wie JSBlock erforderlich, in denen standardmäßig keine Ressource vorhanden ist.
- Nach der Initialisierung müssen Sie `setResourceName(name)` aufrufen, um die Sammlung (Collection) anzugeben, und anschließend `refresh()` aufrufen, um die Daten zu laden.

## Verwandte Themen

- [ctx.resource](./resource.md) — Die Ressourcen-Instanz im aktuellen Kontext
- [ctx.makeResource()](./make-resource.md) — Erstellt eine neue Ressourcen-Instanz, ohne sie an `ctx.resource` zu binden
- [MultiRecordResource](../resource/multi-record-resource.md) — Mehrere Datensätze/Liste
- [SingleRecordResource](../resource/single-record-resource.md) — Einzelner Datensatz
- [APIResource](../resource/api-resource.md) — Allgemeine API-Ressource
- [SQLResource](../resource/sql-resource.md) — SQL-Abfrageressource