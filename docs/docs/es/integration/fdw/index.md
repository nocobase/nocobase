:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/integration/fdw/index).
:::

# Conectar tablas de datos externas (FDW)

## Introducción

Esta función permite conectar tablas de datos remotas basándose en el Foreign Data Wrapper (FDW) de la base de datos. Actualmente, es compatible con las bases de datos MySQL y PostgreSQL.

:::info{title="Conectar fuentes de datos vs. Conectar tablas de datos externas"}
- **Conectar fuentes de datos** se refiere a establecer una conexión con una base de datos específica o un servicio API, permitiéndole utilizar plenamente las características de la base de datos o los servicios proporcionados por la API;
- **Conectar tablas de datos externas** se refiere a obtener datos del exterior y mapearlos para su uso local. En el ámbito de las bases de datos, esto se conoce como FDW (Foreign Data Wrapper), una tecnología de base de datos que se enfoca en utilizar tablas remotas como si fueran tablas locales y solo permite conectar una tabla a la vez. Debido a que se trata de un acceso remoto, existen diversas restricciones y limitaciones al utilizarlo.

Ambos también pueden utilizarse en combinación. El primero se utiliza para establecer una conexión con la fuente de datos, y el segundo para el acceso entre diferentes fuentes de datos. Por ejemplo, si se conecta a una fuente de datos PostgreSQL, una tabla específica dentro de esa fuente de datos podría ser una tabla externa creada mediante FDW.
:::

### MySQL

MySQL utiliza el motor `federated`, el cual debe ser activado. Soporta la conexión a bases de datos MySQL remotas y bases de datos compatibles con su protocolo, como MariaDB. Para más detalles, consulte la documentación de [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

En PostgreSQL, se pueden utilizar diferentes tipos de extensiones `fdw` para admitir distintos tipos de datos remotos. Las extensiones compatibles actualmente incluyen:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Conecta a una base de datos PostgreSQL remota desde PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Conecta a una base de datos MySQL remota desde PostgreSQL.
- Para otros tipos de extensiones fdw, consulte [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Para integrarlas en NocoBase, es necesario implementar la interfaz de adaptación correspondiente en el código.

## Requisitos previos

- Si la base de datos principal de NocoBase es MySQL, debe activar `federated`. Consulte [Cómo habilitar el motor federated en MySQL](./enable-federated)

Luego, instale y active el plugin a través del gestor de plugins.

![Instalar y activar el plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual de usuario

En "Gestor de colecciones > Crear colección", seleccione "Conectar a datos externos"

![Conectar datos externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

En el menú desplegable "Servidor de base de datos", seleccione un servicio de base de datos existente o "Crear servidor de base de datos"

![Servicio de base de datos](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Crear un servidor de base de datos

![Crear servicio de base de datos](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Después de seleccionar el servidor de base de datos, en el menú desplegable "Tabla remota", seleccione la tabla de datos que desea conectar.

![Seleccionar la tabla de datos a conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar la información de los campos

![Configurar información de los campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Si la tabla remota presenta cambios estructurales, también puede realizar una "Sincronización desde la tabla remota"

![Sincronizar desde la tabla remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronización de tabla remota

![Sincronización de tabla remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Finalmente, se mostrará en la interfaz

![Mostrar en la interfaz](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)