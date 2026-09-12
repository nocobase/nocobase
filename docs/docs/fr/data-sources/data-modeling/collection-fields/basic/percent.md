---
title: "Pourcentage"
description: "Le champ Pourcentage sert à enregistrer des données proportionnelles telles que le taux d’achèvement, le taux de remise et le taux de conversion."
keywords: "Pourcentage,percent,proportion,taux d’achèvement,NocoBase"
---

# Pourcentage

## Présentation

Dans NocoBase, **le pourcentage (Percent)** sert à enregistrer et à afficher des données proportionnelles.

Le champ Pourcentage convient aux données métier telles que le taux d’achèvement, le taux de remise, le taux de conversion et la proportion. Il s’agit essentiellement d’un champ numérique, mais son affichage et sa saisie dans l’interface sont adaptés à la notion de pourcentage.

Pour les montants, quantités ou notes ordinaires, le champ [Nombre](./number.md) est plus adapté.

## Cas d’utilisation

Le pourcentage convient notamment aux cas d’utilisation suivants :

- Taux d’achèvement d’un projet, avancement d’une tâche
- Taux de remise, taux de taxe, taux de commission
- Taux de conversion, taux d’atteinte, proportion
- Poids d’une note, taux de répartition

## Créer et configurer

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Pourcentage » pour créer un champ Pourcentage.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour un pourcentage, il correspond à `percent` et détermine la manière dont la valeur est saisie et affichée dans l’interface. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Taux d’achèvement », « Taux de remise » ou « Taux de conversion ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs relationnels, les autorisations, les flux de travail, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Les champs Pourcentage utilisent généralement `double`, mais `decimal` peut également être choisi selon les exigences de précision. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. Elles peuvent limiter la valeur minimale ou maximale, ou indiquer si le champ est obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ est référencé par les blocs de page, les autorisations, les flux de travail et l’API. Vérifiez donc la dénomination avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Pourcentage est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `percent`. |
| Field type par défaut | `double`. |
| Field type disponibles | `float`, `double`, `decimal`. |
| Composant de page | Le mode d’édition utilise un composant de saisie de pourcentage. |
| Filtrage | Prend en charge le filtrage numérique, par exemple supérieur à, inférieur à, par intervalle, vide ou non vide. |
| Tri | Permet le tri dans les blocs de tableau. |
| Validation | Prend en charge la validation de la plage numérique, de l’obligation de saisie, etc. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modification autorisée | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cela affecte la manière dont les données sont saisies, affichées et validées dans l’interface. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et le mode d’utilisation des variables dans les flux de travail. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Pourcentage. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Pourcentage créé dans la base de données principale, la colonne réelle correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Pour un champ synchronisé depuis une base de données ou mappé à partir d’une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les flux de travail, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez que le champ n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Pourcentage convient aux formulaires métier, aux tableaux de bord, aux graphiques et aux rapports pour exprimer des proportions.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Saisir un taux d’achèvement, un taux de remise, un taux de taxe ou toute autre proportion. |
| Bloc de tableau | Afficher, trier et filtrer des données proportionnelles. |
| Bloc de graphique | Afficher des indicateurs tels que la proportion ou le taux de conversion. |
| Flux de travail et autorisations | Participer aux conditions, par exemple pour déterminer si le taux d’achèvement atteint 100 %. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Nombre](./number.md) — Enregistrer des valeurs numériques ordinaires
- [Formule](../../../field-formula/index.md) — Calculer un résultat proportionnel
