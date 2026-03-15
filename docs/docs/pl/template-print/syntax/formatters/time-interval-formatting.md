:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/template-print/syntax/formatters/time-interval-formatting).
:::

### Formatowanie interwałów czasowych

#### 1. :formatI(patternOut, patternIn)

##### Wyjaśnienie składni
Formatuje czas trwania lub interwał, obsługiwane formaty wyjściowe obejmują:
- `human+`, `human` (odpowiednie dla czytelnego wyświetlania)
- oraz jednostki takie jak `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (lub ich skróty).

Parametry:
- patternOut: format wyjściowy (na przykład `'second'`, `'human+'` itp.)
- patternIn: opcjonalnie, jednostka wejściowa (na przykład `'milliseconds'`, `'s'` itp.)

##### Przykład
```
2000:formatI('second')       // Wyjście 2
2000:formatI('seconds')      // Wyjście 2
2000:formatI('s')            // Wyjście 2
3600000:formatI('minute')    // Wyjście 60
3600000:formatI('hour')      // Wyjście 1
2419200000:formatI('days')   // Wyjście 28

// Czytelne wyświetlanie:
2000:formatI('human')        // Wyjście "a few seconds"
2000:formatI('human+')       // Wyjście "in a few seconds"
-2000:formatI('human+')      // Wyjście "a few seconds ago"

// Przykład konwersji jednostek:
60:formatI('ms', 'minute')   // Wyjście 3600000
4:formatI('ms', 'weeks')      // Wyjście 2419200000
'P1M':formatI('ms')          // Wyjście 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Wyjście 10296.085
```

##### Wynik
Wynik wyjściowy jest wyświetlany jako odpowiedni czas trwania lub interwał w zależności od wartości wejściowej i konwersji jednostek.