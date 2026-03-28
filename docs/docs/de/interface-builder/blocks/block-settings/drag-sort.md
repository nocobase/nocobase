:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/blocks/block-settings/drag-sort).
:::

# Drag-and-Drop-Sortierung

## Einführung

Die Drag-and-Drop-Sortierung basiert auf einem Sortierfeld, um Datensätze innerhalb eines Blocks manuell neu zu ordnen.


:::info{title=Hinweis}
* Wenn dasselbe Sortierfeld für die Drag-and-Drop-Sortierung in mehreren Blöcken verwendet wird, kann dies die bestehende Reihenfolge stören.
* Bei der Drag-and-Drop-Sortierung in Tabellen dürfen für das Sortierfeld keine Gruppierungsregeln konfiguriert sein.
* Baumtabellen unterstützen nur das Sortieren von Knoten innerhalb derselben Ebene.

:::


## Konfiguration

Fügen Sie ein Feld vom Typ „Sortieren“ hinzu. Sortierfelder werden beim Erstellen einer Sammlung nicht mehr automatisch generiert, sondern müssen manuell erstellt werden.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Wenn Sie die Drag-and-Drop-Sortierung für eine Tabelle aktivieren, müssen Sie ein Sortierfeld auswählen.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Drag-and-Drop-Sortierung für Tabellenzeilen


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Erläuterung der Sortierregeln

Angenommen, die aktuelle Reihenfolge ist:

```
[1,2,3,4,5,6,7,8,9]
```

Wenn ein Element (z. B. 5) nach vorne an die Position von 3 verschoben wird, ändern sich nur die Sortierwerte von 3, 4 und 5: Die 5 nimmt die Position der 3 ein, und die 3 und 4 rücken jeweils um eine Position nach hinten.

```
[1,2,5,3,4,6,7,8,9]
```

Wenn Sie dann die 6 nach hinten an die Position der 8 verschieben, nimmt die 6 die Position der 8 ein, und die 7 und 8 rücken jeweils um eine Position nach vorne.

```
[1,2,5,3,4,7,8,6,9]
```