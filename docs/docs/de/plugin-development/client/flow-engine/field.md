---
title: "Feld-Erweiterung"
description: "NocoBase Feld-Erweiterungs-Entwicklung: FieldModel-, ClickableFieldModel-Basisklassen, Feld-Rendering, Bindung an Feld-Interfaces."
keywords: "Feld-Erweiterung,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Feld-Erweiterung

In NocoBase werden **Feld-Components (Field)** verwendet, um in Tabellen und Formularen Daten anzuzeigen und zu bearbeiten. Durch Erweitern der zugehörigen FieldModel-Basisklassen können Sie die Darstellung eines Feldes anpassen — z. B. bestimmte Datentypen in einem speziellen Format anzeigen oder mit einem benutzerdefinierten Component bearbeiten.

## Beispiel: Benutzerdefiniertes Anzeigefeld

Das folgende Beispiel erstellt ein einfaches Anzeigefeld — der Feldwert wird in eckige Klammern `[]` eingefasst:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // Über this.context.record erhalten Sie den vollständigen Datensatz der aktuellen Zeile
    console.log('Aktueller Datensatz:', this.context.record);
    console.log('Aktueller Datensatz-Index:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// An das Feld-Interface vom Typ 'input' binden
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Wichtige Punkte:

- **`renderComponent(value)`** — empfängt den aktuellen Feldwert als Parameter und gibt das gerenderte JSX zurück
- **`this.context.record`** — ruft den vollständigen Datensatz der aktuellen Zeile ab
- **`this.context.recordIndex`** — ruft den Index der aktuellen Zeile ab
- **`ClickableFieldModel`** — erbt von `FieldModel` und bringt Klick-Interaktion mit
- **`DisplayItemModel.bindModelToInterface()`** — bindet das Feld-Modell an einen bestimmten Feld-Interface-Typ (z. B. steht `input` für einfache Texteingabefelder), sodass dieses Anzeige-Component bei den passenden Feldern auswählbar ist

## Feld registrieren

Im `load()` des Plugins über `registerModelLoaders` per Lazy Loading registrieren:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Nach der Registrierung suchen Sie im Tabellenblock eine Spalte mit passendem Typ (z. B. ist im obigen Beispiel `input` gebunden, was einem einzeiligen Textfeld entspricht), klicken auf den Konfigurations-Button der Spalte und können im Dropdown „Feld-Component" zu diesem benutzerdefinierten Anzeige-Component wechseln. Vollständiges Praxisbeispiel siehe [Ein benutzerdefiniertes Feld-Component erstellen](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Vollständiger Quellcode

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Beispiel für ein benutzerdefiniertes Feld-Component

## Verwandte Links

- [Plugin-Praxis: Ein benutzerdefiniertes Feld-Component erstellen](../examples/custom-field) — Ein benutzerdefiniertes Feld-Anzeige-Component von Grund auf erstellen
- [Plugin-Praxis: Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../examples/fullstack-plugin) — Praktischer Einsatz benutzerdefinierter Felder in einem vollständigen Plugin
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
- [Block-Erweiterung](./block) — Benutzerdefinierte Blöcke
- [Aktions-Erweiterung](./action) — Benutzerdefinierte Aktionsbuttons
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Vollständige Parameter und Event-Typen für registerFlow
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz
