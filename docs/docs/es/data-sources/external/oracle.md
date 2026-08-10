---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Fuente de datos externa - Oracle"
description: "Aprende a conectar Oracle a NocoBase como base de datos externa, incluidos las versiones compatibles, la instalación del plugin, los modos de conexión Thin/Thick, Client directory, los permisos y el mapeo de campos."
keywords: "fuente de datos externa,Oracle,base de datos externa,Thin,Thick,Client directory,mapeo de campos,NocoBase"
---

# Oracle

## Introducción

Oracle puede conectarse a NocoBase como base de datos externa. Tras la conexión, NocoBase leerá las tablas, los campos y las vistas de Oracle, y los utilizará como tablas de datos en la fuente de datos externa.

A diferencia de la [base de datos principal](../main/index.md), la estructura real de las tablas de Oracle externo seguirá siendo mantenida por el sistema empresarial original, el cliente de base de datos o los scripts de migración. NocoBase se encarga de leer la estructura, guardar los metadatos de los campos y configurar los bloques de página, los permisos, los workflows y las API.

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | Oracle >= 11g. |
| Versión comercial | Compatible con la edición Enterprise. |
| Plugin correspondiente | `@nocobase/plugin-data-source-external-oracle`. |
| Modo de conexión | Oracle Database 12.1 y versiones posteriores suelen utilizar el modo Thin; las versiones anteriores a 12.1 utilizan el modo Thick. |

Casos adecuados para utilizar Oracle externo:

- Conectar la base de datos Oracle de sistemas empresariales existentes, como ERP, MES, WMS o CRM
- Crear una interfaz de gestión con NocoBase sin migrar los datos históricos
- Aplicar controles de permisos, procesar workflows, corregir datos o mostrar informes sobre tablas existentes
- Mantener la estructura de la base de datos mediante el DBA, scripts de migración o el sistema original

:::warning Precaución

Oracle externo no es la base de datos del sistema de NocoBase. NocoBase no asumirá la gestión de sus copias de seguridad, restauraciones, migraciones ni cambios en la estructura de las tablas.

:::

## Instalación del plugin

Este plugin es comercial. Para obtener información detallada sobre la activación, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

Si seleccionas el modo de conexión Thick, debes instalar las bibliotecas de Oracle Client en el entorno de ejecución de NocoBase y completar «Client directory» en la configuración de la fuente de datos.

## Instalación del cliente de Oracle

Oracle Database 12.1 y versiones posteriores suelen utilizar el modo Thin, por lo que no es necesario instalar Oracle Client adicionalmente. Solo necesitas instalar las bibliotecas de Oracle Client en el entorno de ejecución de NocoBase cuando te conectes a una versión anterior a Oracle Database 12.1 o cuando debas utilizar el modo Thick.

Después de seleccionar el modo «Thick» en la configuración de la fuente de datos, debes confirmar que la máquina donde se ejecuta el servicio de NocoBase pueda cargar Oracle Client.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

En entornos Linux, puedes consultar el siguiente método para instalar Oracle Instant Client:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Si Oracle Client no está instalado en una ubicación que el sistema pueda cargar de forma predeterminada, debes especificar el directorio de las bibliotecas del cliente en «Client directory». Por ejemplo, con el método de instalación anterior, el directorio correspondiente es `/opt/instantclient_19_25`.

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Consejo

