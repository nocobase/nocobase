:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datenbereich festlegen

## Einführung

Das Festlegen eines Datenbereichs bedeutet, Standard-Filterbedingungen für einen Datenblock zu definieren. Benutzer können den Datenbereich flexibel an ihre Geschäftsanforderungen anpassen, aber unabhängig von den vorgenommenen Filteroperationen wendet das System diese Standard-Filterbedingung automatisch an. Dadurch wird sichergestellt, dass die Daten stets innerhalb der festgelegten Bereichsgrenzen bleiben.

## Benutzerhandbuch

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

Das Filterfeld unterstützt die Auswahl von Feldern aus der aktuellen Sammlung und verknüpften Sammlungen.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Operatoren

Verschiedene Feldtypen unterstützen unterschiedliche Operatoren. Zum Beispiel unterstützen Textfelder Operatoren wie „gleich“, „ungleich“ und „enthält“; Zahlenfelder unterstützen Operatoren wie „größer als“ und „kleiner als“; während Datumsfelder Operatoren wie „innerhalb von“ und „vor einem bestimmten Datum“ unterstützen.

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Statischer Wert

Beispiel: Filtern Sie Daten nach dem „Status“ der Bestellung.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Variablenwert

Beispiel: Filtern Sie Bestelldaten für den aktuellen Benutzer.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables)