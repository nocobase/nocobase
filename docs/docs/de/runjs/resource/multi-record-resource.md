:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Eine auf Datentabellen ausgerichtete Resource: Anfragen geben ein Array zurück und unterstützen Paginierung, Filterung, Sortierung sowie CRUD-Operationen. Sie eignet sich für Szenarien mit „mehreren Datensätzen“ wie Tabellen oder Listen. Im Gegensatz zur [APIResource](./api-resource.md) spezifiziert die MultiRecordResource den Ressourcennamen über `setResourceName()`, erstellt automatisch URLs wie `users:list` oder `users:create` und verfügt über integrierte Funktionen für Paginierung, Filterung und Zeilenauswahl.

**Vererbungshierarchie**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Erstellung**: `ctx.makeResource('MultiRecordResource')` oder `ctx.initResource('MultiRecordResource')`. Vor der Verwendung müssen Sie `setResourceName('SammlungsName')` (z. B. `'users'`) aufrufen; in RunJS wird `ctx.api` durch die Laufzeitumgebung bereitgestellt.

---

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **Tabellen-Blöcke** | Tabellen- und Listen-Blöcke verwenden standardmäßig die MultiRecordResource und unterstützen Paginierung, Filterung und Sortierung. |
| **JSBlock-Listen** | Laden Sie Daten aus Sammlungen wie Benutzern oder Bestellungen in einem JSBlock und führen Sie ein benutzerdefiniertes Rendering durch. |
| **Stapelverarbeitung** | Verwenden Sie `getSelectedRows()`, um ausgewählte Zeilen abzurufen, und `destroySelectedRows()` für die Massenlöschung. |
| **Assoziations-Ressourcen** | Laden Sie verknüpfte Sammlungen in Formaten wie `users.tags`, was die Angabe von `setSourceId(parentRecordId)` erfordert. |

---

## Datenformat

- `getData()` gibt ein **Array von Datensätzen** zurück, was dem Feld `data` der List-API-Antwort entspricht.
- `getMeta()` gibt Metadaten zur Paginierung und andere Informationen zurück: `page`, `pageSize`, `count`, `totalPage` usw.

---

## Ressourcenname und Datenquelle

| Methode | Beschreibung |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Der Ressourcenname, z. B. `'users'`, `'users.tags'` (Assoziations-Ressource). |
| `setSourceId(id)` / `getSourceId()` | Die ID des übergeordneten Datensatzes bei Assoziations-Ressourcen (z. B. für `users.tags` übergeben Sie den Primärschlüssel des Benutzers). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifikator der Datenquelle (wird in Szenarien mit mehreren Datenquellen verwendet). |

---

## Anfrageparameter (Filter / Felder / Sortierung)

