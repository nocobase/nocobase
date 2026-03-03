:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) fournit une vaste collection de fonctions compatibles avec Excel.

## Référence des fonctions

### Dates

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Crée une date sur la base de l'année, du mois et du jour fournis. | `DATE(2008, 7, 8)` | Année (entier), mois (1-12), jour (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Convertit une date au format texte en un numéro de série de date. | `DATEVALUE('8/22/2011')` | Chaîne de texte représentant une date. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Renvoie la partie "jour" d'une date. | `DAY('15-Apr-11')` | Valeur de date ou chaîne de texte de date. | 15 |
| **DAYS** | Calcule le nombre de jours entre deux dates. | `DAYS('3/15/11', '2/1/11')` | Date de fin, date de début. | 42 |
| **DAYS360** | Calcule le nombre de jours entre deux dates sur la base d'une année de 360 jours. | `DAYS360('1-Jan-11', '31-Dec-11')` | Date de début, date de fin. | 360 |
| **EDATE** | Renvoie la date située un nombre spécifié de mois avant ou après une date. | `EDATE('1/15/11', -1)` | Date de début, nombre de mois (positif pour le futur, négatif pour le passé). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Renvoie le dernier jour du mois précédant ou suivant le nombre de mois spécifié. | `EOMONTH('1/1/11', -3)` | Date de début, nombre de mois (positif pour le futur, négatif pour le passé). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Renvoie la partie "heure" d'une valeur temporelle. | `HOUR('7/18/2011 7:45:00 AM')` | Valeur temporelle ou chaîne de texte temporelle. | 7 |
| **MINUTE** | Renvoie la partie "minute" d'une valeur temporelle. | `MINUTE('2/1/2011 12:45:00 PM')` | Valeur temporelle ou chaîne de texte temporelle. | 45 |
| **ISOWEEKNUM** | Renvoie le numéro de semaine ISO de l'année pour une date donnée. | `ISOWEEKNUM('3/9/2012')` | Valeur de date ou chaîne de texte de date. | 10 |
| **MONTH** | Renvoie la partie "mois" d'une date. | `MONTH('15-Apr-11')` | Valeur de date ou chaîne de texte de date. | 4 |
| **NETWORKDAYS** | Compte le nombre de jours ouvrés entre deux dates, hors week-ends et jours fériés optionnels. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Date de début, date de fin, tableau optionnel de jours fériés. | 109 |
| **NETWORKDAYSINTL** | Compte les jours ouvrés entre deux dates, permettant de personnaliser les week-ends et les jours fériés. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Date de début, date de fin, mode week-end, tableau optionnel de jours fériés. | 23 |
| **NOW** | Renvoie la date et l'heure actuelles. | `NOW()` | Aucun paramètre. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Renvoie la partie "seconde" d'une valeur temporelle. | `SECOND('2/1/2011 4:48:18 PM')` | Valeur temporelle ou chaîne de texte temporelle. | 18 |
| **TIME** | Construit une valeur temporelle à partir de l'heure, de la minute et de la seconde fournies. | `TIME(16, 48, 10)` | Heure (0-23), minute (0-59), seconde (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Convertit une heure au format texte en un numéro de série d'heure. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Chaîne de texte représentant une heure. | 0.2743055555555556 |
| **TODAY** | Renvoie la date actuelle. | `TODAY()` | Aucun paramètre. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Renvoie le numéro correspondant au jour de la semaine. | `WEEKDAY('2/14/2008', 3)` | Valeur de date ou chaîne de texte de date, type de retour (1-3). | 3 |
| **YEAR** | Renvoie la partie "année" d'une date. | `YEAR('7/5/2008')` | Valeur de date ou chaîne de texte de date. | 2008 |
| **WEEKNUM** | Renvoie le numéro de semaine dans une année pour une date donnée. | `WEEKNUM('3/9/2012', 2)` | Valeur de date ou chaîne de texte de date, jour de début de semaine optionnel (1=dimanche, 2=lundi). | 11 |
| **WORKDAY** | Renvoie la date située avant ou après un nombre donné de jours ouvrés, hors week-ends et jours fériés. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Date de début, nombre de jours ouvrés, tableau optionnel de jours fériés. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Renvoie la date située avant ou après un nombre de jours ouvrés avec week-ends personnalisés et jours fériés. | `WORKDAYINTL('1/1/2012', 30, 17)` | Date de début, nombre de jours ouvrés, mode week-end. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Calcule la fraction d'année entre deux dates. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Date de début, date de fin, base optionnelle (base de calcul des jours). | 0.5780821917808219 |

