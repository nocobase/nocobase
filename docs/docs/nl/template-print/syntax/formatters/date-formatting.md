:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/template-print/syntax/formatters/date-formatting) voor nauwkeurige informatie.
:::

### Datumopmaak

#### 1. :formatD(patternOut, patternIn)

##### Syntaxuitleg
Formatteert een datum, accepteert het uitvoerformaatpatroon `patternOut` en het invoerformaatpatroon `patternIn` (standaard ISO 8601).

##### Veelvoorkomende voorbeelden
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Uitvoer 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Uitvoer 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Uitvoer 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Uitvoer 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Uitvoer 1月15日
{d.meetingTime:formatD(HH:mm)}              // Uitvoer 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Uitvoer 2024年1月15日 星期一
```

##### Meer formaatvoorbeelden
```
'20160131':formatD(L)      // Uitvoer 01/31/2016
'20160131':formatD(LL)     // Uitvoer January 31, 2016
'20160131':formatD(LLLL)   // Uitvoer Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Uitvoer Sunday
```

##### Resultaat
Uitvoer is een datumtekenreeks in het opgegeven formaat.


#### 2. :addD(amount, unit, patternIn)

##### Syntaxuitleg
Voegt een gespecificeerde hoeveelheid tijd toe aan een datum. Ondersteunde eenheden: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parameters:
- amount: de toe te voegen hoeveelheid
- unit: tijdseenheid (niet hoofdlettergevoelig)
- patternIn: optioneel, invoerformaat, standaard ISO8601

##### Voorbeeld
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Uitvoer "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Uitvoer "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Uitvoer "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Uitvoer "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Uitvoer "2016-04-30T00:00:00.000Z"
```

##### Resultaat
Uitvoer is de nieuwe datum na het toevoegen van de tijd.


#### 3. :subD(amount, unit, patternIn)

##### Syntaxuitleg
Trekt een gespecificeerde hoeveelheid tijd af van een datum. Parameters zijn hetzelfde als bij `addD`.

##### Voorbeeld
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Uitvoer "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Uitvoer "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Uitvoer "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Uitvoer "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Uitvoer "2015-10-31T00:00:00.000Z"
```

##### Resultaat
Uitvoer is de nieuwe datum na het aftrekken van de tijd.


#### 4. :startOfD(unit, patternIn)

##### Syntaxuitleg
Stelt de datum in op het beginmoment van de gespecificeerde tijdseenheid.  
Parameters:
- unit: tijdseenheid
- patternIn: optioneel, invoerformaat

##### Voorbeeld
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Uitvoer "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Uitvoer "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Uitvoer "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Uitvoer "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Uitvoer "2016-01-01T00:00:00.000Z"
```

##### Resultaat
Uitvoer is de datumtekenreeks van het beginmoment.


#### 5. :endOfD(unit, patternIn)

##### Syntaxuitleg
Stelt de datum in op het eindmoment van de gespecificeerde tijdseenheid.  
Parameters zijn hetzelfde als hierboven.

##### Voorbeeld
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Uitvoer "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Uitvoer "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Uitvoer "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Uitvoer "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Uitvoer "2016-01-31T23:59:59.999Z"
```

##### Resultaat
Uitvoer is de datumtekenreeks van het eindmoment.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Syntaxuitleg
Berekent het verschil tussen twee datums en voert dit uit in de gespecificeerde eenheid. Ondersteunde uitvoereenheden zijn onder andere:
- `day(s)` of `d`
- `week(s)` of `w`
- `quarter(s)` of `Q`
- `month(s)` of `M`
- `year(s)` of `y`
- `hour(s)` of `h`
- `minute(s)` of `m`
- `second(s)` of `s`
- `millisecond(s)` of `ms` (standaardeenheid)

Parameters:
- toDate: doeldatum
- unit: uitvoereenheid
- patternFromDate: optioneel, formaat van de begindatum
- patternToDate: optioneel, formaat van de doeldatum

##### Voorbeeld
```
'20101001':diffD('20101201')              // Uitvoer 5270400000
'20101001':diffD('20101201', 'second')      // Uitvoer 5270400
'20101001':diffD('20101201', 's')           // Uitvoer 5270400
'20101001':diffD('20101201', 'm')           // Uitvoer 87840
'20101001':diffD('20101201', 'h')           // Uitvoer 1464
'20101001':diffD('20101201', 'weeks')       // Uitvoer 8
'20101001':diffD('20101201', 'days')        // Uitvoer 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Uitvoer 5270400000
```

##### Resultaat
Uitvoer is het tijdsverschil tussen de twee datums, geconverteerd volgens de opgegeven eenheid.


#### 7. :convDate(patternIn, patternOut)

##### Syntaxuitleg
Converteert een datum van het ene formaat naar het andere. (Niet aanbevolen voor gebruik)  
Parameters:
- patternIn: invoerdatumformaat
- patternOut: uitvoerdatumformaat

##### Voorbeeld
```
'20160131':convDate('YYYYMMDD', 'L')      // Uitvoer "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Uitvoer "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Uitvoer "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Uitvoer "Sunday"
1410715640:convDate('X', 'LLLL')          // Uitvoer "Sunday, September 14, 2014 7:27 PM"
```

##### Resultaat
Uitvoer is de geconverteerde datumtekenreeks.


#### 8. Datumformaatpatronen
Uitleg van veelgebruikte datumformaten (zie DayJS-uitleg):
- `X`: Unix-tijdstempel (seconden), zoals 1360013296
- `x`: Unix-milliseconden-tijdstempel, zoals 1360013296123
- `YY`: Jaar in twee cijfers, zoals 18
- `YYYY`: Jaar in vier cijfers, zoals 2018
- `M`, `MM`, `MMM`, `MMMM`: Maand (getal, twee cijfers, afkorting, volledige naam)
- `D`, `DD`: Dag (getal, twee cijfers)
- `d`, `dd`, `ddd`, `dddd`: Weekdag (getal, kortst, afkorting, volledige naam)
- `H`, `HH`, `h`, `hh`: Uur (24-uurs of 12-uurs systeem)
- `m`, `mm`: Minuten
- `s`, `ss`: Seconden
- `SSS`: Milliseconden (3 cijfers)
- `Z`, `ZZ`: UTC-offset, zoals +05:00 of +0500
- `A`, `a`: AM/PM
- `Q`: Kwartaal (1-4)
- `Do`: Dag met rangtelwoord, zoals 1st, 2nd, …
- Zie de volledige documentatie voor overige formaten.  
  Daarnaast zijn er op taal gebaseerde gelokaliseerde formaten: zoals `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, enz.