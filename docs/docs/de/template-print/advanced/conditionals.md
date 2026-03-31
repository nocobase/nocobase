:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Bedingte Anweisungen

Bedingte Anweisungen ermöglichen es Ihnen, die Anzeige oder das Ausblenden von Inhalten in einem Dokument dynamisch basierend auf Datenwerten zu steuern. Dafür stehen Ihnen drei Hauptmethoden zur Verfügung:

- **Inline-Bedingungen**: Geben Sie Text direkt aus (oder ersetzen Sie ihn durch anderen Text).
- **Bedingungsblöcke**: Blenden Sie einen Abschnitt des Dokuments ein oder aus. Dies eignet sich für mehrere Tags, Absätze, Tabellen usw.
- **Intelligente Bedingungen**: Entfernen oder behalten Sie Zielelemente (wie Zeilen, Absätze, Bilder usw.) direkt mit einem einzigen Tag bei, um eine prägnantere Syntax zu erhalten.

Alle Bedingungen beginnen mit einem logischen Auswertungs-Formatierer (z. B. `ifEQ`, `ifGT` usw.), gefolgt von Aktions-Formatierern (wie `show`, `elseShow`, `drop`, `keep` usw.).

### Überblick

Die in bedingten Anweisungen unterstützten logischen Operatoren und Aktions-Formatierer umfassen:

- **Logische Operatoren**
  - **ifEQ(value)**: Prüft, ob die Daten dem angegebenen Wert entsprechen.
  - **ifNE(value)**: Prüft, ob die Daten nicht dem angegebenen Wert entsprechen.
  - **ifGT(value)**: Prüft, ob die Daten größer als der angegebene Wert sind.
  - **ifGTE(value)**: Prüft, ob die Daten größer oder gleich dem angegebenen Wert sind.
  - **ifLT(value)**: Prüft, ob die Daten kleiner als der angegebene Wert sind.
  - **ifLTE(value)**: Prüft, ob die Daten kleiner oder gleich dem angegebenen Wert sind.
  - **ifIN(value)**: Prüft, ob die Daten in einem Array oder String enthalten sind.
  - **ifNIN(value)**: Prüft, ob die Daten nicht in einem Array oder String enthalten sind.
  - **ifEM()**: Prüft, ob die Daten leer sind (z. B. `null`, `undefined`, ein leerer String, ein leeres Array oder ein leeres Objekt).
  - **ifNEM()**: Prüft, ob die Daten nicht leer sind.
  - **ifTE(type)**: Prüft, ob der Datentyp dem angegebenen Typ entspricht (z. B. „string“, „number“, „boolean“ usw.).
  - **and(value)**: Logisches „Und“, wird verwendet, um mehrere Bedingungen zu verknüpfen.
  - **or(value)**: Logisches „Oder“, wird verwendet, um mehrere Bedingungen zu verknüpfen.

- **Aktions-Formatierer**
  - **:show(text) / :elseShow(text)**: Wird in Inline-Bedingungen verwendet, um den angegebenen Text direkt auszugeben.
  - **:hideBegin / :hideEnd** und **:showBegin / :showEnd**: Werden in Bedingungsblöcken verwendet, um Dokumentabschnitte auszublenden oder anzuzeigen.
  - **:drop(element) / :keep(element)**: Werden in intelligenten Bedingungen verwendet, um angegebene Dokumentelemente zu entfernen oder beizubehalten.

In den folgenden Abschnitten werden die detaillierte Syntax, Beispiele und Ergebnisse für jede Verwendung vorgestellt.

### Inline-Bedingungen

#### 1. :show(text) / :elseShow(text)

##### Syntax
```
{Daten:Bedingung:show(Text)}
{Daten:Bedingung:show(Text):elseShow(Alternativtext)}
```

##### Beispiel
Angenommen, die Daten sind:
```json
{
  "val2": 2,
  "val5": 5
}
```
Die Vorlage ist wie folgt:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Ergebnis
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch-Case (Mehrfachbedingungen)

##### Syntax
Verwenden Sie aufeinanderfolgende Bedingungs-Formatierer, um eine Struktur ähnlich einem Switch-Case zu erstellen:
```
{Daten:ifEQ(Wert1):show(Ergebnis1):ifEQ(Wert2):show(Ergebnis2):elseShow(Standardergebnis)}
```
Oder erreichen Sie dasselbe mit dem `or`-Operator:
```
{Daten:ifEQ(Wert1):show(Ergebnis1):or(Daten):ifEQ(Wert2):show(Ergebnis2):elseShow(Standardergebnis)}
```

##### Beispiel
Daten:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Vorlage:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Ergebnis
```
val1 = A
val2 = B
val3 = C
```

#### 3. Mehrvariable Bedingungen

