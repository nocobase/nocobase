:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Eine auf **einzelne Datensätze** ausgerichtete Resource: Die Daten bestehen aus einem einzelnen Objekt. Sie unterstützt das Abrufen per Hauptschlüssel, das Erstellen/Aktualisieren (`save`) sowie das Löschen. Sie eignet sich für Szenarien mit „einzelnen Datensätzen“ wie Details oder Formulare. Im Gegensatz zur [MultiRecordResource](./multi-record-resource.md) gibt `getData()` bei der `SingleRecordResource` ein einzelnes Objekt zurück. Über `setFilterByTk(id)` wird der Hauptschlüssel festgelegt, und `save()` ruft je nach Zustand von `isNewRecord` automatisch `create` oder `update` auf.

**Vererbungshierarchie**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Erstellung**: `ctx.makeResource('SingleRecordResource')` oder `ctx.initResource('SingleRecordResource')`. Vor der Verwendung muss `setResourceName('Sammlungsname')` aufgerufen werden. Bei Operationen über den Hauptschlüssel ist `setFilterByTk(id)` erforderlich. In RunJS wird `ctx.api` durch die Laufzeitumgebung injiziert.

---

## Anwendungsszenarien

| Szenario | Beschreibung |
|------|------|
| **Details-Block** | Der Details-Block verwendet standardmäßig die `SingleRecordResource`, um einen einzelnen Datensatz anhand des Hauptschlüssels zu laden. |
| **Formular-Block** | Formulare zum Erstellen/Bearbeiten verwenden die `SingleRecordResource`, wobei `save()` automatisch zwischen `create` und `update` unterscheidet. |
| **JSBlock Details** | Laden eines einzelnen Benutzers, Auftrags usw. in einem JSBlock zur benutzerdefinierten Darstellung. |
| **Verknüpfte Ressourcen** | Laden verknüpfter einzelner Datensätze im Format `users.profile`, erfordert die Verwendung von `setSourceId(ID des übergeordneten Datensatzes)`. |

---

## Datenformat

- `getData()` gibt ein **einzelnes Datensatz-Objekt** zurück, was dem Feld `data` der Get-Schnittstelle entspricht.
- `getMeta()` gibt Metainformationen zurück (falls vorhanden).

---

## Ressourcenname und Hauptschlüssel

| Methode | Beschreibung |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Ressourcenname, z. B. `'users'`, `'users.profile'` (verknüpfte Resource). |
| `setSourceId(id)` / `getSourceId()` | ID des übergeordneten Datensatzes bei verknüpften Ressourcen (z. B. benötigt `users.profile` den Hauptschlüssel von `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifikator der Datenquelle (wird bei mehreren Datenquellen verwendet). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Hauptschlüssel des aktuellen Datensatzes; nach dem Festlegen ist `isNewRecord` gleich `false`. |

---

## Status

| Eigenschaft/Methode | Beschreibung |
|----------|------|
| `isNewRecord` | Gibt an, ob es sich um einen „Neu“-Zustand handelt (true, wenn `filterByTk` nicht gesetzt ist oder der Datensatz neu erstellt wurde). |

---

## Abfrageparameter (Filter / Felder)

| Methode | Beschreibung |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filterung (verfügbar, wenn kein „Neu“-Zustand vorliegt). |
| `setFields(fields)` / `getFields()` | Abgefragte Felder. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Verknüpfungserweiterungen (Appends). |

---

## CRUD

| Methode | Beschreibung |
|------|------|
| `refresh()` | Führt eine Get-Anfrage basierend auf dem aktuellen `filterByTk` aus und aktualisiert `getData()`; im „Neu“-Zustand erfolgt keine Anfrage. |
| `save(data, options?)` | Ruft beim Erstellen `create` auf, andernfalls `update`; optional verhindert `{ refresh: false }` die automatische Aktualisierung. |
| `destroy(options?)` | Löscht den Datensatz basierend auf dem aktuellen `filterByTk` und leert die lokalen Daten. |
| `runAction(actionName, options)` | Ruft eine beliebige Ressourcen-Aktion (Action) auf. |

---

## Konfiguration und Ereignisse

| Methode | Beschreibung |
|------|------|
| `setSaveActionOptions(options)` | Anfragekonfiguration für die `save`-Aktion. |
| `on('refresh', fn)` / `on('saved', fn)` | Wird nach Abschluss der Aktualisierung bzw. nach dem Speichern ausgelöst. |

---

## Beispiele

### Grundlegendes Abrufen und Aktualisieren

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Aktualisieren
await ctx.resource.save({ name: 'Max Mustermann' });
```

### Neuen Datensatz erstellen

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Erika Musterfrau', email: 'erika@example.com' });
```

### Datensatz löschen

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Nach destroy() ist getData() null
```

### Verknüpfungserweiterungen und Felder

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Verknüpfte Ressourcen (z. B. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Hauptschlüssel des übergeordneten Datensatzes
res.setFilterByTk(profileId);    // Wenn profile eine hasOne-Beziehung ist, kann filterByTk weggelassen werden
await res.refresh();
const profile = res.getData();
```

### Speichern ohne automatische Aktualisierung

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Nach dem Speichern wird refresh nicht ausgelöst, getData() behält den alten Wert
```

### Auf refresh / saved Ereignisse hören

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Benutzer: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Erfolgreich gespeichert');
});
await ctx.resource?.refresh?.();
```

---

## Hinweise

- **setResourceName ist erforderlich**: Vor der Verwendung müssen Sie `setResourceName('Sammlungsname')` aufrufen, da sonst die Anfrage-URL nicht erstellt werden kann.
- **filterByTk und isNewRecord**: Wenn `setFilterByTk` nicht gesetzt ist, ist `isNewRecord` true und `refresh()` sendet keine Anfrage; `save()` führt dann ein `create` aus.
- **Verknüpfte Ressourcen**: Wenn der Ressourcenname im Format `parent.child` vorliegt (z. B. `users.profile`), müssen Sie zuerst `setSourceId(Hauptschlüssel des Eltern-Datensatzes)` aufrufen.
- **getData ist ein Objekt**: Die von der Single-Schnittstelle zurückgegebenen `data` sind ein Datensatz-Objekt; `getData()` gibt dieses Objekt direkt zurück. Nach `destroy()` ist der Wert null.

---

## Verwandte Themen

- [ctx.resource](../context/resource.md) – Die Resource-Instanz im aktuellen Kontext
- [ctx.initResource()](../context/init-resource.md) – Initialisieren und an `ctx.resource` binden
- [ctx.makeResource()](../context/make-resource.md) – Neue Resource-Instanz erstellen, ohne Bindung
- [APIResource](./api-resource.md) – Allgemeine API-Ressource, Abfrage per URL
- [MultiRecordResource](./multi-record-resource.md) – Ausgerichtet auf Sammlungen/Listen, unterstützt CRUD und Paginierung