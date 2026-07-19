---
pkg: "@nocobase/plugin-field-sort"
title: "Sortierfeld"
description: "Sortierfelder sortieren Datensätze in einer Datentabelle, unterstützen zunächst Gruppieren und anschließend Sortieren und ermöglichen die Anpassung der Anzeigereihenfolge von Datensätzen."
keywords: "Sortierfeld,Sort-Feld,Gruppierungssortierung,sort,NocoBase"
---

# Sortierfeld

## Einführung

In NocoBase wird das **Sortierfeld (Sort)** verwendet, um Sortierwerte für Datensätze in einer Datentabelle zu speichern. Es wird häufig für die Sortierung per Drag-and-Drop in Blöcken wie Tabellen und Kanban-Boards verwendet.

Sortierfelder unterstützen sowohl ungegruppierte Sortierung als auch Sortierung nach vorheriger Gruppierung. Die Gruppierungssortierung eignet sich für Szenarien mit unabhängiger Sortierung innerhalb derselben Gruppe, beispielsweise für die Anordnung von Schülern nach Klasse oder von Aufgaben nach Kanban-Status.

:::warning Hinweis

Da das Sortierfeld ein Feld derselben Tabelle ist, kann ein Datensatz bei der Gruppierungssortierung nicht gleichzeitig in mehreren Gruppen erscheinen.

:::

## Installation

Das Sortierfeld wird von einem integrierten Plugin bereitgestellt und muss nicht separat installiert werden.

## Sortierfeld erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Sortierung“ aus, um ein Sortierfeld zu erstellen.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Beim Erstellen eines Sortierfelds initialisiert NocoBase die Sortierwerte:

- Wenn keine Gruppierungssortierung ausgewählt ist, erfolgt die Initialisierung anhand des Primärschlüsselfelds und des Erstellungsdatumsfelds.
- Wenn Gruppierungssortierung ausgewählt ist, werden die Daten zunächst gruppiert und anschließend anhand des Primärschlüsselfelds und des Erstellungsdatumsfelds initialisiert.

:::warning Hinweis

Wenn die Initialisierung der Sortierwerte beim Erstellen des Felds fehlschlägt, wird das Sortierfeld nicht erstellt. Wird ein Datensatz innerhalb eines Bereichs von Position A nach Position B verschoben, ändern sich die Sortierwerte aller Datensätze im Bereich zwischen A und B. Schlägt die Änderung bei einem davon fehl, schlägt die Verschiebung fehl und die Sortierwerte der betreffenden Datensätze werden nicht geändert.

:::

### Ungegruppiertes Sortierfeld erstellen

Nachfolgend sehen Sie ein Beispiel für die Erstellung eines `sort1`-Felds ohne Gruppierungssortierung.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Die Sortierfelder der einzelnen Datensätze werden anhand des Primärschlüsselfelds und des Erstellungsdatumsfelds initialisiert.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Gruppiertes Sortierfeld erstellen

Nachfolgend wird ein `sort2`-Feld erstellt, das auf der Gruppierung `Class ID` basiert.

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Dabei werden zunächst alle Datensätze der Datentabelle nach `Class ID` gruppiert und anschließend die Sortierfelder initialisiert.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Sortierung per Drag-and-Drop

Sortierfelder werden hauptsächlich für die Sortierung von Datensätzen per Drag-and-Drop in verschiedenen Blöcken verwendet. Derzeit unterstützen Tabellen- und Kanban-Blöcke die Sortierung per Drag-and-Drop.

:::warning Hinweis

- Wenn dasselbe Sortierfeld für die Drag-and-Drop-Sortierung verwendet wird, kann die gemeinsame Nutzung in mehreren Blöcken die bestehende Sortierung beeinträchtigen.
- Für die Drag-and-Drop-Sortierung in Tabellen kann kein Sortierfeld mit Gruppierungsregeln ausgewählt werden.
- In Tabellenblöcken mit Eins-zu-viele-Beziehungen kann der Fremdschlüssel als Gruppierung verwendet werden.
- Derzeit unterstützt nur der Kanban-Block die gruppierte Sortierung per Drag-and-Drop.

:::

### Sortierung von Tabellenzeilen per Drag-and-Drop

Tabellenblöcke können Sortierfelder verwenden, um die Reihenfolge der Datensätze per Drag-and-Drop anzupassen.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Auch relationale Tabellenblöcke können Sortierfelder für die Sortierung per Drag-and-Drop verwenden.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Sortierung per Drag-and-Drop im relationalen Tabellenblock"></video>

:::warning Hinweis

Wenn in einem Eins-zu-viele-Beziehungsblock ein ungegruppiertes Sortierfeld ausgewählt wird, können alle Datensätze an der Sortierung beteiligt sein. Wenn hingegen zunächst anhand des Fremdschlüssels gruppiert und danach sortiert wird, wirkt sich die Sortierregel nur auf die Daten innerhalb der aktuellen Gruppe aus. Das Endergebnis kann gleich aussehen, aber der Umfang der an der Sortierung beteiligten Datensätze ist unterschiedlich.

:::

### Sortierung von Kanban-Karten per Drag-and-Drop

Kanban-Blöcke können Sortierfelder verwenden, um die Reihenfolge der Karten per Drag-and-Drop anzupassen.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Erläuterung der Sortierregeln

### Verschieben zwischen ungegruppierten Datensätzen

Angenommen, es gibt eine Gruppe von Daten:

```text
[1,2,3,4,5,6,7,8,9]
```

Wenn 5 vorwärts auf die Position von 3 verschoben wird, ändern sich nur die Nummern von 3, 4 und 5. 5 nimmt die Position von 3 ein, während 3 und 4 jeweils eine Position nach hinten rücken.

```text
[1,2,5,3,4,6,7,8,9]
```

Wenn 6 anschließend rückwärts auf die Position von 8 verschoben wird, nimmt 6 die Position von 8 ein, während 7 und 8 jeweils eine Position nach vorne rücken.

```text
[1,2,5,3,4,7,8,6,9]
```

### Verschieben zwischen verschiedenen Gruppen

Bei der Gruppierungssortierung ändert sich auch die Gruppe eines Datensatzes, wenn er in eine andere Gruppe verschoben wird. Angenommen, es gibt zwei Gruppen von Daten:

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Wenn 1 hinter 6 verschoben wird, ändert sich die Gruppe von 1 ebenfalls von A zu B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### Änderungen der Sortierung sind unabhängig von den in der Oberfläche angezeigten Daten

Angenommen, es gibt eine Gruppe von Daten:

```text
[1,2,3,4,5,6,7,8,9]
```

Die Oberfläche zeigt nur Folgendes an:

```text
[1,5,9]
```

Wenn 1 auf die Position von 9 verschoben wird, ändern sich auch die Positionen der dazwischenliegenden Elemente 2, 3, 4, 5, 6, 7 und 8.

```text
[2,3,4,5,6,7,8,9,1]
```

Die Oberfläche zeigt schließlich Folgendes an:

```text
[5,9,1]
```

## Weiterführende Links

- [Datentabellenfelder](../index.md) — Feldtypen und Erläuterungen zu Feldzuordnungen anzeigen
- [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) — Sortierung per Drag-and-Drop in Tabellen verwenden
- [Kanban-Block](../../interface-builder/blocks/data-blocks/kanban.md) — Sortierung per Drag-and-Drop in Kanban-Boards verwenden