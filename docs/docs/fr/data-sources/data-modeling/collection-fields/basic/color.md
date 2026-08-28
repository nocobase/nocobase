---
title: "Couleur"
description: "Le champ Couleur sert à enregistrer des valeurs de couleur, adaptées aux statuts, catégories, étiquettes et configurations d’affichage."
keywords: "couleur,color,champ,NocoBase"
---

# Couleur

## Introduction

Dans NocoBase, **Couleur (Color)** sert à enregistrer des valeurs de couleur.

Le champ Couleur convient pour enregistrer les couleurs des catégories, étiquettes, statuts, graphiques ou configurations d’affichage. Il enregistre généralement des valeurs de couleur hexadécimales ou dans un format pris en charge par le composant.

Si la couleur fait simplement partie d’un champ d’options, vous pouvez la configurer directement dans le champ d’options, sans nécessairement créer un champ Couleur distinct.

## Cas d’utilisation

Le champ Couleur convient aux cas d’utilisation suivants :

- Couleurs des niveaux et des statuts des clients
- Couleurs des étiquettes et des catégories
- Couleurs des séries de graphiques
- Configurations d’affichage des pages ou des cartes

## Création et configuration

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Couleur » pour créer un champ Couleur.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Couleur correspond à `color` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Couleur du statut », « Couleur de l’étiquette » ou « Couleur du graphique ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Par défaut, le champ Couleur est de type `string`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. Il suffit généralement de configurer le champ comme obligatoire. |
| Description | Description du champ. Vous pouvez y indiquer sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez la nomenclature avant la création afin d’éviter des coûts d’ajustement ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Couleur est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `color`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | Le mode édition utilise un sélecteur de couleurs. |
| Filtrage | Il est possible de filtrer par valeur de couleur, mais ce n’est généralement pas un critère de recherche principal. |
| Tri | Le champ n’est généralement pas utilisé pour le tri. |
| Validation | Les validations de base, comme le caractère obligatoire, sont prises en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Couleur. La modification du champ sert principalement à ajuster son affichage et son mode d’utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors de la mise en correspondance. Cette modification affecte les modes de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifier la valeur par défaut lors de l’ajout de nouveaux enregistrements. |
| Validation rules | Oui | Modifier les règles de validation du champ. |
| Description | Oui | Compléter la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Couleur. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Couleur créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Pour un champ synchronisé depuis une base de données ou associé à une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Couleur convient aux scénarios d’affichage et de configuration dans les pages.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une valeur de couleur. |
| Bloc de détails | Afficher une couleur. |
| Liste ou carte | Servir d’indicateur visuel pour un statut, une étiquette ou une catégorie. |
| Graphique | Servir de source pour la configuration des couleurs. |

## Liens associés

- [Champs](../index.md) — Découvrir le rôle, la classification et la logique de mise en correspondance des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Icône](./icon.md) — Enregistrer un identifiant d’icône
- [Sélection unique déroulante](../choices/select.md) — Configurer directement une couleur dans les options
