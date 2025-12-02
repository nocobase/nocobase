:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Conditions

Les conditions vous permettent de contrôler dynamiquement l'affichage ou le masquage du contenu d'un document en fonction des valeurs de vos données. Nous proposons trois méthodes principales pour définir ces conditions :

- **Conditions en ligne** : Elles permettent d'afficher directement du texte (ou de le remplacer par un autre).
- **Blocs conditionnels** : Pour afficher ou masquer une section entière du document, comme plusieurs balises, paragraphes, tableaux, etc.
- **Conditions intelligentes** : Elles permettent de supprimer ou de conserver directement des éléments ciblés (comme des lignes, des paragraphes, des images, etc.) à l'aide d'une seule balise, offrant une syntaxe plus concise.

Toutes les conditions commencent par un formateur d'évaluation logique (par exemple, `ifEQ`, `ifGT`, etc.), suivi de formateurs d'action (tels que `show`, `elseShow`, `drop`, `keep`, etc.).

### Aperçu

Les opérateurs logiques et les formateurs d'action pris en charge dans les conditions incluent :

- **Opérateurs logiques**
  - **ifEQ(value)** : Vérifie si la donnée est égale à la valeur spécifiée.
  - **ifNE(value)** : Vérifie si la donnée est différente de la valeur spécifiée.
  - **ifGT(value)** : Vérifie si la donnée est supérieure à la valeur spécifiée.
  - **ifGTE(value)** : Vérifie si la donnée est supérieure ou égale à la valeur spécifiée.
  - **ifLT(value)** : Vérifie si la donnée est inférieure à la valeur spécifiée.
  - **ifLTE(value)** : Vérifie si la donnée est inférieure ou égale à la valeur spécifiée.
  - **ifIN(value)** : Vérifie si la donnée est contenue dans un tableau ou une chaîne de caractères.
  - **ifNIN(value)** : Vérifie si la donnée n'est pas contenue dans un tableau ou une chaîne de caractères.
  - **ifEM()** : Vérifie si la donnée est vide (par exemple, `null`, `undefined`, une chaîne vide, un tableau vide ou un objet vide).
  - **ifNEM()** : Vérifie si la donnée n'est pas vide.
  - **ifTE(type)** : Vérifie si le type de la donnée est égal au type spécifié (par exemple, `"string"`, `"number"`, `"boolean"`, etc.).
  - **and(value)** : Opérateur logique « et », utilisé pour connecter plusieurs conditions.
  - **or(value)** : Opérateur logique « ou », utilisé pour connecter plusieurs conditions.

- **Formateurs d'action**
  - **:show(text) / :elseShow(text)** : Utilisés dans les conditions en ligne pour afficher directement le texte spécifié.
  - **:hideBegin / :hideEnd** et **:showBegin / :showEnd** : Utilisés dans les blocs conditionnels pour masquer ou afficher des sections du document.
  - **:drop(element) / :keep(element)** : Utilisés dans les conditions intelligentes pour supprimer ou conserver des éléments de document spécifiés.

Les sections suivantes présentent la syntaxe détaillée, des exemples et les résultats pour chaque utilisation.

### Conditions en ligne

#### 1. :show(text) / :elseShow(text)

##### Syntaxe
```
{donnée:condition:show(texte)}
{donnée:condition:show(texte):elseShow(texte alternatif)}
```

##### Exemple
Supposons que les données soient :
```json
{
  "val2": 2,
  "val5": 5
}
```
Le modèle est le suivant :
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Résultat
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Conditions multiples)

##### Syntaxe
Utilisez des formateurs de condition consécutifs pour construire une structure similaire à un `switch-case` :
```
{donnée:ifEQ(valeur1):show(résultat1):ifEQ(valeur2):show(résultat2):elseShow(résultat par défaut)}
```
Ou réalisez la même chose avec l'opérateur `or` :
```
{donnée:ifEQ(valeur1):show(résultat1):or(donnée):ifEQ(valeur2):show(résultat2):elseShow(résultat par défaut)}
```

##### Exemple
Données :
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Modèle :
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Résultat
```
val1 = A
val2 = B
val3 = C
```

#### 3. Conditions multi-variables

