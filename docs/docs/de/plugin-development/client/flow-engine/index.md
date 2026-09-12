---
title: "FlowEngine-Übersicht"
description: "NocoBase FlowEngine Plugin-Entwicklungsleitfaden: Grundlegende Verwendung von FlowModel, renderComponent, registerFlow, uiSchema-Konfiguration, Auswahl der Basisklasse."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

In NocoBase ist die **FlowEngine (Flow-Engine)** die zentrale Engine, die die visuelle Konfiguration antreibt. Blöcke, Felder und Aktionsbuttons in der NocoBase-Oberfläche werden alle über die FlowEngine verwaltet — einschließlich ihres Renderings, ihres Konfigurationspanels sowie der Persistenz der Konfiguration.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Für Plugin-Entwickler stellt die FlowEngine zwei zentrale Konzepte bereit:

- **FlowModel** — ein konfigurierbares Component-Modell, zuständig für UI-Rendering und Verwaltung der Props
- **Flow** — ein Konfigurationsablauf, definiert das Konfigurationspanel und die Datenverarbeitungslogik des Components

Wenn Ihr Component im Menü „Block / Feld / Aktion hinzufügen" erscheinen soll oder eine visuelle Konfiguration durch den Benutzer in der Oberfläche unterstützen muss, verpacken Sie es mit einem FlowModel. Wenn diese Fähigkeiten nicht benötigt werden, reicht ein gewöhnliches React Component aus — siehe [Component vs FlowModel](../component-vs-flow-model).

## Was ist FlowModel

Im Gegensatz zu einem gewöhnlichen React Component verwaltet ein FlowModel neben dem UI-Rendering auch die Quelle der Props, die Definition des Konfigurationspanels und die Persistenz der Konfiguration. Kurz gesagt: Die Props eines gewöhnlichen Components sind hartcodiert, die Props eines FlowModel werden über einen Flow dynamisch erzeugt.

Wenn Sie sich tiefer mit der Gesamtarchitektur der FlowEngine auseinandersetzen möchten, lesen Sie die [vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md). Im Folgenden wird die Verwendung aus Sicht des Plugin-Entwicklers vorgestellt.

## Minimalbeispiel

Ein FlowModel von der Erstellung bis zur Registrierung in drei Schritten:

### 1. Basisklasse erweitern, renderComponent implementieren

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>Dies ist ein benutzerdefinierter Block.</p>
      </div>
    );
  }
}

