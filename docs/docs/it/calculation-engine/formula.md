:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) fornisce una vasta collezione di funzioni compatibili con Excel.

## Riferimento delle funzioni

### Date

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Crea una data in base all'anno, mese e giorno forniti. | `DATE(2008, 7, 8)` | Anno (intero), mese (1-12), giorno (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Converte una data in formato testo in un numero seriale di data. | `DATEVALUE('8/22/2011')` | Stringa di testo che rappresenta una data. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Restituisce la parte del giorno di una data. | `DAY('15-Apr-11')` | Valore di data o stringa di testo della data. | 15 |
| **DAYS** | Calcola il numero di giorni tra due date. | `DAYS('3/15/11', '2/1/11')` | Data finale, data iniziale. | 42 |
| **DAYS360** | Calcola il numero di giorni tra due date basandosi su un anno di 360 giorni. | `DAYS360('1-Jan-11', '31-Dec-11')` | Data iniziale, data finale. | 360 |
| **EDATE** | Restituisce la data che precede o segue una data di un numero specificato di mesi. | `EDATE('1/15/11', -1)` | Data iniziale, numero di mesi (positivo per il futuro, negativo per il passato). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Restituisce l'ultimo giorno del mese prima o dopo il numero specificato di mesi. | `EOMONTH('1/1/11', -3)` | Data iniziale, numero di mesi (positivo per il futuro, negativo per il passato). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Restituisce la parte dell'ora di un valore temporale. | `HOUR('7/18/2011 7:45:00 AM')` | Valore temporale o stringa di testo dell'ora. | 7 |
| **MINUTE** | Restituisce la parte dei minuti di un valore temporale. | `MINUTE('2/1/2011 12:45:00 PM')` | Valore temporale o stringa di testo dell'ora. | 45 |
| **ISOWEEKNUM** | Restituisce il numero della settimana ISO dell'anno per una data data. | `ISOWEEKNUM('3/9/2012')` | Valore di data o stringa di testo della data. | 10 |
| **MONTH** | Restituisce la parte del mese di una data. | `MONTH('15-Apr-11')` | Valore di data o stringa di testo della data. | 4 |
| **NETWORKDAYS** | Conta il numero di giorni lavorativi tra due date, esclusi i fine settimana e le festività opzionali. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Data iniziale, data finale, array opzionale di festività. | 109 |
| **NETWORKDAYSINTL** | Conta i giorni lavorativi tra due date, consentendo fine settimana personalizzati e festività opzionali. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Data iniziale, data finale, modalità fine settimana, array opzionale di festività. | 23 |
| **NOW** | Restituisce la data e l'ora correnti. | `NOW()` | Nessun parametro. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Restituisce la parte dei secondi di un valore temporale. | `SECOND('2/1/2011 4:48:18 PM')` | Valore temporale o stringa di testo dell'ora. | 18 |
| **TIME** | Crea un valore temporale a partire dall'ora, dai minuti e dai secondi forniti. | `TIME(16, 48, 10)` | Ora (0-23), minuti (0-59), secondi (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Converte un'ora in formato testo in un numero seriale di ora. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Stringa di testo che rappresenta un'ora. | 0.2743055555555556 |
| **TODAY** | Restituisce la data odierna. | `TODAY()` | Nessun parametro. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Restituisce il numero corrispondente al giorno della settimana. | `WEEKDAY('2/14/2008', 3)` | Valore di data o stringa di testo della data, tipo restituito (1-3). | 3 |
| **YEAR** | Restituisce la parte dell'anno di una data. | `YEAR('7/5/2008')` | Valore di data o stringa di testo della data. | 2008 |
| **WEEKNUM** | Restituisce il numero della settimana in un anno per una data data. | `WEEKNUM('3/9/2012', 2)` | Valore di data o stringa di testo della data, giorno di inizio settimana opzionale (1=domenica, 2=lunedì). | 11 |
| **WORKDAY** | Restituisce la data prima o dopo un dato numero di giorni lavorativi, esclusi i fine settimana e le festività opzionali. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Data iniziale, numero di giorni lavorativi, array opzionale di festività. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Restituisce la data prima o dopo un numero di giorni lavorativi con fine settimana personalizzati e festività opzionali. | `WORKDAYINTL('1/1/2012', 30, 17)` | Data iniziale, numero di giorni lavorativi, modalità fine settimana. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Calcola la frazione di anno tra due date. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Data iniziale, data finale, base opzionale (base conteggio giorni). | 0.5780821917808219 |

