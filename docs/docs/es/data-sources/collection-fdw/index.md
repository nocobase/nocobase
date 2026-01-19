---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Conectar colecciones de datos externas (FDW)

## Introducción

Este plugin conecta colecciones de datos remotas utilizando la implementación de Foreign Data Wrapper (FDW) de la base de datos. Actualmente, es compatible con bases de datos MySQL y PostgreSQL.

:::info{title="Conectar fuentes de datos vs. Conectar colecciones de datos externas"}
- **Conectar fuentes de datos** se refiere a establecer una conexión con una base de datos o un servicio API específico, lo que le permite utilizar plenamente las características de la base de datos o los servicios que ofrece la API.
- **Conectar colecciones de datos externas** se refiere a obtener datos de fuentes externas y mapearlos para su uso local. En el ámbito de las bases de datos, esto se conoce como FDW (Foreign Data Wrapper), una tecnología que se centra en tratar las tablas remotas como si fueran tablas locales y solo permite la conexión tabla por tabla. Debido a que es un acceso remoto, encontrará diversas restricciones y limitaciones al usarlo.

Ambos métodos pueden utilizarse en combinación. El primero se utiliza para establecer una conexión con la fuente de datos, y el segundo para acceder a datos entre diferentes fuentes. Por ejemplo, si conecta una fuente de datos PostgreSQL, podría tener una tabla dentro de esa fuente de datos que fue creada como una colección de datos externa basada en FDW.
:::

### MySQL

MySQL utiliza el motor `federated`, que debe activarse, y permite conectar bases de datos MySQL remotas y otras compatibles con su protocolo, como MariaDB. Para más detalles, consulte la documentación de [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

En PostgreSQL, puede utilizar diferentes tipos de extensiones `fdw` para admitir distintos tipos de datos remotos. Las extensiones actualmente compatibles incluyen:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Para conectar bases de datos PostgreSQL remotas en PostgreSQL.
- [mysql_fdw (en desarrollo)](https://github.com/EnterpriseDB/mysql_fdw): Para conectar bases de datos MySQL remotas en PostgreSQL.
- Para otros tipos de extensiones FDW, puede consultar [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Para integrarlas con NocoBase, deberá implementar las interfaces de adaptación correspondientes en el código.

## Instalación

Requisitos previos

- Si la base de datos principal de NocoBase es MySQL, deberá activar `federated`. Consulte [Cómo habilitar el motor federated en MySQL](./enable-federated.md)

Luego, instale y active el plugin a través del gestor de plugins.

![Instalar y activar el plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual de uso

En el menú desplegable «Gestión de colecciones > Crear colección», seleccione «Conectar datos externos».

![Conectar datos externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

En el menú desplegable «Servicio de base de datos», seleccione un servicio de base de datos existente o elija «Crear servicio de base de datos».

![Servicio de base de datos](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Crear un servicio de base de datos

![Crear servicio de base de datos](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Después de seleccionar el servicio de base de datos, en el menú desplegable «Tabla remota», seleccione la colección de datos que desea conectar.

![Seleccionar la colección de datos que desea conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar información de campos

![Configurar información de campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la tabla remota presenta cambios estructurales, también puede «Sincronizar desde tabla remota».

![Sincronizar desde tabla remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronización de tabla remota

![Sincronización de tabla remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Finalmente, se muestra en la interfaz.

![Mostrar en la interfaz](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)