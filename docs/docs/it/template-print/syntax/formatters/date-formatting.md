:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/template-print/syntax/formatters/date-formatting).
:::

### Formattazione della data

#### 1. :formatD(patternOut, patternIn)

##### Spiegazione della sintassi
Formatta la data, accetta il modello di formato di output `patternOut` e il modello di formato di input `patternIn` (predefinito ISO 8601).

##### Esempi comuni
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Output 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Output 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Output 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Output 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Output 1月15日
{d.meetingTime:formatD(HH:mm)}              // Output 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Output 2024年1月15日 lunedì
```

##### Altri esempi di formato
```
'20160131':formatD(L)      // Output 01/31/2016
'20160131':formatD(LL)     // Output January 31, 2016
'20160131':formatD(LLLL)   // Output Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Output Sunday
```

##### Risultato
L'output è una stringa di data nel formato specificato.


#### 2. :addD(amount, unit, patternIn)

##### Spiegazione della sintassi
Aggiunge la quantità di tempo specificata alla data. Unità supportate: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parametri:
- amount: la quantità da aggiungere
- unit: unità di tempo (non sensibile alle maiuscole)
- patternIn: opzionale, formato di input, predefinito ISO8601

##### Esempio
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Output "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Output "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Output "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Output "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Output "2016-04-30T00:00:00.000Z"
```

##### Risultato
L'output è la nuova data dopo l'aggiunta del tempo.


#### 3. :subD(amount, unit, patternIn)

##### Spiegazione della sintassi
Sottrae la quantità di tempo specificata dalla data. Parametri identici a `addD`.

##### Esempio
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Output "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Output "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Output "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Output "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Output "2015-10-31T00:00:00.000Z"
```

##### Risultato
L'output è la nuova data dopo la sottrazione del tempo.


#### 4. :startOfD(unit, patternIn)

##### Spiegazione della sintassi
Imposta la data all'inizio dell'unità di tempo specificata.  
Parametri:
- unit: unità di tempo
- patternIn: opzionale, formato di input

##### Esempio
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Output "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Output "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Output "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Output "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Output "2016-01-01T00:00:00.000Z"
```

##### Risultato
L'output è la stringa della data all'inizio dell'unità specificata.


#### 5. :endOfD(unit, patternIn)

##### Spiegazione della sintassi
Imposta la data alla fine dell'unità di tempo specificata.  
Parametri come sopra.

##### Esempio
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Output "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Output "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Output "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Output "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Output "2016-01-31T23:59:59.999Z"
```

##### Risultato
L'output è la stringa della data alla fine dell'unità specificata.


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
- toDate: data di destinazione
- unit: unità di output
- patternFromDate: opzionale, formato della data di inizio
- patternToDate: opzionale, formato della data di destinazione

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
L'output è la differenza temporale tra le due date, convertita nell'unità specificata.


#### 7. :convDate(patternIn, patternOut)

##### Spiegazione della sintassi
Converte la data da un formato all'altro. (Uso non raccomandato)  
Parametri:
- patternIn: formato della data di input
- patternOut: formato della data di output

##### Esempio
```
'20160131':convDate('YYYYMMDD', 'L')      // Output "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Output "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "Sunday"
1410715640:convDate('X', 'LLLL')          // Output "Sunday, September 14, 2014 7:27 PM"
```

##### Risultato
L'output è la stringa della data convertita.


#### 8. Modelli di formato data
Descrizione dei formati di data comuni (fare riferimento alla documentazione DayJS):
- `X`: Timestamp Unix (secondi), ad es. 1360013296
- `x`: Timestamp Unix in millisecondi, ad es. 1360013296123
- `YY`: Anno a due cifre, ad es. 18
- `YYYY`: Anno a quattro cifre, ad es. 2018
- `M`, `MM`, `MMM`, `MMMM`: Mese (numero, due cifre, abbreviato, nome completo)
- `D`, `DD`: Giorno (numero, due cifre)
- `d`, `dd`, `ddd`, `dddd`: Giorno della settimana (numero, minimo, abbreviato, nome completo)
- `H`, `HH`, `h`, `hh`: Ora (formato 24 ore o 12 ore)
- `m`, `mm`: Minuti
- `s`, `ss`: Secondi
- `SSS`: Millisecondi (3 cifre)
- `Z`, `ZZ`: Offset UTC, ad es. +05:00 o +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Giorno del mese con numero ordinale, ad es. 1st, 2nd, …
- Per altri formati, consultare la documentazione completa.  
  Inoltre, sono disponibili formati localizzati basati sulla lingua: come `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, ecc.