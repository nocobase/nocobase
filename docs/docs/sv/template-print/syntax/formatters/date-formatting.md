:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Datumformatering

#### 1. :formatD(patternOut, patternIn)

##### Syntaxbeskrivning
Formaterar ett datum genom att acceptera ett utdataformat (`patternOut`) och ett valfritt indataformat (`patternIn`), som standard är ISO 8601. Tidszon och språk kan justeras via `options.timezone` och `options.lang`.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Ger ut 01/31/2016
'20160131':formatD(LL)     // Ger ut January 31, 2016
'20160131':formatD(LLLL)   // Ger ut Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Ger ut Sunday

// Franskt exempel:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Ger ut mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Ger ut dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Ger ut dimanche 14 septembre 2014 19:27
```

##### Resultat
Utdata är datumet formaterat enligt den angivna specifikationen.


#### 2. :addD(amount, unit, patternIn)

##### Syntaxbeskrivning
Lägger till en angiven tidsmängd till ett datum. Enheter som stöds inkluderar: dag, vecka, månad, kvartal, år, timme, minut, sekund, millisekund.  
Parametrar:
- `amount`: Mängden som ska läggas till.
- `unit`: Tidsenheten (skiftlägesokänslig).
- `patternIn`: Valfritt, indataformatet (standard är ISO8601).

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Ger ut "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Ger ut "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Ger ut "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Ger ut "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Ger ut "2016-04-30T00:00:00.000Z"
```

##### Resultat
Utdata är det nya datumet efter att den angivna tiden har lagts till.


#### 3. :subD(amount, unit, patternIn)

##### Syntaxbeskrivning
Subtraherar en angiven tidsmängd från ett datum. Parametrarna är desamma som för `addD`.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Ger ut "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Ger ut "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Ger ut "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Ger ut "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Ger ut "2015-10-31T00:00:00.000Z"
```

##### Resultat
Utdata är det nya datumet efter att den angivna tiden har subtraherats.


#### 4. :startOfD(unit, patternIn)

##### Syntaxbeskrivning
Ställer in datumet till början av den angivna tidsenheten.  
Parametrar:
- `unit`: Tidsenheten.
- `patternIn`: Valfritt, indataformatet.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Ger ut "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Ger ut "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Ger ut "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Ger ut "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Ger ut "2016-01-01T00:00:00.000Z"
```

##### Resultat
Utdata är datumet inställt till början av den angivna enheten.


#### 5. :endOfD(unit, patternIn)

##### Syntaxbeskrivning
Ställer in datumet till slutet av den angivna tidsenheten.  
Parametrarna är desamma som för `startOfD`.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Ger ut "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Ger ut "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Ger ut "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Ger ut "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Ger ut "2016-01-31T23:59:59.999Z"
```

##### Resultat
Utdata är datumet inställt till slutet av den angivna enheten.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Syntaxbeskrivning
Beräknar skillnaden mellan två datum och returnerar den i den angivna enheten. Enheter som stöds inkluderar:
- `day(s)` eller `d`
- `week(s)` eller `w`
- `quarter(s)` eller `Q`
- `month(s)` eller `M`
- `year(s)` eller `y`
- `hour(s)` eller `h`
- `minute(s)` eller `m`
- `second(s)` eller `s`
- `millisecond(s)` eller `ms` (standardenhet)

Parametrar:
- `toDate`: Måldatumet.
- `unit`: Enheten för utdata.
- `patternFromDate`: Valfritt, formatet för startdatumet.
- `patternToDate`: Valfritt, formatet för måldatumet.

##### Exempel
```
'20101001':diffD('20101201')              // Ger ut 5270400000
'20101001':diffD('20101201', 'second')      // Ger ut 5270400
'20101001':diffD('20101201', 's')           // Ger ut 5270400
'20101001':diffD('20101201', 'm')           // Ger ut 87840
'20101001':diffD('20101201', 'h')           // Ger ut 1464
'20101001':diffD('20101201', 'weeks')       // Ger ut 8
'20101001':diffD('20101201', 'days')        // Ger ut 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Ger ut 5270400000
```

##### Resultat
Utdata är tidsskillnaden mellan de två datumen, konverterad till den angivna enheten.


#### 7. :convDate(patternIn, patternOut)

##### Syntaxbeskrivning
Konverterar ett datum från ett format till ett annat (rekommenderas inte att använda).  
Parametrar:
- `patternIn`: Indataformatet för datumet.
- `patternOut`: Utdataformatet för datumet.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Ger ut "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Ger ut "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Ger ut "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Ger ut "Sunday"
1410715640:convDate('X', 'LLLL')          // Ger ut "Sunday, September 14, 2014 7:27 PM"
// Franskt exempel:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Ger ut "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Ger ut "dimanche"
```

##### Resultat
Utdata är datumet konverterat till det angivna formatet.


#### 8. Datumformatmönster
Vanliga datumformatmönster (se DayJS-dokumentationen):
- `X`: Unix-tidsstämpel (i sekunder), t.ex. 1360013296
- `x`: Unix-tidsstämpel i millisekunder, t.ex. 1360013296123
- `YY`: Tvåsiffrigt år, t.ex. 18
- `YYYY`: Fyrsiffrigt år, t.ex. 2018
- `M`, `MM`, `MMM`, `MMMM`: Månad (siffra, tvåsiffrigt, förkortat, fullständigt namn)
- `D`, `DD`: Dag (siffra, tvåsiffrigt)
- `d`, `dd`, `ddd`, `dddd`: Veckodag (siffra, minimalt, förkortat, fullständigt namn)
- `H`, `HH`, `h`, `hh`: Timme (24-timmars- eller 12-timmarsformat)
- `m`, `mm`: Minut
- `s`, `ss`: Sekund
- `SSS`: Millisekund (3 siffror)
- `Z`, `ZZ`: UTC-offset, t.ex. +05:00 eller +0500
- `A`, `a`: AM/PM
- `Q`: Kvartal (1-4)
- `Do`: Dag i månaden med ordningstal, t.ex. 1:a, 2:a, ...
- För andra format, se den fullständiga dokumentationen.  
  Dessutom finns det lokaliserade format baserade på språk, såsom `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.