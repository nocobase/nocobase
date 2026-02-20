---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Stapelaktualisierung

## Einführung

Die Stapelaktualisierungsaktion kommt zum Einsatz, wenn Sie dieselben Aktualisierungen auf eine Gruppe von Datensätzen anwenden möchten. Bevor Sie eine Stapelaktualisierung durchführen, müssen Sie die Logik für die Feldzuweisung im Voraus definieren. Diese Logik wird auf alle ausgewählten Datensätze angewendet, sobald Sie auf die Schaltfläche zum Aktualisieren klicken.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Aktionskonfiguration

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Zu aktualisierende Daten

Ausgewählt/Alle, Standard ist Ausgewählt.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Feldzuweisung

Legen Sie die Felder für die Stapelaktualisierung fest. Nur die hier konfigurierten Felder werden aktualisiert.

Wie in der Abbildung gezeigt, konfigurieren Sie die Stapelaktualisierungsaktion in der Bestellungs-Tabelle, um die ausgewählten Daten in den Status „Zur Genehmigung ausstehend“ zu aktualisieren.

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Bearbeiten Sie den Titel, den Typ und das Symbol der Schaltfläche;
- [Verknüpfungsregel](/interface-builder/actions/action-settings/linkage-rule): Schaltfläche dynamisch anzeigen/ausblenden;
- [Zweite Bestätigung](/interface-builder/actions/action-settings/double-check)