---
pkg: "@nocobase/plugin-data-source-main"
title: "Table d’héritage"
description: "Les tables d’héritage permettent de dériver des tables enfants à partir d’une table parente. Les tables enfants héritent de la structure des champs de la table parente et peuvent définir leurs propres champs. Cette fonctionnalité est prise en charge uniquement lorsque la base de données principale est PostgreSQL."
keywords: "Table d’héritage,Inheritance Collection,héritage de tables,extension de table de données,PostgreSQL,NocoBase"
---

# Table d’héritage

## Présentation

Les tables d’héritage sont une extension des tables ordinaires. Elles conviennent lorsque plusieurs tables de données partagent un ensemble de champs communs, tout en possédant chacune leurs propres champs spécifiques.

Par exemple, vous pouvez d’abord créer une table parente « Actifs » pour enregistrer le numéro d’actif, le nom de l’actif, la date d’achat, le responsable et autres champs communs, puis en dériver des tables enfants telles que « Actifs informatiques », « Véhicules » et « Mobilier de bureau ». Les tables enfants héritent de la structure des champs de la table parente et peuvent continuer à définir leurs propres champs.

:::warning Attention

Les tables d’héritage peuvent être créées uniquement lorsque la base de données principale est PostgreSQL. Les autres bases de données principales, les bases de données externes, les sources de données REST API et les sources de données NocoBase externes ne prennent pas en charge les tables d’héritage.

:::

## Cas d’utilisation

Les tables d’héritage conviennent aux scénarios métier suivants :

- La table parente des actifs est dérivée en actifs informatiques, véhicules et mobilier de bureau
- La table parente du personnel est dérivée en employés, personnel externalisé et visiteurs
- La table parente des éléments est dérivée en tâches, anomalies et demandes
- La table parente des contrats est dérivée en contrats d’achat, contrats de vente et contrats de service

Les tables d’héritage sont appropriées lorsque ces objets possèdent des champs communs stables et que les différences entre les tables enfants se limitent principalement à un petit nombre de champs spécifiques.

## Configuration de la création

Dans la base de données principale, cliquez sur « Create collection ». Lorsque vous sélectionnez une table ordinaire ou une entrée de création prenant en charge l’héritage, vous pouvez sélectionner la table parente via `Inherits`.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la table de données est affichée dans l’interface, par exemple « Actifs informatiques », « Véhicules » ou « Mobilier de bureau ». |
| Collection name | Nom d’identification de la table de données, utilisé pour les références internes telles que l’API, les champs de relation, les autorisations et les workflows. |
| Inherits | Sélectionnez la table parente dont hériter. La table de données actuelle héritera de la structure des champs de la table parente et pourra continuer à définir ses propres champs. |
| Categories | Catégories de la table de données. Les catégories influencent uniquement l’organisation de l’interface de gestion des tables de données et ne modifient pas leur structure. |
| Description | Description de la table de données. Vous pouvez y indiquer le type de données enregistré dans cette table enfant, la table parente dont elle est dérivée et la personne qui en assure la maintenance. |
| Preset fields | Champs prédéfinis. Une table d’héritage conserve généralement aussi les champs ID, date de création, créateur, date de mise à jour et modificateur d’une table ordinaire. |

Les tables d’héritage peuvent utiliser les modes de configuration des blocs et des champs des [tables ordinaires](./general-collection.md). Pour les blocs de page, elles restent des tables de données dont les enregistrements peuvent être consultés, ajoutés, modifiés et supprimés.

:::warning Attention

Les tables d’héritage conviennent aux objets métier dont les structures sont très similaires. Lorsque les processus métier, les autorisations et les pages diffèrent fortement entre les objets, il est généralement plus clair de les séparer en tables ordinaires et de les relier à l’aide de champs de relation.

:::

### Champs intégrés

Une table d’héritage hérite des champs existants de la table parente et peut également continuer à ajouter ses propres champs.

| Source du champ | Description |
| --- | --- |
| Champs de la table parente | La table enfant hérite des champs communs de la table parente, tels que le numéro d’actif, le nom de l’actif et le responsable. |
| Champs de la table enfant | La table enfant peut continuer à définir ses propres champs spécifiques, tels que le « modèle de CPU » pour les actifs informatiques ou le « numéro d’immatriculation » pour les véhicules. |
| Champs système | Si vous conservez `Preset fields` lors de la création, la table contiendra les champs ID, date de création, créateur, date de mise à jour, modificateur, etc. |

:::warning Attention

Les champs de la table parente affectent toutes les tables enfants qui en héritent. Avant de modifier les champs de la table parente, vérifiez que les pages, les autorisations, les workflows et les API des tables enfants ne dépendent pas de ces champs.

:::

### Champ clé primaire

Comme les tables ordinaires, les tables d’héritage doivent disposer d’un champ clé primaire. Lors de la création de la table, il est recommandé de conserver le champ prédéfini ID ; le type de clé primaire par défaut est `Snowflake ID (53-bit)`.

Si une table d’héritage connectée ou synchronisée ne possède pas de clé primaire, vous devez définir « Record unique key » lors de la modification de la table de données, faute de quoi les blocs de page risquent de ne pas pouvoir consulter ou modifier correctement les enregistrements.

## Utilisation dans la configuration des pages

Les tables d’héritage peuvent être utilisées avec la plupart des blocs de page pris en charge par les tables ordinaires. Il est courant de configurer chaque table enfant séparément sous forme de bloc de tableau, de formulaire, de détails ou de kanban.

| Bloc | Utilisation |
| --- | --- |
| [Bloc tableau](../../interface-builder/blocks/data-blocks/table.md) | Consulter, filtrer, trier et traiter par lots les enregistrements de la table enfant. |
| [Bloc formulaire](../../interface-builder/blocks/data-blocks/form.md) | Ajouter ou modifier un seul enregistrement de la table enfant. |
| [Bloc de détails](../../interface-builder/blocks/data-blocks/details.md) | Consulter les détails d’un seul enregistrement de la table enfant. |
| [Bloc kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Afficher les enregistrements de la table enfant regroupés par des champs tels que le statut, l’étape ou le responsable. |

## Modification de la configuration

Dans la liste des tables de données, cliquez sur « Edit » à droite de la table d’héritage pour modifier des paramètres tels que le nom d’affichage, la catégorie, la description, le mode de pagination simplifié et « Record unique key ».

Il est déconseillé de modifier fréquemment les relations d’héritage après leur utilisation dans de nombreuses configurations métier. Les blocs de page, les champs de relation, les autorisations et les workflows peuvent tous dépendre de la structure actuelle des champs.

## Suppression d’une table de données

Dans la liste des tables de données, cliquez sur « Delete » à droite de la table d’héritage pour la supprimer.

La suppression d’une table d’héritage supprime les métadonnées Collection de cette table enfant ainsi que la table de données réelle correspondante dans la base de données principale. Avant de la supprimer, vérifiez qu’aucun bloc de page, champ de relation, autorisation, workflow ou API n’utilise encore cette table enfant.

:::danger Avertissement

La suppression d’une table d’héritage n’équivaut pas automatiquement à la suppression de sa table parente. La suppression des objets dépendants dépend des options sélectionnées dans la confirmation de suppression. Avant l’opération, vérifiez que la table parente et les autres tables enfants doivent toujours être conservées.

:::

## Liens associés

- [Table ordinaire](./general-collection.md) — Consulter la configuration générale des tables ordinaires
- [Base de données principale](./index.md) — Consulter les types de bases de données pris en charge par la base de données principale
- [Champs de table de données](../data-modeling/collection-fields/index.md) — Consulter les modes de configuration des champs