---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Gestion des sources de données

## Introduction

NocoBase propose un plugin de gestion des sources de données, conçu pour administrer les sources de données et leurs collections. Ce plugin fournit uniquement une interface d'administration pour toutes les sources de données ; il n'offre pas la capacité d'accéder directement aux sources de données. Il doit être utilisé en conjonction avec divers plugins de source de données. Voici les sources de données actuellement prises en charge :

- [Base de données principale](/data-sources/data-source-main) : La base de données principale de NocoBase, qui prend en charge les bases de données relationnelles telles que MySQL, PostgreSQL et MariaDB.
- [MySQL externe](/data-sources/data-source-external-mysql) : Utilise une base de données MySQL externe comme source de données.
- [MariaDB externe](/data-sources/data-source-external-mariadb) : Utilise une base de données MariaDB externe comme source de données.
- [PostgreSQL externe](/data-sources/data-source-external-postgres) : Utilise une base de données PostgreSQL externe comme source de données.
- [MSSQL externe](/data-sources/data-source-external-mssql) : Utilise une base de données MSSQL (SQL Server) externe comme source de données.
- [Oracle externe](/data-sources/data-source-external-oracle) : Utilise une base de données Oracle externe comme source de données.

De plus, vous pouvez étendre les types de sources de données via des plugins. Il peut s'agir de bases de données courantes ou de plateformes offrant des API (SDK).

## Installation

C'est un plugin intégré, aucune installation séparée n'est requise.

## Utilisation

Lors de l'initialisation et de l'installation de l'application, une source de données est fournie par défaut pour stocker les données NocoBase. Celle-ci est appelée la base de données principale. Pour plus d'informations, consultez la documentation sur la [Base de données principale](/data-sources/data-source-main/).

### Sources de données externes

Les bases de données externes sont prises en charge comme sources de données. Pour plus d'informations, consultez la documentation [Bases de données externes / Introduction](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Prise en charge de la synchronisation des tables de base de données personnalisées

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Vous pouvez également accéder aux données provenant de sources d'API HTTP. Pour plus d'informations, consultez la documentation sur la [source de données REST API](/data-sources/data-source-rest-api/).