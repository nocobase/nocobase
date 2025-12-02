---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Anhänge exportieren

## Einführung

Der Anhangsexport ermöglicht es Ihnen, anhangbezogene Felder als komprimiertes Paket zu exportieren.

#### Konfiguration des Anhangsexports

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Wählen Sie die Anhangsfelder aus, die exportiert werden sollen; Mehrfachauswahl ist möglich.
- Sie können wählen, ob für jeden Datensatz ein eigener Ordner erstellt werden soll.

Dateibenennungsregeln:

- Wenn Sie sich dafür entscheiden, für jeden Datensatz einen Ordner zu erstellen, lautet die Dateibenennungsregel: `{Wert des Titelfeldes des Datensatzes}/{Name des Anhangsfeldes}[-{Dateinummer}].{Dateierweiterung}`.
- Wenn Sie keinen Ordner erstellen möchten, lautet die Dateibenennungsregel: `{Wert des Titelfeldes des Datensatzes}-{Name des Anhangsfeldes}[-{Dateinummer}].{Dateierweiterung}`.

Die Dateinummer wird automatisch generiert, wenn ein Anhangsfeld mehrere Anhänge enthält.

- [Verknüpfungsregeln](/interface-builder/actions/action-settings/linkage-rule): Schaltfläche dynamisch ein-/ausblenden;
- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Typ und Symbol der Schaltfläche bearbeiten;