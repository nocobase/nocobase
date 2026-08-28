---
title: "Séquence"
description: "Le champ Séquence sert à générer des numéros métier incrémentiels ou générés selon des règles."
keywords: "Séquence,sequence,numéro, numérotation automatique,NocoBase"
---

# Séquence

## Présentation

Dans NocoBase, la **séquence (Sequence)** sert à générer des numéros métier.

Le champ Séquence convient aux numéros de commande, de contrat, de ticket ou de demande, ainsi qu’à tout numéro basé sur des règles lisibles. Contrairement à une clé primaire, il est davantage destiné à l’affichage métier et à l’identification humaine.

Si vous avez uniquement besoin d’un identifiant interne unique, utilisez un ID Snowflake, un UUID ou un Nano ID.

## Cas d’utilisation

Les séquences conviennent aux cas d’utilisation métier suivants :

- Numéros de commande et de contrat
- Numéros de ticket et de demande
- Numéros d’actif et d’équipement
- Numéros avec préfixe, date ou règle d’incrémentation

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Séquence » pour créer un champ Séquence.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour une séquence, il correspond à `sequence` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Numéro de commande », « Numéro de contrat » ou « Numéro de ticket ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs relationnels, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le type de stockage d’un champ Séquence dépend de la règle de séquence et correspond généralement à `string`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Ces règles sont généralement générées par le système et ne nécessitent pas de validation manuelle. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Après sa création, le nom du champ est référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez donc la convention de nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Séquence est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `sequence`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`, `integer`, selon la configuration réelle de la séquence. |
| Composant de page | Généralement généré automatiquement et utilisé après la configuration de la règle de numérotation. |
| Filtrage | Permet d’effectuer une recherche exacte par numéro ou un filtrage textuel. |
| Tri | La pertinence du tri dépend de la règle de numérotation. |
| Validation | Dépend de la règle de séquence et garantit généralement l’unicité. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster sa manière d’être affiché et utilisé dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. La modification affecte le mode de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Précise la signification du champ, les consignes de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Séquence. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en masse.

Lors de la suppression d’un champ Séquence créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernés.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant la suppression, vérifiez que le champ n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Séquence convient aux numéros métier et aux scénarios de recherche manuelle.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Scénario | Utilisation |
| --- | --- |
| Création d’un enregistrement | Générer automatiquement un numéro métier. |
| Bloc de tableau | Afficher, rechercher et filtrer les numéros. |
| Bloc de détails | Servir d’identifiant lisible de l’enregistrement. |
| Workflows et notifications | Réutiliser le numéro métier dans les validations et les notifications. |

## Liens associés

- [Champs](../index.md) — Découvrir le rôle, la classification et la logique de mappage des champs
- [Table standard](../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Texte sur une ligne](../data-modeling/collection-fields/basic/input.md) — Gérer manuellement les numéros métier
- [Snowflake ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Utiliser un ID de clé primaire interne