### Finanza

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Calcola l'interesse maturato per un titolo che paga interessi periodici. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Data di emissione, prima data di interesse, data di liquidazione, tasso annuo, valore nominale, frequenza, base. | 350 |
| **CUMIPMT** | Calcola l'interesse cumulativo pagato su una serie di pagamenti. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Tasso, periodi totali, valore attuale, periodo iniziale, periodo finale, tipo di pagamento (0=fine, 1=inizio). | -9916.77251395708 |
| **CUMPRINC** | Calcola il capitale cumulativo pagato su una serie di pagamenti. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Tasso, periodi totali, valore attuale, periodo iniziale, periodo finale, tipo di pagamento (0=fine, 1=inizio). | -614.0863271085149 |
| **DB** | Calcola l'ammortamento utilizzando il metodo a quote decrescenti fisse. | `DB(1000000, 100000, 6, 1, 6)` | Costo, valore di recupero, vita utile, periodo, mese. | 159500 |
| **DDB** | Calcola l'ammortamento utilizzando il metodo a doppie quote decrescenti o un altro metodo specificato. | `DDB(1000000, 100000, 6, 1, 1.5)` | Costo, valore di recupero, vita utile, periodo, fattore. | 250000 |
| **DOLLARDE** | Converte un prezzo espresso come frazione in un decimale. | `DOLLARDE(1.1, 16)` | Prezzo in dollari frazionari, denominatore. | 1.625 |
| **DOLLARFR** | Converte un prezzo espresso come decimale in una frazione. | `DOLLARFR(1.625, 16)` | Prezzo in dollari decimali, denominatore. | 1.1 |
| **EFFECT** | Calcola il tasso di interesse annuo effettivo. | `EFFECT(0.1, 4)` | Tasso annuo nominale, numero di periodi di capitalizzazione all'anno. | 0.10381289062499977 |
| **FV** | Calcola il valore futuro di un investimento. | `FV(0.1/12, 10, -100, -1000, 0)` | Tasso per periodo, numero di periodi, pagamento per periodo, valore attuale, tipo di pagamento (0=fine, 1=inizio). | 2124.874409194097 |
| **FVSCHEDULE** | Calcola il valore futuro del capitale utilizzando una serie di tassi composti. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Capitale, array di tassi. | 133.08900000000003 |
| **IPMT** | Calcola il pagamento degli interessi per un periodo specifico. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Tasso per periodo, periodo, periodi totali, valore attuale, valore futuro, tipo di pagamento (0=fine, 1=inizio). | 928.8235718400465 |
| **IRR** | Calcola il tasso di rendimento interno. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array di flussi di cassa, stima. | 0.05715142887178447 |
| **ISPMT** | Calcola l'interesse pagato durante un periodo specifico (per i prestiti). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Tasso per periodo, periodo, periodi totali, importo del prestito. | -625 |
| **MIRR** | Calcola il tasso di rendimento interno modificato. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array di flussi di cassa, tasso di finanziamento, tasso di reinvestimento. | 0.07971710360838036 |
| **NOMINAL** | Calcola il tasso di interesse annuo nominale. | `NOMINAL(0.1, 4)` | Tasso annuo effettivo, numero di periodi di capitalizzazione all'anno. | 0.09645475633778045 |
| **NPER** | Calcola il numero di periodi necessari per raggiungere un valore target. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Tasso per periodo, pagamento per periodo, valore attuale, valore futuro, tipo di pagamento (0=fine, 1=inizio). | 63.39385422740764 |
| **NPV** | Calcola il valore attuale netto di una serie di flussi di cassa futuri. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Tasso di sconto per periodo, array di flussi di cassa. | 1031.3503176012546 |
| **PDURATION** | Calcola il tempo necessario per raggiungere un valore desiderato. | `PDURATION(0.1, 1000, 2000)` | Tasso per periodo, valore attuale, valore futuro. | 7.272540897341714 |
| **PMT** | Calcola il pagamento periodico di un prestito. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Tasso per periodo, periodi totali, valore attuale, valore futuro, tipo di pagamento (0=fine, 1=inizio). | -42426.08563793503 |
| **PPMT** | Calcola il pagamento del capitale per un periodo specifico. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Tasso per periodo, periodo, periodi totali, valore attuale, valore futuro, tipo di pagamento (0=fine, 1=inizio). | -43354.909209775076 |
| **PV** | Calcola il valore attuale di un investimento. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Tasso per periodo, numero di periodi, pagamento per periodo, valore futuro, tipo di pagamento (0=fine, 1=inizio). | -29864.950264779152 |
| **RATE** | Calcola il tasso di interesse per periodo. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Periodi totali, pagamento per periodo, valore attuale, valore futuro, tipo di pagamento (0=fine, 1=inizio), stima. | 0.06517891177181533 |

