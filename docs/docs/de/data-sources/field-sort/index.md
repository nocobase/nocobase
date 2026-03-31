---
pkg: "@nocobase/plugin-field-sort"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Sortierfeld

## Einführung

Sortierfelder werden verwendet, um Datensätze in einer Sammlung zu sortieren. Sie unterstützen auch die Sortierung innerhalb von Gruppen.

:::warning
Da das Sortierfeld Teil derselben Sammlung ist, kann ein Datensatz bei der Gruppensortierung nicht mehreren Gruppen zugewiesen werden.
:::

## Installation

Dieses Plugin ist integriert und muss nicht separat installiert werden.

## Benutzerhandbuch

### Ein Sortierfeld erstellen

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Beim Erstellen von Sortierfeldern werden die Sortierwerte initialisiert:

- Wenn keine Gruppensortierung ausgewählt ist, erfolgt die Initialisierung basierend auf dem Primärschlüsselfeld und dem Erstellungsdatumsfeld.
- Wenn eine Gruppensortierung ausgewählt ist, werden die Daten zuerst gruppiert und anschließend basierend auf dem Primärschlüsselfeld und dem Erstellungsdatumsfeld initialisiert.

:::warning{title="Erläuterung der Transaktionskonsistenz"}
- Wenn beim Erstellen eines Feldes die Initialisierung des Sortierwerts fehlschlägt, wird das Sortierfeld nicht erstellt.
- Wenn ein Datensatz innerhalb eines bestimmten Bereichs von Position A nach Position B verschoben wird, ändern sich die Sortierwerte aller Datensätze zwischen A und B. Schlägt ein Teil dieser Aktualisierung fehl, wird der gesamte Verschiebevorgang rückgängig gemacht und die Sortierwerte der betroffenen Datensätze bleiben unverändert.
:::

#### Beispiel 1: Das Feld sort1 erstellen

Das Feld sort1 ist nicht gruppiert.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Die Sortierfelder jedes Datensatzes werden basierend auf dem Primärschlüsselfeld und dem Erstellungsdatumsfeld initialisiert.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Beispiel 2: Ein sort2-Feld basierend auf der Gruppierung nach Class ID erstellen

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Dabei werden alle Datensätze in der Sammlung zuerst gruppiert (nach Class ID), und anschließend wird das Sortierfeld (sort2) initialisiert. Die initialen Werte jedes Datensatzes sind:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Drag-and-Drop-Sortierung

Sortierfelder werden hauptsächlich für die Drag-and-Drop-Sortierung von Datensätzen in verschiedenen Blöcken verwendet. Aktuell unterstützen Tabellen und Boards die Drag-and-Drop-Sortierung.

:::warning
- Wenn dasselbe Sortierfeld für die Drag-and-Drop-Sortierung in mehreren Blöcken gleichzeitig verwendet wird, kann dies die bestehende Reihenfolge stören.
- Für die Drag-and-Drop-Sortierung in Tabellen kann kein Sortierfeld mit einer Gruppierungsregel ausgewählt werden.
  - Ausnahme: In einem Tabellenblock mit einer Eins-zu-Viele-Beziehung kann der Fremdschlüssel als Gruppe dienen.
- Derzeit unterstützt nur der Board-Block die Drag-and-Drop-Sortierung innerhalb von Gruppen.
:::

#### Drag-and-Drop-Sortierung von Tabellenzeilen

Tabellenblock

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Beziehungstabellenblock

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
In einem Eins-zu-Viele-Beziehungsblock:

- Wenn ein nicht gruppiertes Sortierfeld ausgewählt ist, können alle Datensätze an der Sortierung teilnehmen.
- Wenn Datensätze zuerst nach dem Fremdschlüssel gruppiert und dann sortiert werden, wirkt sich die Sortierregel nur auf die Daten innerhalb der aktuellen Gruppe aus.

Der Endeffekt ist derselbe, aber die Anzahl der an der Sortierung beteiligten Datensätze unterscheidet sich. Weitere Details finden Sie unter [Erläuterung der Sortierregeln](#erläuterung-der-sortierregeln).
:::

#### Drag-and-Drop-Sortierung von Board-Karten

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Erläuterung der Sortierregeln

#### Verschiebung zwischen nicht gruppierten (oder gleich gruppierten) Elementen

Angenommen, Sie haben einen Datensatz:

```
[1,2,3,4,5,6,7,8,9]
```

Wenn ein Element, zum Beispiel 5, vorwärts an die Position von 3 verschoben wird, ändern sich nur die Positionen der Elemente 3, 4 und 5. Element 5 nimmt die Position von 3 ein, und die Elemente 3 und 4 verschieben sich jeweils eine Position nach hinten.

```
[1,2,5,3,4,6,7,8,9]
```

Wenn Sie dann Element 6 rückwärts an die Position von 8 verschieben, nimmt Element 6 die Position von 8 ein, und die Elemente 7 und 8 verschieben sich jeweils eine Position nach vorne.

```
[1,2,5,3,4,7,8,6,9]
```

#### Verschiebung von Elementen zwischen verschiedenen Gruppen

Bei der Gruppensortierung ändert sich die Gruppenzuweisung eines Datensatzes, wenn er in eine andere Gruppe verschoben wird. Zum Beispiel:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Wenn Element 1 nach Element 6 verschoben wird (Standardverhalten), ändert sich seine Gruppe ebenfalls von A zu B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Sortieränderungen sind unabhängig von den auf der Benutzeroberfläche angezeigten Daten

Betrachten Sie zum Beispiel einen Datensatz:

```
[1,2,3,4,5,6,7,8,9]
```

Die Benutzeroberfläche zeigt nur eine gefilterte Ansicht:

```
[1,5,9]
```

Wenn Element 1 an die Position von Element 9 verschoben wird, ändern sich auch die Positionen aller dazwischenliegenden Elemente (2, 3, 4, 5, 6, 7, 8), auch wenn diese nicht sichtbar sind.

```
[2,3,4,5,6,7,8,9,1]
```

Die Benutzeroberfläche zeigt nun die neue Reihenfolge basierend auf den gefilterten Elementen an:

```
[5,9,1]
```