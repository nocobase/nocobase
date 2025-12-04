:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Datumopmaak

#### 1. `:formatD(patternOut, patternIn)`

##### Syntaxisuitleg
Formatteert een datum door een uitvoerformaat `patternOut` en een optioneel invoerformaat `patternIn` (standaard ISO 8601) te accepteren. U kunt de tijdzone en taal aanpassen via `options.timezone` en `options.lang`.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Geeft als resultaat 01/31/2016
'20160131':formatD(LL)     // Geeft als resultaat January 31, 2016
'20160131':formatD(LLLL)   // Geeft als resultaat Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Geeft als resultaat Sunday

// Frans voorbeeld:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Geeft als resultaat mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Geeft als resultaat dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Geeft als resultaat dimanche 14 septembre 2014 19:27
```

##### Resultaat
Het resultaat is de datumstring in het opgegeven formaat.

#### 2. `:addD(amount, unit, patternIn)`

##### Syntaxisuitleg
Voegt een opgegeven hoeveelheid tijd toe aan een datum. Ondersteunde eenheden zijn: day, week, month, quarter, year, hour, minute, second, millisecond.

Parameters:
- `amount`: De toe te voegen hoeveelheid.
- `unit`: De tijdseenheid (niet hoofdlettergevoelig).
- `patternIn`: Optioneel, het invoerformaat (standaard ISO8601).

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Geeft als resultaat "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Geeft als resultaat "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Geeft als resultaat "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Geeft als resultaat "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Geeft als resultaat "2016-04-30T00:00:00.000Z"
```

##### Resultaat
Het resultaat is de nieuwe datum nadat de opgegeven tijd is toegevoegd.

#### 3. `:subD(amount, unit, patternIn)`

##### Syntaxisuitleg
Trekt een opgegeven hoeveelheid tijd af van een datum. De parameters zijn hetzelfde als bij `addD`.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Geeft als resultaat "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Geeft als resultaat "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Geeft als resultaat "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Geeft als resultaat "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Geeft als resultaat "2015-10-31T00:00:00.000Z"
```

##### Resultaat
Het resultaat is de nieuwe datum nadat de opgegeven tijd is afgetrokken.

#### 4. `:startOfD(unit, patternIn)`

##### Syntaxisuitleg
Stelt de datum in op het begin van de opgegeven tijdseenheid.

Parameters:
- `unit`: De tijdseenheid.
- `patternIn`: Optioneel, het invoerformaat.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Geeft als resultaat "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Geeft als resultaat "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Geeft als resultaat "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Geeft als resultaat "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Geeft als resultaat "2016-01-01T00:00:00.000Z"
```

##### Resultaat
Het resultaat is de datumstring ingesteld op het begin van de opgegeven eenheid.

#### 5. `:endOfD(unit, patternIn)`

##### Syntaxisuitleg
Stelt de datum in op het einde van de opgegeven tijdseenheid. De parameters zijn hetzelfde als bij `startOfD`.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Geeft als resultaat "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Geeft als resultaat "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Geeft als resultaat "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Geeft als resultaat "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Geeft als resultaat "2016-01-31T23:59:59.999Z"
```

##### Resultaat
Het resultaat is de datumstring ingesteld op het einde van de opgegeven eenheid.

#### 6. `:diffD(toDate, unit, patternFromDate, patternToDate)`

##### Syntaxisuitleg
Berekent het verschil tussen twee datums en geeft dit weer in de opgegeven eenheid. Ondersteunde eenheden zijn onder andere:
- `dag(en)` of `d`
- `week/weken` of `w`
- `kwartaal/kwartalen` of `Q`
- `maand(en)` of `M`
- `jaar/jaren` of `y`
- `uur/uren` of `h`
- `minuut/minuten` of `m`
- `seconde(n)` of `s`
- `milliseconde(n)` of `ms` (standaard eenheid)

Parameters:
- `toDate`: De doeldatum.
- `unit`: De eenheid voor de uitvoer.
- `patternFromDate`: Optioneel, het formaat van de startdatum.
- `patternToDate`: Optioneel, het formaat van de doeldatum.

##### Voorbeeld
```
'20101001':diffD('20101201')              // Geeft als resultaat 5270400000
'20101001':diffD('20101201', 'second')      // Geeft als resultaat 5270400
'20101001':diffD('20101201', 's')           // Geeft als resultaat 5270400
'20101001':diffD('20101201', 'm')           // Geeft als resultaat 87840
'20101001':diffD('20101201', 'h')           // Geeft als resultaat 1464
'20101001':diffD('20101201', 'weeks')       // Geeft als resultaat 8
'20101001':diffD('20101201', 'days')        // Geeft als resultaat 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Geeft als resultaat 5270400000
```

##### Resultaat
Het resultaat is het tijdsverschil tussen de twee datums, geconverteerd naar de opgegeven eenheid.

#### 7. `:convDate(patternIn, patternOut)`

##### Syntaxisuitleg
Converteert een datum van het ene formaat naar het andere (gebruik wordt afgeraden).

Parameters:
- `patternIn`: Het invoerdatumformaat.
- `patternOut`: Het uitvoerdatumformaat.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Geeft als resultaat "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Geeft als resultaat "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Geeft als resultaat "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Geeft als resultaat "Sunday"
1410715640:convDate('X', 'LLLL')          // Geeft als resultaat "Sunday, September 14, 2014 7:27 PM"
// Frans voorbeeld:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Geeft als resultaat "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Geeft als resultaat "dimanche"
```

##### Resultaat
Het resultaat is de geconverteerde datumstring.

#### 8. Datumformaatpatronen

Veelvoorkomende symbolen voor datumopmaak (raadpleeg de DayJS-documentatie):
- `X`: Unix tijdstempel (in seconden), bijv. 1360013296
- `x`: Unix tijdstempel in milliseconden, bijv. 1360013296123
- `YY`: Tweecijferig jaar, bijv. 18
- `YYYY`: Viercijferig jaar, bijv. 2018
- `M`, `MM`, `MMM`, `MMMM`: Maand (getal, tweecijferig, afgekort, volledige naam)
- `D`, `DD`: Dag (getal, tweecijferig)
- `d`, `dd`, `ddd`, `dddd`: Dag van de week (getal, minimaal, afgekort, volledige naam)
- `H`, `HH`, `h`, `hh`: Uur (24-uurs of 12-uurs klok)
- `m`, `mm`: Minuut
- `s`, `ss`: Seconde
- `SSS`: Milliseconde (3 cijfers)
- `Z`, `ZZ`: UTC-offset, bijv. +05:00 of +0500
- `A`, `a`: AM/PM
- `Q`: Kwartaal (1-4)
- `Do`: Dag van de maand met rangtelwoord, bijv. 1e, 2e, ...
- Voor andere formaten, raadpleeg de volledige documentatie.
  Daarnaast zijn er gelokaliseerde formaten op basis van taal, zoals `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, enz.