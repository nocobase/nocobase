---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Gestión de Fuentes de Datos

## Introducción

NocoBase proporciona un plugin de gestión de fuentes de datos para administrar fuentes de datos y sus colecciones. El plugin de gestión de fuentes de datos solo ofrece una interfaz de administración para todas las fuentes de datos, pero no proporciona la capacidad de acceder a ellas directamente. Necesita ser utilizado en conjunto con varios plugins de fuentes de datos. Actualmente, las fuentes de datos compatibles incluyen:

- [Base de Datos Principal](/data-sources/data-source-main): La base de datos principal de NocoBase, compatible con bases de datos relacionales como MySQL, PostgreSQL y MariaDB.
- [MySQL Externo](/data-sources/data-source-external-mysql): Utilice una base de datos MySQL externa como fuente de datos.
- [MariaDB Externo](/data-sources/data-source-external-mariadb): Utilice una base de datos MariaDB externa como fuente de datos.
- [PostgreSQL Externo](/data-sources/data-source-external-postgres): Utilice una base de datos PostgreSQL externa como fuente de datos.
- [MSSQL Externo](/data-sources/data-source-external-mssql): Utilice una base de datos MSSQL (SQL Server) externa como fuente de datos.
- [Oracle Externo](/data-sources/data-source-external-oracle): Utilice una base de datos Oracle externa como fuente de datos.

Además, puede extender más tipos a través de plugins, que pueden ser bases de datos comunes o plataformas que ofrecen APIs (SDKs).

## Instalación

Es un plugin integrado, por lo que no requiere instalación adicional.

## Instrucciones de Uso

Cuando la aplicación se inicializa e instala, se proporciona por defecto una fuente de datos para almacenar los datos de NocoBase, conocida como la base de datos principal. Para más información, consulte la documentación de la [Base de Datos Principal](/data-sources/data-source-main/).

### Fuentes de Datos Externas

Se admite el uso de bases de datos externas como fuentes de datos. Para más información, consulte la documentación de [Base de Datos Externa / Introducción](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Soporte para Sincronizar Tablas de Base de Datos Personalizadas

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

También puede acceder a datos de fuentes de API HTTP. Para más información, consulte la documentación de [Fuente de Datos REST API](/data-sources/data-source-rest-api/).