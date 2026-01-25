:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování časových intervalů

#### 1. :formatI(patternOut, patternIn)

##### Vysvětlení syntaxe
Formátuje dobu trvání nebo interval. Podporované výstupní formáty zahrnují:
- `human+` nebo `human` (vhodné pro uživatelsky přívětivé zobrazení)
- Jednotky jako `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (nebo jejich zkratky).

Parametry:
- `patternOut`: Výstupní formát (například `'second'` nebo `'human+'`).
- `patternIn`: Volitelná vstupní jednotka (například `'milliseconds'` nebo `'s'`).

##### Příklad
```
// Příkladové prostředí: Možnosti API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Výstup: 2
2000:formatI('seconds')      // Výstup: 2
2000:formatI('s')            // Výstup: 2
3600000:formatI('minute')    // Výstup: 60
3600000:formatI('hour')      // Výstup: 1
2419200000:formatI('days')   // Výstup: 28

// Příklad ve francouzštině:
2000:formatI('human')        // Výstup: "quelques secondes"
2000:formatI('human+')       // Výstup: "dans quelques secondes"
-2000:formatI('human+')      // Výstup: "il y a quelques secondes"

// Příklad v angličtině:
2000:formatI('human')        // Výstup: "a few seconds"
2000:formatI('human+')       // Výstup: "in a few seconds"
-2000:formatI('human+')      // Výstup: "a few seconds ago"

// Příklad převodu jednotek:
60:formatI('ms', 'minute')   // Výstup: 3600000
4:formatI('ms', 'weeks')      // Výstup: 2419200000
'P1M':formatI('ms')          // Výstup: 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Výstup: 10296.085
```

##### Výsledek
Výsledek se zobrazí jako odpovídající doba trvání nebo interval na základě vstupní hodnoty a převodu jednotek.