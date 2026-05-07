:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/template-print/syntax/formatters/time-interval-formatting).
:::

### Formatage de l'intervalle de temps

#### 1. :formatI(patternOut, patternIn)

##### Explication de la syntaxe
Formate la durée ou l'intervalle, les formats de sortie pris en charge incluent :
- `human+`, `human` (adapté à un affichage convivial)
- ainsi que les unités telles que `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (ou leurs abréviations).

Paramètres :
- patternOut : format de sortie (par exemple `'second'`, `'human+'`, etc.)
- patternIn : facultatif, unité d'entrée (par exemple `'milliseconds'`, `'s'`, etc.)

##### Exemple
```
2000:formatI('second')       // Sortie 2
2000:formatI('seconds')      // Sortie 2
2000:formatI('s')            // Sortie 2
3600000:formatI('minute')    // Sortie 60
3600000:formatI('hour')      // Sortie 1
2419200000:formatI('days')   // Sortie 28

// Affichage convivial :
2000:formatI('human')        // Sortie "a few seconds"
2000:formatI('human+')       // Sortie "in a few seconds"
-2000:formatI('human+')      // Sortie "a few seconds ago"

// Exemple de conversion d'unité :
60:formatI('ms', 'minute')   // Sortie 3600000
4:formatI('ms', 'weeks')      // Sortie 2419200000
'P1M':formatI('ms')          // Sortie 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Sortie 10296.085
```

##### Résultat
Le résultat de la sortie est affiché en tant que durée ou intervalle correspondant selon la valeur d'entrée et la conversion d'unité.