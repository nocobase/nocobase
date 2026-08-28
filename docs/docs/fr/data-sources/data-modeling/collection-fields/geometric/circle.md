---
title: "Cercle"
description: "Le champ Cercle sert à enregistrer une zone représentée par un point central et un rayon."
keywords: "Cercle,Circle,forme géométrique,carte,NocoBase"
---

# Cercle

## Présentation

Dans NocoBase, **le cercle (Circle)** sert à enregistrer une zone circulaire.

Le champ Cercle convient aux données métier telles que le rayon de service, la zone de livraison ou la zone de couverture d’un point de vente.

Si la zone n’est pas circulaire, choisissez [Polygone](./polygon.md). Si vous avez uniquement besoin de la position centrale, choisissez [Point](./point.md).

## Cas d’utilisation

Le cercle convient aux cas d’utilisation suivants :

- Rayon de service d’un point de vente
- Zone de couverture des livraisons
- Zone d’influence d’un équipement
- Zone de recherche autour d’un point

## Créer la configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Cercle » pour créer un champ Cercle.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour un cercle, il correspond à `circle` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Rayon de service », « Zone de couverture » ou « Zone d’influence ». Il est recommandé d’utiliser un nom facilement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs relationnels, les autorisations, les workflows, etc. Il est généralement déconseillé de le modifier après sa création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, le champ Cercle utilise `circle`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. En général, il suffit de configurer le champ comme obligatoire. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez la convention de nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Cercle est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `circle`. |
| Field type par défaut | `circle`. |
| Field type disponible | `circle`. |
| Composant de page | Le mode édition utilise un composant cartographique de dessin. |
| Filtrage | Les capacités de filtrage spatial dépendent du plug-in cartographique et des fonctionnalités de la source de données. |
| Tri | Généralement, ce champ n’est pas utilisé pour le tri. |
| Validation | Les validations de base, comme le caractère obligatoire, sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification sert principalement à ajuster la manière dont le champ est affiché et utilisé dans NocoBase, par exemple pour changer son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché pour le champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Cette modification affecte la manière dont les valeurs sont saisies, affichées et validées sur les pages. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Si le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Cercle. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en une seule fois.

Lorsqu’un champ Cercle créé dans la base de données principale est supprimé, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lorsqu’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe est supprimé, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant toute suppression, vérifiez que le champ n’est plus utilisé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Cercle convient aux scénarios de rayon de service et de zone de couverture.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Dessiner une zone circulaire. |
| Bloc de détails | Afficher une zone circulaire. |
| Bloc cartographique | Afficher une zone de couverture sur une carte. |
| Workflow | Participer au processus en tant que donnée liée à une zone. |

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, les catégories et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Point](./point.md) — Enregistrer une position centrale
- [Polygone](./polygon.md) — Enregistrer une zone non circulaire