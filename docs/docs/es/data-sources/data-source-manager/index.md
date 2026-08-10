---
pkg: "@nocobase/plugin-data-source-manager"
title: "Gestión de fuentes de datos"
description: "Plugin de gestión de fuentes de datos: administra la base de datos principal, bases de datos externas, fuentes de datos de API REST y fuentes de datos de NocoBase externas, y proporciona una interfaz unificada para su gestión."
keywords: "gestión de fuentes de datos,base de datos principal,bases de datos externas,sincronización de tablas de datos,fuentes de datos de API REST,NocoBase"
---
# Gestión de fuentes de datos

## Introducción

NocoBase proporciona un plugin de gestión de fuentes de datos para administrar las fuentes de datos y sus tablas. Este plugin solo ofrece una interfaz de gestión para todas las fuentes de datos; no proporciona la capacidad de conectarse a ellas, por lo que debe utilizarse junto con distintos plugins de fuentes de datos. Actualmente, admite las siguientes fuentes de datos:

- [Base de datos principal](/data-sources/data-source-main/): la base de datos principal de NocoBase, compatible con MySQL, PostgreSQL, MariaDB, KingbaseES y OceanBase.
- [PostgreSQL externo](/data-sources/data-source-external-postgres/): utiliza una base de datos PostgreSQL externa como fuente de datos.
- [MySQL externo](/data-sources/data-source-external-mysql/): utiliza una base de datos MySQL externa como fuente de datos.
- [MariaDB externo](/data-sources/data-source-external-mariadb/): utiliza una base de datos MariaDB externa como fuente de datos.
- [MSSQL externo](/data-sources/data-source-external-mssql/): utiliza una base de datos MSSQL (SQL Server) externa como fuente de datos.
- [KingbaseES externo](/data-sources/data-source-kingbase/): utiliza una base de datos KingbaseES externa como fuente de datos.
- [OceanBase externo](/data-sources/external/oceanbase): utiliza una base de datos OceanBase externa como fuente de datos.
- [Oracle externo](/data-sources/data-source-external-oracle/): utiliza una base de datos Oracle externa como fuente de datos.
- [ClickHouse externo](/data-sources/external/clickhouse): utiliza una base de datos ClickHouse externa como fuente de datos, normalmente para consultas, estadísticas y visualización de informes.
- [Doris externo](/data-sources/external/doris): utiliza una base de datos Doris externa como fuente de datos, normalmente para consultas, estadísticas y visualización de informes.
- [Fuente de datos de API REST](/data-sources/data-source-rest-api/): integra en NocoBase datos procedentes de una API REST.
- [NocoBase externo](/data-sources/data-source-external-nocobase/): utiliza otra aplicación de NocoBase como fuente de datos externa mediante la API remota de NocoBase.

Además, es posible ampliar el sistema mediante plugins para admitir más tipos de fuentes de datos, incluidas bases de datos comunes y plataformas que proporcionan API (SDK).

## Instalación

Plugin integrado; no es necesario instalarlo por separado.

## Instrucciones de uso

Durante la instalación inicial de la aplicación, se proporciona de forma predeterminada una fuente de datos para almacenar los datos de NocoBase, denominada base de datos principal. Para obtener más información, consulta la documentación de [Base de datos principal](/data-sources/data-source-main/index.md).

### Fuentes de datos externas

Se admiten bases de datos externas como fuentes de datos. Para obtener más información, consulta la documentación de [Bases de datos externas / Introducción](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Admite la sincronización de tablas creadas en la base de datos

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

También es posible integrar datos procedentes de una API HTTP. Para obtener más información, consulta la documentación de [Fuente de datos de API REST](/data-sources/data-source-rest-api/index.md).

### Fuentes de datos externas de NocoBase

Otra aplicación de NocoBase puede integrarse como fuente de datos externa mediante la API remota de NocoBase. Para obtener más información, consulta la documentación de [NocoBase externo](/data-sources/data-source-external-nocobase/index.md).