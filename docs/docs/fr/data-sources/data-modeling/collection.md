:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble des collections

NocoBase propose un DSL unique pour décrire la structure des données, appelé `collection`. Cela permet d'unifier les structures de données provenant de diverses sources, offrant ainsi une base fiable pour la gestion, l'analyse et l'application des données.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Pour faciliter l'utilisation de divers modèles de données, NocoBase prend en charge la création de différents types de `collections` :

- [Collection générale](/data-sources/data-source-main/general-collection) : Intègre les champs système courants ;
- [Collection d'héritage](/data-sources/data-source-main/inheritance-collection) : Vous pouvez créer une `collection` parente, puis en dériver une `collection` enfant. La `collection` enfant héritera de la structure de la `collection` parente tout en pouvant définir ses propres colonnes.
- [Collection arborescente](/data-sources/collection-tree) : Une `collection` à structure arborescente, qui ne prend actuellement en charge que la conception par liste d'adjacence ;
- [Collection de calendrier](/data-sources/calendar/calendar-collection) : Utilisée pour créer des `collections` d'événements liées aux calendriers ;
- [Collection de fichiers](/data-sources/file-manager/file-collection) : Utilisée pour la gestion du stockage de fichiers ;
- : Utilisée pour les scénarios d'expressions dynamiques dans les flux de travail ;
- [Collection SQL](/data-sources/collection-sql) : Il ne s'agit pas d'une `collection` de base de données réelle, mais elle permet de présenter rapidement et de manière structurée les requêtes SQL ;
- [Collection de vues](/data-sources/collection-view) : Se connecte aux vues de base de données existantes ;
- [Collection externe](/data-sources/collection-fdw) : Permet au système de base de données d'accéder et d'interroger directement les données des sources de données externes, basée sur la technologie FDW.