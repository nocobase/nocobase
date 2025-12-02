:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Seitenfilter und Verknüpfung

Der Seitenfilter (Filter-Block) dient dazu, auf Seitenebene Filterbedingungen einheitlich einzugeben und diese in Diagrammabfragen zusammenzuführen. Dies ermöglicht eine konsistente Filterung und Verknüpfung über mehrere Diagramme hinweg.

## Funktionsübersicht
- Fügen Sie auf der Seite einen „Filter-Block“ hinzu, um allen Diagrammen der aktuellen Seite einen einheitlichen Filterzugang zu bieten.
- Verwenden Sie die Schaltflächen „Filtern“, „Zurücksetzen“ und „Einklappen“, um Filter anzuwenden, zu löschen und den Block einzuklappen.
- Wenn im Filter Felder ausgewählt werden, die mit einem Diagramm verknüpft sind, werden deren Werte automatisch in die Abfrage des Diagramms übernommen und lösen eine Aktualisierung des Diagramms aus.
- Filter können auch benutzerdefinierte Felder erstellen und diese in Kontextvariablen registrieren, sodass sie in Diagrammen, Tabellen, Formularen und anderen Datenblöcken referenziert werden können.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Weitere Informationen zur Verwendung von Seitenfiltern sowie zur Verknüpfung mit Diagrammen und anderen Datenblöcken finden Sie in der Dokumentation zu Seitenfiltern.

## Seitenfilterwerte in Diagrammabfragen verwenden
- Builder-Modus (empfohlen)
  - Automatisches Zusammenführen: Wenn Datenquelle und Sammlung übereinstimmen, müssen Sie keine zusätzlichen Variablen in der Diagrammabfrage definieren; Seitenfilter werden mit `$and` zusammengeführt.
  - Manuelle Auswahl: Sie können auch in den Filterbedingungen aktiv Werte aus den „benutzerdefinierten Feldern“ des Seitenfilters auswählen.

- SQL-Modus (via Variableninjektion)
  - Verwenden Sie in SQL-Anweisungen die Option „Variable auswählen“, um Werte aus den „benutzerdefinierten Feldern“ des Seitenfilters einzufügen.