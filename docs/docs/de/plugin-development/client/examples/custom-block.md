---
title: "Einen benutzerdefinierten Anzeige-Block erstellen"
description: "NocoBase Plugin-Praxis: Einen konfigurierbaren HTML-Anzeigeblock mit BlockModel + registerFlow + uiSchema erstellen."
keywords: "benutzerdefinierter Block,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Einen benutzerdefinierten Anzeige-Block erstellen

In NocoBase ist ein Block ein Inhaltsbereich auf einer Seite. Dieses Beispiel zeigt, wie Sie mit `BlockModel` einen einfachen benutzerdefinierten Block erstellen — er unterstützt das Bearbeiten von HTML-Inhalt in der Oberfläche, Benutzer können den angezeigten Inhalt über das Konfigurationspanel ändern.

Dies ist das erste Beispiel, das die FlowEngine einbezieht, und nutzt `BlockModel`, `renderComponent`, `registerFlow` und `uiSchema`.

:::tip Vorab lesen

Es empfiehlt sich, zunächst Folgendes zu kennen, damit die Entwicklung reibungsloser verläuft:

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Erstellung und Verzeichnisstruktur
- [Plugin](../plugin) — Plugin-Einstiegspunkt und `load()`-Lebenszyklus
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel, renderComponent, registerFlow
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und verzögerte Übersetzung mit `tExpr()`

:::

## Endergebnis

Wir erstellen einen Block „Simple block":

- erscheint im Menü „Block hinzufügen"
- rendert vom Benutzer konfigurierten HTML-Inhalt
- über Konfigurationspanel (registerFlow + uiSchema) lassen sich HTML-Inhalte bearbeiten

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Vollständigen Quellcode siehe [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Wenn Sie es lokal ausprobieren möchten:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Im Folgenden bauen wir dieses Plugin Schritt für Schritt von Grund auf auf.

## Schritt 1: Plugin-Gerüst erstellen

Im Stammverzeichnis des Repositories ausführen:

```bash
yarn pm create @my-project/plugin-simple-block
```

Dies erzeugt unter `packages/plugins/@my-project/plugin-simple-block` die Grundstruktur. Detaillierte Erläuterungen siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

## Schritt 2: Block-Modell erstellen

Erstellen Sie `src/client-v2/models/SimpleBlockModel.tsx`. Das ist der Kern des Plugins — hier wird definiert, wie der Block gerendert und konfiguriert wird.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Den im Menü „Block hinzufügen" angezeigten Namen festlegen
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Konfigurationspanel registrieren, sodass Benutzer HTML-Inhalt bearbeiten können
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Vor dem Rendern ausführen
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema definiert die Formular-UI des Konfigurationspanels
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Standardwerte des Konfigurationspanels
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Wert aus dem Konfigurationspanel in die props des Modells schreiben
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Wichtige Punkte:

- **`renderComponent()`** — rendert die Block-UI, liest den HTML-Inhalt über `this.props.html`
- **`define()`** — legt den im Menü „Block hinzufügen" angezeigten Namen fest. `tExpr()` dient zur verzögerten Übersetzung, denn `define()` wird beim Laden des Moduls ausgeführt, zu diesem Zeitpunkt ist i18n noch nicht initialisiert
- **`registerFlow()`** — fügt das Konfigurationspanel hinzu. `uiSchema` definiert das Formular im JSON-Schema-Format (Syntax siehe [UI Schema](../../../../flow-engine/ui-schema)), `handler` schreibt den vom Benutzer ausgefüllten Wert in `ctx.model.props`, sodass `renderComponent()` ihn lesen kann

## Schritt 3: Mehrsprachen-Dateien hinzufügen

Bearbeiten Sie die Übersetzungsdateien unter `src/locale/` des Plugins und ergänzen Sie alle in `tExpr()` verwendeten Schlüssel mit Übersetzungen:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Hinweis

Beim erstmaligen Hinzufügen einer Sprachdatei muss die Anwendung neu gestartet werden, damit sie wirksam wird.

:::

Mehr zur Schreibweise von Übersetzungsdateien und zur Verwendung von `tExpr()` siehe [i18n Internationalisierung](../component/i18n).

## Schritt 4: Im Plugin registrieren

Bearbeiten Sie `src/client-v2/plugin.tsx` und laden Sie das Modell per Lazy Loading mit `registerModelLoaders`:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Lazy Loading, Modul wird erst beim ersten Verwenden geladen
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` verwendet dynamische Imports, sodass der Modell-Code erst beim ersten tatsächlichen Verwenden geladen wird — die empfohlene Registrierungsweise.

## Schritt 5: Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-simple-block
```

Nach der Aktivierung legen Sie eine neue Seite an, klicken auf „Block hinzufügen" und sehen den „Simple block". Nach dem Hinzufügen können Sie über den Konfigurations-Button des Blocks den HTML-Inhalt bearbeiten.

## Vollständiger Quellcode

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — Vollständiges Beispiel eines benutzerdefinierten Anzeige-Blocks

## Zusammenfassung

In diesem Beispiel verwendete Fähigkeiten:

| Fähigkeit  | Verwendung                                  | Dokumentation                                    |
| -------- | ---------------------------------- | --------------------------------------------- |
| Block-Rendering | `BlockModel` + `renderComponent()` | [FlowEngine → Block-Erweiterung](../flow-engine/block) |
| Menü-Registrierung | `define({ label })`                | [FlowEngine-Übersicht](../flow-engine/index.md)    |
| Konfigurationspanel | `registerFlow()` + `uiSchema`      | [FlowEngine-Übersicht](../flow-engine/index.md)    |
| Modell-Registrierung | `registerModelLoaders` (Lazy Loading) | [Plugin](../plugin)                      |
| Verzögerte Übersetzung | `tExpr()`                          | [i18n Internationalisierung](../component/i18n)              |

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst von Grund auf erstellen
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel und registerFlow
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — uiSchema-Syntaxreferenz
- [Component vs FlowModel](../component-vs-flow-model) — Wann FlowModel verwenden
- [Plugin](../plugin) — Plugin-Einstiegspunkt und load()-Lebenszyklus
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von tExpr
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
