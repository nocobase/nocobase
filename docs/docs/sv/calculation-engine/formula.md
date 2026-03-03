:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) tillhandahåller en stor samling Excel-kompatibla funktioner.

## Funktionsreferens

### Datum

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Skapar ett datum baserat på angivet år, månad och dag. | `DATE(2008, 7, 8)` | År (heltal), månad (1-12), dag (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Konverterar ett datum i textformat till ett serienummer för datum. | `DATEVALUE('8/22/2011')` | Textsträng som representerar ett datum. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Returnerar dagsdelen av ett datum. | `DAY('15-Apr-11')` | Datumvärde eller en textsträng med ett datum. | 15 |
| **DAYS** | Beräknar antalet dagar mellan två datum. | `DAYS('3/15/11', '2/1/11')` | Slutdatum, startdatum. | 42 |
| **DAYS360** | Beräknar antalet dagar mellan två datum baserat på ett 360-dagarsår. | `DAYS360('1-Jan-11', '31-Dec-11')` | Startdatum, slutdatum. | 360 |
| **EDATE** | Returnerar datumet som infaller ett angivet antal månader före eller efter ett datum. | `EDATE('1/15/11', -1)` | Startdatum, antal månader (positivt för framtid, negativt för dåtid). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Returnerar sista dagen i månaden före eller efter ett angivet antal månader. | `EOMONTH('1/1/11', -3)` | Startdatum, antal månader (positivt för framtid, negativt för dåtid). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Returnerar timdelen av ett tidsvärde. | `HOUR('7/18/2011 7:45:00 AM')` | Tidsvärde eller textsträng med en tid. | 7 |
| **MINUTE** | Returnerar minutdelen av ett tidsvärde. | `MINUTE('2/1/2011 12:45:00 PM')` | Tidsvärde eller textsträng med en tid. | 45 |
| **ISOWEEKNUM** | Returnerar ISO-veckonumret för ett givet datum. | `ISOWEEKNUM('3/9/2012')` | Datumvärde eller en textsträng med ett datum. | 10 |
| **MONTH** | Returnerar månadsdelen av ett datum. | `MONTH('15-Apr-11')` | Datumvärde eller en textsträng med ett datum. | 4 |
| **NETWORKDAYS** | Beräknar antalet arbetsdagar mellan två datum, exklusive helger och valfria helgdagar. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Startdatum, slutdatum, valfri array med helgdagar. | 109 |
| **NETWORKDAYSINTL** | Beräknar arbetsdagar mellan två datum med anpassade helger och valfria helgdagar. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Startdatum, slutdatum, helgläge, valfri array med helgdagar. | 23 |
| **NOW** | Returnerar aktuellt datum och tid. | `NOW()` | Inga parametrar. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Returnerar sekunddelen av ett tidsvärde. | `SECOND('2/1/2011 4:48:18 PM')` | Tidsvärde eller textsträng med en tid. | 18 |
| **TIME** | Skapar ett tidsvärde från angiven timme, minut och sekund. | `TIME(16, 48, 10)` | Timme (0-23), minut (0-59), sekund (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Konverterar en tid i textformat till ett serienummer för tid. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Textsträng som representerar en tid. | 0.2743055555555556 |
| **TODAY** | Returnerar dagens datum. | `TODAY()` | Inga parametrar. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Returnerar numret som motsvarar veckodagen. | `WEEKDAY('2/14/2008', 3)` | Datumvärde eller textsträng med datum, returtyp (1-3). | 3 |
| **YEAR** | Returnerar årsdelen av ett datum. | `YEAR('7/5/2008')` | Datumvärde eller textsträng med datum. | 2008 |
| **WEEKNUM** | Returnerar veckonumret för ett givet datum. | `WEEKNUM('3/9/2012', 2)` | Datumvärde eller textsträng med datum, valfri startdag för veckan (1=söndag, 2=måndag). | 11 |
| **WORKDAY** | Returnerar datumet före eller efter ett angivet antal arbetsdagar, exklusive helger och valfria helgdagar. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Startdatum, antal arbetsdagar, valfri array med helgdagar. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Returnerar datumet före eller efter ett antal arbetsdagar med anpassade helger och valfria helgdagar. | `WORKDAYINTL('1/1/2012', 30, 17)` | Startdatum, antal arbetsdagar, helgläge. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Beräknar andelen av ett år mellan två datum. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Startdatum, slutdatum, valfri bas (dagberäkningsbas). | 0.5780821917808219 |

### Ekonomi

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Beräknar upplupen ränta för ett värdepapper med periodisk ränta. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Emissionsdag, första räntebetalning, likviddag, årsränta, nominellt värde, frekvens, bas. | 350 |
| **CUMIPMT** | Beräknar den ackumulerade räntan som betalats under en serie betalningar. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Ränta, totalt antal perioder, nuvärde, startperiod, slutperiod, betalningstyp (0=slutet, 1=början). | -9916.77251395708 |
| **CUMPRINC** | Beräknar det ackumulerade kapitalbeloppet som betalats under en serie betalningar. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Ränta, totalt antal perioder, nuvärde, startperiod, slutperiod, betalningstyp (0=slutet, 1=början). | -614.0863271085149 |
| **DB** | Beräknar avskrivning enligt metoden för fast degressiv avskrivning. | `DB(1000000, 100000, 6, 1, 6)` | Kostnad, restvärde, livslängd, period, månad. | 159500 |
| **DDB** | Beräknar avskrivning enligt metoden för dubbelt degressiv avskrivning eller annan angiven metod. | `DDB(1000000, 100000, 6, 1, 1.5)` | Kostnad, restvärde, livslängd, period, faktor. | 250000 |
| **DOLLARDE** | Konverterar ett pris uttryckt som ett bråk till ett decimaltal. | `DOLLARDE(1.1, 16)` | Pris som ett bråk, nämnare. | 1.625 |
| **DOLLARFR** | Konverterar ett pris uttryckt som ett decimaltal till ett bråk. | `DOLLARFR(1.625, 16)` | Pris som ett decimaltal, nämnare. | 1.1 |
| **EFFECT** | Beräknar den effektiva årsräntan. | `EFFECT(0.1, 4)` | Nominell årsränta, antal ränteperioder per år. | 0.10381289062499977 |
| **FV** | Beräknar framtida värde av en investering. | `FV(0.1/12, 10, -100, -1000, 0)` | Ränta per period, antal perioder, betalning per period, nuvärde, betalningstyp (0=slutet, 1=början). | 2124.874409194097 |
| **FVSCHEDULE** | Beräknar det framtida värdet av ett startkapital med en serie sammansatta räntesatser. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Startkapital, array med räntesatser. | 133.08900000000003 |
| **IPMT** | Beräknar räntebetalningen för en specifik period. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Ränta per period, period, totalt antal perioder, nuvärde, framtida värde, betalningstyp (0=slutet, 1=början). | 928.8235718400465 |
| **IRR** | Beräknar internräntan. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array med kassaflöden, gissning. | 0.05715142887178447 |
| **ISPMT** | Beräknar räntan som betalats under en specifik period (för lån). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Ränta per period, period, totalt antal perioder, lånebelopp. | -625 |
| **MIRR** | Beräknar den modifierade internräntan. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array med kassaflöden, finansieringsränta, återinvesteringsränta. | 0.07971710360838036 |
| **NOMINAL** | Beräknar den nominella årsräntan. | `NOMINAL(0.1, 4)` | Effektiv årsränta, antal ränteperioder per år. | 0.09645475633778045 |
| **NPER** | Beräknar antalet perioder som krävs för att nå ett målvärde. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Ränta per period, betalning per period, nuvärde, framtida värde, betalningstyp (0=slutet, 1=början). | 63.39385422740764 |
| **NPV** | Beräknar nuvärdet av en serie framtida kassaflöden. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Diskonteringsränta per period, array med kassaflöden. | 1031.3503176012546 |
| **PDURATION** | Beräknar tiden som krävs för att nå ett önskat värde. | `PDURATION(0.1, 1000, 2000)` | Ränta per period, nuvärde, framtida värde. | 7.272540897341714 |
| **PMT** | Beräknar den periodiska betalningen för ett lån. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Ränta per period, totalt antal perioder, nuvärde, framtida värde, betalningstyp (0=slutet, 1=början). | -42426.08563793503 |
| **PPMT** | Beräknar amorteringen för en specifik period. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Ränta per period, period, totalt antal perioder, nuvärde, framtida värde, betalningstyp (0=slutet, 1=början). | -43354.909209775076 |
| **PV** | Beräknar nuvärdet av en investering. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Ränta per period, antal perioder, betalning per period, framtida värde, betalningstyp (0=slutet, 1=början). | -29864.950264779152 |
| **RATE** | Beräknar räntesatsen per period. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Totalt antal perioder, betalning per period, nuvärde, framtida värde, betalningstyp (0=slutet, 1=början), gissning. | 0.06517891177181533 |

### Teknik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Konverterar ett binärt tal till decimalt. | `BIN2DEC(101010)` | Binärt tal. | 42 |
| **BIN2HEX** | Konverterar ett binärt tal till hexadecimalt. | `BIN2HEX(101010)` | Binärt tal. | 2a |
| **BIN2OCT** | Konverterar ett binärt tal till oktalt. | `BIN2OCT(101010)` | Binärt tal. | 52 |
| **BITAND** | Returnerar bitvis AND för två tal. | `BITAND(42, 24)` | Heltal, heltal. | 8 |
| **BITLSHIFT** | Utför en bitvis vänsterskiftning. | `BITLSHIFT(42, 24)` | Heltal, antal bitar att skifta. | 704643072 |
| **BITOR** | Returnerar bitvis OR för två tal. | `BITOR(42, 24)` | Heltal, heltal. | 58 |
| **BITRSHIFT** | Utför en bitvis högerskiftning. | `BITRSHIFT(42, 2)` | Heltal, antal bitar att skifta. | 10 |
| **BITXOR** | Returnerar bitvis XOR för två tal. | `BITXOR(42, 24)` | Heltal, heltal. | 50 |
| **COMPLEX** | Skapar ett komplext tal. | `COMPLEX(3, 4)` | Real del, imaginär del. | 3+4i |
| **CONVERT** | Konverterar ett tal från en måttenhet till en annan. | `CONVERT(64, 'kibyte', 'bit')` | Värde, från enhet, till enhet. | 524288 |
| **DEC2BIN** | Konverterar ett decimalt tal till binärt. | `DEC2BIN(42)` | Decimalt tal. | 101010 |
| **DEC2HEX** | Konverterar ett decimalt tal till hexadecimalt. | `DEC2HEX(42)` | Decimalt tal. | 2a |
| **DEC2OCT** | Konverterar ett decimalt tal till oktalt. | `DEC2OCT(42)` | Decimalt tal. | 52 |
| **DELTA** | Testar om två värden är lika. | `DELTA(42, 42)` | Tal, tal. | 1 |
| **ERF** | Returnerar felmarginalfunktionen. | `ERF(1)` | Övre gräns. | 0.8427007929497149 |
| **ERFC** | Returnerar den komplementära felmarginalfunktionen. | `ERFC(1)` | Undre gräns. | 0.1572992070502851 |
| **GESTEP** | Testar om ett tal är större än eller lika med ett tröskelvärde. | `GESTEP(42, 24)` | Tal, tröskelvärde. | 1 |
| **HEX2BIN** | Konverterar ett hexadecimalt tal till binärt. | `HEX2BIN('2a')` | Hexadecimalt tal. | 101010 |
| **HEX2DEC** | Konverterar ett hexadecimalt tal till decimalt. | `HEX2DEC('2a')` | Hexadecimalt tal. | 42 |
| **HEX2OCT** | Konverterar ett hexadecimalt tal till oktalt. | `HEX2OCT('2a')` | Hexadecimalt tal. | 52 |
| **IMABS** | Returnerar absolutbeloppet (magnituden) av ett komplext tal. | `IMABS('3+4i')` | Komplext tal. | 5 |
| **IMAGINARY** | Returnerar den imaginära delen av ett komplext tal. | `IMAGINARY('3+4i')` | Komplext tal. | 4 |
| **IMARGUMENT** | Returnerar argumentet för ett komplext tal. | `IMARGUMENT('3+4i')` | Komplext tal. | 0.9272952180016122 |
| **IMCONJUGATE** | Returnerar det komplexa konjugatet. | `IMCONJUGATE('3+4i')` | Komplext tal. | 3-4i |
| **IMCOS** | Returnerar cosinus för ett komplext tal. | `IMCOS('1+i')` | Komplext tal. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Returnerar hyperbolisk cosinus för ett komplext tal. | `IMCOSH('1+i')` | Komplext tal. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Returnerar cotangens för ett komplext tal. | `IMCOT('1+i')` | Komplext tal. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Returnerar cosekant för ett komplext tal. | `IMCSC('1+i')` | Komplext tal. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Returnerar hyperbolisk cosekant för ett komplext tal. | `IMCSCH('1+i')` | Komplext tal. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Returnerar kvoten av två komplexa tal. | `IMDIV('1+2i', '3+4i')` | Komplext tal (täljare), komplext tal (nämnare). | 0.44+0.08i |
| **IMEXP** | Returnerar exponentialfunktionen för ett komplext tal. | `IMEXP('1+i')` | Komplext tal. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Returnerar den naturliga logaritmen för ett komplext tal. | `IMLN('1+i')` | Komplext tal. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Returnerar 10-logaritmen för ett komplext tal. | `IMLOG10('1+i')` | Komplext tal. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Returnerar 2-logaritmen för ett komplext tal. | `IMLOG2('1+i')` | Komplext tal. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Returnerar ett komplext tal upphöjt till en exponent. | `IMPOWER('1+i', 2)` | Komplext tal, exponent. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Returnerar produkten av komplexa tal. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array med komplexa tal. | -85+20i |
| **IMREAL** | Returnerar den reella delen av ett komplext tal. | `IMREAL('3+4i')` | Komplext tal. | 3 |
| **IMSEC** | Returnerar sekanten för ett komplext tal. | `IMSEC('1+i')` | Komplext tal. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Returnerar den hyperboliska sekanten för ett komplext tal. | `IMSECH('1+i')` | Komplext tal. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Returnerar sinus för ett komplext tal. | `IMSIN('1+i')` | Komplext tal. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Returnerar den hyperboliska sinusen för ett komplext tal. | `IMSINH('1+i')` | Komplext tal. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Returnerar kvadratroten av ett komplext tal. | `IMSQRT('1+i')` | Komplext tal. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Returnerar differensen mellan två komplexa tal. | `IMSUB('3+4i', '1+2i')` | Komplext tal (minuend), komplext tal (subtrahend). | 2+2i |
| **IMSUM** | Returnerar summan av komplexa tal. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array med komplexa tal. | 9+12i |
| **IMTAN** | Returnerar tangens för ett komplext tal. | `IMTAN('1+i')` | Komplext tal. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Konverterar ett oktalt tal till binärt. | `OCT2BIN('52')` | Oktalt tal. | 101010 |
| **OCT2DEC** | Konverterar ett oktalt tal till decimalt. | `OCT2DEC('52')` | Oktalt tal. | 42 |
| **OCT2HEX** | Konverterar ett oktalt tal till hexadecimalt. | `OCT2HEX('52')` | Oktalt tal. | 2a |

### Logik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Returnerar SANT endast om alla argument är SANNA, annars FALSKT. | `AND(true, false, true)` | Ett eller flera logiska värden (booleska); funktionen returnerar SANT endast om varje argument är SANT. | |
| **FALSE** | Returnerar det logiska värdet FALSKT. | `FALSE()` | Inga parametrar. | |
| **IF** | Returnerar olika värden beroende på om ett villkor är SANT eller FALSKT. | `IF(true, 'Hello!', 'Goodbye!')` | Villkor, värde om SANT, värde om FALSKT. | Hello! |
| **IFS** | Utvärderar flera villkor och returnerar resultatet för det första SANNA villkoret. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Flera par av villkor och motsvarande värde. | Goodbye! |
| **NOT** | Inverterar ett logiskt värde. SANT blir FALSKT och vice versa. | `NOT(true)` | Ett logiskt värde (booleskt). | |
| **OR** | Returnerar SANT om något argument är SANT, annars FALSKT. | `OR(true, false, true)` | Ett eller flera logiska värden (booleska); returnerar SANT när något argument är SANT. | |
| **SWITCH** | Returnerar värdet som matchar ett uttryck; om ingen matchar, returneras standardvärdet. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Uttryck, matchningsvärde 1, resultat 1, ..., [standard]. | Seven |
| **TRUE** | Returnerar det logiska värdet SANT. | `TRUE()` | Inga parametrar. | |
| **XOR** | Returnerar SANT endast när ett udda antal argument är SANNA, annars FALSKT. | `XOR(true, false, true)` | Ett eller flera logiska värden (booleska); returnerar SANT när ett udda antal är SANNA. | |

### Matematik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Returnerar absolutbeloppet av ett tal. | `ABS(-4)` | Tal. | 4 |
| **ACOS** | Returnerar arccosinus (i radianer). | `ACOS(-0.5)` | Tal mellan -1 och 1. | 2.0943951023931957 |
| **ACOSH** | Returnerar den inversa hyperboliska cosinusen. | `ACOSH(10)` | Tal större än eller lika med 1. | 2.993222846126381 |
| **ACOT** | Returnerar arccotangens (i radianer). | `ACOT(2)` | Valfritt tal. | 0.46364760900080615 |
| **ACOTH** | Returnerar den inversa hyperboliska cotangensen. | `ACOTH(6)` | Tal vars absolutbelopp är större än 1. | 0.16823611831060645 |
| **AGGREGATE** | Utför en mängdberäkning och ignorerar fel eller dolda rader. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Funktionsnummer, alternativ, array1, ..., arrayN. | 10,32 |
| **ARABIC** | Konverterar en romersk siffra till arabisk. | `ARABIC('MCMXII')` | Sträng med romerska siffror. | 1912 |
| **ASIN** | Returnerar arcsinus (i radianer). | `ASIN(-0.5)` | Tal mellan -1 och 1. | -0.5235987755982988 |
| **ASINH** | Returnerar den inversa hyperboliska sinusen. | `ASINH(-2.5)` | Valfritt tal. | -1.6472311463710965 |
| **ATAN** | Returnerar arctangens (i radianer). | `ATAN(1)` | Valfritt tal. | 0.7853981633974483 |
| **ATAN2** | Returnerar arctangens (i radianer) för ett koordinatpar. | `ATAN2(-1, -1)` | y-koordinat, x-koordinat. | -2.356194490192345 |
| **ATANH** | Returnerar den inversa hyperboliska tangensen. | `ATANH(-0.1)` | Tal mellan -1 och 1. | -0.10033534773107562 |
| **BASE** | Konverterar ett tal till text i den angivna basen. | `BASE(15, 2, 10)` | Tal, bas, [minsta längd]. | 0000001111 |
| **CEILING** | Avrundar ett tal uppåt till närmaste multipel. | `CEILING(-5.5, 2, -1)` | Tal, signifikans, [läge]. | -6 |
| **CEILINGMATH** | Avrundar ett tal uppåt med angiven multipel och riktning. | `CEILINGMATH(-5.5, 2, -1)` | Tal, [signifikans], [läge]. | -6 |
| **CEILINGPRECISE** | Avrundar ett tal uppåt till närmaste multipel, oavsett tecken. | `CEILINGPRECISE(-4.1, -2)` | Tal, [signifikans]. | -4 |
| **COMBIN** | Returnerar antalet kombinationer. | `COMBIN(8, 2)` | Totalt antal objekt, antal valda. | 28 |
| **COMBINA** | Returnerar antalet kombinationer med upprepningar. | `COMBINA(4, 3)` | Totalt antal objekt, antal valda. | 20 |
| **COS** | Returnerar cosinus (i radianer). | `COS(1)` | Vinkel i radianer. | 0.5403023058681398 |
| **COSH** | Returnerar hyperbolisk cosinus. | `COSH(1)` | Valfritt tal. | 1.5430806348152437 |
| **COT** | Returnerar cotangens (i radianer). | `COT(30)` | Vinkel i radianer. | -0.15611995216165922 |
| **COTH** | Returnerar hyperbolisk cotangens. | `COTH(2)` | Valfritt tal. | 1.0373147207275482 |
| **CSC** | Returnerar cosekant (i radianer). | `CSC(15)` | Vinkel i radianer. | 1.5377805615408537 |
| **CSCH** | Returnerar hyperbolisk cosekant. | `CSCH(1.5)` | Valfritt tal. | 0.46964244059522464 |
| **DECIMAL** | Konverterar ett tal i textform till decimalt. | `DECIMAL('FF', 16)` | Text, bas. | 255 |
| **ERF** | Returnerar felmarginalfunktionen. | `ERF(1)` | Övre gräns. | 0.8427007929497149 |
| **ERFC** | Returnerar den komplementära felmarginalfunktionen. | `ERFC(1)` | Undre gräns. | 0.1572992070502851 |
| **EVEN** | Avrundar ett tal uppåt till närmaste jämna heltal. | `EVEN(-1)` | Tal. | -2 |
| **EXP** | Returnerar e upphöjt till en exponent. | `EXP(1)` | Exponent. | 2.718281828459045 |
| **FACT** | Returnerar fakulteten. | `FACT(5)` | Icke-negativt heltal. | 120 |
| **FACTDOUBLE** | Returnerar dubbelfakulteten. | `FACTDOUBLE(7)` | Icke-negativt heltal. | 105 |
| **FLOOR** | Avrundar ett tal nedåt till närmaste multipel. | `FLOOR(-3.1)` | Tal, signifikans. | -4 |
| **FLOORMATH** | Avrundar ett tal nedåt med angiven multipel och riktning. | `FLOORMATH(-4.1, -2, -1)` | Tal, [signifikans], [läge]. | -4 |
| **FLOORPRECISE** | Avrundar ett tal nedåt till närmaste multipel, oavsett tecken. | `FLOORPRECISE(-3.1, -2)` | Tal, [signifikans]. | -4 |
| **GCD** | Returnerar största gemensamma nämnare. | `GCD(24, 36, 48)` | Två eller flera heltal. | 12 |
| **INT** | Avrundar ett tal nedåt till närmaste heltal. | `INT(-8.9)` | Tal. | -9 |
| **ISEVEN** | Testar om ett tal är jämnt. | `ISEVEN(-2.5)` | Tal. | |
| **ISOCEILING** | Avrundar ett tal uppåt till närmaste multipel enligt ISO-regler. | `ISOCEILING(-4.1, -2)` | Tal, [signifikans]. | -4 |
| **ISODD** | Testar om ett tal är udda. | `ISODD(-2.5)` | Tal. | |
| **LCM** | Returnerar minsta gemensamma multipel. | `LCM(24, 36, 48)` | Två eller flera heltal. | 144 |
| **LN** | Returnerar den naturliga logaritmen. | `LN(86)` | Positivt tal. | 4.454347296253507 |
| **LOG** | Returnerar logaritmen i den angivna basen. | `LOG(8, 2)` | Tal, bas. | 3 |
| **LOG10** | Returnerar 10-logaritmen. | `LOG10(100000)` | Positivt tal. | 5 |
| **MOD** | Returnerar resten vid en division. | `MOD(3, -2)` | Täljare, nämnare. | -1 |
| **MROUND** | Avrundar ett tal till närmaste multipel. | `MROUND(-10, -3)` | Tal, multipel. | -9 |
| **MULTINOMIAL** | Returnerar multinomialkoefficienten. | `MULTINOMIAL(2, 3, 4)` | Två eller flera icke-negativa heltal. | 1260 |
| **ODD** | Avrundar ett tal uppåt till närmaste udda heltal. | `ODD(-1.5)` | Tal. | -3 |
| **POWER** | Upphöjer ett tal till en exponent. | `POWER(5, 2)` | Bas, exponent. | 25 |
| **PRODUCT** | Returnerar produkten av tal. | `PRODUCT(5, 15, 30)` | Ett eller flera tal. | 2250 |
| **QUOTIENT** | Returnerar heltalsdelen av en division. | `QUOTIENT(-10, 3)` | Täljare, nämnare. | -3 |
| **RADIANS** | Konverterar grader till radianer. | `RADIANS(180)` | Grader. | 3.141592653589793 |
| **RAND** | Returnerar ett slumpmässigt reellt tal mellan 0 och 1. | `RAND()` | Inga parametrar. | [Slumpmässigt reellt tal mellan 0 och 1] |
| **RANDBETWEEN** | Returnerar ett slumpmässigt heltal inom ett angivet intervall. | `RANDBETWEEN(-1, 1)` | Botten, topp. | [Slumpmässigt heltal mellan botten och topp] |
| **ROUND** | Avrundar ett tal till angivet antal siffror. | `ROUND(626.3, -3)` | Tal, siffror. | 1000 |
| **ROUNDDOWN** | Avrundar ett tal nedåt mot noll. | `ROUNDDOWN(-3.14159, 2)` | Tal, siffror. | -3.14 |
| **ROUNDUP** | Avrundar ett tal uppåt från noll. | `ROUNDUP(-3.14159, 2)` | Tal, siffror. | -3.15 |
| **SEC** | Returnerar sekanten (i radianer). | `SEC(45)` | Vinkel i radianer. | 1.9035944074044246 |
| **SECH** | Returnerar den hyperboliska sekanten. | `SECH(45)` | Valfritt tal. | 5.725037161098787e-20 |
| **SIGN** | Returnerar tecknet för ett tal. | `SIGN(-0.00001)` | Tal. | -1 |
| **SIN** | Returnerar sinus (i radianer). | `SIN(1)` | Vinkel i radianer. | 0.8414709848078965 |
| **SINH** | Returnerar den hyperboliska sinusen. | `SINH(1)` | Valfritt tal. | 1.1752011936438014 |
| **SQRT** | Returnerar kvadratroten. | `SQRT(16)` | Icke-negativt tal. | 4 |
| **SQRTPI** | Returnerar kvadratroten av (tal * π). | `SQRTPI(2)` | Icke-negativt tal. | 2.5066282746310002 |
| **SUBTOTAL** | Returnerar en delsumma för en datamängd och ignorerar dolda rader. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Funktionsnummer, array1, ..., arrayN. | 10,32 |
| **SUM** | Returnerar summan av tal och ignorerar text. | `SUM(-5, 15, 32, 'Hello World!')` | Ett eller flera tal. | 42 |
| **SUMIF** | Summerar värden som uppfyller ett enskilt villkor. | `SUMIF([2,4,8,16], '>5')` | Område, villkor. | 24 |
| **SUMIFS** | Summerar värden som uppfyller flera villkor. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Summaområde, villkorsområde 1, villkor 1, ..., villkorsområde N, villkor N. | 12 |
| **SUMPRODUCT** | Returnerar summan av produkterna av arrayelement. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Två eller flera arrayer. | 5 |
| **SUMSQ** | Returnerar summan av kvadraterna. | `SUMSQ(3, 4)` | Ett eller flera tal. | 25 |
| **SUMX2MY2** | Returnerar summan av differensen av kvadraterna för motsvarande arrayelement. | `SUMX2MY2([1,2], [3,4])` | Array1, array2. | -20 |
| **SUMX2PY2** | Returnerar summan av summan av kvadraterna för motsvarande arrayelement. | `SUMX2PY2([1,2], [3,4])` | Array1, array2. | 30 |
| **SUMXMY2** | Returnerar summan av kvadraterna av differenserna för motsvarande arrayelement. | `SUMXMY2([1,2], [3,4])` | Array1, array2. | 8 |
| **TAN** | Returnerar tangens (i radianer). | `TAN(1)` | Vinkel i radianer. | 1.5574077246549023 |
| **TANH** | Returnerar den hyperboliska tangensen. | `TANH(-2)` | Valfritt tal. | -0.9640275800758168 |
| **TRUNC** | Trunkerar ett tal till ett heltal utan avrundning. | `TRUNC(-8.9)` | Tal, [siffror]. | -8 |

### Statistik

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Returnerar medelavvikelsen. | `AVEDEV([2,4], [8,16])` | Arrayer med tal som representerar datapunkter. | 4.5 |
| **AVERAGE** | Returnerar det aritmetiska medelvärdet. | `AVERAGE([2,4], [8,16])` | Arrayer med tal som representerar datapunkter. | 7.5 |
| **AVERAGEA** | Returnerar medelvärdet av värden, inklusive text och logiska värden. | `AVERAGEA([2,4], [8,16])` | Arrayer med tal, text eller logiska värden; alla icke-tomma värden inkluderas. | 7.5 |
| **AVERAGEIF** | Beräknar medelvärdet baserat på ett enskilt villkor. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Första parametern är området att kontrollera, andra är villkoret, tredje valfria området används för medelvärdesberäkning. | 3.5 |
| **AVERAGEIFS** | Beräknar medelvärdet baserat på flera villkor. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Första parametern är värdena för medelvärdet, följt av par av villkorsområden och villkorsuttryck. | 6 |
| **BETADIST** | Returnerar den kumulativa betafördelningen. | `BETADIST(2, 8, 10, true, 1, 3)` | Värde, alfa, beta, kumulativ flagga, A (valfri), B (valfri). | 0.6854705810117458 |
| **BETAINV** | Returnerar inversen till den kumulativa betafördelningen. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Sannolikhet, alfa, beta, A (valfri), B (valfri). | 1.9999999999999998 |
| **BINOMDIST** | Returnerar sannolikheten för en binomialfördelning. | `BINOMDIST(6, 10, 0.5, false)` | Antal lyckade försök, försök, sannolikhet för lyckat försök, kumulativ flagga. | 0.205078125 |
| **CORREL** | Returnerar korrelationskoefficienten mellan två datamängder. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Två arrayer med tal. | 0.9970544855015815 |
| **COUNT** | Räknar numeriska celler. | `COUNT([1,2], [3,4])` | Arrayer eller områden med tal. | 4 |
| **COUNTA** | Räknar icke-tomma celler. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Arrayer eller områden av valfri typ. | 4 |
| **COUNTBLANK** | Räknar tomma celler. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Arrayer eller områden av valfri typ. | 2 |
| **COUNTIF** | Räknar celler som matchar ett villkor. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Område med tal eller text, samt villkoret. | 3 |
| **COUNTIFS** | Räknar celler som matchar flera villkor. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Par av villkorsområden och villkorsuttryck. | 2 |
| **COVARIANCEP** | Returnerar populationskovariansen. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Två arrayer med tal. | 5.2 |
| **COVARIANCES** | Returnerar urvalskovariansen. | `COVARIANCES([2,4,8], [5,11,12])` | Två arrayer med tal. | 9.666666666666668 |
| **DEVSQ** | Returnerar summan av kvadratavvikelser. | `DEVSQ([2,4,8,16])` | Array med tal som representerar datapunkter. | 115 |
| **EXPONDIST** | Returnerar exponentialfördelningen. | `EXPONDIST(0.2, 10, true)` | Värde, lambda, kumulativ flagga. | 0.8646647167633873 |
| **FDIST** | Returnerar F-sannolikhetsfördelningen. | `FDIST(15.2069, 6, 4, false)` | Värde, frihetsgrader 1, frihetsgrader 2, kumulativ flagga. | 0.0012237917087831735 |
| **FINV** | Returnerar inversen till F-fördelningen. | `FINV(0.01, 6, 4)` | Sannolikhet, frihetsgrader 1, frihetsgrader 2. | 0.10930991412457851 |
| **FISHER** | Returnerar Fisher-transformationen. | `FISHER(0.75)` | Tal som representerar en korrelationskoefficient. | 0.9729550745276566 |
| **FISHERINV** | Returnerar inversen till Fisher-transformationen. | `FISHERINV(0.9729550745276566)` | Tal som representerar ett Fisher-transformationsresultat. | 0.75 |
| **FORECAST** | Förutsäger ett y-värde för ett givet x med hjälp av kända x- och y-värden. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nytt x-värde, array med kända y-värden, array med kända x-värden. | 10.607253086419755 |
| **FREQUENCY** | Returnerar en frekvensfördelning. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Dataarray, klassgränsarray. | 1,2,4,2 |
| **GAMMA** | Returnerar gammafunktionen. | `GAMMA(2.5)` | Positivt tal. | 1.3293403919101043 |
| **GAMMALN** | Returnerar den naturliga logaritmen för gammafunktionen. | `GAMMALN(10)` | Positivt tal. | 12.801827480081961 |
| **GAUSS** | Returnerar sannolikheten baserat på standardnormalfördelningen. | `GAUSS(2)` | Tal som representerar ett z-värde. | 0.4772498680518208 |
| **GEOMEAN** | Returnerar det geometriska medelvärdet. | `GEOMEAN([2,4], [8,16])` | Arrayer med tal. | 5.656854249492381 |
| **GROWTH** | Förutsäger exponentiell tillväxt baserat på kända data. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array med kända y-värden, array med kända x-värden, nya x-värden. | 32.00000000000003 |
| **HARMEAN** | Returnerar det harmoniska medelvärdet. | `HARMEAN([2,4], [8,16])` | Arrayer med tal. | 4.266666666666667 |
| **HYPGEOMDIST** | Returnerar den hypergeometriska fördelningen. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Antal lyckade i urvalet, urvalsstorlek, antal lyckade i populationen, populationsstorlek, kumulativ flagga. | 0.3632610939112487 |
| **INTERCEPT** | Returnerar skärningspunkten för en linjär regressionslinje. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array med kända y-värden, array med kända x-värden. | 0.04838709677419217 |
| **KURT** | Returnerar kurtosis (toppighet). | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array med tal. | -0.15179963720841627 |
| **LARGE** | Returnerar det k:te största värdet. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array med tal, k. | 5 |
| **LINEST** | Utför linjär regressionsanalys. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array med kända y-värden, array med kända x-värden, returnera ytterligare statistik, returnera mer statistik. | 2,1 |
| **LOGNORMDIST** | Returnerar lognormalfördelningen. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Värde, medelvärde, standardavvikelse, kumulativ flagga. | 0.0390835557068005 |
| **LOGNORMINV** | Returnerar inversen till lognormalfördelningen. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Sannolikhet, medelvärde, standardavvikelse, kumulativ flagga. | 4.000000000000001 |
| **MAX** | Returnerar det största värdet. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Arrayer med tal. | 0.8 |
| **MAXA** | Returnerar det största värdet inklusive text och logiska värden. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Arrayer med tal, text eller logiska värden. | 1 |
| **MEDIAN** | Returnerar medianen. | `MEDIAN([1,2,3], [4,5,6])` | Arrayer med tal. | 3.5 |
| **MIN** | Returnerar det minsta värdet. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Arrayer med tal. | 0.1 |
| **MINA** | Returnerar det minsta värdet inklusive text och logiska värden. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Arrayer med tal, text eller logiska värden. | 0 |
| **MODEMULT** | Returnerar en array med de mest frekvent förekommande värdena. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array med tal. | 2,3 |
| **MODESNGL** | Returnerar det mest frekvent förekommande enskilda värdet. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array med tal. | 2 |
| **NORMDIST** | Returnerar normalfördelningen. | `NORMDIST(42, 40, 1.5, true)` | Värde, medelvärde, standardavvikelse, kumulativ flagga. | 0.9087887802741321 |
| **NORMINV** | Returnerar inversen till normalfördelningen. | `NORMINV(0.9087887802741321, 40, 1.5)` | Sannolikhet, medelvärde, standardavvikelse. | 42 |
| **NORMSDIST** | Returnerar standardnormalfördelningen. | `NORMSDIST(1, true)` | Tal som representerar ett z-värde. | 0.8413447460685429 |
| **NORMSINV** | Returnerar inversen till standardnormalfördelningen. | `NORMSINV(0.8413447460685429)` | Sannolikhet. | 1.0000000000000002 |
| **PEARSON** | Returnerar Pearsons produktmomentkorrelationskoefficient. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Två arrayer med tal. | 0.6993786061802354 |
| **PERCENTILEEXC** | Returnerar den k:te percentilen, exkluderande. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array med tal, k. | 1.5 |
| **PERCENTILEINC** | Returnerar den k:te percentilen, inkluderande. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array med tal, k. | 1.9 |
| **PERCENTRANKEXC** | Returnerar rangordningen för ett värde i en datamängd som en procentandel (exkluderande). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array med tal, x-värde, signifikans (valfri). | 0.4 |
| **PERCENTRANKINC** | Returnerar rangordningen för ett värde i en datamängd som en procentandel (inkluderande). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array med tal, x-värde, signifikans (valfri). | 0.33 |
| **PERMUT** | Returnerar antalet permutationer. | `PERMUT(100, 3)` | Totalt antal n, antal valda k. | 970200 |
| **PERMUTATIONA** | Returnerar antalet permutationer med upprepningar. | `PERMUTATIONA(4, 3)` | Totalt antal n, antal valda k. | 64 |
| **PHI** | Returnerar täthetsfunktionen för standardnormalfördelningen. | `PHI(0.75)` | Tal som representerar ett z-värde. | 0.30113743215480443 |
| **POISSONDIST** | Returnerar Poisson-fördelningen. | `POISSONDIST(2, 5, true)` | Antal händelser, medelvärde, kumulativ flagga. | 0.12465201948308113 |
| **PROB** | Returnerar summan av sannolikheter. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array med värden, array med sannolikheter, undre gräns, övre gräns. | 0.4 |
| **QUARTILEEXC** | Returnerar kvartilen för datamängden, exkluderande. | `QUARTILEEXC([1,2,3,4], 1)` | Array med tal, kvartil. | 1.25 |
| **QUARTILEINC** | Returnerar kvartilen för datamängden, inkluderande. | `QUARTILEINC([1,2,3,4], 1)` | Array med tal, kvartil. | 1.75 |
| **RANKAVG** | Returnerar genomsnittlig rangordning. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Tal, array med tal, ordning (stigande/fallande). | 4.5 |
| **RANKEQ** | Returnerar rangordningen för ett tal. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Tal, array med tal, ordning (stigande/fallande). | 4 |
| **RSQ** | Returnerar förklaringsgraden (R-kvadrat). | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Två arrayer med tal. | 0.4891304347826088 |
| **SKEW** | Returnerar skevhet. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array med tal. | 0.3595430714067974 |
| **SKEWP** | Returnerar populationsskevhet. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array med tal. | 0.303193339354144 |
| **SLOPE** | Returnerar lutningen för den linjära regressionslinjen. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array med kända y-värden, array med kända x-värden. | 2 |
| **SMALL** | Returnerar det k:te minsta värdet. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array med tal, k. | 3 |
| **STANDARDIZE** | Returnerar ett normaliserat värde som ett z-värde. | `STANDARDIZE(42, 40, 1.5)` | Värde, medelvärde, standardavvikelse. | 1.3333333333333333 |
| **STDEVA** | Returnerar standardavvikelsen, inklusive text och logiska värden. | `STDEVA([2,4], [8,16], [true, false])` | Arrayer med tal, text eller logiska värden. | 6.013872850889572 |
| **STDEVP** | Returnerar populationsstandardavvikelsen. | `STDEVP([2,4], [8,16], [true, false])` | Arrayer med tal. | 5.361902647381804 |
| **STDEVPA** | Returnerar populationsstandardavvikelsen, inklusive text och logiska värden. | `STDEVPA([2,4], [8,16], [true, false])` | Arrayer med tal, text eller logiska värden. | 5.489889697333535 |
| **STDEVS** | Returnerar urvalsstandardavvikelsen. | `VARS([2,4], [8,16], [true, false])` | Arrayer med tal. | 6.191391873668904 |
| **STEYX** | Returnerar standardfelet för det förutsagda y-värdet. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array med kända y-värden, array med kända x-värden. | 3.305718950210041 |
| **TINV** | Returnerar inversen till t-fördelningen. | `TINV(0.9946953263673741, 1)` | Sannolikhet, frihetsgrader. | 59.99999999996535 |
| **TRIMMEAN** | Returnerar medelvärdet av den inre delen av en datamängd. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array med tal, trunkeringsandel. | 3.7777777777777777 |
| **VARA** | Returnerar variansen inklusive text och logiska värden. | `VARA([2,4], [8,16], [true, false])` | Arrayer med tal, text eller logiska värden. | 36.16666666666667 |
| **VARP** | Returnerar populationsvariansen. | `VARP([2,4], [8,16], [true, false])` | Arrayer med tal. | 28.75 |
| **VARPA** | Returnerar populationsvariansen inklusive text och logiska värden. | `VARPA([2,4], [8,16], [true, false])` | Arrayer med tal, text eller logiska värden. | 30.13888888888889 |
| **VARS** | Returnerar urvalsvariansen. | `VARS([2,4], [8,16], [true, false])` | Arrayer med tal. | 38.333333333333336 |
| **WEIBULLDIST** | Returnerar Weibull-fördelningen. | `WEIBULLDIST(105, 20, 100, true)` | Värde, alfa, beta, kumulativ flagga. | 0.9295813900692769 |
| **ZTEST** | Returnerar den ensidiga sannolikheten för ett z-test. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array med tal, hypotetiskt medelvärde. | 0.09057419685136381 |

### Text

| Funktion | Definition | Exempelanrop | Parametrar | Förväntat resultat |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Konverterar en numerisk kod till motsvarande tecken. | `CHAR(65)` | Tal som representerar teckenkoden. | A |
| **CLEAN** | Tar bort alla icke-utskrivbara tecken från text. | `CLEAN('Monthly report')` | Textsträng som ska rensas. | Monthly report |
| **CODE** | Returnerar den numeriska koden för det första tecknet i en textsträng. | `CODE('A')` | Textsträng som innehåller ett enskilt tecken. | 65 |
| **CONCATENATE** | Sammanfogar flera textsträngar till en sträng. | `CONCATENATE('Andreas', ' ', 'Hauser')` | En eller flera textsträngar som ska sammanfogas. | Andreas Hauser |
| **EXACT** | Kontrollerar om två strängar är exakt likadana, skiftlägeskänsligt. | `EXACT('Word', 'word')` | Två textsträngar att jämföra. | |
| **FIND** | Hittar positionen för en delsträng med början från en given position. | `FIND('M', 'Miriam McGovern', 3)` | Text att söka efter, källtext, valfri startposition. | 8 |
| **LEFT** | Returnerar ett angivet antal tecken från vänster sida av en sträng. | `LEFT('Sale Price', 4)` | Textsträng och antal tecken. | Sale |
| **LEN** | Returnerar antalet tecken i en textsträng. | `LEN('Phoenix, AZ')` | Textsträng att räkna. | 11 |
| **LOWER** | Konverterar alla tecken till gemener. | `LOWER('E. E. Cummings')` | Textsträng att konvertera. | e. e. cummings |
| **MID** | Returnerar ett angivet antal tecken från mitten av en sträng. | `MID('Fluid Flow', 7, 20)` | Textsträng, startposition, antal tecken. | Flow |
| **NUMBERVALUE** | Konverterar text till ett tal med angivna separatorer. | `NUMBERVALUE('2.500,27', ',', '.')` | Textsträng, decimaltecken, tusentalsavgränsare. | 2500.27 |
| **PROPER** | Gör första bokstaven i varje ord till stor bokstav. | `PROPER('this is a TITLE')` | Textsträng att formatera. | This Is A Title |
| **REPLACE** | Ersätter en del av en textsträng med ny text. | `REPLACE('abcdefghijk', 6, 5, '*')` | Ursprunglig text, startposition, antal tecken, ny text. | abcde*k |
| **REPT** | Upprepar text ett angivet antal gånger. | `REPT('*-', 3)` | Textsträng och antal upprepningar. | *-*-*- |
| **RIGHT** | Returnerar ett angivet antal tecken från höger sida av en sträng. | `RIGHT('Sale Price', 5)` | Textsträng och antal tecken. | Price |
| **ROMAN** | Konverterar en arabisk siffra till romerska siffror. | `ROMAN(499)` | Arabiskt tal att konvertera. | CDXCIX |
| **SEARCH** | Hittar positionen för en delsträng, ej skiftlägeskänsligt. | `SEARCH('margin', 'Profit Margin')` | Text att söka efter, källtext. | 8 |
| **SUBSTITUTE** | Ersätter en specifik instans av gammal text med ny text. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Ursprunglig text, gammal text, ny text, valfritt instansnummer. | Quarter 1, 2012 |
| **T** | Returnerar texten om värdet är text; annars returneras en tom sträng. | `T('Rainfall')` | Argumentet kan vara vilken datatyp som helst. | Rainfall |
| **TRIM** | Tar bort mellanslag från text förutom enkla mellanslag mellan ord. | `TRIM(' First Quarter Earnings ')` | Textsträng att trimma. | First Quarter Earnings |
| **TEXTJOIN** | Sammanfogar flera textobjekt till en sträng med ett avgränsningstecken. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Avgränsare, flagga för att ignorera tomma, textobjekt att sammanfoga. | The sun will come up tomorrow. |
| **UNICHAR** | Returnerar tecknet för ett givet Unicode-nummer. | `UNICHAR(66)` | Unicode-kodpunkt. | B |
| **UNICODE** | Returnerar Unicode-numret för det första tecknet i texten. | `UNICODE('B')` | Textsträng som innehåller ett enskilt tecken. | 66 |
| **UPPER** | Konverterar alla tecken till versaler. | `UPPER('total')` | Textsträng att konvertera. | TOTAL |