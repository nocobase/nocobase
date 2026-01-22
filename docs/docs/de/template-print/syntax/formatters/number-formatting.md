:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Zahlenformatierung

#### 1. :formatN(precision)

##### Syntaxbeschreibung
Formatiert eine Zahl gemäß den Lokalisierungseinstellungen.
Parameter:
- `precision`: Die Anzahl der Dezimalstellen.
  Bei ODS-/XLSX-Formaten wird die Anzahl der angezeigten Dezimalstellen vom Texteditor bestimmt; bei anderen Formaten ist dieser Parameter maßgeblich.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "en-us" }
'10':formatN()         // Ausgabe "10.000"
'1000.456':formatN()   // Ausgabe "1,000.456"
```

##### Ergebnis
Die Zahl wird entsprechend der angegebenen Präzision und dem Lokalisierungsformat ausgegeben.

#### 2. :round(precision)

##### Syntaxbeschreibung
Rundet die Zahl auf die angegebene Anzahl von Dezimalstellen.

##### Beispiel
```
10.05123:round(2)      // Ausgabe 10.05
1.05:round(1)          // Ausgabe 1.1
```

##### Ergebnis
Das Ergebnis ist die auf die angegebene Präzision gerundete Zahl.

#### 3. :add(value)

##### Syntaxbeschreibung
Addiert den angegebenen Wert zur aktuellen Zahl.
Parameter:
- `value`: Der hinzuzufügende Wert.

##### Beispiel
```
1000.4:add(2)         // Ausgabe 1002.4
'1000.4':add('2')      // Ausgabe 1002.4
```

##### Ergebnis
Das Ergebnis ist die Summe der aktuellen Zahl und des angegebenen Wertes.

#### 4. :sub(value)

##### Syntaxbeschreibung
Subtrahiert den angegebenen Wert von der aktuellen Zahl.
Parameter:
- `value`: Der zu subtrahierende Wert.

##### Beispiel
```
1000.4:sub(2)         // Ausgabe 998.4
'1000.4':sub('2')      // Ausgabe 998.4
```

##### Ergebnis
Das Ergebnis ist die aktuelle Zahl minus dem angegebenen Wert.

#### 5. :mul(value)

##### Syntaxbeschreibung
Multipliziert die aktuelle Zahl mit dem angegebenen Wert.
Parameter:
- `value`: Der Multiplikator.

##### Beispiel
```
1000.4:mul(2)         // Ausgabe 2000.8
'1000.4':mul('2')      // Ausgabe 2000.8
```

##### Ergebnis
Das Ergebnis ist das Produkt der aktuellen Zahl und des angegebenen Wertes.

#### 6. :div(value)

##### Syntaxbeschreibung
Dividiert die aktuelle Zahl durch den angegebenen Wert.
Parameter:
- `value`: Der Divisor.

##### Beispiel
```
1000.4:div(2)         // Ausgabe 500.2
'1000.4':div('2')      // Ausgabe 500.2
```

##### Ergebnis
Das Ergebnis ist der Quotient der Division.

#### 7. :mod(value)

##### Syntaxbeschreibung
Berechnet den Modulo (Rest) der aktuellen Zahl geteilt durch den angegebenen Wert.
Parameter:
- `value`: Der Modulo-Divisor.

##### Beispiel
```
4:mod(2)              // Ausgabe 0
3:mod(2)              // Ausgabe 1
```

##### Ergebnis
Das Ergebnis ist der Rest der Modulo-Operation.

#### 8. :abs

##### Syntaxbeschreibung
Gibt den absoluten Wert der Zahl zurück.

##### Beispiel
```
-10:abs()             // Ausgabe 10
-10.54:abs()          // Ausgabe 10.54
10.54:abs()           // Ausgabe 10.54
'-200':abs()          // Ausgabe 200
```

##### Ergebnis
Das Ergebnis ist der absolute Wert der Eingabezahl.

#### 9. :ceil

##### Syntaxbeschreibung
Rundet die Zahl auf die nächste ganze Zahl auf, d.h. es wird die kleinste ganze Zahl zurückgegeben, die größer oder gleich der aktuellen Zahl ist.

##### Beispiel
```
10.05123:ceil()       // Ausgabe 11
1.05:ceil()           // Ausgabe 2
-1.05:ceil()          // Ausgabe -1
```

##### Ergebnis
Das Ergebnis ist die aufgerundete ganze Zahl.

#### 10. :floor

##### Syntaxbeschreibung
Rundet die Zahl auf die nächste ganze Zahl ab, d.h. es wird die größte ganze Zahl zurückgegeben, die kleiner oder gleich der aktuellen Zahl ist.

##### Beispiel
```
10.05123:floor()      // Ausgabe 10
1.05:floor()          // Ausgabe 1
-1.05:floor()         // Ausgabe -2
```

##### Ergebnis
Das Ergebnis ist die abgerundete ganze Zahl.

#### 11. :int

##### Syntaxbeschreibung
Konvertiert die Zahl in eine ganze Zahl (nicht zur Verwendung empfohlen).

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.

#### 12. :toEN

##### Syntaxbeschreibung
Konvertiert die Zahl in das englische Format (mit `.` als Dezimaltrennzeichen). Nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.

#### 13. :toFixed

##### Syntaxbeschreibung
Konvertiert die Zahl in einen String, wobei nur die angegebene Anzahl von Dezimalstellen beibehalten wird. Nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.

#### 14. :toFR

##### Syntaxbeschreibung
Konvertiert die Zahl in das französische Format (mit `,` als Dezimaltrennzeichen). Nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.