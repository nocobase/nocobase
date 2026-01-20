:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Formattazione delle date

#### 1. :formatD(patternOut, patternIn)

##### Spiegazione della sintassi
Formatta una data accettando un formato di output `patternOut` e un formato di input opzionale `patternIn` (il valore predefinito è ISO 8601). È possibile regolare il fuso orario e la lingua tramite `options.timezone` e `options.lang`.

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Output 01/31/2016
'20160131':formatD(LL)     // Output January 31, 2016
'20160131':formatD(LLLL)   // Output Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Output Sunday

// Esempio in francese:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Output mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Output dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Output dimanche 14 septembre 2014 19:27
```

##### Risultato
Il risultato è una stringa di data formattata come specificato.

#### 2. :addD(amount, unit, patternIn)

##### Spiegazione della sintassi
Aggiunge una quantità di tempo specificata a una data. Le unità supportate includono: day, week, month, quarter, year, hour, minute, second, millisecond.
Parametri:
- `amount`: La quantità da aggiungere.
- `unit`: L'unità di tempo (non sensibile alle maiuscole/minuscole).
- `patternIn`: Opzionale, il formato di input (il valore predefinito è ISO8601).

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Output "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Output "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Output "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Output "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Output "2016-04-30T00:00:00.000Z"
```

##### Risultato
Il risultato è la nuova data dopo l'aggiunta del tempo specificato.

#### 3. :subD(amount, unit, patternIn)

##### Spiegazione della sintassi
Sottrae una quantità di tempo specificata da una data. I parametri sono gli stessi di `addD`.

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Output "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Output "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Output "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Output "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Output "2015-10-31T00:00:00.000Z"
```

##### Risultato
Il risultato è la nuova data dopo la sottrazione del tempo specificato.

#### 4. :startOfD(unit, patternIn)

##### Spiegazione della sintassi
Imposta la data all'inizio dell'unità di tempo specificata.
Parametri:
- `unit`: L'unità di tempo.
- `patternIn`: Opzionale, il formato di input.

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Output "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Output "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Output "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Output "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Output "2016-01-01T00:00:00.000Z"
```

##### Risultato
Il risultato è la data impostata all'inizio dell'unità specificata.

#### 5. :endOfD(unit, patternIn)

##### Spiegazione della sintassi
Imposta la data alla fine dell'unità di tempo specificata.
I parametri sono gli stessi di `startOfD`.

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Output "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Output "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Output "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Output "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Output "2016-01-31T23:59:59.999Z"
```

##### Risultato
Il risultato è la data impostata alla fine dell'unità specificata.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Spiegazione della sintassi
Calcola la differenza tra due date e la restituisce nell'unità specificata. Le unità di output supportate includono:
- `day(s)` o `d`
- `week(s)` o `w`
- `quarter(s)` o `Q`
- `month(s)` o `M`
- `year(s)` o `y`
- `hour(s)` o `h`
- `minute(s)` o `m`
- `second(s)` o `s`
- `millisecond(s)` o `ms` (unità predefinita)

Parametri:
- `toDate`: La data di destinazione.
- `unit`: L'unità per l'output.
- `patternFromDate`: Opzionale, il formato della data di inizio.
- `patternToDate`: Opzionale, il formato della data di destinazione.

##### Esempio
```
'20101001':diffD('20101201')              // Output 5270400000
'20101001':diffD('20101201', 'second')      // Output 5270400
'20101001':diffD('20101201', 's')           // Output 5270400
'20101001':diffD('20101201', 'm')           // Output 87840
'20101001':diffD('20101201', 'h')           // Output 1464
'20101001':diffD('20101201', 'weeks')       // Output 8
'20101001':diffD('20101201', 'days')        // Output 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Output 5270400000
```

##### Risultato
Il risultato è la differenza di tempo tra le due date, convertita nell'unità specificata.

#### 7. :convDate(patternIn, patternOut)

##### Spiegazione della sintassi
Converte una data da un formato all'altro (sconsigliato).
Parametri:
- `patternIn`: Il formato di input della data.
- `patternOut`: Il formato di output della data.

##### Esempio
```
// Ambiente d'esempio: opzioni API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Output "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Output "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "Sunday"
1410715640:convDate('X', 'LLLL')          // Output "Sunday, September 14, 2014 7:27 PM"
// Esempio in francese:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "dimanche"
```

##### Risultato
Il risultato è la stringa di data convertita.

#### 8. Modelli di formato data

Simboli comuni per il formato della data (fare riferimento alla documentazione di DayJS):
- `X`: Timestamp Unix (in secondi), ad es. 1360013296
- `x`: Timestamp Unix in millisecondi, ad es. 1360013296123
- `YY`: Anno a due cifre, ad es. 18
- `YYYY`: Anno a quattro cifre, ad es. 2018
- `M`, `MM`, `MMM`, `MMMM`: Mese (numero, due cifre, abbreviato, nome completo)
- `D`, `DD`: Giorno (numero, due cifre)
- `d`, `dd`, `ddd`, `dddd`: Giorno della settimana (numero, minimale, abbreviato, nome completo)
- `H`, `HH`, `h`, `hh`: Ora (formato 24 ore o 12 ore)
- `m`, `mm`: Minuto
- `s`, `ss`: Secondo
- `SSS`: Millisecondo (3 cifre)
- `Z`, `ZZ`: Offset UTC, ad es. +05:00 o +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Giorno del mese con ordinale, ad es. 1º, 2º, ...
- Per altri formati, fare riferimento alla documentazione completa.
  Inoltre, esistono formati localizzati basati sulla lingua, come `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, ecc.