`Client directory` solo debe configurarse en el modo Thick. El modo Thin no utiliza esta configuración. Para obtener más información sobre las reglas de inicialización, consulta la [documentación de inicialización de node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Añadir una fuente de datos

En «Gestión de fuentes de datos», haz clic en «Add new», selecciona Oracle y completa la información de conexión.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Configuración de conexión habitual:

| Configuración | Descripción |
| --- | --- |
| Data source name | Nombre identificativo de la fuente de datos, utilizado para referenciarla en bloques de página, permisos, workflows y API. No se puede modificar después de crearla. |
| Data source display name | Nombre con el que la fuente de datos se muestra en la interfaz. Se recomienda utilizar un nombre comprensible para el personal de negocio, como «ERP Oracle» o «Base de datos financiera». |
| Host / Port | Dirección del host y puerto de Oracle. El puerto predeterminado suele ser `1521`. |
| ServerName | Nombre del servicio de Oracle. Introduce el service name configurado en el listener de la base de datos. |
| Username / Password | Nombre de usuario y contraseña utilizados para conectarse a Oracle. NocoBase leerá las tablas y vistas pertenecientes al Owner de esta cuenta, pero no concederá acceso ni leerá objetos de otros Owner. |
| Connection mode | Modo de conexión de Oracle. Oracle Database 12.1 y versiones posteriores suelen utilizar el modo Thin; las versiones anteriores a 12.1 utilizan el modo Thick. |
| Client directory | Directorio de las bibliotecas de Oracle Client para el modo Thick de Oracle. Solo es necesario configurarlo al seleccionar el modo Thick. |
| Table prefix | Prefijo de las tablas. Tras configurarlo, NocoBase solo leerá las tablas y vistas que coincidan con este prefijo y generará en NocoBase nombres de tablas sin el prefijo. |
| Collections / Add all collections | Controla el alcance de la conexión. Cuando «Add all collections» está activado, NocoBase conectará todas las tablas y vistas dentro del Owner y el alcance del prefijo actuales; cuando está desactivado, solo conectará los objetos seleccionados en «Collections». |
| Enabled the data source | Indica si la fuente de datos está habilitada. Cuando está desactivada, la configuración de la fuente de datos se conserva, pero los bloques de página, los permisos, los workflows y las API ya no podrán leer sus datos. |

:::tip Consejo

El alcance de la conexión en Oracle está determinado principalmente por el Owner de la cuenta de conexión, `Table prefix` y «Collections». Si hay muchos objetos en la misma instancia, se recomienda utilizar una cuenta específica para conectarse al schema necesario para el negocio y reducir la entrada de objetos irrelevantes en NocoBase.

:::

## Seleccionar tablas de datos

Después de completar la información de conexión, puedes hacer clic en «Load Collections» para leer las tablas y vistas disponibles en Oracle. Los resultados de la lectura se verán afectados por el Owner de la cuenta de conexión, `Table prefix` y la configuración de «Collections».

De forma predeterminada, «Add all collections» está activado, lo que indica que se conectarán todas las tablas y vistas dentro del alcance actual. Si solo quieres conectar algunos objetos, desactiva «Add all collections» y selecciona en la lista las tablas o vistas necesarias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Precaución

Una única fuente de datos externa puede conectar como máximo 500 tablas o vistas a la vez. Si hay muchos objetos en Oracle, se recomienda reducir primero el alcance mediante el Owner de la cuenta de conexión, `Table prefix` o «Collections».

:::

## Synchronizar y configurar campos

La estructura de las tablas de Oracle externo se mantiene en el lado de la base de datos. NocoBase no creará campos en Oracle externo ni modificará los tipos de los campos o eliminará campos reales.

Cuando cambie la estructura de las tablas en Oracle, puedes ejecutar «Sync from database» en la fuente de datos para volver a leer los metadatos de las tablas y los campos. La sincronización actualizará la información guardada en NocoBase sobre las tablas de datos, los campos, las claves principales, las claves únicas y el mapeo de tipos de campo, pero no eliminará las tablas reales ni los datos de Oracle.

Después de sincronizar los campos, puedes configurar en NocoBase el título del campo, el tipo de campo (Field type) y el componente del campo (Field interface). Si necesitas crear campos de relación de NocoBase, los metadatos de la relación también se guardarán en NocoBase y no se añadirá automáticamente ningún campo de clave externa real a las tablas de Oracle.

## Mapeo de tipos de campo

NocoBase asignará automáticamente los tipos de campo de Oracle al Field type y al Field interface adecuados. Puedes ajustar la forma de visualización en la configuración del campo.

Mapeos habituales:

| Tipo de campo de Oracle | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Precaución

`BLOB`、`BFILE` y otros tipos de objetos binarios no se utilizarán automáticamente como campos de archivo normales. Si necesitas gestionar archivos adjuntos en las páginas, normalmente se recomienda utilizar una tabla de archivos o un campo de archivos en NocoBase para guardar los metadatos de los archivos.

:::

## Clave principal e identificador único de los registros

Se recomienda que las tablas de datos utilizadas para mostrar y editar bloques de página tengan una clave principal o un campo único. NocoBase utilizará preferentemente la clave principal como identificador único del registro.

Si conectas una vista, una tabla sin clave principal o una tabla con clave principal compuesta, debes configurar manualmente «Record unique key» en la configuración de la tabla de datos. Si no existe un identificador único disponible, es posible que los bloques de página no puedan visualizar, editar o eliminar correctamente los registros.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Enlaces relacionados

- [Base de datos externa](./index.md) — Consulta la configuración general y las instrucciones de gestión de las bases de datos externas
- [Gestión de fuentes de datos](../data-source-manager/index.md) — Consulta el acceso a las fuentes de datos y su forma de gestión
- [Campos de las tablas de datos](../data-modeling/collection-fields/index.md) — Consulta las instrucciones sobre los tipos de campo y el mapeo de campos
- [Documentación de inicialización de node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Consulta cómo cargar las bibliotecas de Oracle Client