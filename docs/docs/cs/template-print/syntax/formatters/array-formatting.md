:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování polí

#### 1. :arrayJoin(separator, index, count)

##### Popis syntaxe
Spojí pole řetězců nebo čísel do jednoho řetězce.  
Parametry:
- `separator`: Oddělovač (výchozí je čárka `,`).
- `index`: Volitelný; počáteční index, od kterého se má spojování začít.
- `count`: Volitelný; počet položek, které se mají spojit počínaje od `indexu` (může být záporné číslo pro počítání od konce).

##### Příklad
```
['homer','bart','lisa']:arrayJoin()              // Výstup: "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Výstup: "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Výstup: "homerbartlisa"
[10,50]:arrayJoin()                               // Výstup: "10, 50"
[]:arrayJoin()                                    // Výstup: ""
null:arrayJoin()                                  // Výstup: null
{}:arrayJoin()                                    // Výstup: {}
20:arrayJoin()                                    // Výstup: 20
undefined:arrayJoin()                             // Výstup: undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Výstup: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Výstup: "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Výstup: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Výstup: "homerbart"
```

##### Výsledek
Výstupem je řetězec vytvořený spojením prvků pole podle zadaných parametrů.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Popis syntaxe
Transformuje pole objektů na řetězec. Nezpracovává vnořené objekty ani pole.  
Parametry:
- `objSeparator`: Oddělovač mezi objekty (výchozí je `, `).
- `attSeparator`: Oddělovač mezi atributy objektů (výchozí je `:`).
- `attributes`: Volitelný; seznam atributů objektu, které se mají vypsat.

##### Příklad
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Výstup: "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Výstup: "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Výstup: "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Výstup: "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Výstup: "2:homer"

['homer','bart','lisa']:arrayMap()    // Výstup: "homer, bart, lisa"
[10,50]:arrayMap()                    // Výstup: "10, 50"
[]:arrayMap()                         // Výstup: ""
null:arrayMap()                       // Výstup: null
{}:arrayMap()                         // Výstup: {}
20:arrayMap()                         // Výstup: 20
undefined:arrayMap()                  // Výstup: undefined
```

##### Výsledek
Výstupem je řetězec vygenerovaný mapováním a spojením prvků pole, přičemž vnořený obsah objektů je ignorován.

#### 3. :count(start)

##### Popis syntaxe
Počítá číslo řádku v poli a vypisuje aktuální číslo řádku.  
Například:
```
{d[i].id:count()}
```  
Bez ohledu na hodnotu `id` vždy vypíše aktuální počet řádků.  
Od verze v4.0.0 byl tento formátovač interně nahrazen `:cumCount`.

Parametr:
- `start`: Volitelný; počáteční hodnota pro počítání.

##### Příklad a výsledek
Při použití se výstupní číslo řádku zobrazí podle pořadí prvků pole.