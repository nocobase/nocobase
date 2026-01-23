:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Voorwaardelijke instructies

Voorwaardelijke instructies stellen u in staat om de weergave of het verbergen van inhoud in het document dynamisch te beheren op basis van datawaarden. Er zijn drie belangrijke manieren om voorwaarden te schrijven:

- **Inline voorwaarden**: Geven direct tekst weer (of vervangen deze door andere tekst).
- **Voorwaardelijke blokken**: Tonen of verbergen een gedeelte van het document, geschikt voor meerdere tags, paragrafen, tabellen, enz.
- **Slimme voorwaarden**: Verwijderen of behouden direct doelelementen (zoals rijen, paragrafen, afbeeldingen, enz.) met één enkele tag, voor een beknoptere syntaxis.

Alle voorwaarden beginnen met een logische evaluatie-formatter (bijv. ifEQ, ifGT, enz.), gevolgd door actie-formatters (zoals show, elseShow, drop, keep, enz.).

### Overzicht

De logische operatoren en actie-formatters die in voorwaardelijke instructies worden ondersteund, zijn onder andere:

- **Logische operatoren**
  - **ifEQ(value)**: Controleert of de data gelijk is aan de opgegeven waarde.
  - **ifNE(value)**: Controleert of de data niet gelijk is aan de opgegeven waarde.
  - **ifGT(value)**: Controleert of de data groter is dan de opgegeven waarde.
  - **ifGTE(value)**: Controleert of de data groter is dan of gelijk is aan de opgegeven waarde.
  - **ifLT(value)**: Controleert of de data kleiner is dan de opgegeven waarde.
  - **ifLTE(value)**: Controleert of de data kleiner is dan of gelijk is aan de opgegeven waarde.
  - **ifIN(value)**: Controleert of de data is opgenomen in een array of string.
  - **ifNIN(value)**: Controleert of de data niet is opgenomen in een array of string.
  - **ifEM()**: Controleert of de data leeg is (bijv. null, undefined, een lege string, een lege array of een leeg object).
  - **ifNEM()**: Controleert of de data niet-leeg is.
  - **ifTE(type)**: Controleert of het datatype gelijk is aan het opgegeven type (bijvoorbeeld "string", "number", "boolean", enz.).
  - **and(value)**: Logische "en", gebruikt om meerdere voorwaarden te verbinden.
  - **or(value)**: Logische "of", gebruikt om meerdere voorwaarden te verbinden.

- **Actie-formatters**
  - **:show(text) / :elseShow(text)**: Gebruikt in inline voorwaarden om de opgegeven tekst direct weer te geven.
  - **:hideBegin / :hideEnd** en **:showBegin / :showEnd**: Gebruikt in voorwaardelijke blokken om gedeelten van het document te verbergen of te tonen.
  - **:drop(element) / :keep(element)**: Gebruikt in slimme voorwaarden om opgegeven documentelementen te verwijderen of te behouden.

De volgende secties introduceren de gedetailleerde syntaxis, voorbeelden en resultaten voor elk gebruik.

### Inline voorwaarden

#### 1. :show(text) / :elseShow(text)

##### Syntaxis
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Voorbeeld
Stel dat de data is:
```json
{
  "val2": 2,
  "val5": 5
}
```
De template is als volgt:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Resultaat
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Meerdere voorwaarden)

##### Syntaxis
Gebruik opeenvolgende voorwaarde-formatters om een structuur te bouwen die vergelijkbaar is met een switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Of bereik hetzelfde met de 'or'-operator:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Voorbeeld
Data:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Template:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Resultaat
```
val1 = A
val2 = B
val3 = C
```

#### 3. Voorwaarden met meerdere variabelen

##### Syntaxis
Gebruik de logische operatoren 'and'/'or' om meerdere variabelen te testen:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Voorbeeld
Data:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Resultaat
```
and = KO
or = OK
```

### Logische operatoren en formatters

In de volgende secties gebruiken de beschreven formatters de inline voorwaarde-syntaxis met het volgende formaat:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Syntaxis
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultaat
Als `d.car` gelijk is aan `'delorean'` én `d.speed` groter is dan 80, dan is de uitvoer `TravelInTime`; anders is de uitvoer `StayHere`.

#### 2. :or(value)

##### Syntaxis
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultaat
Als `d.car` gelijk is aan `'delorean'` óf `d.speed` groter is dan 80, dan is de uitvoer `TravelInTime`; anders is de uitvoer `StayHere`.

#### 3. :ifEM()

##### Syntaxis
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Resultaat
Voor `null` of een lege array is de uitvoer `Result true`; anders is het `Result false`.

#### 4. :ifNEM()

##### Syntaxis
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Resultaat
Voor niet-lege data (zoals het getal 0 of de string 'homer') is de uitvoer `Result true`; voor lege data is de uitvoer `Result false`.

#### 5. :ifEQ(value)

##### Syntaxis
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Resultaat
Als de data gelijk is aan de opgegeven waarde, is de uitvoer `Result true`; anders is het `Result false`.

#### 6. :ifNE(value)

##### Syntaxis
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result false` als uitvoer, terwijl het tweede voorbeeld `Result true` als uitvoer geeft.

#### 7. :ifGT(value)

##### Syntaxis
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result true` als uitvoer, en het tweede `Result false`.

#### 8. :ifGTE(value)

##### Syntaxis
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result true` als uitvoer, terwijl het tweede `Result false` als uitvoer geeft.

#### 9. :ifLT(value)

##### Syntaxis
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result true` als uitvoer, en het tweede `Result false`.

#### 10. :ifLTE(value)

##### Syntaxis
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result true` als uitvoer, en het tweede `Result false`.

#### 11. :ifIN(value)

##### Syntaxis
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Resultaat
Beide voorbeelden geven `Result true` als uitvoer (omdat de string 'is' bevat en de array 2 bevat).

#### 12. :ifNIN(value)

##### Syntaxis
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result false` als uitvoer (omdat de string 'is' bevat), en het tweede voorbeeld geeft `Result false` als uitvoer (omdat de array 2 bevat).

#### 13. :ifTE(type)

##### Syntaxis
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Voorbeeld
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Resultaat
Het eerste voorbeeld geeft `Result true` als uitvoer (aangezien 'homer' een string is), en het tweede `Result true` (aangezien 10.5 een getal is).

### Voorwaardelijke blokken

Voorwaardelijke blokken worden gebruikt om een gedeelte van het document te tonen of te verbergen, meestal om meerdere tags of een heel tekstblok te omvatten.

#### 1. :showBegin / :showEnd

##### Syntaxis
```
{data:ifEQ(condition):showBegin}
Inhoud van het documentblok
{data:showEnd}
```

##### Voorbeeld
Data:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Resultaat
Wanneer aan de voorwaarde is voldaan, wordt de tussenliggende inhoud weergegeven:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Syntaxis
```
{data:ifEQ(condition):hideBegin}
Inhoud van het documentblok
{data:hideEnd}
```

##### Voorbeeld
Data:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Resultaat
Wanneer aan de voorwaarde is voldaan, wordt de tussenliggende inhoud verborgen, wat resulteert in:
```
Banana
Grapes
```