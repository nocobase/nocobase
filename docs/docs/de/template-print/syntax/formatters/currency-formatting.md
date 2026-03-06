:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/template-print/syntax/formatters/currency-formatting).
:::

### Währungsformatierung

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntax-Erklärung
Formatiert Währungszahlen, wobei Nachkommastellen oder ein bestimmtes Ausgabeformat angegeben werden können.  
Parameter:
- precisionOrFormat: Optionaler Parameter, der entweder eine Zahl (Angabe der Nachkommastellen) oder eine bestimmte Formatkennung sein kann:
  - Ganzzahl: Ändert die Standard-Nachkommapräzision
  - `'M'`: Gibt nur den Hauptwährungsnamen aus
  - `'L'`: Gibt die Zahl zusammen mit dem Währungssymbol aus (Standard)
  - `'LL'`: Gibt die Zahl zusammen mit dem Hauptwährungsnamen aus
- targetCurrency: Optional, Zielwährungscode (Großbuchstaben, wie USD, EUR), überschreibt die globalen Einstellungen

##### Beispiel
```
'1000.456':formatC()      // Ausgabe "$2,000.91"
'1000.456':formatC('M')    // Ausgabe "dollars"
'1':formatC('M')           // Ausgabe "dollar"
'1000':formatC('L')        // Ausgabe "$2,000.00"
'1000':formatC('LL')       // Ausgabe "2,000.00 dollars"
```

##### Ergebnis
Das Ausgabeergebnis hängt von den API-Optionen und den Wechselkurseinstellungen ab.


#### 2. :convCurr(target, source)

##### Syntax-Erklärung
Konvertiert Zahlen von einer Währung in eine andere. Wechselkurse können über API-Optionen übergeben oder global festgelegt werden.  
Wenn keine Parameter angegeben werden, erfolgt die Konvertierung automatisch von `options.currencySource` zu `options.currencyTarget`.  
Parameter:
- target: Optional, Zielwährungscode (Standardmäßig `options.currencyTarget`)
- source: Optional, Quellwährungscode (Standardmäßig `options.currencySource`)

##### Beispiel
```
10:convCurr()              // Ausgabe 20
1000:convCurr()            // Ausgabe 2000
1000:convCurr('EUR')        // Ausgabe 1000
1000:convCurr('USD')        // Ausgabe 2000
1000:convCurr('USD', 'USD') // Ausgabe 1000
```

##### Ergebnis
Die Ausgabe ist der konvertierte Währungswert.