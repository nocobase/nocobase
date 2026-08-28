---
title: "Sélection multiple déroulante"
description: "Le champ de sélection multiple déroulante permet de sélectionner plusieurs valeurs parmi des options prédéfinies, et convient aux champs tels que les étiquettes, les compétences et les préférences."
keywords: "sélection multiple déroulante,multiple select,étiquettes,champs d'options,NocoBase"
---

# Sélection multiple déroulante

## Présentation

Dans NocoBase, la **sélection multiple déroulante (Multiple select)** permet de sélectionner plusieurs valeurs parmi un ensemble d’options.

La sélection multiple déroulante convient aux champs tels que les étiquettes, les compétences, les préférences et le périmètre d’application. Elle enregistre plusieurs valeurs d’options, généralement affichées sous forme d’étiquettes dans la page.

Si une seule valeur peut être sélectionnée, choisissez la [sélection simple déroulante](./select.md) ou le [groupe de boutons radio](./radio-group.md).

## Cas d’utilisation

La sélection multiple déroulante convient aux scénarios métier suivants :

- Étiquettes client, préférences utilisateur
- Scénarios d’application du produit, capacités de l’appareil
- Points de risque du projet, catégories de problèmes
- Champs permettant de sélectionner plusieurs valeurs fixes

## Créer la configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Sélection multiple déroulante » pour créer un champ de sélection multiple déroulante.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. La sélection multiple déroulante correspond à `multipleSelect` et détermine la manière dont les données sont saisies et affichées dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Étiquettes client », « Scénarios d’application » ou « Catégories de problèmes ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes telles que l’API, les champs de relation, les autorisations et les workflows. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Une sélection multiple déroulante est généralement enregistrée sous forme de tableau ou de JSON, selon la configuration du champ et les capacités de la source de données. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles servent généralement à configurer le caractère obligatoire et la plage des options disponibles. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API après sa création. Vérifiez donc le nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ de sélection multiple déroulante est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `multipleSelect`. |
| Field type par défaut | `array`. |
| Field type disponible | `array`, `json`, selon le mappage réel du champ. |
| Composant de page | En mode édition, un sélecteur déroulant à sélection multiple est utilisé. |
| Filtrage | Permet de filtrer selon la présence d’une option donnée. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Prend en charge les contraintes de champ obligatoire et de plage d’options. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ de sélection multiple déroulante. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ, c’est-à-dire à mapper le champ de la base de données vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. La modification affecte le mode de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables de workflow. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ de sélection multiple déroulante. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs afin de les supprimer par lot.

Lors de la suppression d’un champ de sélection multiple déroulante créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées de la base de données. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer le champ, vérifiez qu’il n’est plus utilisé par des configurations métier.

:::

## Utiliser dans la configuration des pages

Le champ de sélection multiple déroulante convient pour représenter plusieurs étiquettes ou plusieurs options fixes.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner plusieurs valeurs parmi les options. |
| Bloc de tableau | Afficher les options sous forme de plusieurs étiquettes. |
| Bloc de filtrage | Filtrer selon la présence de certaines étiquettes. |
| Workflows et autorisations | Participer aux conditions de vérification, telles que contient ou ne contient pas. |

## Liens associés

- [Champ](../index.md) — Découvrir le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Sélection simple déroulante](./select.md) — Sélectionner une valeur parmi les options
- [Groupe de cases à cocher](./checkbox-group.md) — Sélectionner plusieurs valeurs à l’aide de cases à cocher
