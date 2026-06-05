:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Währungsformatierung

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntax-Erklärung
Formatiert eine Währungszahl. Sie können dabei die Anzahl der Dezimalstellen oder ein bestimmtes Ausgabeformat festlegen.
Parameter:
- `precisionOrFormat`: Ein optionaler Parameter, der entweder eine Zahl (zur Angabe der Dezimalstellen) oder ein Formatbezeichner sein kann:
  - Eine ganze Zahl: Ändert die Standard-Dezimalpräzision.
  - `'M'`: Gibt nur den Hauptwährungsnamen aus.
  - `'L'`: Gibt die Zahl zusammen mit dem Währungssymbol aus (Standard).
  - `'LL'`: Gibt die Zahl zusammen mit dem Hauptwährungsnamen aus.
- `targetCurrency`: Optional; der Zielwährungscode (in Großbuchstaben, z.B. USD, EUR), der die globalen Einstellungen überschreibt.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Ergibt "$2,000.91"
'1000.456':formatC('M')    // Ergibt "dollars"
'1':formatC('M')           // Ergibt "dollar"
'1000':formatC('L')        // Ergibt "$2,000.00"
'1000':formatC('LL')       // Ergibt "2,000.00 dollars"

// Französisches Beispiel (bei abweichenden Umgebungseinstellungen):
'1000.456':formatC()      // Ergibt "2 000,91 ..."  
'1000.456':formatC()      // Wenn Quell- und Zielwährung identisch sind, ergibt "1 000,46 €"
```

##### Ergebnis
Das Ergebnis hängt von den API-Optionen und den Wechselkurseinstellungen ab.

#### 2. :convCurr(target, source)

##### Syntax-Erklärung
Konvertiert eine Zahl von einer Währung in eine andere. Der Wechselkurs kann über API-Optionen übergeben oder global festgelegt werden.
Wenn keine Parameter angegeben werden, erfolgt die Konvertierung automatisch von `options.currencySource` zu `options.currencyTarget`.
Parameter:
- `target`: Optional; der Zielwährungscode (standardmäßig `options.currencyTarget`).
- `source`: Optional; der Quellwährungscode (standardmäßig `options.currencySource`).

##### Beispiel
```
// Beispielumgebung: API-Optionen { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Ergibt 20
1000:convCurr()            // Ergibt 2000
1000:convCurr('EUR')        // Ergibt 1000
1000:convCurr('USD')        // Ergibt 2000
1000:convCurr('USD', 'USD') // Ergibt 1000
```

##### Ergebnis
Das Ergebnis ist der konvertierte Währungswert.