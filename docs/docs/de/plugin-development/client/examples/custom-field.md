---
title: "Ein benutzerdefiniertes Feld-Component erstellen"
description: "NocoBase Plugin-Praxis: Ein benutzerdefiniertes Feld-Anzeige-Component mit ClickableFieldModel erstellen und an ein Feld-Interface binden."
keywords: "benutzerdefiniertes Feld,FieldModel,ClickableFieldModel,bindModelToInterface,Feld-Erweiterung,NocoBase"
---

# Ein benutzerdefiniertes Feld-Component erstellen

In NocoBase werden Feld-Components verwendet, um in Tabellen und Formularen Daten anzuzeigen und zu bearbeiten. Dieses Beispiel zeigt, wie Sie mit `ClickableFieldModel` ein benutzerdefiniertes Feld-Anzeige-Component erstellen — der Feldwert wird in eckige Klammern `[]` eingefasst und an ein Feld-Interface vom Typ `input` gebunden.

:::tip Vorab lesen

Es empfiehlt sich, zunächst Folgendes zu kennen, damit die Entwicklung reibungsloser verläuft:

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Erstellung und Verzeichnisstruktur
- [Plugin](../plugin) — Plugin-Einstiegspunkt und `load()`-Lebenszyklus
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — Einführung in FieldModel und ClickableFieldModel
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und verzögerte Übersetzung mit `tExpr()`

:::

## Endergebnis

Wir erstellen ein benutzerdefiniertes Feld-Anzeige-Component:

- erbt von `ClickableFieldModel` und passt die Render-Logik an
- zeigt den Feldwert mit `[]` darum herum an
- über `bindModelToInterface` an Felder vom Typ `input` (einzeiliger Text) gebunden

Nach dem Aktivieren des Plugins können Sie im Tabellenblock zu einer einzeiligen Textfeld-Spalte wechseln, auf den Konfigurations-Button der Spalte klicken und im Dropdown „Feld-Component" die Option `DisplaySimpleFieldModel` sehen. Nach dem Wechsel wird der Wert dieser Spalte im Format `[value]` angezeigt.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Vollständigen Quellcode siehe [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Wenn Sie es lokal ausprobieren möchten:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Im Folgenden bauen wir dieses Plugin Schritt für Schritt von Grund auf auf.

## Schritt 1: Plugin-Gerüst erstellen

Im Stammverzeichnis des Repositories ausführen:

```bash
yarn pm create @my-project/plugin-field-simple
```

Detaillierte Erläuterungen siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

## Schritt 2: Feld-Modell erstellen

Erstellen Sie `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Das ist der Kern des Plugins — hier wird festgelegt, wie das Feld gerendert wird und an welches Feld-Interface es gebunden wird.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // Über this.context.record erhalten Sie den vollständigen Datensatz der aktuellen Zeile
    console.log('Aktueller Datensatz:', this.context.record);
    console.log('Aktueller Datensatz-Index:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Den im Dropdown „Feld-Component" angezeigten Namen festlegen
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// An das Feld-Interface vom Typ 'input' (einzeiliger Text) binden
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Wichtige Punkte:

- **`renderComponent(value)`** — empfängt den aktuellen Feldwert als Parameter und gibt das gerenderte JSX zurück
- **`this.context.record`** — ruft den vollständigen Datensatz der aktuellen Zeile ab
- **`this.context.recordIndex`** — ruft den Index der aktuellen Zeile ab
- **`ClickableFieldModel`** — erbt von `FieldModel` und bringt Klick-Interaktion mit
- **`define({ label })`** — legt den im Dropdown „Feld-Component" angezeigten Namen fest; ohne dies wird der Klassenname direkt angezeigt
- **`DisplayItemModel.bindModelToInterface()`** — bindet das Feld-Modell an einen bestimmten Feld-Interface-Typ (z. B. steht `input` für einzeilige Textfelder), sodass dieses Anzeige-Component bei den passenden Feldern auswählbar ist

## Schritt 3: Mehrsprachen-Dateien hinzufügen

Bearbeiten Sie die Übersetzungsdateien unter `src/locale/` des Plugins und ergänzen Sie alle in `tExpr()` verwendeten Schlüssel mit Übersetzungen:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Schritt 5: Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-field-simple
```

Nach der Aktivierung können Sie im Tabellenblock zu einer einzeiligen Textfeld-Spalte wechseln, auf den Konfigurations-Button der Spalte klicken und im Dropdown „Feld-Component" zu diesem benutzerdefinierten Anzeige-Component wechseln.

## Vollständiger Quellcode

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Vollständiges Beispiel eines benutzerdefinierten Feld-Components

## Zusammenfassung

In diesem Beispiel verwendete Fähigkeiten:

| Fähigkeit         | Verwendung                                             | Dokumentation                                    |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| Feld-Rendering | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Feld-Erweiterung](../flow-engine/field) |
| Bindung an Feld-Interface | `DisplayItemModel.bindModelToInterface()`        | [FlowEngine → Feld-Erweiterung](../flow-engine/field) |
| Modell-Registrierung | `this.flowEngine.registerModelLoaders()`         | [Plugin](../plugin)                      |

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst von Grund auf erstellen
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — Benutzerdefinierte Blöcke
- [Component vs FlowModel](../component-vs-flow-model) — Wann FlowModel verwenden
- [Plugin](../plugin) — Plugin-Einstiegspunkt und load()-Lebenszyklus
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von tExpr
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
