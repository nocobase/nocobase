---
pkg: "@nocobase/plugin-field-sort"
title: "Champ de tri"
description: "Le champ de tri permet de trier les enregistrements d'une table de données. Il prend en charge le regroupement avant le tri et permet de personnaliser l'ordre d'affichage des enregistrements."
keywords: "champ de tri, champ Sort, tri par groupe, sort, NocoBase"
---

# Champ de tri

## Introduction

Dans NocoBase, le **champ de tri (Sort)** sert à enregistrer la valeur de tri des enregistrements d'une table de données. Il est souvent utilisé pour le tri par glisser-déposer dans des blocs tels que les tableaux et les kanbans.

Le champ de tri prend en charge le tri sans regroupement, ainsi que le regroupement avant le tri. Le tri par groupe convient aux situations où chaque groupe doit être trié indépendamment, par exemple pour classer les étudiants par classe ou les tâches par statut dans un kanban.

:::warning Attention

Comme le champ de tri est un champ de la même table, lors d'un tri par groupe, un même enregistrement ne peut pas apparaître simultanément dans plusieurs groupes.

:::

## Installation

Le champ de tri est fourni par un plug-in intégré et ne nécessite aucune installation distincte.

## Créer un champ de tri

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Tri » pour créer un champ de tri.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Lors de la création d'un champ de tri, NocoBase initialise les valeurs de tri :

- si le tri par groupe n'est pas sélectionné, l'initialisation se base sur le champ de clé primaire et le champ de date de création
- si le tri par groupe est sélectionné, les données sont d'abord regroupées, puis l'initialisation se base sur le champ de clé primaire et le champ de date de création

:::warning Attention

Lors de la création du champ, si l'initialisation des valeurs de tri échoue, le champ de tri ne sera pas créé. Dans une plage donnée, lorsqu'un enregistrement est déplacé de la position A à la position B, les valeurs de tri de tous les enregistrements compris entre A et B sont modifiées ; si l'une de ces modifications échoue, le déplacement échoue et les valeurs de tri des enregistrements concernés ne sont pas modifiées.

:::

### Créer un champ de tri sans regroupement

Voici un exemple de création d'un champ `sort1` qui n'utilise pas le tri par groupe.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Les champs de tri de chaque enregistrement sont initialisés en fonction du champ de clé primaire et du champ de date de création.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Créer un champ de tri par groupe

Voici un exemple de création d'un champ `sort2` basé sur le regroupement `Class ID`.

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

À ce stade, tous les enregistrements de la table de données sont d'abord regroupés selon Class ID, puis les champs de tri sont initialisés.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Tri par glisser-déposer

Le champ de tri est principalement utilisé pour trier par glisser-déposer les enregistrements de différents blocs. Les blocs prenant actuellement en charge le tri par glisser-déposer sont les tableaux et les kanbans.

:::warning Attention

- L'utilisation d'un même champ de tri dans plusieurs blocs peut perturber le tri existant
- Le champ utilisé pour le tri par glisser-déposer dans un tableau ne peut pas être un champ de tri avec des règles de regroupement
- Dans un bloc de tableau de relation un-à-plusieurs, la clé étrangère peut être utilisée comme regroupement
- Actuellement, seuls les blocs kanban prennent en charge le tri par glisser-déposer avec regroupement

:::

### Tri par glisser-déposer des lignes d'un tableau

Un bloc de tableau peut utiliser un champ de tri pour réorganiser les enregistrements par glisser-déposer.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Un bloc de tableau de relation peut également utiliser un champ de tri pour trier les enregistrements par glisser-déposer.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Tri par glisser-déposer dans un bloc de tableau de relation"></video>

:::warning Attention

Dans un bloc de relation un-à-plusieurs, si un champ de tri sans regroupement est sélectionné, tous les enregistrements peuvent participer au tri ; si les enregistrements sont d'abord regroupés par clé étrangère puis triés, la règle de tri ne s'applique qu'aux données du groupe actuel. Le résultat final peut sembler identique, mais la portée des enregistrements participant au tri est différente.

:::

### Tri par glisser-déposer des cartes d'un kanban

Un bloc kanban peut utiliser un champ de tri pour réorganiser les cartes par glisser-déposer.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Explication des règles de tri

### Déplacement entre des enregistrements non regroupés

Supposons qu'un ensemble de données se présente comme suit :

```text
[1,2,3,4,5,6,7,8,9]
```

Lorsque 5 est déplacé vers la position de 3, seuls les numéros de 3, 4 et 5 changent. 5 occupe la position de 3, tandis que 3 et 4 reculent chacun d'une position.

```text
[1,2,5,3,4,6,7,8,9]
```

Supposons ensuite que 6 soit déplacé vers l'arrière, à la position de 8 : 6 occupe la position de 8, tandis que 7 et 8 avancent chacun d'une position.

```text
[1,2,5,3,4,7,8,6,9]
```

### Déplacement entre différents groupes

Lors d'un tri par groupe, lorsqu'un enregistrement est déplacé vers un autre groupe, le groupe auquel il appartient change également. Supposons qu'il y ait deux groupes de données :

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Lorsque 1 est déplacé derrière 6, son groupe passe également de A à B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### La modification du tri est indépendante des données affichées dans l'interface

Supposons qu'un ensemble de données se présente comme suit :

```text
[1,2,3,4,5,6,7,8,9]
```

L'interface affiche uniquement :

```text
[1,5,9]
```

Lorsque 1 est déplacé à la position de 9, les positions intermédiaires de 2, 3, 4, 5, 6, 7 et 8 sont toutes modifiées.

```text
[2,3,4,5,6,7,8,9,1]
```

L'interface affiche finalement :

```text
[5,9,1]
```

## Liens associés

- [Champs de table de données](../index.md) — Consulter les explications sur les types de champs et leur mappage
- [Bloc de tableau](../../interface-builder/blocks/data-blocks/table.md) — Utiliser le tri par glisser-déposer dans un tableau
- [Bloc kanban](../../interface-builder/blocks/data-blocks/kanban.md) — Utiliser le tri par glisser-déposer dans un kanban
