:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Generalidades

El modelado de datos es un paso clave al diseñar bases de datos. Implica un proceso de análisis profundo y abstracción de diversos tipos de datos del mundo real y sus interrelaciones. En este proceso, buscamos revelar las conexiones intrínsecas entre los datos y formalizarlas en modelos de datos, sentando las bases para la estructura de la base de datos de un sistema de información. NocoBase es una plataforma impulsada por modelos de datos, con las siguientes características:

## Admite el acceso a datos de diversas fuentes

Las **fuentes de datos** de NocoBase pueden ser diversos tipos de bases de datos comunes, plataformas API (SDK) y archivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase ofrece un [**plugin** de gestión de **fuentes de datos**](/data-sources/data-source-manager) para administrar diversas **fuentes de datos** y sus **colecciones**. El **plugin** de gestión de **fuentes de datos** solo proporciona una interfaz de administración para todas las **fuentes de datos**, pero no la capacidad de acceder directamente a ellas. Requiere ser utilizado en conjunto con varios **plugins** de **fuentes de datos**. Las **fuentes de datos** actualmente compatibles incluyen:

- [Base de Datos Principal](/data-sources/data-source-main): La base de datos principal de NocoBase, compatible con bases de datos relacionales como MySQL, PostgreSQL y MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Utilice la base de datos KingbaseES como **fuente de datos**, que puede usarse como base de datos principal o externa.
- [MySQL Externo](/data-sources/data-source-external-mysql): Utilice una base de datos MySQL externa como **fuente de datos**.
- [MariaDB Externo](/data-sources/data-source-external-mariadb): Utilice una base de datos MariaDB externa como **fuente de datos**.
- [PostgreSQL Externo](/data-sources/data-source-external-postgres): Utilice una base de datos PostgreSQL externa como **fuente de datos**.
- [MSSQL Externo](/data-sources/data-source-external-mssql): Utilice una base de datos MSSQL (SQL Server) externa como **fuente de datos**.
- [Oracle Externo](/data-sources/data-source-external-oracle): Utilice una base de datos Oracle externa como **fuente de datos**.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Ofrece una variedad de herramientas de modelado de datos

**Interfaz de gestión de **colecciones** sencilla**: Se utiliza para crear diversas **colecciones** (modelos de datos) o conectar **colecciones** (modelos de datos) existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaz visual tipo diagrama ER**: Se utiliza para extraer entidades y sus relaciones a partir de los requisitos de usuario y de negocio. Ofrece una forma intuitiva y fácil de entender para describir modelos de datos. A través de los diagramas ER, usted puede comprender con mayor claridad las principales entidades de datos en el sistema y sus conexiones.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Admite la creación de varios tipos de colecciones

| **Colección** | Descripción |
| - | - |
| [**Colección** General](/data-sources/data-source-main/general-collection) | Incluye campos de sistema comunes. |
| [**Colección** de Calendario](/data-sources/calendar/calendar-collection) | Se utiliza para crear **colecciones** de eventos relacionadas con calendarios. |
| **Colección** de Comentarios | Se utiliza para almacenar comentarios o retroalimentación sobre los datos. |
| [**Colección** de Estructura de Árbol](/data-sources/collection-tree) | **Colección** con estructura de árbol; actualmente solo admite el modelo de lista de adyacencia. |
| [**Colección** de Archivos](/data-sources/file-manager/file-collection) | Se utiliza para la gestión del almacenamiento de archivos. |
| [**Colección** SQL](/data-sources/collection-sql) | No es una tabla de base de datos real, sino que visualiza rápidamente las consultas SQL de manera estructurada. |
| [Conectar a Vista de Base de Datos](/data-sources/collection-view) | Conecta a vistas de base de datos existentes. |
| **Colección** de Expresiones | Se utiliza para escenarios de expresiones dinámicas en **flujos de trabajo**. |
| [Conectar a Datos Externos](/data-sources/collection-fdw) | Permite que el sistema de base de datos acceda y consulte directamente datos en **fuentes de datos** externas basándose en la tecnología FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para más información, consulte la sección «[**Colección** / Generalidades](/data-sources/data-modeling/collection)» .

## Ofrece una gran variedad de tipos de campos

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para más información, consulte la sección «[Campos de **Colección** / Generalidades](/data-sources/data-modeling/collection-fields)» .