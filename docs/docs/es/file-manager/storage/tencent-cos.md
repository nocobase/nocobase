:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Tencent Cloud COS

Es un motor de almacenamiento basado en Tencent Cloud COS. Antes de usarlo, necesitará preparar la cuenta y los permisos correspondientes.

## Parámetros de configuración

![Ejemplo de configuración del motor de almacenamiento Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Nota}
Esta sección solo presenta los parámetros específicos del motor de almacenamiento Tencent Cloud COS. Para los parámetros generales, consulte [Parámetros generales del motor](./index.md#parametros-generales-del-motor).
:::

### Región

Introduzca la región de almacenamiento de COS, por ejemplo: `ap-chengdu`.

:::info{title=Nota}
Puede ver la información de la región de su bucket en la [Consola de Tencent Cloud COS](https://console.cloud.tencent.com/cos). Solo necesita usar el prefijo de la región (no el nombre de dominio completo).
:::

### SecretId

Introduzca el ID de la clave de acceso autorizada de Tencent Cloud.

### SecretKey

Introduzca el Secret de la clave de acceso autorizada de Tencent Cloud.

### Bucket

Introduzca el nombre del bucket de almacenamiento de COS, por ejemplo: `qing-cdn-1234189398`.