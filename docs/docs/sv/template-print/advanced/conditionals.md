:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Villkorssatser

Villkorssatser låter dig dynamiskt styra visningen eller döljandet av innehåll i dokumentet baserat på datavärden. Det finns tre huvudsakliga sätt att skriva villkor:

-   **Inbäddade villkor**: Skriver direkt ut text (eller ersätter den med annan text).
-   **Villkorsblock**: Visar eller döljer en del av dokumentet, lämpligt för flera taggar, stycken, tabeller med mera.
-   **Smarta villkor**: Tar direkt bort eller behåller målobjekt (som rader, stycken, bilder med mera) med en enda tagg, för en mer koncis syntax.

Alla villkor börjar med en logisk utvärderingsformaterare (t.ex. `ifEQ`, `ifGT` med mera), följt av åtgärdsformaterare (som `show`, `elseShow`, `drop`, `keep` med mera).

### Översikt

De logiska operatorerna och åtgärdsformaterarna som stöds i villkorssatser inkluderar:

-   **Logiska operatorer**
    -   **ifEQ(value)**: Kontrollerar om datat är lika med det angivna värdet.
    -   **ifNE(value)**: Kontrollerar om datat inte är lika med det angivna värdet.
    -   **ifGT(value)**: Kontrollerar om datat är större än det angivna värdet.
    -   **ifGTE(value)**: Kontrollerar om datat är större än eller lika med det angivna värdet.
    -   **ifLT(value)**: Kontrollerar om datat är mindre än det angivna värdet.
    -   **ifLTE(value)**: Kontrollerar om datat är mindre än eller lika med det angivna värdet.
    -   **ifIN(value)**: Kontrollerar om datat finns i en array eller sträng.
    -   **ifNIN(value)**: Kontrollerar om datat inte finns i en array eller sträng.
    -   **ifEM()**: Kontrollerar om datat är tomt (t.ex. `null`, `undefined`, en tom sträng, en tom array eller ett tomt objekt).
    -   **ifNEM()**: Kontrollerar om datat inte är tomt.
    -   **ifTE(type)**: Kontrollerar om datatypen är lika med den angivna typen (till exempel "string", "number", "boolean" med mera).
    -   **and(value)**: Logiskt "och", används för att koppla ihop flera villkor.
    -   **or(value)**: Logiskt "eller", används för att koppla ihop flera villkor.

-   **Åtgärdsformaterare**
    -   **:show(text) / :elseShow(text)**: Används i inbäddade villkor för att direkt skriva ut den angivna texten.
    -   **:hideBegin / :hideEnd** och **:showBegin / :showEnd**: Används i villkorsblock för att dölja eller visa delar av dokumentet.
    -   **:drop(element) / :keep(element)**: Används i smarta villkor för att ta bort eller behålla angivna dokumentelement.

I följande avsnitt går vi igenom detaljerad syntax, exempel och resultat för varje användning.

### Inbäddade villkor

#### 1. :show(text) / :elseShow(text)

##### Syntax
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Exempel
Anta att datat är:
```json
{
  "val2": 2,
  "val5": 5
}
```
Mallen ser ut så här:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Resultat
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Flera villkorssatser)

##### Syntax
Använd på varandra följande villkorsformaterare för att bygga en struktur som liknar en switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Eller uppnå samma sak med `or`-operatorn:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Exempel
Data:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Mall:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Resultat
```
val1 = A
val2 = B
val3 = C
```

#### 3. Villkorssatser med flera variabler

##### Syntax
Använd de logiska operatorerna `and`/`or` för att testa flera variabler:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Exempel
Data:
```json
{
  "val2": 2,
  "val5": 5
}
```
Mall:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Resultat
```
and = KO
or = OK
```

### Logiska operatorer och formaterare

I följande avsnitt använder de beskrivna formaterarna syntaxen för inbäddade villkor, med följande format:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Syntax
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Exempel
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultat
Om `d.car` är lika med `'delorean'` och `d.speed` är större än 80, blir utdata `TravelInTime`; annars blir utdata `StayHere`.

#### 2. :or(value)

##### Syntax
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Exempel
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultat
Om `d.car` är lika med `'delorean'` eller `d.speed` är större än 80, blir utdata `TravelInTime`; annars blir utdata `StayHere`.

#### 3. :ifEM()

##### Syntax
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Exempel
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Resultat
För `null` eller en tom array blir utdata `Result true`; annars blir det `Result false`.

#### 4. :ifNEM()

##### Syntax
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Exempel
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Resultat
För icke-tom data (som siffran 0 eller strängen 'homer') blir utdata `Result true`; för tom data blir utdata `Result false`.

#### 5. :ifEQ(value)

##### Syntax
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Resultat
Om datat är lika med det angivna värdet blir utdata `Result true`; annars blir det `Result false`.

#### 6. :ifNE(value)

##### Syntax
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result false`, medan det andra exemplet ger `Result true`.

#### 7. :ifGT(value)

##### Syntax
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result true`, och det andra ger `Result false`.

#### 8. :ifGTE(value)

##### Syntax
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result true`, medan det andra ger `Result false`.

#### 9. :ifLT(value)

##### Syntax
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result true`, och det andra ger `Result false`.

#### 10. :ifLTE(value)

##### Syntax
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result true`, och det andra ger `Result false`.

#### 11. :ifIN(value)

##### Syntax
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Resultat
Båda exemplen ger `Result true` (eftersom strängen innehåller 'is' och arrayen innehåller 2).

#### 12. :ifNIN(value)

##### Syntax
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Exempel
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result false` (eftersom strängen innehåller 'is'), och det andra exemplet ger `Result false` (eftersom arrayen innehåller 2).

#### 13. :ifTE(type)

##### Syntax
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Exempel
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Resultat
Det första exemplet ger `Result true` (eftersom 'homer' är en sträng), och det andra ger `Result true` (eftersom 10.5 är ett nummer).

### Villkorsblock

Villkorsblock används för att visa eller dölja en del av dokumentet, vanligtvis för att omsluta flera taggar eller ett helt textblock.

#### 1. :showBegin / :showEnd

##### Syntax
```
{data:ifEQ(condition):showBegin}
Dokumentblockets innehåll
{data:showEnd}
```

##### Exempel
Data:
```json
{
  "toBuy": true
}
```
Mall:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Resultat
När villkoret är uppfyllt visas innehållet däremellan:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Syntax
```
{data:ifEQ(condition):hideBegin}
Dokumentblockets innehåll
{data:hideEnd}
```

##### Exempel
Data:
```json
{
  "toBuy": true
}
```
Mall:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Resultat
När villkoret är uppfyllt döljs innehållet däremellan, vilket resulterar i:
```
Banana
Grapes
```