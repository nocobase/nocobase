---
title: "Block-Erweiterung"
description: "NocoBase Block-Erweiterungs-Entwicklung: BlockModel-, DataBlockModel-, CollectionBlockModel-, TableBlockModel-Basisklassen und Registrierungsweise."
keywords: "Block-Erweiterung,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Block-Erweiterung

In NocoBase ist ein **Block** ein Inhaltsbereich auf einer Seite — beispielsweise Tabelle, Formular, Diagramm, Detailansicht usw. Durch Erweitern der BlockModel-Basisklassen können Sie benutzerdefinierte Blöcke erstellen und im Menü „Block hinzufügen" registrieren.

## Auswahl der Basisklasse

NocoBase stellt drei Block-Basisklassen bereit, je nach Datenanforderung:

| Basisklasse                   | Vererbungsbeziehung                              | Anwendungsszenario                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | Grundlegendster Block                          | Anzeigeblöcke ohne Datenquelle                     |
| `DataBlockModel`       | Erbt von `BlockModel`                     | Benötigt Daten, ist aber nicht an eine NocoBase-Datentabelle gebunden           |
| `CollectionBlockModel` | Erbt von `DataBlockModel`                 | An eine NocoBase-Datentabelle gebunden, holt Daten automatisch         |
| `TableBlockModel`      | Erbt von `CollectionBlockModel`           | Vollständiger Tabellenblock mit Feldspalten, Aktionsleiste, Pagination usw. |

Die Vererbungskette ist: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

In der Regel gilt: Wenn Sie einen sofort einsatzbereiten Tabellenblock möchten, verwenden Sie direkt `TableBlockModel` — es bringt Feldspalten, Aktionsleiste, Pagination, Sortierung und vollständige Funktionen mit und ist die am häufigsten verwendete Basisklasse. Wenn Sie das Rendering vollständig anpassen möchten (z. B. Kartenliste, Zeitstrahl), verwenden Sie `CollectionBlockModel` und schreiben `renderComponent` selbst. Für die Anzeige statischer Inhalte oder benutzerdefinierter UI reicht `BlockModel` aus.

`DataBlockModel` hat eine besondere Rolle — es fügt selbst keine neuen Eigenschaften oder Methoden hinzu, der Klassenkörper ist leer. Seine Funktion ist die **Klassifizierungs-Markierung**: Blöcke, die `DataBlockModel` erweitern, werden in der UI in der Menügruppe „Datenblöcke" einsortiert. Wenn Ihr Block die Datenbeschaffung selbst verwalten muss (nicht über die standardmäßige Collection-Bindung von NocoBase), können Sie `DataBlockModel` erweitern. Das `ChartBlockModel` des Diagramm-Plugins ist ein solches Beispiel — es nutzt eine eigene `ChartResource` zur Datenbeschaffung und benötigt keine standardmäßige Datentabellen-Bindung. In den meisten Fällen müssen Sie `DataBlockModel` nicht direkt verwenden — `CollectionBlockModel` oder `TableBlockModel` reichen.

## BlockModel-Beispiel

Ein einfachster Block — unterstützt das Bearbeiten von HTML-Inhalt:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Dieses Beispiel deckt die drei Schritte der Block-Entwicklung ab:

1. **`renderComponent()`** — rendert die Block-UI, liest Eigenschaften über `this.props`
2. **`define()`** — legt den im Menü „Block hinzufügen" angezeigten Namen fest
3. **`registerFlow()`** — fügt ein visuelles Konfigurationspanel hinzu, in dem Benutzer den HTML-Inhalt bearbeiten können

## CollectionBlockModel-Beispiel

Wenn der Block an eine NocoBase-Datentabelle gebunden werden muss, verwenden Sie `CollectionBlockModel`. Es übernimmt automatisch die Datenbeschaffung:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Deklariert dies als Block für mehrere Datensätze
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Datentabellen-Block</h3>
        {/* resource.getData() ruft die Daten der Datentabelle ab */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Im Vergleich zu `BlockModel` bringt `CollectionBlockModel` Folgendes zusätzlich mit:

- **`static scene`** — deklariert das Block-Szenario. Häufige Werte: `BlockSceneEnum.many` (Liste mit mehreren Datensätzen), `BlockSceneEnum.one` (Detail/Formular für einen einzelnen Datensatz). Vollständige Aufzählung enthält außerdem `new`, `select`, `filter`, `subForm`, `bulkEditForm` u. a.
- **`createResource()`** — erstellt die Datenressource, `MultiRecordResource` dient zum Abrufen mehrerer Datensätze
- **`this.resource.getData()`** — ruft die Daten der Datentabelle ab

## TableBlockModel-Beispiel

`TableBlockModel` erbt von `CollectionBlockModel` und ist der eingebaute vollständige Tabellenblock von NocoBase — mit Feldspalten, Aktionsleiste, Pagination, Sortierung und allen Funktionen. Wenn Benutzer in „Block hinzufügen" „Tabelle" wählen, ist es genau dieses Modell.

In der Regel: Wenn das eingebaute `TableBlockModel` die Anforderungen erfüllt, fügen Benutzer es direkt in der Oberfläche hinzu, und Entwickler müssen nichts tun. Nur wenn Sie **auf Basis von TableBlockModel anpassen** müssen, ist Vererbung nötig — beispielsweise:

- Eingebaute Aktionsgruppen oder Feldspalten-Modelle durch Überschreiben von `customModelClasses` ersetzen
- Über `filterCollection` einschränken, dass es nur für bestimmte Datentabellen verfügbar ist
- Zusätzliche Flows registrieren, um benutzerdefinierte Konfigurationselemente hinzuzufügen

```tsx
// Beispiel: Tabellenblock, der nur für die Datentabelle todoItems verfügbar ist
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Vollständiges Anpassungsbeispiel zu `TableBlockModel` siehe [Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../examples/fullstack-plugin).

## Block registrieren

Im `load()` des Plugins registrieren:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Nach der Registrierung können Sie in der NocoBase-Oberfläche auf „Block hinzufügen" klicken und Ihren benutzerdefinierten Block sehen.

## Vollständiger Quellcode

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — BlockModel-Beispiel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — CollectionBlockModel-Beispiel

## Verwandte Links

- [Plugin-Praxis: Einen benutzerdefinierten Anzeige-Block erstellen](../examples/custom-block) — Einen konfigurierbaren BlockModel-Block von Grund auf erstellen
- [Plugin-Praxis: Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../examples/fullstack-plugin) — Vollständiges Beispiel mit TableBlockModel + benutzerdefiniertem Feld + benutzerdefinierter Aktion
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel und registerFlow
- [Feld-Erweiterung](./field) — Benutzerdefinierte Feld-Components
- [Aktions-Erweiterung](./action) — Benutzerdefinierte Aktionsbuttons
- [Resource API Cheatsheet](../../../api/flow-engine/resource.md) — Vollständige Methoden-Signaturen von MultiRecordResource / SingleRecordResource
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Vollständige Parameter und Event-Typen für registerFlow
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz
