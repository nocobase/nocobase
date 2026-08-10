---
title: "Sélection unique dans une liste déroulante"
description: "Le champ de sélection unique dans une liste déroulante permet de choisir une valeur parmi des options prédéfinies. Il convient aux champs tels que le statut, le niveau ou le type."
keywords: "sélection unique dans une liste déroulante,select,champ d’options,NocoBase"
---

# Sélection unique dans une liste déroulante

## Présentation

Dans NocoBase, la **sélection unique dans une liste déroulante (Select)** permet de choisir une valeur parmi un ensemble d’options.

La sélection unique dans une liste déroulante convient aux champs métier à plage fixe, tels que le statut, le niveau, le type ou la source. Les options peuvent être configurées avec un nom d’affichage, une valeur et une couleur.

Pour sélectionner plusieurs valeurs, choisissez la [sélection multiple dans une liste déroulante](./multiple-select.md). S’il n’y a que les valeurs oui ou non, choisissez la [case à cocher](./checkbox.md).

## Cas d’utilisation

La sélection unique dans une liste déroulante convient notamment aux cas d’utilisation suivants :

- Statut de commande, statut de ticket, statut d’approbation
- Niveau client, source du prospect, priorité
- Type de projet, catégorie d’actif, type de contrat
- Champs pour lesquels une seule valeur peut être sélectionnée dans une plage fixe

## Créer une configuration

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Sélection unique dans une liste déroulante » pour créer un champ de sélection unique dans une liste déroulante.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. La sélection unique dans une liste déroulante correspond à `select` et détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Statut de commande », « Niveau client » ou « Priorité ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les API, les champs relationnels, les autorisations, les workflows et autres références internes. Il n’est généralement plus modifiable après la création. Seuls les lettres, les chiffres et les traits de soulignement sont autorisés, et le nom doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, une sélection unique dans une liste déroulante est de type `string` et enregistre la valeur de l’option sélectionnée. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne remplit pas le champ. |
| Validation rules | Règles de validation. Elles servent généralement à rendre le champ obligatoire et à maintenir les valeurs des options. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez son nom avant la création afin d’éviter les coûts d’ajustement liés à une modification ultérieure de la configuration.

:::

## Caractéristiques du champ

Le comportement par défaut du champ de sélection unique dans une liste déroulante est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `select`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | Le mode édition utilise un sélecteur déroulant. |
| Filtrage | Le filtrage par option est pris en charge. |
| Tri | Le tri par valeur d’option est pris en charge. |
| Validation | La définition du champ comme obligatoire et la restriction aux options disponibles sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ de sélection unique dans une liste déroulante. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la saisie, l’affichage et la validation sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de l’ajout d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ de sélection unique dans une liste déroulante. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs afin de les supprimer en une seule opération.

Lors de la suppression d’un champ de sélection unique dans une liste déroulante créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lorsqu’un champ provient de la synchronisation d’une base de données ou du mappage d’une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utiliser dans la configuration des pages

Le champ de sélection unique dans une liste déroulante convient aux formulaires, aux tableaux, aux tableaux kanban et aux filtres.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Sélectionner une valeur dans la liste déroulante. |
| Bloc de tableau | Afficher l’option sous forme d’étiquette ou de texte. |
| Bloc kanban | Regrouper les éléments par statut, étape ou autre option. |
| Bloc de filtrage | Filtrer rapidement les enregistrements par option. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Sélection multiple dans une liste déroulante](./multiple-select.md) — Sélectionner plusieurs valeurs parmi les options
- [Groupe de boutons radio](./radio-group.md) — Sélectionner une valeur sous forme de groupe de boutons