---
pkg: "@nocobase/plugin-calendar"
title: "Tableau calendrier"
description: "Le tableau calendrier sert à enregistrer des données comportant une plage horaire, telles que des réunions, des plannings, des cours ou des permanences, et permet d'afficher et de modifier les événements avec le bloc calendrier."
keywords: "Tableau calendrier,Calendar Collection,événements de calendrier,événements récurrents,bloc calendrier,NocoBase"
---

# Tableau calendrier

## Présentation

Le tableau calendrier convient à l'enregistrement de données comportant une plage horaire, comme les réservations de salles de réunion, les plannings de projets, les emplois du temps des cours, les plannings de permanence ou les calendriers d'activités. Il s'agit essentiellement d'un tableau de données, mais certains champs liés aux événements de calendrier sont préconfigurés afin de faciliter son utilisation ultérieure avec le bloc calendrier.

Les tableaux calendrier peuvent uniquement être créés depuis la page de la base de données principale. Les bases de données externes, les sources de données REST API et les sources de données NocoBase externes ne prennent pas en charge la création de tableaux calendrier.

## Cas d'utilisation

Les tableaux calendrier conviennent notamment aux scénarios métier suivants :

- Réservation de salles de réunion, de véhicules et d'équipements
- Planification de projets, de tâches et de jalons
- Emplois du temps des cours, programmes de formation et calendriers d'activités
- Plannings de permanence, relevés de rotation et programmes d'inspection
- Enregistrements d'événements à consulter par jour, par semaine ou par mois

## Création et configuration

Dans la base de données principale, cliquez sur « Create collection », puis sélectionnez « Calendar collection » pour créer un tableau calendrier.

La configuration d'un tableau calendrier est globalement identique à celle d'un tableau standard. `Preset fields` sert à contrôler les champs système couramment utilisés, tandis que le tableau calendrier contient également des champs préconfigurés pour enregistrer les événements récurrents.

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel le tableau de données s'affiche dans l'interface, par exemple « Réservation de salles de réunion », « Emploi du temps des cours » ou « Planning de permanence ». |
| Collection name | Nom d'identification du tableau de données, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. |
| Inherits | Sélectionnez le tableau parent dont hériter. Visible uniquement lorsque la base de données principale est PostgreSQL. |
| Categories | Catégories du tableau de données. Les catégories influencent uniquement l'organisation de l'interface de gestion des tableaux de données et ne modifient pas leur structure. |
| Description | Description du tableau de données. Vous pouvez indiquer quels événements ce tableau calendrier enregistre, qui en assure la maintenance et à quels processus métier il est associé. |
| Preset fields | Champs prédéfinis. Lors de la création d'un tableau calendrier, il est recommandé de conserver les champs système et les champs intégrés au tableau calendrier. |

### Champs intégrés

Après sa création, un tableau calendrier contient généralement les champs intégrés suivants. `cron` et `exclude` servent à enregistrer les règles de récurrence et les dates exclues.

| Champ | Nom du champ | Description |
| --- | --- | --- |
| ID | `id` | Champ de clé primaire par défaut, utilisé pour identifier de manière unique un enregistrement d'événement. |
| Heure de création | `createdAt` | Enregistre automatiquement la date et l'heure de création de l'enregistrement d'événement. |
| Créateur | `createdBy` | Enregistre automatiquement l'utilisateur ayant créé l'enregistrement d'événement. |
| Heure de mise à jour | `updatedAt` | Enregistre automatiquement la date et l'heure de la dernière mise à jour de l'enregistrement d'événement. |
| Modificateur | `updatedBy` | Enregistre automatiquement l'utilisateur ayant effectué la dernière mise à jour de l'enregistrement d'événement. |
| Tri | `sort` | Enregistre la valeur de tri des enregistrements d'événements afin de prendre en charge des fonctionnalités telles que le tri par glisser-déposer. |
| Repeats | `cron` | Enregistre les règles de récurrence des événements, par exemple une répétition quotidienne, hebdomadaire, mensuelle ou annuelle. |
| Exclude | `exclude` | Enregistre les dates exclues des événements récurrents, généralement gérées automatiquement lors des interactions avec le calendrier. |
| Espace | `space` | Disponible après l'activation du [plugin multi-espace](../../multi-app/multi-space/index.md), il sert à isoler les données par espace. Il n'apparaît pas lorsque la fonctionnalité multi-espace n'est pas activée. |

