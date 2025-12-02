:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione degli Intervalli

#### 1. :formatI(patternOut, patternIn)

##### Spiegazione della Sintassi
Permette di formattare una durata o un intervallo. I formati di output supportati includono:
- `human+` o `human` (ideali per una visualizzazione più leggibile e "umana")
- Unità come `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (o le loro abbreviazioni).

Parametri:
- **patternOut:** Il formato di output (ad esempio, `'second'` o `'human+'`).
- **patternIn:** Opzionale, l'unità di input (ad esempio, `'milliseconds'` o `'s'`).

##### Esempio
```
// Ambiente di esempio: opzioni API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// Esempio in francese:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// Esempio in inglese:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// Esempio di conversione unità:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### Risultato
Il risultato dell'output viene visualizzato come la durata o l'intervallo corrispondente, basandosi sul valore di input e sulla conversione dell'unità.