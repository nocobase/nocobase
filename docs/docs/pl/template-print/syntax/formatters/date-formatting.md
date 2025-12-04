:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie Dat

#### 1. :formatD(patternOut, patternIn)

##### Opis składni
Formatuje datę, przyjmując wzorzec formatu wyjściowego `patternOut` oraz opcjonalny wzorzec formatu wejściowego `patternIn` (domyślnie ISO 8601).  
Strefę czasową i język można dostosować za pomocą `options.timezone` i `options.lang`.

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Wynik 01/31/2016
'20160131':formatD(LL)     // Wynik January 31, 2016
'20160131':formatD(LLLL)   // Wynik Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Wynik Sunday

// Przykład w języku francuskim:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Wynik mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Wynik dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Wynik dimanche 14 septembre 2014 19:27
```

##### Wynik
Wynikiem jest data sformatowana zgodnie z podaną specyfikacją.

#### 2. :addD(amount, unit, patternIn)

##### Opis składni
Dodaje określoną ilość czasu do daty. Obsługiwane jednostki to: dzień, tydzień, miesiąc, kwartał, rok, godzina, minuta, sekunda, milisekunda.  
Parametry:
- **amount:** Ilość do dodania.
- **unit:** Jednostka czasu (wielkość liter nie ma znaczenia).
- **patternIn:** Opcjonalny, format wejściowy (domyślnie ISO8601).

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Wynik "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Wynik "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Wynik "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Wynik "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Wynik "2016-04-30T00:00:00.000Z"
```

##### Wynik
Wynikiem jest nowa data po dodaniu określonego czasu.

#### 3. :subD(amount, unit, patternIn)

##### Opis składni
Odejmuje określoną ilość czasu od daty. Parametry są takie same jak w `addD`.

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Wynik "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Wynik "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Wynik "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Wynik "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Wynik "2015-10-31T00:00:00.000Z"
```

##### Wynik
Wynikiem jest nowa data po odjęciu określonego czasu.

#### 4. :startOfD(unit, patternIn)

##### Opis składni
Ustawia datę na początek określonej jednostki czasu.  
Parametry:
- **unit:** Jednostka czasu.
- **patternIn:** Opcjonalny, format wejściowy.

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Wynik "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Wynik "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Wynik "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Wynik "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Wynik "2016-01-01T00:00:00.000Z"
```

##### Wynik
Wynikiem jest data ustawiona na początek określonej jednostki.

#### 5. :endOfD(unit, patternIn)

##### Opis składni
Ustawia datę na koniec określonej jednostki czasu.  
Parametry są takie same jak dla `startOfD`.

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Wynik "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Wynik "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Wynik "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Wynik "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Wynik "2016-01-31T23:59:59.999Z"
```

##### Wynik
Wynikiem jest data ustawiona na koniec określonej jednostki.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Opis składni
Oblicza różnicę między dwiema datami i zwraca ją w określonej jednostce. Obsługiwane jednostki to:
- `day(s)` lub `d` (dzień/dni)
- `week(s)` lub `w` (tydzień/tygodnie)
- `quarter(s)` lub `Q` (kwartał/kwartały)
- `month(s)` lub `M` (miesiąc/miesiące)
- `year(s)` lub `y` (rok/lata)
- `hour(s)` lub `h` (godzina/godziny)
- `minute(s)` lub `m` (minuta/minuty)
- `second(s)` lub `s` (sekunda/sekundy)
- `millisecond(s)` lub `ms` (milisekunda/milisekundy) (jednostka domyślna)

Parametry:
- **toDate:** Data docelowa.
- **unit:** Jednostka wyjściowa.
- **patternFromDate:** Opcjonalny, format daty początkowej.
- **patternToDate:** Opcjonalny, format daty docelowej.

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
Wynikiem jest różnica czasu między dwiema datami, przeliczona na określoną jednostkę.

#### 7. :convDate(patternIn, patternOut)

##### Opis składni
Konwertuje datę z jednego formatu na inny (nie zaleca się używania).  
Parametry:
- **patternIn:** Wejściowy format daty.
- **patternOut:** Wyjściowy format daty.

##### Przykład
```
// Środowisko przykładu: opcje API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Wynik "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Wynik "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Wynik "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Wynik "Sunday"
1410715640:convDate('X', 'LLLL')          // Wynik "Sunday, September 14, 2014 7:27 PM"
// Przykład w języku francuskim:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Wynik "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Wynik "dimanche"
```

##### Wynik
Wynikiem jest data skonwertowana do określonego formatu.

#### 8. Wzorce formatowania dat

Najczęściej używane wzorce formatowania dat (patrz dokumentacja DayJS):
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
- `Do`: Dzień miesiąca z liczbą porządkową, np. 1-szy, 2-gi, …
- Inne formaty znajdą Państwo w pełnej dokumentacji.  
  Ponadto dostępne są zlokalizowane formaty, zależne od języka, takie jak `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL` itd.