:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Formatage des tableaux

#### 1. :arrayJoin(separator, index, count)

##### Explication de la syntaxe
Permet de joindre un tableau de chaînes de caractères ou de nombres en une seule chaîne.
Paramètres :
- separator : Le délimiteur (la virgule `,` par défaut).
- index : Optionnel, l'indice de départ à partir duquel joindre les éléments.
- count : Optionnel, le nombre d'éléments à joindre à partir de l'indice `index` (peut être négatif pour compter depuis la fin).

##### Exemple
```
['homer','bart','lisa']:arrayJoin()              // Renvoie "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Renvoie "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Renvoie "homerbartlisa"
[10,50]:arrayJoin()                               // Renvoie "10, 50"
[]:arrayJoin()                                    // Renvoie ""
null:arrayJoin()                                  // Renvoie null
{}:arrayJoin()                                    // Renvoie {}
20:arrayJoin()                                    // Renvoie 20
undefined:arrayJoin()                             // Renvoie undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Renvoie "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Renvoie "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Renvoie "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Renvoie "homerbart"
```

##### Résultat
Le résultat est une chaîne de caractères obtenue en joignant les éléments du tableau selon les paramètres spécifiés.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Explication de la syntaxe
Convertit un tableau d'objets en une chaîne de caractères. Cette fonction ne traite pas les objets ou tableaux imbriqués.
Paramètres :
- objSeparator : Le séparateur entre les objets (`, ` par défaut).
- attSeparator : Le séparateur entre les attributs d'objet (`:` par défaut).
- attributes : Optionnel, une liste des attributs d'objet à afficher.

##### Exemple
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Renvoie "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Renvoie "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Renvoie "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Renvoie "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Renvoie "2:homer"

['homer','bart','lisa']:arrayMap()    // Renvoie "homer, bart, lisa"
[10,50]:arrayMap()                    // Renvoie "10, 50"
[]:arrayMap()                         // Renvoie ""
null:arrayMap()                       // Renvoie null
{}:arrayMap()                         // Renvoie {}
20:arrayMap()                         // Renvoie 20
undefined:arrayMap()                  // Renvoie undefined
```

##### Résultat
Le résultat est une chaîne de caractères générée en mappant et en joignant les éléments du tableau, en ignorant le contenu des objets imbriqués.

#### 3. :count(start)

##### Explication de la syntaxe
Compte le numéro de ligne dans un tableau et renvoie le numéro de ligne actuel.
Par exemple :
```
{d[i].id:count()}
```
Quel que soit la valeur de `id`, cette fonction renvoie le numéro de ligne actuel.
À partir de la version v4.0.0, ce formateur a été remplacé en interne par `:cumCount`.

Paramètre :
- start : Optionnel, la valeur de départ pour le comptage.

##### Exemple et Résultat
En pratique, le numéro de ligne affiché suivra l'ordre des éléments du tableau.