Lorsqu'un bloc calendrier utilise un tableau calendrier, il faut également définir les champs métier utilisés pour afficher les événements :

| Configuration | Description |
| --- | --- |
| Champ de titre | Détermine le titre de l'événement dans le calendrier, par exemple « Sujet de la réunion » ou « Nom du cours ». |
| Champ de date de début | Détermine l'heure de début de l'événement. Il s'agit généralement d'un champ de date et d'heure. |
| Champ de date de fin | Détermine l'heure de fin de l'événement. Il s'agit généralement d'un champ de date et d'heure. |

:::warning Attention

`cron` et `exclude` sont généralement gérés par la fonctionnalité de calendrier ; il n'est pas recommandé de les modifier directement comme des champs métier ordinaires. Les champs de titre, de date de début et de date de fin doivent être créés et configurés en fonction des besoins métier, faute de quoi le bloc calendrier ne pourra pas afficher correctement les événements.

:::

### Champ de clé primaire

Comme les tableaux standard, les tableaux calendrier doivent comporter un champ de clé primaire. Lors de la création du tableau, il est recommandé de conserver le champ prédéfini ID, dont le type de clé primaire par défaut est `Snowflake ID (53-bit)`.

Si un tableau calendrier ne possède pas de clé primaire, définissez « Record unique key » lors de la modification du tableau de données ; sinon, le bloc calendrier risque de ne pas pouvoir ouvrir, modifier ou localiser correctement les enregistrements d'événements.

## Modification de la configuration

Dans la liste des tableaux de données, cliquez sur « Edit » à droite du tableau calendrier pour modifier son nom d'affichage, ses catégories, sa description, son mode de pagination simplifié et des paramètres tels que « Record unique key ».

Les champs intégrés `cron`, `exclude`, etc. du tableau calendrier sont généralement utilisés par la fonctionnalité de calendrier ; il n'est pas recommandé de leur attribuer d'autres significations métier. Pour ajouter des informations sur les événements, vous pouvez créer des champs métier ordinaires, tels que le lieu, les participants, la salle de réunion ou le statut.

## Suppression du tableau de données

Dans la liste des tableaux de données, cliquez sur « Delete » à droite du tableau calendrier pour le supprimer.

La suppression d'un tableau calendrier supprime les enregistrements d'événements, les données de ses champs intégrés et les métadonnées Collection associées. Avant la suppression, vérifiez que les blocs calendrier et tableau, les autorisations, les workflows et les API ne dépendent plus de ce tableau.

:::danger Avertissement

Les tableaux calendrier contiennent généralement des données de planning, de réservation et de permanence. Après leur suppression, les événements historiques et les règles de récurrence sont perdus. Avant l'opération, vérifiez que les données ont été sauvegardées ou qu'elles ne sont plus nécessaires.

:::

## Utilisation dans la configuration des pages

Les tableaux calendrier peuvent utiliser la plupart des blocs de données des [tableaux standard](../data-source-main/general-collection.md) pour créer, consulter, modifier et supprimer des données. Ils sont également généralement utilisés avec le bloc calendrier :

| Bloc | Utilisation |
| --- | --- |
| [Bloc calendrier](../../interface-builder/blocks/data-blocks/calendar.md) | Affiche les enregistrements d'événements selon des vues quotidiennes, hebdomadaires ou mensuelles, et permet de créer, consulter et modifier des événements dans le calendrier. |
| [Bloc tableau](../../interface-builder/blocks/data-blocks/table.md) | Permet de consulter, filtrer et gérer en masse les enregistrements d'événements sous forme de liste. |
| [Bloc formulaire](../../interface-builder/blocks/data-blocks/form.md) | Permet d'ajouter ou de modifier un seul enregistrement d'événement. |
| [Bloc détail](../../interface-builder/blocks/data-blocks/details.md) | Permet de consulter les informations détaillées d'un seul événement. |

## Liens associés

- [Tableau standard](../data-source-main/general-collection.md) — Consulter la configuration générale et le mode d'utilisation des blocs
- [Champs de date et d'heure](../data-modeling/collection-fields/datetime/datetime.md) — Créer les champs correspondant aux heures de début et de fin des événements
- [Bloc calendrier](../../interface-builder/blocks/data-blocks/calendar.md) — Afficher les données sous forme de calendrier dans une page
- [Multi-espace](../../multi-app/multi-space/index.md) — En savoir plus sur les champs d'espace et l'isolation des données par espace