### Finances

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Calcule l'intérêt couru pour un titre payant des intérêts périodiques. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Date d'émission, date du premier intérêt, date de règlement, taux annuel, valeur nominale, fréquence, base. | 350 |
| **CUMIPMT** | Calcule l'intérêt cumulé payé sur une série de paiements. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Taux, nombre total de périodes, valeur actuelle, période de début, période de fin, type de paiement (0=fin, 1=début). | -9916.77251395708 |
| **CUMPRINC** | Calcule le capital cumulé remboursé sur une série de paiements. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Taux, nombre total de périodes, valeur actuelle, période de début, période de fin, type de paiement (0=fin, 1=début). | -614.0863271085149 |
| **DB** | Calcule l'amortissement en utilisant la méthode de l'amortissement dégressif à taux fixe. | `DB(1000000, 100000, 6, 1, 6)` | Coût, valeur de récupération, durée de vie, période, mois. | 159500 |
| **DDB** | Calcule l'amortissement en utilisant la méthode de l'amortissement dégressif à double taux ou une autre méthode spécifiée. | `DDB(1000000, 100000, 6, 1, 1.5)` | Coût, valeur de récupération, durée de vie, période, facteur. | 250000 |
| **DOLLARDE** | Convertit un prix exprimé sous forme de fraction en un nombre décimal. | `DOLLARDE(1.1, 16)` | Prix sous forme de dollar fractionnaire, dénominateur. | 1.625 |
| **DOLLARFR** | Convertit un prix exprimé sous forme de nombre décimal en une fraction. | `DOLLARFR(1.625, 16)` | Prix sous forme de dollar décimal, dénominateur. | 1.1 |
| **EFFECT** | Calcule le taux d'intérêt annuel effectif. | `EFFECT(0.1, 4)` | Taux annuel nominal, nombre de périodes de composition par an. | 0.10381289062499977 |
| **FV** | Calcule la valeur future d'un investissement. | `FV(0.1/12, 10, -100, -1000, 0)` | Taux par période, nombre de périodes, paiement par période, valeur actuelle, type de paiement (0=fin, 1=début). | 2124.874409194097 |
| **FVSCHEDULE** | Calcule la valeur future d'un capital en utilisant une série de taux d'intérêt composés. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Capital, tableau de taux. | 133.08900000000003 |
| **IPMT** | Calcule le paiement des intérêts pour une période spécifique. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Taux par période, période, nombre total de périodes, valeur actuelle, valeur future, type de paiement (0=fin, 1=début). | 928.8235718400465 |
| **IRR** | Calcule le taux de rendement interne (TRI). | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Tableau de flux de trésorerie, estimation. | 0.05715142887178447 |
| **ISPMT** | Calcule l'intérêt payé pendant une période spécifique (pour les prêts). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Taux par période, période, nombre total de périodes, montant du prêt. | -625 |
| **MIRR** | Calcule le taux de rendement interne modifié (TRIM). | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Tableau de flux de trésorerie, taux de financement, taux de réinvestissement. | 0.07971710360838036 |
| **NOMINAL** | Calcule le taux d'intérêt annuel nominal. | `NOMINAL(0.1, 4)` | Taux annuel effectif, nombre de périodes de composition par an. | 0.09645475633778045 |
| **NPER** | Calcule le nombre de périodes nécessaires pour atteindre une valeur cible. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Taux par période, paiement par période, valeur actuelle, valeur future, type de paiement (0=fin, 1=début). | 63.39385422740764 |
| **NPV** | Calcule la valeur actuelle nette (VAN) d'une série de flux de trésorerie futurs. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Taux d'actualisation par période, tableau de flux de trésorerie. | 1031.3503176012546 |
| **PDURATION** | Calcule le temps nécessaire pour atteindre une valeur souhaitée. | `PDURATION(0.1, 1000, 2000)` | Taux par période, valeur actuelle, valeur future. | 7.272540897341714 |
| **PMT** | Calcule le paiement périodique d'un prêt. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Taux par période, nombre total de périodes, valeur actuelle, valeur future, type de paiement (0=fin, 1=début). | -42426.08563793503 |
| **PPMT** | Calcule le remboursement du capital pour une période spécifique. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Taux par période, période, nombre total de périodes, valeur actuelle, valeur future, type de paiement (0=fin, 1=début). | -43354.909209775076 |
| **PV** | Calcule la valeur actuelle d'un investissement. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Taux par période, nombre de périodes, paiement par période, valeur future, type de paiement (0=fin, 1=début). | -29864.950264779152 |
| **RATE** | Calcule le taux d'intérêt par période. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Nombre total de périodes, paiement par période, valeur actuelle, valeur future, type de paiement (0=fin, 1=début), estimation. | 0.06517891177181533 |

