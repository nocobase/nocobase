---
title: "Resource API"
description: "NocoBase FlowEngine Resource API Referenz: vollständige Methodensignaturen, Parameterformate und Filter-Syntax für MultiRecordResource und SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine stellt zwei Resource-Klassen für die Datenoperationen im Frontend bereit – `MultiRecordResource` für Listen/Tabellen (mehrere Datensätze) und `SingleRecordResource` für Formulare/Detailansichten (ein einzelner Datensatz). Sie kapseln REST-API-Aufrufe und bieten eine reaktive Datenverwaltung.

Vererbungskette: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Wird für Listen, Tabellen, Kanban-Ansichten und andere Szenarien mit mehreren Datensätzen verwendet. Wird aus `@nocobase/flow-engine` importiert.

### Datenoperationen

| Methode | Parameter | Beschreibung |
|------|------|------|
| `getData()` | - | Gibt `TDataItem[]` zurück, Anfangswert ist `[]` |
| `hasData()` | - | Gibt an, ob das Datenarray nicht leer ist |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Erstellt einen Datensatz, führt nach dem Erstellen standardmäßig automatisch ein Refresh aus |
| `get(filterByTk)` | `filterByTk: string \| number` | Ruft einen einzelnen Datensatz anhand des Primärschlüssels ab |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Aktualisiert einen Datensatz und führt anschließend automatisch ein Refresh aus |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Löscht Datensätze, unterstützt Stapelverarbeitung |
| `destroySelectedRows()` | - | Löscht alle ausgewählten Zeilen |
| `refresh()` | - | Aktualisiert die Daten (ruft die `list` Action auf), mehrfache Aufrufe innerhalb derselben Event-Loop werden zusammengeführt |

### Paginierung

| Methode | Beschreibung |
|------|------|
| `getPage()` | Gibt die aktuelle Seitennummer zurück |
| `setPage(page)` | Setzt die Seitennummer |
| `getPageSize()` | Gibt die Anzahl der Einträge pro Seite zurück (Standardwert 20) |
| `setPageSize(pageSize)` | Setzt die Anzahl der Einträge pro Seite |
| `getCount()` | Gibt die Gesamtanzahl der Datensätze zurück |
| `getTotalPage()` | Gibt die Gesamtanzahl der Seiten zurück |
| `next()` | Geht zur nächsten Seite und aktualisiert |
| `previous()` | Geht zur vorherigen Seite und aktualisiert |
| `goto(page)` | Springt zur angegebenen Seite und aktualisiert |

### Ausgewählte Zeilen

| Methode | Beschreibung |
|------|------|
| `setSelectedRows(rows)` | Setzt die ausgewählten Zeilen |
| `getSelectedRows()` | Gibt die ausgewählten Zeilen zurück |

### Beispiel: Verwendung in einem CollectionBlockModel

