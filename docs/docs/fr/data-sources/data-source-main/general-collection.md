---
pkg: "@nocobase/plugin-data-source-main"
title: "Table ordinaire"
description: "Les tables ordinaires sont adaptées au stockage des données métier courantes telles que les clients, les commandes, les contrats, les tickets, les projets et les tâches. Elles prennent en charge les champs système courants, la configuration de la clé primaire et la création de blocs de page."
keywords: "Table ordinaire,General Collection,champs système,table de données,NocoBase"
---

# Table ordinaire

## Présentation

La table ordinaire est le type de table de données le plus couramment utilisé. Elle convient au stockage des données métier courantes telles que les clients, les commandes, les contrats, les tickets, les notes de frais, les projets et les tâches. Lorsque la plupart des objets métier ne nécessitent pas de structure particulière, une table ordinaire suffit généralement.

Les tables ordinaires peuvent provenir des sources de données suivantes :

- Nouvelles tables créées dans la base de données principale
- Tables réelles existantes synchronisées depuis la base de données principale
- Tables réelles existantes connectées depuis une base de données externe
- Ressources mappées depuis une API REST
- Tables de données provenant d’une application NocoBase externe

Dans NocoBase, ces données sont toutes utilisées comme des tables ordinaires. La différence est la suivante : les tables ordinaires de la base de données principale peuvent être créées et gérées par NocoBase, y compris leur structure réelle ; les tables ordinaires des sources de données externes ne font généralement que lire une structure existante, qui continue d’être gérée par le système externe.

## Cas d’utilisation

Les tables ordinaires conviennent notamment aux scénarios métier suivants :

- Données CRM : clients, contacts, opportunités, contrats, etc.
- Données transactionnelles : commandes, bons d’expédition, bons de retour, factures, etc.
- Données de collaboration : tickets, tâches, projets, besoins, etc.
- Données de processus : notes de frais, demandes d’achat, demandes de paiement, etc.
- Données de référence : équipements, actifs, produits, magasins, etc.



## Création et configuration

Dans la base de données principale, cliquez sur « Create collection », puis sélectionnez « General collection » pour créer une table ordinaire.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom affiché de la table de données dans l’interface, par exemple « Clients », « Commandes » ou « Pièces jointes de contrat ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Collection name | Nom d’identification de la table de données, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il est généré automatiquement, mais peut également être modifié manuellement ; seuls les lettres, les chiffres et les traits de soulignement sont autorisés, et le nom doit commencer par une lettre. |
| Categories | Catégories de la table de données. Les catégories influencent uniquement l’organisation de l’interface de gestion des tables de données, sans modifier leur structure. Lorsque le nombre de tables est important, il est recommandé de les classer par module métier, par exemple « Gestion des clients », « Gestion de projets » ou « Finance ». |
| Description | Description de la table de données. Vous pouvez y préciser quelles données sont stockées, qui les gère et à quels processus métier elles sont liées, afin de faciliter la maintenance ultérieure. |
| Use simple pagination mode | Mode de pagination simple. Lorsqu’il est activé, la pagination des blocs de tableau ignore le calcul du nombre total d’enregistrements. Ce mode convient aux tables contenant de grandes quantités de données et permet de réduire la charge des requêtes. |
| Preset fields | Champs prédéfinis. Lors de la création de la table, vous pouvez choisir d’ajouter automatiquement les champs courants tels que l’ID, la date de création, le créateur, la date de mise à jour et le dernier modificateur. Il est recommandé de conserver ces champs dans les tables métier ordinaires. |

### Champs intégrés

Lors de la création d’une table ordinaire, vous pouvez utiliser `Preset fields` pour ajouter automatiquement les champs système courants.

| Champ | Nom du champ | Description |
| --- | --- | --- |
| ID | `id` | Champ de clé primaire par défaut, utilisé pour identifier de manière unique un enregistrement. Le type de clé primaire par défaut est `Snowflake ID (53-bit)`. |
| Date de création | `createdAt` | Enregistre automatiquement la date et l’heure de création de l’enregistrement. Ce champ est souvent utilisé pour le tri, le filtrage, l’audit et les conditions de workflow. |
| Créateur | `createdBy` | Enregistre automatiquement l’utilisateur qui a créé l’enregistrement. Il est souvent utilisé pour « afficher uniquement les données que j’ai créées », le contrôle des autorisations et le suivi des responsabilités. |
| Date de mise à jour | `updatedAt` | Enregistre automatiquement la date et l’heure de la dernière modification de l’enregistrement. Ce champ permet notamment de déterminer si les données ont été modifiées. |
| Dernier modificateur | `updatedBy` | Enregistre automatiquement l’utilisateur ayant effectué la dernière modification de l’enregistrement. Il est souvent utilisé dans les scénarios d’audit et de collaboration. |
| [Espace](../../multi-app/multi-space/index.md) | `space` | Disponible après l’activation du [plugin multi-espace](../../multi-app/multi-space/index.md), il permet d’isoler les données par espace. Il n’apparaît pas dans les champs prédéfinis des tables ordinaires lorsque le multi-espace n’est pas activé. |

### Champ de clé primaire

