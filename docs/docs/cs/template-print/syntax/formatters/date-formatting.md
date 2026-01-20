:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování data

#### 1. :formatD(patternOut, patternIn)

##### Vysvětlení syntaxe
Formátuje datum. Přijímá výstupní formát `patternOut` a volitelný vstupní formát `patternIn` (výchozí je ISO 8601). Časové pásmo a jazyk lze upravit pomocí `options.timezone` a `options.lang`.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Výstup 01/31/2016
'20160131':formatD(LL)     // Výstup January 31, 2016
'20160131':formatD(LLLL)   // Výstup Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Výstup Sunday

// Příklad ve francouzštině:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Výstup mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Výstup dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Výstup dimanche 14 septembre 2014 19:27
```

##### Výsledek
Výstupem je datum naformátované podle specifikace.


#### 2. :addD(amount, unit, patternIn)

##### Vysvětlení syntaxe
Přidá k datu specifikované množství času. Podporované jednotky zahrnují: day, week, month, quarter, year, hour, minute, second, millisecond.
Parametry:
- **amount:** Množství k přidání.
- **unit:** Časová jednotka (nerozlišuje velká a malá písmena).
- **patternIn:** Volitelný vstupní formát (výchozí je ISO8601).

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Výstup "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Výstup "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Výstup "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Výstup "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Výstup "2016-04-30T00:00:00.000Z"
```

##### Výsledek
Výstupem je nové datum po přidání specifikovaného času.


#### 3. :subD(amount, unit, patternIn)

##### Vysvětlení syntaxe
Odečte od data specifikované množství času. Parametry jsou stejné jako u `addD`.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Výstup "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Výstup "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Výstup "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Výstup "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Výstup "2015-10-31T00:00:00.000Z"
```

##### Výsledek
Výstupem je nové datum po odečtení specifikovaného času.


#### 4. :startOfD(unit, patternIn)

##### Vysvětlení syntaxe
Nastaví datum na začátek specifikované časové jednotky.
Parametry:
- **unit:** Časová jednotka.
- **patternIn:** Volitelný vstupní formát.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Výstup "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Výstup "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Výstup "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Výstup "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Výstup "2016-01-01T00:00:00.000Z"
```

##### Výsledek
Výstupem je datum nastavené na začátek specifikované jednotky.


#### 5. :endOfD(unit, patternIn)

##### Vysvětlení syntaxe
Nastaví datum na konec specifikované časové jednotky. Parametry jsou stejné jako u `startOfD`.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Výstup "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Výstup "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Výstup "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Výstup "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Výstup "2016-01-31T23:59:59.999Z"
```

##### Výsledek
Výstupem je datum nastavené na konec specifikované jednotky.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Vysvětlení syntaxe
Vypočítá rozdíl mezi dvěma daty a vrátí jej ve specifikované jednotce. Podporované jednotky zahrnují:
- `day(s)` nebo `d`
- `week(s)` nebo `w`
- `quarter(s)` nebo `Q`
- `month(s)` nebo `M`
- `year(s)` nebo `y`
- `hour(s)` nebo `h`
- `minute(s)` nebo `m`
- `second(s)` nebo `s`
- `millisecond(s)` nebo `ms` (výchozí jednotka)

Parametry:
- **toDate:** Cílové datum.
- **unit:** Výstupní jednotka.
- **patternFromDate:** Volitelný formát počátečního data.
- **patternToDate:** Volitelný formát cílového data.

##### Příklad
```
'20101001':diffD('20101201')              // Výstup 5270400000
'20101001':diffD('20101201', 'second')      // Výstup 5270400
'20101001':diffD('20101201', 's')           // Výstup 5270400
'20101001':diffD('20101201', 'm')           // Výstup 87840
'20101001':diffD('20101201', 'h')           // Výstup 1464
'20101001':diffD('20101201', 'weeks')       // Výstup 8
'20101001':diffD('20101201', 'days')        // Výstup 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Výstup 5270400000
```

##### Výsledek
Výstupem je časový rozdíl mezi dvěma daty, převedený na specifikovanou jednotku.


#### 7. :convDate(patternIn, patternOut)

##### Vysvětlení syntaxe
Převede datum z jednoho formátu na jiný (nedoporučuje se používat).
Parametry:
- **patternIn:** Vstupní formát data.
- **patternOut:** Výstupní formát data.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Výstup "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Výstup "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Výstup "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Výstup "Sunday"
1410715640:convDate('X', 'LLLL')          // Výstup "Sunday, September 14, 2014 7:27 PM"
// Příklad ve francouzštině:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Výstup "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Výstup "dimanche"
```

##### Výsledek
Výstupem je datum převedené do specifikovaného formátu.


#### 8. Vzory formátování data
Běžné symboly pro formátování data (viz dokumentace DayJS):
- `X`: Unix časové razítko (v sekundách), např. 1360013296
- `x`: Unix časové razítko v milisekundách, např. 1360013296123
- `YY`: Dvoumístný rok, např. 18
- `YYYY`: Čtyřmístný rok, např. 2018
- `M`, `MM`, `MMM`, `MMMM`: Měsíc (číslo, dvoumístné, zkrácené, plný název)
- `D`, `DD`: Den (číslo, dvoumístné)
- `d`, `dd`, `ddd`, `dddd`: Den v týdnu (číslo, minimální, zkrácené, plný název)
- `H`, `HH`, `h`, `hh`: Hodina (24hodinový nebo 12hodinový formát)
- `m`, `mm`: Minuta
- `s`, `ss`: Sekunda
- `SSS`: Milisekunda (3 číslice)
- `Z`, `ZZ`: UTC offset (posun), např. +05:00 nebo +0500
- `A`, `a`: AM/PM
- `Q`: Čtvrtletí (1-4)
- `Do`: Den v měsíci s řadovou číslovkou, např. 1., 2., …
- Další formáty naleznete v kompletní dokumentaci.
  Kromě toho existují lokalizované formáty závislé na jazyce, jako jsou `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL` atd.