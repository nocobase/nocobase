---
title: "Groupe de cases à cocher"
description: "Le champ groupe de cases à cocher permet d'afficher plusieurs options côte à côte sur une page et d'en sélectionner plusieurs."
keywords: "groupe de cases à cocher,checkbox group,sélection multiple,champ d'options,NocoBase"
---

# Groupe de cases à cocher

## Introduction

Dans NocoBase, le **groupe de cases à cocher (Checkbox group)** permet de sélectionner plusieurs valeurs parmi un ensemble d'options et d'afficher directement ces options dans le formulaire.

Le groupe de cases à cocher convient lorsque le nombre d'options est limité et que la sélection multiple est nécessaire. Comme la sélection multiple dans une liste déroulante, il permet de choisir plusieurs valeurs, mais leur mode d'interaction sur la page est différent.

Si les options sont nombreuses, choisissez la [sélection multiple dans une liste déroulante](./multiple-select.md) pour économiser de l'espace. Si une seule option peut être sélectionnée, choisissez le [groupe de boutons radio](./radio-group.md).

## Cas d'utilisation

Le groupe de cases à cocher convient aux scénarios métier suivants :

- Périmètre des services, canaux applicables
- Cases à cocher des autorisations fonctionnelles
- Étiquettes correspondant aux besoins des clients
- Petit nombre d'options fixes à sélection multiple

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Groupe de cases à cocher » pour créer un champ de type groupe de cases à cocher.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d'interface du champ. Le groupe de cases à cocher correspond à `checkboxGroup` et détermine la manière dont les données sont saisies et affichées sur la page. |
| Field display name | Nom affiché du champ dans l'interface, par exemple « Périmètre des services », « Canaux applicables » ou « Étiquettes de besoins ». Il est recommandé d'utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d'identification du champ, utilisé pour les références internes dans l'API, les champs de relation, les autorisations, les workflows, etc. Il n'est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Un groupe de cases à cocher est généralement enregistré sous forme de tableau ou de JSON, selon la configuration du champ et les capacités de la source de données. |
| Default value | Valeur par défaut. Lors de la création d'un enregistrement, cette valeur peut être renseignée automatiquement si l'utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles servent généralement à définir le caractère obligatoire et la plage d'options autorisées. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Après sa création, le nom du champ est référencé par les blocs de page, les autorisations, les workflows et l'API. Vérifiez la convention de nommage avant la création afin d'éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ groupe de cases à cocher est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `checkboxGroup`. |
| Field type par défaut | `array`. |
| Field type disponible | `array`, `json`, selon la correspondance réelle du champ. |
| Composant de page | Le mode édition utilise un groupe de cases à cocher. |
| Filtrage | Permet de filtrer les enregistrements contenant une option donnée. |
| Tri | N'est généralement pas utilisé pour le tri. |
| Validation | Prend en charge l'obligation de saisie et les contraintes sur la plage d'options. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ groupe de cases à cocher. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d'affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d'une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé au Field type et au Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l'interface sans changer son nom d'identification. |
| Field name | Non | Le nom d'identification du champ ne peut généralement pas être modifié dans le formulaire d'édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Cette modification affecte la saisie, l'affichage et la validation sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d'affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d'utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d'abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ groupe de cases à cocher. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d'un champ groupe de cases à cocher créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu'elle contient sont généralement supprimées simultanément. Pour un champ synchronisé depuis une base de données ou provenant d'une source de données externe, l'étendue des effets dépend de la source de données et de l'origine du champ concerné.

:::danger Avertissement

La suppression d'un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l'API, les importations et exportations, ainsi que les données existantes. Vérifiez avant la suppression si le champ est toujours référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le groupe de cases à cocher convient à l'affichage côte à côte d'un petit nombre d'options à sélection multiple dans un formulaire.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Afficher directement toutes les options et en sélectionner plusieurs. |
| Bloc de détails | Afficher plusieurs options sous forme d'étiquettes ou de texte. |
| Bloc de filtrage | Filtrer selon la présence de certaines options. |
| Workflows et autorisations | Participer aux conditions de décision, par exemple « contient » ou « ne contient pas ». |

## Liens associés

- [Champ](../index.md) — Découvrez le rôle, la classification et la logique de correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Sélection multiple dans une liste déroulante](./multiple-select.md) — À utiliser lorsque le nombre d'options est important
- [Groupe de boutons radio](./radio-group.md) — Sélectionner une seule valeur