**Primary key** désigne le champ de clé primaire. Il sert à identifier de manière unique un enregistrement au niveau de la base de données. Lors de la création d’une table, il est recommandé de conserver le champ ID prédéfini ; le type de clé primaire par défaut est `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Placez le curseur sur Interface du champ ID pour sélectionner un autre type de clé primaire.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Les types de clé primaire disponibles sont :

- [Texte](../data-modeling/collection-fields/basic/input.md)
- [Entier](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Attention

Une table de données sans clé primaire doit définir « Record unique key » lors de la modification de la table de données. Sinon, il sera impossible de créer des blocs dans les pages et les enregistrements ne pourront pas être consultés ou modifiés correctement.

:::


## Utilisation dans la configuration des pages

Les tables ordinaires peuvent être utilisées avec la plupart des blocs de données et des blocs de filtrage.

| Bloc | Utilisation |
| --- | --- |
| [Bloc de tableau](../../interface-builder/blocks/data-blocks/table.md) | Consulter, filtrer, trier et traiter des enregistrements par lots. |
| [Bloc de formulaire](../../interface-builder/blocks/data-blocks/form.md) | Ajouter ou modifier un seul enregistrement. |
| [Bloc de détails](../../interface-builder/blocks/data-blocks/details.md) | Consulter les détails d’un seul enregistrement. |
| [Bloc de liste](../../interface-builder/blocks/data-blocks/list.md) | Afficher les enregistrements sous forme de liste. |
| [Bloc de cartes en grille](../../interface-builder/blocks/data-blocks/grid-card.md) | Afficher sous forme de grille de cartes des enregistrements tels que des images, des fichiers, des produits ou des actifs. |
| [Bloc de tableau Kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Regrouper et afficher les enregistrements selon des champs tels que le statut, l’étape ou le responsable. |
| [Bloc de calendrier](../../interface-builder/blocks/data-blocks/calendar.md) | Afficher les enregistrements selon une date ou une période. |
| [Bloc de graphiques](../../interface-builder/blocks/data-blocks/chart.md) | Générer des graphiques statistiques à partir des enregistrements. |
| [Bloc de carte](../../interface-builder/blocks/data-blocks/map.md) | Afficher les enregistrements selon leur position géographique. |
| [Bloc de diagramme de Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Afficher les plans de projet et la planification des tâches selon les dates de début et de fin. |
| [Bloc de filtrage par formulaire](../../interface-builder/blocks/filter-blocks/form.md) | Filtrer les données des blocs de la page à l’aide de critères de formulaire. |
| [Bloc de filtrage arborescent](../../interface-builder/blocks/filter-blocks/tree.md) | Filtrer les données des blocs de la page à l’aide d’une structure arborescente, notamment pour les catégories, les organisations ou les zones géographiques. |

## Modification de la configuration

Dans la liste des tables de données, cliquez sur « Edit » à droite d’une table ordinaire pour modifier sa configuration de base. La modification d’une table de données sert principalement à ajuster ses métadonnées et certains paramètres d’exécution ; elle ne permet pas de modifier en masse la structure des champs.

Pour ajouter un champ, modifier son type, changer son type d’interface ou le supprimer, accédez à « Configure fields ».

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Collection display name | Oui | Nom affiché de la table de données dans l’interface, par exemple « Clients », « Commandes » ou « Pièces jointes de contrat ». La modification n’affecte que l’affichage dans l’interface et ne change pas le nom d’identification de la table. |
| Collection name | Non | Nom d’identification de la table de données, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il ne peut pas être modifié dans le formulaire d’édition après la création. |
| Inherits | Selon les conditions | Sélection de la table parente à hériter. Cette option est disponible uniquement si la base de données principale est PostgreSQL et si cette configuration est affichée dans l’interface. Avant de modifier la relation d’héritage d’une table existante, vérifiez que la structure des champs, les blocs de page, les autorisations et les workflows ne dépendent pas de la structure d’origine. |
| Categories | Oui | Catégories de la table de données. Les catégories influencent uniquement l’organisation de l’interface de gestion des tables de données, sans modifier leur structure. |
| Description | Oui | Description de la table de données. Elle peut servir à préciser son objectif, son responsable de maintenance, sa source de données et les processus métier associés. |
| Use simple pagination mode | Oui | Mode de pagination simple. Lorsqu’il est activé, la pagination des blocs de tableau ignore le calcul du nombre total d’enregistrements. Ce mode convient aux tables contenant de grandes quantités de données. |
| Record unique key | Oui | Identifiant unique de l’enregistrement. Il sert à localiser un enregistrement dans un bloc ; il s’agit généralement de la clé primaire ou d’un champ unique. Les tables sans clé primaire doivent obligatoirement être configurées, faute de quoi les blocs ne pourront pas être créés correctement et les enregistrements ne pourront pas être consultés ou modifiés. |

:::warning Attention

La modification d’une table de données n’ajuste pas automatiquement les champs existants. `Preset fields` ne prend effet qu’au moment de la création de la table ; si vous devez ajouter ultérieurement les champs de date de création, de créateur, de date de mise à jour et de dernier modificateur, ajoutez-les séparément dans « Configure fields ».

:::

## Suppression d’une table de données

Dans la liste des tables de données, cliquez sur « Delete » à droite d’une table ordinaire pour la supprimer. Les tables ordinaires de la base de données principale peuvent également être sélectionnées en masse, puis supprimées en une seule fois.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Une seconde confirmation s’affiche lors de la suppression. Après confirmation, NocoBase supprime les métadonnées Collection de cette table ordinaire ainsi que la table de données réelle et les données qu’elle contient dans la base de données principale.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

La boîte de dialogue de confirmation de suppression propose une option facultative : supprimer automatiquement les objets qui dépendent de cette table de données. Lorsqu’elle est activée, NocoBase tente également de supprimer les objets de base de données qui dépendent de cette table, tels que les vues de base de données créées à partir de celle-ci, ainsi que les autres objets qui dépendent à leur tour de ces objets.

:::danger Avertissement

La suppression d’une table ordinaire est une opération à haut risque. Après la suppression, la structure de la table, ses données, les métadonnées des champs, ainsi que les blocs de page, les champs de relation, les autorisations, les workflows et les appels d’API qui en dépendent peuvent devenir inutilisables. Avant de cocher la suppression automatique des objets dépendants, vérifiez que ces objets peuvent également être supprimés.

:::
