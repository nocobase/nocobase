---
title: "Gemeinsame Komponenten"
description: "Gemeinsame Komponenten von NocoBase client v2: Formularcontainer, Formularfelder, Filter, Tabellen und Icons."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Gemeinsame Komponenten

NocoBase client v2 enthält eine Reihe gemeinsamer Komponenten. Beim Entwickeln von Plugin-Seiten, Einstellungsseiten oder Formularen kannst du diese Komponenten direkt verwenden und die vorbereitete UI sowie Interaktionen von NocoBase wiederverwenden.

Dieser Bereich gruppiert Komponenten nach Einsatzszenarien. Jede Seite beschreibt eine Komponente: wofür sie geeignet ist, die häufig verwendete API und ob sie direkt in der Dokumentation angezeigt werden kann.

## Schnellindex

| Ich möchte ... | Siehe |
| --- | --- |
| Den niedrigstufigen Vollbild-Scanner steuern | [CodeScanner](./form/code-scanner) |
| Ein Standardformular in einem Dialog platzieren | [DialogFormLayout](./form/dialog-form-layout) |
| Ein Standardformular in einem Drawer platzieren | [DrawerFormLayout](./form/drawer-form-layout) |
| Nur `$env`-Umgebungsvariablen erlauben | [EnvVariableInput](./form/env-variable-input) |
| Eine Dateigröße eingeben und als Bytes speichern | [FileSizeInput](./form/file-size-input) |
| JSON- / JSON5-Konfiguration bearbeiten | [JsonTextArea](./form/json-text-area) |
| Ein Passwort mit Stärkeanzeige eingeben | [PasswordInput](./form/password-input) |
| Select-Optionen asynchron über eine API laden | [RemoteSelect](./form/remote-select) |
| Ein Eingabefeld um Scan-Unterstützung erweitern | [ScanInput](./form/scan-input) |
| Einem Feld Konstanten und Variablen zugleich erlauben | [TypedVariableInput](./form/typed-variable-input) |
| Einzeilige Felder Variablen wie `{{ $env.X }}` und `{{ $user.name }}` akzeptieren lassen | [VariableInput](./form/variable-input) |
| Variablen in JSON- / JSON5-Konfiguration einfügen | [VariableJsonTextArea](./form/variable-json-text-area) |
| Mehrzeiligen Text Variablen akzeptieren lassen | [VariableTextArea](./form/variable-text-area) |
| Eine Collection mit mehreren Bedingungen filtern | [CollectionFilter](./filter/) |
| Ein Collection-Filterpanel in eine Seite einbetten | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Die ziehbare Zeile einer antd Table anpassen | [SortableRow](./table/sortable-row) |
| Die Drag-Handle-Spalte einer Table anpassen | [SortHandle](./table/sort-handle) |
| Listen anzeigen, Zeilen auswählen und auf Einstellungsseiten per Drag sortieren | [Table](./table/) |
| Ant Design Icons verwenden oder eigene Icons registrieren | [Icon](./icon) |
| Eine interne Registry für Plugin-Erweiterungen erstellen | [createFormRegistry](./create-form-registry) |

## Verwendung

Importiere die benötigten Komponenten in einem Client-Plugin und verwende sie wie normale React-Komponenten:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Auswahlhinweise

Standardmäßig reichen React + Antd aus. Prüfe diese Komponenten zuerst bei typischen NocoBase-Plugin-Szenarien:

- Drawer- oder Dialog-Formulare auf Einstellungsseiten öffnen
- Variablen einfügen, JSON bearbeiten, Dateigrößen eingeben oder Codes in Formularfeldern scannen
- Collection-Filter oder Drag-Sortierung in Listen verwenden
- Den einheitlichen Icon-Einstieg von NocoBase verwenden

Für einfache Eingaben, Buttons und Hinweise sind Antd-Komponenten meist klarer.

## Verwandte Links

- [Komponentenentwicklung](../plugin-development/client/component/index.md)
- [Context - Häufige Funktionen](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
