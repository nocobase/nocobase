---
title: "Descripción general del modelado de datos"
description: "Modelado de datos: diseñar modelos de datos, conectar diversas fuentes de datos, visualizar diagramas ER y crear tablas de datos, con compatibilidad para bases de datos principales y externas."
keywords: "Modelado de datos,Collection,modelo de datos,diagrama ER,base de datos principal,base de datos externa,NocoBase"
---

# Descripción general

El modelado de datos es un paso clave en el diseño de bases de datos. Implica analizar y abstraer en profundidad los distintos tipos de datos del mundo real y sus relaciones. Durante este proceso, tratamos de revelar las conexiones internas entre los datos y describirlas formalmente como un modelo de datos, sentando las bases para la estructura de la base de datos del sistema de información. NocoBase es una plataforma impulsada por modelos de datos que ofrece las siguientes características:

## Admite la conexión con datos de diversas fuentes

Las fuentes de datos de NocoBase pueden ser distintos tipos de bases de datos habituales, plataformas API (SDK) y archivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase proporciona el [plugin de gestión de fuentes de datos](/data-sources/data-source-manager), que se utiliza para gestionar las distintas fuentes de datos y sus tablas. El plugin de gestión de fuentes de datos solo proporciona una interfaz de gestión para todas las fuentes de datos; no ofrece la capacidad de conectarse a ellas, por lo que debe utilizarse junto con distintos plugins de fuentes de datos. Actualmente, se admiten las siguientes fuentes de datos:

- [Base de datos principal](/data-sources/data-source-main): base de datos principal de NocoBase, compatible con bases de datos relacionales como MySQL, PostgreSQL y MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): utiliza la base de datos KingbaseES como fuente de datos; puede emplearse como base de datos principal o como base de datos externa.
- [MySQL externo](/data-sources/data-source-external-mysql): utiliza una base de datos MySQL externa como fuente de datos.
- [MariaDB externo](/data-sources/data-source-external-mariadb): utiliza una base de datos MariaDB externa como fuente de datos.
- [PostgreSQL externo](/data-sources/data-source-external-postgres): utiliza una base de datos PostgreSQL externa como fuente de datos.
- [MSSQL externo](/data-sources/data-source-external-mssql): utiliza una base de datos MSSQL (SQL Server) externa como fuente de datos.
- [Oracle externo](/data-sources/data-source-external-oracle): utiliza una base de datos Oracle externa como fuente de datos.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Ofrece diversas herramientas de modelado de datos

**Interfaz sencilla de gestión de tablas de datos**: se utiliza para crear distintos modelos (tablas de datos) o conectar modelos (tablas de datos) existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaz visual similar a un diagrama ER**: se utiliza para extraer las entidades y sus relaciones a partir de las necesidades de los usuarios y del negocio. Proporciona una forma intuitiva y fácil de entender para describir el modelo de datos. Mediante los diagramas ER, es posible comprender con mayor claridad las principales entidades de datos del sistema y sus relaciones.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Admite la creación de diversos tipos de tablas de datos

| Tabla de datos | Descripción |
| - | - |
| [Tabla de datos común](/data-sources/data-source-main/general-collection) | Incluye campos del sistema de uso habitual |
| [Tabla de datos de calendario](/data-sources/calendar/calendar-collection) | Se utiliza para crear tablas de eventos relacionados con calendarios |
| Tabla de comentarios | Se utiliza para almacenar comentarios o comentarios sobre los datos |
| [Tabla con estructura de árbol](/data-sources/collection-tree) | Tabla con estructura de árbol; actualmente solo admite el diseño mediante tabla de adyacencia |
| [Tabla de datos de archivos](/data-sources/file-manager/file-collection) | Se utiliza para gestionar el almacenamiento de archivos |
| [Tabla de datos SQL](/data-sources/collection-sql) | No es una tabla de base de datos real, sino una forma rápida de mostrar de manera estructurada las consultas SQL |
| [Conectar una vista de base de datos](/data-sources/collection-view) | Se utiliza para conectar vistas de bases de datos existentes |
| Tabla de expresiones | Se utiliza en escenarios de expresiones dinámicas de los flujos de trabajo |
| [Conectar datos externos](/data-sources/collection-fdw) | Permite conectar tablas de datos remotas mediante la tecnología FDW basada en bases de datos |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para obtener más información, consulta la sección «[Tablas de datos / Descripción general](/data-sources/data-modeling/collection)».

## Ofrece una amplia variedad de tipos de campos

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para obtener más información, consulta la sección «[Campos de las tablas de datos / Descripción general](/data-sources/data-modeling/collection-fields)».
