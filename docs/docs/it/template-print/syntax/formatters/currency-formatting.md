:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione della Valuta

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Spiegazione della Sintassi
Formatta un numero di valuta e permette di specificare il numero di decimali o un formato di output particolare.
Parametri:
- `precisionOrFormat`: Parametro opzionale che può essere un numero (per specificare il numero di decimali) o un identificatore di formato:
  - Un numero intero: modifica la precisione decimale predefinita.
  - `'M'`: restituisce solo il nome principale della valuta.
  - `'L'`: restituisce il numero insieme al simbolo della valuta (predefinito).
  - `'LL'`: restituisce il numero insieme al nome principale della valuta.
- `targetCurrency`: Opzionale; il codice della valuta di destinazione (in maiuscolo, es. USD, EUR) che sovrascrive le impostazioni globali.

##### Esempio
```
// Ambiente di esempio: opzioni API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Restituisce "$2,000.91"
'1000.456':formatC('M')    // Restituisce "dollars"
'1':formatC('M')           // Restituisce "dollar"
'1000':formatC('L')        // Restituisce "$2,000.00"
'1000':formatC('LL')       // Restituisce "2,000.00 dollars"

// Esempio in francese (con impostazioni dell'ambiente diverse):
'1000.456':formatC()      // Restituisce "2 000,91 ..."  
'1000.456':formatC()      // Quando le valute di origine e di destinazione sono le stesse, restituisce "1 000,46 €"
```

##### Risultato
Il risultato dipende dalle opzioni API e dalle impostazioni del tasso di cambio.

#### 2. :convCurr(target, source)

##### Spiegazione della Sintassi
Converte un numero da una valuta all'altra. Il tasso di cambio può essere passato tramite le opzioni API o impostato globalmente.
Se non vengono specificati parametri, la conversione viene eseguita automaticamente da `options.currencySource` a `options.currencyTarget`.
Parametri:
- `target`: Opzionale; il codice della valuta di destinazione (il valore predefinito è `options.currencyTarget`).
- `source`: Opzionale; il codice della valuta di origine (il valore predefinito è `options.currencySource`).

##### Esempio
```
// Ambiente di esempio: opzioni API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Restituisce 20
1000:convCurr()            // Restituisce 2000
1000:convCurr('EUR')        // Restituisce 1000
1000:convCurr('USD')        // Restituisce 2000
1000:convCurr('USD', 'USD') // Restituisce 1000
```

##### Risultato
Il risultato è il valore della valuta convertita.