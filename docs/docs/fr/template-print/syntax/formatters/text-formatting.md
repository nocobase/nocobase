:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage de texte

Cette section présente les différents formateurs disponibles pour les données textuelles. Nous allons détailler la syntaxe, les exemples et les résultats de chaque formateur.

#### 1. :lowerCase

##### Explication de la syntaxe
Convertit toutes les lettres en minuscules.

##### Exemple
```
'My Car':lowerCase()   // Renvoie "my car"
'my car':lowerCase()   // Renvoie "my car"
null:lowerCase()       // Renvoie null
1203:lowerCase()       // Renvoie 1203
```

##### Résultat
Chaque exemple renvoie le résultat indiqué dans les commentaires.

#### 2. :upperCase

##### Explication de la syntaxe
Convertit toutes les lettres en majuscules.

##### Exemple
```
'My Car':upperCase()   // Renvoie "MY CAR"
'my car':upperCase()   // Renvoie "MY CAR"
null:upperCase()       // Renvoie null
1203:upperCase()       // Renvoie 1203
```

##### Résultat
Chaque exemple renvoie le résultat indiqué dans les commentaires.

#### 3. :ucFirst

##### Explication de la syntaxe
Met en majuscule uniquement la première lettre de la chaîne de caractères, en laissant le reste inchangé.

##### Exemple
```
'My Car':ucFirst()     // Renvoie "My Car"
'my car':ucFirst()     // Renvoie "My car"
null:ucFirst()         // Renvoie null
undefined:ucFirst()    // Renvoie undefined
1203:ucFirst()         // Renvoie 1203
```

##### Résultat
Le résultat est celui décrit dans les commentaires.

#### 4. :ucWords

##### Explication de la syntaxe
Met en majuscule la première lettre de chaque mot de la chaîne de caractères.

##### Exemple
```
'my car':ucWords()     // Renvoie "My Car"
'My cAR':ucWords()     // Renvoie "My CAR"
null:ucWords()         // Renvoie null
undefined:ucWords()    // Renvoie undefined
1203:ucWords()         // Renvoie 1203
```

##### Résultat
Le résultat est celui indiqué dans les exemples.

#### 5. :print(message)

##### Explication de la syntaxe
Renvoie toujours le message spécifié, quelle que soit la donnée d'origine. Il est utile comme formateur de secours.  
Paramètre :
- **message** : Le texte à afficher.

##### Exemple
```
'My Car':print('hello!')   // Renvoie "hello!"
'my car':print('hello!')   // Renvoie "hello!"
null:print('hello!')       // Renvoie "hello!"
1203:print('hello!')       // Renvoie "hello!"
```

##### Résultat
Renvoie la chaîne de caractères "hello!" dans tous les cas.

#### 6. :printJSON

##### Explication de la syntaxe
Convertit un objet ou un tableau en une chaîne de caractères au format JSON.

##### Exemple
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Renvoie "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Renvoie ""my car""
```

##### Résultat
Le résultat est la chaîne de caractères au format JSON des données fournies.

#### 7. :unaccent

##### Explication de la syntaxe
Supprime les signes diacritiques (accents, cédilles, etc.) du texte, le convertissant en un format sans accent.

##### Exemple
```
'crÃ¨me brulÃ©e':unaccent()   // Renvoie "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Renvoie "CREME BRULEE"
'Ãªtre':unaccent()           // Renvoie "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Renvoie "euieea"
```

##### Résultat
Tous les exemples renvoient le texte sans accents.

#### 8. :convCRLF

##### Explication de la syntaxe
Convertit les caractères de retour chariot et de nouvelle ligne (`\r\n` ou `\n`) en balises de saut de ligne spécifiques au document. Ceci est utile pour des formats tels que DOCX, PPTX, ODT, ODP et ODS.  
**Remarque** : Lorsque vous utilisez `:html` avant `:convCRLF`, `\r\n` est converti en balise `<br>`.

##### Exemple
```
// Pour le format ODT :
'my blue 
 car':convCRLF()    // Renvoie "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Renvoie "my blue <text:line-break/> car"

// Pour le format DOCX :
'my blue 
 car':convCRLF()    // Renvoie "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Renvoie "my blue </w:t><w:br/><w:t> car"