### Ingegneria

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Converte un numero binario in decimale. | `BIN2DEC(101010)` | Numero binario. | 42 |
| **BIN2HEX** | Converte un numero binario in esadecimale. | `BIN2HEX(101010)` | Numero binario. | 2a |
| **BIN2OCT** | Converte un numero binario in ottale. | `BIN2OCT(101010)` | Numero binario. | 52 |
| **BITAND** | Restituisce l'AND bit a bit di due numeri. | `BITAND(42, 24)` | Intero, intero. | 8 |
| **BITLSHIFT** | Esegue uno spostamento a sinistra bit a bit. | `BITLSHIFT(42, 24)` | Intero, numero di bit da spostare. | 704643072 |
| **BITOR** | Restituisce l'OR bit a bit di due numeri. | `BITOR(42, 24)` | Intero, intero. | 58 |
| **BITRSHIFT** | Esegue uno spostamento a destra bit a bit. | `BITRSHIFT(42, 2)` | Intero, numero di bit da spostare. | 10 |
| **BITXOR** | Restituisce lo XOR bit a bit di due numeri. | `BITXOR(42, 24)` | Intero, intero. | 50 |
| **COMPLEX** | Crea un numero complesso. | `COMPLEX(3, 4)` | Parte reale, parte immaginaria. | 3+4i |
| **CONVERT** | Converte un numero da un'unità di misura a un'altra. | `CONVERT(64, 'kibyte', 'bit')` | Valore, unità di origine, unità di destinazione. | 524288 |
| **DEC2BIN** | Converte un numero decimale in binario. | `DEC2BIN(42)` | Numero decimale. | 101010 |
| **DEC2HEX** | Converte un numero decimale in esadecimale. | `DEC2HEX(42)` | Numero decimale. | 2a |
| **DEC2OCT** | Converte un numero decimale in ottale. | `DEC2OCT(42)` | Numero decimale. | 52 |
| **DELTA** | Verifica se due valori sono uguali. | `DELTA(42, 42)` | Numero, numero. | 1 |
| **ERF** | Restituisce la funzione di errore. | `ERF(1)` | Limite superiore. | 0.8427007929497149 |
| **ERFC** | Restituisce la funzione di errore complementare. | `ERFC(1)` | Limite inferiore. | 0.1572992070502851 |
| **GESTEP** | Verifica se un numero è maggiore o uguale a una soglia. | `GESTEP(42, 24)` | Numero, soglia. | 1 |
| **HEX2BIN** | Converte un numero esadecimale in binario. | `HEX2BIN('2a')` | Numero esadecimale. | 101010 |
| **HEX2DEC** | Converte un numero esadecimale in decimale. | `HEX2DEC('2a')` | Numero esadecimale. | 42 |
| **HEX2OCT** | Converte un numero esadecimale in ottale. | `HEX2OCT('2a')` | Numero esadecimale. | 52 |
| **IMABS** | Restituisce il valore assoluto (modulo) di un numero complesso. | `IMABS('3+4i')` | Numero complesso. | 5 |
| **IMAGINARY** | Restituisce la parte immaginaria di un numero complesso. | `IMAGINARY('3+4i')` | Numero complesso. | 4 |
| **IMARGUMENT** | Restituisce l'argomento di un numero complesso. | `IMARGUMENT('3+4i')` | Numero complesso. | 0.9272952180016122 |
| **IMCONJUGATE** | Restituisce il complesso coniugato. | `IMCONJUGATE('3+4i')` | Numero complesso. | 3-4i |
| **IMCOS** | Restituisce il coseno di un numero complesso. | `IMCOS('1+i')` | Numero complesso. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Restituisce il coseno iperbolico di un numero complesso. | `IMCOSH('1+i')` | Numero complesso. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Restituisce la cotangente di un numero complesso. | `IMCOT('1+i')` | Numero complesso. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Restituisce la cosecante di un numero complesso. | `IMCSC('1+i')` | Numero complesso. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Restituisce la cosecante iperbolica di un numero complesso. | `IMCSCH('1+i')` | Numero complesso. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Restituisce il quoziente di due numeri complessi. | `IMDIV('1+2i', '3+4i')` | Numero complesso dividendo, numero complesso divisore. | 0.44+0.08i |
| **IMEXP** | Restituisce l'esponenziale di un numero complesso. | `IMEXP('1+i')` | Numero complesso. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Restituisce il logaritmo naturale di un numero complesso. | `IMLN('1+i')` | Numero complesso. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Restituisce il logaritmo in base 10 di un numero complesso. | `IMLOG10('1+i')` | Numero complesso. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Restituisce il logaritmo in base 2 di un numero complesso. | `IMLOG2('1+i')` | Numero complesso. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Restituisce un numero complesso elevato a una potenza. | `IMPOWER('1+i', 2)` | Numero complesso, esponente. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Restituisce il prodotto di numeri complessi. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array di numeri complessi. | -85+20i |
| **IMREAL** | Restituisce la parte reale di un numero complesso. | `IMREAL('3+4i')` | Numero complesso. | 3 |
| **IMSEC** | Restituisce la secante di un numero complesso. | `IMSEC('1+i')` | Numero complesso. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Restituisce la secante iperbolica di un numero complesso. | `IMSECH('1+i')` | Numero complesso. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Restituisce il seno di un numero complesso. | `IMSIN('1+i')` | Numero complesso. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Restituisce il seno iperbolico di un numero complesso. | `IMSINH('1+i')` | Numero complesso. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Restituisce la radice quadrata di un numero complesso. | `IMSQRT('1+i')` | Numero complesso. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Restituisce la differenza tra due numeri complessi. | `IMSUB('3+4i', '1+2i')` | Numero complesso minuendo, numero complesso sottraendo. | 2+2i |
| **IMSUM** | Restituisce la somma di numeri complessi. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array di numeri complessi. | 9+12i |
| **IMTAN** | Restituisce la tangente di un numero complesso. | `IMTAN('1+i')` | Numero complesso. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Converte un numero ottale in binario. | `OCT2BIN('52')` | Numero ottale. | 101010 |
| **OCT2DEC** | Converte un numero ottale in decimale. | `OCT2DEC('52')` | Numero ottale. | 42 |
| **OCT2HEX** | Converte un numero ottale in esadecimale. | `OCT2HEX('52')` | Numero ottale. | 2a |

### Logica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Restituisce VERO solo quando tutti gli argomenti sono VERO, altrimenti FALSO. | `AND(true, false, true)` | Uno o più valori logici (booleani); la funzione restituisce VERO solo quando ogni argomento è VERO. | |
| **FALSE** | Restituisce il valore logico FALSO. | `FALSE()` | Nessun parametro. | |
| **IF** | Restituisce valori diversi a seconda che una condizione sia VERO o FALSO. | `IF(true, 'Hello!', 'Goodbye!')` | Condizione, valore se VERO, valore se FALSO. | Hello! |
| **IFS** | Valuta più condizioni e restituisce il risultato della prima condizione VERO. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Più coppie di condizione e valore corrispondente. | Goodbye! |
| **NOT** | Inverte un valore logico. VERO diventa FALSO e viceversa. | `NOT(true)` | Un valore logico (booleano). | |
| **OR** | Restituisce VERO se almeno un argomento è VERO, altrimenti FALSO. | `OR(true, false, true)` | Uno o più valori logici (booleani); restituisce VERO quando almeno un argomento è VERO. | |
| **SWITCH** | Restituisce il valore che corrisponde a un'espressione; se nessuno corrisponde, restituisce il valore predefinito. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Espressione, valore di confronto 1, risultato 1, …, [predefinito]. | Seven |
| **TRUE** | Restituisce il valore logico VERO. | `TRUE()` | Nessun parametro. | |
| **XOR** | Restituisce VERO solo quando un numero dispari di argomenti è VERO, altrimenti FALSO. | `XOR(true, false, true)` | Uno o più valori logici (booleani); restituisce VERO quando il conteggio dei valori VERO è dispari. | |

