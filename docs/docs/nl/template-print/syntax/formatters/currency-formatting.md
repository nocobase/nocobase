:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/template-print/syntax/formatters/currency-formatting) voor nauwkeurige informatie.
:::

### Valutaformattering

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntaxisverklaring
Formatteert valutacijfers, u kunt het aantal decimalen of een specifieke uitvoerindeling opgeven.  
Parameters:
- precisionOrFormat: Optionele parameter, dit kan een getal zijn (om het aantal decimalen op te geven) of een specifieke formaat-identificatie:
  - Geheel getal: wijzigt de standaard decimale precisie
  - `'M'`: voert alleen de naam van de hoofdvaluta uit
  - `'L'`: voert het getal uit met het valutasymbool (standaard)
  - `'LL'`: voert het getal uit met de naam van de hoofdvaluta
- targetCurrency: Optioneel, de doelvalutacode (in hoofdletters, bijv. USD, EUR), overschrijft de globale instellingen

##### Voorbeeld
```
'1000.456':formatC()      // Uitvoer "$2,000.91"
'1000.456':formatC('M')    // Uitvoer "dollars"
'1':formatC('M')           // Uitvoer "dollar"
'1000':formatC('L')        // Uitvoer "$2,000.00"
'1000':formatC('LL')       // Uitvoer "2,000.00 dollars"
```

##### Resultaat
Het uitvoerresultaat is gebaseerd op de API-opties en wisselkoersinstellingen.


#### 2. :convCurr(target, source)

##### Syntaxisverklaring
Converteert een getal van de ene valuta naar de andere. De wisselkoers kan worden doorgegeven via API-opties of globaal worden ingesteld.  
Als u geen parameters opgeeft, wordt er automatisch geconverteerd van `options.currencySource` naar `options.currencyTarget`.  
Parameters:
- target: Optioneel, de doelvalutacode (standaard gelijk aan `options.currencyTarget`)
- source: Optioneel, de bronvalutacode (standaard gelijk aan `options.currencySource`)

##### Voorbeeld
```
10:convCurr()              // Uitvoer 20
1000:convCurr()            // Uitvoer 2000
1000:convCurr('EUR')        // Uitvoer 1000
1000:convCurr('USD')        // Uitvoer 2000
1000:convCurr('USD', 'USD') // Uitvoer 1000
```

##### Resultaat
De uitvoer is de geconverteerde valutawaarde.