Beim Ableiten von `CollectionBlockModel` muss die Resource über `createResource()` erstellt werden, anschließend werden die Daten in `renderComponent()` gelesen:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Deklariert die Verwendung von MultiRecordResource für die Datenverwaltung
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Gesamtanzahl der Datensätze

    return (
      <div>
        <h3>Insgesamt {count} Datensätze (Seite {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Vollständiges Beispiel siehe [FlowEngine → Block-Erweiterung](../../plugin-development/client/flow-engine/block.md).

### Beispiel: CRUD-Aufruf in einer Aktionsschaltfläche

Im `registerFlow`-Handler des `ActionModel` lässt sich die Resource des aktuellen Blocks über `ctx.blockModel?.resource` abrufen, um CRUD-Methoden aufzurufen:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Die Resource des aktuellen Blocks abrufen
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Datensatz erstellen, danach wird die Resource automatisch aktualisiert
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Vollständiges Beispiel siehe [Plugin für Datenverwaltung mit Front- und Backend-Integration entwickeln](../../plugin-development/client/examples/fullstack-plugin.md).

### Beispiel: CRUD-Operationen Schnellübersicht

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Erstellen ---
  await resource.create({ title: 'New item', completed: false });
  // Ohne automatisches Refresh
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Lesen ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Gesamtanzahl der Datensätze
  const item = await resource.get(1);   // Einzelnen Datensatz über Primärschlüssel abrufen

  // --- Aktualisieren ---
  await resource.update(1, { title: 'Updated' });

  // --- Löschen ---
  await resource.destroy(1);            // Einzelner Datensatz
  await resource.destroy([1, 2, 3]);    // Stapelweises Löschen

  // --- Paginierung ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Oder über Kurzbefehle
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Refresh ---
  await resource.refresh();
}
```

## SingleRecordResource

Wird für Formulare, Detailseiten und andere Szenarien mit einem einzelnen Datensatz verwendet. Wird aus `@nocobase/flow-engine` importiert.

### Datenoperationen

| Methode | Parameter | Beschreibung |
|------|------|------|
| `getData()` | - | Gibt `TData` (einzelnes Objekt) zurück, Anfangswert ist `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Intelligentes Speichern – ruft `create` auf, wenn `isNewRecord` `true` ist, sonst `update` |
| `destroy(options?)` | - | Löscht den aktuellen Datensatz (nutzt den gesetzten filterByTk) |
| `refresh()` | - | Aktualisiert die Daten (ruft die `get` Action auf), wird übersprungen, wenn `isNewRecord` `true` ist |

### Wichtige Eigenschaften

| Eigenschaft | Beschreibung |
|------|------|
| `isNewRecord` | Kennzeichnet, ob es sich um einen neuen Datensatz handelt. `setFilterByTk()` setzt diese Eigenschaft automatisch auf `false` |

### Beispiel: Formular-/Detailszenario

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Einzelnes Objekt oder null
    if (!data) return <div>Wird geladen...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Beispiel: Datensatz erstellen und bearbeiten

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Neuen Datensatz erstellen ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save ruft intern die create Action auf und aktualisiert anschließend automatisch

  // --- Bestehenden Datensatz bearbeiten ---
  resource.setFilterByTk(1);  // Setzt automatisch isNewRecord = false
  await resource.refresh();   // Lädt zuerst die aktuellen Daten
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save ruft intern die update Action auf

  // --- Aktuellen Datensatz löschen ---
  await resource.destroy();   // Verwendet den gesetzten filterByTk
}
```

## Allgemeine Methoden

Die folgenden Methoden sind sowohl in `MultiRecordResource` als auch in `SingleRecordResource` verfügbar:

### Filter

| Methode | Beschreibung |
|------|------|
| `setFilter(filter)` | Setzt das Filter-Objekt direkt |
| `addFilterGroup(key, filter)` | Fügt eine benannte Filtergruppe hinzu (empfohlen, kombinierbar und entfernbar) |
| `removeFilterGroup(key)` | Entfernt eine benannte Filtergruppe |
| `getFilter()` | Gibt den aggregierten Filter zurück, mehrere Gruppen werden automatisch mit `$and` kombiniert |

### Feldsteuerung

| Methode | Beschreibung |
|------|------|
| `setFields(fields)` | Setzt die zurückgegebenen Felder |
| `setAppends(appends)` | Setzt die Appends für Beziehungsfelder |
| `addAppends(appends)` | Fügt Appends hinzu (mit Duplikat-Entfernung) |
| `setSort(sort)` | Setzt die Sortierung, z. B. `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Setzt den Filter nach Primärschlüssel |

### Resource-Konfiguration

| Methode | Beschreibung |
|------|------|
| `setResourceName(name)` | Setzt den Namen der Resource, z. B. `'users'` oder die Beziehungs-Resource `'users.tags'` |
| `setSourceId(id)` | Setzt die ID des übergeordneten Datensatzes für Beziehungs-Resources |
| `setDataSourceKey(key)` | Setzt die Datenquelle (fügt den Header `X-Data-Source` hinzu) |

### Metadaten und Status

| Methode | Beschreibung |
|------|------|
| `getMeta(key?)` | Gibt Metadaten zurück; ohne Schlüssel wird das gesamte Meta-Objekt zurückgegeben |
| `loading` | Gibt an, ob aktuell geladen wird (Getter) |
| `getError()` | Gibt die Fehlerinformation zurück |
| `clearError()` | Löscht den Fehler |

### Events

| Event | Auslöser |
|------|----------|
| `'refresh'` | Nach erfolgreichem Datenabruf durch `refresh()` |
| `'saved'` | Nach erfolgreicher `create` / `update` / `save` Operation |

```ts
resource.on('saved', (data) => {
  console.log('Datensatz wurde gespeichert:', data);
});
```

## Filter-Syntax

NocoBase verwendet eine JSON-ähnliche Filter-Syntax. Operatoren beginnen mit `$`:

```ts
// Gleich
{ status: { $eq: 'active' } }

// Ungleich
{ status: { $ne: 'deleted' } }

// Größer als
{ age: { $gt: 18 } }

// Enthält (unscharfes Matching)
{ name: { $includes: 'test' } }

// Verknüpfte Bedingungen
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Oder-Bedingung
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Auf der Resource wird empfohlen, Filterbedingungen mit `addFilterGroup` zu verwalten:

```ts
// Mehrere Filtergruppen hinzufügen
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() aggregiert automatisch zu: { $and: [...] }

// Eine bestimmte Filtergruppe entfernen
resource.removeFilterGroup('status');

// Refresh, um den Filter anzuwenden
await resource.refresh();
```

## MultiRecordResource und SingleRecordResource im Vergleich

| Merkmal | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Rückgabe von getData() | `TDataItem[]` (Array) | `TData` (einzelnes Objekt) |
| Standard-Refresh-Action | `list` | `get` |
| Paginierung | unterstützt | nicht unterstützt |
| Ausgewählte Zeilen | unterstützt | nicht unterstützt |
| Erstellen | `create(data)` | `save(data)` + `isNewRecord=true` |
| Aktualisieren | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Löschen | `destroy(filterByTk)` | `destroy()` |
| Typische Szenarien | Listen, Tabellen, Kanban | Formulare, Detailseiten |

## Verwandte Links

- [Plugin für Datenverwaltung mit Front- und Backend-Integration entwickeln](../../plugin-development/client/examples/fullstack-plugin.md) — Vollständiges Beispiel: praktische Verwendung von `resource.create()` in einer benutzerdefinierten Aktionsschaltfläche
- [FlowEngine → Block-Erweiterung](../../plugin-development/client/flow-engine/block.md) — Verwendung von `createResource()` und `resource.getData()` in CollectionBlockModel
- [ResourceManager Resource-Verwaltung (serverseitig)](../../plugin-development/server/resource-manager.md) — Serverseitige Definition von REST-API-Resources, die vom clientseitigen Resource aufgerufen werden
- [FlowContext API](./flow-context.md) — Beschreibung von Methoden wie `ctx.makeResource()`, `ctx.initResource()`
