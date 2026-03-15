:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/calculation-engine/formula) voor nauwkeurige informatie.
:::

# Formula.js

[Formula.js](http://formulajs.info/) biedt een grote verzameling functies die compatibel zijn met Excel.

## Functiereferentie

### Datum

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Maakt een datum op basis van het opgegeven jaar, de maand en de dag. | `DATE(2008, 7, 8)` | Jaar (geheel getal), maand (1-12), dag (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Converteert een datum in tekstformaat naar een serieel getal voor de datum. | `DATEVALUE('8/22/2011')` | Tekstreeks die een datum vertegenwoordigt. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Retourneert het daggedeelte van een datum. | `DAY('15-Apr-11')` | Datumwaarde of een tekstreeks voor de datum. | 15 |
| **DAYS** | Berekent het aantal dagen tussen twee datums. | `DAYS('3/15/11', '2/1/11')` | Einddatum, begindatum. | 42 |
| **DAYS360** | Berekent het aantal dagen tussen twee datums op basis van een jaar van 360 dagen. | `DAYS360('1-Jan-11', '31-Dec-11')` | Begindatum, einddatum. | 360 |
| **EDATE** | Retourneert de datum die een opgegeven aantal maanden voor of na een datum ligt. | `EDATE('1/15/11', -1)` | Begindatum, aantal maanden (positief voor de toekomst, negatief voor het verleden). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Retourneert de laatste dag van de maand voor of na het opgegeven aantal maanden. | `EOMONTH('1/1/11', -3)` | Begindatum, aantal maanden (positief voor de toekomst, negatief voor het verleden). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Retourneert het uurgedeelte van een tijdwaarde. | `HOUR('7/18/2011 7:45:00 AM')` | Tijdwaarde of tekstreeks voor de tijd. | 7 |
| **MINUTE** | Retourneert het minutengedeelte van een tijdwaarde. | `MINUTE('2/1/2011 12:45:00 PM')` | Tijdwaarde of tekstreeks voor de tijd. | 45 |
| **ISOWEEKNUM** | Retourneert het ISO-weeknummer van het jaar voor een bepaalde datum. | `ISOWEEKNUM('3/9/2012')` | Datumwaarde of een tekstreeks voor de datum. | 10 |
| **MONTH** | Retourneert het maandgedeelte van een datum. | `MONTH('15-Apr-11')` | Datumwaarde of een tekstreeks voor de datum. | 4 |
| **NETWORKDAYS** | Telt het aantal werkdagen tussen twee datums, exclusief weekenden en optionele feestdagen. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Begindatum, einddatum, optionele array van feestdagen. | 109 |
| **NETWORKDAYSINTL** | Telt werkdagen tussen twee datums, met aangepaste weekenden en optionele feestdagen. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Begindatum, einddatum, weekendmodus, optionele array van feestdagen. | 23 |
| **NOW** | Retourneert de huidige datum en tijd. | `NOW()` | Geen parameters. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Retourneert het secondengedeelte van een tijdwaarde. | `SECOND('2/1/2011 4:48:18 PM')` | Tijdwaarde of tekstreeks voor de tijd. | 18 |
| **TIME** | Bouwt een tijdwaarde op basis van het opgegeven uur, de minuut en de seconde. | `TIME(16, 48, 10)` | Uur (0-23), minuut (0-59), seconde (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Converteert een tijd in tekstformaat naar een serieel getal voor de tijd. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Tekstreeks die een tijd vertegenwoordigt. | 0.2743055555555556 |
| **TODAY** | Retourneert de huidige datum. | `TODAY()` | Geen parameters. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Retourneert het getal dat overeenkomt met de dag van de week. | `WEEKDAY('2/14/2008', 3)` | Datumwaarde of een tekstreeks voor de datum, retourtype (1-3). | 3 |
| **YEAR** | Retourneert het jaargedeelte van een datum. | `YEAR('7/5/2008')` | Datumwaarde of een tekstreeks voor de datum. | 2008 |
| **WEEKNUM** | Retourneert het weeknummer in een jaar voor een bepaalde datum. | `WEEKNUM('3/9/2012', 2)` | Datumwaarde of een tekstreeks voor de datum, optionele begindag van de week (1=zondag, 2=maandag). | 11 |
| **WORKDAY** | Retourneert de datum voor of na een bepaald aantal werkdagen, exclusief weekenden en optionele feestdagen. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Begindatum, aantal werkdagen, optionele array van feestdagen. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Retourneert de datum voor of na een aantal werkdagen met aangepaste weekenden en optionele feestdagen. | `WORKDAYINTL('1/1/2012', 30, 17)` | Begindatum, aantal werkdagen, weekendmodus. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Berekent het fractie-aantal jaren tussen twee datums. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Begindatum, einddatum, optionele basis (dagtellingsbasis). | 0.5780821917808219 |

### Financieel

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Berekent de opgelopen rente voor een effect dat periodieke rente betaalt. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Uitgiftedatum, eerste rentedatum, afwikkelingsdatum, jaarlijkse rentevoet, nominale waarde, frequentie, basis. | 350 |
| **CUMIPMT** | Berekent de cumulatieve rente betaald over een reeks betalingen. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Rentevoet, totaal aantal perioden, huidige waarde, beginperiode, eindperiode, betalingstype (0=einde, 1=begin). | -9916.77251395708 |
| **CUMPRINC** | Berekent de cumulatieve hoofdsom betaald over een reeks betalingen. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Rentevoet, totaal aantal perioden, huidige waarde, beginperiode, eindperiode, betalingstype (0=einde, 1=begin). | -614.0863271085149 |
| **DB** | Berekent de afschrijving met de degressieve afschrijvingsmethode (fixed-declining balance). | `DB(1000000, 100000, 6, 1, 6)` | Kosten, restwaarde, levensduur, periode, maand. | 159500 |
| **DDB** | Berekent de afschrijving met de dubbele degressieve afschrijvingsmethode of een andere gespecificeerde methode. | `DDB(1000000, 100000, 6, 1, 1.5)` | Kosten, restwaarde, levensduur, periode, factor. | 250000 |
| **DOLLARDE** | Converteert een prijs uitgedrukt als een breuk naar een decimaal getal. | `DOLLARDE(1.1, 16)` | Prijs als breuk, noemer. | 1.625 |
| **DOLLARFR** | Converteert een prijs uitgedrukt als een decimaal getal naar een breuk. | `DOLLARFR(1.625, 16)` | Prijs als decimaal, noemer. | 1.1 |
| **EFFECT** | Berekent de effectieve jaarlijkse rentevoet. | `EFFECT(0.1, 4)` | Nominale jaarlijkse rentevoet, aantal samengestelde perioden per jaar. | 0.10381289062499977 |
| **FV** | Berekent de toekomstige waarde van een investering. | `FV(0.1/12, 10, -100, -1000, 0)` | Rentevoet per periode, aantal perioden, betaling per periode, huidige waarde, betalingstype (0=einde, 1=begin). | 2124.874409194097 |
| **FVSCHEDULE** | Berekent de toekomstige waarde van een hoofdsom met behulp van een reeks samengestelde rentevoeten. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Hoofdsom, array van rentevoeten. | 133.08900000000003 |
| **IPMT** | Berekent de rentebetaling voor een specifieke periode. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Rentevoet per periode, periode, totaal aantal perioden, huidige waarde, toekomstige waarde, betalingstype (0=einde, 1=begin). | 928.8235718400465 |
| **IRR** | Berekent de interne rentabiliteit (internal rate of return). | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array van kasstromen, schatting. | 0.05715142887178447 |
| **ISPMT** | Berekent de rente betaald tijdens een specifieke periode (voor leningen). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Rentevoet per periode, periode, totaal aantal perioden, leningbedrag. | -625 |
| **MIRR** | Berekent de gewijzigde interne rentabiliteit. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array van kasstromen, financieringsrente, herinvesteringsrente. | 0.07971710360838036 |
| **NOMINAL** | Berekent de nominale jaarlijkse rentevoet. | `NOMINAL(0.1, 4)` | Effectieve jaarlijkse rentevoet, aantal samengestelde perioden per jaar. | 0.09645475633778045 |
| **NPER** | Berekent het aantal perioden dat nodig is om een doelwaarde te bereiken. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Rentevoet per periode, betaling per periode, huidige waarde, toekomstige waarde, betalingstype (0=einde, 1=begin). | 63.39385422740764 |
| **NPV** | Berekent de netto contante waarde van een reeks toekomstige kasstromen. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Disconteringsvoet per periode, array van kasstromen. | 1031.3503176012546 |
| **PDURATION** | Berekent de tijd die nodig is om een gewenste waarde te bereiken. | `PDURATION(0.1, 1000, 2000)` | Rentevoet per periode, huidige waarde, toekomstige waarde. | 7.272540897341714 |
| **PMT** | Berekent de periodieke betaling voor een lening. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Rentevoet per periode, totaal aantal perioden, huidige waarde, toekomstige waarde, betalingstype (0=einde, 1=begin). | -42426.08563793503 |
| **PPMT** | Berekent de aflossing op de hoofdsom voor een specifieke periode. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Rentevoet per periode, periode, totaal aantal perioden, huidige waarde, toekomstige waarde, betalingstype (0=einde, 1=begin). | -43354.909209775076 |
| **PV** | Berekent de huidige waarde van een investering. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Rentevoet per periode, aantal perioden, betaling per periode, toekomstige waarde, betalingstype (0=einde, 1=begin). | -29864.950264779152 |
| **RATE** | Berekent de rentevoet per periode. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Totaal aantal perioden, betaling per periode, huidige waarde, toekomstige waarde, betalingstype (0=einde, 1=begin), schatting. | 0.06517891177181533 |

### Techniek

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Converteert een binair getal naar decimaal. | `BIN2DEC(101010)` | Binair getal. | 42 |
| **BIN2HEX** | Converteert een binair getal naar hexadecimaal. | `BIN2HEX(101010)` | Binair getal. | 2a |
| **BIN2OCT** | Converteert een binair getal naar octaal. | `BIN2OCT(101010)` | Binair getal. | 52 |
| **BITAND** | Retourneert de bitsgewijze AND van twee getallen. | `BITAND(42, 24)` | Geheel getal, geheel getal. | 8 |
| **BITLSHIFT** | Voert een bitsgewijze verschuiving naar links uit. | `BITLSHIFT(42, 24)` | Geheel getal, aantal te verschuiven bits. | 704643072 |
| **BITOR** | Retourneert de bitsgewijze OR van twee getallen. | `BITOR(42, 24)` | Geheel getal, geheel getal. | 58 |
| **BITRSHIFT** | Voert een bitsgewijze verschuiving naar rechts uit. | `BITRSHIFT(42, 2)` | Geheel getal, aantal te verschuiven bits. | 10 |
| **BITXOR** | Retourneert de bitsgewijze XOR van twee getallen. | `BITXOR(42, 24)` | Geheel getal, geheel getal. | 50 |
| **COMPLEX** | Maakt een complex getal. | `COMPLEX(3, 4)` | Reëel deel, imaginair deel. | 3+4i |
| **CONVERT** | Converteert een getal van de ene meeteenheid naar de andere. | `CONVERT(64, 'kibyte', 'bit')` | Waarde, van eenheid, naar eenheid. | 524288 |
| **DEC2BIN** | Converteert een decimaal getal naar binair. | `DEC2BIN(42)` | Decimaal getal. | 101010 |
| **DEC2HEX** | Converteert een decimaal getal naar hexadecimaal. | `DEC2HEX(42)` | Decimaal getal. | 2a |
| **DEC2OCT** | Converteert een decimaal getal naar octaal. | `DEC2OCT(42)` | Decimaal getal. | 52 |
| **DELTA** | Test of twee waarden gelijk zijn. | `DELTA(42, 42)` | Getal, getal. | 1 |
| **ERF** | Retourneert de foutfunctie. | `ERF(1)` | Bovengrens. | 0.8427007929497149 |
| **ERFC** | Retourneert de complementaire foutfunctie. | `ERFC(1)` | Ondergrens. | 0.1572992070502851 |
| **GESTEP** | Test of een getal groter is dan of gelijk is aan een drempelwaarde. | `GESTEP(42, 24)` | Getal, drempelwaarde. | 1 |
| **HEX2BIN** | Converteert een hexadecimaal getal naar binair. | `HEX2BIN('2a')` | Hexadecimaal getal. | 101010 |
| **HEX2DEC** | Converteert een hexadecimaal getal naar decimaal. | `HEX2DEC('2a')` | Hexadecimaal getal. | 42 |
| **HEX2OCT** | Converteert een hexadecimaal getal naar octaal. | `HEX2OCT('2a')` | Hexadecimaal getal. | 52 |
| **IMABS** | Retourneert de absolute waarde (magnitude) van een complex getal. | `IMABS('3+4i')` | Complex getal. | 5 |
| **IMAGINARY** | Retourneert het imaginaire deel van een complex getal. | `IMAGINARY('3+4i')` | Complex getal. | 4 |
| **IMARGUMENT** | Retourneert het argument van een complex getal. | `IMARGUMENT('3+4i')` | Complex getal. | 0.9272952180016122 |
| **IMCONJUGATE** | Retourneert de complex geconjugeerde. | `IMCONJUGATE('3+4i')` | Complex getal. | 3-4i |
| **IMCOS** | Retourneert de cosinus van een complex getal. | `IMCOS('1+i')` | Complex getal. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Retourneert de cosinus hyperbolicus van een complex getal. | `IMCOSH('1+i')` | Complex getal. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Retourneert de cotangens van een complex getal. | `IMCOT('1+i')` | Complex getal. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Retourneert de cosecans van een complex getal. | `IMCSC('1+i')` | Complex getal. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Retourneert de cosecans hyperbolicus van een complex getal. | `IMCSCH('1+i')` | Complex getal. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Retourneert het quotiënt van twee complexe getallen. | `IMDIV('1+2i', '3+4i')` | Deeltal complex getal, deler complex getal. | 0.44+0.08i |
| **IMEXP** | Retourneert de exponent van een complex getal. | `IMEXP('1+i')` | Complex getal. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Retourneert de natuurlijke logaritme van een complex getal. | `IMLN('1+i')` | Complex getal. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Retourneert de logaritme met grondtal 10 van een complex getal. | `IMLOG10('1+i')` | Complex getal. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Retourneert de logaritme met grondtal 2 van een complex getal. | `IMLOG2('1+i')` | Complex getal. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Retourneert een complex getal verheven tot een macht. | `IMPOWER('1+i', 2)` | Complex getal, exponent. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Retourneert het product van complexe getallen. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array van complexe getallen. | -85+20i |
| **IMREAL** | Retourneert het reële deel van een complex getal. | `IMREAL('3+4i')` | Complex getal. | 3 |
| **IMSEC** | Retourneert de secans van een complex getal. | `IMSEC('1+i')` | Complex getal. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Retourneert de secans hyperbolicus van een complex getal. | `IMSECH('1+i')` | Complex getal. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Retourneert de sinus van een complex getal. | `IMSIN('1+i')` | Complex getal. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Retourneert de sinus hyperbolicus van een complex getal. | `IMSINH('1+i')` | Complex getal. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Retourneert de vierkantswortel van een complex getal. | `IMSQRT('1+i')` | Complex getal. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Retourneert het verschil tussen twee complexe getallen. | `IMSUB('3+4i', '1+2i')` | Aftrektal complex getal, aftrekker complex getal. | 2+2i |
| **IMSUM** | Retourneert de som van complexe getallen. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array van complexe getallen. | 9+12i |
| **IMTAN** | Retourneert de tangens van een complex getal. | `IMTAN('1+i')` | Complex getal. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Converteert een octaal getal naar binair. | `OCT2BIN('52')` | Octaal getal. | 101010 |
| **OCT2DEC** | Converteert een octaal getal naar decimaal. | `OCT2DEC('52')` | Octaal getal. | 42 |
| **OCT2HEX** | Converteert een octaal getal naar hexadecimaal. | `OCT2HEX('52')` | Octaal getal. | 2a |

### Logisch

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Retourneert WAAR (TRUE) alleen wanneer alle argumenten WAAR zijn, anders ONWAAR (FALSE). | `AND(true, false, true)` | Een of meer logische waarden (Boolean); de functie retourneert alleen WAAR als elk argument WAAR is. | |
| **FALSE** | Retourneert de logische waarde ONWAAR. | `FALSE()` | Geen parameters. | |
| **IF** | Retourneert verschillende waarden afhankelijk van of een voorwaarde WAAR of ONWAAR is. | `IF(true, 'Hello!', 'Goodbye!')` | Voorwaarde, waarde indien WAAR, waarde indien ONWAAR. | Hello! |
| **IFS** | Evalueert meerdere voorwaarden en retourneert het resultaat van de eerste voorwaarde die WAAR is. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Meerdere paren van voorwaarde en bijbehorende waarde. | Goodbye! |
| **NOT** | Keert een logische waarde om. WAAR wordt ONWAAR en vice versa. | `NOT(true)` | Eén logische waarde (Boolean). | |
| **OR** | Retourneert WAAR als een van de argumenten WAAR is, anders ONWAAR. | `OR(true, false, true)` | Een of meer logische waarden (Boolean); retourneert WAAR wanneer een van de argumenten WAAR is. | |
| **SWITCH** | Retourneert de waarde die overeenkomt met een expressie; als er geen overeenkomst is, wordt de standaardwaarde geretourneerd. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Expressie, matchwaarde 1, resultaat 1, ..., [standaard]. | Seven |
| **TRUE** | Retourneert de logische waarde WAAR. | `TRUE()` | Geen parameters. | |
| **XOR** | Retourneert WAAR alleen wanneer een oneven aantal argumenten WAAR is, anders ONWAAR. | `XOR(true, false, true)` | Een of meer logische waarden (Boolean); retourneert WAAR bij een oneven aantal WAAR-waarden. | |

### Wiskunde

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Retourneert de absolute waarde van een getal. | `ABS(-4)` | Getal. | 4 |
| **ACOS** | Retourneert de boogcosinus (in radialen). | `ACOS(-0.5)` | Getal tussen -1 en 1. | 2.0943951023931957 |
| **ACOSH** | Retourneert de inverse cosinus hyperbolicus. | `ACOSH(10)` | Getal groter dan of gelijk aan 1. | 2.993222846126381 |
| **ACOT** | Retourneert de boogcotangens (in radialen). | `ACOT(2)` | Elk getal. | 0.46364760900080615 |
| **ACOTH** | Retourneert de inverse cotangens hyperbolicus. | `ACOTH(6)` | Getal waarvan de absolute waarde groter is dan 1. | 0.16823611831060645 |
| **AGGREGATE** | Voert een aggregatieberekening uit terwijl fouten of verborgen rijen worden genegeerd. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Functienummer, opties, array1, ..., arrayN. | 10,32 |
| **ARABIC** | Converteert een Romeins cijfer naar Arabisch. | `ARABIC('MCMXII')` | Romeinse cijferreeks. | 1912 |
| **ASIN** | Retourneert de boogsinus (in radialen). | `ASIN(-0.5)` | Getal tussen -1 en 1. | -0.5235987755982988 |
| **ASINH** | Retourneert de inverse sinus hyperbolicus. | `ASINH(-2.5)` | Elk getal. | -1.6472311463710965 |
| **ATAN** | Retourneert de boogtangens (in radialen). | `ATAN(1)` | Elk getal. | 0.7853981633974483 |
| **ATAN2** | Retourneert de boogtangens (in radialen) van een coördinatenpaar. | `ATAN2(-1, -1)` | y-coördinaat, x-coördinaat. | -2.356194490192345 |
| **ATANH** | Retourneert de inverse tangens hyperbolicus. | `ATANH(-0.1)` | Getal tussen -1 en 1. | -0.10033534773107562 |
| **BASE** | Converteert een getal naar tekst in het opgegeven grondtal. | `BASE(15, 2, 10)` | Getal, grondtal, [minimale lengte]. | 0000001111 |
| **CEILING** | Rondt een getal naar boven af op het dichtstbijzijnde veelvoud. | `CEILING(-5.5, 2, -1)` | Getal, significantie, [modus]. | -6 |
| **CEILINGMATH** | Rondt een getal naar boven af, met gebruik van het opgegeven veelvoud en de richting. | `CEILINGMATH(-5.5, 2, -1)` | Getal, [significantie], [modus]. | -6 |
| **CEILINGPRECISE** | Rondt een getal naar boven af op het dichtstbijzijnde veelvoud, ongeacht het teken. | `CEILINGPRECISE(-4.1, -2)` | Getal, [significantie]. | -4 |
| **COMBIN** | Retourneert het aantal combinaties. | `COMBIN(8, 2)` | Totaal aantal items, aantal gekozen. | 28 |
| **COMBINA** | Retourneert het aantal combinaties met herhalingen. | `COMBINA(4, 3)` | Totaal aantal items, aantal gekozen. | 20 |
| **COS** | Retourneert de cosinus (in radialen). | `COS(1)` | Hoek in radialen. | 0.5403023058681398 |
| **COSH** | Retourneert de cosinus hyperbolicus. | `COSH(1)` | Elk getal. | 1.5430806348152437 |
| **COT** | Retourneert de cotangens (in radialen). | `COT(30)` | Hoek in radialen. | -0.15611995216165922 |
| **COTH** | Retourneert de tangens hyperbolicus. | `COTH(2)` | Elk getal. | 1.0373147207275482 |
| **CSC** | Retourneert de cosecans (in radialen). | `CSC(15)` | Hoek in radialen. | 1.5377805615408537 |
| **CSCH** | Retourneert de cosecans hyperbolicus. | `CSCH(1.5)` | Elk getal. | 0.46964244059522464 |
| **DECIMAL** | Converteert een getal in tekstvorm naar decimaal. | `DECIMAL('FF', 16)` | Tekst, grondtal. | 255 |
| **ERF** | Retourneert de foutfunctie. | `ERF(1)` | Bovengrens. | 0.8427007929497149 |
| **ERFC** | Retourneert de complementaire foutfunctie. | `ERFC(1)` | Ondergrens. | 0.1572992070502851 |
| **EVEN** | Rondt een getal naar boven af op het dichtstbijzijnde even gehele getal. | `EVEN(-1)` | Getal. | -2 |
| **EXP** | Retourneert e verheven tot een macht. | `EXP(1)` | Exponent. | 2.718281828459045 |
| **FACT** | Retourneert de faculteit. | `FACT(5)` | Niet-negatief geheel getal. | 120 |
| **FACTDOUBLE** | Retourneert de dubbele faculteit. | `FACTDOUBLE(7)` | Niet-negatief geheel getal. | 105 |
| **FLOOR** | Rondt een getal naar beneden af op het dichtstbijzijnde veelvoud. | `FLOOR(-3.1)` | Getal, significantie. | -4 |
| **FLOORMATH** | Rondt een getal naar beneden af met gebruik van het opgegeven veelvoud en de richting. | `FLOORMATH(-4.1, -2, -1)` | Getal, [significantie], [modus]. | -4 |
| **FLOORPRECISE** | Rondt een getal naar beneden af op het dichtstbijzijnde veelvoud, ongeacht het teken. | `FLOORPRECISE(-3.1, -2)` | Getal, [significantie]. | -4 |
| **GCD** | Retourneert de grootste gemene deler. | `GCD(24, 36, 48)` | Twee of meer gehele getallen. | 12 |
| **INT** | Rondt een getal naar beneden af op het dichtstbijzijnde gehele getal. | `INT(-8.9)` | Getal. | -9 |
| **ISEVEN** | Test of een getal even is. | `ISEVEN(-2.5)` | Getal. | |
| **ISOCEILING** | Rondt een getal naar boven af op het dichtstbijzijnde veelvoud volgens ISO-regels. | `ISOCEILING(-4.1, -2)` | Getal, [significantie]. | -4 |
| **ISODD** | Test of een getal oneven is. | `ISODD(-2.5)` | Getal. | |
| **LCM** | Retourneert het kleinste gemene veelvoud. | `LCM(24, 36, 48)` | Twee of meer gehele getallen. | 144 |
| **LN** | Retourneert de natuurlijke logaritme. | `LN(86)` | Positief getal. | 4.454347296253507 |
| **LOG** | Retourneert de logaritme in het opgegeven grondtal. | `LOG(8, 2)` | Getal, grondtal. | 3 |
| **LOG10** | Retourneert de logaritme met grondtal 10. | `LOG10(100000)` | Positief getal. | 5 |
| **MOD** | Retourneert de rest van een deling. | `MOD(3, -2)` | Deeltal, deler. | -1 |
| **MROUND** | Rondt een getal af op het dichtstbijzijnde veelvoud. | `MROUND(-10, -3)` | Getal, veelvoud. | -9 |
| **MULTINOMIAL** | Retourneert de multinomiale coëfficiënt. | `MULTINOMIAL(2, 3, 4)` | Twee of meer niet-negatieve gehele getallen. | 1260 |
| **ODD** | Rondt een getal naar boven af op het dichtstbijzijnde oneven gehele getal. | `ODD(-1.5)` | Getal. | -3 |
| **POWER** | Verheft een getal tot een macht. | `POWER(5, 2)` | Grondtal, exponent. | 25 |
| **PRODUCT** | Retourneert het product van getallen. | `PRODUCT(5, 15, 30)` | Een of meer getallen. | 2250 |
| **QUOTIENT** | Retourneert het gehele gedeelte van een deling. | `QUOTIENT(-10, 3)` | Deeltal, deler. | -3 |
| **RADIANS** | Converteert graden naar radialen. | `RADIANS(180)` | Graden. | 3.141592653589793 |
| **RAND** | Retourneert een willekeurig reëel getal tussen 0 en 1. | `RAND()` | Geen parameters. | [Random real number between 0 and 1] |
| **RANDBETWEEN** | Retourneert een willekeurig geheel getal binnen een opgegeven bereik. | `RANDBETWEEN(-1, 1)` | Ondergrens, bovengrens. | [Random integer between bottom and top] |
| **ROUND** | Rondt een getal af op het opgegeven aantal decimalen. | `ROUND(626.3, -3)` | Getal, decimalen. | 1000 |
| **ROUNDDOWN** | Rondt een getal naar beneden af (naar nul toe). | `ROUNDDOWN(-3.14159, 2)` | Getal, decimalen. | -3.14 |
| **ROUNDUP** | Rondt een getal naar boven af (van nul af). | `ROUNDUP(-3.14159, 2)` | Getal, decimalen. | -3.15 |
| **SEC** | Retourneert de secans (in radialen). | `SEC(45)` | Hoek in radialen. | 1.9035944074044246 |
| **SECH** | Retourneert de secans hyperbolicus. | `SECH(45)` | Elk getal. | 5.725037161098787e-20 |
| **SIGN** | Retourneert het teken van een getal. | `SIGN(-0.00001)` | Getal. | -1 |
| **SIN** | Retourneert de sinus (in radialen). | `SIN(1)` | Hoek in radialen. | 0.8414709848078965 |
| **SINH** | Retourneert de sinus hyperbolicus. | `SINH(1)` | Elk getal. | 1.1752011936438014 |
| **SQRT** | Retourneert de vierkantswortel. | `SQRT(16)` | Niet-negatief getal. | 4 |
| **SQRTPI** | Retourneert de vierkantswortel van (getal * π). | `SQRTPI(2)` | Niet-negatief getal. | 2.5066282746310002 |
| **SUBTOTAL** | Retourneert een subtotaal voor een set gegevens, waarbij verborgen rijen worden genegeerd. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Functienummer, array1, ..., arrayN. | 10,32 |
| **SUM** | Retourneert de som van getallen, waarbij tekst wordt genegeerd. | `SUM(-5, 15, 32, 'Hello World!')` | Een of meer getallen. | 42 |
| **SUMIF** | Tel waarden op die aan een enkele voorwaarde voldoen. | `SUMIF([2,4,8,16], '>5')` | Bereik, criteria. | 24 |
| **SUMIFS** | Tel waarden op die aan meerdere voorwaarden voldoen. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Sombereik, criteriabereik 1, criteria 1, ..., criteriabereik N, criteria N. | 12 |
| **SUMPRODUCT** | Retourneert de som van de producten van array-elementen. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Twee of meer arrays. | 5 |
| **SUMSQ** | Retourneert de som van de kwadraten. | `SUMSQ(3, 4)` | Een of meer getallen. | 25 |
| **SUMX2MY2** | Retourneert de som van het verschil van de kwadraten van overeenkomstige array-elementen. | `SUMX2MY2([1,2], [3,4])` | Array1, array2. | -20 |
| **SUMX2PY2** | Retourneert de som van de som van de kwadraten van overeenkomstige array-elementen. | `SUMX2PY2([1,2], [3,4])` | Array1, array2. | 30 |
| **SUMXMY2** | Retourneert de som van de kwadraten van de verschillen van overeenkomstige array-elementen. | `SUMXMY2([1,2], [3,4])` | Array1, array2. | 8 |
| **TAN** | Retourneert de tangens (in radialen). | `TAN(1)` | Hoek in radialen. | 1.5574077246549023 |
| **TANH** | Retourneert de tangens hyperbolicus. | `TANH(-2)` | Elk getal. | -0.9640275800758168 |
| **TRUNC** | Kapt een getal af tot een geheel getal zonder af te ronden. | `TRUNC(-8.9)` | Getal, [decimalen]. | -8 |

### Statistieken

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Retourneert de gemiddelde absolute afwijking. | `AVEDEV([2,4], [8,16])` | Arrays van getallen die gegevenspunten vertegenwoordigen. | 4.5 |
| **AVERAGE** | Retourneert het rekenkundig gemiddelde. | `AVERAGE([2,4], [8,16])` | Arrays van getallen die gegevenspunten vertegenwoordigen. | 7.5 |
| **AVERAGEA** | Retourneert het gemiddelde van waarden, inclusief tekst en logische waarden. | `AVERAGEA([2,4], [8,16])` | Arrays van getallen, tekst of logische waarden; alle niet-lege waarden worden opgenomen. | 7.5 |
| **AVERAGEIF** | Berekent het gemiddelde op basis van een enkele voorwaarde. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Eerste parameter is het te controleren bereik, tweede is de voorwaarde, derde optionele bereik gebruikt voor het middelen. | 3.5 |
| **AVERAGEIFS** | Berekent het gemiddelde op basis van meerdere voorwaarden. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Eerste parameter zijn de te middelen waarden, gevolgd door paren van criteriabereiken en criteria-expressies. | 6 |
| **BETADIST** | Retourneert de cumulatieve bèta-waarschijnlijkheidsdichtheid. | `BETADIST(2, 8, 10, true, 1, 3)` | Waarde, alfa, bèta, cumulatieve vlag, A (optioneel), B (optioneel). | 0.6854705810117458 |
| **BETAINV** | Retourneert de inverse van de cumulatieve bèta-verdeling. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Waarschijnlijkheid, alfa, bèta, A (optioneel), B (optioneel). | 1.9999999999999998 |
| **BINOMDIST** | Retourneert de waarschijnlijkheid van een binomiale verdeling. | `BINOMDIST(6, 10, 0.5, false)` | Aantal successen, pogingen, kans op succes, cumulatieve vlag. | 0.205078125 |
| **CORREL** | Retourneert de correlatiecoëfficiënt tussen twee datasets. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Twee arrays van getallen. | 0.9970544855015815 |
| **COUNT** | Telt numerieke cellen. | `COUNT([1,2], [3,4])` | Arrays of bereiken van getallen. | 4 |
| **COUNTA** | Telt niet-lege cellen. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Arrays of bereiken van elk type. | 4 |
| **COUNTBLANK** | Telt lege cellen. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Arrays of bereiken van elk type. | 2 |
| **COUNTIF** | Telt cellen die aan een voorwaarde voldoen. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Bereik van getallen of tekst, en de voorwaarde. | 3 |
| **COUNTIFS** | Telt cellen die aan meerdere voorwaarden voldoen. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Paren van criteriabereiken en criteria-expressies. | 2 |
| **COVARIANCEP** | Retourneert de populatiecovariantie. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Twee arrays van getallen. | 5.2 |
| **COVARIANCES** | Retourneert de steekproefcovariantie. | `COVARIANCES([2,4,8], [5,11,12])` | Twee arrays van getallen. | 9.666666666666668 |
| **DEVSQ** | Retourneert de som van de kwadraten van de afwijkingen. | `DEVSQ([2,4,8,16])` | Array van getallen die gegevenspunten vertegenwoordigen. | 115 |
| **EXPONDIST** | Retourneert de exponentiële verdeling. | `EXPONDIST(0.2, 10, true)` | Waarde, lambda, cumulatieve vlag. | 0.8646647167633873 |
| **FDIST** | Retourneert de F-waarschijnlijkheidsverdeling. | `FDIST(15.2069, 6, 4, false)` | Waarde, vrijheidsgraden 1, vrijheidsgraden 2, cumulatieve vlag. | 0.0012237917087831735 |
| **FINV** | Retourneert de inverse van de F-verdeling. | `FINV(0.01, 6, 4)` | Waarschijnlijkheid, vrijheidsgraden 1, vrijheidsgraden 2. | 0.10930991412457851 |
| **FISHER** | Retourneert de Fisher-transformatie. | `FISHER(0.75)` | Getal dat een correlatiecoëfficiënt vertegenwoordigt. | 0.9729550745276566 |
| **FISHERINV** | Retourneert de inverse Fisher-transformatie. | `FISHERINV(0.9729550745276566)` | Getal dat een Fisher-transformatieresultaat vertegenwoordigt. | 0.75 |
| **FORECAST** | Voorspelt een y-waarde voor een gegeven x met behulp van bekende x- en y-waarden. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nieuwe x-waarde, array van bekende y-waarden, array van bekende x-waarden. | 10.607253086419755 |
| **FREQUENCY** | Retourneert een frequentieverdeling. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Gegevensarray, intervalarray. | 1,2,4,2 |
| **GAMMA** | Retourneert de gamma-functie. | `GAMMA(2.5)` | Positief getal. | 1.3293403919101043 |
| **GAMMALN** | Retourneert de natuurlijke logaritme van de gamma-functie. | `GAMMALN(10)` | Positief getal. | 12.801827480081961 |
| **GAUSS** | Retourneert de waarschijnlijkheid op basis van de standaardnormale verdeling. | `GAUSS(2)` | Getal dat een z-score vertegenwoordigt. | 0.4772498680518208 |
| **GEOMEAN** | Retourneert het geometrisch gemiddelde. | `GEOMEAN([2,4], [8,16])` | Arrays van getallen. | 5.656854249492381 |
| **GROWTH** | Voorspelt exponentiële groeiwaarden op basis van bekende gegevens. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array van bekende y-waarden, array van bekende x-waarden, nieuwe x-waarden. | 32.00000000000003 |
| **HARMEAN** | Retourneert het harmonisch gemiddelde. | `HARMEAN([2,4], [8,16])` | Arrays van getallen. | 4.266666666666667 |
| **HYPGEOMDIST** | Retourneert de hypergeometrische verdeling. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Steekproefsuccessen, steekproefomvang, populatiesuccessen, populatieomvang, cumulatieve vlag. | 0.3632610939112487 |
| **INTERCEPT** | Retourneert het snijpunt van een lineaire regressielijn. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array van bekende y-waarden, array van bekende x-waarden. | 0.04838709677419217 |
| **KURT** | Retourneert de kurtosis (excessieve gepiektheid). | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array van getallen. | -0.15179963720841627 |
| **LARGE** | Retourneert de k-de grootste waarde. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array van getallen, k. | 5 |
| **LINEST** | Voert een lineaire regressieanalyse uit. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array van bekende y-waarden, array van bekende x-waarden, aanvullende statistieken retourneren, meer statistieken retourneren. | 2,1 |
| **LOGNORMDIST** | Retourneert de lognormale verdeling. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Waarde, gemiddelde, standaarddeviatie, cumulatieve vlag. | 0.0390835557068005 |
| **LOGNORMINV** | Retourneert de inverse van de lognormale verdeling. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Waarschijnlijkheid, gemiddelde, standaarddeviatie, cumulatieve vlag. | 4.000000000000001 |
| **MAX** | Retourneert de maximale waarde. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Arrays van getallen. | 0.8 |
| **MAXA** | Retourneert de maximale waarde inclusief tekst en logische waarden. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays van getallen, tekst of logische waarden. | 1 |
| **MEDIAN** | Retourneert de mediaan. | `MEDIAN([1,2,3], [4,5,6])` | Arrays van getallen. | 3.5 |
| **MIN** | Retourneert de minimale waarde. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Arrays van getallen. | 0.1 |
| **MINA** | Retourneert de minimale waarde inclusief tekst en logische waarden. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Arrays van getallen, tekst of logische waarden. | 0 |
| **MODEMULT** | Retourneert een array van de meest voorkomende waarden. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array van getallen. | 2,3 |
| **MODESNGL** | Retourneert de meest voorkomende enkele waarde. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array van getallen. | 2 |
| **NORMDIST** | Retourneert de normale verdeling. | `NORMDIST(42, 40, 1.5, true)` | Waarde, gemiddelde, standaarddeviatie, cumulatieve vlag. | 0.9087887802741321 |
| **NORMINV** | Retourneert de inverse van de normale verdeling. | `NORMINV(0.9087887802741321, 40, 1.5)` | Waarschijnlijkheid, gemiddelde, standaarddeviatie. | 42 |
| **NORMSDIST** | Retourneert de standaardnormale verdeling. | `NORMSDIST(1, true)` | Getal dat een z-score vertegenwoordigt. | 0.8413447460685429 |
| **NORMSINV** | Retourneert de inverse van de standaardnormale verdeling. | `NORMSINV(0.8413447460685429)` | Waarschijnlijkheid. | 1.0000000000000002 |
| **PEARSON** | Retourneert de Pearson-correlatiecoëfficiënt. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Twee arrays van getallen. | 0.6993786061802354 |
| **PERCENTILEEXC** | Retourneert het k-de percentiel, exclusief. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array van getallen, k. | 1.5 |
| **PERCENTILEINC** | Retourneert het k-de percentiel, inclusief. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array van getallen, k. | 1.9 |
| **PERCENTRANKEXC** | Retourneert de rang van een waarde in een dataset als een percentage (exclusief). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array van getallen, x-waarde, significantie (optioneel). | 0.4 |
| **PERCENTRANKINC** | Retourneert de rang van een waarde in een dataset als een percentage (inclusief). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array van getallen, x-waarde, significantie (optioneel). | 0.33 |
| **PERMUT** | Retourneert het aantal permutaties. | `PERMUT(100, 3)` | Totaal aantal n, aantal gekozen k. | 970200 |
| **PERMUTATIONA** | Retourneert het aantal permutaties met herhalingen. | `PERMUTATIONA(4, 3)` | Totaal aantal n, aantal gekozen k. | 64 |
| **PHI** | Retourneert de dichtheidsfunctie van de standaardnormale verdeling. | `PHI(0.75)` | Getal dat een z-score vertegenwoordigt. | 0.30113743215480443 |
| **POISSONDIST** | Retourneert de Poisson-verdeling. | `POISSONDIST(2, 5, true)` | Aantal gebeurtenissen, gemiddelde, cumulatieve vlag. | 0.12465201948308113 |
| **PROB** | Retourneert de som van waarschijnlijkheden. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array van waarden, array van waarschijnlijkheden, ondergrens, bovengrens. | 0.4 |
| **QUARTILEEXC** | Retourneert het kwartiel van de dataset, exclusief. | `QUARTILEEXC([1,2,3,4], 1)` | Array van getallen, kwartiel. | 1.25 |
| **QUARTILEINC** | Retourneert het kwartiel van de dataset, inclusief. | `QUARTILEINC([1,2,3,4], 1)` | Array van getallen, kwartiel. | 1.75 |
| **RANKAVG** | Retourneert de gemiddelde rang. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Getal, array van getallen, volgorde (oplopend/aflopend). | 4.5 |
| **RANKEQ** | Retourneert de rang van een getal. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Getal, array van getallen, volgorde (oplopend/aflopend). | 4 |
| **RSQ** | Retourneert de determinatiecoëfficiënt (R-kwadraat). | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Twee arrays van getallen. | 0.4891304347826088 |
| **SKEW** | Retourneert de scheefheid (skewness). | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array van getallen. | 0.3595430714067974 |
| **SKEWP** | Retourneert de populatiescheefheid. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array van getallen. | 0.303193339354144 |
| **SLOPE** | Retourneert de helling van de lineaire regressielijn. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array van bekende y-waarden, array van bekende x-waarden. | 2 |
| **SMALL** | Retourneert de k-de kleinste waarde. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array van getallen, k. | 3 |
| **STANDARDIZE** | Retourneert een genormaliseerde waarde als een z-score. | `STANDARDIZE(42, 40, 1.5)` | Waarde, gemiddelde, standaarddeviatie. | 1.3333333333333333 |
| **STDEVA** | Retourneert de standaarddeviatie, inclusief tekst en logische waarden. | `STDEVA([2,4], [8,16], [true, false])` | Arrays van getallen, tekst of logische waarden. | 6.013872850889572 |
| **STDEVP** | Retourneert de populatiestandaarddeviatie. | `STDEVP([2,4], [8,16], [true, false])` | Arrays van getallen. | 5.361902647381804 |
| **STDEVPA** | Retourneert de populatiestandaarddeviatie, inclusief tekst en logische waarden. | `STDEVPA([2,4], [8,16], [true, false])` | Arrays van getallen, tekst of logische waarden. | 5.489889697333535 |
| **STDEVS** | Retourneert de steekproefstandaarddeviatie. | `VARS([2,4], [8,16], [true, false])` | Arrays van getallen. | 6.191391873668904 |
| **STEYX** | Retourneert de standaardfout van de voorspelde y-waarde. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array van bekende y-waarden, array van bekende x-waarden. | 3.305718950210041 |
| **TINV** | Retourneert de inverse van de t-verdeling. | `TINV(0.9946953263673741, 1)` | Waarschijnlijkheid, vrijheidsgraden. | 59.99999999996535 |
| **TRIMMEAN** | Retourneert het gemiddelde van het binnenste gedeelte van een dataset. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array van getallen, trim-proportie. | 3.7777777777777777 |
| **VARA** | Retourneert de variantie inclusief tekst en logische waarden. | `VARA([2,4], [8,16], [true, false])` | Arrays van getallen, tekst of logische waarden. | 36.16666666666667 |
| **VARP** | Retourneert de populatievariantie. | `VARP([2,4], [8,16], [true, false])` | Arrays van getallen. | 28.75 |
| **VARPA** | Retourneert de populatievariantie inclusief tekst en logische waarden. | `VARPA([2,4], [8,16], [true, false])` | Arrays van getallen, tekst of logische waarden. | 30.13888888888889 |
| **VARS** | Retourneert de steekproefvariantie. | `VARS([2,4], [8,16], [true, false])` | Arrays van getallen. | 38.333333333333336 |
| **WEIBULLDIST** | Retourneert de Weibull-verdeling. | `WEIBULLDIST(105, 20, 100, true)` | Waarde, alfa, bèta, cumulatieve vlag. | 0.9295813900692769 |
| **ZTEST** | Retourneert de eenzijdige waarschijnlijkheidswaarde van een z-test. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array van getallen, verondersteld gemiddelde. | 0.09057419685136381 |

### Tekst

| Functie | Definitie | Voorbeeldaanroep | Parameters | Verwacht resultaat |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Converteert een getalcode naar het bijbehorende teken. | `CHAR(65)` | Getal dat de tekencode vertegenwoordigt. | A |
| **CLEAN** | Verwijdert alle niet-afdrukbare tekens uit tekst. | `CLEAN('Monthly report')` | Te reinigen tekstreeks. | Monthly report |
| **CODE** | Retourneert de numerieke code van het eerste teken in een tekstreeks. | `CODE('A')` | Tekstreeks die een enkel teken bevat. | 65 |
| **CONCATENATE** | Voegt meerdere tekstreeksen samen tot één reeks. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Een of meer samen te voegen tekstreeksen. | Andreas Hauser |
| **EXACT** | Controleert of twee reeksen exact hetzelfde zijn, hoofdlettergevoelig. | `EXACT('Word', 'word')` | Twee te vergelijken tekstreeksen. | |
| **FIND** | Zoekt de positie van een subreeks vanaf een opgegeven positie. | `FIND('M', 'Miriam McGovern', 3)` | Te zoeken tekst, brontekst, optionele startpositie. | 8 |
| **LEFT** | Retourneert een opgegeven aantal tekens vanaf de linkerkant van een reeks. | `LEFT('Sale Price', 4)` | Tekstreeks en aantal tekens. | Sale |
| **LEN** | Retourneert het aantal tekens in een tekstreeks. | `LEN('Phoenix, AZ')` | Te tellen tekstreeks. | 11 |
| **LOWER** | Converteert alle tekens naar kleine letters. | `LOWER('E. E. Cummings')` | Om te zetten tekstreeks. | e. e. cummings |
| **MID** | Retourneert een opgegeven aantal tekens uit het midden van een reeks. | `MID('Fluid Flow', 7, 20)` | Tekstreeks, startpositie, aantal tekens. | Flow |
| **NUMBERVALUE** | Converteert tekst naar een getal met behulp van opgegeven scheidingstekens. | `NUMBERVALUE('2.500,27', ',', '.')` | Tekstreeks, decimaalscheidingsteken, groepsscheidingsteken. | 2500.27 |
| **PROPER** | Zet de eerste letter van elk woord om in een hoofdletter. | `PROPER('this is a TITLE')` | Op te maken tekstreeks. | This Is A Title |
| **REPLACE** | Vervangt een deel van een tekstreeks door nieuwe tekst. | `REPLACE('abcdefghijk', 6, 5, '*')` | Originele tekst, startpositie, aantal tekens, nieuwe tekst. | abcde*k |
| **REPT** | Herhaalt tekst een opgegeven aantal keren. | `REPT('*-', 3)` | Tekstreeks en aantal herhalingen. | *-*-*- |
| **RIGHT** | Retourneert een opgegeven aantal tekens vanaf de rechterkant van een reeks. | `RIGHT('Sale Price', 5)` | Tekstreeks en aantal tekens. | Price |
| **ROMAN** | Converteert een Arabisch getal naar Romeinse cijfers. | `ROMAN(499)` | Om te zetten Arabisch getal. | CDXCIX |
| **SEARCH** | Zoekt de positie van een subreeks, niet hoofdlettergevoelig. | `SEARCH('margin', 'Profit Margin')` | Te zoeken tekst, brontekst. | 8 |
| **SUBSTITUTE** | Vervangt een specifieke instantie van oude tekst door nieuwe tekst. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Originele tekst, oude tekst, nieuwe tekst, optioneel instantienummer. | Quarter 1, 2012 |
| **T** | Retourneert de tekst als de waarde tekst is; retourneert anders een lege reeks. | `T('Rainfall')` | Argument kan elk type gegevens zijn. | Rainfall |
| **TRIM** | Verwijdert spaties uit tekst, behalve enkele spaties tussen woorden. | `TRIM(' First Quarter Earnings ')` | Te trimmen tekstreeks. | First Quarter Earnings |
| **TEXTJOIN** | Voegt meerdere tekstitems samen tot één reeks met behulp van een scheidingsteken. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Scheidingsteken, vlag voor negeren van lege waarden, samen te voegen tekstitems. | The sun will come up tomorrow. |
| **UNICHAR** | Retourneert het teken voor een gegeven Unicode-getal. | `UNICHAR(66)` | Unicode-codepunt. | B |
| **UNICODE** | Retourneert het Unicode-getal van het eerste teken van de tekst. | `UNICODE('B')` | Tekstreeks die een enkel teken bevat. | 66 |
| **UPPER** | Converteert alle tekens naar hoofdletters. | `UPPER('total')` | Om te zetten tekstreeks. | TOTAL |