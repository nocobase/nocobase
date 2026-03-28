:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) bietet eine große Sammlung an Excel-kompatiblen Funktionen.

## Funktionsreferenz

### Datum

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Erstellt ein Datum basierend auf dem angegebenen Jahr, Monat und Tag. | `DATE(2008, 7, 8)` | Jahr (Ganzzahl), Monat (1-12), Tag (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Wandelt ein Datum im Textformat in eine Datums-Seriennummer um. | `DATEVALUE('8/22/2011')` | Textzeichenfolge, die ein Datum darstellt. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Gibt den Tag eines Datums zurück. | `DAY('15-Apr-11')` | Datumswert oder eine Datums-Textzeichenfolge. | 15 |
| **DAYS** | Berechnet die Anzahl der Tage zwischen zwei Daten. | `DAYS('3/15/11', '2/1/11')` | Enddatum, Startdatum. | 42 |
| **DAYS360** | Berechnet die Anzahl der Tage zwischen zwei Daten basierend auf einem 360-Tage-Jahr. | `DAYS360('1-Jan-11', '31-Dec-11')` | Startdatum, Enddatum. | 360 |
| **EDATE** | Gibt das Datum zurück, das eine angegebene Anzahl von Monaten vor oder nach einem Datum liegt. | `EDATE('1/15/11', -1)` | Startdatum, Anzahl der Monate (positiv für Zukunft, negativ für Vergangenheit). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Gibt den letzten Tag des Monats vor oder nach der angegebenen Anzahl von Monaten zurück. | `EOMONTH('1/1/11', -3)` | Startdatum, Anzahl der Monate (positiv für Zukunft, negativ für Vergangenheit). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Gibt den Stundenanteil eines Zeitwerts zurück. | `HOUR('7/18/2011 7:45:00 AM')` | Zeitwert oder Zeit-Textzeichenfolge. | 7 |
| **MINUTE** | Gibt den Minutenanteil eines Zeitwerts zurück. | `MINUTE('2/1/2011 12:45:00 PM')` | Zeitwert oder Zeit-Textzeichenfolge. | 45 |
| **ISOWEEKNUM** | Gibt die ISO-Wochennummer des Jahres für ein bestimmtes Datum zurück. | `ISOWEEKNUM('3/9/2012')` | Datumswert oder eine Datums-Textzeichenfolge. | 10 |
| **MONTH** | Gibt den Monatsanteil eines Datums zurück. | `MONTH('15-Apr-11')` | Datumswert oder eine Datums-Textzeichenfolge. | 4 |
| **NETWORKDAYS** | Zählt die Anzahl der Arbeitstage zwischen zwei Daten, ohne Wochenenden und optionale Feiertage. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Startdatum, Enddatum, optionales Array von Feiertagen. | 109 |
| **NETWORKDAYSINTL** | Zählt Arbeitstage zwischen zwei Daten mit benutzerdefinierten Wochenenden und optionalen Feiertagen. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Startdatum, Enddatum, Wochenendmodus, optionales Array von Feiertagen. | 23 |
| **NOW** | Gibt das aktuelle Datum und die Uhrzeit zurück. | `NOW()` | Keine Parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Gibt den Sekundenanteil eines Zeitwerts zurück. | `SECOND('2/1/2011 4:48:18 PM')` | Zeitwert oder Zeit-Textzeichenfolge. | 18 |
| **TIME** | Erstellt einen Zeitwert aus der angegebenen Stunde, Minute und Sekunde. | `TIME(16, 48, 10)` | Stunde (0-23), Minute (0-59), Sekunde (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Wandelt eine Zeit im Textformat in eine Zeit-Seriennummer um. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Textzeichenfolge, die eine Zeit darstellt. | 0.2743055555555556 |
| **TODAY** | Gibt das aktuelle Datum zurück. | `TODAY()` | Keine Parameter. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Gibt die Zahl zurück, die dem Wochentag entspricht. | `WEEKDAY('2/14/2008', 3)` | Datumswert oder eine Datums-Textzeichenfolge, Rückgabetyp (1-3). | 3 |
| **YEAR** | Gibt den Jahresanteil eines Datums zurück. | `YEAR('7/5/2008')` | Datumswert oder eine Datums-Textzeichenfolge. | 2008 |
| **WEEKNUM** | Gibt die Wochennummer eines Jahres für ein bestimmtes Datum zurück. | `WEEKNUM('3/9/2012', 2)` | Datumswert oder eine Datums-Textzeichenfolge, optionaler Wochenstarttag (1=Sonntag, 2=Montag). | 11 |
| **WORKDAY** | Gibt das Datum vor oder nach einer bestimmten Anzahl von Arbeitstagen zurück, ohne Wochenenden und optionale Feiertage. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Startdatum, Anzahl der Arbeitstage, optionales Array von Feiertagen. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Gibt das Datum vor oder nach einer Anzahl von Arbeitstagen mit benutzerdefinierten Wochenenden und optionalen Feiertagen zurück. | `WORKDAYINTL('1/1/2012', 30, 17)` | Startdatum, Anzahl der Arbeitstage, Wochenendmodus. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Berechnet den Bruchteil eines Jahres zwischen zwei Daten. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Startdatum, Enddatum, optionale Basis (Tagezählungsmethode). | 0.5780821917808219 |

### Finanzen

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Berechnet die aufgelaufenen Zinsen für ein Wertpapier, das periodische Zinsen zahlt. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Ausgabedatum, Datum der ersten Zinszahlung, Abrechnungsdatum, Jahressatz, Nennwert, Häufigkeit, Basis. | 350 |
| **CUMIPMT** | Berechnet die kumulierten Zinsen, die für eine Reihe von Zahlungen gezahlt wurden. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Zinssatz, Gesamtperioden, Barwert, Startperiode, Endperiode, Zahlungstyp (0=Ende, 1=Beginn). | -9916.77251395708 |
| **CUMPRINC** | Berechnet das kumulierte Kapital, das für eine Reihe von Zahlungen gezahlt wurde. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Zinssatz, Gesamtperioden, Barwert, Startperiode, Endperiode, Zahlungstyp (0=Ende, 1=Beginn). | -614.0863271085149 |
| **DB** | Berechnet die Abschreibung mit der degressiven Doppelraten-Methode (fester Satz). | `DB(1000000, 100000, 6, 1, 6)` | Kosten, Restwert, Nutzungsdauer, Periode, Monat. | 159500 |
| **DDB** | Berechnet die Abschreibung mit der degressiven Doppelraten-Methode oder einer anderen angegebenen Methode. | `DDB(1000000, 100000, 6, 1, 1.5)` | Kosten, Restwert, Nutzungsdauer, Periode, Faktor. | 250000 |
| **DOLLARDE** | Wandelt einen als Bruch ausgedrückten Preis in eine Dezimalzahl um. | `DOLLARDE(1.1, 16)` | Preis als Bruch-Dollar, Nenner. | 1.625 |
| **DOLLARFR** | Wandelt einen als Dezimalzahl ausgedrückten Preis in einen Bruch um. | `DOLLARFR(1.625, 16)` | Preis als Dezimal-Dollar, Nenner. | 1.1 |
| **EFFECT** | Berechnet den effektiven Jahreszins. | `EFFECT(0.1, 4)` | Nomineller Jahressatz, Anzahl der Zinsperioden pro Jahr. | 0.10381289062499977 |
| **FV** | Berechnet den Zukunftswert einer Investition. | `FV(0.1/12, 10, -100, -1000, 0)` | Zinssatz pro Periode, Anzahl der Perioden, Zahlung pro Periode, Barwert, Zahlungstyp (0=Ende, 1=Beginn). | 2124.874409194097 |
| **FVSCHEDULE** | Berechnet den Zukunftswert des Kapitals unter Verwendung einer Reihe von Zinseszinssätzen. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Kapital, Array von Zinssätzen. | 133.08900000000003 |
| **IPMT** | Berechnet die Zinszahlung für einen bestimmten Zeitraum. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Zinssatz pro Periode, Periode, Gesamtperioden, Barwert, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn). | 928.8235718400465 |
| **IRR** | Berechnet den internen Zinsfuß. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array von Cashflows, Schätzwert. | 0.05715142887178447 |
| **ISPMT** | Berechnet die während eines bestimmten Zeitraums gezahlten Zinsen (für Kredite). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Zinssatz pro Periode, Periode, Gesamtperioden, Kreditbetrag. | -625 |
| **MIRR** | Berechnet den modifizierten internen Zinsfuß. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array von Cashflows, Finanzierungssatz, Reinvestitionssatz. | 0.07971710360838036 |
| **NOMINAL** | Berechnet den nominellen Jahreszins. | `NOMINAL(0.1, 4)` | Effektiver Jahressatz, Anzahl der Zinsperioden pro Jahr. | 0.09645475633778045 |
| **NPER** | Berechnet die Anzahl der Perioden, die erforderlich sind, um einen Zielwert zu erreichen. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Zinssatz pro Periode, Zahlung pro Periode, Barwert, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn). | 63.39385422740764 |
| **NPV** | Berechnet den Nettobarwert einer Reihe zukünftiger Cashflows. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Abzinsungssatz pro Periode, Array von Cashflows. | 1031.3503176012546 |
| **PDURATION** | Berechnet die Zeit, die erforderlich ist, um einen gewünschten Wert zu erreichen. | `PDURATION(0.1, 1000, 2000)` | Zinssatz pro Periode, Barwert, Zukunftswert. | 7.272540897341714 |
| **PMT** | Berechnet die periodische Zahlung für einen Kredit. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Zinssatz pro Periode, Gesamtperioden, Barwert, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn). | -42426.08563793503 |
| **PPMT** | Berechnet die Tilgungszahlung für einen bestimmten Zeitraum. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Zinssatz pro Periode, Periode, Gesamtperioden, Barwert, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn). | -43354.909209775076 |
| **PV** | Berechnet den Barwert einer Investition. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Zinssatz pro Periode, Anzahl der Perioden, Zahlung pro Periode, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn). | -29864.950264779152 |
| **RATE** | Berechnet den Zinssatz pro Periode. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Gesamtperioden, Zahlung pro Periode, Barwert, Zukunftswert, Zahlungstyp (0=Ende, 1=Beginn), Schätzwert. | 0.06517891177181533 |

