---
title: "Divisions administratives de la Chine"
description: "Le champ des divisions administratives de la Chine permet de sélectionner des informations administratives telles que la province, la ville et le district ou le comté."
keywords: "divisions administratives de la Chine,china region,adresse,champ d'options,NocoBase"
---

# Divisions administratives de la Chine (obsolète)

## Présentation

:::warning Attention

Le champ des divisions administratives de la Chine est obsolète. Il est recommandé d'utiliser un champ de relation pour établir une association avec une table arborescente.

:::

Dans NocoBase, **les divisions administratives de la Chine (China region)** permettent de sélectionner une province, une ville, un district, un comté ou toute autre division administrative chinoise.

Le champ des divisions administratives de la Chine convient aux situations nécessitant une sélection structurée de régions, comme les adresses des clients, les adresses des magasins ou les zones de service. Il facilite davantage le filtrage et les statistiques que la saisie manuelle d'une adresse.

Pour enregistrer une adresse complète et détaillée, vous pouvez l'associer à un champ [Texte sur une ligne](../basic/input.md) ou [Texte multiligne](../basic/textarea.md) afin d'enregistrer la rue et le numéro.

## Scénarios d'utilisation

Les divisions administratives de la Chine conviennent aux scénarios métier suivants :

- Province, ville et district ou comté du client
- Zone de service du magasin
- Région de mise en œuvre du projet
- Division administrative de l'adresse de livraison

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « 中国行政区划 » pour créer un champ de divisions administratives de la Chine.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d'interface du champ. Les divisions administratives de la Chine correspondent à `chinaRegion`, qui détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l'interface, par exemple « Région », « Zone de service » ou « Région de livraison ». Il est recommandé d'utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d'identification du champ, utilisé pour les références internes dans l'API, les champs de relation, les autorisations, les workflows, etc. Après sa création, il n'est généralement plus modifiable. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Un champ de divisions administratives est généralement enregistré sous forme de valeur structurée ; le Field type exact dépend de la configuration du champ. |
| Default value | Valeur par défaut. Lors de la création d'un enregistrement, cette valeur peut être renseignée automatiquement si l'utilisateur n'a rien saisi. |
| Validation rules | Règles de validation. Elles servent généralement à définir si le champ est obligatoire et les niveaux de sélection. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Après sa création, le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l'API. Vérifiez donc le nom avant la création afin d'éviter des coûts d'ajustement de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ des divisions administratives de la Chine est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `chinaRegion`. |
| Field type par défaut | `json`. |
| Field type disponibles | `json`, `string`, selon la configuration réelle du champ. |
| Composant de page | Le mode édition utilise le composant de sélection des divisions administratives. |
| Filtrage | Le filtrage par valeur géographique est pris en charge ; les fonctionnalités exactes dépendent de la configuration du champ. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Les validations de base, telles que l'obligation de remplir le champ, sont prises en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ des divisions administratives de la Chine. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou ses paramètres spécifiques.

Si le champ provient d'une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l'interface sans modifier son nom d'identification. |
| Field name | Non | Le nom d'identification du champ ne peut généralement pas être modifié dans le formulaire d'édition après sa création. |
| Field interface | Sous conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. La modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Sous conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Ajuste la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Ajuste les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et le mode d'utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d'abord que leur format est compatible.

:::

## Suppression du champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ des divisions administratives de la Chine. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d'un champ des divisions administratives de la Chine créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu'elle contient sont généralement supprimées de la base de données. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l'étendue des conséquences dépend de la source de données et de l'origine du champ concerné.

:::danger Avertissement

La suppression d'un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l'API, l'importation et l'exportation, ainsi que les données existantes. Avant de le supprimer, vérifiez que le champ n'est plus utilisé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ des divisions administratives de la Chine convient aux scénarios liés aux adresses, aux régions et aux statistiques.

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une province, une ville, un district ou un comté. |
| Bloc de détails | Afficher les divisions administratives. |
| Bloc de filtrage | Filtrer les enregistrements par région. |
| Bloc de graphique | Établir des statistiques sur les données métier par région. |

## Liens associés

- [Champ](../index.md) — Découvrir le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Texte sur une ligne](../basic/input.md) — Enregistrer une adresse détaillée
- [Texte multiligne](../basic/textarea.md) — Enregistrer une description d'adresse plus longue
