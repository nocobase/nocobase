---
title: "Aktions-Erweiterung"
description: "NocoBase Aktions-Erweiterungs-Entwicklung: ActionModel-Basisklasse, ActionSceneEnum-Aktionsszenarien, benutzerdefinierte Aktionsbuttons."
keywords: "Aktions-Erweiterung,Action,ActionModel,ActionSceneEnum,Aktionsbutton,NocoBase"
---

# Aktions-Erweiterung

In NocoBase ist eine **Aktion (Action)** ein Button innerhalb eines Blocks, der eine Geschäftslogik auslöst — z. B. „Neu", „Bearbeiten", „Löschen" usw. Durch Erweitern der `ActionModel`-Basisklasse können Sie benutzerdefinierte Aktionsbuttons hinzufügen.

## Aktionsszenarien

Jede Aktion muss das Szenario deklarieren, in dem sie erscheint, indem sie über die Eigenschaft `static scene` angegeben wird:

| Szenario   | Wert                          | Hinweis                                       |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | Wirkt auf die Datentabelle, z. B. „Neu"-Button               |
| record     | `ActionSceneEnum.record`     | Wirkt auf einen einzelnen Datensatz, z. B. „Bearbeiten"-, „Löschen"-Button     |
| both       | `ActionSceneEnum.both`       | In beiden Szenarien verwendbar                             |
| all        | `ActionSceneEnum.all`        | In allen Szenarien verwendbar (auch in speziellen Kontexten wie Modals) |

## Beispiele

### Aktion auf Datentabellen-Ebene

Wirkt auf die gesamte Datentabelle und erscheint in der Aktionsleiste oben im Block:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Aktion auf Datensatz-Ebene

Wirkt auf einen einzelnen Datensatz und erscheint in der Aktionsspalte jeder Tabellenzeile:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Beide Szenarien anwendbar

Wenn die Aktion nicht zwischen Szenarien unterscheidet, verwenden Sie `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Die Struktur der drei Schreibweisen ist identisch — der Unterschied liegt nur im Wert von `static scene` und im Button-Text in `defaultProps`.

## Aktion registrieren

Im `load()` des Plugins über `registerModelLoaders` per Lazy Loading registrieren:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

Nach der Registrierung können Sie unter „Aktion konfigurieren" des Blocks Ihre benutzerdefinierten Aktionsbuttons hinzufügen.

## Vollständiger Quellcode

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Vollständiges Beispiel der drei Aktionsszenarien

## Verwandte Links

- [Plugin-Praxis: Einen benutzerdefinierten Aktionsbutton erstellen](../examples/custom-action) — Drei Szenario-Buttons von Grund auf erstellen
- [Plugin-Praxis: Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../examples/fullstack-plugin) — Praktischer Einsatz von benutzerdefinierten Aktionen + ctx.viewer.dialog in einem vollständigen Plugin
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [Block-Erweiterung](./block) — Benutzerdefinierte Blöcke
- [Feld-Erweiterung](./field) — Benutzerdefinierte Feld-Components
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Vollständige Parameter und Event-Typen für registerFlow
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz
