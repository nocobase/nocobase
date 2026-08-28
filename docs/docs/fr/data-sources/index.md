---
title: "Présentation des sources de données"
description: "Sources de données et modélisation des données dans NocoBase : base de données principale, bases de données externes, API REST, NocoBase externe, gestion des sources de données, tables ordinaires, tables arborescentes, tables SQL, tables de fichiers."
keywords: "source de données,modélisation des données,base de données principale,base de données externe,REST API,NocoBase externe,Collection,table arborescente,table SQL,NocoBase"
---

# Présentation générale

La modélisation des données est une étape clé de la conception d’une base de données. Elle consiste à analyser et à abstraire en profondeur les différents types de données du monde réel ainsi que leurs relations. Au cours de ce processus, nous cherchons à révéler les liens intrinsèques entre les données et à les décrire formellement sous la forme d’un modèle de données, afin de jeter les bases de la structure de la base de données d’un système d’information. NocoBase est une plateforme pilotée par un modèle de données, qui présente les caractéristiques suivantes :

## Prend en charge l’accès à des données provenant de diverses sources

Les sources de données de NocoBase peuvent être les bases de données courantes, les plateformes d’API (SDK) et les fichiers.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase fournit le [plug-in de gestion des sources de données](./data-source-manager/index.md), qui permet de gérer les différentes sources de données et leurs tables. Le plug-in de gestion des sources de données fournit uniquement une interface de gestion pour toutes les sources de données ; il ne permet pas à lui seul de se connecter aux sources de données et doit être utilisé conjointement avec différents plug-ins de sources de données. Les sources de données actuellement prises en charge sont les suivantes :

- [Source de données principale](./data-source-main/index.md) : base de données principale de NocoBase, prenant en charge PostgreSQL, MySQL, MariaDB, KingbaseES et OceanBase.
- [PostgreSQL externe](./data-source-external-postgres/index.md) : connexion à une base de données PostgreSQL existante.
- [MySQL externe](./data-source-external-mysql/index.md) : connexion à une base de données MySQL existante.
- [MariaDB externe](./data-source-external-mariadb/index.md) : connexion à une base de données MariaDB existante.
- [MSSQL externe](./data-source-external-mssql/index.md) : connexion à une base de données SQL Server existante.
- [KingbaseES externe](./data-source-kingbase/index.md) : connexion à une base de données KingbaseES existante.
- [OceanBase externe](./external/oceanbase.md) : connexion à une base de données OceanBase existante.
- [Oracle externe](./data-source-external-oracle/index.md) : connexion à une base de données Oracle existante.
- [ClickHouse externe](./external/clickhouse.md) : connexion à une base de données ClickHouse existante.
- [Doris externe](./external/doris.md) : connexion à une base de données Doris existante.
- [Source de données REST API](./data-source-rest-api/index.md) : mappage de l’API REST d’un système tiers en tant que source de données.
- [Source de données NocoBase externe](./data-source-external-nocobase/index.md) : connexion aux tables de données d’une autre application NocoBase.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Fournit divers outils de modélisation des données

**Interface simplifiée de gestion des tables de données** : permet de créer différents modèles (tables de données) ou de se connecter à des modèles (tables de données) existants.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface de visualisation de type diagramme ER** : permet d’extraire les entités et leurs relations à partir des besoins des utilisateurs et de l’activité. Elle offre une manière intuitive et facile à comprendre de décrire le modèle de données. Le diagramme ER permet de mieux comprendre les principales entités de données du système et les liens qui les unissent.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Prend en charge la création de différents types de tables de données

| Table de données | Description |
| - | - |
| [Table de données ordinaire](/data-sources/data-source-main/general-collection) | Inclut les champs système couramment utilisés |
| [Table de données de calendrier](/data-sources/calendar/calendar-collection) | Permet de créer des tables d’événements liés au calendrier |
| [Table de commentaires](/data-sources/collection-comment/) | Permet de stocker des commentaires ou des retours sur les données |
| [Table de structure arborescente](/data-sources/collection-tree/) | Table de structure arborescente prenant actuellement uniquement en charge la conception par liste d’adjacence |
| [Table de données de fichiers](/data-sources/file-manager/file-collection) | Permet de gérer le stockage des fichiers |
| [Connexion à une vue de base de données](/data-sources/collection-view/) | Permet de se connecter à une vue de base de données existante |
| [Table de données SQL](/data-sources/collection-sql/) | Ne constitue pas une table réelle de la base de données, mais permet d’afficher rapidement et de manière structurée une requête SQL |
| [Connexion à des données externes](/data-sources/collection-fdw) | Connexion à des tables de données distantes basée sur la technologie FDW des bases de données |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Pour plus d’informations, consultez le chapitre « [Tables de données / Présentation](/data-sources/data-modeling/collection) »

## Fournit un grand nombre de types de champs

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Pour plus d’informations, consultez le chapitre « [Champs des tables de données / Présentation](/data-sources/data-modeling/collection-fields/) »