### Matematica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Restituisce il valore assoluto di un numero. | `ABS(-4)` | Numero. | 4 |
| **ACOS** | Restituisce l'arcocoseno (in radianti). | `ACOS(-0.5)` | Numero compreso tra -1 e 1. | 2.0943951023931957 |
| **ACOSH** | Restituisce il coseno iperbolico inverso. | `ACOSH(10)` | Numero maggiore o uguale a 1. | 2.993222846126381 |
| **ACOT** | Restituisce l'arcocotangente (in radianti). | `ACOT(2)` | Qualsiasi numero. | 0.46364760900080615 |
| **ACOTH** | Restituisce la cotangente iperbolica inversa. | `ACOTH(6)` | Numero il cui valore assoluto è maggiore di 1. | 0.16823611831060645 |
| **AGGREGATE** | Esegue un calcolo di aggregazione ignorando gli errori o le righe nascoste. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Numero funzione, opzioni, array1, …, arrayN. | 10,32 |
| **ARABIC** | Converte un numero romano in arabo. | `ARABIC('MCMXII')` | Stringa di numero romano. | 1912 |
| **ASIN** | Restituisce l'arcoseno (in radianti). | `ASIN(-0.5)` | Numero compreso tra -1 e 1. | -0.5235987755982988 |
| **ASINH** | Restituisce il seno iperbolico inverso. | `ASINH(-2.5)` | Qualsiasi numero. | -1.6472311463710965 |
| **ATAN** | Restituisce l'arcotangente (in radianti). | `ATAN(1)` | Qualsiasi numero. | 0.7853981633974483 |
| **ATAN2** | Restituisce l'arcotangente (in radianti) di una coppia di coordinate. | `ATAN2(-1, -1)` | coordinata y, coordinata x. | -2.356194490192345 |
| **ATANH** | Restituisce la tangente iperbolica inversa. | `ATANH(-0.1)` | Numero compreso tra -1 e 1. | -0.10033534773107562 |
| **BASE** | Converte un numero in testo nella base specificata. | `BASE(15, 2, 10)` | Numero, base, [lunghezza minima]. | 0000001111 |
| **CEILING** | Arrotonda un numero per eccesso al multiplo più vicino. | `CEILING(-5.5, 2, -1)` | Numero, peso, [modalità]. | -6 |
| **CEILINGMATH** | Arrotonda un numero per eccesso, utilizzando il multiplo e la direzione forniti. | `CEILINGMATH(-5.5, 2, -1)` | Numero, [peso], [modalità]. | -6 |
| **CEILINGPRECISE** | Arrotonda un numero per eccesso al multiplo più vicino, ignorando il segno. | `CEILINGPRECISE(-4.1, -2)` | Numero, [peso]. | -4 |
| **COMBIN** | Restituisce il numero di combinazioni. | `COMBIN(8, 2)` | Elementi totali, numero scelto. | 28 |
| **COMBINA** | Restituisce il numero di combinazioni con ripetizioni. | `COMBINA(4, 3)` | Elementi totali, numero scelto. | 20 |
| **COS** | Restituisce il coseno (in radianti). | `COS(1)` | Angolo in radianti. | 0.5403023058681398 |
| **COSH** | Restituisce il coseno iperbolico. | `COSH(1)` | Qualsiasi numero. | 1.5430806348152437 |
| **COT** | Restituisce la cotangente (in radianti). | `COT(30)` | Angolo in radianti. | -0.15611995216165922 |
| **COTH** | Restituisce la cotangente iperbolica. | `COTH(2)` | Qualsiasi numero. | 1.0373147207275482 |
| **CSC** | Restituisce la cosecante (in radianti). | `CSC(15)` | Angolo in radianti. | 1.5377805615408537 |
| **CSCH** | Restituisce la cosecante iperbolica. | `CSCH(1.5)` | Qualsiasi numero. | 0.46964244059522464 |
| **DECIMAL** | Converte un numero in formato testo in decimale. | `DECIMAL('FF', 16)` | Testo, base. | 255 |
| **ERF** | Restituisce la funzione di errore. | `ERF(1)` | Limite superiore. | 0.8427007929497149 |
| **ERFC** | Restituisce la funzione di errore complementare. | `ERFC(1)` | Limite inferiore. | 0.1572992070502851 |
| **EVEN** | Arrotonda un numero per eccesso all'intero pari più vicino. | `EVEN(-1)` | Numero. | -2 |
| **EXP** | Restituisce e elevato a una potenza. | `EXP(1)` | Esponente. | 2.718281828459045 |
| **FACT** | Restituisce il fattoriale. | `FACT(5)` | Intero non negativo. | 120 |
| **FACTDOUBLE** | Restituisce il fattoriale doppio. | `FACTDOUBLE(7)` | Intero non negativo. | 105 |
| **FLOOR** | Arrotonda un numero per difetto al multiplo più vicino. | `FLOOR(-3.1)` | Numero, peso. | -4 |
| **FLOORMATH** | Arrotonda un numero per difetto utilizzando il multiplo e la direzione forniti. | `FLOORMATH(-4.1, -2, -1)` | Numero, [peso], [modalità]. | -4 |
| **FLOORPRECISE** | Arrotonda un numero per difetto al multiplo più vicino, ignorando il segno. | `FLOORPRECISE(-3.1, -2)` | Numero, [peso]. | -4 |
| **GCD** | Restituisce il massimo comune divisore. | `GCD(24, 36, 48)` | Due o più interi. | 12 |
| **INT** | Arrotonda un numero per difetto all'intero più vicino. | `INT(-8.9)` | Numero. | -9 |
| **ISEVEN** | Verifica se un numero è pari. | `ISEVEN(-2.5)` | Numero. | |
| **ISOCEILING** | Arrotonda un numero per eccesso al multiplo più vicino seguendo le regole ISO. | `ISOCEILING(-4.1, -2)` | Numero, [peso]. | -4 |
| **ISODD** | Verifica se un numero è dispari. | `ISODD(-2.5)` | Numero. | |
| **LCM** | Restituisce il minimo comune multiplo. | `LCM(24, 36, 48)` | Due o più interi. | 144 |
| **LN** | Restituisce il logaritmo naturale. | `LN(86)` | Numero positivo. | 4.454347296253507 |
| **LOG** | Restituisce il logaritmo nella base specificata. | `LOG(8, 2)` | Numero, base. | 3 |
| **LOG10** | Restituisce il logaritmo in base 10. | `LOG10(100000)` | Numero positivo. | 5 |
| **MOD** | Restituisce il resto di una divisione. | `MOD(3, -2)` | Dividendo, divisore. | -1 |
| **MROUND** | Arrotonda un numero al multiplo più vicino. | `MROUND(-10, -3)` | Numero, multiplo. | -9 |
| **MULTINOMIAL** | Restituisce il coefficiente multinomiale. | `MULTINOMIAL(2, 3, 4)` | Due o più interi non negativi. | 1260 |
| **ODD** | Arrotonda un numero per eccesso all'intero dispari più vicino. | `ODD(-1.5)` | Numero. | -3 |
| **POWER** | Eleva un numero a una potenza. | `POWER(5, 2)` | Base, esponente. | 25 |
| **PRODUCT** | Restituisce il prodotto dei numeri. | `PRODUCT(5, 15, 30)` | Uno o più numeri. | 2250 |
| **QUOTIENT** | Restituisce la parte intera di una divisione. | `QUOTIENT(-10, 3)` | Dividendo, divisore. | -3 |
| **RADIANS** | Converte i gradi in radianti. | `RADIANS(180)` | Gradi. | 3.141592653589793 |
| **RAND** | Restituisce un numero reale casuale tra 0 e 1. | `RAND()` | Nessun parametro. | [Numero reale casuale tra 0 e 1] |
| **RANDBETWEEN** | Restituisce un numero intero casuale all'interno di un intervallo specificato. | `RANDBETWEEN(-1, 1)` | Limite inferiore, limite superiore. | [Numero intero casuale tra limite inferiore e superiore] |
| **ROUND** | Arrotonda un numero al numero di cifre specificato. | `ROUND(626.3, -3)` | Numero, cifre. | 1000 |
| **ROUNDDOWN** | Arrotonda un numero per difetto verso lo zero. | `ROUNDDOWN(-3.14159, 2)` | Numero, cifre. | -3.14 |
| **ROUNDUP** | Arrotonda un numero per eccesso lontano dallo zero. | `ROUNDUP(-3.14159, 2)` | Numero, cifre. | -3.15 |
| **SEC** | Restituisce la secante (in radianti). | `SEC(45)` | Angolo in radianti. | 1.9035944074044246 |
| **SECH** | Restituisce la secante iperbolica. | `SECH(45)` | Qualsiasi numero. | 5.725037161098787e-20 |
| **SIGN** | Restituisce il segno di un numero. | `SIGN(-0.00001)` | Numero. | -1 |
| **SIN** | Restituisce il seno (in radianti). | `SIN(1)` | Angolo in radianti. | 0.8414709848078965 |
| **SINH** | Restituisce il seno iperbolico. | `SINH(1)` | Qualsiasi numero. | 1.1752011936438014 |
| **SQRT** | Restituisce la radice quadrata. | `SQRT(16)` | Numero non negativo. | 4 |
| **SQRTPI** | Restituisce la radice quadrata di (numero * π). | `SQRTPI(2)` | Numero non negativo. | 2.5066282746310002 |
| **SUBTOTAL** | Restituisce un subtotale per un insieme di dati, ignorando le righe nascoste. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Numero funzione, array1, …, arrayN. | 10,32 |
| **SUM** | Restituisce la somma dei numeri, ignorando il testo. | `SUM(-5, 15, 32, 'Hello World!')` | Uno o più numeri. | 42 |
| **SUMIF** | Somma i valori che soddisfano una singola condizione. | `SUMIF([2,4,8,16], '>5')` | Intervallo, criteri. | 24 |
| **SUMIFS** | Somma i valori che soddisfano più condizioni. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Intervallo somma, intervallo criteri 1, criteri 1, …, intervallo criteri N, criteri N. | 12 |
| **SUMPRODUCT** | Restituisce la somma dei prodotti degli elementi di un array. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Due o più array. | 5 |
| **SUMSQ** | Restituisce la somma dei quadrati. | `SUMSQ(3, 4)` | Uno o più numeri. | 25 |
| **SUMX2MY2** | Restituisce la somma della differenza dei quadrati degli elementi corrispondenti dell'array. | `SUMX2MY2([1,2], [3,4])` | Array1, array2. | -20 |
| **SUMX2PY2** | Restituisce la somma della somma dei quadrati degli elementi corrispondenti dell'array. | `SUMX2PY2([1,2], [3,4])` | Array1, array2. | 30 |
| **SUMXMY2** | Restituisce la somma dei quadrati delle differenze degli elementi corrispondenti dell'array. | `SUMXMY2([1,2], [3,4])` | Array1, array2. | 8 |
| **TAN** | Restituisce la tangente (in radianti). | `TAN(1)` | Angolo in radianti. | 1.5574077246549023 |
| **TANH** | Restituisce la tangente iperbolica. | `TANH(-2)` | Qualsiasi numero. | -0.9640275800758168 |
| **TRUNC** | Tronca un numero a un intero senza arrotondare. | `TRUNC(-8.9)` | Numero, [cifre]. | -8 |

