---
title: "Groupe de boutons radio"
description: "Le champ Groupe de boutons radio sert à afficher les options directement sur la page et à en sélectionner une."
keywords: "groupe de boutons radio,radio group,champ d’options,NocoBase"
---

# Groupe de boutons radio

## Présentation

Dans NocoBase, le **groupe de boutons radio (Radio group)** permet de sélectionner une valeur parmi plusieurs options et d’afficher directement ces options dans le formulaire.

Le groupe de boutons radio convient lorsque le nombre d’options est limité et que l’on souhaite que l’utilisateur puisse toutes les voir d’un seul coup d’œil. Son fonctionnement est similaire à celui d’une liste déroulante à sélection unique, mais l’interaction sur la page est différente.

Si les options sont nombreuses, utilisez la [liste déroulante à sélection unique](./select.md) pour économiser de l’espace. Pour permettre plusieurs sélections, utilisez le [groupe de cases à cocher](./checkbox-group.md).

## Cas d’utilisation

Le groupe de boutons radio convient notamment aux cas d’utilisation suivants :

- Priorité : faible, moyenne, élevée
- Options étendues pour le sexe, le type ou les réponses oui/non
- Résultat de l’approbation : approuvé, rejeté
- Sélection rapide parmi un petit nombre d’options fixes

## Créer et configurer

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Groupe de boutons radio » pour créer un champ de ce type.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le groupe de boutons radio correspond à `radioGroup` et détermine la manière dont les données sont saisies et affichées sur la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Priorité », « Résultat de l’approbation » ou « Type ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le groupe de boutons radio utilise par défaut `string` et enregistre la valeur de l’option sélectionnée. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur ne remplit pas le champ. |
| Validation rules | Règles de validation. Il est généralement recommandé de rendre le champ obligatoire et de gérer les valeurs disponibles. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez donc la convention de nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Groupe de boutons radio est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `radioGroup`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | Le mode d’édition utilise un groupe de boutons radio. |
| Filtrage | Le filtrage par option est pris en charge. |
| Tri | Le tri par valeur d’option est pris en charge. |
| Validation | La validation du caractère obligatoire et des valeurs autorisées est prise en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Groupe de boutons radio. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant le nom affiché, la description, la valeur par défaut, les règles de validation ou la configuration propre au champ.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. La modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Si le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Groupe de boutons radio. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ Groupe de boutons radio créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Vérifiez avant la suppression que le champ n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le groupe de boutons radio convient à l’affichage direct d’un petit nombre d’options dans un formulaire.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Afficher directement toutes les options et en sélectionner une. |
| Bloc de détails | Afficher l’option sélectionnée. |
| Bloc de filtrage | Filtrer les enregistrements par option. |
| Workflows et autorisations | Participer à l’évaluation de conditions telles que le statut ou le type. |

## Liens connexes

- [Champs](../index.md) — Découvrir le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Liste déroulante à sélection unique](./select.md) — À utiliser lorsque le nombre d’options est important
- [Groupe de cases à cocher](./checkbox-group.md) — Sélectionner plusieurs valeurs
