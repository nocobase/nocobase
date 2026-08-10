---
title: "Descripción general de las fuentes de datos"
description: "Fuentes de datos y modelado de datos de NocoBase: base de datos principal, bases de datos externas, REST API, NocoBase externo, gestión de fuentes de datos, tablas normales, tablas jerárquicas, tablas SQL y tablas de archivos."
keywords: "fuentes de datos,modelado de datos,base de datos principal,base de datos externa,REST API,NocoBase externo,Collection,tabla jerárquica,tabla SQL,NocoBase"
---

# Descripción general

El modelado de datos es un paso clave en el diseño de bases de datos. Implica analizar y abstraer en profundidad los distintos tipos de datos del mundo real y sus relaciones. Durante este proceso, intentamos revelar las conexiones internas entre los datos y describirlas formalmente mediante un modelo de datos, sentando así las bases para la estructura de la base de datos de los sistemas de información. NocoBase es una plataforma basada en modelos de datos que ofrece las siguientes características:

## Admite la conexión con datos de diversas fuentes

Las fuentes de datos de NocoBase pueden ser diversos tipos de bases de datos habituales, plataformas API (SDK) y archivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase proporciona el [plugin de gestión de fuentes de datos](./data-source-manager/index.md), que se utiliza para gestionar las distintas fuentes de datos y sus tablas. El plugin de gestión de fuentes de datos solo proporciona una interfaz para administrar todas las fuentes de datos; no proporciona la capacidad de conectarse a ellas, por lo que debe utilizarse junto con los plugins correspondientes. Actualmente, se admiten las siguientes fuentes de datos:

- [Fuente de datos principal](./data-source-main/index.md): base de datos principal de NocoBase, compatible con PostgreSQL, MySQL, MariaDB, KingbaseES y OceanBase.
- [PostgreSQL externo](./data-source-external-postgres/index.md): conecta una base de datos PostgreSQL existente.
- [MySQL externo](./data-source-external-mysql/index.md): conecta una base de datos MySQL existente.
- [MariaDB externo](./data-source-external-mariadb/index.md): conecta una base de datos MariaDB existente.
- [MSSQL externo](./data-source-external-mssql/index.md): conecta una base de datos SQL Server existente.
- [KingbaseES externo](./data-source-kingbase/index.md): conecta una base de datos KingbaseES existente.
- [OceanBase externo](./external/oceanbase.md): conecta una base de datos OceanBase existente.
- [Oracle externo](./data-source-external-oracle/index.md): conecta una base de datos Oracle existente.
- [ClickHouse externo](./external/clickhouse.md): conecta una base de datos ClickHouse existente.
- [Doris externo](./external/doris.md): conecta una base de datos Doris existente.
- [Fuente de datos REST API](./data-source-rest-api/index.md): asigna la REST API de un sistema de terceros como fuente de datos.
- [Fuente de datos NocoBase externo](./data-source-external-nocobase/index.md): conecta con las tablas de datos de otra aplicación NocoBase.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Proporciona diversas herramientas de modelado de datos

**Interfaz sencilla de gestión de tablas de datos**: se utiliza para crear diversos modelos (tablas de datos) o conectar modelos (tablas de datos) existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaz visual similar a un diagrama ER**: se utiliza para extraer las entidades y sus relaciones a partir de las necesidades de los usuarios y del negocio. Proporciona una forma intuitiva y fácil de comprender para describir el modelo de datos. Mediante un diagrama ER, es posible comprender con mayor claridad las principales entidades de datos del sistema y las relaciones entre ellas.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Admite la creación de diversos tipos de tablas de datos

| Tabla de datos | Descripción |
| - | - |
| [Tabla de datos normal](/data-sources/data-source-main/general-collection) | Incluye los campos de sistema habituales |
| [Tabla de datos de calendario](/data-sources/calendar/calendar-collection) | Se utiliza para crear tablas de eventos relacionados con calendarios |
| [Tabla de comentarios](/data-sources/collection-comment/) | Se utiliza para almacenar comentarios o comentarios de los usuarios sobre los datos |
| [Tabla de estructura jerárquica](/data-sources/collection-tree/) | Tabla de estructura jerárquica; actualmente solo admite el diseño de tabla de adyacencia |
| [Tabla de datos de archivos](/data-sources/file-manager/file-collection) | Se utiliza para gestionar el almacenamiento de archivos |
| [Conectar una vista de base de datos](/data-sources/collection-view/) | Conecta una vista de base de datos existente |
| [Tabla de datos SQL](/data-sources/collection-sql/) | No es una tabla de base de datos real, sino una forma rápida de mostrar consultas SQL de manera estructurada |
| [Conectar datos externos](/data-sources/collection-fdw) | Permite conectar tablas de datos remotas mediante la tecnología FDW basada en bases de datos |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para obtener más información, consulta la sección «[Tablas de datos / Descripción general](/data-sources/data-modeling/collection)».

## Proporciona una amplia variedad de tipos de campos

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para obtener más información, consulta la sección «[Campos de las tablas de datos / Descripción general](/data-sources/data-modeling/collection-fields/)».
