---
title: "Polygone"
description: "Le champ polygone sert à enregistrer des données spatiales surfaciques telles que des zones, des limites et des périmètres de service."
keywords: "Polygone,Polygon,zone,figure géométrique,NocoBase"
---

# Polygone

## Présentation

Dans NocoBase, le **polygone (Polygon)** sert à enregistrer des zones spatiales surfaciques.

Le champ polygone convient aux secteurs administratifs, zones de livraison, zones commerciales, zones interdites et autres données métier. Associé à un bloc cartographique, il permet d’afficher l’étendue d’une zone.

Si la zone est un simple cercle, choisissez le [cercle](./circle.md). Si vous souhaitez uniquement enregistrer un emplacement, choisissez le [point](./point.md).

## Cas d’utilisation

Le polygone convient notamment aux cas d’utilisation suivants :

- Zones commerciales et zones de livraison
- Zones de service et secteurs administratifs
- Zones interdites et zones à risque
- Limites des périmètres métier sur une carte

## Configuration lors de la création

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Polygone » pour créer un champ polygone.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour un polygone, il correspond à `polygon` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Zone commerciale », « Zone de livraison » ou « Zone à risque ». Il est recommandé d’utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, un champ polygone est de type `polygon`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’a rien saisi. |
| Validation rules | Règles de validation. Il suffit généralement de configurer le champ comme obligatoire. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Après sa création, le nom du champ est référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez le nom avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ polygone est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `polygon`. |
| Default Field type | `polygon`. |
| Field type disponibles | `polygon`. |
| Composant de page | Le mode d’édition utilise un composant de dessin cartographique. |
| Filtrage | Les capacités de filtrage spatial dépendent du plug-in cartographique et des fonctionnalités de la source de données. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations de base, comme le caractère obligatoire, sont prises en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ polygone. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou ses paramètres spécifiques.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ — le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché pour le champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Cette modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ polygone. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ polygone créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées de la base de données. Pour un champ synchronisé depuis une base de données ou issu de la correspondance avec une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ polygone convient à la gestion des zones et à leur affichage sur une carte.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Cas d’utilisation | Utilisation |
| --- | --- |
| Bloc de formulaire | Dessiner les limites d’une zone. |
| Bloc de détails | Afficher l’étendue d’une zone. |
| Bloc cartographique | Afficher une zone surfacique sur la carte. |
| Graphiques et statistiques | Analyser les données métier par zone. |

## Liens associés

- [Champ](../index.md) — découvrir le rôle, les catégories et la logique de correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table standard
- [Point](./point.md) — enregistrer un emplacement
- [Cercle](./circle.md) — enregistrer une zone circulaire
