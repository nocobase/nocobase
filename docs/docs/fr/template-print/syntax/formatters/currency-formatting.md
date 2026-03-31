:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage de devise

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explication de la syntaxe
Permet de formater un nombre représentant une devise et de spécifier le nombre de décimales ou un format de sortie particulier.  
Paramètres :
- precisionOrFormat : Un paramètre optionnel qui peut être soit un nombre (pour spécifier le nombre de décimales), soit un identifiant de format :
  - Un entier : modifie la précision décimale par défaut.
  - `'M'` : affiche uniquement le nom principal de la devise.
  - `'L'` : affiche le nombre accompagné du symbole de la devise (par défaut).
  - `'LL'` : affiche le nombre accompagné du nom principal de la devise.
- targetCurrency : Optionnel ; le code de la devise cible (en majuscules, par exemple USD, EUR) qui remplacera les paramètres globaux.

##### Exemple
```
// Environnement d'exemple : options de l'API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Affiche "$2,000.91"
'1000.456':formatC('M')    // Affiche "dollars"
'1':formatC('M')           // Affiche "dollar"
'1000':formatC('L')        // Affiche "$2,000.00"
'1000':formatC('LL')       // Affiche "2,000.00 dollars"

// Exemple en français (lorsque les paramètres d'environnement sont différents) :
'1000.456':formatC()      // Affiche "2 000,91 ..."  
'1000.456':formatC()      // Lorsque les devises source et cible sont identiques, affiche "1 000,46 €"
```

##### Résultat
Le résultat affiché dépend des options de l'API et des paramètres de taux de change.

#### 2. :convCurr(target, source)

##### Explication de la syntaxe
Convertit un nombre d'une devise à une autre. Le taux de change peut être transmis via les options de l'API ou défini globalement.  
Si aucun paramètre n'est spécifié, la conversion est automatiquement effectuée de `options.currencySource` vers `options.currencyTarget`.  
Paramètres :
- target : Optionnel ; le code de la devise cible (par défaut, `options.currencyTarget`).
- source : Optionnel ; le code de la devise source (par défaut, `options.currencySource`).

##### Exemple
```
// Environnement d'exemple : options de l'API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Affiche 20
1000:convCurr()            // Affiche 2000
1000:convCurr('EUR')        // Affiche 1000
1000:convCurr('USD')        // Affiche 2000
1000:convCurr('USD', 'USD') // Affiche 1000
```

##### Résultat
Le résultat est la valeur de la devise convertie.