:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/template-print/syntax/formatters/number-formatting).
:::

### Zahlenformatierung

#### 1. :formatN(precision)

##### Syntaxbeschreibung
Formatieren Sie eine Zahl gemäß den Lokalisierungseinstellungen.  
Parameter:
- precision: Anzahl der Dezimalstellen  
  Für ODS/XLSX-Formate wird die Anzahl der angezeigten Dezimalstellen vom Texteditor bestimmt; andere Formate hängen von diesem Parameter ab.

##### Beispiel
```
'10':formatN()         // Ausgabe "10.000"
'1000.456':formatN()   // Ausgabe "1,000.456"
```

##### Ergebnis
Die Zahl wird entsprechend der angegebenen Präzision und dem Lokalisierungsformat ausgegeben.


#### 2. :round(precision)

##### Syntaxbeschreibung
Führen Sie eine Rundung der Zahl durch, wobei der Parameter die Anzahl der Dezimalstellen angibt.

##### Beispiel
```
10.05123:round(2)      // Ausgabe 10.05
1.05:round(1)          // Ausgabe 1.1
```

##### Ergebnis
Die Ausgabe ist der gerundete Wert.


#### 3. :add(value)

##### Syntaxbeschreibung
Addieren Sie die aktuelle Zahl mit dem angegebenen Wert.  
Parameter:
- value: Summand

##### Beispiel
```
1000.4:add(2)         // Ausgabe 1002.4
'1000.4':add('2')      // Ausgabe 1002.4
```

##### Ergebnis
Die Ausgabe ist der addierte Wert.


#### 4. :sub(value)

##### Syntaxbeschreibung
Subtrahieren Sie den angegebenen Wert von der aktuellen Zahl.  
Parameter:
- value: Subtrahend

##### Beispiel
```
1000.4:sub(2)         // Ausgabe 998.4
'1000.4':sub('2')      // Ausgabe 998.4
```

##### Ergebnis
Die Ausgabe ist der subtrahierte Wert.


#### 5. :mul(value)

##### Syntaxbeschreibung
Multiplizieren Sie die aktuelle Zahl mit dem angegebenen Wert.  
Parameter:
- value: Multiplikator

##### Beispiel
```
1000.4:mul(2)         // Ausgabe 2000.8
'1000.4':mul('2')      // Ausgabe 2000.8
```

##### Ergebnis
Die Ausgabe ist der multiplizierte Wert.


#### 6. :div(value)

##### Syntaxbeschreibung
Dividieren Sie die aktuelle Zahl durch den angegebenen Wert.  
Parameter:
- value: Divisor

##### Beispiel
```
1000.4:div(2)         // Ausgabe 500.2
'1000.4':div('2')      // Ausgabe 500.2
```

##### Ergebnis
Die Ausgabe ist der dividierte Wert.


#### 7. :mod(value)

##### Syntaxbeschreibung
Berechnen Sie den Modulo (Restwert) der aktuellen Zahl gegenüber dem angegebenen Wert.  
Parameter:
- value: Modul

##### Beispiel
```
4:mod(2)              // Ausgabe 0
3:mod(2)              // Ausgabe 1
```

##### Ergebnis
Die Ausgabe ist das Ergebnis der Modulo-Operation.


#### 8. :abs

##### Syntaxbeschreibung
Geben Sie den absoluten Wert der Zahl zurück.

##### Beispiel
```
-10:abs()             // Ausgabe 10
-10.54:abs()          // Ausgabe 10.54
10.54:abs()           // Ausgabe 10.54
'-200':abs()          // Ausgabe 200
```

##### Ergebnis
Die Ausgabe ist der absolute Wert.


#### 9. :ceil

##### Syntaxbeschreibung
Runden Sie auf, d. h. geben Sie die kleinste Ganzzahl zurück, die größer oder gleich der aktuellen Zahl ist.

##### Beispiel
```
10.05123:ceil()       // Ausgabe 11
1.05:ceil()           // Ausgabe 2
-1.05:ceil()          // Ausgabe -1
```

##### Ergebnis
Die Ausgabe ist die gerundete Ganzzahl.


#### 10. :floor

##### Syntaxbeschreibung
Runden Sie ab, d. h. geben Sie die größte Ganzzahl zurück, die kleiner oder gleich der aktuellen Zahl ist.

##### Beispiel
```
10.05123:floor()      // Ausgabe 10
1.05:floor()          // Ausgabe 1
-1.05:floor()         // Ausgabe -2
```

##### Ergebnis
Die Ausgabe ist die gerundete Ganzzahl.


#### 11. :int

##### Syntaxbeschreibung
Konvertieren Sie die Zahl in eine Ganzzahl (nicht zur Verwendung empfohlen).

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.


#### 12. :toEN

##### Syntaxbeschreibung
Konvertieren Sie die Zahl in das englische Format (Dezimalpunkt ist '.'), nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.


#### 13. :toFixed

##### Syntaxbeschreibung
Konvertieren Sie die Zahl in eine Zeichenfolge und behalten Sie nur die angegebene Anzahl an Dezimalstellen bei, nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.


#### 14. :toFR

##### Syntaxbeschreibung
Konvertieren Sie die Zahl in das französische Format (Dezimalpunkt ist ','), nicht zur Verwendung empfohlen.

##### Beispiel und Ergebnis
Abhängig vom spezifischen Konvertierungsfall.