### Statistica

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Restituisce la deviazione assoluta media. | `AVEDEV([2,4], [8,16])` | Array di numeri che rappresentano punti dati. | 4.5 |
| **AVERAGE** | Restituisce la media aritmetica. | `AVERAGE([2,4], [8,16])` | Array di numeri che rappresentano punti dati. | 7.5 |
| **AVERAGEA** | Restituisce la media dei valori, inclusi testo e valori logici. | `AVERAGEA([2,4], [8,16])` | Array di numeri, testo o valori logici; tutti i valori non vuoti sono inclusi. | 7.5 |
| **AVERAGEIF** | Calcola la media in base a una singola condizione. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Il primo parametro è l'intervallo da controllare, il secondo è la condizione, il terzo è l'intervallo opzionale usato per la media. | 3.5 |
| **AVERAGEIFS** | Calcola la media in base a più condizioni. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Il primo parametro sono i valori di cui fare la media, seguiti da coppie di intervalli criteri ed espressioni criteri. | 6 |
| **BETADIST** | Restituisce la densità di probabilità beta cumulativa. | `BETADIST(2, 8, 10, true, 1, 3)` | Valore, alfa, beta, flag cumulativo, A (opzionale), B (opzionale). | 0.6854705810117458 |
| **BETAINV** | Restituisce l'inverso della distribuzione beta cumulativa. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probabilità, alfa, beta, A (opzionale), B (opzionale). | 1.9999999999999998 |
| **BINOMDIST** | Restituisce la probabilità di una distribuzione binomiale. | `BINOMDIST(6, 10, 0.5, false)` | Numero di successi, prove, probabilità di successo, flag cumulativo. | 0.205078125 |
| **CORREL** | Restituisce il coefficiente di correlazione tra due set di dati. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Due array di numeri. | 0.9970544855015815 |
| **COUNT** | Conta le celle numeriche. | `COUNT([1,2], [3,4])` | Array o intervalli di numeri. | 4 |
| **COUNTA** | Conta le celle non vuote. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Array o intervalli di qualsiasi tipo. | 4 |
| **COUNTBLANK** | Conta le celle vuote. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Array o intervalli di qualsiasi tipo. | 2 |
| **COUNTIF** | Conta le celle che soddisfano una condizione. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Intervallo di numeri o testo, e la condizione. | 3 |
| **COUNTIFS** | Conta le celle che soddisfano più condizioni. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Coppie di intervalli criteri ed espressioni criteri. | 2 |
| **COVARIANCEP** | Restituisce la covarianza della popolazione. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Due array di numeri. | 5.2 |
| **COVARIANCES** | Restituisce la covarianza del campione. | `COVARIANCES([2,4,8], [5,11,12])` | Due array di numeri. | 9.666666666666668 |
| **DEVSQ** | Restituisce la somma dei quadrati delle deviazioni. | `DEVSQ([2,4,8,16])` | Array di numeri che rappresentano punti dati. | 115 |
| **EXPONDIST** | Restituisce la distribuzione esponenziale. | `EXPONDIST(0.2, 10, true)` | Valore, lambda, flag cumulativo. | 0.8646647167633873 |
| **FDIST** | Restituisce la distribuzione di probabilità F. | `FDIST(15.2069, 6, 4, false)` | Valore, gradi di libertà 1, gradi di libertà 2, flag cumulativo. | 0.0012237917087831735 |
| **FINV** | Restituisce l'inverso della distribuzione F. | `FINV(0.01, 6, 4)` | Probabilità, gradi di libertà 1, gradi di libertà 2. | 0.10930991412457851 |
| **FISHER** | Restituisce la trasformazione di Fisher. | `FISHER(0.75)` | Numero che rappresenta un coefficiente di correlazione. | 0.9729550745276566 |
| **FISHERINV** | Restituisce l'inverso della trasformazione di Fisher. | `FISHERINV(0.9729550745276566)` | Numero che rappresenta il risultato di una trasformazione di Fisher. | 0.75 |
| **FORECAST** | Prevede un valore y per un dato x utilizzando valori x e y noti. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nuovo valore x, array di valori y noti, array di valori x noti. | 10.607253086419755 |
| **FREQUENCY** | Restituisce una distribuzione di frequenza. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Array dati, array classi. | 1,2,4,2 |
| **GAMMA** | Restituisce la funzione gamma. | `GAMMA(2.5)` | Numero positivo. | 1.3293403919101043 |
| **GAMMALN** | Restituisce il logaritmo naturale della funzione gamma. | `GAMMALN(10)` | Numero positivo. | 12.801827480081961 |
| **GAUSS** | Restituisce la probabilità basata sulla distribuzione normale standard. | `GAUSS(2)` | Numero che rappresenta un punteggio z. | 0.4772498680518208 |
| **GEOMEAN** | Restituisce la media geometrica. | `GEOMEAN([2,4], [8,16])` | Array di numeri. | 5.656854249492381 |
| **GROWTH** | Prevede i valori di crescita esponenziale in base ai dati noti. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Array di valori y noti, array di valori x noti, nuovi valori x. | 32.00000000000003 |
| **HARMEAN** | Restituisce la media armonica. | `HARMEAN([2,4], [8,16])` | Array di numeri. | 4.266666666666667 |
| **HYPGEOMDIST** | Restituisce la distribuzione ipergeometrica. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Successi del campione, dimensione del campione, successi della popolazione, dimensione della popolazione, flag cumulativo. | 0.3632610939112487 |
| **INTERCEPT** | Restituisce l'intercetta di una linea di regressione lineare. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Array di valori y noti, array di valori x noti. | 0.04838709677419217 |
| **KURT** | Restituisce la curtosi. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Array di numeri. | -0.15179963720841627 |
| **LARGE** | Restituisce il k-esimo valore più grande. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Array di numeri, k. | 5 |
| **LINEST** | Esegue l'analisi di regressione lineare. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Array di valori y noti, array di valori x noti, restituzione statistiche aggiuntive, restituzione ulteriori statistiche. | 2,1 |
| **LOGNORMDIST** | Restituisce la distribuzione lognormale. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Valore, media, deviazione standard, flag cumulativo. | 0.0390835557068005 |
| **LOGNORMINV** | Restituisce l'inverso della distribuzione lognormale. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probabilità, media, deviazione standard, flag cumulativo. | 4.000000000000001 |
| **MAX** | Restituisce il valore massimo. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Array di numeri. | 0.8 |
| **MAXA** | Restituisce il valore massimo inclusi testo e valori logici. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Array di numeri, testo o valori logici. | 1 |
| **MEDIAN** | Restituisce la mediana. | `MEDIAN([1,2,3], [4,5,6])` | Array di numeri. | 3.5 |
| **MIN** | Restituisce il valore minimo. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Array di numeri. | 0.1 |
| **MINA** | Restituisce il valore minimo inclusi testo e valori logici. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Array di numeri, testo o valori logici. | 0 |
| **MODEMULT** | Restituisce un array dei valori che ricorrono più frequentemente. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Array di numeri. | 2,3 |
| **MODESNGL** | Restituisce il singolo valore che ricorre più frequentemente. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Array di numeri. | 2 |
| **NORMDIST** | Restituisce la distribuzione normale. | `NORMDIST(42, 40, 1.5, true)` | Valore, media, deviazione standard, flag cumulativo. | 0.9087887802741321 |
| **NORMINV** | Restituisce l'inverso della distribuzione normale. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probabilità, media, deviazione standard. | 42 |
| **NORMSDIST** | Restituisce la distribuzione normale standard. | `NORMSDIST(1, true)` | Numero che rappresenta un punteggio z. | 0.8413447460685429 |
| **NORMSINV** | Restituisce l'inverso della distribuzione normale standard. | `NORMSINV(0.8413447460685429)` | Probabilità. | 1.0000000000000002 |
| **PEARSON** | Restituisce il coefficiente di correlazione momento-prodotto di Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Due array di numeri. | 0.6993786061802354 |
| **PERCENTILEEXC** | Restituisce il k-esimo percentile, esclusivo. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Array di numeri, k. | 1.5 |
| **PERCENTILEINC** | Restituisce il k-esimo percentile, inclusivo. | `PERCENTILEINC([1,2,3,4], 0.3)` | Array di numeri, k. | 1.9 |
| **PERCENTRANKEXC** | Restituisce il rango di un valore in un set di dati come percentuale (esclusiva). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Array di numeri, valore x, significatività (opzionale). | 0.4 |
| **PERCENTRANKINC** | Restituisce il rango di un valore in un set di dati come percentuale (inclusiva). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Array di numeri, valore x, significatività (opzionale). | 0.33 |
| **PERMUT** | Restituisce il numero di permutazioni. | `PERMUT(100, 3)` | Numero totale n, numero scelto k. | 970200 |
| **PERMUTATIONA** | Restituisce il numero di permutazioni con ripetizioni. | `PERMUTATIONA(4, 3)` | Numero totale n, numero scelto k. | 64 |
| **PHI** | Restituisce la funzione di densità della distribuzione normale standard. | `PHI(0.75)` | Numero che rappresenta un punteggio z. | 0.30113743215480443 |
| **POISSONDIST** | Restituisce la distribuzione di Poisson. | `POISSONDIST(2, 5, true)` | Numero di eventi, media, flag cumulativo. | 0.12465201948308113 |
| **PROB** | Restituisce la somma delle probabilità. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Array di valori, array di probabilità, limite inferiore, limite superiore. | 0.4 |
| **QUARTILEEXC** | Restituisce il quartile del set di dati, esclusivo. | `QUARTILEEXC([1,2,3,4], 1)` | Array di numeri, quarto. | 1.25 |
| **QUARTILEINC** | Restituisce il quartile del set di dati, inclusivo. | `QUARTILEINC([1,2,3,4], 1)` | Array di numeri, quarto. | 1.75 |
| **RANKAVG** | Restituisce il rango medio. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Numero, array di numeri, ordine (ascendente/discendente). | 4.5 |
| **RANKEQ** | Restituisce il rango di un numero. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Numero, array di numeri, ordine (ascendente/discendente). | 4 |
| **RSQ** | Restituisce il coefficiente di determinazione. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Due array di numeri. | 0.4891304347826088 |
| **SKEW** | Restituisce l'asimmetria. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Array di numeri. | 0.3595430714067974 |
| **SKEWP** | Restituisce l'asimmetria della popolazione. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Array di numeri. | 0.303193339354144 |
| **SLOPE** | Restituisce la pendenza della linea di regressione lineare. | `SLOPE([1,9,5,7], [0,4,2,3])` | Array di valori y noti, array di valori x noti. | 2 |
| **SMALL** | Restituisce il k-esimo valore più piccolo. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Array di numeri, k. | 3 |
| **STANDARDIZE** | Restituisce un valore normalizzato come punteggio z. | `STANDARDIZE(42, 40, 1.5)` | Valore, media, deviazione standard. | 1.3333333333333333 |
| **STDEVA** | Restituisce la deviazione standard, inclusi testo e valori logici. | `STDEVA([2,4], [8,16], [true, false])` | Array di numeri, testo o valori logici. | 6.013872850889572 |
| **STDEVP** | Restituisce la deviazione standard della popolazione. | `STDEVP([2,4], [8,16], [true, false])` | Array di numeri. | 5.361902647381804 |
| **STDEVPA** | Restituisce la deviazione standard della popolazione, inclusi testo e valori logici. | `STDEVPA([2,4], [8,16], [true, false])` | Array di numeri, testo o valori logici. | 5.489889697333535 |
| **STDEVS** | Restituisce la deviazione standard del campione. | `VARS([2,4], [8,16], [true, false])` | Array di numeri. | 6.191391873668904 |
| **STEYX** | Restituisce l'errore standard del valore y previsto. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Array di valori y noti, array di valori x noti. | 3.305718950210041 |
| **TINV** | Restituisce l'inverso della distribuzione t. | `TINV(0.9946953263673741, 1)` | Probabilità, gradi di libertà. | 59.99999999996535 |
| **TRIMMEAN** | Restituisce la media della parte interna di un set di dati. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Array di numeri, proporzione di troncamento. | 3.7777777777777777 |
| **VARA** | Restituisce la varianza inclusi testo e valori logici. | `VARA([2,4], [8,16], [true, false])` | Array di numeri, testo o valori logici. | 36.16666666666667 |
| **VARP** | Restituisce la varianza della popolazione. | `VARP([2,4], [8,16], [true, false])` | Array di numeri. | 28.75 |
| **VARPA** | Restituisce la varianza della popolazione inclusi testo e valori logici. | `VARPA([2,4], [8,16], [true, false])` | Array di numeri, testo o valori logici. | 30.13888888888889 |
| **VARS** | Restituisce la varianza del campione. | `VARS([2,4], [8,16], [true, false])` | Array di numeri. | 38.333333333333336 |
| **WEIBULLDIST** | Restituisce la distribuzione di Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Valore, alfa, beta, flag cumulativo. | 0.9295813900692769 |
| **ZTEST** | Restituisce la probabilità a una coda di un test z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Array di numeri, media ipotizzata. | 0.09057419685136381 |