### Ingénierie

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Convertit un nombre binaire en décimal. | `BIN2DEC(101010)` | Nombre binaire. | 42 |
| **BIN2HEX** | Convertit un nombre binaire en hexadécimal. | `BIN2HEX(101010)` | Nombre binaire. | 2a |
| **BIN2OCT** | Convertit un nombre binaire en octal. | `BIN2OCT(101010)` | Nombre binaire. | 52 |
| **BITAND** | Renvoie le ET binaire de deux nombres. | `BITAND(42, 24)` | Entier, entier. | 8 |
| **BITLSHIFT** | Effectue un décalage binaire vers la gauche. | `BITLSHIFT(42, 24)` | Entier, nombre de bits à décaler. | 704643072 |
| **BITOR** | Renvoie le OU binaire de deux nombres. | `BITOR(42, 24)` | Entier, entier. | 58 |
| **BITRSHIFT** | Effectue un décalage binaire vers la droite. | `BITRSHIFT(42, 2)` | Entier, nombre de bits à décaler. | 10 |
| **BITXOR** | Renvoie le OU exclusif (XOR) binaire de deux nombres. | `BITXOR(42, 24)` | Entier, entier. | 50 |
| **COMPLEX** | Crée un nombre complexe. | `COMPLEX(3, 4)` | Partie réelle, partie imaginaire. | 3+4i |
| **CONVERT** | Convertit un nombre d'une unité de mesure à une autre. | `CONVERT(64, 'kibyte', 'bit')` | Valeur, unité d'origine, unité de destination. | 524288 |
| **DEC2BIN** | Convertit un nombre décimal en binaire. | `DEC2BIN(42)` | Nombre décimal. | 101010 |
| **DEC2HEX** | Convertit un nombre décimal en hexadécimal. | `DEC2HEX(42)` | Nombre décimal. | 2a |
| **DEC2OCT** | Convertit un nombre décimal en octal. | `DEC2OCT(42)` | Nombre décimal. | 52 |
| **DELTA** | Teste si deux valeurs sont égales. | `DELTA(42, 42)` | Nombre, nombre. | 1 |
| **ERF** | Renvoie la fonction d'erreur. | `ERF(1)` | Limite supérieure. | 0.8427007929497149 |
| **ERFC** | Renvoie la fonction d'erreur complémentaire. | `ERFC(1)` | Limite inférieure. | 0.1572992070502851 |
| **GESTEP** | Teste si un nombre est supérieur ou égal à un seuil. | `GESTEP(42, 24)` | Nombre, seuil. | 1 |
| **HEX2BIN** | Convertit un nombre hexadécimal en binaire. | `HEX2BIN('2a')` | Nombre hexadécimal. | 101010 |
| **HEX2DEC** | Convertit un nombre hexadécimal en décimal. | `HEX2DEC('2a')` | Nombre hexadécimal. | 42 |
| **HEX2OCT** | Convertit un nombre hexadécimal en octal. | `HEX2OCT('2a')` | Nombre hexadécimal. | 52 |
| **IMABS** | Renvoie la valeur absolue (module) d'un nombre complexe. | `IMABS('3+4i')` | Nombre complexe. | 5 |
| **IMAGINARY** | Renvoie la partie imaginaire d'un nombre complexe. | `IMAGINARY('3+4i')` | Nombre complexe. | 4 |
| **IMARGUMENT** | Renvoie l'argument d'un nombre complexe. | `IMARGUMENT('3+4i')` | Nombre complexe. | 0.9272952180016122 |
| **IMCONJUGATE** | Renvoie le conjugué complexe. | `IMCONJUGATE('3+4i')` | Nombre complexe. | 3-4i |
| **IMCOS** | Renvoie le cosinus d'un nombre complexe. | `IMCOS('1+i')` | Nombre complexe. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Renvoie le cosinus hyperbolique d'un nombre complexe. | `IMCOSH('1+i')` | Nombre complexe. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Renvoie la cotangente d'un nombre complexe. | `IMCOT('1+i')` | Nombre complexe. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Renvoie la cosécante d'un nombre complexe. | `IMCSC('1+i')` | Nombre complexe. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Renvoie la cosécante hyperbolique d'un nombre complexe. | `IMCSCH('1+i')` | Nombre complexe. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Renvoie le quotient de deux nombres complexes. | `IMDIV('1+2i', '3+4i')` | Nombre complexe dividende, nombre complexe diviseur. | 0.44+0.08i |
| **IMEXP** | Renvoie l'exponentielle d'un nombre complexe. | `IMEXP('1+i')` | Nombre complexe. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Renvoie le logarithme népérien d'un nombre complexe. | `IMLN('1+i')` | Nombre complexe. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Renvoie le logarithme en base 10 d'un nombre complexe. | `IMLOG10('1+i')` | Nombre complexe. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Renvoie le logarithme en base 2 d'un nombre complexe. | `IMLOG2('1+i')` | Nombre complexe. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Renvoie un nombre complexe élevé à une puissance. | `IMPOWER('1+i', 2)` | Nombre complexe, exposant. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Renvoie le produit de nombres complexes. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Tableau de nombres complexes. | -85+20i |
| **IMREAL** | Renvoie la partie réelle d'un nombre complexe. | `IMREAL('3+4i')` | Nombre complexe. | 3 |
| **IMSEC** | Renvoie la sécante d'un nombre complexe. | `IMSEC('1+i')` | Nombre complexe. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Renvoie la sécante hyperbolique d'un nombre complexe. | `IMSECH('1+i')` | Nombre complexe. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Renvoie le sinus d'un nombre complexe. | `IMSIN('1+i')` | Nombre complexe. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Renvoie le sinus hyperbolique d'un nombre complexe. | `IMSINH('1+i')` | Nombre complexe. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Renvoie la racine carrée d'un nombre complexe. | `IMSQRT('1+i')` | Nombre complexe. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Renvoie la différence entre deux nombres complexes. | `IMSUB('3+4i', '1+2i')` | Nombre complexe diminué, nombre complexe diminuteur. | 2+2i |
| **IMSUM** | Renvoie la somme de nombres complexes. | `IMSUM('1+2i', '3+4i', '5+6i')` | Tableau de nombres complexes. | 9+12i |
| **IMTAN** | Renvoie la tangente d'un nombre complexe. | `IMTAN('1+i')` | Nombre complexe. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Convertit un nombre octal en binaire. | `OCT2BIN('52')` | Nombre octal. | 101010 |
| **OCT2DEC** | Convertit un nombre octal en décimal. | `OCT2DEC('52')` | Nombre octal. | 42 |
| **OCT2HEX** | Convertit un nombre octal en hexadécimal. | `OCT2HEX('52')` | Nombre octal. | 2a |

### Logique

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Renvoie VRAI uniquement lorsque tous les arguments sont VRAI, sinon FAUX. | `AND(true, false, true)` | Une ou plusieurs valeurs logiques (booléennes) ; la fonction ne renvoie VRAI que si chaque argument est VRAI. | |
| **FALSE** | Renvoie la valeur logique FAUX. | `FALSE()` | Aucun paramètre. | |
| **IF** | Renvoie différentes valeurs selon qu'une condition est VRAI ou FAUX. | `IF(true, 'Hello!', 'Goodbye!')` | Condition, valeur si VRAI, valeur si FAUX. | Hello! |
| **IFS** | Évalue plusieurs conditions et renvoie le résultat de la première condition VRAI. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Plusieurs paires de conditions et de valeurs correspondantes. | Goodbye! |
| **NOT** | Inverse une valeur logique. VRAI devient FAUX et vice versa. | `NOT(true)` | Une valeur logique (booléenne). | |
| **OR** | Renvoie VRAI si l'un des arguments est VRAI, sinon FAUX. | `OR(true, false, true)` | Une ou plusieurs valeurs logiques (booléennes) ; renvoie VRAI si au moins un argument est VRAI. | |
| **SWITCH** | Renvoie la valeur qui correspond à une expression ; si aucune ne correspond, renvoie la valeur par défaut. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Expression, valeur de correspondance 1, résultat 1, ..., [par défaut]. | Seven |
| **TRUE** | Renvoie la valeur logique VRAI. | `TRUE()` | Aucun paramètre. | |
| **XOR** | Renvoie VRAI uniquement lorsqu'un nombre impair d'arguments est VRAI, sinon FAUX. | `XOR(true, false, true)` | Une ou plusieurs valeurs logiques (booléennes) ; renvoie VRAI lorsqu'un nombre impair d'arguments est VRAI. | |

