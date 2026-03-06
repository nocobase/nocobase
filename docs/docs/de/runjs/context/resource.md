:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/resource).
:::

# ctx.resource

Die **FlowResource**-Instanz im aktuellen Kontext, die zum Zugriff auf und zur Bearbeitung von Daten verwendet wird. In den meisten Blöcken (Formulare, Tabellen, Details usw.) und Pop-up-Szenarien bindet die Laufzeitumgebung `ctx.resource` vorab. In Szenarien wie JSBlock, in denen standardmäßig keine Ressource vorhanden ist, müssen Sie zuerst [ctx.initResource()](./init-resource.md) aufrufen, um sie zu initialisieren, bevor Sie sie über `ctx.resource` verwenden können.

## Anwendungsbereiche

`ctx.resource` kann in jedem RunJS-Szenario verwendet werden, das Zugriff auf strukturierte Daten (Listen, einzelne Datensätze, benutzerdefinierte APIs, SQL) erfordert. Formular-, Tabellen-, Detail-Blöcke und Pop-ups sind in der Regel vorab gebunden. Für JSBlock, JSField, JSItem, JSColumn usw. können Sie, falls das Laden von Daten erforderlich ist, zuerst `ctx.initResource(type)` aufrufen und dann auf `ctx.resource` zugreifen.

## Typdefinition

```ts
resource: FlowResource | undefined;
```

- In Kontexten mit Vorabbindung ist `ctx.resource` die entsprechende Ressourcen-Instanz.
- In Szenarien wie JSBlock, in denen standardmäßig keine Ressource vorhanden ist, ist der Wert `undefined`, bis `ctx.initResource(type)` aufgerufen wird.

## Gängige Methoden

Die von den verschiedenen Ressourcentypen (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) bereitgestellten Methoden variieren leicht. Im Folgenden sind die universellen oder häufig verwendeten Methoden aufgeführt:

| Methode | Beschreibung |
|------|------|
| `getData()` | Aktuelle Daten abrufen (Liste oder einzelner Datensatz) |
| `setData(value)` | Lokale Daten setzen |
| `refresh()` | Eine Anfrage mit den aktuellen Parametern starten, um die Daten zu aktualisieren |
| `setResourceName(name)` | Ressourcennamen festlegen (z. B. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Primärschlüssel-Filter setzen (für Einzeldatensatz-Abfragen usw.) |
| `runAction(actionName, options)` | Eine beliebige Ressourcen-Aktion aufrufen (z. B. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Ereignisse abonnieren/abbestellen (z. B. `refresh`, `saved`) |

**Spezifisch für MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` usw.

## Beispiele

### Listendaten (erfordert zuerst initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Tabellen-Szenario (vorab gebunden)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Gelöscht'));
```

### Einzelner Datensatz

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Aufruf einer benutzerdefinierten Aktion

```js
await ctx.resource.runAction('create', { data: { name: 'Max Mustermann' } });
```

## Beziehung zu ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Wenn `ctx.resource` nicht existiert, wird eine Instanz erstellt und gebunden; falls sie bereits existiert, wird die vorhandene Instanz zurückgegeben. Dies stellt sicher, dass `ctx.resource` verfügbar ist.
- **ctx.makeResource(type)**: Erstellt eine neue Ressourcen-Instanz und gibt diese zurück, schreibt sie jedoch **nicht** in `ctx.resource`. Dies eignet sich für Szenarien, die mehrere unabhängige Ressourcen oder eine temporäre Nutzung erfordern.
- **ctx.resource**: Greift auf die bereits an den aktuellen Kontext gebundene Ressource zu. Die meisten Blöcke/Pop-ups sind vorab gebunden; andernfalls ist der Wert `undefined` und erfordert `ctx.initResource`.

## Hinweise

- Es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen: `ctx.resource?.refresh()`, insbesondere in Szenarien wie JSBlock, in denen keine Vorabbindung bestehen könnte.
- Nach der Initialisierung müssen Sie `setResourceName(name)` aufrufen, um die Sammlung (Collection) zu spezifizieren, bevor Sie Daten über `refresh()` laden.
- Die vollständige API für jeden Ressourcentyp finden Sie unter den folgenden Links.

## Siehe auch

- [ctx.initResource()](./init-resource.md) - Ressource initialisieren und an den aktuellen Kontext binden
- [ctx.makeResource()](./make-resource.md) - Neue Ressourcen-Instanz erstellen, ohne sie an `ctx.resource` zu binden
- [MultiRecordResource](../resource/multi-record-resource.md) - Mehrere Datensätze/Listen
- [SingleRecordResource](../resource/single-record-resource.md) - Einzelner Datensatz
- [APIResource](../resource/api-resource.md) - Allgemeine API-Ressource
- [SQLResource](../resource/sql-resource.md) - SQL-Abfrage-Ressource