| Methode | Beschreibung |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filterung nach Primärschlüssel (für Einzelabfragen mit `get` usw.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filterbedingungen, unterstützt Operatoren wie `$eq`, `$ne`, `$in` usw. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filtergruppen (zum Kombinieren mehrerer Bedingungen). |
| `setFields(fields)` / `getFields()` | Angeforderte Felder (Whitelist). |
| `setSort(sort)` / `getSort()` | Sortierung, z. B. `['-createdAt']` für absteigende Sortierung nach Erstellungsdatum. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Laden von Assoziationen (z. B. `['user', 'tags']`). |

---

## Paginierung

| Methode | Beschreibung |
|------|------|
| `setPage(page)` / `getPage()` | Aktuelle Seite (beginnend bei 1). |
| `setPageSize(size)` / `getPageSize()` | Anzahl der Einträge pro Seite, Standardwert ist 20. |
| `getTotalPage()` | Gesamtanzahl der Seiten. |
| `getCount()` | Gesamtanzahl der Datensätze (aus den serverseitigen Metadaten). |
| `next()` / `previous()` / `goto(page)` | Seite wechseln und `refresh` auslösen. |

---

## Ausgewählte Zeilen (Tabellen-Szenarien)

| Methode | Beschreibung |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Daten der aktuell ausgewählten Zeilen, verwendet für Massenlöschungen und andere Operationen. |

---

## CRUD- und Listen-Operationen

| Methode | Beschreibung |
|------|------|
| `refresh()` | Fragt die Liste mit den aktuellen Parametern ab, aktualisiert `getData()` sowie die Paginierungs-Metadaten und löst das Ereignis `'refresh'` aus. |
| `get(filterByTk)` | Fragt einen einzelnen Datensatz ab und gibt diesen zurück (schreibt nicht in `getData`). |
| `create(data, options?)` | Erstellt einen Datensatz. Optional verhindert `{ refresh: false }` die automatische Aktualisierung. Löst `'saved'` aus. |
| `update(filterByTk, data, options?)` | Aktualisiert einen Datensatz anhand seines Primärschlüssels. |
| `destroy(target)` | Löscht Datensätze. `target` kann ein Primärschlüssel, ein Zeilenobjekt oder ein Array von Primärschlüsseln/Zeilenobjekten sein (Massenlöschung). |
| `destroySelectedRows()` | Löscht die aktuell ausgewählten Zeilen (wirft einen Fehler, wenn keine ausgewählt sind). |
| `setItem(index, item)` | Ersetzt eine bestimmte Datenzeile lokal (löst keine Anfrage aus). |
| `runAction(actionName, options)` | Ruft eine beliebige Ressourcen-Aktion auf (z. B. benutzerdefinierte Aktionen). |

---

## Konfiguration und Ereignisse

| Methode | Beschreibung |
|------|------|
| `setRefreshAction(name)` | Die beim Aktualisieren aufgerufene Aktion, Standard ist `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Anfragekonfiguration für Erstellen/Aktualisieren. |
| `on('refresh', fn)` / `on('saved', fn)` | Wird nach Abschluss der Aktualisierung oder nach dem Speichern ausgelöst. |

---

## Beispiele

### Einfache Liste

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filterung und Sortierung

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Laden von Assoziationen

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Erstellen und Paginierung

```js
await ctx.resource.create({ name: 'Max Mustermann', email: 'max.mustermann@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Ausgewählte Zeilen massenhaft löschen

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Bitte wählen Sie zuerst Daten aus');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Gelöscht'));
```

### Auf das refresh-Ereignis hören

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Assoziations-Ressource (Untertabellen)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Hinweise

- **setResourceName ist erforderlich**: Sie müssen `setResourceName('SammlungsName')` vor der Verwendung aufrufen, da sonst die Anfrage-URL nicht erstellt werden kann.
- **Assoziations-Ressourcen**: Wenn der Ressourcenname im Format `parent.child` vorliegt (z. B. `users.tags`), müssen Sie zuerst `setSourceId(parentPrimaryKey)` aufrufen.
- **Refresh-Debouncing**: Mehrere Aufrufe von `refresh()` innerhalb desselben Ereigniszyklus (Event Loop) führen nur die letzte Anfrage aus, um redundante Anfragen zu vermeiden.
- **getData gibt ein Array zurück**: Die von der Listen-API zurückgegebenen `data` sind ein Array von Datensätzen, und `getData()` gibt dieses Array direkt zurück.

---

## Verwandte Themen

- [ctx.resource](../context/resource.md) - Die Ressourcen-Instanz im aktuellen Kontext
- [ctx.initResource()](../context/init-resource.md) - Initialisieren und an ctx.resource binden
- [ctx.makeResource()](../context/make-resource.md) - Eine neue Ressourcen-Instanz erstellen, ohne sie zu binden
- [APIResource](./api-resource.md) - Allgemeine API-Ressource, die per URL angefragt wird
- [SingleRecordResource](./single-record-resource.md) - Ausgerichtet auf einen einzelnen Datensatz