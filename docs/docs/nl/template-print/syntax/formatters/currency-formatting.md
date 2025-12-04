:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Valuta opmaak

#### 1. `:formatC(precisionOrFormat, targetCurrency)`

##### Syntaxis uitleg
Formatteert een valutawaarde en stelt u in staat het aantal decimalen of een specifieke uitvoerindeling op te geven.

Parameters:
- `precisionOrFormat`: Een optionele parameter die een getal kan zijn (voor het aantal decimalen) of een formaatspecifier:
  - Een geheel getal: wijzigt de standaard precisie van de decimalen.
  - `'M'`: geeft alleen de hoofdvalutanaam weer.
  - `'L'`: geeft het getal weer, samen met het valutasymbool (standaard).
  - `'LL'`: geeft het getal weer, samen met de hoofdvalutanaam.
- `targetCurrency`: Optioneel; de doelvalutacode (in hoofdletters, bijv. USD, EUR) die de globale instellingen overschrijft.

##### Voorbeeld
```
// Voorbeeldomgeving: API options { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Geeft "$2,000.91"
'1000.456':formatC('M')    // Geeft "dollars"
'1':formatC('M')           // Geeft "dollar"
'1000':formatC('L')        // Geeft "$2,000.00"
'1000':formatC('LL')       // Geeft "2,000.00 dollars"

// Frans voorbeeld (bij afwijkende omgevingsinstellingen):
'1000.456':formatC()      // Geeft "2 000,91 ..."  
'1000.456':formatC()      // Wanneer de bron- en doelvaluta hetzelfde zijn, geeft dit "1 000,46 €"
```

##### Resultaat
Het resultaat is afhankelijk van de API-opties en de wisselkoersinstellingen.

#### 2. `:convCurr(target, source)`

##### Syntaxis uitleg
Converteert een getal van de ene valuta naar de andere. De wisselkoers kunt u via API-opties doorgeven of globaal instellen.
Als u geen parameters opgeeft, wordt de conversie automatisch uitgevoerd van `options.currencySource` naar `options.currencyTarget`.

Parameters:
- `target`: Optioneel; de doelvalutacode (standaard is `options.currencyTarget`).
- `source`: Optioneel; de bronvalutacode (standaard is `options.currencySource`).

##### Voorbeeld
```
// Voorbeeldomgeving: API options { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Geeft 20
1000:convCurr()            // Geeft 2000
1000:convCurr('EUR')        // Geeft 1000
1000:convCurr('USD')        // Geeft 2000
1000:convCurr('USD', 'USD') // Geeft 1000
```

##### Resultaat
Het resultaat is de geconverteerde valutawaarde.