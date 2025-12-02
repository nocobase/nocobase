:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Datum Formatierung

#### 1. :formatD(patternOut, patternIn)

##### Syntax Erklärung
Diese Funktion formatiert ein Datum. Sie akzeptiert ein Ausgabeformat `patternOut` und ein optionales Eingabeformat `patternIn` (standardmäßig ISO 8601).  
Die Zeitzone und Sprache können Sie über `options.timezone` und `options.lang` anpassen.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Ergibt 01/31/2016
'20160131':formatD(LL)     // Ergibt January 31, 2016
'20160131':formatD(LLLL)   // Ergibt Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Ergibt Sunday

// Französisches Beispiel:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Ergibt mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Ergibt dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Ergibt dimanche 14 septembre 2014 19:27
```

##### Ergebnis
Die Ausgabe ist das Datum im angegebenen Format als Zeichenkette.

#### 2. :addD(amount, unit, patternIn)

##### Syntax Erklärung
Diese Funktion fügt einem Datum eine bestimmte Zeitspanne hinzu. Unterstützte Einheiten sind: Tag, Woche, Monat, Quartal, Jahr, Stunde, Minute, Sekunde, Millisekunde.  
Parameter:
- **amount:** Die hinzuzufügende Menge.
- **unit:** Die Zeiteinheit (Groß-/Kleinschreibung wird ignoriert).
- **patternIn:** Optional, das Eingabeformat (standardmäßig ISO8601).

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Ergibt "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Ergibt "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Ergibt "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Ergibt "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Ergibt "2016-04-30T00:00:00.000Z"
```

##### Ergebnis
Die Ausgabe ist das neue Datum, nachdem die angegebene Zeit hinzugefügt wurde.

#### 3. :subD(amount, unit, patternIn)

##### Syntax Erklärung
Diese Funktion zieht eine bestimmte Zeitspanne von einem Datum ab. Die Parameter sind dieselben wie bei `addD`.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Ergibt "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Ergibt "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Ergibt "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Ergibt "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Ergibt "2015-10-31T00:00:00.000Z"
```

##### Ergebnis
Die Ausgabe ist das neue Datum, nachdem die angegebene Zeit abgezogen wurde.

#### 4. :startOfD(unit, patternIn)

##### Syntax Erklärung
Diese Funktion setzt das Datum auf den Beginn der angegebenen Zeiteinheit.  
Parameter:
- **unit:** Die Zeiteinheit.
- **patternIn:** Optional, das Eingabeformat.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Ergibt "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Ergibt "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Ergibt "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Ergibt "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Ergibt "2016-01-01T00:00:00.000Z"
```

##### Ergebnis
Die Ausgabe ist die Datumszeichenkette, die auf den Beginn der angegebenen Einheit gesetzt ist.

#### 5. :endOfD(unit, patternIn)

##### Syntax Erklärung
Diese Funktion setzt das Datum auf das Ende der angegebenen Zeiteinheit.  
Die Parameter sind dieselben wie bei `startOfD`.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Ergibt "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Ergibt "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Ergibt "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Ergibt "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Ergibt "2016-01-31T23:59:59.999Z"
```

##### Ergebnis
Die Ausgabe ist die Datumszeichenkette, die auf das Ende der angegebenen Einheit gesetzt ist.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Syntax Erklärung
Diese Funktion berechnet die Differenz zwischen zwei Daten und gibt diese in der angegebenen Einheit aus. Unterstützte Einheiten sind:
- `day(s)` oder `d` (Tag(e) oder T)
- `week(s)` oder `w` (Woche(n) oder W)
- `quarter(s)` oder `Q` (Quartal(e) oder Q)
- `month(s)` oder `M` (Monat(e) oder M)
- `year(s)` oder `y` (Jahr(e) oder J)
- `hour(s)` oder `h` (Stunde(n) oder H)
- `minute(s)` oder `m` (Minute(n) oder M)
- `second(s)` oder `s` (Sekunde(n) oder S)
- `millisecond(s)` oder `ms` (Millisekunde(n) oder MS) (Standardeinheit)

Parameter:
- **toDate:** Das Zieldatum.
- **unit:** Die Einheit für die Ausgabe.
- **patternFromDate:** Optional, das Format des Startdatums.
- **patternToDate:** Optional, das Format des Zieldatums.

##### Beispiel
```
'20101001':diffD('20101201')              // Ergibt 5270400000
'20101001':diffD('20101201', 'second')      // Ergibt 5270400
'20101001':diffD('20101201', 's')           // Ergibt 5270400
'20101001':diffD('20101201', 'm')           // Ergibt 87840
'20101001':diffD('20101201', 'h')           // Ergibt 1464
'20101001':diffD('20101201', 'weeks')       // Ergibt 8
'20101001':diffD('20101201', 'days')        // Ergibt 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Ergibt 5270400000
```

##### Ergebnis
Die Ausgabe ist die Zeitdifferenz zwischen den beiden Daten, umgerechnet in die angegebene Einheit.

#### 7. :convDate(patternIn, patternOut)

##### Syntax Erklärung
Diese Funktion konvertiert ein Datum von einem Format in ein anderes (nicht zur Verwendung empfohlen).  
Parameter:
- **patternIn:** Das Eingabeformat des Datums.
- **patternOut:** Das Ausgabeformat des Datums.

##### Beispiel
```
// Beispielumgebung: API-Optionen { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Ergibt "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Ergibt "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Ergibt "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Ergibt "Sunday"
1410715640:convDate('X', 'LLLL')          // Ergibt "Sunday, September 14, 2014 7:27 PM"
// Französisches Beispiel:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Ergibt "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Ergibt "dimanche"
```

##### Ergebnis
Die Ausgabe ist die Datumszeichenkette, die in das angegebene Format konvertiert wurde.

#### 8. Datumsformatmuster

Häufig verwendete Datumsformatsymbole (siehe DayJS-Dokumentation):
- `X`: Unix-Zeitstempel (in Sekunden), z. B. 1360013296
- `x`: Unix-Zeitstempel in Millisekunden, z. B. 1360013296123
- `YY`: Zweistellige Jahreszahl, z. B. 18
- `YYYY`: Vierstellige Jahreszahl, z. B. 2018
- `M`, `MM`, `MMM`, `MMMM`: Monat (Zahl, zweistellig, abgekürzt, vollständiger Name)
- `D`, `DD`: Tag (Zahl, zweistellig)
- `d`, `dd`, `ddd`, `dddd`: Wochentag (Zahl, minimal, abgekürzt, vollständiger Name)
- `H`, `HH`, `h`, `hh`: Stunde (24-Stunden- oder 12-Stunden-Format)
- `m`, `mm`: Minute
- `s`, `ss`: Sekunde
- `SSS`: Millisekunde (3 Stellen)
- `Z`, `ZZ`: UTC-Offset, z. B. +05:00 oder +0500
- `A`, `a`: AM/PM
- `Q`: Quartal (1-4)
- `Do`: Tag des Monats mit Ordinalzahl, z. B. 1st, 2nd, …
- Für weitere Formate beachten Sie bitte die vollständige Dokumentation.  
  Zusätzlich gibt es lokalisierte Formate, die auf der Sprache basieren, wie `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL` usw.