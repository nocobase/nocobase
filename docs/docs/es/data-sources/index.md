:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Resumen

El modelado de datos es un paso clave en el diseño de bases de datos. Implica un proceso de análisis profundo y abstracción de los diversos tipos de datos del mundo real y sus interrelaciones. En este proceso, buscamos revelar las conexiones intrínsecas entre los datos y formalizarlas en modelos de datos, sentando las bases para la estructura de la base de datos de un sistema de información. NocoBase es una plataforma impulsada por modelos de datos, con las siguientes características:

## Soporte para acceder a datos de diversas fuentes

Las **fuentes de datos** de NocoBase pueden ser de diversos orígenes, incluyendo bases de datos comunes, plataformas API (SDK) y archivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase ofrece un [plugin de gestión de fuentes de datos](/data-sources/data-source-manager) para administrar las diversas **fuentes de datos** y sus **colecciones**. El **plugin** de gestión de **fuentes de datos** solo proporciona una interfaz de administración para todas las **fuentes de datos**, pero no la capacidad de acceder directamente a ellas. Debe utilizarse junto con varios **plugins** de **fuentes de datos**. Las **fuentes de datos** actualmente compatibles incluyen:

- [Base de datos principal](/data-sources/data-source-main): La base de datos principal de NocoBase, compatible con bases de datos relacionales como MySQL, PostgreSQL y MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Utiliza la base de datos KingbaseES como **fuente de datos**, pudiendo ser usada como base de datos principal o externa.
- [MySQL externo](/data-sources/data-source-external-mysql): Utiliza una base de datos MySQL externa como **fuente de datos**.
- [MariaDB externo](/data-sources/data-source-external-mariadb): Utiliza una base de datos MariaDB externa como **fuente de datos**.
- [PostgreSQL externo](/data-sources/data-source-external-postgres): Utiliza una base de datos PostgreSQL externa como **fuente de datos**.
- [MSSQL externo](/data-sources/data-source-external-mssql): Utiliza una base de datos MSSQL (SQL Server) externa como **fuente de datos**.
- [Oracle externo](/data-sources/data-source-external-oracle): Utiliza una base de datos Oracle externa como **fuente de datos**.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Herramientas de modelado de datos diversas

**Interfaz sencilla de gestión de colecciones**: Se utiliza para crear diversas **colecciones** (modelos de datos) o para conectar **colecciones** ya existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaz visual tipo diagrama ER**: Se utiliza para extraer entidades y sus relaciones a partir de los requisitos de usuario y de negocio. Ofrece una forma intuitiva y fácil de entender para describir modelos de datos. A través de los diagramas ER, usted puede comprender con mayor claridad las principales entidades de datos del sistema y sus interconexiones.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Soporte para crear varios tipos de colecciones

| Colección | Descripción |
| - | - |
| [Colección general](/data-sources/data-source-main/general-collection) | Incluye campos de sistema comunes predefinidos. |
| [Colección de calendario](/data-sources/calendar/calendar-collection) | Para crear **colecciones** de eventos relacionados con calendarios. |
| Colección de comentarios | Para almacenar comentarios o retroalimentación sobre los datos. |
| [Colección de árbol](/data-sources/collection-tree) | **Colección** con estructura de árbol; actualmente solo soporta el modelo de lista de adyacencia. |
| [Colección de archivos](/data-sources/file-manager/file-collection) | Para la gestión del almacenamiento de archivos. |
| [Colección SQL](/data-sources/collection-sql) | No es una **colección** de base de datos real, sino que muestra consultas SQL de forma estructurada. |
| [Conectar a vista de base de datos](/data-sources/collection-view) | Para conectar a vistas de base de datos existentes. |
| Colección de expresiones | Para escenarios de expresiones dinámicas en **flujos de trabajo**. |
| [Conectar a datos externos](/data-sources/collection-fdw) | Permite al sistema de base de datos acceder y consultar directamente datos en **fuentes de datos** externas basándose en la tecnología FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para más información, consulte la sección 「[Colección / Resumen](/data-sources/data-modeling/collection)」.

## Variedad de tipos de campo

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para más información, consulte la sección 「[Campos de colección / Resumen](/data-sources/data-modeling/collection-fields)」.