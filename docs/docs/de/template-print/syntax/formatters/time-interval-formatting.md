:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Zeitintervall-Formatierung

#### 1. :formatI(patternOut, patternIn)

##### Syntax-Erklärung
Diese Funktion formatiert eine Dauer oder ein Intervall. Folgende Ausgabeformate werden unterstützt:
- `human+` oder `human` (geeignet für eine benutzerfreundliche Anzeige)
- sowie Einheiten wie `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (oder deren Abkürzungen).

Parameter:
- **patternOut:** Das Ausgabeformat (z. B. `'second'` oder `'human+'`).
- **patternIn:** Optional, die Eingabeeinheit (z. B. `'milliseconds'` oder `'s'`).

##### Beispiele
```
// Beispielumgebung: API-Optionen { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Ergibt 2
2000:formatI('seconds')      // Ergibt 2
2000:formatI('s')            // Ergibt 2
3600000:formatI('minute')    // Ergibt 60
3600000:formatI('hour')      // Ergibt 1
2419200000:formatI('days')   // Ergibt 28

// Beispiel auf Französisch:
2000:formatI('human')        // Ergibt "quelques secondes"
2000:formatI('human+')       // Ergibt "dans quelques secondes"
-2000:formatI('human+')      // Ergibt "il y a quelques secondes"

// Beispiel auf Englisch:
2000:formatI('human')        // Ergibt "a few seconds"
2000:formatI('human+')       // Ergibt "in a few seconds"
-2000:formatI('human+')      // Ergibt "a few seconds ago"

// Beispiel für Einheitenumrechnung:
60:formatI('ms', 'minute')   // Ergibt 3600000
4:formatI('ms', 'weeks')      // Ergibt 2419200000
'P1M':formatI('ms')          // Ergibt 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Ergibt 10296.085
```

##### Ergebnis
Das Ergebnis wird basierend auf dem Eingabewert und der Einheitenumrechnung als entsprechende Dauer oder Intervall angezeigt.