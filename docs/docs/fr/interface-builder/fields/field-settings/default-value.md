:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Valeurs par défaut

## Introduction

Une valeur par défaut est la valeur initiale d'un champ lors de la création d'un nouvel enregistrement. Vous pouvez définir une valeur par défaut pour un champ lors de sa configuration dans une **collection**, ou la spécifier pour un champ dans un bloc de formulaire d'ajout. Elle peut être configurée comme une constante ou une variable.

## Où définir les valeurs par défaut

### Champs de la collection

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Champs dans un formulaire d'ajout

La plupart des champs d'un formulaire d'ajout permettent de définir une valeur par défaut.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Ajout dans un sous-formulaire

Les sous-données ajoutées via un champ de sous-formulaire, que ce soit dans un formulaire d'ajout ou d'édition, auront une valeur par défaut.

Ajouter un nouvel élément dans un sous-formulaire
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Lors de l'édition de données existantes, un champ vide ne sera pas rempli avec la valeur par défaut. Seules les données nouvellement ajoutées seront renseignées avec la valeur par défaut.

### Valeurs par défaut pour les champs de relation

Seules les relations de type **Plusieurs-à-un** et **Plusieurs-à-plusieurs** ont des valeurs par défaut lorsqu'elles utilisent des composants de sélection (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variables de valeurs par défaut

### Quelles variables sont disponibles

- Utilisateur actuel ;
- Enregistrement actuel ; ceci s'applique uniquement aux enregistrements existants ;
- Formulaire actuel, idéalement ne listant que les champs du formulaire ;
- Objet actuel, un concept au sein des sous-formulaires (l'objet de données pour chaque ligne du sous-formulaire) ;
- Paramètres d'URL
Pour plus d'informations sur les variables, consultez [Variables](/interface-builder/variables)

### Variables de valeurs par défaut des champs

Elles sont divisées en deux catégories : les champs sans relation et les champs de relation.

#### Variables de valeurs par défaut des champs de relation

- L'objet variable doit être un enregistrement de **collection** ;
- Il doit s'agir d'une **collection** dans la chaîne d'héritage, qui peut être la **collection** actuelle ou une **collection** parente/enfant ;
- La variable "Enregistrements sélectionnés du tableau" n'est disponible que pour les champs de relation "Plusieurs-à-plusieurs" et "Un-à-plusieurs/Plusieurs-à-un" ;
- **Pour les scénarios multi-niveaux, il est nécessaire d'aplatir et de dédupliquer.**

```typescript
// Enregistrements sélectionnés du tableau :
[{id:1},{id:2},{id:3},{id:4}]

// Enregistrements sélectionnés du tableau/vers-un :
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Aplatir et dédupliquer
[{id: 2}, {id: 3}]

// Enregistrements sélectionnés du tableau/vers-plusieurs :
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Aplatir
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variables de valeurs par défaut sans relation

- Les types doivent être cohérents ou compatibles, par exemple, les chaînes de caractères sont compatibles avec les nombres, et tous les objets qui fournissent une méthode `toString` ;
- Le champ JSON est particulier et peut stocker n'importe quel type de données ;

### Niveau de champ (Champs optionnels)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Variables de valeurs par défaut sans relation
  - Lors de la sélection de champs multi-niveaux, cela est limité aux relations "vers-un" et ne prend pas en charge les relations "vers-plusieurs" ;
  - Le champ JSON est particulier et peut être illimité ;

- Variables de valeurs par défaut des relations
  - `hasOne`, ne prend en charge que les relations "vers-un" ;
  - `hasMany`, prend en charge les relations "vers-un" (conversion interne) et "vers-plusieurs" ;
  - `belongsToMany`, prend en charge les relations "vers-un" (conversion interne) et "vers-plusieurs" ;
  - `belongsTo`, généralement pour les relations "vers-un", mais lorsque la relation parente est `hasMany`, il prend également en charge les relations "vers-plusieurs" (car `hasMany`/`belongsTo` est essentiellement une relation plusieurs-à-plusieurs) ;

## Cas particuliers

### La relation "Plusieurs-à-plusieurs" est équivalente à une combinaison "Un-à-plusieurs/Plusieurs-à-un"

Modèle

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Pourquoi les relations Un-à-un et Un-à-plusieurs n'ont-elles pas de valeurs par défaut ?

Par exemple, dans une relation A.B, si `b1` est associé à `a1`, il ne peut pas être associé à `a2`. Si `b1` devient associé à `a2`, son association avec `a1` sera supprimée. Dans ce cas, les données ne sont pas partagées, alors que la valeur par défaut est un mécanisme de partage (tous peuvent être associés). Par conséquent, les relations Un-à-un et Un-à-plusieurs ne peuvent pas avoir de valeurs par défaut.

### Pourquoi les sous-formulaires ou sous-tableaux Plusieurs-à-un et Plusieurs-à-plusieurs ne peuvent-ils pas avoir de valeurs par défaut ?

Parce que l'objectif principal des sous-formulaires et des sous-tableaux est d'éditer directement les données de relation (y compris l'ajout et la suppression), tandis que la valeur par défaut de la relation est un mécanisme de partage où tous peuvent être associés, mais les données de relation ne peuvent pas être modifiées. Par conséquent, il n'est pas approprié de fournir des valeurs par défaut dans ce scénario.

De plus, les sous-formulaires ou sous-tableaux ont des sous-champs, et il serait difficile de déterminer si la valeur par défaut d'un sous-formulaire ou d'un sous-tableau est une valeur par défaut de ligne ou de colonne.

Compte tenu de tous les facteurs, il est plus approprié que les sous-formulaires ou sous-tableaux ne puissent pas avoir de valeurs par défaut définies directement, quel que soit le type de relation.