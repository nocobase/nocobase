:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Array-formatering

#### 1. :arrayJoin(separator, index, count)

##### Syntaxförklaring
Sammanfogar en array av strängar eller nummer till en enda sträng.
Parametrar:
- **separator:** Avgränsaren (standard är ett kommatecken `,`).
- **index:** Valfritt; startindexet från vilket sammanfogningen ska börja.
- **count:** Valfritt; antalet objekt att sammanfoga med start från `index` (kan vara negativt för att räkna från slutet).

##### Exempel
```
['homer','bart','lisa']:arrayJoin()              // Utdata "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Utdata "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Utdata "homerbartlisa"
[10,50]:arrayJoin()                               // Utdata "10, 50"
[]:arrayJoin()                                    // Utdata ""
null:arrayJoin()                                  // Utdata null
{}:arrayJoin()                                    // Utdata {}
20:arrayJoin()                                    // Utdata 20
undefined:arrayJoin()                             // Utdata undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Utdata "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Utdata "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Utdata "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Utdata "homerbart"
```

##### Resultat
Utdata är en sträng som skapats genom att sammanfoga array-elementen enligt de angivna parametrarna.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Syntaxförklaring
Omvandlar en array av objekt till en sträng. Den hanterar inte kapslade objekt eller arrayer.
Parametrar:
- **objSeparator:** Avgränsaren mellan objekt (standard är `, `).
- **attSeparator:** Avgränsaren mellan objektattribut (standard är `:`).
- **attributes:** Valfritt; en lista över objektattribut som ska visas.

##### Exempel
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Utdata "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Utdata "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Utdata "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Utdata "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Utdata "2:homer"

['homer','bart','lisa']:arrayMap()    // Utdata "homer, bart, lisa"
[10,50]:arrayMap()                    // Utdata "10, 50"
[]:arrayMap()                         // Utdata ""
null:arrayMap()                       // Utdata null
{}:arrayMap()                         // Utdata {}
20:arrayMap()                         // Utdata 20
undefined:arrayMap()                  // Utdata undefined
```

##### Resultat
Utdata är en sträng som genereras genom att mappa och sammanfoga array-elementen, och ignorerar kapslat objektinnehåll.

#### 3. :count(start)

##### Syntaxförklaring
Räknar radnumret i en array och visar det aktuella radnumret.
Till exempel:
```
{d[i].id:count()}
```
Oavsett värdet på `id` visas det aktuella radnumret.
Från och med v4.0.0 har denna formaterare internt ersatts av `:cumCount`.

Parameter:
- **start:** Valfritt; startvärdet för räkningen.

##### Exempel och resultat
Vid användning kommer utdata att visa radnumret enligt array-elementens ordning.