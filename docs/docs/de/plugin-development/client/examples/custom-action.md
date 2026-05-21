---
title: "Einen benutzerdefinierten Aktionsbutton erstellen"
description: "NocoBase Plugin-Praxis: Einen benutzerdefinierten Aktionsbutton mit ActionModel + ActionSceneEnum erstellen, mit Unterstützung für Aktionen auf Datentabellen- und Datensatz-Ebene."
keywords: "benutzerdefinierte Aktion,ActionModel,ActionSceneEnum,Aktionsbutton,NocoBase"
---

# Einen benutzerdefinierten Aktionsbutton erstellen

In NocoBase ist eine Aktion (Action) ein Button innerhalb eines Blocks, der eine Geschäftslogik auslöst — z. B. „Neu", „Bearbeiten", „Löschen". Dieses Beispiel zeigt, wie Sie mit `ActionModel` einen benutzerdefinierten Aktionsbutton erstellen und über `ActionSceneEnum` das Szenario steuern, in dem der Button erscheint.

:::tip Vorab lesen

Es empfiehlt sich, zunächst Folgendes zu kennen, damit die Entwicklung reibungsloser verläuft:

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Erstellung und Verzeichnisstruktur
- [Plugin](../plugin) — Plugin-Einstiegspunkt und `load()`-Lebenszyklus
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — Einführung in ActionModel und ActionSceneEnum
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und verzögerte Übersetzung mit `tExpr()`

:::

## Endergebnis

Wir erstellen drei benutzerdefinierte Aktionsbuttons, die jeweils einem der drei Aktionsszenarien entsprechen:

- **Aktion auf Datentabellen-Ebene** (`collection`) — erscheint in der Aktionsleiste oben im Block, z. B. neben dem „Neu"-Button
- **Aktion auf Datensatz-Ebene** (`record`) — erscheint in der Aktionsspalte jeder Tabellenzeile, z. B. neben „Bearbeiten" und „Löschen"
- **Beide anwendbar** (`both`) — erscheint in beiden Szenarien

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Vollständigen Quellcode siehe [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Wenn Sie es lokal ausprobieren möchten:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Im Folgenden bauen wir dieses Plugin Schritt für Schritt von Grund auf auf.

## Schritt 1: Plugin-Gerüst erstellen

Im Stammverzeichnis des Repositories ausführen:

```bash
yarn pm create @my-project/plugin-simple-action
```

Detaillierte Erläuterungen siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

## Schritt 2: Aktionsmodelle erstellen

Jede Aktion muss das Szenario deklarieren, in dem sie erscheint, indem sie über die Eigenschaft `static scene` angegeben wird:

| Szenario   | Wert                          | Hinweis                                     |
| ---------- | ---------------------------- | ---------------------------------------- |
| collection | `ActionSceneEnum.collection` | Wirkt auf die Datentabelle, z. B. „Neu"-Button           |
| record     | `ActionSceneEnum.record`     | Wirkt auf einen einzelnen Datensatz, z. B. „Bearbeiten"-, „Löschen"-Button |
| both       | `ActionSceneEnum.both`       | In beiden Szenarien verwendbar                           |

### Aktion auf Datentabellen-Ebene

Erstellen Sie `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Über registerFlow das Klick-Ereignis abhören und mit ctx.message dem Benutzer Feedback geben
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Aktion auf Datensatz-Ebene

Erstellen Sie `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// Aktionen auf Datensatz-Ebene können über ctx.model.context die Daten und den Index der aktuellen Zeile abrufen
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Beide Szenarien anwendbar

Erstellen Sie `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Die Struktur der drei Schreibweisen ist identisch — der Unterschied liegt nur im Wert von `static scene` und im Button-Text. Jeder Button hört über `registerFlow({ on: 'click' })` auf das Klick-Ereignis und gibt mit `ctx.message` einen Hinweis aus, sodass der Benutzer sieht, dass der Button tatsächlich funktioniert.

## Schritt 3: Mehrsprachen-Dateien hinzufügen

Bearbeiten Sie die Übersetzungsdateien unter `src/locale/` des Plugins:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Hinweis

Beim erstmaligen Hinzufügen einer Sprachdatei muss die Anwendung neu gestartet werden, damit sie wirksam wird.

:::

Mehr zur Schreibweise von Übersetzungsdateien und zur Verwendung von `tExpr()` siehe [i18n Internationalisierung](../component/i18n).

## Schritt 4: Im Plugin registrieren

Bearbeiten Sie `src/client-v2/plugin.tsx` und registrieren Sie über `registerModelLoaders` per Lazy Loading:

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## Schritt 5: Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-simple-action
```

Nach der Aktivierung können Sie unter „Aktion konfigurieren" eines Tabellenblocks diese benutzerdefinierten Aktionsbuttons hinzufügen.

## Vollständiger Quellcode

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Vollständiges Beispiel der drei Aktionsszenarien

## Zusammenfassung

In diesem Beispiel verwendete Fähigkeiten:

| Fähigkeit  | Verwendung                                  | Dokumentation                                    |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| Aktionsbutton | `ActionModel` + `static scene`               | [FlowEngine → Aktions-Erweiterung](../flow-engine/action) |
| Aktionsszenario | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Aktions-Erweiterung](../flow-engine/action) |
| Menü-Registrierung | `define({ label })`                          | [FlowEngine-Übersicht](../flow-engine/index.md)     |
| Modell-Registrierung | `this.flowEngine.registerModelLoaders()`     | [Plugin](../plugin)                       |
| Verzögerte Übersetzung | `tExpr()`                                    | [i18n Internationalisierung](../component/i18n)               |

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst von Grund auf erstellen
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — Benutzerdefinierte Blöcke
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — Benutzerdefinierte Feld-Components
- [Component vs FlowModel](../component-vs-flow-model) — Wann FlowModel verwenden
- [Plugin](../plugin) — Plugin-Einstiegspunkt und load()-Lebenszyklus
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von tExpr
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
