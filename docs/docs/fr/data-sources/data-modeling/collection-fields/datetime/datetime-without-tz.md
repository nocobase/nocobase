---
title: "Date et heure (sans fuseau horaire)"
description: "Le champ Date et heure (sans fuseau horaire) sert à enregistrer une date et une heure sans conversion de fuseau horaire."
keywords: "date et heure,datetime without timezone,sans fuseau horaire,NocoBase"
---

# Date et heure (sans fuseau horaire)

## Introduction

Dans NocoBase, **Date et heure (sans fuseau horaire) (Date time without timezone)** sert à enregistrer une date et une heure sans conversion de fuseau horaire.

Date et heure (sans fuseau horaire) convient aux scénarios qui privilégient l’affichage de la valeur locale, comme les plannings, les horaires d’ouverture et les horaires de cours.

Si vous devez exprimer un instant réel cohérent partout dans le monde, [Date et heure (avec fuseau horaire)](./datetime.md) est plus approprié.

## Cas d’utilisation

Date et heure (sans fuseau horaire) convient aux scénarios métier suivants :

- Horaires de planning locaux
- Heure de début des cours, heure des examens
- Heures d’ouverture des magasins
- Horaires métier qui ne doivent pas être convertis entre les fuseaux horaires

## Créer et configurer

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Date et heure (sans fuseau horaire) » pour créer un champ Date et heure (sans fuseau horaire).

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Date et heure (sans fuseau horaire) correspond à `datetimeNoTz` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Heure du planning », « Horaire du cours » ou « Heures d’ouverture ». Il est recommandé d’utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Date et heure (sans fuseau horaire) utilise généralement `datetimeNoTz`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur ne saisit aucune valeur. |
| Validation rules | Règles de validation. Permet de configurer des règles telles que le caractère obligatoire ou la plage horaire. |
| Description | Description du champ. Il est utile d’y indiquer sa signification, les consignes de saisie, la source des données ou le responsable de la maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nommage avant la création afin d’éviter des coûts de configuration supplémentaires lors de modifications ultérieures.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Date et heure (sans fuseau horaire) est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `datetimeNoTz`. |
| Field type par défaut | `datetimeNoTz`. |
| Field type disponible | `datetimeNoTz`. |
| Composant de page | Le mode édition utilise un sélecteur de date et d’heure. |
| Filtrage | Permet de filtrer par instant, intervalle, valeur vide ou valeur non vide. |
| Tri | Permet de trier par heure. |
| Validation | Permet notamment de vérifier le caractère obligatoire et la plage horaire. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Date et heure (sans fuseau horaire). La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la manière dont les valeurs sont saisies, affichées et validées dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de l’ajout d’un nouvel enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou le responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Date et heure (sans fuseau horaire). Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en une seule fois.

Lors de la suppression d’un champ Date et heure (sans fuseau horaire) créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Date et heure (sans fuseau horaire) convient aux activités métier fondées sur l’heure locale.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une date et une heure. |
| Bloc de tableau | Afficher, trier et filtrer l’heure. |
| Bloc de calendrier | Servir de champ d’heure pour un événement local. |
| Workflow | Servir de champ pour une condition temporelle. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, les catégories et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Date et heure (avec fuseau horaire)](./datetime.md) — enregistrer un instant avec la sémantique du fuseau horaire
- [Date](./date.md) — enregistrer uniquement une date.