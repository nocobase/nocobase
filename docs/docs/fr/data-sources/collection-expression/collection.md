---
title: "Table des expressions"
description: "La table des expressions est utilisée pour les calculs d’expressions dynamiques dans les workflows. Elle stocke les règles de calcul et les formules, prend en charge les champs de différents modèles de données comme variables et peut être associée aux données métier."
keywords: "table des expressions, expressions dynamiques, expressions de workflow, règles de calcul, formules, NocoBase"
---

# Table des expressions

## Créer une table modèle « expression »

Avant d’utiliser le nœud de calcul d’expressions dynamiques dans un workflow, vous devez d’abord créer une table modèle « expression » dans l’outil de gestion des tables de données afin d’y stocker différentes expressions :

![Créer une table modèle d’expressions](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Saisir les données des expressions

Créez ensuite un bloc de tableau dans cette table modèle afin d’y ajouter plusieurs formules. Chaque ligne de la table modèle « expression » peut être comprise comme une règle de calcul pour un modèle de données de table spécifique. Les valeurs des champs de différents modèles de données de tables peuvent être utilisées comme variables dans chaque formule, ce qui permet de définir différentes expressions comme règles de calcul. Vous pouvez également utiliser différents moteurs de calcul.

![Saisir les données des expressions](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Remarque}
Après avoir créé les formules, vous devez encore associer les données métier aux formules. Comme il serait fastidieux d’associer directement chaque ligne de données métier à une ligne de données de formule, on utilise généralement une table de métadonnées similaire à une table de catégories, associée à la table des formules selon une relation plusieurs-à-un (ou un-à-un), puis on associe les données métier aux métadonnées de catégorie selon une relation plusieurs-à-un. Ainsi, lors de la création de données métier, il suffit de spécifier les métadonnées de catégorie correspondantes pour pouvoir retrouver et utiliser ultérieurement les données de formule correspondantes via ce chemin d’association.
:::

## Charger les données correspondantes dans le workflow

Prenons comme exemple un événement de table de données : créez un workflow qui se déclenche lors de la création d’une commande et qui doit précharger les données des produits associés à la commande ainsi que les données des expressions associées aux produits :

![Configuration du déclencheur d’événement de table de données](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)