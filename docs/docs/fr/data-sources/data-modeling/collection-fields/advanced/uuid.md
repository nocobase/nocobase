---
title: "UUID"
description: "Le champ UUID sert à générer un identifiant universel unique, adapté à la synchronisation avec des systèmes externes et aux scénarios d’identification publique."
keywords: "UUID,identifiant unique,clé primaire,NocoBase"
---

# UUID

## Présentation

Dans NocoBase, **UUID（UUID）** sert à générer des identifiants uniques UUID.

Les UUID conviennent à la synchronisation entre systèmes, à l’identification dans les API publiques et à l’importation et l’exportation de données. Ils exposent moins facilement le volume des données que les identifiants auto-incrémentés.

Si vous avez uniquement besoin de la clé primaire par défaut pour un usage interne à NocoBase, un identifiant Snowflake suffit généralement. Si vous avez besoin d’un numéro court, choisissez [Nano ID](./nano-id.md) ou une [séquence](../../../field-sequence/index.md).

## Scénarios d’utilisation

Les UUID conviennent aux scénarios métier suivants :

- Identifiants de synchronisation avec des systèmes externes
- Identifiants d’API publiques
- Identifiants d’enregistrements lors de migrations entre bases de données
- Identifiants d’enregistrements dont la séquence incrémentale ne doit pas être exposée

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « UUID » pour créer un champ UUID.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. UUID correspond à `uuid` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « UUID », « Identifiant externe » ou « ID public ». Il est recommandé d’utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs relationnels, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Par défaut, un champ UUID est de type `uuid`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’a rien saisi. |
| Validation rules | Elles sont généralement générées automatiquement par le système et ne nécessitent pas de validation manuelle. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez le nom avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ UUID est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `uuid`. |
| Default Field type | `uuid`. |
| Field type disponibles | `uuid`. |
| Composant de page | Il est généralement généré automatiquement et ne nécessite aucune saisie manuelle. |
| Filtrage | Les recherches exactes par UUID sont prises en charge. |
| Tri | Le tri est pris en charge, mais les UUID ne sont généralement pas utilisés pour le tri métier. |
| Validation | Elle est généralement générée automatiquement et garantit l’unicité. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ UUID. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. La modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création d’un nouvel enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Précise la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ UUID. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en lot.

Lors de la suppression d’un champ UUID créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées de la base de données. Lorsqu’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe est supprimé, l’impact dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, l’importation et l’exportation de données, ainsi que les données existantes. Avant de supprimer le champ, vérifiez qu’il n’est plus utilisé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Les champs UUID conviennent aux scénarios d’intégration et d’identification publique.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Scénario | Utilisation |
| --- | --- |
| Créer une table | Utiliser le champ comme clé primaire ou identifiant unique. |
| API | Utiliser le champ comme identifiant public d’un enregistrement. |
| Synchronisation des données | Synchroniser les enregistrements entre différents systèmes. |
| Importation et exportation | Préserver l’unicité des enregistrements. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Tables ordinaires](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Snowflake ID](./snowflake-id.md) — Utiliser l’identifiant Snowflake par défaut
- [Nano ID](./nano-id.md) — Utiliser un identifiant aléatoire court