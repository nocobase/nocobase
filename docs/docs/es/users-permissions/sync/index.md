---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Sincronización de Datos de Usuario

## Introducción

Esta característica le permite registrar y gestionar las fuentes de sincronización de datos de usuario. Por defecto, se proporciona una API HTTP, pero se pueden añadir otras fuentes de datos a través de plugins. Admite la sincronización de datos con las colecciones de **Usuarios** y **Departamentos** por defecto, con la posibilidad de extender la sincronización a otros recursos de destino mediante plugins.

## Gestión y Sincronización de Fuentes de Datos

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Si no tiene instalados plugins que proporcionen fuentes de sincronización de datos de usuario, puede sincronizar los datos de usuario utilizando la API HTTP. Consulte [Fuente de Datos - HTTP API](./sources/api.md).
:::

## Añadir una Fuente de Datos

Una vez que instale un plugin que proporcione una fuente de sincronización de datos de usuario, podrá añadir la fuente de datos correspondiente. Solo las fuentes de datos habilitadas mostrarán los botones "Sincronizar" y "Tarea".

> Ejemplo: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Sincronización de Datos

Haga clic en el botón **Sincronizar** para iniciar la sincronización de datos.

![](https://static-docs.nocobase.com/202412041055022.png)

Haga clic en el botón **Tarea** para ver el estado de la sincronización. Una vez completada la sincronización, podrá ver los datos en las listas de Usuarios y Departamentos.

![](https://static-docs.nocobase.com/202412041202337.png)

Para las tareas de sincronización fallidas, puede hacer clic en **Reintentar**.

![](https://static-docs.nocobase.com/202412041058337.png)

En caso de fallos de sincronización, puede solucionar el problema a través de los registros del sistema. Además, los registros de sincronización originales se guardan en el directorio `user-data-sync` dentro de la carpeta de registros de la aplicación.

![](https://static-docs.nocobase.com/202412041205655.png)