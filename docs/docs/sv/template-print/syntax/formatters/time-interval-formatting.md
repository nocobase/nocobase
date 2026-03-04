:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/template-print/syntax/formatters/time-interval-formatting).
:::

### Tidsintervallsformatering

#### 1. :formatI(patternOut, patternIn)

##### Syntaxförklaring
Formaterar varaktighet eller intervall, de utdataformat som stöds inkluderar:
- `human+`, `human` (lämpligt för användarvänlig visning)
- samt enheter som `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (eller deras förkortningar).

Parametrar:
- patternOut: utdataformat (till exempel `'second'`, `'human+'` etc.)
- patternIn: valfritt, indataenhet (till exempel `'milliseconds'`, `'s'` etc.)

##### Exempel
```
2000:formatI('second')       // Utdata 2
2000:formatI('seconds')      // Utdata 2
2000:formatI('s')            // Utdata 2
3600000:formatI('minute')    // Utdata 60
3600000:formatI('hour')      // Utdata 1
2419200000:formatI('days')   // Utdata 28

// Användarvänlig visning:
2000:formatI('human')        // Utdata "a few seconds"
2000:formatI('human+')       // Utdata "in a few seconds"
-2000:formatI('human+')      // Utdata "a few seconds ago"

// Exempel på enhetskonvertering:
60:formatI('ms', 'minute')   // Utdata 3600000
4:formatI('ms', 'weeks')      // Utdata 2419200000
'P1M':formatI('ms')          // Utdata 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Utdata 10296.085
```

##### Resultat
Utdata visas som motsvarande varaktighet eller intervall baserat på indatavärdet och enhetskonverteringen.