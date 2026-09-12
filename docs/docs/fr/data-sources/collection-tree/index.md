---
pkg: "@nocobase/plugin-collection-tree"
title: "Table arborescente"
description: "Les tables arborescentes servent à stocker des données hiérarchiques telles que les structures organisationnelles, les catégories de produits, les niveaux géographiques et les répertoires de services, en utilisant une structure de table adjacente pour enregistrer les relations parent-enfant."
keywords: "table arborescente, collection arborescente, table adjacente, données hiérarchiques, Tree Collection,NocoBase"
---

# Table arborescente

## Présentation

Les tables arborescentes conviennent au stockage de données comportant des relations hiérarchiques, comme les structures organisationnelles, les catégories de produits, les niveaux géographiques, les répertoires de services et les répertoires de bases de connaissances. Elles utilisent une structure de table adjacente pour enregistrer les relations parent-enfant, et chaque enregistrement peut pointer vers son propre nœud parent.

Les tables arborescentes peuvent uniquement être créées via la page de la base de données principale. Les bases de données externes, les sources de données d’API REST et les sources de données NocoBase externes ne prennent pas en charge la création de tables arborescentes.

## Cas d’utilisation

Les tables arborescentes conviennent notamment aux cas d’utilisation suivants :

- Structure organisationnelle de l’entreprise et hiérarchie des services
- Catégories de produits, répertoires de bases de connaissances et répertoires de documents
- Provinces, villes et districts, zones commerciales et hiérarchie des points de service
- Catégories de nomenclatures, d’équipements et d’actifs

## Configuration de création

Dans la base de données principale, cliquez sur « Create collection », puis sélectionnez « Tree collection » pour créer une table arborescente.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

La configuration de création d’une table arborescente est globalement identique à celle d’une table ordinaire.

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la table de données s’affiche dans l’interface, par exemple « Structure organisationnelle », « Catégories de produits » ou « Niveaux géographiques ». |
| Collection name | Nom d’identification de la table de données, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. |
| Inherits | Sélectionnez la table parente dont hériter. Visible uniquement lorsque la base de données principale est PostgreSQL. |
| Categories | Catégories de la table de données. Les catégories influencent uniquement l’organisation de l’interface de gestion des tables de données et ne modifient pas leur structure. |
| Description | Description de la table de données. Vous pouvez indiquer les données hiérarchiques stockées par cette table arborescente, les personnes qui les gèrent et les pages dans lesquelles elles sont utilisées pour le filtrage. |
| Preset fields | Champs prédéfinis. Lors de la création d’une table arborescente, il est recommandé de conserver les champs système et les champs intégrés aux tables arborescentes. |

### Champs intégrés

Après sa création, une table arborescente contient généralement les champs intégrés suivants. `parentId`, `parent` et `children` servent à enregistrer les relations hiérarchiques.

| Champ | Nom du champ | Description |
| --- | --- | --- |
| ID | `id` | Champ de clé primaire par défaut, utilisé pour identifier de manière unique un enregistrement. |
| Date de création | `createdAt` | Enregistre automatiquement la date et l’heure de création de l’enregistrement. |
| Créateur | `createdBy` | Enregistre automatiquement l’utilisateur ayant créé l’enregistrement. |
| Date de mise à jour | `updatedAt` | Enregistre automatiquement la date et l’heure de la dernière mise à jour de l’enregistrement. |
| Modificateur | `updatedBy` | Enregistre automatiquement l’utilisateur ayant effectué la dernière mise à jour de l’enregistrement. |
| Parent ID | `parentId` | Enregistre l’ID du nœud parent. Il est généralement vide pour les nœuds racine. |
| Parent | `parent` | Champ de relation plusieurs-à-un pointant vers le nœud parent de la table actuelle. |
| Children | `children` | Champ de relation un-à-plusieurs représentant les nœuds enfants du nœud actuel. |
| Espace | `space` | Disponible après l’activation du [plugin multi-espace](../../multi-app/multi-space/index.md), il sert à isoler les données par espace. Il n’apparaît pas lorsque le multi-espace n’est pas activé. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Attention

Évitez de créer des relations circulaires dans les données des tables arborescentes. Par exemple, si le parent de A est B et que le parent de B est A. Les relations circulaires peuvent entraîner des anomalies dans l’affichage de l’arborescence et les résultats de filtrage.

:::

### Champ de clé primaire

Comme les tables ordinaires, les tables arborescentes doivent comporter un champ de clé primaire. Les champs de relation arborescente utilisent l’ID du nœud parent pour établir une relation avec l’enregistrement de clé primaire de la même table.

Si une table arborescente ne possède pas de clé primaire, vous devez définir « Record unique key » lors de la modification de la table de données. Sinon, certains blocs de page risquent de ne pas pouvoir afficher ou modifier correctement les enregistrements, et l’affichage arborescent pourrait ne pas localiser les nœuds de manière fiable.

## Utilisation dans la configuration des pages

Les tables arborescentes peuvent utiliser la plupart des blocs de données des [tables ordinaires](../data-source-main/general-collection.md) pour créer, supprimer, modifier et consulter des données. Elles peuvent également être utilisées avec les fonctionnalités arborescentes :

| Bloc | Utilisation |
| --- | --- |
| [Bloc tableau](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Afficher les enregistrements hiérarchiques afin de consulter et de gérer la structure parent-enfant. |
| [Bloc formulaire](../../interface-builder/blocks/data-blocks/form.md) | Ajouter ou modifier un seul enregistrement de nœud arborescent. |
| [Bloc de détails](../../interface-builder/blocks/data-blocks/details.md) | Consulter les détails d’un seul nœud arborescent. |
| [Bloc de filtrage arborescent](../../interface-builder/blocks/filter-blocks/tree.md) | Filtrer d’autres blocs de données à l’aide d’une structure arborescente, notamment pour les catégories, les organisations et les zones géographiques. |

## Modification de la configuration

Dans la liste des tables de données, cliquez sur « Edit » à droite de la table arborescente pour modifier son nom d’affichage, ses catégories, sa description, son mode de pagination simplifié et d’autres paramètres tels que « Record unique key ».

Il est généralement déconseillé de supprimer ou de détourner les champs de relation parent-enfant d’une table arborescente. Pour modifier la structure hiérarchique, changez plutôt les relations avec les nœuds parents dans les données des enregistrements.

## Suppression d’une table de données

Dans la liste des tables de données, cliquez sur « Delete » à droite de la table arborescente pour la supprimer.

La suppression d’une table arborescente supprime les métadonnées Collection de cette table, la table de données réelle et les données de relations arborescentes. Avant de la supprimer, vérifiez que les blocs de page, les blocs de filtrage arborescent, les champs de relation, les autorisations, les workflows et les API n’en dépendent plus.

:::danger Avertissement

Les tables arborescentes sont souvent utilisées comme critères de filtrage pour d’autres blocs. Après la suppression d’une table arborescente, les blocs de filtrage arborescent associés et les configurations de page dépendant de cette hiérarchie de catégories peuvent cesser de fonctionner.

:::

## Liens associés

- [Table ordinaire](../data-source-main/general-collection.md) — Consulter la configuration générale et les modes d’utilisation des blocs
- [Bloc tableau](../../interface-builder/blocks/data-blocks/table.md) — Activer l’affichage arborescent dans un tableau
- [Bloc de filtrage arborescent](../../interface-builder/blocks/filter-blocks/tree.md) — Filtrer les données à l’aide d’une structure arborescente
- [Multi-espace](../../multi-app/multi-space/index.md) — En savoir plus sur les champs d’espace et les fonctionnalités d’isolation par espace