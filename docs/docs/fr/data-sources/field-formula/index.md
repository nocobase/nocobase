---
title: "Formule"
description: "Les champs de formule servent à calculer des résultats à partir d'autres champs, comme des montants, des scores ou des textes d'état."
keywords: "Formule,formula,champs calculés,NocoBase"
---

# Formule

## Introduction

Dans NocoBase, les **formules (Formula)** servent à calculer la valeur d’un champ à partir d’une expression.

Les champs de formule conviennent notamment aux calculs de montants, aux calculs de scores, à la concaténation de textes et aux calculs conditionnels. Leur valeur est généralement générée par une expression et ne convient pas à une saisie manuelle directe.

Si le résultat doit être renseigné manuellement, choisissez le champ de base correspondant. Si la logique de calcul est très complexe, envisagez d’utiliser un workflow ou une vue de base de données.

## Scénarios d’utilisation

Les formules conviennent aux scénarios métier suivants :

- Sous-total d’une commande, montant TTC
- Score, score pondéré, score de performance
- Nom d’affichage obtenu après concaténation de textes
- Résultat métier calculé selon des conditions

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Formule » pour créer un champ de formule.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour une formule, il correspond à `formula` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Sous-total de la commande », « Score global » ou « Nom d’affichage ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Les champs de formule utilisent `formula` ; le type de résultat dépend de la configuration de la formule. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur n’a rien saisi. |
| Validation rules | Règles de validation. Il faut notamment vérifier que l’expression de la formule est complète et que les champs référencés existent. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou le responsable de maintenance. |

:::warning Attention

Après sa création, le nom du champ est référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nom avant la création afin d’éviter des coûts de configuration supplémentaires en cas de modification ultérieure.

:::

## Caractéristiques du champ

Le comportement par défaut des champs de formule est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `formula`. |
| Default Field type | `formula`. |
| Field type disponible | `formula`. |
| Composant de page | En mode édition, on configure généralement l’expression de la formule ; en mode lecture, le résultat calculé est affiché. |
| Filtrage | La possibilité de filtrer dépend du résultat de la formule et de son mode d’exécution. |
| Tri | La possibilité de trier dépend du résultat de la formule et de son mode d’exécution. |
| Validation | Dépend de l’expression de la formule et du type de résultat. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ de formule. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cela modifie la manière dont les données sont saisies, affichées et validées dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou le responsable de maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer un champ de formule. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ de formule créé dans la base de données principale, la colonne réelle correspondante dans la base de données et les données qu’elle contient sont généralement supprimées en même temps. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Les champs de formule sont adaptés à l’affichage des résultats calculés dans les tableaux, les détails, les statistiques et les workflows.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Scénario | Utilisation |
| --- | --- |
| Configuration du champ | Rédiger l’expression de la formule et sélectionner les champs référencés. |
| Bloc de tableau | Afficher le résultat calculé. |
| Bloc de détails | Afficher le résultat calculé d’un enregistrement donné. |
| Workflow | Lire le résultat de la formule pour l’utiliser dans les décisions suivantes. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table standard](../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Nombre](../data-modeling/collection-fields/basic/number.md) — Enregistrer les valeurs numériques utilisées dans les calculs
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Enregistrer des résultats structurés
