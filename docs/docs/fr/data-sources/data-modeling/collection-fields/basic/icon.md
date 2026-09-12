---
title: "Icône"
description: "Le champ Icône sert à enregistrer le nom ou la configuration d’une icône, et convient aux indicateurs visuels tels que les catégories, les menus et les états."
keywords: "icône,icon,champ,NocoBase"
---

# Icône

## Présentation

Dans NocoBase, **l’icône (Icon)** sert à enregistrer un identifiant d’icône.

Le champ Icône convient pour attribuer un indicateur visuel aux catégories, aux menus, aux états et aux points d’entrée. Il enregistre la valeur de l’icône, qui est rendue par le composant d’icône lors de l’affichage de la page.

Pour téléverser une image réelle, choisissez [Pièce jointe](../media/field-attachment.md). Si vous souhaitez uniquement enregistrer une description de l’icône, choisissez [Texte sur une ligne](./input.md).

## Cas d’utilisation

Le champ Icône convient aux scénarios métier suivants :

- Icônes de menu et de points d’entrée fonctionnels
- Icônes de catégorie et de libellé
- Icônes d’état et de niveau
- Indicateurs visuels dans les tableaux de bord ou les cartes

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Icône » pour créer un champ Icône.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’icône correspond à `icon`, qui détermine la manière de saisir et d’afficher le champ dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Icône de menu », « Icône de catégorie » ou « Icône d’état ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le champ Icône est `string` par défaut. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. Il suffit généralement de configurer le champ comme obligatoire. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez sa nomenclature avant la création afin d’éviter des coûts d’ajustement de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Icône est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `icon`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | Le mode édition utilise un composant de sélection d’icône. |
| Filtrage | N’est généralement pas utilisé comme critère de filtrage principal. |
| Tri | N’est généralement pas utilisé pour le tri. |
| Validation | Prend en charge les validations de base, comme le caractère obligatoire. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Icône. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte les modes de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de l’ajout d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Icône. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en lot.

Lors de la suppression d’un champ Icône créé dans la base de données principale, la colonne réelle correspondante de la base de données et les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant toute suppression, vérifiez que le champ n’est plus référencé par des configurations métier.

:::

## Utiliser dans la configuration des pages

Le champ Icône convient pour fournir des indications visuelles dans les listes, les cartes et les vues détaillées.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une icône. |
| Bloc de détails | Afficher une icône. |
| Liste ou carte | Servir d’indicateur visuel pour une catégorie, un état ou un point d’entrée. |
| Autorisations et workflows | N’est généralement pas utilisé comme champ de condition essentiel. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Couleur](./color.md) — Enregistrer un indicateur de couleur
- [Pièce jointe](../media/field-attachment.md) — Téléverser des images ou des fichiers
