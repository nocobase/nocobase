:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Intervallformatering

#### 1. :formatI(patternOut, patternIn)

##### Syntaxbeskrivning
Formaterar en varaktighet eller ett intervall. Följande utdataformat stöds:
- `human+` eller `human` (lämpliga för användarvänlig visning)
- Enheter som `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (eller deras förkortningar).

Parametrar:
- **patternOut:** Utdataformatet (till exempel `'second'` eller `'human+'`).
- **patternIn:** Valfri, indataenheten (till exempel `'milliseconds'` eller `'s'`).

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// Franskt exempel:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// Engelskt exempel:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// Exempel på enhetskonvertering:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### Resultat
Resultatet visas som den motsvarande varaktigheten eller intervallet, baserat på indatavärdet och enhetskonverteringen.