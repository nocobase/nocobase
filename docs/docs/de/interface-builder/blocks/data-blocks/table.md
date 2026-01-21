:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Tabellen-Block

## Einführung

Der Tabellen-Block ist einer der Kern-Datenblöcke, die in **NocoBase** integriert sind. Er dient hauptsächlich dazu, strukturierte Daten in Tabellenform anzuzeigen und zu verwalten. Er bietet flexible Konfigurationsoptionen, mit denen Sie die Spalten, Spaltenbreiten, Sortierregeln und den Datenumfang der Tabelle an Ihre Bedürfnisse anpassen können. So stellen Sie sicher, dass die angezeigten Daten Ihren spezifischen Geschäftsanforderungen entsprechen.

#### Hauptfunktionen:
- **Flexible Spaltenkonfiguration**: Sie können die Spalten und Spaltenbreiten der Tabelle anpassen, um unterschiedlichen Anforderungen an die Datenanzeige gerecht zu werden.
- **Sortierregeln**: Unterstützt das Sortieren von Tabellendaten. Sie können Daten basierend auf verschiedenen Feldern in aufsteigender oder absteigender Reihenfolge anordnen.
- **Datenbereich festlegen**: Durch die Festlegung des Datenbereichs können Sie den Umfang der angezeigten Daten steuern und so Störungen durch irrelevante Daten vermeiden.
- **Aktionskonfiguration**: Der Tabellen-Block enthält verschiedene integrierte Aktionsoptionen. Sie können Aktionen wie Filtern, Neu hinzufügen, Bearbeiten und Löschen einfach konfigurieren, um Daten schnell zu verwalten.
- **Schnellbearbeitung**: Unterstützt die direkte Datenbearbeitung innerhalb der Tabelle, was den Arbeitsablauf vereinfacht und die Arbeitseffizienz steigert.

## Block-Einstellungen

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Block-Verknüpfungsregeln

Steuern Sie das Verhalten des Blocks (z. B. ob er angezeigt oder JavaScript ausgeführt werden soll) über Verknüpfungsregeln.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Weitere Details finden Sie unter [Verknüpfungsregeln](/interface-builder/linkage-rule)

### Datenbereich festlegen

Beispiel: Filtern Sie standardmäßig Bestellungen, deren „Status“ „Bezahlt“ ist.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Weitere Details finden Sie unter [Datenbereich festlegen](/interface-builder/blocks/block-settings/data-scope)

### Sortierregeln festlegen

Beispiel: Zeigen Sie Bestellungen nach Datum in absteigender Reihenfolge an.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Weitere Details finden Sie unter [Sortierregeln festlegen](/interface-builder/blocks/block-settings/sorting-rule)

### Schnellbearbeitung aktivieren

Aktivieren Sie „Schnellbearbeitung aktivieren“ in den Block-Einstellungen und den Tabellenspalten-Einstellungen, um anzupassen, welche Spalten schnell bearbeitet werden können.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Baumstruktur-Tabelle aktivieren

Wenn die Daten-Tabelle eine hierarchische (Baumstruktur-)Tabelle ist, kann der Tabellen-Block die Funktion „Baumstruktur-Tabelle aktivieren“ auswählen. Standardmäßig ist diese Option deaktiviert. Nach der Aktivierung zeigt der Block Daten in einer Baumstruktur an und unterstützt die entsprechenden Konfigurationsoptionen und Operationen.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Alle Zeilen standardmäßig erweitern

Wenn die Baumstruktur-Tabelle aktiviert ist, unterstützt der Block das standardmäßige Erweitern aller untergeordneten Daten beim Laden.

## Felder konfigurieren

### Felder dieser Sammlung

> **Hinweis**: Felder aus vererbten Sammlungen (d. h. Felder der übergeordneten Sammlung) werden automatisch zusammengeführt und in der aktuellen Feldliste angezeigt.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Felder verknüpfter Sammlungen

> **Hinweis**: Es wird unterstützt, Felder aus verknüpften Sammlungen anzuzeigen (derzeit nur für 1:1-Beziehungen).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Andere benutzerdefinierte Spalten

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Aktionen konfigurieren

### Globale Aktionen

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

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
- [JS Action](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)

### Zeilen-Aktionen

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Anzeigen](/interface-builder/actions/types/view)
- [Bearbeiten](/interface-builder/actions/types/edit)
- [Löschen](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Verknüpfen](/interface-builder/actions/types/link)
- [Datensatz aktualisieren](/interface-builder/actions/types/update-record)
- [Vorlagen-Druck](/template-print/index)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)