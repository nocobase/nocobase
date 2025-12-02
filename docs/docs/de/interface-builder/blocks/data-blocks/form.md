:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Formular-Block

## Einführung

Der Formular-Block ist ein wichtiger Block zum Erstellen von Dateneingabe- und Bearbeitungsoberflächen. Er ist hochgradig anpassbar und nutzt entsprechende Komponenten, um die benötigten Felder basierend auf dem Datenmodell anzuzeigen. Mittels Ereignisflüssen wie Verknüpfungsregeln kann der Formular-Block Felder dynamisch darstellen. Darüber hinaus lässt er sich mit Workflows kombinieren, um automatisierte Prozesse auszulösen und Daten zu verarbeiten, was die Arbeitseffizienz weiter steigert oder die Logik-Orchestrierung ermöglicht.

## Formular-Block hinzufügen

- **Formular bearbeiten**: Dient zum Ändern bestehender Daten.
- **Formular hinzufügen**: Dient zum Erstellen neuer Datensätze.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Block-Einstellungen

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Block-Verknüpfungsregel

Steuern Sie das Block-Verhalten (z. B. ob er angezeigt oder JavaScript ausgeführt werden soll) mithilfe von Verknüpfungsregeln.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Weitere Details finden Sie unter [Block-Verknüpfungsregel](/interface-builder/blocks/block-settings/block-linkage-rule)

### Feld-Verknüpfungsregel

Steuern Sie das Verhalten von Formularfeldern mithilfe von Verknüpfungsregeln.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Weitere Details finden Sie unter [Feld-Verknüpfungsregel](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Der Formular-Block unterstützt zwei Layout-Modi, die über das Attribut `layout` eingestellt werden können:

- **horizontal** (horizontal): Bei diesem Layout werden Beschriftung und Inhalt in einer Zeile angezeigt, was vertikalen Platz spart und sich für einfache Formulare oder Fälle mit weniger Informationen eignet.
- **vertical** (vertikal) (Standard): Die Beschriftung wird über dem Feld platziert. Dieses Layout macht das Formular leichter lesbar und ausfüllbar, besonders bei Formularen mit mehreren Feldern oder komplexen Eingabeelementen.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Felder konfigurieren

### Felder dieser Sammlung

> **Hinweis**: Felder aus vererbten Sammlungen (d.h. Felder der übergeordneten Sammlung) werden automatisch zusammengeführt und in der aktuellen Feldliste angezeigt.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Weitere Felder

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Schreiben Sie JavaScript, um den Anzeigeinhalt anzupassen und komplexe Informationen darzustellen.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Aktionen konfigurieren

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Absenden](/interface-builder/actions/types/submit)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS-Aktion](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)