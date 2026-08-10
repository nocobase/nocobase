---
title: "Point"
description: "Le champ Point sert à enregistrer un emplacement géographique ou des coordonnées spatiales."
keywords: "Point,Point,formes géométriques,carte,NocoBase"
---

# Point

## Présentation

Dans NocoBase, le **point (Point)** sert à enregistrer les coordonnées d’un emplacement unique.

Le champ Point convient aux données spatiales telles que l’emplacement d’un magasin, d’un client ou d’un équipement. Associé au bloc cartographique, il permet d’afficher les enregistrements sur une carte.

Pour enregistrer un itinéraire, choisissez la [ligne](./line.md). Pour enregistrer une zone, choisissez le [polygone](./polygon.md) ou le [cercle](./circle.md).

## Cas d’utilisation

Le point convient aux scénarios métier suivants :

- Emplacement de magasins et d’entrepôts
- Coordonnées d’adresses clients
- Emplacement d’installation d’équipements
- Emplacement de pointage lors des inspections

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Point » pour créer un champ Point.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour un point, il correspond à `point` et détermine comment saisir et afficher la valeur sur la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Emplacement du magasin », « Coordonnées de l’équipement » ou « Emplacement du client ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Le type par défaut d’un champ Point est `point`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne remplit pas le champ. |
| Validation rules | Règles de validation. Il suffit généralement de configurer le champ comme obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera utilisé par les blocs de page, les autorisations, les workflows et les API. Vérifiez la dénomination avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Point est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `point`. |
| Field type par défaut | `point`. |
| Field type disponible | `point`. |
| Composant de page | En mode édition, utilise un composant de sélection de carte ou de coordonnées. |
| Filtrage | Les capacités de filtrage spatial dépendent du plug-in cartographique et des capacités de la source de données. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Prend en charge les validations de base, comme l’obligation de saisie. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Point. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte le mode de saisie, d’affichage et de validation sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond au nouveau paramétrage.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Point. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Point créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lors de la suppression d’un champ synchronisé depuis une base de données ou issu de la mise en correspondance d’une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Point convient aux scénarios de cartographie et de gestion des emplacements.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner ou saisir un emplacement. |
| Bloc de détails | Afficher les coordonnées d’un emplacement ou un point sur la carte. |
| Bloc cartographique | Afficher des points sur une carte. |
| Workflow | Servir de valeur d’entrée pour les conditions métier liées à l’emplacement. |

## Liens associés

- [Champs](../index.md) — Découvrez le rôle, les catégories et la logique de mise en correspondance des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Bloc cartographique](../../../../interface-builder/blocks/data-blocks/map.md) — Afficher des champs géométriques sur une carte
- [Ligne](./line.md) — Enregistrer un itinéraire
- [Polygone](./polygon.md) — Enregistrer une zone
