:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Tijdinterval formatteren

#### 1. :formatI(patternOut, patternIn)

##### Syntaxis uitleg
Formatteert een duur of interval. De ondersteunde uitvoerformaten zijn onder andere:
- `human+` of `human` (geschikt voor een mensvriendelijke weergave)
- Eenheden zoals `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (of hun afkortingen).

Parameters:
- **patternOut:** Het uitvoerformaat (bijvoorbeeld `'second'` of `'human+'`).
- **patternIn:** Optioneel, de invoereenheid (bijvoorbeeld `'milliseconds'` of `'s'`).

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Geeft 2 terug
2000:formatI('seconds')      // Geeft 2 terug
2000:formatI('s')            // Geeft 2 terug
3600000:formatI('minute')    // Geeft 60 terug
3600000:formatI('hour')      // Geeft 1 terug
2419200000:formatI('days')   // Geeft 28 terug

// Frans voorbeeld:
2000:formatI('human')        // Geeft "quelques secondes" terug
2000:formatI('human+')       // Geeft "dans quelques secondes" terug
-2000:formatI('human+')      // Geeft "il y a quelques secondes" terug

// Engels voorbeeld:
2000:formatI('human')        // Geeft "a few seconds" terug
2000:formatI('human+')       // Geeft "in a few seconds" terug
-2000:formatI('human+')      // Geeft "a few seconds ago" terug

// Voorbeeld van eenheidsconversie:
60:formatI('ms', 'minute')   // Geeft 3600000 terug
4:formatI('ms', 'weeks')      // Geeft 2419200000 terug
'P1M':formatI('ms')          // Geeft 2628000000 terug
'P1Y2M3DT4H5M6S':formatI('hour')  // Geeft 10296.085 terug
```

##### Resultaat
Het resultaat wordt weergegeven als de overeenkomstige duur of het interval, gebaseerd op de invoerwaarde en de eenheidsconversie.