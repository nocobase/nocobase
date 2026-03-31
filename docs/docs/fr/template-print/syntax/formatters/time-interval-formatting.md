:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage des intervalles de temps

#### 1. :formatI(patternOut, patternIn)

##### Description de la syntaxe
Cette fonction formate une durée ou un intervalle. Les formats de sortie pris en charge incluent :
- `human+` ou `human` (adaptés à un affichage convivial)
- Ainsi que des unités telles que `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (ou leurs abréviations).

Paramètres :
- `patternOut` : Le format de sortie (par exemple, `'second'` ou `'human+'`).
- `patternIn` : (Optionnel) L'unité d'entrée (par exemple, `'milliseconds'` ou `'s'`).

##### Exemple
```
// Environnement d'exemple : options de l'API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Renvoie 2
2000:formatI('seconds')      // Renvoie 2
2000:formatI('s')            // Renvoie 2
3600000:formatI('minute')    // Renvoie 60
3600000:formatI('hour')      // Renvoie 1
2419200000:formatI('days')   // Renvoie 28

// Exemple en français :
2000:formatI('human')        // Renvoie "quelques secondes"
2000:formatI('human+')       // Renvoie "dans quelques secondes"
-2000:formatI('human+')      // Renvoie "il y a quelques secondes"

// Exemple en anglais :
2000:formatI('human')        // Renvoie "a few seconds"
2000:formatI('human+')       // Renvoie "in a few seconds"
-2000:formatI('human+')      // Renvoie "a few seconds ago"

// Exemple de conversion d'unité :
60:formatI('ms', 'minute')   // Renvoie 3600000
4:formatI('ms', 'weeks')      // Renvoie 2419200000
'P1M':formatI('ms')          // Renvoie 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Renvoie 10296.085
```

##### Résultat
Le résultat est affiché sous forme de durée ou d'intervalle correspondant, en fonction de la valeur d'entrée et de la conversion d'unité.