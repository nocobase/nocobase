:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/template-print/syntax/formatters/date-formatting).
:::

### Formatage de date

#### 1. :formatD(patternOut, patternIn)

##### Explication de la syntaxe
Formatez la date, accepte le modèle de format de sortie `patternOut` et le modèle de format d'entrée `patternIn` (par défaut ISO 8601).

##### Exemples courants
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Sortie 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Sortie 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Sortie 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Sortie 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Sortie 1月15日
{d.meetingTime:formatD(HH:mm)}              // Sortie 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Sortie 2024年1月15日 星期一
```

##### Plus d'exemples de formats
```
'20160131':formatD(L)      // Sortie 01/31/2016
'20160131':formatD(LL)     // Sortie January 31, 2016
'20160131':formatD(LLLL)   // Sortie Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Sortie Sunday
```

##### Résultat
La sortie est une chaîne de date au format spécifié.


#### 2. :addD(amount, unit, patternIn)

##### Explication de la syntaxe
Ajoutez une quantité de temps spécifiée à la date. Unités prises en charge : day, week, month, quarter, year, hour, minute, second, millisecond.  
Paramètres :
- amount : La quantité à ajouter
- unit : L'unité de temps (insensible à la casse)
- patternIn : Optionnel, format d'entrée, par défaut ISO8601

##### Exemple
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Sortie "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Sortie "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Sortie "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Sortie "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Sortie "2016-04-30T00:00:00.000Z"
```

##### Résultat
La sortie est la nouvelle date après l'ajout du temps.


#### 3. :subD(amount, unit, patternIn)

##### Explication de la syntaxe
Soustrayez une quantité de temps spécifiée de la date. Paramètres identiques à `addD`.

##### Exemple
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Sortie "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Sortie "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Sortie "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Sortie "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Sortie "2015-10-31T00:00:00.000Z"
```

##### Résultat
La sortie est la nouvelle date après la soustraction du temps.


#### 4. :startOfD(unit, patternIn)

##### Explication de la syntaxe
Définit la date au début de l'unité de temps spécifiée.  
Paramètres :
- unit : L'unité de temps
- patternIn : Optionnel, format d'entrée

##### Exemple
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Sortie "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Sortie "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Sortie "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Sortie "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Sortie "2016-01-01T00:00:00.000Z"
```

##### Résultat
La sortie est une chaîne de date représentant le moment du début.


#### 5. :endOfD(unit, patternIn)

##### Explication de la syntaxe
Définit la date à la fin de l'unité de temps spécifiée.  
Paramètres identiques ci-dessus.

##### Exemple
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Sortie "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Sortie "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Sortie "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Sortie "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Sortie "2016-01-31T23:59:59.999Z"
```

##### Résultat
La sortie est une chaîne de date représentant le moment de la fin.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Explication de la syntaxe
Calcule la différence entre deux dates et l'affiche dans l'unité spécifiée. Les unités de sortie prises en charge incluent :
- `day(s)` ou `d`
- `week(s)` ou `w`
- `quarter(s)` ou `Q`
- `month(s)` ou `M`
- `year(s)` ou `y`
- `hour(s)` ou `h`
- `minute(s)` ou `m`
- `second(s)` ou `s`
- `millisecond(s)` ou `ms` (unité par défaut)

Paramètres :
- toDate : Date cible
- unit : Unité de sortie
- patternFromDate : Optionnel, format de la date de départ
- patternToDate : Optionnel, format de la date cible

##### Exemple
```
'20101001':diffD('20101201')              // Sortie 5270400000
'20101001':diffD('20101201', 'second')      // Sortie 5270400
'20101001':diffD('20101201', 's')           // Sortie 5270400
'20101001':diffD('20101201', 'm')           // Sortie 87840
'20101001':diffD('20101201', 'h')           // Sortie 1464
'20101001':diffD('20101201', 'weeks')       // Sortie 8
'20101001':diffD('20101201', 'days')        // Sortie 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Sortie 5270400000
```

##### Résultat
La sortie est la différence de temps entre les deux dates, convertie selon l'unité spécifiée.


#### 7. :convDate(patternIn, patternOut)

##### Explication de la syntaxe
Convertit une date d'un format à un autre. (Utilisation non recommandée)  
Paramètres :
- patternIn : Format de la date d'entrée
- patternOut : Format de la date de sortie

##### Exemple
```
'20160131':convDate('YYYYMMDD', 'L')      // Sortie "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Sortie "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Sortie "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Sortie "Sunday"
1410715640:convDate('X', 'LLLL')          // Sortie "Sunday, September 14, 2014 7:27 PM"
```

##### Résultat
La sortie est la chaîne de date convertie.


#### 8. Modèles de format de date
Description des formats de date courants (référez-vous aux explications de DayJS) :
- `X` : Horodatage Unix (secondes), ex: 1360013296
- `x` : Horodatage Unix en millisecondes, ex: 1360013296123
- `YY` : Année sur deux chiffres, ex: 18
- `YYYY` : Année sur quatre chiffres, ex: 2018
- `M`, `MM`, `MMM`, `MMMM` : Mois (chiffre, deux chiffres, abrégé, nom complet)
- `D`, `DD` : Jour (chiffre, deux chiffres)
- `d`, `dd`, `ddd`, `dddd` : Semaine (chiffre, minimal, abrégé, nom complet)
- `H`, `HH`, `h`, `hh` : Heure (format 24h ou 12h)
- `m`, `mm` : Minute
- `s`, `ss` : Seconde
- `SSS` : Milliseconde (3 chiffres)
- `Z`, `ZZ` : Décalage UTC, ex: +05:00 ou +0500
- `A`, `a` : AM/PM
- `Q` : Trimestre (1-4)
- `Do` : Jour avec suffixe ordinal, ex: 1st, 2nd, …
- Pour d'autres formats, veuillez consulter la documentation complète.  
  De plus, il existe des formats localisés basés sur la langue : comme `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.