:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

La modélisation des données est une étape clé dans la conception des bases de données. Elle implique un processus d'analyse approfondie et d'abstraction des différents types de données du monde réel et de leurs interrelations. Au cours de ce processus, nous cherchons à révéler les liens intrinsèques entre les données et à les formaliser en modèles de données, jetant ainsi les bases de la structure de la base de données du système d'information. NocoBase est une plateforme axée sur les modèles de données, qui présente les caractéristiques suivantes :

## Prend en charge l'accès aux données de diverses sources

Les sources de données de NocoBase peuvent provenir de diverses origines courantes : bases de données, plateformes API (SDK) et fichiers.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase propose un [plugin de gestion des sources de données](/data-sources/data-source-manager) pour gérer les différentes sources de données et leurs collections. Ce plugin fournit uniquement une interface de gestion pour toutes les sources de données, mais n'offre pas la capacité d'y accéder directement. Il doit être utilisé en conjonction avec divers plugins de source de données. Les sources de données actuellement prises en charge incluent :

- [Base de données principale](/data-sources/data-source-main) : La base de données principale de NocoBase, prenant en charge les bases de données relationnelles telles que MySQL, PostgreSQL et MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase) : Utilise la base de données KingbaseES comme source de données, qui peut être utilisée comme base de données principale ou externe.
- [MySQL externe](/data-sources/data-source-external-mysql) : Utilise une base de données MySQL externe comme source de données.
- [MariaDB externe](/data-sources/data-source-external-mariadb) : Utilise une base de données MariaDB externe comme source de données.
- [PostgreSQL externe](/data-sources/data-source-external-postgres) : Utilise une base de données PostgreSQL externe comme source de données.
- [MSSQL externe](/data-sources/data-source-external-mssql) : Utilise une base de données MSSQL (SQL Server) externe comme source de données.
- [Oracle externe](/data-sources/data-source-external-oracle) : Utilise une base de données Oracle externe comme source de données.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Propose une variété d'outils de modélisation des données

**Interface de gestion des collections simplifiée** : Pour créer diverses collections (modèles de données) ou se connecter à des collections existantes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface visuelle de type diagramme ER** : Pour extraire les entités et leurs relations à partir des exigences des utilisateurs et des besoins métier. Elle offre un moyen intuitif et facile à comprendre de décrire les modèles de données. Grâce aux diagrammes ER, vous pouvez comprendre plus clairement les principales entités de données du système et leurs liens.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Prend en charge divers types de collections

| Collection | Description |
| - | - |
| [Collection générale](/data-sources/data-source-main/general-collection) | Champs système courants intégrés. |
| [Collection de calendrier](/data-sources/calendar/calendar-collection) | Pour créer des collections d'événements liées au calendrier. |
| Collection de commentaires | Pour stocker les commentaires ou retours sur les données. |
| [Collection arborescente](/data-sources/collection-tree) | Collection structurée en arbre, ne prend actuellement en charge que le modèle de liste d'adjacence. |
| [Collection de fichiers](/data-sources/file-manager/file-collection) | Pour la gestion du stockage de fichiers. |
| [Collection SQL](/data-sources/collection-sql) | Pas une collection de base de données réelle, mais visualise rapidement les requêtes SQL de manière structurée. |
| [Connexion à une vue de base de données](/data-sources/collection-view) | Se connecte aux vues de base de données existantes. |
| Collection d'expressions | Utilisée pour les scénarios d'expressions dynamiques dans les flux de travail. |
| [Connexion à des données externes](/data-sources/collection-fdw) | Permet au système de base de données d'accéder et d'interroger directement les données dans des sources de données externes basées sur la technologie FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Pour plus de détails, consultez la section « [Collection / Vue d'ensemble](/data-sources/data-modeling/collection) ».

## Propose une grande variété de types de champs

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Pour plus de détails, consultez la section « [Champs de collection / Vue d'ensemble](/data-sources/data-modeling/collection-fields) ».