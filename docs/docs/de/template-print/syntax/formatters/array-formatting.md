:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Array-Formatierung

#### 1. :arrayJoin(separator, index, count)

##### Syntax-Erklärung
Verbindet ein Array aus Zeichenketten oder Zahlen zu einer einzigen Zeichenkette.
Parameter:
- `separator`: Das Trennzeichen (Standard ist ein Komma `,`).
- `index`: Optional; der Startindex, ab dem die Elemente verbunden werden sollen.
- `count`: Optional; die Anzahl der Elemente, die ab dem `index` verbunden werden sollen (kann negativ sein, um vom Ende her zu zählen).

##### Beispiel
```
['homer','bart','lisa']:arrayJoin()              // Ergibt "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Ergibt "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Ergibt "homerbartlisa"
[10,50]:arrayJoin()                               // Ergibt "10, 50"
[]:arrayJoin()                                    // Ergibt ""
null:arrayJoin()                                  // Ergibt null
{}:arrayJoin()                                    // Ergibt {}
20:arrayJoin()                                    // Ergibt 20
undefined:arrayJoin()                             // Ergibt undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Ergibt "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Ergibt "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Ergibt "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Ergibt "homerbart"
```

##### Ergebnis
Die Ausgabe ist eine Zeichenkette, die durch das Verbinden der Array-Elemente gemäß den angegebenen Parametern entsteht.


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Syntax-Erklärung
Wandelt ein Array von Objekten in eine Zeichenkette um. Verschachtelte Objekte oder Arrays werden dabei nicht verarbeitet.
Parameter:
- `objSeparator`: Das Trennzeichen zwischen den Objekten (Standard ist `, `).
- `attSeparator`: Das Trennzeichen zwischen den Objektattributen (Standard ist `:`).
- `attributes`: Optional; eine Liste der Objektattribute, die ausgegeben werden sollen.

##### Beispiel
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Ergibt "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Ergibt "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Ergibt "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Ergibt "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Ergibt "2:homer"

['homer','bart','lisa']:arrayMap()    // Ergibt "homer, bart, lisa"
[10,50]:arrayMap()                    // Ergibt "10, 50"
[]:arrayMap()                         // Ergibt ""
null:arrayMap()                       // Ergibt null
{}:arrayMap()                         // Ergibt {}
20:arrayMap()                         // Ergibt 20
undefined:arrayMap()                  // Ergibt undefined
```

##### Ergebnis
Die Ausgabe ist eine Zeichenkette, die durch das Mappen und Verbinden der Array-Elemente erzeugt wird, wobei verschachtelte Objektinhalte ignoriert werden.


#### 3. :count(start)

##### Syntax-Erklärung
Zählt die Zeilennummer in einem Array und gibt die aktuelle Zeilennummer aus.
Zum Beispiel:
```
{d[i].id:count()}
```
Unabhängig vom Wert der `id` wird die aktuelle Zeilenzahl ausgegeben.
Ab Version 4.0.0 wurde dieser Formatierer intern durch `:cumCount` ersetzt.

Parameter:
- `start`: Optional; der Startwert für die Zählung.

##### Beispiel und Ergebnis
Bei der Verwendung wird die ausgegebene Zeilennummer entsprechend der Reihenfolge der Array-Elemente angezeigt.