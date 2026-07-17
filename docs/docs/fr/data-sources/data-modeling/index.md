---
title: "Présentation de la modélisation des données"
description: "Modélisation des données : concevoir des modèles de données, connecter différentes sources de données, visualiser des diagrammes ER, créer des tables de données et prendre en charge les bases de données principales et externes."
keywords: "Modélisation des données,Collection,modèle de données,diagramme ER,base de données principale,base de données externe,NocoBase"
---

# Présentation

La modélisation des données est une étape clé de la conception d’une base de données. Elle consiste à analyser et à abstraire en profondeur les différents types de données du monde réel ainsi que leurs relations. Au cours de ce processus, nous cherchons à révéler les liens intrinsèques entre les données et à les décrire formellement sous la forme d’un modèle de données, afin de poser les bases de la structure de la base de données d’un système d’information. NocoBase est une plateforme pilotée par un modèle de données, qui présente les caractéristiques suivantes :

## Prise en charge de sources de données variées

Les sources de données de NocoBase peuvent être différents types courants de bases de données, des plateformes d’API (SDK) et des fichiers.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase fournit le [plug-in de gestion des sources de données](/data-sources/data-source-manager), qui permet de gérer les différentes sources de données et leurs tables. Le plug-in de gestion des sources de données fournit uniquement une interface de gestion pour toutes les sources de données et ne permet pas de s’y connecter directement ; il doit être utilisé avec les plug-ins correspondant aux différentes sources de données. Les sources de données actuellement prises en charge sont les suivantes :

- [Base de données principale](/data-sources/data-source-main) : base de données principale de NocoBase, prenant en charge les bases de données relationnelles telles que MySQL, PostgreSQL et MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase) : utilise une base de données KingbaseES comme source de données, qui peut servir de base de données principale ou externe.
- [MySQL externe](/data-sources/data-source-external-mysql) : utilise une base de données MySQL externe comme source de données.
- [MariaDB externe](/data-sources/data-source-external-mariadb) : utilise une base de données MariaDB externe comme source de données.
- [PostgreSQL externe](/data-sources/data-source-external-postgres) : utilise une base de données PostgreSQL externe comme source de données.
- [MSSQL externe](/data-sources/data-source-external-mssql) : utilise une base de données MSSQL (SQL Server) externe comme source de données.
- [Oracle externe](/data-sources/data-source-external-oracle) : utilise une base de données Oracle externe comme source de données.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Fournit divers outils de modélisation des données

**Interface simplifiée de gestion des tables de données** : permet de créer différents modèles (tables de données) ou de connecter des modèles (tables de données) existants.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface de visualisation de type diagramme ER** : permet d’extraire les entités et leurs relations à partir des besoins des utilisateurs et de l’activité. Elle fournit une manière intuitive et facile à comprendre de décrire le modèle de données. Le diagramme ER permet de mieux comprendre les principales entités de données du système et les liens qui les unissent.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Prend en charge la création de différents types de tables de données

| Table de données | Description |
| - | - |
| [Table de données standard](/data-sources/data-source-main/general-collection) | Contient les champs système couramment utilisés |
| [Table de données de calendrier](/data-sources/calendar/calendar-collection) | Permet de créer des tables d’événements associés à un calendrier |
| Table de commentaires | Permet de stocker des commentaires ou des retours sur les données |
| [Table de structure arborescente](/data-sources/collection-tree) | Table de structure arborescente, prenant actuellement uniquement en charge la conception par table d’adjacence |
| [Table de données de fichiers](/data-sources/file-manager/file-collection) | Permet de gérer le stockage des fichiers |
| [Table de données SQL](/data-sources/collection-sql) | Ne constitue pas une table réelle de la base de données, mais permet d’afficher rapidement et de manière structurée une requête SQL |
| [Connexion à une vue de base de données](/data-sources/collection-view) | Permet de se connecter à une vue de base de données existante |
| Table d’expressions | Permet de gérer les scénarios d’expressions dynamiques des workflows |
| [Connexion à des données externes](/data-sources/collection-fdw) | Permet de se connecter à des tables de données distantes grâce à la technologie FDW basée sur les bases de données |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Pour plus d’informations, consultez le chapitre « [Tables de données / Présentation](/data-sources/data-modeling/collection) ».

## Fournit de nombreux types de champs

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Pour plus d’informations, consultez le chapitre « [Champs des tables de données / Présentation](/data-sources/data-modeling/collection-fields) ».