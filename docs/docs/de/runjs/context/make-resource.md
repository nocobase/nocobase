:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Erstellt** eine neue Resource-Instanz und gibt diese zurück, **ohne** `ctx.resource` zu beschreiben oder zu verändern. Dies eignet sich für Szenarien, die mehrere unabhängige Ressourcen oder eine temporäre Nutzung erfordern.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **Mehrere Ressourcen** | Gleichzeitiges Laden mehrerer Datenquellen (z. B. Benutzerliste + Bestellliste), wobei jede eine unabhängige Resource verwendet. |
| **Temporäre Abfragen** | Einmalige Abfragen, die nach der Verwendung verworfen werden, ohne dass eine Bindung an `ctx.resource` erforderlich ist. |
| **Hilfsdaten** | Verwendung von `ctx.resource` für Primärdaten und `makeResource` zur Erstellung von Instanzen für zusätzliche Daten. |

Wenn Sie nur eine einzelne Resource benötigen und diese an `ctx.resource` binden möchten, ist die Verwendung von [ctx.initResource()](./init-resource.md) besser geeignet.

## Typdefinition

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `resourceType` | `string` | Ressourcentyp: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Rückgabewert**: Die neu erstellte Resource-Instanz.

## Unterschied zu ctx.initResource()

| Methode | Verhalten |
|------|------|
| `ctx.makeResource(type)` | Erstellt und gibt nur eine neue Instanz zurück, schreibt **nicht** in `ctx.resource`. Kann mehrfach aufgerufen werden, um mehrere unabhängige Ressourcen zu erhalten. |
| `ctx.initResource(type)` | Erstellt und bindet die Instanz, falls `ctx.resource` nicht existiert; gibt sie direkt zurück, falls sie bereits vorhanden ist. Stellt sicher, dass `ctx.resource` verfügbar ist. |

## Beispiele

### Einzelne Resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource behält seinen ursprünglichen Wert (falls vorhanden)
```

### Mehrere Ressourcen

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Benutzeranzahl: {usersRes.getData().length}</p>
    <p>Bestellanzahl: {ordersRes.getData().length}</p>
  </div>
);
```

### Temporäre Abfrage

```ts
// Einmalige Abfrage, verunreinigt ctx.resource nicht
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Hinweise

- Die neu erstellte Resource muss `setResourceName(name)` aufrufen, um die Sammlung zu spezifizieren, und anschließend die Daten über `refresh()` laden.
- Jede Resource-Instanz ist unabhängig und beeinflusst andere nicht; dies ist ideal für das parallele Laden mehrerer Datenquellen.

## Verwandte Themen

- [ctx.initResource()](./init-resource.md): Initialisieren und an `ctx.resource` binden
- [ctx.resource](./resource.md): Die Resource-Instanz im aktuellen Kontext
- [MultiRecordResource](../resource/multi-record-resource) — Mehrere Datensätze/Liste
- [SingleRecordResource](../resource/single-record-resource) — Einzelner Datensatz
- [APIResource](../resource/api-resource) — Allgemeine API-Ressource
- [SQLResource](../resource/sql-resource) — SQL-Abfrageressource