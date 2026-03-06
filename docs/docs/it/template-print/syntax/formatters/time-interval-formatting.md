:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/template-print/syntax/formatters/time-interval-formatting).
:::

### Formattazione dell'intervallo di tempo

#### 1. :formatI(patternOut, patternIn)

##### Spiegazione della sintassi
Formatta la durata o l'intervallo, i formati di output supportati includono:
- `human+`, `human` (adatti per una visualizzazione leggibile)
- e unità come `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (o le loro abbreviazioni).

Parametri:
- patternOut: formato di output (ad esempio `'second'`, `'human+'`, ecc.)
- patternIn: opzionale, unità di input (ad esempio `'milliseconds'`, `'s'`, ecc.)

##### Esempio
```
2000:formatI('second')       // Output 2
2000:formatI('seconds')      // Output 2
2000:formatI('s')            // Output 2
3600000:formatI('minute')    // Output 60
3600000:formatI('hour')      // Output 1
2419200000:formatI('days')   // Output 28

// Visualizzazione leggibile:
2000:formatI('human')        // Output "a few seconds"
2000:formatI('human+')       // Output "in a few seconds"
-2000:formatI('human+')      // Output "a few seconds ago"

// Esempio di conversione delle unità:
60:formatI('ms', 'minute')   // Output 3600000
4:formatI('ms', 'weeks')      // Output 2419200000
'P1M':formatI('ms')          // Output 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Output 10296.085
```

##### Risultato
Il risultato dell'output viene visualizzato come la durata o l'intervallo corrispondente in base al valore di input e alla conversione dell'unità.