### Mathématiques

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Renvoie la valeur absolue d'un nombre. | `ABS(-4)` | Nombre. | 4 |
| **ACOS** | Renvoie l'arccosinus (en radians). | `ACOS(-0.5)` | Nombre compris entre -1 et 1. | 2.0943951023931957 |
| **ACOSH** | Renvoie l'argument cosinus hyperbolique. | `ACOSH(10)` | Nombre supérieur ou égal à 1. | 2.993222846126381 |
| **ACOT** | Renvoie l'arccotangente (en radians). | `ACOT(2)` | N'importe quel nombre. | 0.46364760900080615 |
| **ACOTH** | Renvoie l'argument cotangente hyperbolique. | `ACOTH(6)` | Nombre dont la valeur absolue est supérieure à 1. | 0.16823611831060645 |
| **AGGREGATE** | Effectue un calcul d'agrégation tout en ignorant les erreurs ou les lignes masquées. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Numéro de fonction, options, tableau1, ..., tableauN. | 10,32 |
| **ARABIC** | Convertit un chiffre romain en chiffre arabe. | `ARABIC('MCMXII')` | Chaîne de chiffres romains. | 1912 |
| **ASIN** | Renvoie l'arcsinus (en radians). | `ASIN(-0.5)` | Nombre compris entre -1 et 1. | -0.5235987755982988 |
| **ASINH** | Renvoie l'argument sinus hyperbolique. | `ASINH(-2.5)` | N'importe quel nombre. | -1.6472311463710965 |
| **ATAN** | Renvoie l'arctangente (en radians). | `ATAN(1)` | N'importe quel nombre. | 0.7853981633974483 |
| **ATAN2** | Renvoie l'arctangente (en radians) d'une paire de coordonnées. | `ATAN2(-1, -1)` | Coordonnée y, coordonnée x. | -2.356194490192345 |
| **ATANH** | Renvoie l'argument tangente hyperbolique. | `ATANH(-0.1)` | Nombre compris entre -1 et 1. | -0.10033534773107562 |
| **BASE** | Convertit un nombre en texte dans la base spécifiée. | `BASE(15, 2, 10)` | Nombre, base, [longueur minimale]. | 0000001111 |
| **CEILING** | Arrondit un nombre au multiple supérieur le plus proche. | `CEILING(-5.5, 2, -1)` | Nombre, précision, [mode]. | -6 |
| **CEILINGMATH** | Arrondit un nombre au multiple supérieur, en utilisant le multiple et la direction fournis. | `CEILINGMATH(-5.5, 2, -1)` | Nombre, [précision], [mode]. | -6 |
| **CEILINGPRECISE** | Arrondit un nombre au multiple supérieur le plus proche, sans tenir compte du signe. | `CEILINGPRECISE(-4.1, -2)` | Nombre, [précision]. | -4 |
| **COMBIN** | Renvoie le nombre de combinaisons. | `COMBIN(8, 2)` | Nombre total d'éléments, nombre d'éléments choisis. | 28 |
| **COMBINA** | Renvoie le nombre de combinaisons avec répétitions. | `COMBINA(4, 3)` | Nombre total d'éléments, nombre d'éléments choisis. | 20 |
| **COS** | Renvoie le cosinus (en radians). | `COS(1)` | Angle en radians. | 0.5403023058681398 |
| **COSH** | Renvoie le cosinus hyperbolique. | `COSH(1)` | N'importe quel nombre. | 1.5430806348152437 |
| **COT** | Renvoie la cotangente (en radians). | `COT(30)` | Angle en radians. | -0.15611995216165922 |
| **COTH** | Renvoie la cotangente hyperbolique. | `COTH(2)` | N'importe quel nombre. | 1.0373147207275482 |
| **CSC** | Renvoie la cosécante (en radians). | `CSC(15)` | Angle en radians. | 1.5377805615408537 |
| **CSCH** | Renvoie la cosécante hyperbolique. | `CSCH(1.5)` | N'importe quel nombre. | 0.46964244059522464 |
| **DECIMAL** | Convertit un nombre sous forme de texte en décimal. | `DECIMAL('FF', 16)` | Texte, base. | 255 |
| **ERF** | Renvoie la fonction d'erreur. | `ERF(1)` | Limite supérieure. | 0.8427007929497149 |
| **ERFC** | Renvoie la fonction d'erreur complémentaire. | `ERFC(1)` | Limite inférieure. | 0.1572992070502851 |
| **EVEN** | Arrondit un nombre à l'entier pair le plus proche. | `EVEN(-1)` | Nombre. | -2 |
| **EXP** | Renvoie e élevé à une puissance. | `EXP(1)` | Exposant. | 2.718281828459045 |
| **FACT** | Renvoie la factorielle. | `FACT(5)` | Entier non négatif. | 120 |
| **FACTDOUBLE** | Renvoie la factorielle double. | `FACTDOUBLE(7)` | Entier non négatif. | 105 |
| **FLOOR** | Arrondit un nombre au multiple inférieur le plus proche. | `FLOOR(-3.1)` | Nombre, précision. | -4 |
| **FLOORMATH** | Arrondit un nombre au multiple inférieur en utilisant le multiple et la direction fournis. | `FLOORMATH(-4.1, -2, -1)` | Nombre, [précision], [mode]. | -4 |
| **FLOORPRECISE** | Arrondit un nombre au multiple inférieur le plus proche, sans tenir compte du signe. | `FLOORPRECISE(-3.1, -2)` | Nombre, [précision]. | -4 |
| **GCD** | Renvoie le plus grand commun diviseur (PGCD). | `GCD(24, 36, 48)` | Deux entiers ou plus. | 12 |
| **INT** | Arrondit un nombre à l'entier inférieur le plus proche. | `INT(-8.9)` | Nombre. | -9 |
| **ISEVEN** | Teste si un nombre est pair. | `ISEVEN(-2.5)` | Nombre. | |
| **ISOCEILING** | Arrondit un nombre au multiple supérieur selon les règles ISO. | `ISOCEILING(-4.1, -2)` | Nombre, [précision]. | -4 |
| **ISODD** | Teste si un nombre est impair. | `ISODD(-2.5)` | Nombre. | |
| **LCM** | Renvoie le plus petit commun multiple (PPCM). | `LCM(24, 36, 48)` | Deux entiers ou plus. | 144 |
| **LN** | Renvoie le logarithme népérien. | `LN(86)` | Nombre positif. | 4.454347296253507 |
| **LOG** | Renvoie le logarithme dans la base spécifiée. | `LOG(8, 2)` | Nombre, base. | 3 |
| **LOG10** | Renvoie le logarithme en base 10. | `LOG10(100000)` | Nombre positif. | 5 |
| **MOD** | Renvoie le reste d'une division. | `MOD(3, -2)` | Dividende, diviseur. | -1 |
| **MROUND** | Arrondit un nombre au multiple le plus proche. | `MROUND(-10, -3)` | Nombre, multiple. | -9 |
| **MULTINOMIAL** | Renvoie le coefficient multinomial. | `MULTINOMIAL(2, 3, 4)` | Deux entiers non négatifs ou plus. | 1260 |
| **ODD** | Arrondit un nombre à l'entier impair le plus proche. | `ODD(-1.5)` | Nombre. | -3 |
| **POWER** | Élève un nombre à une puissance. | `POWER(5, 2)` | Base, exposant. | 25 |
| **PRODUCT** | Renvoie le produit de nombres. | `PRODUCT(5, 15, 30)` | Un ou plusieurs nombres. | 2250 |
| **QUOTIENT** | Renvoie la partie entière d'une division. | `QUOTIENT(-10, 3)` | Dividende, diviseur. | -3 |
| **RADIANS** | Convertit des degrés en radians. | `RADIANS(180)` | Degrés. | 3.141592653589793 |
| **RAND** | Renvoie un nombre réel aléatoire entre 0 et 1. | `RAND()` | Aucun paramètre. | [Nombre réel aléatoire entre 0 et 1] |
| **RANDBETWEEN** | Renvoie un nombre entier aléatoire dans une plage spécifiée. | `RANDBETWEEN(-1, 1)` | Borne inférieure, borne supérieure. | [Nombre entier aléatoire entre borne inférieure et supérieure] |
| **ROUND** | Arrondit un nombre au nombre de chiffres spécifié. | `ROUND(626.3, -3)` | Nombre, chiffres. | 1000 |
| **ROUNDDOWN** | Arrondit un nombre vers le bas (vers zéro). | `ROUNDDOWN(-3.14159, 2)` | Nombre, chiffres. | -3.14 |
| **ROUNDUP** | Arrondit un nombre vers le haut (en s'éloignant de zéro). | `ROUNDUP(-3.14159, 2)` | Nombre, chiffres. | -3.15 |
| **SEC** | Renvoie la sécante (en radians). | `SEC(45)` | Angle en radians. | 1.9035944074044246 |
| **SECH** | Renvoie la sécante hyperbolique. | `SECH(45)` | N'importe quel nombre. | 5.725037161098787e-20 |
| **SIGN** | Renvoie le signe d'un nombre. | `SIGN(-0.00001)` | Nombre. | -1 |
| **SIN** | Renvoie le sinus (en radians). | `SIN(1)` | Angle en radians. | 0.8414709848078965 |
| **SINH** | Renvoie le sinus hyperbolique. | `SINH(1)` | N'importe quel nombre. | 1.1752011936438014 |
| **SQRT** | Renvoie la racine carrée. | `SQRT(16)` | Nombre non négatif. | 4 |
| **SQRTPI** | Renvoie la racine carrée de (nombre * π). | `SQRTPI(2)` | Nombre non négatif. | 2.5066282746310002 |
| **SUBTOTAL** | Renvoie un sous-total pour un ensemble de données, en ignorant les lignes masquées. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Numéro de fonction, tableau1, ..., tableauN. | 10,32 |
| **SUM** | Renvoie la somme de nombres, en ignorant le texte. | `SUM(-5, 15, 32, 'Hello World!')` | Un ou plusieurs nombres. | 42 |
| **SUMIF** | Somme les valeurs qui répondent à une condition unique. | `SUMIF([2,4,8,16], '>5')` | Plage, critère. | 24 |
| **SUMIFS** | Somme les valeurs qui répondent à plusieurs conditions. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Plage de somme, plage de critères 1, critère 1, ..., plage de critères N, critère N. | 12 |
| **SUMPRODUCT** | Renvoie la somme des produits d'éléments de tableaux. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Deux tableaux ou plus. | 5 |
| **SUMSQ** | Renvoie la somme des carrés. | `SUMSQ(3, 4)` | Un ou plusieurs nombres. | 25 |
| **SUMX2MY2** | Renvoie la somme de la différence des carrés des éléments correspondants de tableaux. | `SUMX2MY2([1,2], [3,4])` | Tableau1, tableau2. | -20 |
| **SUMX2PY2** | Renvoie la somme de la somme des carrés des éléments correspondants de tableaux. | `SUMX2PY2([1,2], [3,4])` | Tableau1, tableau2. | 30 |
| **SUMXMY2** | Renvoie la somme des carrés des différences des éléments correspondants de tableaux. | `SUMXMY2([1,2], [3,4])` | Tableau1, tableau2. | 8 |
| **TAN** | Renvoie la tangente (en radians). | `TAN(1)` | Angle en radians. | 1.5574077246549023 |
| **TANH** | Renvoie la tangente hyperbolique. | `TANH(-2)` | N'importe quel nombre. | -0.9640275800758168 |
| **TRUNC** | Tronque un nombre en un entier sans arrondir. | `TRUNC(-8.9)` | Nombre, [chiffres]. | -8 |

### Statistiques

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Renvoie l'écart absolu moyen. | `AVEDEV([2,4], [8,16])` | Tableaux de nombres représentant des points de données. | 4.5 |
| **AVERAGE** | Renvoie la moyenne arithmétique. | `AVERAGE([2,4], [8,16])` | Tableaux de nombres représentant des points de données. | 7.5 |
| **AVERAGEA** | Renvoie la moyenne des valeurs, y compris le texte et les valeurs logiques. | `AVERAGEA([2,4], [8,16])` | Tableaux de nombres, de texte ou de valeurs logiques ; toutes les valeurs non vides sont incluses. | 7.5 |
| **AVERAGEIF** | Calcule la moyenne sur la base d'une condition unique. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Le premier paramètre est la plage à vérifier, le deuxième est la condition, le troisième est la plage optionnelle utilisée pour la moyenne. | 3.5 |
| **AVERAGEIFS** | Calcule la moyenne sur la base de plusieurs conditions. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Le premier paramètre correspond aux valeurs à moyenner, suivi de paires de plages de critères et d'expressions de critères. | 6 |
| **BETADIST** | Renvoie la densité de probabilité bêta cumulée. | `BETADIST(2, 8, 10, true, 1, 3)` | Valeur, alpha, bêta, indicateur cumulatif, A (optionnel), B (optionnel). | 0.6854705810117458 |
| **BETAINV** | Renvoie l'inverse de la distribution bêta cumulée. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probabilité, alpha, bêta, A (optionnel), B (optionnel). | 1.9999999999999998 |
| **BINOMDIST** | Renvoie la probabilité d'une distribution binomiale. | `BINOMDIST(6, 10, 0.5, false)` | Nombre de succès, essais, probabilité de succès, indicateur cumulatif. | 0.205078125 |
| **CORREL** | Renvoie le coefficient de corrélation entre deux ensembles de données. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Deux tableaux de nombres. | 0.9970544855015815 |
| **COUNT** | Compte les cellules numériques. | `COUNT([1,2], [3,4])` | Tableaux ou plages de nombres. | 4 |
| **COUNTA** | Compte les cellules non vides. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Tableaux ou plages de n'importe quel type. | 4 |
| **COUNTBLANK** | Compte les cellules vides. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Tableaux ou plages de n'importe quel type. | 2 |
| **COUNTIF** | Compte les cellules correspondant à une condition. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Plage de nombres ou de texte, et la condition. | 3 |
| **COUNTIFS** | Compte les cellules correspondant à plusieurs conditions. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Paires de plages de critères et d'expressions de critères. | 2 |
| **COVARIANCEP** | Renvoie la covariance de population. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Deux tableaux de nombres. | 5.2 |
| **COVARIANCES** | Renvoie la covariance d'échantillon. | `COVARIANCES([2,4,8], [5,11,12])` | Deux tableaux de nombres. | 9.666666666666668 |
| **DEVSQ** | Renvoie la somme des carrés des écarts. | `DEVSQ([2,4,8,16])` | Tableau de nombres représentant des points de données. | 115 |
| **EXPONDIST** | Renvoie la distribution exponentielle. | `EXPONDIST(0.2, 10, true)` | Valeur, lambda, indicateur cumulatif. | 0.8646647167633873 |
| **FDIST** | Renvoie la distribution de probabilité F. | `FDIST(15.2069, 6, 4, false)` | Valeur, degrés de liberté 1, degrés de liberté 2, indicateur cumulatif. | 0.0012237917087831735 |
| **FINV** | Renvoie l'inverse de la distribution F. | `FINV(0.01, 6, 4)` | Probabilité, degrés de liberté 1, degrés de liberté 2. | 0.10930991412457851 |
| **FISHER** | Renvoie la transformation de Fisher. | `FISHER(0.75)` | Nombre représentant un coefficient de corrélation. | 0.9729550745276566 |
| **FISHERINV** | Renvoie l'inverse de la transformation de Fisher. | `FISHERINV(0.9729550745276566)` | Nombre représentant un résultat de transformation de Fisher. | 0.75 |
| **FORECAST** | Prédit une valeur y pour un x donné en utilisant des valeurs x et y connues. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nouvelle valeur x, tableau de valeurs y connues, tableau de valeurs x connues. | 10.607253086419755 |
| **FREQUENCY** | Renvoie une distribution de fréquence. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Tableau de données, tableau de tranches. | 1,2,4,2 |
| **GAMMA** | Renvoie la fonction gamma. | `GAMMA(2.5)` | Nombre positif. | 1.3293403919101043 |
| **GAMMALN** | Renvoie le logarithme népérien de la fonction gamma. | `GAMMALN(10)` | Nombre positif. | 12.801827480081961 |
| **GAUSS** | Renvoie la probabilité basée sur la distribution normale standard. | `GAUSS(2)` | Nombre représentant un score z. | 0.4772498680518208 |
| **GEOMEAN** | Renvoie la moyenne géométrique. | `GEOMEAN([2,4], [8,16])` | Tableaux de nombres. | 5.656854249492381 |
| **GROWTH** | Prédit les valeurs de croissance exponentielle basées sur des données connues. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Tableau de valeurs y connues, tableau de valeurs x connues, nouvelles valeurs x. | 32.00000000000003 |
| **HARMEAN** | Renvoie la moyenne harmonique. | `HARMEAN([2,4], [8,16])` | Tableaux de nombres. | 4.266666666666667 |
| **HYPGEOMDIST** | Renvoie la distribution hypergéométrique. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Succès de l'échantillon, taille de l'échantillon, succès de la population, taille de la population, indicateur cumulatif. | 0.3632610939112487 |
| **INTERCEPT** | Renvoie l'ordonnée à l'origine d'une droite de régression linéaire. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Tableau de valeurs y connues, tableau de valeurs x connues. | 0.04838709677419217 |
| **KURT** | Renvoie le coefficient d'aplatissement (kurtosis). | `KURT([3,4,5,2,3,4,5,6,4,7])` | Tableau de nombres. | -0.15179963720841627 |
| **LARGE** | Renvoie la k-ième plus grande valeur. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Tableau de nombres, k. | 5 |
| **LINEST** | Effectue une analyse de régression linéaire. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Tableau de valeurs y connues, tableau de valeurs x connues, renvoyer stats additionnelles, renvoyer plus de stats. | 2,1 |
| **LOGNORMDIST** | Renvoie la distribution log-normale. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Valeur, moyenne, écart-type, indicateur cumulatif. | 0.0390835557068005 |
| **LOGNORMINV** | Renvoie l'inverse de la distribution log-normale. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probabilité, moyenne, écart-type, indicateur cumulatif. | 4.000000000000001 |
| **MAX** | Renvoie la valeur maximale. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Tableaux de nombres. | 0.8 |
| **MAXA** | Renvoie la valeur maximale, y compris le texte et les valeurs logiques. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 1 |
| **MEDIAN** | Renvoie la médiane. | `MEDIAN([1,2,3], [4,5,6])` | Tableaux de nombres. | 3.5 |
| **MIN** | Renvoie la valeur minimale. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Tableaux de nombres. | 0.1 |
| **MINA** | Renvoie la valeur minimale, y compris le texte et les valeurs logiques. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 0 |
| **MODEMULT** | Renvoie un tableau des valeurs les plus fréquentes. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Tableau de nombres. | 2,3 |
| **MODESNGL** | Renvoie la valeur unique la plus fréquente. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Tableau de nombres. | 2 |
| **NORMDIST** | Renvoie la distribution normale. | `NORMDIST(42, 40, 1.5, true)` | Valeur, moyenne, écart-type, indicateur cumulatif. | 0.9087887802741321 |
| **NORMINV** | Renvoie l'inverse de la distribution normale. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probabilité, moyenne, écart-type. | 42 |
| **NORMSDIST** | Renvoie la distribution normale standard. | `NORMSDIST(1, true)` | Nombre représentant un score z. | 0.8413447460685429 |
| **NORMSINV** | Renvoie l'inverse de la distribution normale standard. | `NORMSINV(0.8413447460685429)` | Probabilité. | 1.0000000000000002 |
| **PEARSON** | Renvoie le coefficient de corrélation produit-moment de Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Deux tableaux de nombres. | 0.6993786061802354 |
| **PERCENTILEEXC** | Renvoie le k-ième centile, exclusif. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Tableau de nombres, k. | 1.5 |
| **PERCENTILEINC** | Renvoie le k-ième centile, inclusif. | `PERCENTILEINC([1,2,3,4], 0.3)` | Tableau de nombres, k. | 1.9 |
| **PERCENTRANKEXC** | Renvoie le rang d'une valeur dans un ensemble de données sous forme de pourcentage (exclusif). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Tableau de nombres, valeur x, précision (optionnel). | 0.4 |
| **PERCENTRANKINC** | Renvoie le rang d'une valeur dans un ensemble de données sous forme de pourcentage (inclusif). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Tableau de nombres, valeur x, précision (optionnel). | 0.33 |
| **PERMUT** | Renvoie le nombre de permutations. | `PERMUT(100, 3)` | Nombre total n, nombre choisi k. | 970200 |
| **PERMUTATIONA** | Renvoie le nombre de permutations avec répétitions. | `PERMUTATIONA(4, 3)` | Nombre total n, nombre choisi k. | 64 |
| **PHI** | Renvoie la fonction de densité de la distribution normale standard. | `PHI(0.75)` | Nombre représentant un score z. | 0.30113743215480443 |
| **POISSONDIST** | Renvoie la distribution de Poisson. | `POISSONDIST(2, 5, true)` | Nombre d'événements, moyenne, indicateur cumulatif. | 0.12465201948308113 |
| **PROB** | Renvoie la somme des probabilités. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Tableau de valeurs, tableau de probabilités, limite inférieure, limite supérieure. | 0.4 |
| **QUARTILEEXC** | Renvoie le quartile de l'ensemble de données, exclusif. | `QUARTILEEXC([1,2,3,4], 1)` | Tableau de nombres, quart. | 1.25 |
| **QUARTILEINC** | Renvoie le quartile de l'ensemble de données, inclusif. | `QUARTILEINC([1,2,3,4], 1)` | Tableau de nombres, quart. | 1.75 |
| **RANKAVG** | Renvoie le rang moyen. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Nombre, tableau de nombres, ordre (croissant/décroissant). | 4.5 |
| **RANKEQ** | Renvoie le rang d'un nombre. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Nombre, tableau de nombres, ordre (croissant/décroissant). | 4 |
| **RSQ** | Renvoie le coefficient de détermination. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Deux tableaux de nombres. | 0.4891304347826088 |
| **SKEW** | Renvoie le coefficient d'asymétrie (skewness). | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Tableau de nombres. | 0.3595430714067974 |
| **SKEWP** | Renvoie le coefficient d'asymétrie de population. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Tableau de nombres. | 0.303193339354144 |
| **SLOPE** | Renvoie la pente de la droite de régression linéaire. | `SLOPE([1,9,5,7], [0,4,2,3])` | Tableau de valeurs y connues, tableau de valeurs x connues. | 2 |
| **SMALL** | Renvoie la k-ième plus petite valeur. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Tableau de nombres, k. | 3 |
| **STANDARDIZE** | Renvoie une valeur normalisée (score z). | `STANDARDIZE(42, 40, 1.5)` | Valeur, moyenne, écart-type. | 1.3333333333333333 |
| **STDEVA** | Renvoie l'écart-type, y compris le texte et les valeurs logiques. | `STDEVA([2,4], [8,16], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 6.013872850889572 |
| **STDEVP** | Renvoie l'écart-type de population. | `STDEVP([2,4], [8,16], [true, false])` | Tableaux de nombres. | 5.361902647381804 |
| **STDEVPA** | Renvoie l'écart-type de population, y compris le texte et les valeurs logiques. | `STDEVPA([2,4], [8,16], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 5.489889697333535 |
| **STDEVS** | Renvoie l'écart-type d'échantillon. | `VARS([2,4], [8,16], [true, false])` | Tableaux de nombres. | 6.191391873668904 |
| **STEYX** | Renvoie l'erreur standard de la valeur y prédite. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Tableau de valeurs y connues, tableau de valeurs x connues. | 3.305718950210041 |
| **TINV** | Renvoie l'inverse de la distribution t. | `TINV(0.9946953263673741, 1)` | Probabilité, degrés de liberté. | 59.99999999996535 |
| **TRIMMEAN** | Renvoie la moyenne de la partie intérieure d'un ensemble de données. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Tableau de nombres, proportion à tronquer. | 3.7777777777777777 |
| **VARA** | Renvoie la variance, y compris le texte et les valeurs logiques. | `VARA([2,4], [8,16], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 36.16666666666667 |
| **VARP** | Renvoie la variance de population. | `VARP([2,4], [8,16], [true, false])` | Tableaux de nombres. | 28.75 |
| **VARPA** | Renvoie la variance de population, y compris le texte et les valeurs logiques. | `VARPA([2,4], [8,16], [true, false])` | Tableaux de nombres, de texte ou de valeurs logiques. | 30.13888888888889 |
| **VARS** | Renvoie la variance d'échantillon. | `VARS([2,4], [8,16], [true, false])` | Tableaux de nombres. | 38.333333333333336 |
| **WEIBULLDIST** | Renvoie la distribution de Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Valeur, alpha, bêta, indicateur cumulatif. | 0.9295813900692769 |
| **ZTEST** | Renvoie la probabilité unilatérale d'un test z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Tableau de nombres, moyenne hypothétique. | 0.09057419685136381 |

### Texte

| Fonction | Définition | Exemple d'appel | Paramètres | Résultat attendu |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Convertit un code numérique en caractère correspondant. | `CHAR(65)` | Nombre représentant le code du caractère. | A |
| **CLEAN** | Supprime tous les caractères non imprimables du texte. | `CLEAN('Monthly report')` | Chaîne de texte à nettoyer. | Monthly report |
| **CODE** | Renvoie le code numérique du premier caractère d'une chaîne de texte. | `CODE('A')` | Chaîne de texte contenant un seul caractère. | 65 |
| **CONCATENATE** | Joint plusieurs chaînes de texte en une seule. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Une ou plusieurs chaînes de texte à joindre. | Andreas Hauser |
| **EXACT** | Vérifie si deux chaînes sont exactement identiques (sensible à la casse). | `EXACT('Word', 'word')` | Deux chaînes de texte à comparer. | |
| **FIND** | Trouve la position d'une sous-chaîne à partir d'une position donnée. | `FIND('M', 'Miriam McGovern', 3)` | Texte à trouver, texte source, position de départ optionnelle. | 8 |
| **LEFT** | Renvoie un nombre spécifié de caractères depuis le côté gauche d'une chaîne. | `LEFT('Sale Price', 4)` | Chaîne de texte et nombre de caractères. | Sale |
| **LEN** | Renvoie le nombre de caractères d'une chaîne de texte. | `LEN('Phoenix, AZ')` | Chaîne de texte à compter. | 11 |
| **LOWER** | Convertit tous les caractères en minuscules. | `LOWER('E. E. Cummings')` | Chaîne de texte à convertir. | e. e. cummings |
| **MID** | Renvoie un nombre spécifié de caractères depuis le milieu d'une chaîne. | `MID('Fluid Flow', 7, 20)` | Chaîne de texte, position de départ, nombre de caractères. | Flow |
| **NUMBERVALUE** | Convertit du texte en nombre en utilisant les séparateurs spécifiés. | `NUMBERVALUE('2.500,27', ',', '.')` | Chaîne de texte, séparateur décimal, séparateur de groupe. | 2500.27 |
| **PROPER** | Met en majuscule la première lettre de chaque mot. | `PROPER('this is a TITLE')` | Chaîne de texte à formater. | This Is A Title |
| **REPLACE** | Remplace une partie d'une chaîne de texte par un nouveau texte. | `REPLACE('abcdefghijk', 6, 5, '*')` | Texte original, position de départ, nombre de caractères, nouveau texte. | abcde*k |
| **REPT** | Répète le texte un nombre spécifié de fois. | `REPT('*-', 3)` | Chaîne de texte et nombre de répétitions. | *-*-*- |
| **RIGHT** | Renvoie un nombre spécifié de caractères depuis le côté droit d'une chaîne. | `RIGHT('Sale Price', 5)` | Chaîne de texte et nombre de caractères. | Price |
| **ROMAN** | Convertit un chiffre arabe en chiffres romains. | `ROMAN(499)` | Nombre arabe à convertir. | CDXCIX |
| **SEARCH** | Trouve la position d'une sous-chaîne (insensible à la casse). | `SEARCH('margin', 'Profit Margin')` | Texte à trouver, texte source. | 8 |
| **SUBSTITUTE** | Remplace une instance spécifique de l'ancien texte par un nouveau texte. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Texte original, ancien texte, nouveau texte, numéro d'instance optionnel. | Quarter 1, 2012 |
| **T** | Renvoie le texte si la valeur est du texte ; sinon renvoie une chaîne vide. | `T('Rainfall')` | L'argument peut être n'importe quel type de données. | Rainfall |
| **TRIM** | Supprime les espaces du texte sauf les espaces simples entre les mots. | `TRIM(' First Quarter Earnings ')` | Chaîne de texte à ajuster. | First Quarter Earnings |
| **TEXTJOIN** | Joint plusieurs éléments de texte en une seule chaîne à l'aide d'un délimiteur. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Délimiteur, indicateur pour ignorer les vides, éléments de texte à joindre. | The sun will come up tomorrow. |
| **UNICHAR** | Renvoie le caractère correspondant à un numéro Unicode donné. | `UNICHAR(66)` | Point de code Unicode. | B |
| **UNICODE** | Renvoie le numéro Unicode du premier caractère du texte. | `UNICODE('B')` | Chaîne de texte contenant un seul caractère. | 66 |
| **UPPER** | Convertit tous les caractères en majuscules. | `UPPER('total')` | Chaîne de texte à convertir. | TOTAL |