// define() legt den im Menü angezeigten Namen fest
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` ist die Render-Methode dieses Modells, ähnlich der `render()`-Methode eines React Components. `tExpr()` dient zur verzögerten Übersetzung — denn `define()` wird beim Laden des Moduls ausgeführt, zu diesem Zeitpunkt ist i18n noch nicht initialisiert. Details siehe [Context Häufige Fähigkeiten → tExpr](../ctx/common-capabilities#texpr).

### 2. Im Plugin registrieren

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Lazy Loading, Modul wird erst beim ersten Verwenden geladen
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. In der Oberfläche verwenden

Nach der Registrierung und dem Aktivieren des Plugins (siehe [Plugin-Entwicklungs-Übersicht](../../index.md) zum Aktivieren) können Sie in der NocoBase-Oberfläche eine neue Seite anlegen, auf „Block hinzufügen" klicken und Ihren „Hello block" sehen.

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Konfigurationselemente mit registerFlow hinzufügen

Reine Darstellung reicht nicht — der Kernwert eines FlowModel liegt in seiner **Konfigurierbarkeit**. Über `registerFlow()` können Sie dem Modell ein Konfigurationspanel hinzufügen, sodass Benutzer Eigenschaften in der Oberfläche ändern können.

Beispiel für einen Block, der die Bearbeitung von HTML-Inhalt unterstützt:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // Der Wert von this.props stammt aus dem Setzen im Flow-Handler
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Vor dem Rendern ausführen
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema definiert die UI des Konfigurationspanels
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Standardwerte
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Im Handler den Wert aus dem Konfigurationspanel auf die props des Modells setzen
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Wichtige Punkte hier:

- **`on: 'beforeRender'`** — bedeutet, dass dieser Flow vor dem Rendern ausgeführt wird; der Wert aus dem Konfigurationspanel wird vor dem Rendern in `this.props` geschrieben
- **`uiSchema`** — definiert die UI des Konfigurationspanels im JSON-Schema-Format, Syntax siehe [UI Schema](../../../flow-engine/ui-schema)
- **`handler(ctx, params)`** — `params` sind die im Konfigurationspanel ausgefüllten Werte, die über `ctx.model.props` auf das Modell gesetzt werden
- **`defaultParams`** — Standardwerte des Konfigurationspanels

## Häufige Schreibweisen für uiSchema

`uiSchema` basiert auf JSON Schema. v2 ist syntaktisch zu uiSchema kompatibel, allerdings mit begrenzten Verwendungsszenarien — hauptsächlich zur Beschreibung der Formular-UI im Konfigurationspanel von Flows. Für das Rendern von Components zur Laufzeit wird in den meisten Fällen empfohlen, direkt mit Antd-Components zu arbeiten, ohne uiSchema zu durchlaufen.

Hier die häufigsten Components (vollständige Referenz siehe [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // Texteingabe
  title: {
    type: 'string',
    title: 'Titel',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Mehrzeiliger Text
  content: {
    type: 'string',
    title: 'Inhalt',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Dropdown-Auswahl
  type: {
    type: 'string',
    title: 'Typ',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Primär', value: 'primary' },
      { label: 'Standard', value: 'default' },
      { label: 'Gestrichelt', value: 'dashed' },
    ],
  },
  // Schalter
  bordered: {
    type: 'boolean',
    title: 'Rahmen anzeigen',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Jedes Feld wird mit `'x-decorator': 'FormItem'` umhüllt, wodurch automatisch Titel und Layout hinzugefügt werden.

## Erläuterung der define()-Parameter

`FlowModel.define()` dient zum Setzen der Metadaten des Modells und steuert, wie es im Menü angezeigt wird. Bei der Plugin-Entwicklung wird `label` am häufigsten verwendet, es werden aber noch weitere Parameter unterstützt:

| Parameter | Typ | Hinweis |
|------|------|------|
| `label` | `string \| ReactNode` | Im Menü „Block / Feld / Aktion hinzufügen" angezeigter Name, unterstützt verzögerte Übersetzung mit `tExpr()` |
| `icon` | `ReactNode` | Icon im Menü |
| `sort` | `number` | Sortiergewicht, kleinere Zahlen erscheinen weiter vorne. Standard `0` |
| `hide` | `boolean \| (ctx) => boolean` | Im Menü ausblenden, dynamische Bedingungen unterstützt |
| `group` | `string` | Gruppen-Identifier, zur Einordnung in eine bestimmte Menügruppe |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Untermenüpunkte, asynchrone dynamische Erzeugung unterstützt |
| `toggleable` | `boolean \| (model) => boolean` | Ob Umschalten unterstützt wird (eindeutig unter demselben Eltern) |
| `searchable` | `boolean` | Ob das Untermenü Suche aktiviert |

Die meisten Plugins setzen nur `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Wenn Sortierung oder Ausblenden gesteuert werden soll, fügen Sie `sort` und `hide` hinzu:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Weiter hinten einsortieren
  hide: (ctx) => !ctx.someCondition,  // Bedingt ausblenden
});
```

## Auswahl der FlowModel-Basisklasse

NocoBase stellt mehrere FlowModel-Basisklassen bereit, je nach erweitertem Typ:

| Basisklasse                   | Zweck                               | Detaillierte Doku             |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel`           | Gewöhnlicher Block                           | [Block-Erweiterung](./block)  |
| `DataBlockModel`       | Block, der Daten selbst beschaffen muss             | [Block-Erweiterung](./block)  |
| `CollectionBlockModel` | An eine Datentabelle gebunden, holt Daten automatisch           | [Block-Erweiterung](./block)  |
| `TableBlockModel`      | Vollständiger Tabellenblock, mit Feldspalten, Aktionsleiste usw. | [Block-Erweiterung](./block)  |
| `FieldModel`           | Feld-Component                           | [Feld-Erweiterung](./field)  |
| `ActionModel`          | Aktionsbutton                           | [Aktions-Erweiterung](./action) |

Verwenden Sie für Tabellenblöcke in der Regel `TableBlockModel` (am häufigsten verwendet, sofort einsatzbereit), für vollständig benutzerdefiniertes Rendering `CollectionBlockModel` oder `BlockModel`, für Felder `FieldModel`, für Aktionsbuttons `ActionModel`.

## Verwandte Links

- [Block-Erweiterung](./block) — Blöcke mit den BlockModel-Basisklassen entwickeln
- [Feld-Erweiterung](./field) — Benutzerdefinierte Felder mit FieldModel entwickeln
- [Aktions-Erweiterung](./action) — Aktionsbuttons mit ActionModel entwickeln
- [Component vs FlowModel](../component-vs-flow-model) — Unsicher, welcher Weg zu wählen ist?
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Vollständige Parameterliste und Event-Typen für registerFlow
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
- [FlowEngine Schnellstart](../../../flow-engine/quickstart) — Ein orchestrierbares Button-Component von Grund auf erstellen
- [Plugin-Entwicklungs-Übersicht](../../index.md) — Gesamtüberblick über die Plugin-Entwicklung
- [UI Schema](../../../flow-engine/ui-schema) — uiSchema-Syntaxreferenz
