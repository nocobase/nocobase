---
title: "Ein Frontend-Backend-Datenmanagement-Plugin erstellen"
description: "NocoBase Plugin-Praxis: Server definiert die Datentabelle + Client zeigt Daten mit TableBlockModel + benutzerdefinierte Felder und Aktionen — ein vollständiges Frontend-Backend-Plugin."
keywords: "Frontend-Backend-Verknüpfung,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Ein Frontend-Backend-Datenmanagement-Plugin erstellen

Die vorherigen Beispiele waren entweder rein clientseitig (Block, Feld, Aktion) oder Client + einfache Schnittstelle (Einstellungsseite). Dieses Beispiel zeigt ein vollständigeres Szenario — der Server definiert eine Datentabelle, der Client erbt von `TableBlockModel`, um die volle Tabellen-Funktionalität zu erhalten, und ergänzt sie um benutzerdefinierte Feld-Components und Aktionsbuttons, sodass ein Datenmanagement-Plugin mit CRUD entsteht.

Dieses Beispiel führt die zuvor gelernten Block-, Feld- und Aktions-Bausteine zusammen und zeigt den Entwicklungsprozess eines vollständigen Plugins.

:::tip Vorab lesen

Es empfiehlt sich, zunächst Folgendes zu kennen, damit die Entwicklung reibungsloser verläuft:

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Erstellung und Verzeichnisstruktur
- [Plugin](../plugin) — Plugin-Einstiegspunkt und `load()`-Lebenszyklus
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von `tExpr()`
- [Server-Entwicklungs-Übersicht](../../server) — Grundlagen der serverseitigen Plugin-Entwicklung

:::

## Endergebnis

Wir erstellen ein „To-do"-Datenmanagement-Plugin mit folgenden Funktionen:

