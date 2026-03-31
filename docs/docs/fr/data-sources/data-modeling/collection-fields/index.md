:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champs de collection

## Types d'interface des champs

NocoBase classe les champs dans les catégories suivantes, du point de vue de leur interface :

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Types de données des champs

Chaque interface de champ possède un type de données par défaut. Par exemple, pour les champs dont l'interface est de type Numérique (Number), le type de données par défaut est `double`, mais il peut également être `float`, `decimal`, etc. Voici les types de données actuellement pris en charge :

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mappage des types de champs

Voici le processus pour ajouter de nouveaux champs à la base de données principale :

1. Sélectionnez le type d'interface.
2. Configurez le type de données facultatif pour l'interface actuelle.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Voici le processus de mappage des champs pour les sources de données externes :

1. Mappez automatiquement le type de données correspondant (type de champ) et le type d'interface utilisateur (interface de champ) en fonction du type de champ de la base de données externe.
2. Modifiez le type de données et le type d'interface pour qu'ils soient plus appropriés, si nécessaire.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)