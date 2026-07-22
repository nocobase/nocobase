---
title: "Date et heure (avec fuseau horaire)"
description: "Le champ Date et heure (avec fuseau horaire) sert à enregistrer des dates et heures avec une sémantique de fuseau horaire."
keywords: "date et heure,datetime,fuseau horaire,NocoBase"
---

# Date et heure (avec fuseau horaire)

## Présentation

Dans NocoBase, **Date et heure (avec fuseau horaire) (Date time with timezone)** sert à enregistrer des dates et heures et à les traiter selon la sémantique du fuseau horaire.

Date et heure (avec fuseau horaire) convient à la collaboration entre plusieurs fuseaux horaires, aux activités internationales ou aux situations nécessitant un instant précis, comme la création d’un rendez-vous, la définition d’une échéance ou d’une heure d’exécution.

Si l’activité ne concerne que le texte de l’heure locale et ne nécessite pas de conversion de fuseau horaire, vous pouvez choisir [Date et heure (sans fuseau horaire)](./datetime-without-tz.md). Si vous avez uniquement besoin de la date, choisissez [Date](./date.md).

## Cas d’utilisation

Date et heure (avec fuseau horaire) convient aux situations suivantes :

- Heure de début d’une réunion, heure d’un rendez-vous
- Échéance ou heure d’exécution d’une tâche
- Instants précis dans le cadre d’activités réparties sur plusieurs fuseaux horaires
- Heures associées aux conditions planifiées des workflows

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Date et heure (avec fuseau horaire) » pour créer un champ Date et heure (avec fuseau horaire).

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Date et heure (avec fuseau horaire) correspond à `datetime` et détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Heure de début », « Échéance » ou « Heure d’exécution ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Date et heure (avec fuseau horaire) utilise généralement `date`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’a rien saisi. |
| Validation rules | Règles de validation. Vous pouvez configurer l’obligation de saisie, une plage horaire, etc. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez son intitulé avant la création afin d’éviter les coûts de reconfiguration liés à une modification ultérieure.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Date et heure (avec fuseau horaire) est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `datetime`. |
| Field type par défaut | `date`. |
| Field type disponible | `date`. |
| Composant de page | Le mode édition utilise un sélecteur de date et d’heure. |
| Filtrage | Permet de filtrer par instant, intervalle, valeur vide ou valeur non vide. |
| Tri | Permet de trier par heure. |
| Validation | Permet notamment de vérifier que le champ est obligatoire et que l’heure se situe dans une plage donnée. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Date et heure (avec fuseau horaire). La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration propre.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ, c’est-à-dire à mapper un champ de base de données vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la manière dont les valeurs sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut appliquée lors de l’ajout d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Date et heure (avec fuseau horaire). Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en lot.

Lors de la suppression d’un champ Date et heure (avec fuseau horaire) créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Lorsqu’il s’agit d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant toute suppression, vérifiez que le champ n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Date et heure (avec fuseau horaire) convient à une utilisation dans les calendriers, les tableaux, les filtres et les workflows.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Situation | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une date et une heure. |
| Bloc de tableau | Afficher, trier et filtrer l’heure. |
| Bloc de calendrier | Utiliser le champ comme heure de début ou de fin. |
| Workflow | Utiliser le champ comme condition temporelle ou comme champ associé à une planification. |

## Liens associés

- [Champs](../index.md) — En savoir plus sur le rôle, les catégories et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Date et heure (sans fuseau horaire)](./datetime-without-tz.md) — Enregistrer une date et une heure sans conversion de fuseau horaire
- [Date](./date.md) — Enregistrer uniquement la date
- [Heure](./time.md) — Enregistrer uniquement l’heure
