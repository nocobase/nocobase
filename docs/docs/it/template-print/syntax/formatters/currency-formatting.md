:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/template-print/syntax/formatters/currency-formatting).
:::

### Formattazione valuta

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Spiegazione della sintassi
Formatta i numeri di valuta, è possibile specificare il numero di cifre decimali o un formato di output specifico.  
Parametri:
- precisionOrFormat: Parametro opzionale, può essere sia un numero (specifica le cifre decimali), sia un identificatore di formato specifico:
  - Numero intero: cambia la precisione decimale predefinita
  - `'M'`: emette solo il nome della valuta principale
  - `'L'`: emette il numero con il simbolo della valuta (predefinito)
  - `'LL'`: emette il numero con il nome della valuta principale
- targetCurrency: Opzionale, codice della valuta di destinazione (maiuscolo, come USD, EUR), sovrascrive le impostazioni globali

##### Esempio
```
'1000.456':formatC()      // Output "$2,000.91"
'1000.456':formatC('M')    // Output "dollars"
'1':formatC('M')           // Output "dollar"
'1000':formatC('L')        // Output "$2,000.00"
'1000':formatC('LL')       // Output "2,000.00 dollars"
```

##### Risultato
L'output dipende dalle opzioni API e dalle impostazioni del tasso di cambio.


#### 2. :convCurr(target, source)

##### Spiegazione della sintassi
Converte un numero da una valuta all'altra. Il tasso di cambio può essere passato tramite le opzioni API o impostato globalmente.  
Se non vengono specificati parametri, la conversione avviene automaticamente da `options.currencySource` a `options.currencyTarget`.  
Parametri:
- target: Opzionale, codice della valuta di destinazione (predefinito uguale a `options.currencyTarget`)
- source: Opzionale, codice della valuta di origine (predefinito uguale a `options.currencySource`)

##### Esempio
```
10:convCurr()              // Output 20
1000:convCurr()            // Output 2000
1000:convCurr('EUR')        // Output 1000
1000:convCurr('USD')        // Output 2000
1000:convCurr('USD', 'USD') // Output 1000
```

##### Risultato
L'output è il valore della valuta convertita.