:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/template-print/syntax/formatters/currency-formatting).
:::

### Formatage de devise

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explication de la syntaxe
Formate un nombre de devise, vous pouvez spécifier le nombre de décimales ou un format de sortie spécifique.  
Paramètres :
- precisionOrFormat : Paramètre optionnel, peut être soit un nombre (spécifiant le nombre de décimales), soit un identifiant de format spécifique :
  - Entier : modifie la précision décimale par défaut
  - `'M'` : affiche uniquement le nom principal de la devise
  - `'L'` : affiche le nombre accompagné du symbole de la devise (par défaut)
  - `'LL'` : affiche le nombre accompagné du nom principal de la devise
- targetCurrency : Optionnel, code de la devise cible (en majuscules, ex. USD, EUR), écrasera les paramètres globaux

##### Exemple
```
'1000.456':formatC()      // Sortie "$2,000.91"
'1000.456':formatC('M')    // Sortie "dollars"
'1':formatC('M')           // Sortie "dollar"
'1000':formatC('L')        // Sortie "$2,000.00"
'1000':formatC('LL')       // Sortie "2,000.00 dollars"
```

##### Résultat
Le résultat de la sortie dépend des options de l'API et des paramètres de taux de change.


#### 2. :convCurr(target, source)

##### Explication de la syntaxe
Convertit un nombre d'une devise à une autre. Le taux de change peut être transmis via les options de l'API ou défini globalement.  
Si aucun paramètre n'est spécifié, la conversion s'effectue automatiquement de `options.currencySource` vers `options.currencyTarget`.  
Paramètres :
- target : Optionnel, code de la devise cible (par défaut égal à `options.currencyTarget`)
- source : Optionnel, code de la devise source (par défaut égal à `options.currencySource`)

##### Exemple
```
10:convCurr()              // Sortie 20
1000:convCurr()            // Sortie 2000
1000:convCurr('EUR')        // Sortie 1000
1000:convCurr('USD')        // Sortie 2000
1000:convCurr('USD', 'USD') // Sortie 1000
```

##### Résultat
La sortie est la valeur numérique de la devise convertie.