:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

La modélisation des données est une étape cruciale lors de la conception de bases de données. Elle implique une analyse approfondie et une abstraction des différents types de données du monde réel et de leurs interrelations. Ce processus vise à révéler les liens intrinsèques entre les données et à les formaliser en modèles de données, jetant ainsi les bases de la structure de la base de données d'un système d'information. NocoBase est une plateforme axée sur les modèles de données, offrant les caractéristiques suivantes :

## Prise en charge de l'accès aux données de diverses sources

Les sources de données de NocoBase peuvent être des bases de données courantes, des plateformes API (SDK) et des fichiers.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase propose un [plugin de gestion des sources de données](/data-sources/data-source-manager) pour gérer les différentes sources de données et leurs collections. Le plugin de gestion des sources de données fournit uniquement une interface d'administration pour toutes les sources de données ; il ne permet pas d'accéder directement aux sources de données. Il doit être utilisé en conjonction avec divers plugins de sources de données. Les sources de données actuellement prises en charge incluent :

- [Base de données principale](/data-sources/data-source-main) : La base de données principale de NocoBase, prenant en charge les bases de données relationnelles telles que MySQL, PostgreSQL et MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase) : Utilise la base de données KingbaseES comme source de données, pouvant servir de base de données principale ou externe.
- [MySQL externe](/data-sources/data-source-external-mysql) : Utilise une base de données MySQL externe comme source de données.
- [MariaDB externe](/data-sources/data-source-external-mariadb) : Utilise une base de données MariaDB externe comme source de données.
- [PostgreSQL externe](/data-sources/data-source-external-postgres) : Utilise une base de données PostgreSQL externe comme source de données.
- [MSSQL externe](/data-sources/data-source-external-mssql) : Utilise une base de données MSSQL (SQL Server) externe comme source de données.
- [Oracle externe](/data-sources/data-source-external-oracle) : Utilise une base de données Oracle externe comme source de données.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Propose une variété d'outils de modélisation des données

**Interface de gestion des collections simplifiée** : Permet de créer diverses collections (modèles de données) ou de se connecter à des collections existantes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface visuelle de type diagramme ER** : Permet d'extraire les entités et leurs relations à partir des exigences utilisateur et métier. Elle offre une manière intuitive et facile à comprendre de décrire les modèles de données. Grâce aux diagrammes ER, vous pouvez saisir plus clairement les principales entités de données du système et leurs interconnexions.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Prend en charge divers types de collections

| Collection | Description |
| - | - |
| [Collection générale](/data-sources/data-source-main/general-collection) | Intègre les champs système courants. |
| [Collection de calendrier](/data-sources/calendar/calendar-collection) | Permet de créer des collections d'événements liées aux calendriers. |
| Collection de commentaires | Sert à stocker les commentaires ou retours sur les données. |
| [Collection arborescente](/data-sources/collection-tree) | Une collection structurée en arbre, qui ne prend actuellement en charge que le modèle de liste d'adjacence. |
| [Collection de fichiers](/data-sources/file-manager/file-collection) | Utilisée pour la gestion du stockage de fichiers. |
| [Collection SQL](/data-sources/collection-sql) | Il ne s'agit pas d'une table de base de données réelle, mais d'une manière rapide de visualiser les requêtes SQL de manière structurée. |
| [Connexion à une vue de base de données](/data-sources/collection-view) | Permet de se connecter à des vues de base de données existantes. |
| Collection d'expressions | Utilisée pour les scénarios d'expressions dynamiques dans les flux de travail. |
| [Connexion à des données externes](/data-sources/collection-fdw) | Permet au système de base de données d'accéder et d'interroger directement les données de sources de données externes, basée sur la technologie FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Pour plus de détails, consultez la section « [Collection / Vue d'ensemble](/data-sources/data-modeling/collection) ».

## Propose une grande variété de types de champs

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Pour plus de détails, consultez la section « [Champs de collection / Vue d'ensemble](/data-sources/data-modeling/collection-fields) ».