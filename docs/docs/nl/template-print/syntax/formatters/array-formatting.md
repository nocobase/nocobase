:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Array-opmaak

#### 1. :arrayJoin(separator, index, count)

##### Syntaxis uitleg
Voegt een array van strings of getallen samen tot één string.
Parameters:
- **separator:** Het scheidingsteken (standaard is een komma `,`).
- **index:** Optioneel; de startindex van waaruit de elementen moeten worden samengevoegd.
- **count:** Optioneel; het aantal elementen dat vanaf `index` moet worden samengevoegd (kan negatief zijn om vanaf het einde te tellen).

##### Voorbeeld
```
['homer','bart','lisa']:arrayJoin()              // Resultaat: "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Resultaat: "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Resultaat: "homerbartlisa"
[10,50]:arrayJoin()                               // Resultaat: "10, 50"
[]:arrayJoin()                                    // Resultaat: ""
null:arrayJoin()                                  // Resultaat: null
{}:arrayJoin()                                    // Resultaat: {}
20:arrayJoin()                                    // Resultaat: 20
undefined:arrayJoin()                             // Resultaat: undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Resultaat: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Resultaat: "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Resultaat: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Resultaat: "homerbart"
```

##### Resultaat
Het resultaat is een string die is samengesteld door de array-elementen samen te voegen volgens de opgegeven parameters.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Syntaxis uitleg
Converteert een array van objecten naar een string. Geneste objecten of arrays worden niet verwerkt.
Parameters:
- **objSeparator:** Het scheidingsteken tussen objecten (standaard is `, `).
- **attSeparator:** Het scheidingsteken tussen objectattributen (standaard is `:`).
- **attributes:** Optioneel; een lijst met objectattributen die moeten worden uitgevoerd.

##### Voorbeeld
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Resultaat: "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Resultaat: "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Resultaat: "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Resultaat: "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Resultaat: "2:homer"

['homer','bart','lisa']:arrayMap()    // Resultaat: "homer, bart, lisa"
[10,50]:arrayMap()                    // Resultaat: "10, 50"
[]:arrayMap()                         // Resultaat: ""
null:arrayMap()                       // Resultaat: null
{}:arrayMap()                         // Resultaat: {}
20:arrayMap()                         // Resultaat: 20
undefined:arrayMap()                  // Resultaat: undefined
```

##### Resultaat
Het resultaat is een samengevoegde string, waarbij geneste inhoud in objecten wordt genegeerd.

#### 3. :count(start)

##### Syntaxis uitleg
Telt het rijnummer in een array en geeft het huidige rijnummer weer.
Bijvoorbeeld:
```
{d[i].id:count()}
```
Ongeacht de waarde van `id`, wordt de huidige rijtelling weergegeven.
Vanaf v4.0.0 is deze formatter intern vervangen door `:cumCount`.

Parameter:
- **start:** Optioneel; de startwaarde voor de telling.

##### Voorbeeld en resultaat
Bij gebruik wordt het rijnummer weergegeven volgens de volgorde van de array-elementen.