##### Syntaxe
Utilisez les opérateurs logiques `and`/`or` pour tester plusieurs variables :
```
{donnée1:ifEQ(condition1):and(.donnée2):ifEQ(condition2):show(résultat):elseShow(résultat alternatif)}
{donnée1:ifEQ(condition1):or(.donnée2):ifEQ(condition2):show(résultat):elseShow(résultat alternatif)}
```

##### Exemple
Données :
```json
{
  "val2": 2,
  "val5": 5
}
```
Modèle :
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Résultat
```
and = KO
or = OK
```

### Opérateurs logiques et formateurs

Dans les sections suivantes, les formateurs décrits utilisent la syntaxe des conditions en ligne, sous le format suivant :
```
{donnée:formateur(paramètre):show(texte):elseShow(texte alternatif)}
```

#### 1. :and(value)

##### Syntaxe
```
{donnée:ifEQ(valeur):and(nouvelle donnée ou condition):ifGT(autre valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Résultat
Si `d.car` est égal à `'delorean'` ET `d.speed` est supérieur à 80, le résultat est `TravelInTime` ; sinon, le résultat est `StayHere`.

#### 2. :or(value)

##### Syntaxe
```
{donnée:ifEQ(valeur):or(nouvelle donnée ou condition):ifGT(autre valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Résultat
Si `d.car` est égal à `'delorean'` OU `d.speed` est supérieur à 80, le résultat est `TravelInTime` ; sinon, le résultat est `StayHere`.

#### 3. :ifEM()

##### Syntaxe
```
{donnée:ifEM():show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Résultat
Pour `null` ou un tableau vide, le résultat est `Result true` ; sinon, c'est `Result false`.

#### 4. :ifNEM()

##### Syntaxe
```
{donnée:ifNEM():show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Résultat
Pour les données non vides (comme le nombre 0 ou la chaîne `'homer'`), le résultat est `Result true` ; pour les données vides, c'est `Result false`.

#### 5. :ifEQ(value)

##### Syntaxe
```
{donnée:ifEQ(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Résultat
Si la donnée est égale à la valeur spécifiée, le résultat est `Result true` ; sinon, c'est `Result false`.

#### 6. :ifNE(value)

##### Syntaxe
```
{donnée:ifNE(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result false`, tandis que le second donne `Result true`.

#### 7. :ifGT(value)

##### Syntaxe
```
{donnée:ifGT(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result true`, et le second donne `Result false`.

#### 8. :ifGTE(value)

##### Syntaxe
```
{donnée:ifGTE(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result true`, tandis que le second donne `Result false`.

#### 9. :ifLT(value)

##### Syntaxe
```
{donnée:ifLT(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result true`, et le second donne `Result false`.

#### 10. :ifLTE(value)

##### Syntaxe
```
{donnée:ifLTE(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result true`, et le second donne `Result false`.

#### 11. :ifIN(value)

##### Syntaxe
```
{donnée:ifIN(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Résultat
Les deux exemples donnent `Result true` (car la chaîne contient `'is'`, et le tableau contient 2).

#### 12. :ifNIN(value)

##### Syntaxe
```
{donnée:ifNIN(valeur):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result false` (car la chaîne contient `'is'`), et le second donne `Result false` (car le tableau contient 2).

#### 13. :ifTE(type)

##### Syntaxe
```
{donnée:ifTE('type'):show(texte):elseShow(texte alternatif)}
```

##### Exemple
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Résultat
Le premier exemple donne `Result true` (puisque `'homer'` est une chaîne de caractères), et le second donne `Result true` (puisque 10.5 est un nombre).

### Blocs conditionnels

Les blocs conditionnels servent à afficher ou masquer une section d'un document. Ils sont généralement utilisés pour englober plusieurs balises ou un bloc de texte entier.

#### 1. :showBegin / :showEnd

##### Syntaxe
```
{donnée:ifEQ(condition):showBegin}
Contenu du bloc de document
{donnée:showEnd}
```

##### Exemple
Données :
```json
{
  "toBuy": true
}
```
Modèle :
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Résultat
Lorsque la condition est remplie, le contenu intermédiaire est affiché :
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Syntaxe
```
{donnée:ifEQ(condition):hideBegin}
Contenu du bloc de document
{donnée:hideEnd}
```

##### Exemple
Données :
```json
{
  "toBuy": true
}
```
Modèle :
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Résultat
Lorsque la condition est remplie, le contenu intermédiaire est masqué, ce qui donne :
```
Banana
Grapes
```