:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) zapewnia szeroki zestaw funkcji kompatybilnych z programem Excel.

## Odniesienie do funkcji

### Daty

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Tworzy datę na podstawie podanego roku, miesiąca i dnia. | `DATE(2008, 7, 8)` | Rok (liczba całkowita), miesiąc (1-12), dzień (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Konwertuje datę w formacie tekstowym na seryjny numer daty. | `DATEVALUE('8/22/2011')` | Ciąg tekstowy reprezentujący datę. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Zwraca dzień z podanej daty. | `DAY('15-Apr-11')` | Wartość daty lub tekstowy ciąg daty. | 15 |
| **DAYS** | Oblicza liczbę dni między dwiema datami. | `DAYS('3/15/11', '2/1/11')` | Data końcowa, data początkowa. | 42 |
| **DAYS360** | Oblicza liczbę dni między dwiema datami na podstawie roku liczącego 360 dni. | `DAYS360('1-Jan-11', '31-Dec-11')` | Data początkowa, data końcowa. | 360 |
| **EDATE** | Zwraca datę, która przypada określoną liczbę miesięcy przed lub po dacie początkowej. | `EDATE('1/15/11', -1)` | Data początkowa, liczba miesięcy (dodatnia dla przyszłości, ujemna dla przeszłości). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Zwraca ostatni dzień miesiąca przed lub po określonej liczbie miesięcy. | `EOMONTH('1/1/11', -3)` | Data początkowa, liczba miesięcy (dodatnia dla przyszłości, ujemna dla przeszłości). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Zwraca godzinę z wartości czasu. | `HOUR('7/18/2011 7:45:00 AM')` | Wartość czasu lub tekstowy ciąg czasu. | 7 |
| **MINUTE** | Zwraca minutę z wartości czasu. | `MINUTE('2/1/2011 12:45:00 PM')` | Wartość czasu lub tekstowy ciąg czasu. | 45 |
| **ISOWEEKNUM** | Zwraca numer tygodnia w roku według standardu ISO dla danej daty. | `ISOWEEKNUM('3/9/2012')` | Wartość daty lub tekstowy ciąg daty. | 10 |
| **MONTH** | Zwraca miesiąc z podanej daty. | `MONTH('15-Apr-11')` | Wartość daty lub tekstowy ciąg daty. | 4 |
| **NETWORKDAYS** | Oblicza liczbę dni roboczych między dwiema datami, z wyłączeniem weekendów i opcjonalnych świąt. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Data początkowa, data końcowa, opcjonalna tablica świąt. | 109 |
| **NETWORKDAYSINTL** | Oblicza liczbę dni roboczych między dwiema datami, pozwalając na niestandardowe weekendy i opcjonalne święta. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Data początkowa, data końcowa, tryb weekendu, opcjonalna tablica świąt. | 23 |
| **NOW** | Zwraca bieżącą datę i godzinę. | `NOW()` | Brak parametrów. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Zwraca sekundy z wartości czasu. | `SECOND('2/1/2011 4:48:18 PM')` | Wartość czasu lub tekstowy ciąg czasu. | 18 |
| **TIME** | Tworzy wartość czasu na podstawie podanej godziny, minuty i sekundy. | `TIME(16, 48, 10)` | Godzina (0-23), minuta (0-59), sekunda (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Konwertuje czas w formacie tekstowym na seryjny numer czasu. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Ciąg tekstowy reprezentujący czas. | 0.2743055555555556 |
| **TODAY** | Zwraca bieżącą datę. | `TODAY()` | Brak parametrów. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Zwraca numer odpowiadający dniu tygodnia. | `WEEKDAY('2/14/2008', 3)` | Wartość daty lub tekstowy ciąg daty, typ zwracany (1-3). | 3 |
| **YEAR** | Zwraca rok z podanej daty. | `YEAR('7/5/2008')` | Wartość daty lub tekstowy ciąg daty. | 2008 |
| **WEEKNUM** | Zwraca numer tygodnia w roku dla danej daty. | `WEEKNUM('3/9/2012', 2)` | Wartość daty lub tekstowy ciąg daty, opcjonalny dzień rozpoczęcia tygodnia (1=niedziela, 2=poniedziałek). | 11 |
| **WORKDAY** | Zwraca datę przed lub po określonej liczbie dni roboczych, z wyłączeniem weekendów i opcjonalnych świąt. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Data początkowa, liczba dni roboczych, opcjonalna tablica świąt. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Zwraca datę przed lub po określonej liczbie dni roboczych z niestandardowymi weekendami i opcjonalnymi świętami. | `WORKDAYINTL('1/1/2012', 30, 17)` | Data początkowa, liczba dni roboczych, tryb weekendu. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Oblicza ułamkową liczbę lat między dwiema datami. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Data początkowa, data końcowa, opcjonalna podstawa (podstawa liczenia dni). | 0.5780821917808219 |

### Finanse

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Oblicza narosłe odsetki dla papieru wartościowego z okresową płatnością odsetek. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Data emisji, data pierwszej płatności, data rozliczenia, stopa roczna, wartość nominalna, częstotliwość, podstawa. | 350 |
| **CUMIPMT** | Oblicza skumulowane odsetki zapłacone w serii płatności. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Stopa, całkowita liczba okresów, wartość bieżąca, okres początkowy, okres końcowy, typ płatności (0=koniec, 1=początek). | -9916.77251395708 |
| **CUMPRINC** | Oblicza skumulowany kapitał zapłacony w serii płatności. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Stopa, całkowita liczba okresów, wartość bieżąca, okres początkowy, okres końcowy, typ płatności (0=koniec, 1=początek). | -614.0863271085149 |
| **DB** | Oblicza amortyzację metodą degresywną z ustalonym współczynnikiem. | `DB(1000000, 100000, 6, 1, 6)` | Koszt, wartość końcowa, okres użytkowania, okres, miesiąc. | 159500 |
| **DDB** | Oblicza amortyzację metodą podwójnie degresywną lub inną określoną metodą. | `DDB(1000000, 100000, 6, 1, 1.5)` | Koszt, wartość końcowa, okres użytkowania, okres, czynnik. | 250000 |
| **DOLLARDE** | Konwertuje cenę wyrażoną jako ułamek na liczbę dziesiętną. | `DOLLARDE(1.1, 16)` | Cena jako ułamek dolara, mianownik. | 1.625 |
| **DOLLARFR** | Konwertuje cenę wyrażoną jako liczbę dziesiętną na ułamek. | `DOLLARFR(1.625, 16)` | Cena jako dziesiętny dolar, mianownik. | 1.1 |
| **EFFECT** | Oblicza efektywną roczną stopę procentową. | `EFFECT(0.1, 4)` | Nominalna stopa roczna, liczba okresów kapitalizacji w roku. | 0.10381289062499977 |
| **FV** | Oblicza przyszłą wartość inwestycji. | `FV(0.1/12, 10, -100, -1000, 0)` | Stopa na okres, liczba okresów, płatność na okres, wartość bieżąca, typ płatności (0=koniec, 1=początek). | 2124.874409194097 |
| **FVSCHEDULE** | Oblicza przyszłą wartość kapitału początkowego przy zastosowaniu serii zmiennych stóp procentowych. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Kapitał, tablica stóp. | 133.08900000000003 |
| **IPMT** | Oblicza płatność odsetek dla określonego okresu. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Stopa na okres, okres, całkowita liczba okresów, wartość bieżąca, wartość przyszła, typ płatności (0=koniec, 1=początek). | 928.8235718400465 |
| **IRR** | Oblicza wewnętrzną stopę zwrotu. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Tablica przepływów pieniężnych, szacunek. | 0.05715142887178447 |
| **ISPMT** | Oblicza odsetki zapłacone w określonym okresie (dla pożyczek). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Stopa na okres, okres, całkowita liczba okresów, kwota pożyczki. | -625 |
| **MIRR** | Oblicza zmodyfikowaną wewnętrzną stopę zwrotu. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Tablica przepływów pieniężnych, stopa finansowania, stopa reinwestycji. | 0.07971710360838036 |
| **NOMINAL** | Oblicza nominalną roczną stopę procentową. | `NOMINAL(0.1, 4)` | Efektywna stopa roczna, liczba okresów kapitalizacji w roku. | 0.09645475633778045 |
| **NPER** | Oblicza liczbę okresów wymaganych do osiągnięcia wartości docelowej. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Stopa na okres, płatność na okres, wartość bieżąca, wartość przyszła, typ płatności (0=koniec, 1=początek). | 63.39385422740764 |
| **NPV** | Oblicza wartość bieżącą netto serii przyszłych przepływów pieniężnych. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Stopa dyskontowa na okres, tablica przepływów pieniężnych. | 1031.3503176012546 |
| **PDURATION** | Oblicza czas wymagany do osiągnięcia pożądanej wartości. | `PDURATION(0.1, 1000, 2000)` | Stopa na okres, wartość bieżąca, wartość przyszła. | 7.272540897341714 |
| **PMT** | Oblicza okresową płatność dla pożyczki. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Stopa na okres, całkowita liczba okresów, wartość bieżąca, wartość przyszła, typ płatności (0=koniec, 1=początek). | -42426.08563793503 |
| **PPMT** | Oblicza płatność kapitału dla określonego okresu. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Stopa na okres, okres, całkowita liczba okresów, wartość bieżąca, wartość przyszła, typ płatności (0=koniec, 1=początek). | -43354.909209775076 |
| **PV** | Oblicza wartość bieżącą inwestycji. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Stopa na okres, liczba okresów, płatność na okres, wartość przyszła, typ płatności (0=koniec, 1=początek). | -29864.950264779152 |
| **RATE** | Oblicza stopę procentową na okres. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Całkowita liczba okresów, płatność na okres, wartość bieżąca, wartość przyszła, typ płatności (0=koniec, 1=początek), szacunek. | 0.06517891177181533 |

### Inżynieria

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Konwertuje liczbę binarną na dziesiętną. | `BIN2DEC(101010)` | Liczba binarna. | 42 |
| **BIN2HEX** | Konwertuje liczbę binarną na szesnastkową. | `BIN2HEX(101010)` | Liczba binarna. | 2a |
| **BIN2OCT** | Konwertuje liczbę binarną na ósemkową. | `BIN2OCT(101010)` | Liczba binarna. | 52 |
| **BITAND** | Zwraca bitowe AND dwóch liczb. | `BITAND(42, 24)` | Liczba całkowita, liczba całkowita. | 8 |
| **BITLSHIFT** | Wykonuje bitowe przesunięcie w lewo. | `BITLSHIFT(42, 24)` | Liczba całkowita, liczba bitów do przesunięcia. | 704643072 |
| **BITOR** | Zwraca bitowe OR dwóch liczb. | `BITOR(42, 24)` | Liczba całkowita, liczba całkowita. | 58 |
| **BITRSHIFT** | Wykonuje bitowe przesunięcie w prawo. | `BITRSHIFT(42, 2)` | Liczba całkowita, liczba bitów do przesunięcia. | 10 |
| **BITXOR** | Zwraca bitowe XOR dwóch liczb. | `BITXOR(42, 24)` | Liczba całkowita, liczba całkowita. | 50 |
| **COMPLEX** | Tworzy liczbę zespoloną. | `COMPLEX(3, 4)` | Część rzeczywista, część urojona. | 3+4i |
| **CONVERT** | Konwertuje liczbę z jednej jednostki miary na inną. | `CONVERT(64, 'kibyte', 'bit')` | Wartość, jednostka źródłowa, jednostka docelowa. | 524288 |
| **DEC2BIN** | Konwertuje liczbę dziesiętną na binarną. | `DEC2BIN(42)` | Liczba dziesiętna. | 101010 |
| **DEC2HEX** | Konwertuje liczbę dziesiętną na szesnastkową. | `DEC2HEX(42)` | Liczba dziesiętna. | 2a |
| **DEC2OCT** | Konwertuje liczbę dziesiętną na ósemkową. | `DEC2OCT(42)` | Liczba dziesiętna. | 52 |
| **DELTA** | Sprawdza, czy dwie wartości są równe. | `DELTA(42, 42)` | Liczba, liczba. | 1 |
| **ERF** | Zwraca funkcję błędu. | `ERF(1)` | Górna granica. | 0.8427007929497149 |
| **ERFC** | Zwraca komplementarną funkcję błędu. | `ERFC(1)` | Dolna granica. | 0.1572992070502851 |
| **GESTEP** | Sprawdza, czy liczba jest większa lub równa wartości progowej. | `GESTEP(42, 24)` | Liczba, próg. | 1 |
| **HEX2BIN** | Konwertuje liczbę szesnastkową na binarną. | `HEX2BIN('2a')` | Liczba szesnastkowa. | 101010 |
| **HEX2DEC** | Konwertuje liczbę szesnastkową na dziesiętną. | `HEX2DEC('2a')` | Liczba szesnastkowa. | 42 |
| **HEX2OCT** | Konwertuje liczbę szesnastkową na ósemkową. | `HEX2OCT('2a')` | Liczba szesnastkowa. | 52 |
| **IMABS** | Zwraca wartość bezwzględną (moduł) liczby zespolonej. | `IMABS('3+4i')` | Liczba zespolona. | 5 |
| **IMAGINARY** | Zwraca część urojoną liczby zespolonej. | `IMAGINARY('3+4i')` | Liczba zespolona. | 4 |
| **IMARGUMENT** | Zwraca argument liczby zespolonej. | `IMARGUMENT('3+4i')` | Liczba zespolona. | 0.9272952180016122 |
| **IMCONJUGATE** | Zwraca sprzężenie liczby zespolonej. | `IMCONJUGATE('3+4i')` | Liczba zespolona. | 3-4i |
| **IMCOS** | Zwraca cosinus liczby zespolonej. | `IMCOS('1+i')` | Liczba zespolona. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Zwraca cosinus hiperboliczny liczby zespolonej. | `IMCOSH('1+i')` | Liczba zespolona. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Zwraca cotangens liczby zespolonej. | `IMCOT('1+i')` | Liczba zespolona. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Zwraca cosecans liczby zespolonej. | `IMCSC('1+i')` | Liczba zespolona. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Zwraca cosecans hiperboliczny liczby zespolonej. | `IMCSCH('1+i')` | Liczba zespolona. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Zwraca iloraz dwóch liczb zespolonych. | `IMDIV('1+2i', '3+4i')` | Dzielna liczba zespolona, dzielnik liczba zespolona. | 0.44+0.08i |
| **IMEXP** | Zwraca funkcję wykładniczą liczby zespolonej. | `IMEXP('1+i')` | Liczba zespolona. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Zwraca logarytm naturalny liczby zespolonej. | `IMLN('1+i')` | Liczba zespolona. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Zwraca logarytm dziesiętny liczby zespolonej. | `IMLOG10('1+i')` | Liczba zespolona. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Zwraca logarytm o podstawie 2 liczby zespolonej. | `IMLOG2('1+i')` | Liczba zespolona. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Zwraca liczbę zespoloną podniesioną do potęgi. | `IMPOWER('1+i', 2)` | Liczba zespolona, wykładnik. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Zwraca iloczyn liczb zespolonych. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Tablica liczb zespolonych. | -85+20i |
| **IMREAL** | Zwraca część rzeczywistą liczby zespolonej. | `IMREAL('3+4i')` | Liczba zespolona. | 3 |
| **IMSEC** | Zwraca secans liczby zespolonej. | `IMSEC('1+i')` | Liczba zespolona. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Zwraca secans hiperboliczny liczby zespolonej. | `IMSECH('1+i')` | Liczba zespolona. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Zwraca sinus liczby zespolonej. | `IMSIN('1+i')` | Liczba zespolona. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Zwraca sinus hiperboliczny liczby zespolonej. | `IMSINH('1+i')` | Liczba zespolona. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Zwraca pierwiastek kwadratowy liczby zespolonej. | `IMSQRT('1+i')` | Liczba zespolona. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Zwraca różnicę między dwiema liczbami zespolonymi. | `IMSUB('3+4i', '1+2i')` | Odjemna liczba zespolona, odjemnik liczba zespolona. | 2+2i |
| **IMSUM** | Zwraca sumę liczb zespolonych. | `IMSUM('1+2i', '3+4i', '5+6i')` | Tablica liczb zespolonych. | 9+12i |
| **IMTAN** | Zwraca tangens liczby zespolonej. | `IMTAN('1+i')` | Liczba zespolona. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Konwertuje liczbę ósemkową na binarną. | `OCT2BIN('52')` | Liczba ósemkowa. | 101010 |
| **OCT2DEC** | Konwertuje liczbę ósemkową na dziesiętną. | `OCT2DEC('52')` | Liczba ósemkowa. | 42 |
| **OCT2HEX** | Konwertuje liczbę ósemkową na szesnastkową. | `OCT2HEX('52')` | Liczba ósemkowa. | 2a |

### Logika

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Zwraca PRAWDA tylko wtedy, gdy wszystkie argumenty są prawdziwe, w przeciwnym razie FAŁSZ. | `AND(true, false, true)` | Jedna lub więcej wartości logicznych (Boolean); funkcja zwraca PRAWDA tylko wtedy, gdy każdy argument jest prawdziwy. | |
| **FALSE** | Zwraca wartość logiczną FAŁSZ. | `FALSE()` | Brak parametrów. | |
| **IF** | Zwraca różne wartości w zależności od tego, czy warunek jest prawdziwy (PRAWDA), czy fałszywy (FAŁSZ). | `IF(true, 'Hello!', 'Goodbye!')` | Warunek, wartość jeśli PRAWDA, wartość jeśli FAŁSZ. | Hello! |
| **IFS** | Sprawdza wiele warunków i zwraca wynik odpowiadający pierwszemu prawdziwemu warunkowi. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Wiele par warunek i odpowiadająca mu wartość. | Goodbye! |
| **NOT** | Odwraca wartość logiczną. PRAWDA staje się FAŁSZEM i na odwrót. | `NOT(true)` | Jedna wartość logiczna (Boolean). | |
| **OR** | Zwraca PRAWDA, jeśli którykolwiek z argumentów jest prawdziwy, w przeciwnym razie FAŁSZ. | `OR(true, false, true)` | Jedna lub więcej wartości logicznych (Boolean); zwraca PRAWDA, gdy którykolwiek argument jest prawdziwy. | |
| **SWITCH** | Zwraca wartość pasującą do wyrażenia; jeśli żadna nie pasuje, zwraca wartość domyślną. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Wyrażenie, wartość dopasowania 1, wynik 1, …, [domyślny]. | Seven |
| **TRUE** | Zwraca wartość logiczną PRAWDA. | `TRUE()` | Brak parametrów. | |
| **XOR** | Zwraca PRAWDA tylko wtedy, gdy nieparzysta liczba argumentów jest prawdziwa, w przeciwnym razie FAŁSZ. | `XOR(true, false, true)` | Jedna lub więcej wartości logicznych (Boolean); zwraca PRAWDA, gdy nieparzysta liczba argumentów jest prawdziwa. | |

### Matematyka

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Zwraca wartość bezwzględną liczby. | `ABS(-4)` | Liczba. | 4 |
| **ACOS** | Zwraca arcus cosinus (w radianach). | `ACOS(-0.5)` | Liczba między -1 a 1. | 2.0943951023931957 |
| **ACOSH** | Zwraca odwrotny cosinus hiperboliczny. | `ACOSH(10)` | Liczba większa lub równa 1. | 2.993222846126381 |
| **ACOT** | Zwraca arcus cotangens (w radianach). | `ACOT(2)` | Dowolna liczba. | 0.46364760900080615 |
| **ACOTH** | Zwraca odwrotny cotangens hiperboliczny. | `ACOTH(6)` | Liczba, której wartość bezwzględna jest większa niż 1. | 0.16823611831060645 |
| **AGGREGATE** | Wykonuje obliczenia agregujące, ignorując błędy lub ukryte wiersze. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Numer funkcji, opcje, tablica1, …, tablicaN. | 10,32 |
| **ARABIC** | Konwertuje liczbę rzymską na arabską. | `ARABIC('MCMXII')` | Ciąg znaków liczby rzymskiej. | 1912 |
| **ASIN** | Zwraca arcus sinus (w radianach). | `ASIN(-0.5)` | Liczba między -1 a 1. | -0.5235987755982988 |
| **ASINH** | Zwraca odwrotny sinus hiperboliczny. | `ASINH(-2.5)` | Dowolna liczba. | -1.6472311463710965 |
| **ATAN** | Zwraca arcus tangens (w radianach). | `ATAN(1)` | Dowolna liczba. | 0.7853981633974483 |
| **ATAN2** | Zwraca arcus tangens (w radianach) dla pary współrzędnych. | `ATAN2(-1, -1)` | Współrzędna y, współrzędna x. | -2.356194490192345 |
| **ATANH** | Zwraca odwrotny tangens hiperboliczny. | `ATANH(-0.1)` | Liczba między -1 a 1. | -0.10033534773107562 |
| **BASE** | Konwertuje liczbę na tekst o określonej podstawie. | `BASE(15, 2, 10)` | Liczba, podstawa, [minimalna długość]. | 0000001111 |
| **CEILING** | Zaokrągla liczbę w górę do najbliższej wielokrotności. | `CEILING(-5.5, 2, -1)` | Liczba, istotność, [tryb]. | -6 |
| **CEILINGMATH** | Zaokrągla liczbę w górę przy użyciu podanej wielokrotności i kierunku. | `CEILINGMATH(-5.5, 2, -1)` | Liczba, [istotność], [tryb]. | -6 |
| **CEILINGPRECISE** | Zaokrągla liczbę w górę do najbliższej wielokrotności, ignorując znak. | `CEILINGPRECISE(-4.1, -2)` | Liczba, [istotność]. | -4 |
| **COMBIN** | Zwraca liczbę kombinacji. | `COMBIN(8, 2)` | Suma elementów, liczba wybranych. | 28 |
| **COMBINA** | Zwraca liczbę kombinacji z powtórzeniami. | `COMBINA(4, 3)` | Suma elementów, liczba wybranych. | 20 |
| **COS** | Zwraca cosinus (w radianach). | `COS(1)` | Kąt w radianach. | 0.5403023058681398 |
| **COSH** | Zwraca cosinus hiperboliczny. | `COSH(1)` | Dowolna liczba. | 1.5430806348152437 |
| **COT** | Zwraca cotangens (w radianach). | `COT(30)` | Kąt w radianach. | -0.15611995216165922 |
| **COTH** | Zwraca cotangens hiperboliczny. | `COTH(2)` | Dowolna liczba. | 1.0373147207275482 |
| **CSC** | Zwraca cosecans (w radianach). | `CSC(15)` | Kąt w radianach. | 1.5377805615408537 |
| **CSCH** | Zwraca cosecans hiperboliczny. | `CSCH(1.5)` | Dowolna liczba. | 0.46964244059522464 |
| **DECIMAL** | Konwertuje liczbę w formie tekstowej na dziesiętną. | `DECIMAL('FF', 16)` | Tekst, podstawa. | 255 |
| **ERF** | Zwraca funkcję błędu. | `ERF(1)` | Górna granica. | 0.8427007929497149 |
| **ERFC** | Zwraca komplementarną funkcję błędu. | `ERFC(1)` | Dolna granica. | 0.1572992070502851 |
| **EVEN** | Zaokrągla liczbę w górę do najbliższej parzystej liczby całkowitej. | `EVEN(-1)` | Liczba. | -2 |
| **EXP** | Zwraca liczbę e podniesioną do potęgi. | `EXP(1)` | Wykładnik. | 2.718281828459045 |
| **FACT** | Zwraca silnię. | `FACT(5)` | Nieujemna liczba całkowita. | 120 |
| **FACTDOUBLE** | Zwraca silnię podwójną. | `FACTDOUBLE(7)` | Nieujemna liczba całkowita. | 105 |
| **FLOOR** | Zaokrągla liczbę w dół do najbliższej wielokrotności. | `FLOOR(-3.1)` | Liczba, istotność. | -4 |
| **FLOORMATH** | Zaokrągla liczbę w dół przy użyciu podanej wielokrotności i kierunku. | `FLOORMATH(-4.1, -2, -1)` | Liczba, [istotność], [tryb]. | -4 |
| **FLOORPRECISE** | Zaokrągla liczbę w dół do najbliższej wielokrotności, ignorując znak. | `FLOORPRECISE(-3.1, -2)` | Liczba, [istotność]. | -4 |
| **GCD** | Zwraca największy wspólny dzielnik. | `GCD(24, 36, 48)` | Dwie lub więcej liczb całkowitych. | 12 |
| **INT** | Zaokrągla liczbę w dół do najbliższej liczby całkowitej. | `INT(-8.9)` | Liczba. | -9 |
| **ISEVEN** | Sprawdza, czy liczba jest parzysta. | `ISEVEN(-2.5)` | Liczba. | |
| **ISOCEILING** | Zaokrągla liczbę w górę do najbliższej wielokrotności zgodnie z zasadami ISO. | `ISOCEILING(-4.1, -2)` | Liczba, [istotność]. | -4 |
| **ISODD** | Sprawdza, czy liczba jest nieparzysta. | `ISODD(-2.5)` | Liczba. | |
| **LCM** | Zwraca najmniejszą wspólną wielokrotność. | `LCM(24, 36, 48)` | Dwie lub więcej liczb całkowitych. | 144 |
| **LN** | Zwraca logarytm naturalny. | `LN(86)` | Liczba dodatnia. | 4.454347296253507 |
| **LOG** | Zwraca logarytm o określonej podstawie. | `LOG(8, 2)` | Liczba, podstawa. | 3 |
| **LOG10** | Zwraca logarytm dziesiętny. | `LOG10(100000)` | Liczba dodatnia. | 5 |
| **MOD** | Zwraca resztę z dzielenia. | `MOD(3, -2)` | Dzielna, dzielnik. | -1 |
| **MROUND** | Zaokrągla liczbę do najbliższej wielokrotności. | `MROUND(-10, -3)` | Liczba, wielokrotność. | -9 |
| **MULTINOMIAL** | Zwraca współczynnik wielomianowy. | `MULTINOMIAL(2, 3, 4)` | Dwie lub więcej nieujemnych liczb całkowitych. | 1260 |
| **ODD** | Zaokrągla liczbę w górę do najbliższej nieparzystej liczby całkowitej. | `ODD(-1.5)` | Liczba. | -3 |
| **POWER** | Podnosi liczbę do potęgi. | `POWER(5, 2)` | Podstawa, wykładnik. | 25 |
| **PRODUCT** | Zwraca iloczyn liczb. | `PRODUCT(5, 15, 30)` | Jedna lub więcej liczb. | 2250 |
| **QUOTIENT** | Zwraca część całkowitą z dzielenia. | `QUOTIENT(-10, 3)` | Dzielna, dzielnik. | -3 |
| **RADIANS** | Konwertuje stopnie na radiany. | `RADIANS(180)` | Stopnie. | 3.141592653589793 |
| **RAND** | Zwraca losową liczbę rzeczywistą między 0 a 1. | `RAND()` | Brak parametrów. | [Losowa liczba rzeczywista między 0 a 1] |
| **RANDBETWEEN** | Zwraca losową liczbę całkowitą w określonym zakresie. | `RANDBETWEEN(-1, 1)` | Dół, góra. | [Losowa liczba całkowita między dołem a górą] |
| **ROUND** | Zaokrągla liczbę do określonej liczby cyfr. | `ROUND(626.3, -3)` | Liczba, cyfry. | 1000 |
| **ROUNDDOWN** | Zaokrągla liczbę w dół (w stronę zera). | `ROUNDDOWN(-3.14159, 2)` | Liczba, cyfry. | -3.14 |
| **ROUNDUP** | Zaokrągla liczbę w górę (od zera). | `ROUNDUP(-3.14159, 2)` | Liczba, cyfry. | -3.15 |
| **SEC** | Zwraca secans (w radianach). | `SEC(45)` | Kąt w radianach. | 1.9035944074044246 |
| **SECH** | Zwraca secans hiperboliczny. | `SECH(45)` | Dowolna liczba. | 5.725037161098787e-20 |
| **SIGN** | Zwraca znak liczby. | `SIGN(-0.00001)` | Liczba. | -1 |
| **SIN** | Zwraca sinus (w radianach). | `SIN(1)` | Kąt w radianach. | 0.8414709848078965 |
| **SINH** | Zwraca sinus hiperboliczny. | `SINH(1)` | Dowolna liczba. | 1.1752011936438014 |
| **SQRT** | Zwraca pierwiastek kwadratowy. | `SQRT(16)` | Nieujemna liczba. | 4 |
| **SQRTPI** | Zwraca pierwiastek kwadratowy z (liczba * π). | `SQRTPI(2)` | Nieujemna liczba. | 2.5066282746310002 |
| **SUBTOTAL** | Zwraca sumę częściową dla zestawu danych, ignorując ukryte wiersze. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Numer funkcji, tablica1, …, tablicaN. | 10,32 |
| **SUM** | Zwraca sumę liczb, ignorując tekst. | `SUM(-5, 15, 32, 'Hello World!')` | Jedna lub więcej liczb. | 42 |
| **SUMIF** | Sumuje wartości spełniające pojedynczy warunek. | `SUMIF([2,4,8,16], '>5')` | Zakres, kryteria. | 24 |
| **SUMIFS** | Sumuje wartości spełniające wiele warunków. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Zakres sumowania, zakres kryteriów 1, kryteria 1, …, zakres kryteriów N, kryteria N. | 12 |
| **SUMPRODUCT** | Zwraca sumę iloczynów odpowiadających sobie elementów tablic. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Dwie lub więcej tablic. | 5 |
| **SUMSQ** | Zwraca sumę kwadratów. | `SUMSQ(3, 4)` | Jedna lub więcej liczb. | 25 |
| **SUMX2MY2** | Zwraca sumę różnic kwadratów odpowiadających sobie elementów tablic. | `SUMX2MY2([1,2], [3,4])` | Tablica1, tablica2. | -20 |
| **SUMX2PY2** | Zwraca sumę sum kwadratów odpowiadających sobie elementów tablic. | `SUMX2PY2([1,2], [3,4])` | Tablica1, tablica2. | 30 |
| **SUMXMY2** | Zwraca sumę kwadratów różnic odpowiadających sobie elementów tablic. | `SUMXMY2([1,2], [3,4])` | Tablica1, tablica2. | 8 |
| **TAN** | Zwraca tangens (w radianach). | `TAN(1)` | Kąt w radianach. | 1.5574077246549023 |
| **TANH** | Zwraca tangens hiperboliczny. | `TANH(-2)` | Dowolna liczba. | -0.9640275800758168 |
| **TRUNC** | Przycina liczbę do liczby całkowitej bez zaokrąglania. | `TRUNC(-8.9)` | Liczba, [cyfry]. | -8 |

### Statystyka

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Zwraca średnie odchylenie bezwzględne. | `AVEDEV([2,4], [8,16])` | Tablice liczb reprezentujące punkty danych. | 4.5 |
| **AVERAGE** | Zwraca średnią arytmetyczną. | `AVERAGE([2,4], [8,16])` | Tablice liczb reprezentujące punkty danych. | 7.5 |
| **AVERAGEA** | Zwraca średnią wartości, wliczając tekst i wartości logiczne. | `AVERAGEA([2,4], [8,16])` | Tablice liczb, tekstu lub wartości logicznych; uwzględniane są wszystkie niepuste wartości. | 7.5 |
| **AVERAGEIF** | Oblicza średnią na podstawie pojedynczego warunku. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Pierwszy parametr to zakres do sprawdzenia, drugi to warunek, trzeci to opcjonalny zakres używany do średniej. | 3.5 |
| **AVERAGEIFS** | Oblicza średnią na podstawie wielu warunków. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pierwszy parametr to wartości do uśrednienia, po których następują pary zakresów kryteriów i wyrażeń kryteriów. | 6 |
| **BETADIST** | Zwraca skumulowaną gęstość prawdopodobieństwa beta. | `BETADIST(2, 8, 10, true, 1, 3)` | Wartość, alfa, beta, flaga skumulowana, A (opcjonalnie), B (opcjonalnie). | 0.6854705810117458 |
| **BETAINV** | Zwraca odwrotność skumulowanego rozkładu beta. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Prawdopodobieństwo, alfa, beta, A (opcjonalnie), B (opcjonalnie). | 1.9999999999999998 |
| **BINOMDIST** | Zwraca prawdopodobieństwo rozkładu dwumianowego. | `BINOMDIST(6, 10, 0.5, false)` | Liczba sukcesów, próby, prawdopodobieństwo sukcesu, flaga skumulowana. | 0.205078125 |
| **CORREL** | Zwraca współczynnik korelacji między dwoma zestawami danych. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Dwie tablice liczb. | 0.9970544855015815 |
| **COUNT** | Zlicza komórki zawierające liczby. | `COUNT([1,2], [3,4])` | Tablice lub zakresy liczb. | 4 |
| **COUNTA** | Zlicza niepuste komórki. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Tablice lub zakresy dowolnego typu. | 4 |
| **COUNTBLANK** | Zlicza puste komórki. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Tablice lub zakresy dowolnego typu. | 2 |
| **COUNTIF** | Zlicza komórki pasujące do warunku. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Zakres liczb lub tekstu oraz warunek. | 3 |
| **COUNTIFS** | Zlicza komórki pasujące do wielu warunków. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pary zakresów kryteriów i wyrażeń kryteriów. | 2 |
| **COVARIANCEP** | Zwraca kowariancję populacji. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Dwie tablice liczb. | 5.2 |
| **COVARIANCES** | Zwraca kowariancję próbki. | `COVARIANCES([2,4,8], [5,11,12])` | Dwie tablice liczb. | 9.666666666666668 |
| **DEVSQ** | Zwraca sumę kwadratów odchyleń. | `DEVSQ([2,4,8,16])` | Tablica liczb reprezentująca punkty danych. | 115 |
| **EXPONDIST** | Zwraca rozkład wykładniczy. | `EXPONDIST(0.2, 10, true)` | Wartość, lambda, flaga skumulowana. | 0.8646647167633873 |
| **FDIST** | Zwraca rozkład prawdopodobieństwa F. | `FDIST(15.2069, 6, 4, false)` | Wartość, stopnie swobody 1, stopnie swobody 2, flaga skumulowana. | 0.0012237917087831735 |
| **FINV** | Zwraca odwrotność rozkładu F. | `FINV(0.01, 6, 4)` | Prawdopodobieństwo, stopnie swobody 1, stopnie swobody 2. | 0.10930991412457851 |
| **FISHER** | Zwraca transformację Fishera. | `FISHER(0.75)` | Liczba reprezentująca współczynnik korelacji. | 0.9729550745276566 |
| **FISHERINV** | Zwraca odwrotność transformacji Fishera. | `FISHERINV(0.9729550745276566)` | Liczba reprezentująca wynik transformacji Fishera. | 0.75 |
| **FORECAST** | Przewiduje wartość y dla danego x przy użyciu znanych wartości x i y. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nowa wartość x, tablica znanych wartości y, tablica znanych wartości x. | 10.607253086419755 |
| **FREQUENCY** | Zwraca rozkład częstotliwości. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Tablica danych, tablica przedziałów. | 1,2,4,2 |
| **GAMMA** | Zwraca funkcję gamma. | `GAMMA(2.5)` | Liczba dodatnia. | 1.3293403919101043 |
| **GAMMALN** | Zwraca logarytm naturalny funkcji gamma. | `GAMMALN(10)` | Liczba dodatnia. | 12.801827480081961 |
| **GAUSS** | Zwraca prawdopodobieństwo na podstawie standardowego rozkładu normalnego. | `GAUSS(2)` | Liczba reprezentująca wynik z (z-score). | 0.4772498680518208 |
| **GEOMEAN** | Zwraca średnią geometryczną. | `GEOMEAN([2,4], [8,16])` | Tablice liczb. | 5.656854249492381 |
| **GROWTH** | Przewiduje wartości wzrostu wykładniczego na podstawie znanych danych. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Tablica znanych wartości y, tablica znanych wartości x, nowe wartości x. | 32.00000000000003 |
| **HARMEAN** | Zwraca średnią harmoniczną. | `HARMEAN([2,4], [8,16])` | Tablice liczb. | 4.266666666666667 |
| **HYPGEOMDIST** | Zwraca rozkład hipergeometryczny. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Sukcesy w próbce, wielkość próbki, sukcesy w populacji, wielkość populacji, flaga skumulowana. | 0.3632610939112487 |
| **INTERCEPT** | Zwraca punkt przecięcia linii regresji liniowej. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Tablica znanych wartości y, tablica znanych wartości x. | 0.04838709677419217 |
| **KURT** | Zwraca kurtozę. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Tablica liczb. | -0.15179963720841627 |
| **LARGE** | Zwraca k-tą największą wartość. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Tablica liczb, k. | 5 |
| **LINEST** | Wykonuje analizę regresji liniowej. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Tablica znanych wartości y, tablica znanych wartości x, czy zwrócić dodatkowe statystyki, czy zwrócić więcej statystyk. | 2,1 |
| **LOGNORMDIST** | Zwraca rozkład logarytmicznie normalny. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Wartość, średnia, odchylenie standardowe, flaga skumulowana. | 0.0390835557068005 |
| **LOGNORMINV** | Zwraca odwrotność rozkładu logarytmicznie normalnego. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Prawdopodobieństwo, średnia, odchylenie standardowe, flaga skumulowana. | 4.000000000000001 |
| **MAX** | Zwraca wartość maksymalną. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Tablice liczb. | 0.8 |
| **MAXA** | Zwraca wartość maksymalną, wliczając tekst i wartości logiczne. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 1 |
| **MEDIAN** | Zwraca medianę. | `MEDIAN([1,2,3], [4,5,6])` | Tablice liczb. | 3.5 |
| **MIN** | Zwraca wartość minimalną. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Tablice liczb. | 0.1 |
| **MINA** | Zwraca wartość minimalną, wliczając tekst i wartości logiczne. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 0 |
| **MODEMULT** | Zwraca tablicę najczęściej występujących wartości. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Tablica liczb. | 2,3 |
| **MODESNGL** | Zwraca pojedynczą najczęściej występującą wartość. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Tablica liczb. | 2 |
| **NORMDIST** | Zwraca rozkład normalny. | `NORMDIST(42, 40, 1.5, true)` | Wartość, średnia, odchylenie standardowe, flaga skumulowana. | 0.9087887802741321 |
| **NORMINV** | Zwraca odwrotność rozkładu normalnego. | `NORMINV(0.9087887802741321, 40, 1.5)` | Prawdopodobieństwo, średnia, odchylenie standardowe. | 42 |
| **NORMSDIST** | Zwraca standardowy rozkład normalny. | `NORMSDIST(1, true)` | Liczba reprezentująca wynik z (z-score). | 0.8413447460685429 |
| **NORMSINV** | Zwraca odwrotność standardowego rozkładu normalnego. | `NORMSINV(0.8413447460685429)` | Prawdopodobieństwo. | 1.0000000000000002 |
| **PEARSON** | Zwraca współczynnik korelacji momentu iloczynu Pearsona. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Dwie tablice liczb. | 0.6993786061802354 |
| **PERCENTILEEXC** | Zwraca k-ty percentyl (wyłącznie). | `PERCENTILEEXC([1,2,3,4], 0.3)` | Tablica liczb, k. | 1.5 |
| **PERCENTILEINC** | Zwraca k-ty percentyl (włącznie). | `PERCENTILEINC([1,2,3,4], 0.3)` | Tablica liczb, k. | 1.9 |
| **PERCENTRANKEXC** | Zwraca rangę wartości w zestawie danych jako procent (wyłącznie). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Tablica liczb, wartość x, istotność (opcjonalnie). | 0.4 |
| **PERCENTRANKINC** | Zwraca rangę wartości w zestawie danych jako procent (włącznie). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Tablica liczb, wartość x, istotność (opcjonalnie). | 0.33 |
| **PERMUT** | Zwraca liczbę permutacji. | `PERMUT(100, 3)` | Całkowita liczba n, liczba wybranych k. | 970200 |
| **PERMUTATIONA** | Zwraca liczbę permutacji z powtórzeniami. | `PERMUTATIONA(4, 3)` | Całkowita liczba n, liczba wybranych k. | 64 |
| **PHI** | Zwraca funkcję gęstości standardowego rozkładu normalnego. | `PHI(0.75)` | Liczba reprezentująca wynik z (z-score). | 0.30113743215480443 |
| **POISSONDIST** | Zwraca rozkład Poissona. | `POISSONDIST(2, 5, true)` | Liczba zdarzeń, średnia, flaga skumulowana. | 0.12465201948308113 |
| **PROB** | Zwraca sumę prawdopodobieństw. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Tablica wartości, tablica prawdopodobieństw, dolna granica, górna granica. | 0.4 |
| **QUARTILEEXC** | Zwraca kwartyl zestawu danych (wyłącznie). | `QUARTILEEXC([1,2,3,4], 1)` | Tablica liczb, kwartyl. | 1.25 |
| **QUARTILEINC** | Zwraca kwartyl zestawu danych (włącznie). | `QUARTILEINC([1,2,3,4], 1)` | Tablica liczb, kwartyl. | 1.75 |
| **RANKAVG** | Zwraca średnią rangę. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Liczba, tablica liczb, kolejność (rosnąco/malejąco). | 4.5 |
| **RANKEQ** | Zwraca rangę liczby. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Liczba, tablica liczb, kolejność (rosnąco/malejąco). | 4 |
| **RSQ** | Zwraca współczynnik determinacji. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Dwie tablice liczb. | 0.4891304347826088 |
| **SKEW** | Zwraca skośność. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Tablica liczb. | 0.3595430714067974 |
| **SKEWP** | Zwraca skośność populacji. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Tablica liczb. | 0.303193339354144 |
| **SLOPE** | Zwraca nachylenie linii regresji liniowej. | `SLOPE([1,9,5,7], [0,4,2,3])` | Tablica znanych wartości y, tablica znanych wartości x. | 2 |
| **SMALL** | Zwraca k-tą najmniejszą wartość. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Tablica liczb, k. | 3 |
| **STANDARDIZE** | Zwraca znormalizowaną wartość jako wynik z (z-score). | `STANDARDIZE(42, 40, 1.5)` | Wartość, średnia, odchylenie standardowe. | 1.3333333333333333 |
| **STDEVA** | Zwraca odchylenie standardowe, wliczając tekst i wartości logiczne. | `STDEVA([2,4], [8,16], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 6.013872850889572 |
| **STDEVP** | Zwraca odchylenie standardowe populacji. | `STDEVP([2,4], [8,16], [true, false])` | Tablice liczb. | 5.361902647381804 |
| **STDEVPA** | Zwraca odchylenie standardowe populacji, wliczając tekst i wartości logiczne. | `STDEVPA([2,4], [8,16], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 5.489889697333535 |
| **STDEVS** | Zwraca odchylenie standardowe próbki. | `VARS([2,4], [8,16], [true, false])` | Tablice liczb. | 6.191391873668904 |
| **STEYX** | Zwraca błąd standardowy przewidywanej wartości y. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Tablica znanych wartości y, tablica znanych wartości x. | 3.305718950210041 |
| **TINV** | Zwraca odwrotność rozkładu t. | `TINV(0.9946953263673741, 1)` | Prawdopodobieństwo, stopnie swobody. | 59.99999999996535 |
| **TRIMMEAN** | Zwraca średnią z wnętrza zestawu danych. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Tablica liczb, proporcja odcięcia. | 3.7777777777777777 |
| **VARA** | Zwraca wariancję, wliczając tekst i wartości logiczne. | `VARA([2,4], [8,16], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 36.16666666666667 |
| **VARP** | Zwraca wariancję populacji. | `VARP([2,4], [8,16], [true, false])` | Tablice liczb. | 28.75 |
| **VARPA** | Zwraca wariancję populacji, wliczając tekst i wartości logiczne. | `VARPA([2,4], [8,16], [true, false])` | Tablice liczb, tekstu lub wartości logicznych. | 30.13888888888889 |
| **VARS** | Zwraca wariancję próbki. | `VARS([2,4], [8,16], [true, false])` | Tablice liczb. | 38.333333333333336 |
| **WEIBULLDIST** | Zwraca rozkład Weibulla. | `WEIBULLDIST(105, 20, 100, true)` | Wartość, alfa, beta, flaga skumulowana. | 0.9295813900692769 |
| **ZTEST** | Zwraca jednostronną wartość prawdopodobieństwa testu z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Tablica liczb, hipotetyczna średnia. | 0.09057419685136381 |

### Tekst

| Funkcja | Definicja | Przykładowe wywołanie | Parametry | Oczekiwany wynik |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Konwertuje kod liczbowy na odpowiadający mu znak. | `CHAR(65)` | Liczba reprezentująca kod znaku. | A |
| **CLEAN** | Usuwa z tekstu wszystkie znaki niedrukowalne. | `CLEAN('Monthly report')` | Ciąg tekstowy do wyczyszczenia. | Monthly report |
| **CODE** | Zwraca kod liczbowy pierwszego znaku w ciągu tekstowym. | `CODE('A')` | Ciąg tekstowy zawierający pojedynczy znak. | 65 |
| **CONCATENATE** | Łączy wiele ciągów tekstowych w jeden ciąg. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Jeden lub więcej ciągów tekstowych do połączenia. | Andreas Hauser |
| **EXACT** | Sprawdza, czy dwa ciągi są dokładnie takie same (rozróżnia wielkość liter). | `EXACT('Word', 'word')` | Dwa ciągi tekstowe do porównania. | |
| **FIND** | Znajduje pozycję podciągu, zaczynając od określonej pozycji. | `FIND('M', 'Miriam McGovern', 3)` | Tekst do znalezienia, tekst źródłowy, opcjonalna pozycja początkowa. | 8 |
| **LEFT** | Zwraca określoną liczbę znaków od lewej strony ciągu. | `LEFT('Sale Price', 4)` | Ciąg tekstowy i liczba znaków. | Sale |
| **LEN** | Zwraca liczbę znaków w ciągu tekstowym. | `LEN('Phoenix, AZ')` | Ciąg tekstowy do policzenia. | 11 |
| **LOWER** | Konwertuje wszystkie znaki na małe litery. | `LOWER('E. E. Cummings')` | Ciąg tekstowy do konwersji. | e. e. cummings |
| **MID** | Zwraca określoną liczbę znaków ze środka ciągu. | `MID('Fluid Flow', 7, 20)` | Ciąg tekstowy, pozycja początkowa, liczba znaków. | Flow |
| **NUMBERVALUE** | Konwertuje tekst na liczbę przy użyciu określonych separatorów. | `NUMBERVALUE('2.500,27', ',', '.')` | Ciąg tekstowy, separator dziesiętny, separator grup. | 2500.27 |
| **PROPER** | Zmienia pierwszą literę każdego słowa na wielką. | `PROPER('this is a TITLE')` | Ciąg tekstowy do sformatowania. | This Is A Title |
| **REPLACE** | Zastępuje część ciągu tekstowego nowym tekstem. | `REPLACE('abcdefghijk', 6, 5, '*')` | Oryginalny tekst, pozycja początkowa, liczba znaków, nowy tekst. | abcde*k |
| **REPT** | Powtarza tekst określoną liczbę razy. | `REPT('*-', 3)` | Ciąg tekstowy i liczba powtórzeń. | *-*-*- |
| **RIGHT** | Zwraca określoną liczbę znaków od prawej strony ciągu. | `RIGHT('Sale Price', 5)` | Ciąg tekstowy i liczba znaków. | Price |
| **ROMAN** | Konwertuje liczbę arabską na rzymską. | `ROMAN(499)` | Liczba arabska do konwersji. | CDXCIX |
| **SEARCH** | Znajduje pozycję podciągu (nie rozróżnia wielkości liter). | `SEARCH('margin', 'Profit Margin')` | Tekst do znalezienia, tekst źródłowy. | 8 |
| **SUBSTITUTE** | Zastępuje określone wystąpienie starego tekstu nowym tekstem. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Oryginalny tekst, stary tekst, nowy tekst, opcjonalny numer wystąpienia. | Quarter 1, 2012 |
| **T** | Zwraca tekst, jeśli wartość jest tekstem; w przeciwnym razie zwraca pusty ciąg. | `T('Rainfall')` | Argument może być dowolnego typu. | Rainfall |
| **TRIM** | Usuwa spacje z tekstu, z wyjątkiem pojedynczych spacji między słowami. | `TRIM(' First Quarter Earnings ')` | Ciąg tekstowy do przycięcia. | First Quarter Earnings |
| **TEXTJOIN** | Łączy wiele elementów tekstowych w jeden ciąg przy użyciu ogranicznika. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Ogranicznik, flaga ignorowania pustych, elementy tekstowe do połączenia. | The sun will come up tomorrow. |
| **UNICHAR** | Zwraca znak dla danego numeru Unicode. | `UNICHAR(66)` | Punkt kodowy Unicode. | B |
| **UNICODE** | Zwraca numer Unicode pierwszego znaku tekstu. | `UNICODE('B')` | Ciąg tekstowy zawierający pojedynczy znak. | 66 |
| **UPPER** | Konwertuje wszystkie znaki na wielkie litery. | `UPPER('total')` | Ciąg tekstowy do konwersji. | TOTAL |