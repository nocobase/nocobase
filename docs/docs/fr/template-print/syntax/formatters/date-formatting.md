:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage des dates

#### 1. :formatD(patternOut, patternIn)

##### Explication de la syntaxe
Formate une date en acceptant un modèle de format de sortie (`patternOut`) et un modèle de format d'entrée optionnel (`patternIn`), qui utilise par défaut la norme ISO 8601. Vous pouvez ajuster le fuseau horaire et la langue via les options `options.timezone` et `options.lang`.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Sortie 01/31/2016
'20160131':formatD(LL)     // Sortie January 31, 2016
'20160131':formatD(LLLL)   // Sortie Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Sortie Sunday

// Exemple en français :
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Sortie mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Sortie dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Sortie dimanche 14 septembre 2014 19:27
```

##### Résultat
La sortie est une chaîne de caractères représentant la date formatée selon le modèle spécifié.

#### 2. :addD(amount, unit, patternIn)

##### Explication de la syntaxe
Ajoute une durée spécifiée à une date. Les unités prises en charge sont : `day` (jour), `week` (semaine), `month` (mois), `quarter` (trimestre), `year` (année), `hour` (heure), `minute` (minute), `second` (seconde), `millisecond` (milliseconde).

Paramètres :
- `amount` : La quantité à ajouter.
- `unit` : L'unité de temps (insensible à la casse).
- `patternIn` : Optionnel, le format d'entrée (par défaut ISO8601).

##### Exemple
```
// Environnement d'exemple : options API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Sortie "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Sortie "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Sortie "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Sortie "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Sortie "2016-04-30T00:00:00.000Z"
```

##### Résultat
La sortie est la nouvelle date après l'ajout de la durée spécifiée.

#### 3. :subD(amount, unit, patternIn)

##### Explication de la syntaxe
Soustrait une durée spécifiée d'une date. Les paramètres sont identiques à ceux de `:addD`.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Sortie "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Sortie "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Sortie "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Sortie "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Sortie "2015-10-31T00:00:00.000Z"
```

##### Résultat
La sortie est la nouvelle date après la soustraction de la durée spécifiée.

#### 4. :startOfD(unit, patternIn)

##### Explication de la syntaxe
Définit la date au début de l'unité de temps spécifiée.

Paramètres :
- `unit` : L'unité de temps.
- `patternIn` : Optionnel, le format d'entrée.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Sortie "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Sortie "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Sortie "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Sortie "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Sortie "2016-01-01T00:00:00.000Z"
```

##### Résultat
La sortie est une chaîne de caractères représentant la date définie au début de l'unité spécifiée.

#### 5. :endOfD(unit, patternIn)

##### Explication de la syntaxe
Définit la date à la fin de l'unité de temps spécifiée.

Les paramètres sont identiques à ceux de `:startOfD`.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Sortie "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Sortie "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Sortie "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Sortie "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Sortie "2016-01-31T23:59:59.999Z"
```

##### Résultat
La sortie est une chaîne de caractères représentant la date définie à la fin de l'unité spécifiée.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Explication de la syntaxe
Calcule la différence entre deux dates et l'affiche dans l'unité spécifiée. Les unités de sortie prises en charge sont :
- `day(s)` ou `d` (jour(s))
- `week(s)` ou `w` (semaine(s))
- `quarter(s)` ou `Q` (trimestre(s))
- `month(s)` ou `M` (mois)
- `year(s)` ou `y` (année(s))
- `hour(s)` ou `h` (heure(s))
- `minute(s)` ou `m` (minute(s))
- `second(s)` ou `s` (seconde(s))
- `millisecond(s)` ou `ms` (milliseconde(s), unité par défaut)

Paramètres :
- `toDate` : La date cible.
- `unit` : L'unité de sortie.
- `patternFromDate` : Optionnel, le format de la date de début.
- `patternToDate` : Optionnel, le format de la date cible.

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
La sortie est la différence de temps entre les deux dates, convertie dans l'unité spécifiée.

#### 7. :convDate(patternIn, patternOut)

##### Explication de la syntaxe
Convertit une date d'un format à un autre (utilisation non recommandée).

Paramètres :
- `patternIn` : Le format d'entrée de la date.
- `patternOut` : Le format de sortie de la date.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Sortie "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Sortie "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Sortie "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Sortie "Sunday"
1410715640:convDate('X', 'LLLL')          // Sortie "Sunday, September 14, 2014 7:27 PM"
// Exemple en français :
'20160131':convDate('YYYYMMDD', 'LLLL')   // Sortie "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Sortie "dimanche"
```

##### Résultat
La sortie est une chaîne de caractères représentant la date convertie au format spécifié.

#### 8. Modèles de format de date
Symboles de format de date courants (se référer à la documentation de DayJS) :
- `X` : Horodatage Unix (en secondes), par exemple 1360013296
- `x` : Horodatage Unix en millisecondes, par exemple 1360013296123
- `YY` : Année sur deux chiffres, par exemple 18
- `YYYY` : Année sur quatre chiffres, par exemple 2018
- `M`, `MM`, `MMM`, `MMMM` : Mois (numérique, sur deux chiffres, abrégé, nom complet)
- `D`, `DD` : Jour (numérique, sur deux chiffres)
- `d`, `dd`, `ddd`, `dddd` : Jour de la semaine (numérique, minimal, abrégé, nom complet)
- `H`, `HH`, `h`, `hh` : Heure (format 24 heures ou 12 heures)
- `m`, `mm` : Minute
- `s`, `ss` : Seconde
- `SSS` : Milliseconde (3 chiffres)
- `Z`, `ZZ` : Décalage UTC, par exemple +05:00 ou +0500
- `A`, `a` : AM/PM
- `Q` : Trimestre (1-4)
- `Do` : Jour du mois avec ordinal, par exemple 1er, 2e, ...
- Pour les autres formats, veuillez vous référer à la documentation complète.
  De plus, il existe des formats localisés basés sur la langue, tels que `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.