### Technik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Wandelt eine Binärzahl in eine Dezimalzahl um. | `BIN2DEC(101010)` | Binärzahl. | 42 |
| **BIN2HEX** | Wandelt eine Binärzahl in eine Hexadezimalzahl um. | `BIN2HEX(101010)` | Binärzahl. | 2a |
| **BIN2OCT** | Wandelt eine Binärzahl in eine Oktalzahl um. | `BIN2OCT(101010)` | Binärzahl. | 52 |
| **BITAND** | Gibt das bitweise UND zweier Zahlen zurück. | `BITAND(42, 24)` | Ganzzahl, Ganzzahl. | 8 |
| **BITLSHIFT** | Führt eine bitweise Linksverschiebung aus. | `BITLSHIFT(42, 24)` | Ganzzahl, Anzahl der zu verschiebenden Bits. | 704643072 |
| **BITOR** | Gibt das bitweise ODER zweier Zahlen zurück. | `BITOR(42, 24)` | Ganzzahl, Ganzzahl. | 58 |
| **BITRSHIFT** | Führt eine bitweise Rechtsverschiebung aus. | `BITRSHIFT(42, 2)` | Ganzzahl, Anzahl der zu verschiebenden Bits. | 10 |
| **BITXOR** | Gibt das bitweise EXKLUSIV-ODER zweier Zahlen zurück. | `BITXOR(42, 24)` | Ganzzahl, Ganzzahl. | 50 |
| **COMPLEX** | Erstellt eine komplexe Zahl. | `COMPLEX(3, 4)` | Realteil, Imaginärteil. | 3+4i |
| **CONVERT** | Wandelt eine Zahl von einer Maßeinheit in eine andere um. | `CONVERT(64, 'kibyte', 'bit')` | Wert, von Einheit, zu Einheit. | 524288 |
| **DEC2BIN** | Wandelt eine Dezimalzahl in eine Binärzahl um. | `DEC2BIN(42)` | Dezimalzahl. | 101010 |
| **DEC2HEX** | Wandelt eine Dezimalzahl in eine Hexadezimalzahl um. | `DEC2HEX(42)` | Dezimalzahl. | 2a |
| **DEC2OCT** | Wandelt eine Dezimalzahl in eine Oktalzahl um. | `DEC2OCT(42)` | Dezimalzahl. | 52 |
| **DELTA** | Prüft, ob zwei Werte gleich sind. | `DELTA(42, 42)` | Zahl, Zahl. | 1 |
| **ERF** | Gibt die Gaußsche Fehlerfunktion zurück. | `ERF(1)` | Obere Grenze. | 0.8427007929497149 |
| **ERFC** | Gibt die komplementäre Gaußsche Fehlerfunktion zurück. | `ERFC(1)` | Untere Grenze. | 0.1572992070502851 |
| **GESTEP** | Prüft, ob eine Zahl größer oder gleich einem Schwellenwert ist. | `GESTEP(42, 24)` | Zahl, Schwellenwert. | 1 |
| **HEX2BIN** | Wandelt eine Hexadezimalzahl in eine Binärzahl um. | `HEX2BIN('2a')` | Hexadezimalzahl. | 101010 |
| **HEX2DEC** | Wandelt eine Hexadezimalzahl in eine Dezimalzahl um. | `HEX2DEC('2a')` | Hexadezimalzahl. | 42 |
| **HEX2OCT** | Wandelt eine Hexadezimalzahl in eine Oktalzahl um. | `HEX2OCT('2a')` | Hexadezimalzahl. | 52 |
| **IMABS** | Gibt den Absolutwert (Betrag) einer komplexen Zahl zurück. | `IMABS('3+4i')` | Komplexe Zahl. | 5 |
| **IMAGINARY** | Gibt den Imaginärteil einer komplexen Zahl zurück. | `IMAGINARY('3+4i')` | Komplexe Zahl. | 4 |
| **IMARGUMENT** | Gibt das Argument einer komplexen Zahl zurück. | `IMARGUMENT('3+4i')` | Komplexe Zahl. | 0.9272952180016122 |
| **IMCONJUGATE** | Gibt die konjugiert komplexe Zahl zurück. | `IMCONJUGATE('3+4i')` | Komplexe Zahl. | 3-4i |
| **IMCOS** | Gibt den Kosinus einer komplexen Zahl zurück. | `IMCOS('1+i')` | Komplexe Zahl. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Gibt den Hyperbelkosinus einer komplexen Zahl zurück. | `IMCOSH('1+i')` | Komplexe Zahl. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Gibt den Kotangens einer komplexen Zahl zurück. | `IMCOT('1+i')` | Komplexe Zahl. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Gibt den Kosekans einer komplexen Zahl zurück. | `IMCSC('1+i')` | Komplexe Zahl. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Gibt den Hyperbelkosekans einer komplexen Zahl zurück. | `IMCSCH('1+i')` | Komplexe Zahl. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Gibt den Quotienten zweier komplexer Zahlen zurück. | `IMDIV('1+2i', '3+4i')` | Dividend (komplexe Zahl), Divisor (komplexe Zahl). | 0.44+0.08i |
| **IMEXP** | Gibt die Exponentialfunktion einer komplexen Zahl zurück. | `IMEXP('1+i')` | Komplexe Zahl. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Gibt den natürlichen Logarithmus einer komplexen Zahl zurück. | `IMLN('1+i')` | Komplexe Zahl. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Gibt den Logarithmus zur Basis 10 einer komplexen Zahl zurück. | `IMLOG10('1+i')` | Komplexe Zahl. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Gibt den Logarithmus zur Basis 2 einer komplexen Zahl zurück. | `IMLOG2('1+i')` | Komplexe Zahl. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Gibt eine komplexe Zahl potenziert mit einer Zahl zurück. | `IMPOWER('1+i', 2)` | Komplexe Zahl, Exponent. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Gibt das Produkt von komplexen Zahlen zurück. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array von komplexen Zahlen. | -85+20i |
| **IMREAL** | Gibt den Realteil einer komplexen Zahl zurück. | `IMREAL('3+4i')` | Komplexe Zahl. | 3 |
| **IMSEC** | Gibt den Sekans einer komplexen Zahl zurück. | `IMSEC('1+i')` | Komplexe Zahl. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Gibt den Hyperbelsekans einer komplexen Zahl zurück. | `IMSECH('1+i')` | Komplexe Zahl. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Gibt den Sinus einer komplexen Zahl zurück. | `IMSIN('1+i')` | Komplexe Zahl. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Gibt den Hyperbelsinus einer komplexen Zahl zurück. | `IMSINH('1+i')` | Komplexe Zahl. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Gibt die Quadratwurzel einer komplexen Zahl zurück. | `IMSQRT('1+i')` | Komplexe Zahl. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Gibt die Differenz zweier komplexer Zahlen zurück. | `IMSUB('3+4i', '1+2i')` | Minuend (komplexe Zahl), Subtrahend (komplexe Zahl). | 2+2i |
| **IMSUM** | Gibt die Summe von komplexen Zahlen zurück. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array von komplexen Zahlen. | 9+12i |
| **IMTAN** | Gibt den Tangens einer komplexen Zahl zurück. | `IMTAN('1+i')` | Komplexe Zahl. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Wandelt eine Oktalzahl in eine Binärzahl um. | `OCT2BIN('52')` | Oktalzahl. | 101010 |
| **OCT2DEC** | Wandelt eine Oktalzahl in eine Dezimalzahl um. | `OCT2DEC('52')` | Oktalzahl. | 42 |
| **OCT2HEX** | Wandelt eine Oktalzahl in eine Hexadezimalzahl um. | `OCT2HEX('52')` | Oktalzahl. | 2a |

### Logik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Gibt nur dann WAHR zurück, wenn alle Argumente WAHR sind, andernfalls FALSCH. | `AND(true, false, true)` | Ein oder mehrere logische Werte (Boolean); die Funktion gibt nur WAHR zurück, wenn jedes Argument WAHR ist. | |
| **FALSE** | Gibt den logischen Wert FALSCH zurück. | `FALSE()` | Keine Parameter. | |
| **IF** | Gibt unterschiedliche Werte zurück, je nachdem, ob eine Bedingung WAHR oder FALSCH ist. | `IF(true, 'Hello!', 'Goodbye!')` | Bedingung, Wert wenn WAHR, Wert wenn FALSCH. | Hello! |
| **IFS** | Prüft mehrere Bedingungen und gibt das Ergebnis der ersten WAHR-Bedingung zurück. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Mehrere Paare aus Bedingung und entsprechendem Wert. | Goodbye! |
| **NOT** | Kehrt einen logischen Wert um. WAHR wird zu FALSCH und umgekehrt. | `NOT(true)` | Ein logischer Wert (Boolean). | |
| **OR** | Gibt WAHR zurück, wenn mindestens ein Argument WAHR ist, andernfalls FALSCH. | `OR(true, false, true)` | Ein oder mehrere logische Werte (Boolean); gibt WAHR zurück, wenn irgendein Argument WAHR ist. | |
| **SWITCH** | Gibt den Wert zurück, der einem Ausdruck entspricht; wenn keine Übereinstimmung vorliegt, wird der Standardwert zurückgegeben. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Ausdruck, Vergleichswert 1, Ergebnis 1, …, [Standard]. | Seven |
| **TRUE** | Gibt den logischen Wert WAHR zurück. | `TRUE()` | Keine Parameter. | |
| **XOR** | Gibt nur dann WAHR zurück, wenn eine ungerade Anzahl von Argumenten WAHR ist, andernfalls FALSCH. | `XOR(true, false, true)` | Ein oder mehrere logische Werte (Boolean); gibt WAHR zurück, wenn eine ungerade Anzahl WAHR ist. | |

### Mathematik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Gibt den Absolutwert einer Zahl zurück. | `ABS(-4)` | Zahl. | 4 |
| **ACOS** | Gibt den Arkuskosinus (in Bogenmaß) zurück. | `ACOS(-0.5)` | Zahl zwischen -1 und 1. | 2.0943951023931957 |
| **ACOSH** | Gibt den Hyperbel-Arkuskosinus zurück. | `ACOSH(10)` | Zahl größer oder gleich 1. | 2.993222846126381 |
| **ACOT** | Gibt den Arkuskotangens (in Bogenmaß) zurück. | `ACOT(2)` | Beliebige Zahl. | 0.46364760900080615 |
| **ACOTH** | Gibt den Hyperbel-Arkuskotangens zurück. | `ACOTH(6)` | Zahl, deren Absolutwert größer als 1 ist. | 0.16823611831060645 |
| **AGGREGATE** | Führt eine Aggregationsberechnung aus und ignoriert dabei Fehler oder ausgeblendete Zeilen. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Funktionsnummer, Optionen, Array1, …, ArrayN. | 10,32 |
| **ARABIC** | Wandelt eine römische Zahl in eine arabische Zahl um. | `ARABIC('MCMXII')` | Römische Zahl als Zeichenfolge. | 1912 |
| **ASIN** | Gibt den Arkussinus (in Bogenmaß) zurück. | `ASIN(-0.5)` | Zahl zwischen -1 und 1. | -0.5235987755982988 |
| **ASINH** | Gibt den Hyperbel-Arkussinus zurück. | `ASINH(-2.5)` | Beliebige Zahl. | -1.6472311463710965 |
| **ATAN** | Gibt den Arkustangens (in Bogenmaß) zurück. | `ATAN(1)` | Beliebige Zahl. | 0.7853981633974483 |
| **ATAN2** | Gibt den Arkustangens (in Bogenmaß) eines Koordinatenpaares zurück. | `ATAN2(-1, -1)` | y-Koordinate, x-Koordinate. | -2.356194490192345 |
| **ATANH** | Gibt den Hyperbel-Arkustangens zurück. | `ATANH(-0.1)` | Zahl zwischen -1 und 1. | -0.10033534773107562 |
| **BASE** | Wandelt eine Zahl in Text mit der angegebenen Basis um. | `BASE(15, 2, 10)` | Zahl, Basis, [Mindestlänge]. | 0000001111 |
| **CEILING** | Rundet eine Zahl auf das nächste Vielfache auf. | `CEILING(-5.5, 2, -1)` | Zahl, Schrittweite, [Modus]. | -6 |
| **CEILINGMATH** | Rundet eine Zahl unter Verwendung des angegebenen Vielfachen und der Richtung auf. | `CEILINGMATH(-5.5, 2, -1)` | Zahl, [Schrittweite], [Modus]. | -6 |
| **CEILINGPRECISE** | Rundet eine Zahl auf das nächste Vielfache auf, unabhängig vom Vorzeichen. | `CEILINGPRECISE(-4.1, -2)` | Zahl, [Schrittweite]. | -4 |
| **COMBIN** | Gibt die Anzahl der Kombinationen zurück. | `COMBIN(8, 2)` | Gesamtzahl der Elemente, Anzahl der gewählten Elemente. | 28 |
| **COMBINA** | Gibt die Anzahl der Kombinationen mit Wiederholungen zurück. | `COMBINA(4, 3)` | Gesamtzahl der Elemente, Anzahl der gewählten Elemente. | 20 |
| **COS** | Gibt den Kosinus (in Bogenmaß) zurück. | `COS(1)` | Winkel in Bogenmaß. | 0.5403023058681398 |
| **COSH** | Gibt den Hyperbelkosinus zurück. | `COSH(1)` | Beliebige Zahl. | 1.5430806348152437 |
| **COT** | Gibt den Kotangens (in Bogenmaß) zurück. | `COT(30)` | Winkel in Bogenmaß. | -0.15611995216165922 |
| **COTH** | Gibt den Hyperbelkotangens zurück. | `COTH(2)` | Beliebige Zahl. | 1.0373147207275482 |
| **CSC** | Gibt den Kosekans (in Bogenmaß) zurück. | `CSC(15)` | Winkel in Bogenmaß. | 1.5377805615408537 |
| **CSCH** | Gibt den Hyperbelkosekans zurück. | `CSCH(1.5)` | Beliebige Zahl. | 0.46964244059522464 |
| **DECIMAL** | Wandelt eine Zahl in Textform in eine Dezimalzahl um. | `DECIMAL('FF', 16)` | Text, Basis. | 255 |
| **ERF** | Gibt die Gaußsche Fehlerfunktion zurück. | `ERF(1)` | Obere Grenze. | 0.8427007929497149 |
| **ERFC** | Gibt die komplementäre Gaußsche Fehlerfunktion zurück. | `ERFC(1)` | Untere Grenze. | 0.1572992070502851 |
| **EVEN** | Rundet eine Zahl auf die nächste gerade Ganzzahl auf. | `EVEN(-1)` | Zahl. | -2 |
| **EXP** | Gibt e hoch eine Zahl zurück. | `EXP(1)` | Exponent. | 2.718281828459045 |
| **FACT** | Gibt die Fakultät zurück. | `FACT(5)` | Nicht-negative Ganzzahl. | 120 |
| **FACTDOUBLE** | Gibt die Doppelfakultät zurück. | `FACTDOUBLE(7)` | Nicht-negative Ganzzahl. | 105 |
| **FLOOR** | Rundet eine Zahl auf das nächste Vielfache ab. | `FLOOR(-3.1)` | Zahl, Schrittweite. | -4 |
| **FLOORMATH** | Rundet eine Zahl unter Verwendung des angegebenen Vielfachen und der Richtung ab. | `FLOORMATH(-4.1, -2, -1)` | Zahl, [Schrittweite], [Modus]. | -4 |
| **FLOORPRECISE** | Rundet eine Zahl auf das nächste Vielfache ab, unabhängig vom Vorzeichen. | `FLOORPRECISE(-3.1, -2)` | Zahl, [Schrittweite]. | -4 |
| **GCD** | Gibt den größten gemeinsamen Teiler zurück. | `GCD(24, 36, 48)` | Zwei oder mehr Ganzzahlen. | 12 |
| **INT** | Rundet eine Zahl auf die nächste Ganzzahl ab. | `INT(-8.9)` | Zahl. | -9 |
| **ISEVEN** | Prüft, ob eine Zahl gerade ist. | `ISEVEN(-2.5)` | Zahl. | |
| **ISOCEILING** | Rundet eine Zahl nach ISO-Regeln auf das nächste Vielfache auf. | `ISOCEILING(-4.1, -2)` | Zahl, [Schrittweite]. | -4 |
| **ISODD** | Prüft, ob eine Zahl ungerade ist. | `ISODD(-2.5)` | Zahl. | |
| **LCM** | Gibt das kleinste gemeinsame Vielfache zurück. | `LCM(24, 36, 48)` | Zwei oder mehr Ganzzahlen. | 144 |
| **LN** | Gibt den natürlichen Logarithmus zurück. | `LN(86)` | Positive Zahl. | 4.454347296253507 |
| **LOG** | Gibt den Logarithmus zur angegebenen Basis zurück. | `LOG(8, 2)` | Zahl, Basis. | 3 |
| **LOG10** | Gibt den Logarithmus zur Basis 10 zurück. | `LOG10(100000)` | Positive Zahl. | 5 |
| **MOD** | Gibt den Rest einer Division zurück. | `MOD(3, -2)` | Dividend, Divisor. | -1 |
| **MROUND** | Rundet eine Zahl auf das nächste Vielfache. | `MROUND(-10, -3)` | Zahl, Vielfaches. | -9 |
| **MULTINOMIAL** | Gibt den Multinomialkoeffizienten zurück. | `MULTINOMIAL(2, 3, 4)` | Zwei oder mehr nicht-negative Ganzzahlen. | 1260 |
| **ODD** | Rundet eine Zahl auf die nächste ungerade Ganzzahl auf. | `ODD(-1.5)` | Zahl. | -3 |
| **POWER** | Potenziert eine Zahl. | `POWER(5, 2)` | Basis, Exponent. | 25 |
| **PRODUCT** | Gibt das Produkt von Zahlen zurück. | `PRODUCT(5, 15, 30)` | Eine oder mehrere Zahlen. | 2250 |
| **QUOTIENT** | Gibt den ganzzahligen Teil einer Division zurück. | `QUOTIENT(-10, 3)` | Dividend, Divisor. | -3 |
| **RADIANS** | Wandelt Grad in Bogenmaß um. | `RADIANS(180)` | Grad. | 3.141592653589793 |
| **RAND** | Gibt eine zufällige reelle Zahl zwischen 0 und 1 zurück. | `RAND()` | Keine Parameter. | [Zufällige reelle Zahl zwischen 0 und 1] |
| **RANDBETWEEN** | Gibt eine zufällige Ganzzahl innerhalb eines angegebenen Bereichs zurück. | `RANDBETWEEN(-1, 1)` | Untergrenze, Obergrenze. | [Zufällige Ganzzahl zwischen Untergrenze und Obergrenze] |
| **ROUND** | Rundet eine Zahl auf die angegebene Anzahl von Stellen. | `ROUND(626.3, -3)` | Zahl, Stellen. | 1000 |
| **ROUNDDOWN** | Rundet eine Zahl in Richtung Null ab. | `ROUNDDOWN(-3.14159, 2)` | Zahl, Stellen. | -3.14 |
| **ROUNDUP** | Rundet eine Zahl von Null weg auf. | `ROUNDUP(-3.14159, 2)` | Zahl, Stellen. | -3.15 |
| **SEC** | Gibt den Sekans (in Bogenmaß) zurück. | `SEC(45)` | Winkel in Bogenmaß. | 1.9035944074044246 |
| **SECH** | Gibt den Hyperbelsekans zurück. | `SECH(45)` | Beliebige Zahl. | 5.725037161098787e-20 |
| **SIGN** | Gibt das Vorzeichen einer Zahl zurück. | `SIGN(-0.00001)` | Zahl. | -1 |
| **SIN** | Gibt den Sinus (in Bogenmaß) zurück. | `SIN(1)` | Winkel in Bogenmaß. | 0.8414709848078965 |
| **SINH** | Gibt den Hyperbelsinus zurück. | `SINH(1)` | Beliebige Zahl. | 1.1752011936438014 |
| **SQRT** | Gibt die Quadratwurzel zurück. | `SQRT(16)` | Nicht-negative Zahl. | 4 |
| **SQRTPI** | Gibt die Quadratwurzel von (Zahl * π) zurück. | `SQRTPI(2)` | Nicht-negative Zahl. | 2.5066282746310002 |
| **SUBTOTAL** | Gibt ein Teilergebnis für einen Datensatz zurück und ignoriert dabei ausgeblendete Zeilen. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Funktionsnummer, Array1, …, ArrayN. | 10,32 |
| **SUM** | Gibt die Summe von Zahlen zurück und ignoriert dabei Text. | `SUM(-5, 15, 32, 'Hello World!')` | Eine oder mehrere Zahlen. | 42 |
| **SUMIF** | Summiert Werte, die eine einzelne Bedingung erfüllen. | `SUMIF([2,4,8,16], '>5')` | Bereich, Kriterium. | 24 |
| **SUMIFS** | Summiert Werte, die mehrere Bedingungen erfüllen. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Summenbereich, Kriterienbereich 1, Kriterium 1, …, Kriterienbereich N, Kriterium N. | 12 |
| **SUMPRODUCT** | Gibt die Summe der Produkte von Array-Elementen zurück. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Zwei oder mehr Arrays. | 5 |
| **SUMSQ** | Gibt die Summe der Quadrate zurück. | `SUMSQ(3, 4)` | Eine oder mehrere Zahlen. | 25 |
| **SUMX2MY2** | Gibt die Summe der Differenzen der Quadrate entsprechender Array-Elemente zurück. | `SUMX2MY2([1,2], [3,4])` | Array1, Array2. | -20 |
| **SUMX2PY2** | Gibt die Summe der Summen der Quadrate entsprechender Array-Elemente zurück. | `SUMX2PY2([1,2], [3,4])` | Array1, Array2. | 30 |
| **SUMXMY2** | Gibt die Summe der Quadrate der Differenzen entsprechender Array-Elemente zurück. | `SUMXMY2([1,2], [3,4])` | Array1, Array2. | 8 |
| **TAN** | Gibt den Tangens (in Bogenmaß) zurück. | `TAN(1)` | Winkel in Bogenmaß. | 1.5574077246549023 |
| **TANH** | Gibt den Hyperbeltangens zurück. | `TANH(-2)` | Beliebige Zahl. | -0.9640275800758168 |
| **TRUNC** | Kürzt eine Zahl auf eine Ganzzahl, ohne zu runden. | `TRUNC(-8.9)` | Zahl, [Stellen]. | -8 |

### Statistik

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Gibt die mittlere absolute Abweichung zurück. | `AVEDEV([2,4], [8,16])` | Arrays von Zahlen, die Datenpunkte darstellen. | 4.5 |
| **AVERAGE** | Gibt das arithmetische Mittel zurück. | `AVERAGE([2,4], [8,16])` | Arrays von Zahlen, die Datenpunkte darstellen. | 7.5 |
| **AVERAGEA** | Gibt den Mittelwert von Werten zurück, einschließlich Text und logischen Werten. | `AVERAGEA([2,4], [8,16])` | Arrays von Zahlen, Text oder logischen Werten; alle nicht leeren Werte werden einbezogen. | 7.5 |
| **AVERAGEIF** | Berechnet den Mittelwert basierend auf einer einzelnen Bedingung. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Erster Parameter ist der zu prüfende Bereich, zweiter ist die Bedingung, dritter optionaler Bereich für die Mittelwertbildung. | 3.5 |
| **AVERAGEIFS** | Berechnet den Mittelwert basierend auf mehreren Bedingungen. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Erster Parameter sind die zu mittelnden Werte, gefolgt von Paaren aus Kriterienbereichen und Kriterienausdrücken. | 6 |
| **BETADIST** | Gibt die kumulierte Beta-Wahrscheinlichkeitsdichte zurück. | `BETADIST(2, 8, 10, true, 1, 3)` | Wert, Alpha, Beta, Kumulativ-Flag, A (optional), B (optional). | 0.6854705810117458 |
| **BETAINV** | Gibt die Umkehrfunktion der kumulierten Beta-Verteilung zurück. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Wahrscheinlichkeit, Alpha, Beta, A (optional), B (optional). | 1.9999999999999998 |
| **BINOMDIST** | Gibt die Wahrscheinlichkeit einer Binomialverteilung zurück. | `BINOMDIST(6, 10, 0.5, false)` | Anzahl der Erfolge, Versuche, Erfolgswahrscheinlichkeit, Kumulativ-Flag. | 0.205078125 |
| **CORREL** | Gibt den Korrelationskoeffizienten zwischen zwei Datensätzen zurück. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Zwei Arrays von Zahlen. | 0.9970544855015815 |
| **COUNT** | Zählt numerische Zellen. | `COUNT([1,2], [3,4])` | Arrays oder Bereiche von Zahlen. | 4 |
| **COUNTA** | Zählt nicht leere Zellen. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Arrays oder Bereiche beliebigen Typs. | 4 |
| **COUNTBLANK** | Zählt leere Zellen. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Arrays oder Bereiche beliebigen Typs. | 2 |
| **COUNTIF** | Zählt Zellen, die eine Bedingung erfüllen. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Bereich von Zahlen oder Text und die Bedingung. | 3 |
| **COUNTIFS** | Zählt Zellen, die mehrere Bedingungen erfüllen. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Paare aus Kriterienbereichen und Kriterienausdrücken. | 2 |
| **COVARIANCEP** | Gibt die Populationskovarianz zurück. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Zwei Arrays von Zahlen. | 5.2 |
| **COVARIANCES** | Gibt die Stichprobenkovarianz zurück. | `COVARIANCES([2,4,8], [5,11,12])` | Zwei Arrays von Zahlen. | 9.666666666666668 |
| **DEVSQ** | Gibt die Summe der Abweichungsquadrate zurück. | `DEVSQ([2,4,8,16])` | Array von Zahlen, die Datenpunkte darstellen. | 115 |
| **EXPONDIST** | Gibt die Exponentialverteilung zurück. | `EXPONDIST(0.2, 10, true)` | Wert, Lambda, Kumulativ-Flag. | 0.8646647167633873 |
| **FDIST** | Gibt die F-Wahrscheinlichkeitsverteilung zurück. | `FDIST(15.2069, 6, 4, false)` | Wert, Freiheitsgrade 1, Freiheitsgrade 2, Kumulativ-Flag. | 0.0012237917087831735 |
| **FINV** | Gibt die Umkehrfunktion der F-Verteilung zurück. | `FINV(0.01, 6, 4)` | Wahrscheinlichkeit, Freiheitsgrade 1, Freiheitsgrade 2. | 0.10930991412457851 |
| **FISHER** | Gibt die Fisher-Transformation zurück. | `FISHER(0.75)` | Zahl, die einen Korrelationskoeffizienten darstellt. | 0.9729550745276566 |
| **FISHERINV** | Gibt die Umkehrfunktion der Fisher-Transformation zurück. | `FISHERINV(0.9729550745276566)` | Zahl, die ein Ergebnis der Fisher-Transformation darstellt. | 0.75 |
| **FORECAST** | Sagt einen y-Wert für ein gegebenes x unter Verwendung bekannter x- und y-Werte voraus. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Neuer x-Wert, Array bekannter y-Werte, Array bekannter x-Werte. | 10.607253086419755 |
| **FREQUENCY** | Gibt eine Häufigkeitsverteilung zurück. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Daten-Array, Klassen-Array. | 1,2,4,2 |
| **GAMMA** | Gibt den Wert der Gamma-Funktion zurück. | `GAMMA(2.5)` | Positive Zahl. | 1.3293403919101043 |
| **GAMMALN** | Gibt den natürlichen Logarithmus der Gamma-Funktion zurück. | `GAMMALN(10)` | Positive Zahl. | 12.801827480081961 |
| **GAUSS** | Gibt die Wahrscheinlichkeit basierend auf der Standardnormalverteilung zurück. | `GAUSS(2)` | Zahl, die einen z-Wert darstellt. | 0.4772498680518208 |
| **GEOMEAN** | Gibt das geometrische Mittel zurück. | `GEOMEAN([2,4], [8,16])` | Arrays von Zahlen. | 5.656854249492381 |
| **GROWTH** | Sagt exponentielle Wachstumswerte basierend auf bekannten Daten voraus. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array bekannter y-Werte, Array bekannter x-Werte, neue x-Werte. | 32.00000000000003 |
| **HARMEAN** | Gibt das harmonische Mittel zurück. | `HARMEAN([2,4], [8,16])` | Arrays von Zahlen. | 4.266666666666667 |
| **HYPGEOMDIST** | Gibt die hypergeometrische Verteilung zurück. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Erfolge in der Stichprobe, Stichprobenumfang, Erfolge in der Grundgesamtheit, Umfang der Grundgesamtheit, Kumulativ-Flag. | 0.3632610939112487 |
| **INTERCEPT** | Gibt den Achsenabschnitt einer linearen Regressionsgeraden zurück. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array bekannter y-Werte, Array bekannter x-Werte. | 0.04838709677419217 |
| **KURT** | Gibt die Wölbung (Kurtosis) zurück. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array von Zahlen. | -0.15179963720841627 |
| **LARGE** | Gibt den k-größten Wert zurück. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array von Zahlen, k. | 5 |
| **LINEST** | Führt eine lineare Regressionsanalyse durch. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array bekannter y-Werte, Array bekannter x-Werte, zusätzliche Statistiken zurückgeben, mehr Statistiken zurückgeben. | 2,1 |
| **LOGNORMDIST** | Gibt die Lognormalverteilung zurück. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Wert, Mittelwert, Standardabweichung, Kumulativ-Flag. | 0.0390835557068005 |
| **LOGNORMINV** | Gibt die Umkehrfunktion der Lognormalverteilung zurück. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Wahrscheinlichkeit, Mittelwert, Standardabweichung, Kumulativ-Flag. | 4.000000000000001 |
| **MAX** | Gibt den Maximalwert zurück. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Arrays von Zahlen. | 0.8 |
| **MAXA** | Gibt den Maximalwert einschließlich Text und logischen Werten zurück. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 1 |
| **MEDIAN** | Gibt den Median zurück. | `MEDIAN([1,2,3], [4,5,6])` | Arrays von Zahlen. | 3.5 |
| **MIN** | Gibt den Minimalwert zurück. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Arrays von Zahlen. | 0.1 |
| **MINA** | Gibt den Minimalwert einschließlich Text und logischen Werten zurück. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 0 |
| **MODEMULT** | Gibt ein Array der am häufigsten vorkommenden Werte zurück. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array von Zahlen. | 2,3 |
| **MODESNGL** | Gibt den am häufigsten vorkommenden Einzelwert zurück. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array von Zahlen. | 2 |
| **NORMDIST** | Gibt die Normalverteilung zurück. | `NORMDIST(42, 40, 1.5, true)` | Wert, Mittelwert, Standardabweichung, Kumulativ-Flag. | 0.9087887802741321 |
| **NORMINV** | Gibt die Umkehrfunktion der Normalverteilung zurück. | `NORMINV(0.9087887802741321, 40, 1.5)` | Wahrscheinlichkeit, Mittelwert, Standardabweichung. | 42 |
| **NORMSDIST** | Gibt die Standardnormalverteilung zurück. | `NORMSDIST(1, true)` | Zahl, die einen z-Wert darstellt. | 0.8413447460685429 |
| **NORMSINV** | Gibt die Umkehrfunktion der Standardnormalverteilung zurück. | `NORMSINV(0.8413447460685429)` | Wahrscheinlichkeit. | 1.0000000000000002 |
| **PEARSON** | Gibt den Pearson-Produkt-Moment-Korrelationskoeffizienten zurück. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Zwei Arrays von Zahlen. | 0.6993786061802354 |
| **PERCENTILEEXC** | Gibt das k-te Perzentil (exklusiv) zurück. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array von Zahlen, k. | 1.5 |
| **PERCENTILEINC** | Gibt das k-te Perzentil (inklusiv) zurück. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array von Zahlen, k. | 1.9 |
| **PERCENTRANKEXC** | Gibt den Rang eines Wertes in einem Datensatz als Prozentsatz (exklusiv) zurück. | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array von Zahlen, x-Wert, Signifikanz (optional). | 0.4 |
| **PERCENTRANKINC** | Gibt den Rang eines Wertes in einem Datensatz als Prozentsatz (inklusiv) zurück. | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array von Zahlen, x-Wert, Signifikanz (optional). | 0.33 |
| **PERMUT** | Gibt die Anzahl der Permutationen zurück. | `PERMUT(100, 3)` | Gesamtanzahl n, Anzahl der gewählten Elemente k. | 970200 |
| **PERMUTATIONA** | Gibt die Anzahl der Permutationen mit Wiederholungen zurück. | `PERMUTATIONA(4, 3)` | Gesamtanzahl n, Anzahl der gewählten Elemente k. | 64 |
| **PHI** | Gibt den Wert der Dichtefunktion für die Standardnormalverteilung zurück. | `PHI(0.75)` | Zahl, die einen z-Wert darstellt. | 0.30113743215480443 |
| **POISSONDIST** | Gibt die Poisson-Verteilung zurück. | `POISSONDIST(2, 5, true)` | Anzahl der Ereignisse, Mittelwert, Kumulativ-Flag. | 0.12465201948308113 |
| **PROB** | Gibt die Summe der Wahrscheinlichkeiten zurück. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array von Werten, Array von Wahrscheinlichkeiten, Untergrenze, Obergrenze. | 0.4 |
| **QUARTILEEXC** | Gibt das Quartil eines Datensatzes (exklusiv) zurück. | `QUARTILEEXC([1,2,3,4], 1)` | Array von Zahlen, Quartil. | 1.25 |
| **QUARTILEINC** | Gibt das Quartil eines Datensatzes (inklusiv) zurück. | `QUARTILEINC([1,2,3,4], 1)` | Array von Zahlen, Quartil. | 1.75 |
| **RANKAVG** | Gibt den durchschnittlichen Rang zurück. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Zahl, Array von Zahlen, Reihenfolge (aufsteigend/absteigend). | 4.5 |
| **RANKEQ** | Gibt den Rang einer Zahl zurück. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Zahl, Array von Zahlen, Reihenfolge (aufsteigend/absteigend). | 4 |
| **RSQ** | Gibt das Bestimmtheitsmaß zurück. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Zwei Arrays von Zahlen. | 0.4891304347826088 |
| **SKEW** | Gibt die Schiefe zurück. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array von Zahlen. | 0.3595430714067974 |
| **SKEWP** | Gibt die Schiefe einer Population zurück. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array von Zahlen. | 0.303193339354144 |
| **SLOPE** | Gibt die Steigung der linearen Regressionsgeraden zurück. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array bekannter y-Werte, Array bekannter x-Werte. | 2 |
| **SMALL** | Gibt den k-kleinsten Wert zurück. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array von Zahlen, k. | 3 |
| **STANDARDIZE** | Gibt einen standardisierten Wert als z-Wert zurück. | `STANDARDIZE(42, 40, 1.5)` | Wert, Mittelwert, Standardabweichung. | 1.3333333333333333 |
| **STDEVA** | Gibt die Standardabweichung einschließlich Text und logischen Werten zurück. | `STDEVA([2,4], [8,16], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 6.013872850889572 |
| **STDEVP** | Gibt die Standardabweichung einer Population zurück. | `STDEVP([2,4], [8,16], [true, false])` | Arrays von Zahlen. | 5.361902647381804 |
| **STDEVPA** | Gibt die Standardabweichung einer Population einschließlich Text und logischen Werten zurück. | `STDEVPA([2,4], [8,16], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 5.489889697333535 |
| **STDEVS** | Gibt die Standardabweichung einer Stichprobe zurück. | `VARS([2,4], [8,16], [true, false])` | Arrays von Zahlen. | 6.191391873668904 |
| **STEYX** | Gibt den Standardfehler des geschätzten y-Wertes zurück. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array bekannter y-Werte, Array bekannter x-Werte. | 3.305718950210041 |
| **TINV** | Gibt die Umkehrfunktion der t-Verteilung zurück. | `TINV(0.9946953263673741, 1)` | Wahrscheinlichkeit, Freiheitsgrade. | 59.99999999996535 |
| **TRIMMEAN** | Gibt den Mittelwert des inneren Teils eines Datensatzes zurück. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array von Zahlen, Anteil der zu kürzenden Werte. | 3.7777777777777777 |
| **VARA** | Gibt die Varianz einschließlich Text und logischen Werten zurück. | `VARA([2,4], [8,16], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 36.16666666666667 |
| **VARP** | Gibt die Varianz einer Population zurück. | `VARP([2,4], [8,16], [true, false])` | Arrays von Zahlen. | 28.75 |
| **VARPA** | Gibt die Varianz einer Population einschließlich Text und logischen Werten zurück. | `VARPA([2,4], [8,16], [true, false])` | Arrays von Zahlen, Text oder logischen Werten. | 30.13888888888889 |
| **VARS** | Gibt die Varianz einer Stichprobe zurück. | `VARS([2,4], [8,16], [true, false])` | Arrays von Zahlen. | 38.333333333333336 |
| **WEIBULLDIST** | Gibt die Weibull-Verteilung zurück. | `WEIBULLDIST(105, 20, 100, true)` | Wert, Alpha, Beta, Kumulativ-Flag. | 0.9295813900692769 |
| **ZTEST** | Gibt den einseitigen Wahrscheinlichkeitswert eines z-Tests zurück. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array von Zahlen, hypothetischer Mittelwert. | 0.09057419685136381 |

### Text

| Funktion | Definition | Beispielaufruf | Parameter | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Wandelt eine Codezahl in das entsprechende Zeichen um. | `CHAR(65)` | Zahl, die den Zeichencode darstellt. | A |
| **CLEAN** | Entfernt alle nicht druckbaren Zeichen aus einem Text. | `CLEAN('Monthly report')` | Zu bereinigende Textzeichenfolge. | Monthly report |
| **CODE** | Gibt den numerischen Code des ersten Zeichens in einer Textzeichenfolge zurück. | `CODE('A')` | Textzeichenfolge, die ein einzelnes Zeichen enthält. | 65 |
| **CONCATENATE** | Verbindet mehrere Textzeichenfolgen zu einer Zeichenfolge. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Eine oder mehrere zu verbindende Textzeichenfolgen. | Andreas Hauser |
| **EXACT** | Prüft, ob zwei Zeichenfolgen exakt gleich sind (Groß-/Kleinschreibung beachtend). | `EXACT('Word', 'word')` | Zwei zu vergleichende Textzeichenfolgen. | |
| **FIND** | Findet die Position einer Teilzeichenfolge ab einer bestimmten Position. | `FIND('M', 'Miriam McGovern', 3)` | Zu findender Text, Quelltext, optionale Startposition. | 8 |
| **LEFT** | Gibt eine angegebene Anzahl von Zeichen von der linken Seite einer Zeichenfolge zurück. | `LEFT('Sale Price', 4)` | Textzeichenfolge und Anzahl der Zeichen. | Sale |
| **LEN** | Gibt die Anzahl der Zeichen in einer Textzeichenfolge zurück. | `LEN('Phoenix, AZ')` | Zu zählende Textzeichenfolge. | 11 |
| **LOWER** | Wandelt alle Zeichen in Kleinschreibung um. | `LOWER('E. E. Cummings')` | Umzuwandelnde Textzeichenfolge. | e. e. cummings |
| **MID** | Gibt eine angegebene Anzahl von Zeichen aus der Mitte einer Zeichenfolge zurück. | `MID('Fluid Flow', 7, 20)` | Textzeichenfolge, Startposition, Anzahl der Zeichen. | Flow |
| **NUMBERVALUE** | Wandelt Text unter Verwendung angegebener Trennzeichen in eine Zahl um. | `NUMBERVALUE('2.500,27', ',', '.')` | Textzeichenfolge, Dezimaltrennzeichen, Gruppentrennzeichen. | 2500.27 |
| **PROPER** | Schreibt den ersten Buchstaben jedes Wortes groß. | `PROPER('this is a TITLE')` | Zu formatierende Textzeichenfolge. | This Is A Title |
| **REPLACE** | Ersetzt einen Teil einer Textzeichenfolge durch neuen Text. | `REPLACE('abcdefghijk', 6, 5, '*')` | Originaltext, Startposition, Anzahl der Zeichen, neuer Text. | abcde*k |
| **REPT** | Wiederholt Text eine angegebene Anzahl von Malen. | `REPT('*-', 3)` | Textzeichenfolge und Wiederholungsanzahl. | *-*-*- |
| **RIGHT** | Gibt eine angegebene Anzahl von Zeichen von der rechten Seite einer Zeichenfolge zurück. | `RIGHT('Sale Price', 5)` | Textzeichenfolge und Anzahl der Zeichen. | Price |
| **ROMAN** | Wandelt eine arabische Zahl in römische Zahlen um. | `ROMAN(499)` | Umzuwandelnde arabische Zahl. | CDXCIX |
| **SEARCH** | Findet die Position einer Teilzeichenfolge (Groß-/Kleinschreibung ignorierend). | `SEARCH('margin', 'Profit Margin')` | Zu findender Text, Quelltext. | 8 |
| **SUBSTITUTE** | Ersetzt eine bestimmte Instanz von altem Text durch neuen Text. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Originaltext, alter Text, neuer Text, optionale Instanznummer. | Quarter 1, 2012 |
| **T** | Gibt den Text zurück, wenn der Wert Text ist; andernfalls wird eine leere Zeichenfolge zurückgegeben. | `T('Rainfall')` | Argument kann jeder Datentyp sein. | Rainfall |
| **TRIM** | Entfernt Leerzeichen aus Text, außer einzelnen Leerzeichen zwischen Wörtern. | `TRIM(' First Quarter Earnings ')` | Zu kürzende Textzeichenfolge. | First Quarter Earnings |
| **TEXTJOIN** | Verbindet mehrere Textelemente unter Verwendung eines Trennzeichens zu einer Zeichenfolge. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Trennzeichen, Flag zum Ignorieren leerer Werte, zu verbindende Textelemente. | The sun will come up tomorrow. |
| **UNICHAR** | Gibt das Zeichen für eine angegebene Unicode-Nummer zurück. | `UNICHAR(66)` | Unicode-Codepunkt. | B |
| **UNICODE** | Gibt die Unicode-Nummer des ersten Zeichens eines Textes zurück. | `UNICODE('B')` | Textzeichenfolge, die ein einzelnes Zeichen enthält. | 66 |
| **UPPER** | Wandelt alle Zeichen in Großschreibung um. | `UPPER('total')` | Umzuwandelnde Textzeichenfolge. | TOTAL |