```

##### Résultat
Le résultat affiche les marqueurs de saut de ligne appropriés au format du document cible.

#### 9. :substr(begin, end, wordMode)

##### Explication de la syntaxe
Effectue une opération de découpe (substring) sur une chaîne de caractères, en commençant à l'index `begin` (basé sur 0) et en se terminant juste avant l'index `end`.  
Un paramètre optionnel `wordMode` (booléen ou `last`) permet de contrôler si les mots doivent rester entiers, sans être coupés au milieu.

##### Exemple
```
'foobar':substr(0, 3)            // Renvoie "foo"
'foobar':substr(1)               // Renvoie "oobar"
'foobar':substr(-2)              // Renvoie "ar"
'foobar':substr(2, -1)           // Renvoie "oba"
'abcd efg hijklm':substr(0, 11, true)  // Renvoie "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Renvoie "abcd efg "
```

##### Résultat
Le résultat est le fragment de chaîne de caractères extrait selon les paramètres.

#### 10. :split(delimiter)

##### Explication de la syntaxe
Divise une chaîne de caractères en un tableau en utilisant le délimiteur spécifié.  
Paramètre :
- **delimiter** : La chaîne de caractères servant de délimiteur.

##### Exemple
```
'abcdefc12':split('c')    // Renvoie ["ab", "def", "12"]
1222.1:split('.')         // Renvoie ["1222", "1"]
'ab/cd/ef':split('/')      // Renvoie ["ab", "cd", "ef"]
```

##### Résultat
Le résultat est un tableau divisé par le délimiteur donné.

#### 11. :padl(targetLength, padString)

##### Explication de la syntaxe
Complète le côté gauche d'une chaîne de caractères avec un caractère spécifié jusqu'à ce que la longueur finale de la chaîne atteigne `targetLength`.  
Si la longueur cible est inférieure à la longueur de la chaîne d'origine, la chaîne d'origine est renvoyée.  
Paramètres :
- **targetLength** : La longueur totale souhaitée.
- **padString** : La chaîne de caractères utilisée pour le remplissage (par défaut, un espace).

##### Exemple
```
'abc':padl(10)              // Renvoie "       abc"
'abc':padl(10, 'foo')       // Renvoie "foofoofabc"
'abc':padl(6, '123465')     // Renvoie "123abc"
'abc':padl(8, '0')          // Renvoie "00000abc"
'abc':padl(1)               // Renvoie "abc"
```

##### Résultat
Chaque exemple renvoie la chaîne de caractères complétée sur la gauche.

#### 12. :padr(targetLength, padString)

##### Explication de la syntaxe
Complète le côté droit d'une chaîne de caractères avec un caractère spécifié jusqu'à ce que la longueur finale de la chaîne atteigne `targetLength`.  
Les paramètres sont les mêmes que pour `:padl`.

##### Exemple
```
'abc':padr(10)              // Renvoie "abc       "
'abc':padr(10, 'foo')       // Renvoie "abcfoofoof"
'abc':padr(6, '123465')     // Renvoie "abc123"
'abc':padr(8, '0')          // Renvoie "abc00000"
'abc':padr(1)               // Renvoie "abc"
```

##### Résultat
Le résultat est la chaîne de caractères complétée sur la droite.

#### 13. :ellipsis(maximum)

##### Explication de la syntaxe
Si le texte dépasse le nombre de caractères spécifié, des points de suspension ("...") sont ajoutés à la fin.  
Paramètre :
- **maximum** : Le nombre maximal de caractères autorisés.

##### Exemple
```
'abcdef':ellipsis(3)      // Renvoie "abc..."
'abcdef':ellipsis(6)      // Renvoie "abcdef"
'abcdef':ellipsis(10)     // Renvoie "abcdef"
```

##### Résultat
Les exemples montrent le texte tronqué et complété par des points de suspension si nécessaire.

#### 14. :prepend(textToPrepend)

##### Explication de la syntaxe
Ajoute le texte spécifié au début de la chaîne de caractères.  
Paramètre :
- **textToPrepend** : Le texte à ajouter en préfixe.

##### Exemple
```
'abcdef':prepend('123')     // Renvoie "123abcdef"
```

##### Résultat
Le résultat est la chaîne de caractères avec le préfixe spécifié.

#### 15. :append(textToAppend)

##### Explication de la syntaxe
Ajoute le texte spécifié à la fin de la chaîne de caractères.  
Paramètre :
- **textToAppend** : Le texte à ajouter en suffixe.

##### Exemple
```
'abcdef':append('123')      // Renvoie "abcdef123"
```

##### Résultat
Le résultat est la chaîne de caractères avec le suffixe spécifié.

#### 16. :replace(oldText, newText)

##### Explication de la syntaxe
Remplace toutes les occurrences de `oldText` dans le texte par `newText`.  
Paramètres :
- **oldText** : Le texte à remplacer.
- **newText** : Le nouveau texte de remplacement.  
  **Remarque** : Si `newText` est `null`, cela signifie que le texte correspondant doit être supprimé.

##### Exemple
```
'abcdef abcde':replace('cd', 'OK')    // Renvoie "abOKef abOKe"
'abcdef abcde':replace('cd')          // Renvoie "abef abe"
'abcdef abcde':replace('cd', null)      // Renvoie "abef abe"
'abcdef abcde':replace('cd', 1000)      // Renvoie "ab1000ef ab1000e"
```

##### Résultat
Le résultat est la chaîne de caractères après le remplacement des segments spécifiés.

#### 17. :len

##### Explication de la syntaxe
Renvoie la longueur d'une chaîne de caractères ou d'un tableau.

##### Exemple
```
'Hello World':len()     // Renvoie 11
'':len()                // Renvoie 0
[1,2,3,4,5]:len()       // Renvoie 5
[1,'Hello']:len()       // Renvoie 2
```

##### Résultat
Renvoie la valeur de longueur correspondante.

#### 18. :t

##### Explication de la syntaxe
Traduit le texte en utilisant un dictionnaire de traduction.  
Les exemples et les résultats dépendent de la configuration réelle du dictionnaire de traduction.

#### 19. :preserveCharRef

##### Explication de la syntaxe
Par défaut, certains caractères illégaux en XML (tels que `&`, `>`, `<`, etc.) sont supprimés. Ce formateur permet de conserver les références de caractères (par exemple, `&#xa7;` reste inchangé) et est adapté aux scénarios spécifiques de génération XML.  
Les exemples et les résultats dépendent du cas d'utilisation spécifique.