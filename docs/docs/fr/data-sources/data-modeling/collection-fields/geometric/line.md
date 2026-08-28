---
title: "Ligne"
description: "Le champ Ligne sert à stocker des données spatiales linéaires telles que des itinéraires et des trajectoires."
keywords: "Ligne,LineString,itinéraire,figure géométrique,NocoBase"
---

# Ligne

## Introduction

Dans NocoBase, **la ligne (LineString)** sert à stocker des données spatiales linéaires.

Le champ Ligne convient aux données métier telles que les itinéraires, les trajectoires, les canalisations et les parcours d’inspection. Associé à un bloc cartographique, il permet d’afficher des chemins.

Si vous avez seulement besoin d’un emplacement, choisissez le [point](./point.md). Si vous avez besoin de définir une zone, choisissez le [polygone](./polygon.md).

## Scénarios d’utilisation

La ligne convient aux scénarios métier suivants :

- Itinéraires de livraison et d’inspection
- Trajectoires de véhicules et de personnes
- Canalisations, lignes et limites
- Résultats de planification d’itinéraires sur une carte

## Créer et configurer

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Ligne » pour créer un champ Ligne.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour une ligne, il correspond à `lineString` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Itinéraire de livraison », « Trajectoire d’inspection » ou « Canalisation ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les permissions, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le champ Ligne est `lineString` par défaut. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Règles de validation. En général, il suffit de configurer le champ comme obligatoire. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les permissions, les workflows et les API. Vérifiez le nom avant la création afin d’éviter des coûts de modification de configuration par la suite.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Ligne est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `lineString`. |
| Field type par défaut | `lineString`. |
| Field type disponibles | `lineString`. |
| Composant de page | Le mode édition utilise un composant cartographique de dessin. |
| Filtrage | Les capacités de filtrage spatial dépendent du plugin cartographique et des capacités de la source de données. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Prend en charge les validations de base, comme le caractère obligatoire. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple pour modifier son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création d’un nouvel enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que le format des données est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Ligne. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Ligne créé dans la base de données principale, la colonne réelle correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lorsqu’un champ provenant d’une synchronisation avec une base de données ou d’une mise en correspondance avec une source de données externe est supprimé, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Ligne convient aux scénarios d’affichage d’itinéraires sur une carte et d’analyse spatiale.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Dessiner ou saisir un itinéraire. |
| Bloc de détails | Afficher un itinéraire. |
| Bloc cartographique | Afficher un chemin linéaire sur la carte. |
| Workflow | Participer au processus en tant que donnée liée à un itinéraire. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, la classification et la logique de mise en correspondance des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Point](./point.md) — stocker un seul emplacement
- [Polygone](./polygon.md) — stocker une zone
