---
pkg: "@nocobase/plugin-collection-fdw"
title: "Conectar tablas de datos externas (FDW)"
description: "Complemento basado en Foreign Data Wrapper para conectar tablas de datos remotas. Permite usar el motor federated de MySQL y postgres_fdw de PostgreSQL para asignar tablas remotas como tablas locales."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,tablas externas,tablas remotas,NocoBase"
---
# Conectar tablas de datos externas (FDW)

## Introducción

Complemento para conectar tablas de datos remotas mediante la implementación de foreign data wrapper de la base de datos. Actualmente admite bases de datos MySQL y PostgreSQL.

:::info{title="Conectar una fuente de datos vs. conectar tablas de datos externas"}
- **Conectar una fuente de datos** significa establecer una conexión con una base de datos específica o un servicio de API para utilizar todas las características de la base de datos o los servicios proporcionados por la API;
- **Conectar tablas de datos externas** significa obtener datos externos y asignarlos para usarlos localmente. En las bases de datos se denomina FDW (Foreign Data Wrapper), una tecnología de bases de datos que se centra en utilizar tablas remotas como tablas locales y solo permite conectar las tablas una por una. Debido a que se accede a ellas de forma remota, existen diversas restricciones y limitaciones durante su uso.

Ambas opciones también pueden utilizarse conjuntamente: la primera sirve para establecer la conexión con la fuente de datos y la segunda para acceder a datos entre distintas fuentes. Por ejemplo, tras conectar una fuente de datos de PostgreSQL, una de sus tablas puede ser una tabla de datos externa creada mediante FDW.
:::

### MySQL

MySQL utiliza el motor `federated`, que debe activarse. Admite conexiones con MySQL remoto y con bases de datos compatibles con su protocolo, como MariaDB. Para obtener más información, consulta la documentación de [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

En PostgreSQL, se pueden admitir distintos tipos de datos remotos mediante diferentes extensiones `fdw`. Actualmente, se admiten las siguientes extensiones:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): conecta PostgreSQL con una base de datos PostgreSQL remota.
- [mysql_fdw (en desarrollo)](https://github.com/EnterpriseDB/mysql_fdw): conecta PostgreSQL con una base de datos MySQL remota.
- Para otros tipos de extensiones fdw, consulta [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Para integrarlas con NocoBase, es necesario implementar la interfaz de adaptación correspondiente en el código.

## Instalación

Requisitos previos

- Si la base de datos principal de NocoBase es MySQL, es necesario activar `federated`. Consulta [Cómo habilitar el motor federated en MySQL](./enable-federated.md).

A continuación, instala y activa el complemento mediante el administrador de complementos.

![Instalar y activar el complemento](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Guía de uso

En el menú desplegable «Gestión de tablas de datos > Crear tabla de datos», selecciona «Conectar datos externos».

![Conectar datos externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

En el menú desplegable «Servicio de base de datos», selecciona un servicio de base de datos existente o «Crear servicio de base de datos».

![Servicio de base de datos](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Crear un servicio de base de datos

![Crear un servicio de base de datos](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Después de seleccionar el servicio de base de datos, en el menú desplegable «Tabla remota», selecciona la tabla de datos que deseas conectar.

![Seleccionar la tabla de datos que deseas conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar la información de los campos

![Configurar la información de los campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la tabla remota cambia de estructura, también puedes seleccionar «Sincronizar desde la tabla remota».

![Sincronizar desde la tabla remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronización de la tabla remota

![Sincronización de la tabla remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Por último, se mostrará en la interfaz.

![Mostrar en la interfaz](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)