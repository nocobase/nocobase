---
pkg: "@nocobase/plugin-block-list"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Listenblock

## Einführung

Der Listenblock zeigt Daten in Listenform an. Er eignet sich hervorragend für die Darstellung von Daten wie Aufgabenlisten, Nachrichten oder Produktinformationen.

## Block-Konfiguration

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Datenbereich festlegen

Wie abgebildet: Filtern Sie nach Bestellungen mit dem Status „Storniert“.

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Weitere Informationen finden Sie unter [Datenbereich festlegen](/interface-builder/blocks/block-settings/data-scope).

### Sortierregeln festlegen

Wie abgebildet: Sortieren Sie nach Bestellbetrag in absteigender Reihenfolge.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Weitere Informationen finden Sie unter [Sortierregeln festlegen](/interface-builder/blocks/block-settings/sorting-rule).

## Felder konfigurieren

### Felder dieser Sammlung

> **Hinweis**: Felder aus geerbten Sammlungen (d. h. Felder der übergeordneten Sammlung) werden automatisch zusammengeführt und in der aktuellen Feldliste angezeigt.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Felder aus verknüpften Sammlungen

> **Hinweis**: Felder aus verknüpften Sammlungen können angezeigt werden (derzeit werden nur 1:1-Beziehungen unterstützt).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Für die Konfiguration von Listenfeldern siehe [Detailfeld](/interface-builder/fields/generic/detail-form-item).

## Aktionen konfigurieren

### Globale Aktionen

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Filtern](/interface-builder/actions/types/filter)
- [Hinzufügen](/interface-builder/actions/types/add-new)
- [Löschen](/interface-builder/actions/types/delete)
- [Aktualisieren](/interface-builder/actions/types/refresh)
- [Importieren](/interface-builder/actions/types/import)
- [Exportieren](/interface-builder/actions/types/export)
- [Vorlagen-Druck](/template-print/index)
- [Massenaktualisierung](/interface-builder/actions/types/bulk-update)
- [Anhänge exportieren](/interface-builder/actions/types/export-attachments)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS-Aktion](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)

### Zeilenaktionen

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Bearbeiten](/interface-builder/actions/types/edit)
- [Löschen](/interface-builder/actions/types/delete)
- [Verknüpfen](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Datensatz aktualisieren](/interface-builder/actions/types/update-record)
- [Vorlagen-Druck](/template-print/index)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS-Aktion](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)