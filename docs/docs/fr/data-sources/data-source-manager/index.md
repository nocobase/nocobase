---
pkg: "@nocobase/plugin-data-source-manager"
title: "Gestion des sources de données"
description: "Plugin de gestion des sources de données : gestion de la base de données principale, des bases de données externes, des sources de données REST API et des sources de données NocoBase externes, avec une interface unifiée de gestion des sources de données."
keywords: "gestion des sources de données,base de données principale,base de données externe,synchronisation des tables de données,source de données REST API,NocoBase"
---
# Gestion des sources de données

## Présentation

NocoBase fournit un plugin de gestion des sources de données permettant de gérer les sources de données et leurs tables. Le plugin de gestion des sources de données fournit uniquement une interface de gestion pour toutes les sources de données et ne permet pas de se connecter aux sources de données. Il doit être utilisé avec différents plugins de sources de données. Les sources de données actuellement prises en charge sont les suivantes :

- [Base de données principale](/data-sources/data-source-main/) : base de données principale de NocoBase, compatible avec MySQL, PostgreSQL, MariaDB, KingbaseES et OceanBase.
- [PostgreSQL externe](/data-sources/data-source-external-postgres/) : utilise une base de données PostgreSQL externe comme source de données.
- [MySQL externe](/data-sources/data-source-external-mysql/) : utilise une base de données MySQL externe comme source de données.
- [MariaDB externe](/data-sources/data-source-external-mariadb/) : utilise une base de données MariaDB externe comme source de données.
- [MSSQL externe](/data-sources/data-source-external-mssql/) : utilise une base de données MSSQL (SQL Server) externe comme source de données.
- [KingbaseES externe](/data-sources/data-source-kingbase/) : utilise une base de données KingbaseES externe comme source de données.
- [OceanBase externe](/data-sources/external/oceanbase) : utilise une base de données OceanBase externe comme source de données.
- [Oracle externe](/data-sources/data-source-external-oracle/) : utilise une base de données Oracle externe comme source de données.
- [ClickHouse externe](/data-sources/external/clickhouse) : utilise une base de données ClickHouse externe comme source de données, généralement pour les requêtes, les statistiques et la présentation de rapports.
- [Doris externe](/data-sources/external/doris) : utilise une base de données Doris externe comme source de données, généralement pour les requêtes, les statistiques et la présentation de rapports.
- [Source de données REST API](/data-sources/data-source-rest-api/) : intègre dans NocoBase les données provenant d’une REST API.
- [NocoBase externe](/data-sources/data-source-external-nocobase/) : utilise une autre application NocoBase comme source de données externe via l’API NocoBase distante.

En outre, il est possible d’ajouter d’autres types via des plugins, notamment les différentes bases de données courantes ainsi que les plateformes fournissant une API (SDK).

## Installation

Plugin intégré, aucune installation séparée n’est nécessaire.

## Guide d’utilisation

Lors de l’installation initiale de l’application, une source de données destinée à stocker les données NocoBase est fournie par défaut. Elle est appelée base de données principale. Pour plus d’informations, consultez la documentation [Base de données principale](/data-sources/data-source-main/index.md).

### Sources de données externes

Les bases de données externes peuvent être utilisées comme sources de données. Pour plus d’informations, consultez la documentation [Bases de données externes / Présentation](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Prise en charge de la synchronisation des tables créées dans la base de données

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Il est également possible d’intégrer des données provenant d’une API HTTP. Pour plus d’informations, consultez la documentation [Source de données REST API](/data-sources/data-source-rest-api/index.md).

### Sources de données NocoBase externes

Une autre application NocoBase peut être intégrée comme source de données externe via l’API NocoBase distante. Pour plus d’informations, consultez la documentation [NocoBase externe](/data-sources/data-source-external-nocobase/index.md).