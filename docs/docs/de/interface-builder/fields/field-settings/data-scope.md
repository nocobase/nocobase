:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datenbereich festlegen

## Einführung

Das Festlegen des Datenbereichs für ein Beziehungsfeld ähnelt dem Festlegen des Datenbereichs für einen Block. Sie definieren damit Standard-Filterbedingungen für die verknüpften Daten.

## Anwendung

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Statischer Wert

Beispiel: Nur nicht gelöschte Produkte können für die Verknüpfung ausgewählt werden.

> Die Feldliste enthält Felder aus der Ziel-Sammlung des Beziehungsfeldes.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Variabler Wert

Beispiel: Nur Produkte, deren Service-Datum nach dem Bestelldatum liegt, können für die Verknüpfung ausgewählt werden.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables).

### Verknüpfung von Beziehungsfeldern

Die Verknüpfung zwischen Beziehungsfeldern wird durch das Festlegen des Datenbereichs erreicht.

Beispiel: Die Sammlung „Bestellungen“ enthält ein Eins-zu-Viele-Beziehungsfeld „Opportunity-Produkt“ und ein Viele-zu-Eins-Beziehungsfeld „Opportunity“. Die Sammlung „Opportunity-Produkt“ wiederum enthält ein Viele-zu-Eins-Beziehungsfeld „Opportunity“. Im Bestellformular-Block werden die auswählbaren Daten für „Opportunity-Produkt“ so gefiltert, dass nur die Opportunity-Produkte angezeigt werden, die mit der aktuell im Formular ausgewählten „Opportunity“ verknüpft sind.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)