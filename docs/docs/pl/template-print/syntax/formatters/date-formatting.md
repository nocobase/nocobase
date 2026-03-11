:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/template-print/syntax/formatters/date-formatting).
:::

### Formatowanie dat

#### 1. :formatD(patternOut, patternIn)

##### Opis składni
Formatuje datę, przyjmując wzorzec formatu wyjściowego `patternOut` oraz wzorzec formatu wejściowego `patternIn` (domyślnie ISO 8601).

##### Typowe przykłady
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Wynik 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Wynik 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Wynik 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Wynik 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Wynik 1月15日
{d.meetingTime:formatD(HH:mm)}              // Wynik 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Wynik 2024年1月15日 星期一
```

##### Więcej przykładów formatowania
```
'20160131':formatD(L)      // Wynik 01/31/2016
'20160131':formatD(LL)     // Wynik January 31, 2016
'20160131':formatD(LLLL)   // Wynik Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Wynik Sunday
```

##### Wynik
Wyjściem jest ciąg znaków daty w określonym formacie.


#### 2. :addD(amount, unit, patternIn)

##### Opis składni
Dodaje określoną ilość czasu do daty. Obsługiwane jednostki: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parametry:
- amount: ilość do dodania
- unit: jednostka czasu (wielkość liter nie ma znaczenia)
- patternIn: opcjonalny, format wejściowy, domyślnie ISO8601

##### Przykład
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Wynik "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Wynik "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Wynik "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Wynik "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Wynik "2016-04-30T00:00:00.000Z"
```

##### Wynik
Wyjściem jest nowa data po dodaniu czasu.


#### 3. :subD(amount, unit, patternIn)

##### Opis składni
Odejmuje określoną ilość czasu od daty. Parametry takie same jak w `addD`.

##### Przykład
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Wynik "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Wynik "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Wynik "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Wynik "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Wynik "2015-10-31T00:00:00.000Z"
```

##### Wynik
Wyjściem jest nowa data po odjęciu czasu.


#### 4. :startOfD(unit, patternIn)

##### Opis składni
Ustawia datę na moment początkowy określonej jednostki czasu.  
Parametry:
- unit: jednostka czasu
- patternIn: opcjonalny, format wejściowy

##### Przykład
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Wynik "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Wynik "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Wynik "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Wynik "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Wynik "2016-01-01T00:00:00.000Z"
```

##### Wynik
Wyjściem jest ciąg znaków daty momentu początkowego.


#### 5. :endOfD(unit, patternIn)

##### Opis składni
Ustawia datę na moment końcowy określonej jednostki czasu.  
Parametry takie same jak powyżej.

##### Przykład
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Wynik "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Wynik "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Wynik "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Wynik "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Wynik "2016-01-31T23:59:59.999Z"
```

##### Wynik
Wyjściem jest ciąg znaków daty momentu końcowego.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Opis składni
Oblicza różnicę między dwiema datami i zwraca ją w określonej jednostce. Obsługiwane jednostki wyjściowe obejmują:
- `day(s)` lub `d`
- `week(s)` lub `w`
- `quarter(s)` lub `Q`
- `month(s)` lub `M`
- `year(s)` lub `y`
- `hour(s)` lub `h`
- `minute(s)` lub `m`
- `second(s)` lub `s`
- `millisecond(s)` lub `ms` (jednostka domyślna)

Parametry:
- toDate: data docelowa
- unit: jednostka wyjściowa
- patternFromDate: opcjonalny, format daty początkowej
- patternToDate: opcjonalny, format daty docelowej

##### Przykład
```
'20101001':diffD('20101201')              // Wynik 5270400000
'20101001':diffD('20101201', 'second')      // Wynik 5270400
'20101001':diffD('20101201', 's')           // Wynik 5270400
'20101001':diffD('20101201', 'm')           // Wynik 87840
'20101001':diffD('20101201', 'h')           // Wynik 1464
'20101001':diffD('20101201', 'weeks')       // Wynik 8
'20101001':diffD('20101201', 'days')        // Wynik 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Wynik 5270400000
```

##### Wynik
Wyjściem jest różnica czasu między dwiema datami, przeliczona zgodnie z określoną jednostką.


#### 7. :convDate(patternIn, patternOut)

##### Opis składni
Konwertuje datę z jednego formatu na inny. (Nie zaleca się używania)  
Parametry:
- patternIn: format daty wejściowej
- patternOut: format daty wyjściowej

##### Przykład
```
'20160131':convDate('YYYYMMDD', 'L')      // Wynik "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Wynik "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Wynik "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Wynik "Sunday"
1410715640:convDate('X', 'LLLL')          // Wynik "Sunday, September 14, 2014 7:27 PM"
```

##### Wynik
Wyjściem jest przekonwertowany ciąg znaków daty.


#### 8. Wzorce formatowania dat
Opis popularnych formatów dat (na podstawie DayJS):
- `X`: Znacznik czasu Unix (w sekundach), np. 1360013296
- `x`: Znacznik czasu Unix w milisekundach, np. 1360013296123
- `YY`: Rok dwucyfrowy, np. 18
- `YYYY`: Rok czterocyfrowy, np. 2018
- `M`, `MM`, `MMM`, `MMMM`: Miesiąc (liczba, dwucyfrowy, skrócony, pełna nazwa)
- `D`, `DD`: Dzień (liczba, dwucyfrowy)
- `d`, `dd`, `ddd`, `dddd`: Dzień tygodnia (liczba, minimalny, skrócony, pełna nazwa)
- `H`, `HH`, `h`, `hh`: Godzina (format 24-godzinny lub 12-godzinny)
- `m`, `mm`: Minuta
- `s`, `ss`: Sekunda
- `SSS`: Milisekunda (3 cyfry)
- `Z`, `ZZ`: Przesunięcie UTC, np. +05:00 lub +0500
- `A`, `a`: AM/PM
- `Q`: Kwartał (1-4)
- `Do`: Data z liczebnikiem porządkowym, np. 1st, 2nd, …
- Inne formaty znajdą Państwo w pełnej dokumentacji.  
  Ponadto istnieją formaty lokalne oparte na języku: np. `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL` itd.