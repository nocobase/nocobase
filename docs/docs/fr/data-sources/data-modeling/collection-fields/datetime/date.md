---
title: "Date"
description: "Le champ Date sert à enregistrer des dates sans moment précis, comme une date d’anniversaire, de signature ou d’échéance."
keywords: "date,date,champ de date,NocoBase"
---

# Date

## Présentation

Dans NocoBase, **Date (Date)** sert à enregistrer des dates sans moment précis.

Le champ Date convient aux anniversaires, dates de signature, dates d’échéance, dates planifiées et autres données métier qui ne nécessitent que l’année, le mois et le jour.

Si vous devez enregistrer une heure, des minutes et des secondes précises, choisissez [Date et heure](./datetime.md). Si vous avez uniquement besoin de l’heure dans la journée, choisissez [Heure](./time.md).

## Cas d’utilisation

Le champ Date convient aux cas d’utilisation suivants :

- Anniversaires des clients, dates d’entrée en fonction des employés
- Dates de signature et d’échéance des contrats
- Dates planifiées, dates de livraison
- Dates métier ne nécessitant pas de moment précis

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Date » pour créer un champ Date.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour une date, il correspond à `date` et détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Date de signature », « Date d’échéance » ou « Anniversaire ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs relationnels, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le champ Date est `dateonly` par défaut. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Vous pouvez configurer l’obligation de saisie, une plage de dates, etc. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nommage avant la création afin d’éviter des coûts d’ajustement de la configuration par la suite.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Date est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `date`. |
| Field type par défaut | `dateonly`. |
| Field type disponible | `dateonly`. |
| Composant de page | Le mode édition utilise un sélecteur de date. |
| Filtrage | Prend en charge le filtrage par date, par intervalle, par valeur vide ou non vide. |
| Tri | Prend en charge le tri par date. |
| Validation | Prend en charge les validations telles que la saisie obligatoire et la plage de dates. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Date. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Sous conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors du mappage des champs. Cela affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Sous conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors du mappage des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifier la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifier les règles de validation du champ. |
| Description | Oui | Ajouter la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que le format des données est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Date. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Date créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer un champ, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Date convient aux formulaires, tableaux, filtres, calendriers et statistiques.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Sélectionner une date. |
| Bloc de tableau | Afficher, trier et filtrer les dates. |
| Bloc de calendrier | Utiliser le champ comme date de l’événement. |
| Workflow | Utiliser le champ comme condition de date. |

## Liens associés

- [Champs](../index.md) — Découvrez le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créez et gérez des champs dans une table standard
- [Date et heure (avec fuseau horaire)](./datetime.md) — Enregistrez une date et une heure précises
- [Heure](./time.md) — Enregistrez uniquement l’heure
