:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie Interwałów Czasowych

#### 1. :formatI(patternOut, patternIn)

##### Opis Składni
Formatuje czas trwania lub interwał. Obsługiwane formaty wyjściowe to:
- `human+` lub `human` (odpowiednie do wyświetlania w sposób przyjazny dla użytkownika)
- Jednostki takie jak `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (lub ich skróty).

Parametry:
- **patternOut:** Format wyjściowy (na przykład `'second'` lub `'human+'`).
- **patternIn:** Opcjonalnie, jednostka wejściowa (na przykład `'milliseconds'` lub `'s'`).

##### Przykład
```
// Przykładowe środowisko: opcje API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Wynik 2
2000:formatI('seconds')      // Wynik 2
2000:formatI('s')            // Wynik 2
3600000:formatI('minute')    // Wynik 60
3600000:formatI('hour')      // Wynik 1
2419200000:formatI('days')   // Wynik 28

// Przykład w języku francuskim:
2000:formatI('human')        // Wynik "quelques secondes"
2000:formatI('human+')       // Wynik "dans quelques secondes"
-2000:formatI('human+')      // Wynik "il y a quelques secondes"

// Przykład w języku angielskim:
2000:formatI('human')        // Wynik "a few seconds"
2000:formatI('human+')       // Wynik "in a few seconds"
-2000:formatI('human+')      // Wynik "a few seconds ago"

// Przykład konwersji jednostek:
60:formatI('ms', 'minute')   // Wynik 3600000
4:formatI('ms', 'weeks')      // Wynik 2419200000
'P1M':formatI('ms')          // Wynik 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Wynik 10296.085
```

##### Wynik
Wynik jest wyświetlany jako odpowiedni czas trwania lub interwał, w zależności od wartości wejściowej i konwersji jednostek.