##### Syntax
Verwenden Sie die logischen Operatoren `and`/`or`, um mehrere Variablen zu testen:
```
{Daten1:ifEQ(Bedingung1):and(.Daten2):ifEQ(Bedingung2):show(Ergebnis):elseShow(Alternativergebnis)}
{Daten1:ifEQ(Bedingung1):or(.Daten2):ifEQ(Bedingung2):show(Ergebnis):elseShow(Alternativergebnis)}
```

##### Beispiel
Daten:
```json
{
  "val2": 2,
  "val5": 5
}
```
Vorlage:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Ergebnis
```
and = KO
or = OK
```

### Logische Operatoren und Formatierer

In den folgenden Abschnitten verwenden die beschriebenen Formatierer die Inline-Bedingungssyntax im folgenden Format:
```
{Daten:Formatierer(Parameter):show(Text):elseShow(Alternativtext)}
```

#### 1. :and(value)

##### Syntax
```
{Daten:ifEQ(Wert):and(neue Daten oder Bedingung):ifGT(anderer Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Ergebnis
Wenn `d.car` gleich `'delorean'` ist und `d.speed` größer als 80 ist, wird `TravelInTime` ausgegeben; andernfalls wird `StayHere` ausgegeben.

#### 2. :or(value)

##### Syntax
```
{Daten:ifEQ(Wert):or(neue Daten oder Bedingung):ifGT(anderer Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Ergebnis
Wenn `d.car` gleich `'delorean'` ist oder `d.speed` größer als 80 ist, wird `TravelInTime` ausgegeben; andernfalls wird `StayHere` ausgegeben.

#### 3. :ifEM()

##### Syntax
```
{Daten:ifEM():show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Ergebnis
Für `null` oder ein leeres Array ist die Ausgabe `Result true`; andernfalls ist sie `Result false`.

#### 4. :ifNEM()

##### Syntax
```
{Daten:ifNEM():show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Ergebnis
Für nicht leere Daten (wie die Zahl 0 oder den String „homer“) ist die Ausgabe `Result true`; für leere Daten ist die Ausgabe `Result false`.

#### 5. :ifEQ(value)

##### Syntax
```
{Daten:ifEQ(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Wenn die Daten dem angegebenen Wert entsprechen, ist die Ausgabe `Result true`; andernfalls ist sie `Result false`.

#### 6. :ifNE(value)

##### Syntax
```
{Daten:ifNE(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result false` aus, während das zweite Beispiel `Result true` ausgibt.

#### 7. :ifGT(value)

##### Syntax
```
{Daten:ifGT(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result true` aus, und das zweite gibt `Result false` aus.

#### 8. :ifGTE(value)

##### Syntax
```
{Daten:ifGTE(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result true` aus, während das zweite `Result false` ausgibt.

#### 9. :ifLT(value)

##### Syntax
```
{Daten:ifLT(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result true` aus, und das zweite gibt `Result false` aus.

#### 10. :ifLTE(value)

##### Syntax
```
{Daten:ifLTE(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result true` aus, und das zweite gibt `Result false` aus.

#### 11. :ifIN(value)

##### Syntax
```
{Daten:ifIN(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Beide Beispiele geben `Result true` aus (da der String „is“ enthält und das Array die Zahl 2).

#### 12. :ifNIN(value)

##### Syntax
```
{Daten:ifNIN(Wert):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result false` aus (da der String „is“ enthält), und das zweite Beispiel gibt `Result false` aus (da das Array die Zahl 2 enthält).

#### 13. :ifTE(type)

##### Syntax
```
{Daten:ifTE('Typ'):show(Text):elseShow(Alternativtext)}
```

##### Beispiel
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Ergebnis
Das erste Beispiel gibt `Result true` aus (da „homer“ ein String ist), und das zweite gibt `Result true` aus (da 10.5 eine Zahl ist).

### Bedingungsblöcke

Bedingungsblöcke werden verwendet, um einen Abschnitt des Dokuments anzuzeigen oder auszublenden. Sie werden häufig verwendet, um mehrere Tags oder einen gesamten Textblock zu umschließen.

#### 1. :showBegin / :showEnd

##### Syntax
```
{Daten:ifEQ(Bedingung):showBegin}
Inhalt des Dokumentblocks
{Daten:showEnd}
```

##### Beispiel
Daten:
```json
{
  "toBuy": true
}
```
Vorlage:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Ergebnis
Wenn die Bedingung erfüllt ist, wird der Inhalt dazwischen angezeigt:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Syntax
```
{Daten:ifEQ(Bedingung):hideBegin}
Inhalt des Dokumentblocks
{Daten:hideEnd}
```

##### Beispiel
Daten:
```json
{
  "toBuy": true
}
```
Vorlage:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Ergebnis
Wenn die Bedingung erfüllt ist, wird der Inhalt dazwischen ausgeblendet, was zu folgender Ausgabe führt:
```
Banana
Grapes
```