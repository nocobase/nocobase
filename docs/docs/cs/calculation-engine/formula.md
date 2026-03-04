:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) poskytuje velké množství funkcí kompatibilních s Excelem.

## Referenční příručka funkcí

### Datum a čas

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Vytvoří datum na základě zadaného roku, měsíce a dne. | `DATE(2008, 7, 8)` | Rok (celé číslo), měsíc (1-12), den (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Převede datum v textovém formátu na sériové číslo data. | `DATEVALUE('8/22/2011')` | Textový řetězec, který představuje datum. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Vrátí den v měsíci z daného data. | `DAY('15-Apr-11')` | Hodnota data nebo textový řetězec data. | 15 |
| **DAYS** | Vypočítá počet dní mezi dvěma daty. | `DAYS('3/15/11', '2/1/11')` | Koncové datum, počáteční datum. | 42 |
| **DAYS360** | Vypočítá počet dní mezi dvěma daty na základě roku s 360 dny. | `DAYS360('1-Jan-11', '31-Dec-11')` | Počáteční datum, koncové datum. | 360 |
| **EDATE** | Vrátí datum, které je o zadaný počet měsíců dříve nebo později než počáteční datum. | `EDATE('1/15/11', -1)` | Počáteční datum, počet měsíců (kladné pro budoucnost, záporné pro minulost). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Vrátí poslední den v měsíci o zadaný počet měsíců dříve nebo později. | `EOMONTH('1/1/11', -3)` | Počáteční datum, počet měsíců (kladné pro budoucnost, záporné pro minulost). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Vrátí hodinu z časové hodnoty. | `HOUR('7/18/2011 7:45:00 AM')` | Časová hodnota nebo textový řetězec času. | 7 |
| **MINUTE** | Vrátí minutu z časové hodnoty. | `MINUTE('2/1/2011 12:45:00 PM')` | Časová hodnota nebo textový řetězec času. | 45 |
| **ISOWEEKNUM** | Vrátí číslo týdne v roce podle normy ISO pro dané datum. | `ISOWEEKNUM('3/9/2012')` | Hodnota data nebo textový řetězec data. | 10 |
| **MONTH** | Vrátí měsíc z daného data. | `MONTH('15-Apr-11')` | Hodnota data nebo textový řetězec data. | 4 |
| **NETWORKDAYS** | Vypočítá počet pracovních dní mezi dvěma daty, s výjimkou víkendů a volitelných svátků. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Počáteční datum, koncové datum, volitelné pole svátků. | 109 |
| **NETWORKDAYSINTL** | Vypočítá počet pracovních dní mezi dvěma daty s možností vlastního nastavení víkendů a svátků. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Počáteční datum, koncové datum, režim víkendu, volitelné pole svátků. | 23 |
| **NOW** | Vrátí aktuální datum a čas. | `NOW()` | Bez parametrů. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Vrátí sekundu z časové hodnoty. | `SECOND('2/1/2011 4:48:18 PM')` | Časová hodnota nebo textový řetězec času. | 18 |
| **TIME** | Vytvoří časovou hodnotu ze zadané hodiny, minuty a sekundy. | `TIME(16, 48, 10)` | Hodina (0-23), minuta (0-59), sekunda (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Převede čas v textovém formátu na sériové číslo času. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Textový řetězec, který představuje čas. | 0.2743055555555556 |
| **TODAY** | Vrátí aktuální datum. | `TODAY()` | Bez parametrů. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Vrátí číslo odpovídající dni v týdnu. | `WEEKDAY('2/14/2008', 3)` | Hodnota data nebo textový řetězec data, typ návratové hodnoty (1-3). | 3 |
| **YEAR** | Vrátí rok z daného data. | `YEAR('7/5/2008')` | Hodnota data nebo textový řetězec data. | 2008 |
| **WEEKNUM** | Vrátí číslo týdne v roce pro dané datum. | `WEEKNUM('3/9/2012', 2)` | Hodnota data nebo textový řetězec data, volitelný počáteční den týdne (1=neděle, 2=pondělí). | 11 |
| **WORKDAY** | Vrátí datum před nebo po zadaném počtu pracovních dní, s výjimkou víkendů a svátků. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Počáteční datum, počet pracovních dní, volitelné pole svátků. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Vrátí datum před nebo po zadaném počtu pracovních dní s vlastními víkendy a svátky. | `WORKDAYINTL('1/1/2012', 30, 17)` | Počáteční datum, počet pracovních dní, režim víkendu. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Vypočítá zlomek roku představující počet celých dní mezi dvěma daty. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Počáteční datum, koncové datum, volitelná základna (způsob počítání dní). | 0.5780821917808219 |

### Finanční

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Vypočítá naběhlý úrok z cenného papíru, který vyplácí úrok v pravidelných intervalech. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Datum emise, datum první splátky úroku, datum vypořádání, roční sazba, nominální hodnota, frekvence, základna. | 350 |
| **CUMIPMT** | Vypočítá kumulativní úrok zaplacený v určitém období splácení. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Sazba, celkový počet období, současná hodnota, počáteční období, koncové období, typ platby (0=konec, 1=začátek). | -9916.77251395708 |
| **CUMPRINC** | Vypočítá kumulativní jistinu zaplacenou v určitém období splácení. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Sazba, celkový počet období, současná hodnota, počáteční období, koncové období, typ platby (0=konec, 1=začátek). | -614.0863271085149 |
| **DB** | Vypočítá odpisy majetku za určité období metodou klesajícího zůstatku. | `DB(1000000, 100000, 6, 1, 6)` | Pořizovací cena, zůstatková hodnota, životnost, období, měsíc. | 159500 |
| **DDB** | Vypočítá odpisy majetku za určité období metodou zrychleného odpisování. | `DDB(1000000, 100000, 6, 1, 1.5)` | Pořizovací cena, zůstatková hodnota, životnost, období, koeficient. | 250000 |
| **DOLLARDE** | Převede cenu vyjádřenou zlomkem na desetinné číslo. | `DOLLARDE(1.1, 16)` | Cena jako zlomek dolaru, jmenovatel. | 1.625 |
| **DOLLARFR** | Převede cenu vyjádřenou desetinným číslem na zlomek. | `DOLLARFR(1.625, 16)` | Cena jako desetinné číslo dolaru, jmenovatel. | 1.1 |
| **EFFECT** | Vypočítá efektivní roční úrokovou sazbu. | `EFFECT(0.1, 4)` | Nominální roční sazba, počet úročených období za rok. | 0.10381289062499977 |
| **FV** | Vypočítá budoucí hodnotu investice. | `FV(0.1/12, 10, -100, -1000, 0)` | Sazba za období, počet období, splátka za období, současná hodnota, typ platby (0=konec, 1=začátek). | 2124.874409194097 |
| **FVSCHEDULE** | Vypočítá budoucí hodnotu jistiny na základě řady složených úrokových sazeb. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Jistina, pole sazeb. | 133.08900000000003 |
| **IPMT** | Vypočítá úrok z investice za dané období. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Sazba za období, období, celkový počet období, současná hodnota, budoucí hodnota, typ platby (0=konec, 1=začátek). | 928.8235718400465 |
| **IRR** | Vypočítá vnitřní procentuální výnosnost peněžních toků. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Pole peněžních toků, odhad. | 0.05715142887178447 |
| **ISPMT** | Vypočítá úrok zaplacený během určitého období (pro půjčky). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Sazba za období, období, celkový počet období, výše půjčky. | -625 |
| **MIRR** | Vypočítá modifikovanou vnitřní výnosnost. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Pole peněžních toků, finanční sazba, reinvestiční sazba. | 0.07971710360838036 |
| **NOMINAL** | Vypočítá nominální roční úrokovou sazbu. | `NOMINAL(0.1, 4)` | Efektivní roční sazba, počet úročených období za rok. | 0.09645475633778045 |
| **NPER** | Vypočítá počet období pro dosažení cílové hodnoty. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Sazba za období, splátka za období, současná hodnota, budoucí hodnota, typ platby (0=konec, 1=začátek). | 63.39385422740764 |
| **NPV** | Vypočítá čistou současnou hodnotu investice na základě řady budoucích peněžních toků. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Diskontní sazba za období, pole peněžních toků. | 1031.3503176012546 |
| **PDURATION** | Vypočítá dobu potřebnou k dosažení požadované hodnoty. | `PDURATION(0.1, 1000, 2000)` | Sazba za období, současná hodnota, budoucí hodnota. | 7.272540897341714 |
| **PMT** | Vypočítá pravidelnou splátku půjčky. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Sazba za období, celkový počet období, současná hodnota, budoucí hodnota, typ platby (0=konec, 1=začátek). | -42426.08563793503 |
| **PPMT** | Vypočítá splátku jistiny pro dané období. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Sazba za období, období, celkový počet období, současná hodnota, budoucí hodnota, typ platby (0=konec, 1=začátek). | -43354.909209775076 |
| **PV** | Vypočítá současnou hodnotu investice. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Sazba za období, počet období, splátka za období, budoucí hodnota, typ platby (0=konec, 1=začátek). | -29864.950264779152 |
| **RATE** | Vypočítá úrokovou sazbu za období. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Celkový počet období, splátka za období, současná hodnota, budoucí hodnota, typ platby (0=konec, 1=začátek), odhad. | 0.06517891177181533 |

### Technické

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Převede binární číslo na desítkové. | `BIN2DEC(101010)` | Binární číslo. | 42 |
| **BIN2HEX** | Převede binární číslo na šestnáctkové. | `BIN2HEX(101010)` | Binární číslo. | 2a |
| **BIN2OCT** | Převede binární číslo na osmičkové. | `BIN2OCT(101010)` | Binární číslo. | 52 |
| **BITAND** | Vrátí bitový součin (AND) dvou čísel. | `BITAND(42, 24)` | Celé číslo, celé číslo. | 8 |
| **BITLSHIFT** | Provede bitový posun doleva. | `BITLSHIFT(42, 24)` | Celé číslo, počet bitů pro posun. | 704643072 |
| **BITOR** | Vrátí bitový součet (OR) dvou čísel. | `BITOR(42, 24)` | Celé číslo, celé číslo. | 58 |
| **BITRSHIFT** | Provede bitový posun doprava. | `BITRSHIFT(42, 2)` | Celé číslo, počet bitů pro posun. | 10 |
| **BITXOR** | Vrátí bitový exkluzivní součet (XOR) dvou čísel. | `BITXOR(42, 24)` | Celé číslo, celé číslo. | 50 |
| **COMPLEX** | Vytvoří komplexní číslo. | `COMPLEX(3, 4)` | Reálná část, imaginární část. | 3+4i |
| **CONVERT** | Převede číslo z jedné měrné jednotky do druhé. | `CONVERT(64, 'kibyte', 'bit')` | Hodnota, z jednotky, do jednotky. | 524288 |
| **DEC2BIN** | Převede desítkové číslo na binární. | `DEC2BIN(42)` | Desítkové číslo. | 101010 |
| **DEC2HEX** | Převede desítkové číslo na šestnáctkové. | `DEC2HEX(42)` | Desítkové číslo. | 2a |
| **DEC2OCT** | Převede desítkové číslo na osmičkové. | `DEC2OCT(42)` | Desítkové číslo. | 52 |
| **DELTA** | Testuje, zda jsou dvě hodnoty stejné. | `DELTA(42, 42)` | Číslo, číslo. | 1 |
| **ERF** | Vrátí chybovou funkci. | `ERF(1)` | Horní mez. | 0.8427007929497149 |
| **ERFC** | Vrátí doplňkovou chybovou funkci. | `ERFC(1)` | Dolní mez. | 0.1572992070502851 |
| **GESTEP** | Testuje, zda je číslo větší nebo rovno prahové hodnotě. | `GESTEP(42, 24)` | Číslo, práh. | 1 |
| **HEX2BIN** | Převede šestnáctkové číslo na binární. | `HEX2BIN('2a')` | Šestnáctkové číslo. | 101010 |
| **HEX2DEC** | Převede šestnáctkové číslo na desítkové. | `HEX2DEC('2a')` | Šestnáctkové číslo. | 42 |
| **HEX2OCT** | Převede šestnáctkové číslo na osmičkové. | `HEX2OCT('2a')` | Šestnáctkové číslo. | 52 |
| **IMABS** | Vrátí absolutní hodnotu (modul) komplexního čísla. | `IMABS('3+4i')` | Komplexní číslo. | 5 |
| **IMAGINARY** | Vrátí imaginární část komplexního čísla. | `IMAGINARY('3+4i')` | Komplexní číslo. | 4 |
| **IMARGUMENT** | Vrátí argument komplexního čísla. | `IMARGUMENT('3+4i')` | Komplexní číslo. | 0.9272952180016122 |
| **IMCONJUGATE** | Vrátí komplexně sdružené číslo. | `IMCONJUGATE('3+4i')` | Komplexní číslo. | 3-4i |
| **IMCOS** | Vrátí kosinus komplexního čísla. | `IMCOS('1+i')` | Komplexní číslo. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Vrátí hyperbolický kosinus komplexního čísla. | `IMCOSH('1+i')` | Komplexní číslo. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Vrátí kotangens komplexního čísla. | `IMCOT('1+i')` | Komplexní číslo. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Vrátí kosekans komplexního čísla. | `IMCSC('1+i')` | Komplexní číslo. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Vrátí hyperbolický kosekans komplexního čísla. | `IMCSCH('1+i')` | Komplexní číslo. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Vrátí podíl dvou komplexních čísel. | `IMDIV('1+2i', '3+4i')` | Komplexní číslo dělenec, komplexní číslo dělitel. | 0.44+0.08i |
| **IMEXP** | Vrátí exponenciálu komplexního čísla. | `IMEXP('1+i')` | Komplexní číslo. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Vrátí přirozený logaritmus komplexního čísla. | `IMLN('1+i')` | Komplexní číslo. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Vrátí dekadický logaritmus komplexního čísla. | `IMLOG10('1+i')` | Komplexní číslo. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Vrátí binární logaritmus komplexního čísla. | `IMLOG2('1+i')` | Komplexní číslo. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Vrátí komplexní číslo umocněné na zadanou mocninu. | `IMPOWER('1+i', 2)` | Komplexní číslo, exponent. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Vrátí součin komplexních čísel. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Pole komplexních čísel. | -85+20i |
| **IMREAL** | Vrátí reálnou část komplexního čísla. | `IMREAL('3+4i')` | Komplexní číslo. | 3 |
| **IMSEC** | Vrátí sekans komplexního čísla. | `IMSEC('1+i')` | Komplexní číslo. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Vrátí hyperbolický sekans komplexního čísla. | `IMSECH('1+i')` | Komplexní číslo. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Vrátí sinus komplexního čísla. | `IMSIN('1+i')` | Komplexní číslo. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Vrátí hyperbolický sinus komplexního čísla. | `IMSINH('1+i')` | Komplexní číslo. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Vrátí druhou odmocninu komplexního čísla. | `IMSQRT('1+i')` | Komplexní číslo. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Vrátí rozdíl mezi dvěma komplexními čísly. | `IMSUB('3+4i', '1+2i')` | Komplexní číslo menšenec, komplexní číslo menšitel. | 2+2i |
| **IMSUM** | Vrátí součet komplexních čísel. | `IMSUM('1+2i', '3+4i', '5+6i')` | Pole komplexních čísel. | 9+12i |
| **IMTAN** | Vrátí tangens komplexního čísla. | `IMTAN('1+i')` | Komplexní číslo. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Převede osmičkové číslo na binární. | `OCT2BIN('52')` | Osmičkové číslo. | 101010 |
| **OCT2DEC** | Převede osmičkové číslo na desítkové. | `OCT2DEC('52')` | Osmičkové číslo. | 42 |
| **OCT2HEX** | Převede osmičkové číslo na šestnáctkové. | `OCT2HEX('52')` | Osmičkové číslo. | 2a |

### Logické

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Vrátí TRUE pouze tehdy, jsou-li všechny argumenty TRUE, jinak FALSE. | `AND(true, false, true)` | Jedna nebo více logických hodnot (Boolean); funkce vrátí TRUE pouze tehdy, jsou-li všechny argumenty TRUE. | |
| **FALSE** | Vrátí logickou hodnotu FALSE. | `FALSE()` | Bez parametrů. | |
| **IF** | Vrátí různé hodnoty v závislosti na tom, zda je podmínka TRUE nebo FALSE. | `IF(true, 'Hello!', 'Goodbye!')` | Podmínka, hodnota pokud TRUE, hodnota pokud FALSE. | Hello! |
| **IFS** | Vyhodnotí více podmínek a vrátí výsledek první podmínky, která je TRUE. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Více dvojic podmínek a odpovídajících hodnot. | Goodbye! |
| **NOT** | Obrátí logickou hodnotu. Z TRUE se stane FALSE a naopak. | `NOT(true)` | Jedna logická hodnota (Boolean). | |
| **OR** | Vrátí TRUE, pokud je alespoň jeden argument TRUE, jinak FALSE. | `OR(true, false, true)` | Jedna nebo více logických hodnot (Boolean); vrátí TRUE, pokud je jakýkoliv argument TRUE. | |
| **SWITCH** | Vrátí hodnotu odpovídající výrazu; pokud žádná neodpovídá, vrátí výchozí hodnotu. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Výraz, hodnota pro shodu 1, výsledek 1, …, [výchozí]. | Seven |
| **TRUE** | Vrátí logickou hodnotu TRUE. | `TRUE()` | Bez parametrů. | |
| **XOR** | Vrátí TRUE pouze tehdy, je-li lichý počet argumentů TRUE, jinak FALSE. | `XOR(true, false, true)` | Jedna nebo více logických hodnot (Boolean); vrátí TRUE, pokud je lichý počet argumentů TRUE. | |

### Matematické

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Vrátí absolutní hodnotu čísla. | `ABS(-4)` | Číslo. | 4 |
| **ACOS** | Vrátí arkuskosinus (v radiánech). | `ACOS(-0.5)` | Číslo mezi -1 a 1. | 2.0943951023931957 |
| **ACOSH** | Vrátí inverzní hyperbolický kosinus. | `ACOSH(10)` | Číslo větší nebo rovno 1. | 2.993222846126381 |
| **ACOT** | Vrátí arkuskotangens (v radiánech). | `ACOT(2)` | Libovolné číslo. | 0.46364760900080615 |
| **ACOTH** | Vrátí inverzní hyperbolický kotangens. | `ACOTH(6)` | Číslo, jehož absolutní hodnota je větší než 1. | 0.16823611831060645 |
| **AGGREGATE** | Provede agregační výpočet a přitom ignoruje chyby nebo skryté řádky. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Číslo funkce, možnosti, pole1, …, poleN. | 10,32 |
| **ARABIC** | Převede římskou číslici na arabskou. | `ARABIC('MCMXII')` | Řetězec římské číslice. | 1912 |
| **ASIN** | Vrátí arkussinus (v radiánech). | `ASIN(-0.5)` | Číslo mezi -1 a 1. | -0.5235987755982988 |
| **ASINH** | Vrátí inverzní hyperbolický sinus. | `ASINH(-2.5)` | Libovolné číslo. | -1.6472311463710965 |
| **ATAN** | Vrátí arkustangens (v radiánech). | `ATAN(1)` | Libovolné číslo. | 0.7853981633974483 |
| **ATAN2** | Vrátí arkustangens (v radiánech) z dvojice souřadnic. | `ATAN2(-1, -1)` | Souřadnice y, souřadnice x. | -2.356194490192345 |
| **ATANH** | Vrátí inverzní hyperbolický tangens. | `ATANH(-0.1)` | Číslo mezi -1 a 1. | -0.10033534773107562 |
| **BASE** | Převede číslo na text v zadané číselné soustavě. | `BASE(15, 2, 10)` | Číslo, základ, [minimální délka]. | 0000001111 |
| **CEILING** | Zaokrouhlí číslo nahoru na nejbližší násobek. | `CEILING(-5.5, 2, -1)` | Číslo, násobek, [režim]. | -6 |
| **CEILINGMATH** | Zaokrouhlí číslo nahoru s použitím zadaného násobku a směru. | `CEILINGMATH(-5.5, 2, -1)` | Číslo, [násobek], [režim]. | -6 |
| **CEILINGPRECISE** | Zaokrouhlí číslo nahoru na nejbližší násobek bez ohledu na znaménko. | `CEILINGPRECISE(-4.1, -2)` | Číslo, [násobek]. | -4 |
| **COMBIN** | Vrátí počet kombinací. | `COMBIN(8, 2)` | Celkový počet položek, počet vybraných položek. | 28 |
| **COMBINA** | Vrátí počet kombinací s opakováním. | `COMBINA(4, 3)` | Celkový počet položek, počet vybraných položek. | 20 |
| **COS** | Vrátí kosinus (v radiánech). | `COS(1)` | Úhel v radiánech. | 0.5403023058681398 |
| **COSH** | Vrátí hyperbolický kosinus. | `COSH(1)` | Libovolné číslo. | 1.5430806348152437 |
| **COT** | Vrátí kotangens (v radiánech). | `COT(30)` | Úhel v radiánech. | -0.15611995216165922 |
| **COTH** | Vrátí hyperbolický kotangens. | `COTH(2)` | Libovolné číslo. | 1.0373147207275482 |
| **CSC** | Vrátí kosekans (v radiánech). | `CSC(15)` | Úhel v radiánech. | 1.5377805615408537 |
| **CSCH** | Vrátí hyperbolický kosekans. | `CSCH(1.5)` | Libovolné číslo. | 0.46964244059522464 |
| **DECIMAL** | Převede číslo v textové podobě na desítkové. | `DECIMAL('FF', 16)` | Text, základ. | 255 |
| **ERF** | Vrátí chybovou funkci. | `ERF(1)` | Horní mez. | 0.8427007929497149 |
| **ERFC** | Vrátí doplňkovou chybovou funkci. | `ERFC(1)` | Dolní mez. | 0.1572992070502851 |
| **EVEN** | Zaokrouhlí číslo nahoru na nejbližší sudé celé číslo. | `EVEN(-1)` | Číslo. | -2 |
| **EXP** | Vrátí základ přirozeného logaritmu e umocněný na zadané číslo. | `EXP(1)` | Exponent. | 2.718281828459045 |
| **FACT** | Vrátí faktoriál. | `FACT(5)` | Nezáporné celé číslo. | 120 |
| **FACTDOUBLE** | Vrátí dvojitý faktoriál. | `FACTDOUBLE(7)` | Nezáporné celé číslo. | 105 |
| **FLOOR** | Zaokrouhlí číslo dolů na nejbližší násobek. | `FLOOR(-3.1)` | Číslo, násobek. | -4 |
| **FLOORMATH** | Zaokrouhlí číslo dolů s použitím zadaného násobku a směru. | `FLOORMATH(-4.1, -2, -1)` | Číslo, [násobek], [režim]. | -4 |
| **FLOORPRECISE** | Zaokrouhlí číslo dolů na nejbližší násobek bez ohledu na znaménko. | `FLOORPRECISE(-3.1, -2)` | Číslo, [násobek]. | -4 |
| **GCD** | Vrátí největšího společného dělitele. | `GCD(24, 36, 48)` | Dvě nebo více celých čísel. | 12 |
| **INT** | Zaokrouhlí číslo dolů na nejbližší celé číslo. | `INT(-8.9)` | Číslo. | -9 |
| **ISEVEN** | Testuje, zda je číslo sudé. | `ISEVEN(-2.5)` | Číslo. | |
| **ISOCEILING** | Zaokrouhlí číslo nahoru na nejbližší násobek podle pravidel ISO. | `ISOCEILING(-4.1, -2)` | Číslo, [násobek]. | -4 |
| **ISODD** | Testuje, zda je číslo liché. | `ISODD(-2.5)` | Číslo. | |
| **LCM** | Vrátí nejmenší společný násobek. | `LCM(24, 36, 48)` | Dvě nebo více celých čísel. | 144 |
| **LN** | Vrátí přirozený logaritmus. | `LN(86)` | Kladné číslo. | 4.454347296253507 |
| **LOG** | Vrátí logaritmus o zadaném základu. | `LOG(8, 2)` | Číslo, základ. | 3 |
| **LOG10** | Vrátí dekadický logaritmus. | `LOG10(100000)` | Kladné číslo. | 5 |
| **MOD** | Vrátí zbytek po dělení. | `MOD(3, -2)` | Dělenec, dělitel. | -1 |
| **MROUND** | Zaokrouhlí číslo na nejbližší násobek. | `MROUND(-10, -3)` | Číslo, násobek. | -9 |
| **MULTINOMIAL** | Vrátí multinomický koeficient. | `MULTINOMIAL(2, 3, 4)` | Dvě nebo více nezáporných celých čísel. | 1260 |
| **ODD** | Zaokrouhlí číslo nahoru na nejbližší liché celé číslo. | `ODD(-1.5)` | Číslo. | -3 |
| **POWER** | Umocní číslo na zadanou mocninu. | `POWER(5, 2)` | Základ, exponent. | 25 |
| **PRODUCT** | Vrátí součin čísel. | `PRODUCT(5, 15, 30)` | Jedno nebo více čísel. | 2250 |
| **QUOTIENT** | Vrátí celočíselnou část podílu. | `QUOTIENT(-10, 3)` | Dělenec, dělitel. | -3 |
| **RADIANS** | Převede stupně na radiány. | `RADIANS(180)` | Stupně. | 3.141592653589793 |
| **RAND** | Vrátí náhodné reálné číslo mezi 0 a 1. | `RAND()` | Bez parametrů. | [Náhodné reálné číslo mezi 0 a 1] |
| **RANDBETWEEN** | Vrátí náhodné celé číslo v zadaném rozsahu. | `RANDBETWEEN(-1, 1)` | Dolní mez, horní mez. | [Náhodné celé číslo mezi dolní a horní mezí] |
| **ROUND** | Zaokrouhlí číslo na zadaný počet číslic. | `ROUND(626.3, -3)` | Číslo, číslice. | 1000 |
| **ROUNDDOWN** | Zaokrouhlí číslo dolů směrem k nule. | `ROUNDDOWN(-3.14159, 2)` | Číslo, číslice. | -3.14 |
| **ROUNDUP** | Zaokrouhlí číslo nahoru směrem od nuly. | `ROUNDUP(-3.14159, 2)` | Číslo, číslice. | -3.15 |
| **SEC** | Vrátí sekans (v radiánech). | `SEC(45)` | Úhel v radiánech. | 1.9035944074044246 |
| **SECH** | Vrátí hyperbolický sekans. | `SECH(45)` | Libovolné číslo. | 5.725037161098787e-20 |
| **SIGN** | Vrátí znaménko čísla. | `SIGN(-0.00001)` | Číslo. | -1 |
| **SIN** | Vrátí sinus (v radiánech). | `SIN(1)` | Úhel v radiánech. | 0.8414709848078965 |
| **SINH** | Vrátí hyperbolický sinus. | `SINH(1)` | Libovolné číslo. | 1.1752011936438014 |
| **SQRT** | Vrátí druhou odmocninu. | `SQRT(16)` | Nezáporné číslo. | 4 |
| **SQRTPI** | Vrátí druhou odmocninu z (číslo * π). | `SQRTPI(2)` | Nezáporné číslo. | 2.5066282746310002 |
| **SUBTOTAL** | Vrátí souhrn pro sadu dat a přitom ignoruje skryté řádky. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Číslo funkce, pole1, …, poleN. | 10,32 |
| **SUM** | Vrátí součet čísel, ignoruje text. | `SUM(-5, 15, 32, 'Hello World!')` | Jedno nebo více čísel. | 42 |
| **SUMIF** | Sečte hodnoty, které splňují jednu podmínku. | `SUMIF([2,4,8,16], '>5')` | Oblast, kritéria. | 24 |
| **SUMIFS** | Sečte hodnoty, které splňují více podmínek. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Oblast součtu, oblast kritérií 1, kritéria 1, …, oblast kritérií N, kritéria N. | 12 |
| **SUMPRODUCT** | Vrátí součet součinů odpovídajících prvků polí. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Dvě nebo více polí. | 5 |
| **SUMSQ** | Vrátí součet čtverců. | `SUMSQ(3, 4)` | Jedno nebo více čísel. | 25 |
| **SUMX2MY2** | Vrátí součet rozdílů čtverců odpovídajících prvků polí. | `SUMX2MY2([1,2], [3,4])` | Pole1, pole2. | -20 |
| **SUMX2PY2** | Vrátí součet součtů čtverců odpovídajících prvků polí. | `SUMX2PY2([1,2], [3,4])` | Pole1, pole2. | 30 |
| **SUMXMY2** | Vrátí součet čtverců rozdílů odpovídajících prvků polí. | `SUMXMY2([1,2], [3,4])` | Pole1, pole2. | 8 |
| **TAN** | Vrátí tangens (v radiánech). | `TAN(1)` | Úhel v radiánech. | 1.5574077246549023 |
| **TANH** | Vrátí hyperbolický tangens. | `TANH(-2)` | Libovolné číslo. | -0.9640275800758168 |
| **TRUNC** | Odřízne desetinnou část čísla na celé číslo bez zaokrouhlování. | `TRUNC(-8.9)` | Číslo, [číslice]. | -8 |

### Statistické

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Vrátí průměrnou absolutní odchylku. | `AVEDEV([2,4], [8,16])` | Pole čísel představující datové body. | 4.5 |
| **AVERAGE** | Vrátí aritmetický průměr. | `AVERAGE([2,4], [8,16])` | Pole čísel představující datové body. | 7.5 |
| **AVERAGEA** | Vrátí průměr hodnot včetně textu a logických hodnot. | `AVERAGEA([2,4], [8,16])` | Pole čísel, textu nebo logických hodnot; zahrnuty jsou všechny neprázdné hodnoty. | 7.5 |
| **AVERAGEIF** | Vypočítá průměr na základě jedné podmínky. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | První parametr je oblast pro kontrolu, druhý je podmínka, třetí volitelná oblast použitá pro průměrování. | 3.5 |
| **AVERAGEIFS** | Vypočítá průměr na základě více podmínek. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | První parametr jsou hodnoty k průměrování, následují dvojice oblastí kritérií a výrazů kritérií. | 6 |
| **BETADIST** | Vrátí kumulativní hustotu pravděpodobnosti rozdělení beta. | `BETADIST(2, 8, 10, true, 1, 3)` | Hodnota, alfa, beta, kumulativní příznak, A (volitelné), B (volitelné). | 0.6854705810117458 |
| **BETAINV** | Vrátí inverzní funkci ke kumulativnímu rozdělení beta. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Pravděpodobnost, alfa, beta, A (volitelné), B (volitelné). | 1.9999999999999998 |
| **BINOMDIST** | Vrátí pravděpodobnost binomického rozdělení. | `BINOMDIST(6, 10, 0.5, false)` | Počet úspěchů, pokusy, pravděpodobnost úspěchu, kumulativní příznak. | 0.205078125 |
| **CORREL** | Vrátí korelační koeficient mezi dvěma sadami dat. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Dvě pole čísel. | 0.9970544855015815 |
| **COUNT** | Spočítá buňky obsahující čísla. | `COUNT([1,2], [3,4])` | Pole nebo oblasti čísel. | 4 |
| **COUNTA** | Spočítá neprázdné buňky. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Pole nebo oblasti jakéhokoli typu. | 4 |
| **COUNTBLANK** | Spočítá prázdné buňky. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Pole nebo oblasti jakéhokoli typu. | 2 |
| **COUNTIF** | Spočítá buňky odpovídající podmínce. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Oblast čísel nebo textu a podmínka. | 3 |
| **COUNTIFS** | Spočítá buňky odpovídající více podmínkám. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Dvojice oblastí kritérií a výrazů kritérií. | 2 |
| **COVARIANCEP** | Vrátí kovarianci základního souboru. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Dvě pole čísel. | 5.2 |
| **COVARIANCES** | Vrátí výběrovou kovarianci. | `COVARIANCES([2,4,8], [5,11,12])` | Dvě pole čísel. | 9.666666666666668 |
| **DEVSQ** | Vrátí součet čtverců odchylek. | `DEVSQ([2,4,8,16])` | Pole čísel představující datové body. | 115 |
| **EXPONDIST** | Vrátí exponenciální rozdělení. | `EXPONDIST(0.2, 10, true)` | Hodnota, lambda, kumulativní příznak. | 0.8646647167633873 |
| **FDIST** | Vrátí pravděpodobnostní rozdělení F. | `FDIST(15.2069, 6, 4, false)` | Hodnota, stupně volnosti 1, stupně volnosti 2, kumulativní příznak. | 0.0012237917087831735 |
| **FINV** | Vrátí inverzní funkci k rozdělení F. | `FINV(0.01, 6, 4)` | Pravděpodobnost, stupně volnosti 1, stupně volnosti 2. | 0.10930991412457851 |
| **FISHER** | Vrátí Fisherovu transformaci. | `FISHER(0.75)` | Číslo představující korelační koeficient. | 0.9729550745276566 |
| **FISHERINV** | Vrátí inverzní Fisherovu transformaci. | `FISHERINV(0.9729550745276566)` | Číslo představující výsledek Fisherovy transformace. | 0.75 |
| **FORECAST** | Předpoví hodnotu y pro dané x pomocí známých hodnot x a y. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nová hodnota x, pole známých hodnot y, pole známých hodnot x. | 10.607253086419755 |
| **FREQUENCY** | Vrátí četnost rozdělení. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Pole dat, pole intervalů. | 1,2,4,2 |
| **GAMMA** | Vrátí hodnotu funkce gama. | `GAMMA(2.5)` | Kladné číslo. | 1.3293403919101043 |
| **GAMMALN** | Vrátí přirozený logaritmus funkce gama. | `GAMMALN(10)` | Kladné číslo. | 12.801827480081961 |
| **GAUSS** | Vrátí pravděpodobnost na základě standardního normálního rozdělení. | `GAUSS(2)` | Číslo představující z-skóre. | 0.4772498680518208 |
| **GEOMEAN** | Vrátí geometrický průměr. | `GEOMEAN([2,4], [8,16])` | Pole čísel. | 5.656854249492381 |
| **GROWTH** | Předpoví hodnoty exponenciálního růstu na základě známých dat. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Pole známých hodnot y, pole známých hodnot x, nové hodnoty x. | 32.00000000000003 |
| **HARMEAN** | Vrátí harmonický průměr. | `HARMEAN([2,4], [8,16])` | Pole čísel. | 4.266666666666667 |
| **HYPGEOMDIST** | Vrátí hypergeometrické rozdělení. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Úspěchy ve výběru, velikost výběru, úspěchy v populaci, velikost populace, kumulativní příznak. | 0.3632610939112487 |
| **INTERCEPT** | Vrátí průsečík regresní přímky. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Pole známých hodnot y, pole známých hodnot x. | 0.04838709677419217 |
| **KURT** | Vrátí špičatost. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Pole čísel. | -0.15179963720841627 |
| **LARGE** | Vrátí k-tou největší hodnotu. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Pole čísel, k. | 5 |
| **LINEST** | Provede analýzu lineární regrese. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Pole známých hodnot y, pole známých hodnot x, vrátit další statistiky, vrátit více statistik. | 2,1 |
| **LOGNORMDIST** | Vrátí logaritmicko-normální rozdělení. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Hodnota, střední hodnota, směrodatná odchylka, kumulativní příznak. | 0.0390835557068005 |
| **LOGNORMINV** | Vrátí inverzní funkci k logaritmicko-normálnímu rozdělení. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Pravděpodobnost, střední hodnota, směrodatná odchylka, kumulativní příznak. | 4.000000000000001 |
| **MAX** | Vrátí maximální hodnotu. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Pole čísel. | 0.8 |
| **MAXA** | Vrátí maximální hodnotu včetně textu a logických hodnot. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Pole čísel, textu nebo logických hodnot. | 1 |
| **MEDIAN** | Vrátí medián. | `MEDIAN([1,2,3], [4,5,6])` | Pole čísel. | 3.5 |
| **MIN** | Vrátí minimální hodnotu. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Pole čísel. | 0.1 |
| **MINA** | Vrátí minimální hodnotu včetně textu a logických hodnot. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Pole čísel, textu nebo logických hodnot. | 0 |
| **MODEMULT** | Vrátí pole nejčastěji se vyskytujících hodnot. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Pole čísel. | 2,3 |
| **MODESNGL** | Vrátí nejčastěji se vyskytující jednu hodnotu. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Pole čísel. | 2 |
| **NORMDIST** | Vrátí normální rozdělení. | `NORMDIST(42, 40, 1.5, true)` | Hodnota, střední hodnota, směrodatná odchylka, kumulativní příznak. | 0.9087887802741321 |
| **NORMINV** | Vrátí inverzní funkci k normálnímu rozdělení. | `NORMINV(0.9087887802741321, 40, 1.5)` | Pravděpodobnost, střední hodnota, směrodatná odchylka. | 42 |
| **NORMSDIST** | Vrátí standardní normální rozdělení. | `NORMSDIST(1, true)` | Číslo představující z-skóre. | 0.8413447460685429 |
| **NORMSINV** | Vrátí inverzní funkci ke standardnímu normálnímu rozdělení. | `NORMSINV(0.8413447460685429)` | Pravděpodobnost. | 1.0000000000000002 |
| **PEARSON** | Vrátí Pearsonův korelační koeficient. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Dvě pole čísel. | 0.6993786061802354 |
| **PERCENTILEEXC** | Vrátí k-tý percentil (bez mezních hodnot). | `PERCENTILEEXC([1,2,3,4], 0.3)` | Pole čísel, k. | 1.5 |
| **PERCENTILEINC** | Vrátí k-tý percentil (včetně mezních hodnot). | `PERCENTILEINC([1,2,3,4], 0.3)` | Pole čísel, k. | 1.9 |
| **PERCENTRANKEXC** | Vrátí pořadí hodnoty v sadě dat jako procento (bez mezních hodnot). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Pole čísel, hodnota x, významnost (volitelné). | 0.4 |
| **PERCENTRANKINC** | Vrátí pořadí hodnoty v sadě dat jako procento (včetně mezních hodnot). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Pole čísel, hodnota x, významnost (volitelné). | 0.33 |
| **PERMUT** | Vrátí počet permutací. | `PERMUT(100, 3)` | Celkový počet n, vybraný počet k. | 970200 |
| **PERMUTATIONA** | Vrátí počet permutací s opakováním. | `PERMUTATIONA(4, 3)` | Celkový počet n, vybraný počet k. | 64 |
| **PHI** | Vrátí hodnotu hustoty pravděpodobnosti pro standardní normální rozdělení. | `PHI(0.75)` | Číslo představující z-skóre. | 0.30113743215480443 |
| **POISSONDIST** | Vrátí Poissonovo rozdělení. | `POISSONDIST(2, 5, true)` | Počet událostí, střední hodnota, kumulativní příznak. | 0.12465201948308113 |
| **PROB** | Vrátí pravděpodobnost výskytu hodnot v rozsahu. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Pole hodnot, pole pravděpodobností, dolní mez, horní mez. | 0.4 |
| **QUARTILEEXC** | Vrátí kvartil sady dat (bez mezních hodnot). | `QUARTILEEXC([1,2,3,4], 1)` | Pole čísel, kvartil. | 1.25 |
| **QUARTILEINC** | Vrátí kvartil sady dat (včetně mezních hodnot). | `QUARTILEINC([1,2,3,4], 1)` | Pole čísel, kvartil. | 1.75 |
| **RANKAVG** | Vrátí průměrné pořadí. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Číslo, pole čísel, pořadí (vzestupně/sestupně). | 4.5 |
| **RANKEQ** | Vrátí pořadí čísla. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Číslo, pole čísel, pořadí (vzestupně/sestupně). | 4 |
| **RSQ** | Vrátí druhou mocninu Pearsonova korelačního koeficientu. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Dvě pole čísel. | 0.4891304347826088 |
| **SKEW** | Vrátí šikmost. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Pole čísel. | 0.3595430714067974 |
| **SKEWP** | Vrátí šikmost základního souboru. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Pole čísel. | 0.303193339354144 |
| **SLOPE** | Vrátí směrnici regresní přímky. | `SLOPE([1,9,5,7], [0,4,2,3])` | Pole známých hodnot y, pole známých hodnot x. | 2 |
| **SMALL** | Vrátí k-tou nejmenší hodnotu. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Pole čísel, k. | 3 |
| **STANDARDIZE** | Vrátí normalizovanou hodnotu (z-skóre). | `STANDARDIZE(42, 40, 1.5)` | Hodnota, střední hodnota, směrodatná odchylka. | 1.3333333333333333 |
| **STDEVA** | Vrátí směrodatnou odchylku včetně textu a logických hodnot. | `STDEVA([2,4], [8,16], [true, false])` | Pole čísel, textu nebo logických hodnot. | 6.013872850889572 |
| **STDEVP** | Vrátí směrodatnou odchylku základního souboru. | `STDEVP([2,4], [8,16], [true, false])` | Pole čísel. | 5.361902647381804 |
| **STDEVPA** | Vrátí směrodatnou odchylku základního souboru včetně textu a logických hodnot. | `STDEVPA([2,4], [8,16], [true, false])` | Pole čísel, textu nebo logických hodnot. | 5.489889697333535 |
| **STDEVS** | Vrátí směrodatnou odchylku výběru. | `VARS([2,4], [8,16], [true, false])` | Pole čísel. | 6.191391873668904 |
| **STEYX** | Vrátí standardní chybu odhadované hodnoty y. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Pole známých hodnot y, pole známých hodnot x. | 3.305718950210041 |
| **TINV** | Vrátí inverzní funkci k t-rozdělení. | `TINV(0.9946953263673741, 1)` | Pravděpodobnost, stupně volnosti. | 59.99999999996535 |
| **TRIMMEAN** | Vrátí průměr vnitřní části sady dat. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Pole čísel, podíl k odříznutí. | 3.7777777777777777 |
| **VARA** | Vrátí rozptyl včetně textu a logických hodnot. | `VARA([2,4], [8,16], [true, false])` | Pole čísel, textu nebo logických hodnot. | 36.16666666666667 |
| **VARP** | Vrátí rozptyl základního souboru. | `VARP([2,4], [8,16], [true, false])` | Pole čísel. | 28.75 |
| **VARPA** | Vrátí rozptyl základního souboru včetně textu a logických hodnot. | `VARPA([2,4], [8,16], [true, false])` | Pole čísel, textu nebo logických hodnot. | 30.13888888888889 |
| **VARS** | Vrátí výběrový rozptyl. | `VARS([2,4], [8,16], [true, false])` | Pole čísel. | 38.333333333333336 |
| **WEIBULLDIST** | Vrátí Weibullovo rozdělení. | `WEIBULLDIST(105, 20, 100, true)` | Hodnota, alfa, beta, kumulativní příznak. | 0.9295813900692769 |
| **ZTEST** | Vrátí jednostrannou pravděpodobnost z-testu. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Pole čísel, hypotetický průměr. | 0.09057419685136381 |

### Textové

| Funkce | Definice | Příklad volání | Parametry | Očekávaný výsledek |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Převede kód čísla na odpovídající znak. | `CHAR(65)` | Číslo představující kód znaku. | A |
| **CLEAN** | Odstraní z textu všechny netisknutelné znaky. | `CLEAN('Monthly report')` | Textový řetězec k vyčištění. | Monthly report |
| **CODE** | Vrátí číselný kód prvního znaku v textovém řetězci. | `CODE('A')` | Textový řetězec obsahující jeden znak. | 65 |
| **CONCATENATE** | Spojí několik textových řetězců do jednoho. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Jeden nebo více textových řetězců ke spojení. | Andreas Hauser |
| **EXACT** | Zkontroluje, zda jsou dva řetězce přesně stejné (rozlišuje velká a malá písmena). | `EXACT('Word', 'word')` | Dva textové řetězce k porovnání. | |
| **FIND** | Najde pozici podřetězce počínaje zadanou pozicí. | `FIND('M', 'Miriam McGovern', 3)` | Hledaný text, zdrojový text, volitelná počáteční pozice. | 8 |
| **LEFT** | Vrátí zadaný počet znaků od začátku textového řetězce. | `LEFT('Sale Price', 4)` | Textový řetězec a počet znaků. | Sale |
| **LEN** | Vrátí počet znaků v textovém řetězci. | `LEN('Phoenix, AZ')` | Textový řetězec k počítání. | 11 |
| **LOWER** | Převede všechny znaky na malá písmena. | `LOWER('E. E. Cummings')` | Textový řetězec k převodu. | e. e. cummings |
| **MID** | Vrátí zadaný počet znaků od určité pozice v řetězci. | `MID('Fluid Flow', 7, 20)` | Textový řetězec, počáteční pozice, počet znaků. | Flow |
| **NUMBERVALUE** | Převede text na číslo pomocí zadaných oddělovačů. | `NUMBERVALUE('2.500,27', ',', '.')` | Textový řetězec, oddělovač desetinných míst, oddělovač skupin. | 2500.27 |
| **PROPER** | Převede první písmeno každého slova na velké. | `PROPER('this is a TITLE')` | Textový řetězec k formátování. | This Is A Title |
| **REPLACE** | Nahradí část textového řetězce jiným textem. | `REPLACE('abcdefghijk', 6, 5, '*')` | Původní text, počáteční pozice, počet znaků, nový text. | abcde*k |
| **REPT** | Zopakuje text zadaný početkrát. | `REPT('*-', 3)` | Textový řetězec a počet opakování. | *-*-*- |
| **RIGHT** | Vrátí zadaný počet znaků od konce textového řetězce. | `RIGHT('Sale Price', 5)` | Textový řetězec a počet znaků. | Price |
| **ROMAN** | Převede arabskou číslici na římskou. | `ROMAN(499)` | Arabské číslo k převodu. | CDXCIX |
| **SEARCH** | Najde pozici podřetězce (nerozlišuje velká a malá písmena). | `SEARCH('margin', 'Profit Margin')` | Hledaný text, zdrojový text. | 8 |
| **SUBSTITUTE** | Nahradí konkrétní výskyt starého textu novým textem. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Původní text, starý text, nový text, volitelné číslo výskytu. | Quarter 1, 2012 |
| **T** | Vrátí text, pokud je hodnota text; jinak vrátí prázdný řetězec. | `T('Rainfall')` | Argument může být jakýkoliv typ dat. | Rainfall |
| **TRIM** | Odstraní z textu mezery, s výjimkou jednoduchých mezer mezi slovy. | `TRIM(' First Quarter Earnings ')` | Textový řetězec k oříznutí. | First Quarter Earnings |
| **TEXTJOIN** | Spojí více textových položek do jednoho řetězce pomocí oddělovače. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Oddělovač, příznak ignorování prázdných hodnot, textové položky ke spojení. | The sun will come up tomorrow. |
| **UNICHAR** | Vrátí znak pro dané číslo Unicode. | `UNICHAR(66)` | Kód znaku Unicode. | B |
| **UNICODE** | Vrátí číslo Unicode prvního znaku textu. | `UNICODE('B')` | Textový řetězec obsahující jeden znak. | 66 |
| **UPPER** | Převede všechny znaky na velká písmena. | `UPPER('total')` | Textový řetězec k převodu. | TOTAL |