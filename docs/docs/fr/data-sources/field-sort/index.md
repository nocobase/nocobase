---
pkg: "@nocobase/plugin-field-sort"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Champ de tri

## Introduction

Les champs de tri servent à organiser les enregistrements d'une collection. Ils permettent également de trier les données au sein de groupes.

:::warning
Étant donné qu'un champ de tri fait partie de la même collection, un enregistrement ne peut pas être attribué à plusieurs groupes lors de l'utilisation du tri par groupe.
:::

## Installation

Ce plugin est intégré, aucune installation séparée n'est requise.

## Manuel d'utilisation

### Créer un champ de tri

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Lors de la création de champs de tri, les valeurs de tri sont initialisées :

- Si le tri par groupe n'est pas sélectionné, l'initialisation se base sur le champ de clé primaire et le champ de date de création.
- Si le tri par groupe est sélectionné, les données sont d'abord regroupées, puis l'initialisation se base sur le champ de clé primaire et le champ de date de création.

:::warning{title="Explication de la cohérence transactionnelle"}
- Lors de la création d'un champ, si l'initialisation de la valeur de tri échoue, le champ de tri ne sera pas créé.
- Si un enregistrement est déplacé de la position A à la position B dans une plage donnée, les valeurs de tri de tous les enregistrements entre A et B seront modifiées. Si une partie de cette mise à jour échoue, l'opération de déplacement est annulée et les valeurs de tri des enregistrements concernés ne seront pas modifiées.
:::

#### Exemple 1 : Créer le champ sort1

Le champ sort1 n'est pas groupé.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Les champs de tri de chaque enregistrement seront initialisés en fonction du champ de clé primaire et du champ de date de création :

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Exemple 2 : Créer un champ sort2 basé sur le regroupement par ID de Classe

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

À ce stade, tous les enregistrements de la collection seront d'abord regroupés (par ID de Classe), puis le champ de tri (sort2) sera initialisé. Voici les valeurs initiales de chaque enregistrement :

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Tri par glisser-déposer

Les champs de tri sont principalement utilisés pour le tri par glisser-déposer des enregistrements dans divers blocs. Actuellement, les blocs qui prennent en charge le tri par glisser-déposer sont les tableaux et les tableaux de bord (kanban).

:::warning
- Lorsque le même champ de tri est utilisé pour le tri par glisser-déposer, son utilisation sur plusieurs blocs peut perturber l'ordre existant.
- Le champ utilisé pour le tri par glisser-déposer dans un tableau ne peut pas être un champ de tri avec une règle de regroupement.
  - Exception : Dans un bloc de tableau de relation un-à-plusieurs, la clé étrangère peut servir de groupe.
- Actuellement, seul le bloc de tableau de bord (kanban) prend en charge le tri par glisser-déposer au sein de groupes.
:::

#### Tri par glisser-déposer des lignes de tableau

Bloc tableau

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Bloc de tableau de relation

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Dans un bloc de relation un-à-plusieurs :

- Si un champ de tri non groupé est sélectionné, tous les enregistrements peuvent participer au tri.
- Si les enregistrements sont d'abord regroupés par la clé étrangère, puis triés, la règle de tri n'affectera que les données au sein du groupe actuel.

L'effet final est cohérent, mais le nombre d'enregistrements participant au tri est différent. Pour plus de détails, consultez l'[Explication des règles de tri](#explication-des-règles-de-tri).
:::

#### Tri par glisser-déposer des cartes de tableau de bord

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Explication des règles de tri

#### Déplacement entre éléments non groupés (ou du même groupe)

Supposons que nous ayons un ensemble de données :

```
[1,2,3,4,5,6,7,8,9]
```

Lorsqu'un élément, par exemple 5, est déplacé vers l'avant à la position de 3, seules les positions des éléments 3, 4 et 5 changent. L'élément 5 prend la position de 3, et les éléments 3 et 4 se décalent chacun d'une position vers l'arrière.

```
[1,2,5,3,4,6,7,8,9]
```

Si nous déplaçons ensuite l'élément 6 vers l'arrière à la position de 8, l'élément 6 prend la position de 8, et les éléments 7 et 8 se décalent chacun d'une position vers l'avant.

```
[1,2,5,3,4,7,8,6,9]
```

#### Déplacement d'éléments entre différents groupes

Lors du tri par groupe, si un enregistrement est déplacé vers un autre groupe, son affectation de groupe changera également. Par exemple :

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Lorsque l'élément 1 est déplacé après l'élément 6 (comportement par défaut), son groupe changera également de A à B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Les modifications de tri sont indépendantes des données affichées à l'interface

Par exemple, considérons un ensemble de données :

```
[1,2,3,4,5,6,7,8,9]
```

L'interface n'affiche qu'une vue filtrée :

```
[1,5,9]
```

Lorsque l'élément 1 est déplacé à la position de l'élément 9, les positions de tous les éléments intermédiaires (2, 3, 4, 5, 6, 7, 8) changeront également, même s'ils ne sont pas visibles.

```
[2,3,4,5,6,7,8,9,1]
```

L'interface affiche maintenant le nouvel ordre basé sur les éléments filtrés :

```
[5,9,1]
```