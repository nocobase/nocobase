:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Valutaformatering

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntaxförklaring
Formaterar ett valutanummer och låter dig ange antalet decimaler eller ett specifikt utdataformat.
Parametrar:
- **precisionOrFormat:** En valfri parameter som antingen kan vara ett nummer (som anger antalet decimaler) eller en formatspecifikation:
  - Ett heltal: ändrar standardprecisionen för decimaler.
  - `'M'`: visar endast huvudvalutans namn.
  - `'L'`: visar numret tillsammans med valutasymbolen (standard).
  - `'LL'`: visar numret tillsammans med huvudvalutans namn.
- **targetCurrency:** Valfritt; målets valutakod (i versaler, t.ex. USD, EUR) som åsidosätter de globala inställningarna.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Visar "$2,000.91"
'1000.456':formatC('M')    // Visar "dollars"
'1':formatC('M')           // Visar "dollar"
'1000':formatC('L')        // Visar "$2,000.00"
'1000':formatC('LL')       // Visar "2,000.00 dollars"

// Franskt exempel (när miljöinställningarna skiljer sig åt):
'1000.456':formatC()      // Visar "2 000,91 ..."  
'1000.456':formatC()      // När käll- och målvalutorna är desamma, visas "1 000,46 €"
```

##### Resultat
Resultatet beror på API-alternativen och växelkursinställningarna.

#### 2. :convCurr(target, source)

##### Syntaxförklaring
Konverterar ett nummer från en valuta till en annan. Växelkursen kan skickas via API-alternativ eller ställas in globalt.
Om inga parametrar anges utförs konverteringen automatiskt från `options.currencySource` till `options.currencyTarget`.
Parametrar:
- **target:** Valfritt; målets valutakod (standard är `options.currencyTarget`).
- **source:** Valfritt; källans valutakod (standard är `options.currencySource`).

##### Exempel
```
// Exempelmiljö: API-alternativ { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Visar 20
1000:convCurr()            // Visar 2000
1000:convCurr('EUR')        // Visar 1000
1000:convCurr('USD')        // Visar 2000
1000:convCurr('USD', 'USD') // Visar 1000
```

##### Resultat
Resultatet är det konverterade valutavärdet.