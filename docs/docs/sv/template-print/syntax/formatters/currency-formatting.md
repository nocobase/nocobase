:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/template-print/syntax/formatters/currency-formatting).
:::

### Valutaformatering

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Syntaxförklaring
Formaterar ett valutanummer, Ni kan ange antal decimaler eller ett specifikt utdataformat.  
Parametrar:
- precisionOrFormat: Valfri parameter, kan antingen vara ett nummer (anger antal decimaler) eller en specifik formatidentifierare:
  - Heltal: ändrar standardprecision för decimaler
  - `'M'`: matar endast ut huvudvalutans namn
  - `'L'`: matar ut numret tillsammans med valutasymbolen (standard)
  - `'LL'`: matar ut numret tillsammans med huvudvalutans namn
- targetCurrency: Valfritt, målets valutakod (stora bokstäver, t.ex. USD, EUR), åsidosätter globala inställningar

##### Exempel
```
'1000.456':formatC()      // Utdata "$2,000.91"
'1000.456':formatC('M')    // Utdata "dollars"
'1':formatC('M')           // Utdata "dollar"
'1000':formatC('L')        // Utdata "$2,000.00"
'1000':formatC('LL')       // Utdata "2,000.00 dollars"
```

##### Resultat
Utdata beror på API-alternativ och växelkursinställningar.


#### 2. :convCurr(target, source)

##### Syntaxförklaring
Konverterar ett nummer från en valuta till en annan. Växelkursen kan skickas via API-alternativ eller ställas in globalt.  
Om inga parametrar anges, sker konverteringen automatiskt från `options.currencySource` till `options.currencyTarget`.  
Parametrar:
- target: Valfritt, målets valutakod (standard är `options.currencyTarget`)
- source: Valfritt, källans valutakod (standard är `options.currencySource`)

##### Exempel
```
10:convCurr()              // Utdata 20
1000:convCurr()            // Utdata 2000
1000:convCurr('EUR')        // Utdata 1000
1000:convCurr('USD')        // Utdata 2000
1000:convCurr('USD', 'USD') // Utdata 1000
```

##### Resultat
Utdata är det konverterade valutavärdet.