### Testo

| Funzione | Definizione | Esempio di chiamata | Parametri | Risultato atteso |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Converte un codice numerico nel carattere corrispondente. | `CHAR(65)` | Numero che rappresenta il codice del carattere. | A |
| **CLEAN** | Rimuove tutti i caratteri non stampabili dal testo. | `CLEAN('Monthly report')` | Stringa di testo da pulire. | Monthly report |
| **CODE** | Restituisce il codice numerico del primo carattere in una stringa di testo. | `CODE('A')` | Stringa di testo contenente un singolo carattere. | 65 |
| **CONCATENATE** | Unisce più stringhe di testo in una sola stringa. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Una o più stringhe di testo da unire. | Andreas Hauser |
| **EXACT** | Verifica se due stringhe sono esattamente uguali, distinguendo tra maiuscole e minuscole. | `EXACT('Word', 'word')` | Due stringhe di testo da confrontare. | |
| **FIND** | Trova la posizione di una sottostringa a partire da una posizione data. | `FIND('M', 'Miriam McGovern', 3)` | Testo da trovare, testo di origine, posizione iniziale opzionale. | 8 |
| **LEFT** | Restituisce un numero specificato di caratteri dalla parte sinistra di una stringa. | `LEFT('Sale Price', 4)` | Stringa di testo e numero di caratteri. | Sale |
| **LEN** | Restituisce il numero di caratteri in una stringa di testo. | `LEN('Phoenix, AZ')` | Stringa di testo da conteggiare. | 11 |
| **LOWER** | Converte tutti i caratteri in minuscolo. | `LOWER('E. E. Cummings')` | Stringa di testo da convertire. | e. e. cummings |
| **MID** | Restituisce un numero specificato di caratteri dalla parte centrale di una stringa. | `MID('Fluid Flow', 7, 20)` | Stringa di testo, posizione iniziale, numero di caratteri. | Flow |
| **NUMBERVALUE** | Converte il testo in un numero utilizzando i separatori specificati. | `NUMBERVALUE('2.500,27', ',', '.')` | Stringa di testo, separatore decimale, separatore di gruppo. | 2500.27 |
| **PROPER** | Converte in maiuscolo la prima lettera di ogni parola. | `PROPER('this is a TITLE')` | Stringa di testo da formattare. | This Is A Title |
| **REPLACE** | Sostituisce parte di una stringa di testo con nuovo testo. | `REPLACE('abcdefghijk', 6, 5, '*')` | Testo originale, posizione iniziale, numero di caratteri, nuovo testo. | abcde*k |
| **REPT** | Ripete il testo per un numero specificato di volte. | `REPT('*-', 3)` | Stringa di testo e numero di ripetizioni. | *-*-*- |
| **RIGHT** | Restituisce un numero specificato di caratteri dalla parte destra di una stringa. | `RIGHT('Sale Price', 5)` | Stringa di testo e numero di caratteri. | Price |
| **ROMAN** | Converte un numero arabo in numeri romani. | `ROMAN(499)` | Numero arabo da convertire. | CDXCIX |
| **SEARCH** | Trova la posizione di una sottostringa, senza distinguere tra maiuscole e minuscole. | `SEARCH('margin', 'Profit Margin')` | Testo da trovare, testo di origine. | 8 |
| **SUBSTITUTE** | Sostituisce un'istanza specifica di vecchio testo con nuovo testo. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Testo originale, vecchio testo, nuovo testo, numero di istanza opzionale. | Quarter 1, 2012 |
| **T** | Restituisce il testo se il valore è testo; altrimenti restituisce una stringa vuota. | `T('Rainfall')` | L'argomento può essere qualsiasi tipo di dato. | Rainfall |
| **TRIM** | Rimuove gli spazi dal testo ad eccezione dei singoli spazi tra le parole. | `TRIM(' First Quarter Earnings ')` | Stringa di testo da pulire. | First Quarter Earnings |
| **TEXTJOIN** | Unisce più elementi di testo in una stringa utilizzando un delimitatore. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Delimitatore, flag ignora-vuoti, elementi di testo da unire. | The sun will come up tomorrow. |
| **UNICHAR** | Restituisce il carattere per un dato numero Unicode. | `UNICHAR(66)` | Punto di codice Unicode. | B |
| **UNICODE** | Restituisce il numero Unicode del primo carattere del testo. | `UNICODE('B')` | Stringa di testo contenente un singolo carattere. | 66 |
| **UPPER** | Converte tutti i caratteri in maiuscolo. | `UPPER('total')` | Stringa di testo da convertire. | TOTAL |