- Server definiert eine Datentabelle `todoItems` und schreibt beim Installieren des Plugins automatisch Beispieldaten ein
- Client erbt von `TableBlockModel` und erhält einen sofort einsatzbereiten Tabellenblock (Feldspalten, Pagination, Aktionsleiste usw.)
- Benutzerdefiniertes Feld-Component — rendert das Feld priority mit farbigen Tags
- Benutzerdefinierter Aktionsbutton — „Neues To-do"-Button öffnet ein Modal mit Formular zum Erstellen eines Datensatzes

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Vollständigen Quellcode siehe [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Wenn Sie es lokal ausprobieren möchten:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Im Folgenden bauen wir dieses Plugin Schritt für Schritt von Grund auf auf.

## Schritt 1: Plugin-Gerüst erstellen

Im Stammverzeichnis des Repositories ausführen:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Detaillierte Erläuterungen siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

## Schritt 2: Datentabelle definieren (Server)

Erstellen Sie `src/server/collections/todoItems.ts`. NocoBase lädt automatisch die Collection-Definitionen unter diesem Verzeichnis:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Im Unterschied zum Einstellungsseiten-Beispiel ist hier keine manuelle Resource-Registrierung erforderlich — NocoBase erzeugt für jede Collection automatisch die Standard-CRUD-Schnittstellen (`list`, `get`, `create`, `update`, `destroy`).

## Schritt 3: Berechtigungen und Beispieldaten konfigurieren (Server)

Bearbeiten Sie `src/server/plugin.ts`, konfigurieren Sie in `load()` ACL-Berechtigungen und schreiben Sie in `install()` Beispieldaten ein:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // Eingeloggte Benutzer dürfen todoItems erstellen, lesen, aktualisieren und löschen
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // Beim erstmaligen Installieren des Plugins einige Beispieldaten einfügen
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Wichtige Punkte:

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` öffnet vollständige CRUD-Berechtigungen, `'loggedIn'` bedeutet, dass eingeloggte Benutzer Zugriff haben
- **`install()`** — wird nur beim erstmaligen Installieren des Plugins ausgeführt, geeignet zum Einfügen von Initialdaten
- **`this.db.getRepository()`** — holt über den Collection-Namen das Datenoperations-Objekt
- Kein `resourceManager.define()` nötig — NocoBase erzeugt für die Collection automatisch CRUD-Schnittstellen

## Schritt 4: Block-Modell erstellen (Client)

Erstellen Sie `src/client-v2/models/TodoBlockModel.tsx`. Durch Erweitern von `TableBlockModel` erhalten Sie sofort einen vollständigen Tabellenblock — Feldspalten, Aktionsleiste, Pagination, Sortierung usw., ohne `renderComponent` selbst schreiben zu müssen.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Tipp

In der praktischen Plugin-Entwicklung können Sie, wenn keine Anpassung von `TableBlockModel` nötig ist, diesen Block tatsächlich nicht erweitern und nicht registrieren — Benutzer können beim Hinzufügen einfach „Tabelle" auswählen. Dieser Artikel definiert und registriert `TodoBlockModel` (durch Erweitern von `TableBlockModel`) nur, um den Definitions- und Registrierungsablauf eines Block-Modells zu zeigen. `TableBlockModel` kümmert sich um alles Weitere (Feldspalten, Aktionsleiste, Pagination usw.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Auf die Datentabelle todoItems beschränken
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Über `filterCollection` schränken Sie diesen Block auf die Datentabelle `todoItems` ein — wenn Benutzer einen „Todo block" hinzufügen, erscheint in der Datentabellen-Auswahlliste nur `todoItems` und keine anderen, nicht zugehörigen Tabellen.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Schritt 5: Benutzerdefiniertes Feld-Component erstellen (Client)

Erstellen Sie `src/client-v2/models/PriorityFieldModel.tsx`. Das Feld priority wird mit farbigen Tags gerendert, was anschaulicher ist als reiner Text:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// An das Feld-Interface vom Typ input (einzeiliger Text) binden
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Nach der Registrierung können Sie in der Konfiguration der priority-Spalte der Tabelle im Dropdown „Feld-Component" zu „Priority tag" wechseln.

## Schritt 6: Benutzerdefinierten Aktionsbutton erstellen (Client)

Erstellen Sie `src/client-v2/models/NewTodoActionModel.tsx`. Beim Klick auf den „Neues To-do"-Button öffnet sich über `ctx.viewer.dialog()` ein Modal, in dem nach Ausfüllen des Formulars ein Datensatz erstellt wird:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Ladezustand mit observable verwalten, anstelle von useState
const formState = observable({
  loading: false,
});

// Formular-Component im Modal, mit observer umhüllt, um auf observable-Änderungen zu reagieren
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
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
  on: 'click', // Auf das Klick-Ereignis des Buttons hören
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Mit ctx.viewer.dialog ein Modal öffnen
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
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

Wichtige Punkte:

- **`ActionSceneEnum.collection`** — der Button erscheint in der Aktionsleiste oben im Block
- **`on: 'click'`** — über `registerFlow` auf das `click`-Ereignis des Buttons hören
- **`ctx.viewer.dialog()`** — die in NocoBase eingebaute Modal-Funktionalität; `content` empfängt eine Funktion, der Parameter `view` kann `view.close()` aufrufen, um das Modal zu schließen
- **`resource.create(values)`** — ruft die create-Schnittstelle der Datentabelle auf, um einen Datensatz zu erstellen; nach dem Erstellen wird die Tabelle automatisch aktualisiert
- **`observable` + `observer`** — verwenden die von flow-engine bereitgestellte reaktive Zustandsverwaltung anstelle von `useState`; das Component reagiert automatisch auf Änderungen von `formState.loading`

## Schritt 7: Mehrsprachen-Dateien hinzufügen

Bearbeiten Sie die Übersetzungsdateien unter `src/locale/` des Plugins:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Hinweis

Beim erstmaligen Hinzufügen einer Sprachdatei muss die Anwendung neu gestartet werden, damit sie wirksam wird.

:::

Mehr zur Schreibweise von Übersetzungsdateien und zur Verwendung von `tExpr()` siehe [i18n Internationalisierung](../component/i18n).

## Schritt 8: Im Plugin registrieren (Client)

Bearbeiten Sie `src/client-v2/plugin.tsx`. Es sind zwei Dinge zu tun: die Modelle registrieren und `todoItems` an der clientseitigen Datenquelle anmelden.

:::warning Hinweis

Eine Datentabelle im Plugin-Code manuell über `addCollection` zu registrieren, ist eine **seltene Vorgehensweise** und dient hier nur der Veranschaulichung des vollständigen Frontend-Backend-Ablaufs. In tatsächlichen Projekten werden Datentabellen in der Regel von Benutzern in der NocoBase-Oberfläche angelegt und konfiguriert oder über API / MCP usw. verwaltet — eine explizite Registrierung im Client-Code des Plugins ist nicht nötig.

:::

Tabellen, die mit `defineCollection` definiert werden, sind serverseitige interne Tabellen und erscheinen standardmäßig nicht in der Datentabellen-Auswahlliste eines Blocks. Nach manueller Registrierung über `addCollection` können Benutzer beim Hinzufügen eines Blocks auch `todoItems` auswählen.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey muss gesetzt werden, sonst erscheint die Collection nicht in der Datentabellen-Auswahlliste eines Blocks
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // Block-, Feld- und Aktionsmodelle registrieren
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Wichtige Punkte:

- **`registerModelLoaders`** — registriert per Lazy Loading drei Modelle: Block, Feld, Aktion
- **`this.app.eventBus`** — anwendungsweiter Event-Bus, zum Abhören von Lebenszyklus-Events
- **`dataSource:loaded`-Event** — wird ausgelöst, nachdem die Datenquelle geladen wurde. `addCollection` muss in diesem Event-Callback aufgerufen werden, da `ensureLoaded()` nach `load()` ausgeführt wird und alle Collections zunächst leert und dann neu setzt — ein direkter Aufruf von `addCollection` in `load()` würde überschrieben
- **`addCollection()`** — registriert die Collection an der clientseitigen Datenquelle. Felder müssen `interface` und `uiSchema` enthalten, damit NocoBase weiß, wie sie zu rendern sind
- **`filterTargetKey: 'id'`** — muss gesetzt werden, gibt das Feld zur eindeutigen Identifizierung von Datensätzen an (üblicherweise der Primärschlüssel). Ohne diese Einstellung erscheint die Collection nicht in der Datentabellen-Auswahlliste eines Blocks
- Die `defineCollection` auf der Server-Seite erstellt die physische Tabelle und das ORM-Mapping, während `addCollection` auf der Client-Seite der UI bekannt macht, dass diese Tabelle existiert — beide Seiten zusammen ermöglichen die Frontend-Backend-Verknüpfung

## Schritt 9: Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Nach der Aktivierung:

1. Erstellen Sie eine neue Seite, klicken Sie auf „Block hinzufügen", wählen Sie „Todo block" und binden Sie ihn an die Datentabelle `todoItems`
2. Die Tabelle lädt die Daten automatisch und zeigt Feldspalten, Pagination usw. an
3. Unter „Aktion konfigurieren" fügen Sie den Button „New todo" hinzu, durch dessen Klick sich ein Modal mit Formular zum Erstellen von Datensätzen öffnet
4. In der Spalte priority wechseln Sie unter „Feld-Component" zu „Priority tag" — priority wird dann mit farbigen Tags angezeigt

<!-- Hier wird eine Screenshots der vollständigen Funktionalität nach der Aktivierung benötigt -->

## Vollständiger Quellcode

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — Vollständiges Beispiel eines Frontend-Backend-Datenmanagement-Plugins

## Zusammenfassung

In diesem Beispiel verwendete Fähigkeiten:

| Fähigkeit             | Verwendung                                            | Dokumentation                                                    |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Datentabelle definieren | `defineCollection()`                            | [Server → Collections](../../server/collections) |
| Berechtigungssteuerung | `acl.allow()`                                   | [Server → ACL](../../server/acl)               |
| Initialdaten | `install()` + `repo.createMany()`               | [Server → Plugin](../../server/plugin)             |
| Tabellenblock | `TableBlockModel`                               | [FlowEngine → Block-Erweiterung](../flow-engine/block)           |
| Clientseitige Tabellen-Registrierung | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin)                                |
| Benutzerdefiniertes Feld | `ClickableFieldModel` + `bindModelToInterface`  | [FlowEngine → Feld-Erweiterung](../flow-engine/field)           |
| Benutzerdefinierte Aktion | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → Aktions-Erweiterung](../flow-engine/action)          |
| Modal | `ctx.viewer.dialog()`                           | [Context → Häufige Fähigkeiten](../ctx/common-capabilities)        |
| Reaktiver Zustand | `observable` + `observer`                       | [Component-Entwicklung](../component/index.md)             |
| Modell-Registrierung | `this.flowEngine.registerModelLoaders()`        | [Plugin](../plugin)                                |
| Verzögerte Übersetzung | `tExpr()`                                       | [i18n Internationalisierung](../component/i18n)                        |

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst von Grund auf erstellen
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel und registerFlow
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Einen benutzerdefinierten Anzeige-Block erstellen](./custom-block) — BlockModel-Grundbeispiel
- [Ein benutzerdefiniertes Feld-Component erstellen](./custom-field) — FieldModel-Grundbeispiel
- [Einen benutzerdefinierten Aktionsbutton erstellen](./custom-action) — ActionModel-Grundbeispiel
- [Server-Entwicklungs-Übersicht](../../server) — Grundlagen serverseitiger Plugins
- [Server → Collections](../../server/collections) — defineCollection und addCollection
- [Resource API Cheatsheet](../../../api/flow-engine/resource.md) — Vollständige Methoden-Signaturen von MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) — Plugin-Einstiegspunkt und load()-Lebenszyklus
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von tExpr
- [Server → ACL](../../server/acl) — Berechtigungskonfiguration
- [Server → Plugin](../../server/plugin) — Lebenszyklus serverseitiger Plugins
- [Context → Häufige Fähigkeiten](../ctx/common-capabilities) — ctx.viewer, ctx.message usw.
- [Component-Entwicklung](../component/index.md) — Verwendung von Antd Form und anderen Components
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
