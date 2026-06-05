:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage des nombres

#### 1. :formatN(precision)

##### Explication de la syntaxe
Formate un nombre selon les paramètres de localisation.
Paramètre :
- `precision` : Le nombre de décimales.
  Pour les formats ODS/XLSX, le nombre de décimales affichées est déterminé par l'éditeur de texte ; pour les autres formats, ce paramètre est utilisé.

##### Exemple
```
// Environnement d'exemple : options API { "lang": "en-us" }
'10':formatN()         // Renvoie "10.000"
'1000.456':formatN()   // Renvoie "1,000.456"
```

##### Résultat
Le nombre est renvoyé selon la précision spécifiée et le format de localisation.

#### 2. :round(precision)

##### Explication de la syntaxe
Arrondit le nombre à la précision décimale spécifiée.

##### Exemple
```
10.05123:round(2)      // Renvoie 10.05
1.05:round(1)          // Renvoie 1.1
```

##### Résultat
Le résultat est le nombre arrondi à la précision donnée.

#### 3. :add(value)

##### Explication de la syntaxe
Ajoute la valeur spécifiée au nombre actuel.
Paramètre :
- `value` : La valeur à ajouter.

##### Exemple
```
1000.4:add(2)         // Renvoie 1002.4
'1000.4':add('2')      // Renvoie 1002.4
```

##### Résultat
Le résultat est la somme du nombre actuel et de la valeur spécifiée.

#### 4. :sub(value)

##### Explication de la syntaxe
Soustrait la valeur spécifiée du nombre actuel.
Paramètre :
- `value` : La valeur à soustraire.

##### Exemple
```
1000.4:sub(2)         // Renvoie 998.4
'1000.4':sub('2')      // Renvoie 998.4
```

##### Résultat
Le résultat est le nombre actuel moins la valeur spécifiée.

#### 5. :mul(value)

##### Explication de la syntaxe
Multiplie le nombre actuel par la valeur spécifiée.
Paramètre :
- `value` : Le multiplicateur.

##### Exemple
```
1000.4:mul(2)         // Renvoie 2000.8
'1000.4':mul('2')      // Renvoie 2000.8
```

##### Résultat
Le résultat est le produit du nombre actuel et de la valeur spécifiée.

#### 6. :div(value)

##### Explication de la syntaxe
Divise le nombre actuel par la valeur spécifiée.
Paramètre :
- `value` : Le diviseur.

##### Exemple
```
1000.4:div(2)         // Renvoie 500.2
'1000.4':div('2')      // Renvoie 500.2
```

##### Résultat
Le résultat est la valeur de la division.

#### 7. :mod(value)

##### Explication de la syntaxe
Calcule le modulo (reste) du nombre actuel divisé par la valeur spécifiée.
Paramètre :
- `value` : Le diviseur du modulo.

##### Exemple
```
4:mod(2)              // Renvoie 0
3:mod(2)              // Renvoie 1
```

##### Résultat
Le résultat est le reste de l'opération modulo.

#### 8. :abs

##### Explication de la syntaxe
Renvoie la valeur absolue du nombre.

##### Exemple
```
-10:abs()             // Renvoie 10
-10.54:abs()          // Renvoie 10.54
10.54:abs()           // Renvoie 10.54
'-200':abs()          // Renvoie 200
```

##### Résultat
Le résultat est la valeur absolue du nombre d'entrée.

#### 9. :ceil

##### Explication de la syntaxe
Arrondit le nombre à l'entier le plus petit qui est supérieur ou égal au nombre actuel.

##### Exemple
```
10.05123:ceil()       // Renvoie 11
1.05:ceil()           // Renvoie 2
-1.05:ceil()          // Renvoie -1
```

##### Résultat
Le résultat est le nombre arrondi à l'entier supérieur le plus proche.

#### 10. :floor

##### Explication de la syntaxe
Arrondit le nombre à l'entier le plus grand qui est inférieur ou égal au nombre actuel.

##### Exemple
```
10.05123:floor()      // Renvoie 10
1.05:floor()          // Renvoie 1
-1.05:floor()         // Renvoie -2
```

##### Résultat
Le résultat est le nombre arrondi à l'entier inférieur le plus proche.

#### 11. :int

##### Explication de la syntaxe
Convertit le nombre en un entier (utilisation non recommandée).

##### Exemple et Résultat
Dépend du cas de conversion spécifique.

#### 12. :toEN

##### Explication de la syntaxe
Convertit le nombre au format anglais (utilisant `.` comme séparateur décimal). Utilisation non recommandée.

##### Exemple et Résultat
Dépend du cas de conversion spécifique.

#### 13. :toFixed

##### Explication de la syntaxe
Convertit le nombre en une chaîne de caractères en conservant uniquement le nombre de décimales spécifié. Utilisation non recommandée.

##### Exemple et Résultat
Dépend du cas de conversion spécifique.

#### 14. :toFR

##### Explication de la syntaxe
Convertit le nombre au format français (utilisant `,` comme séparateur décimal). Utilisation non recommandée.

##### Exemple et Résultat
Dépend du cas de conversion spécifique.