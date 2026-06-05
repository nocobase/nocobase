:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Tencent COS

Un motor de almacenamiento basado en Tencent Cloud COS. Antes de usarlo, necesita preparar la cuenta y los permisos correspondientes.

## Opciones de configuración

![Ejemplo de configuración del motor de almacenamiento Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Sugerencia}
Aquí solo se describen las opciones específicas del motor de almacenamiento Tencent Cloud COS. Para los parámetros generales, consulte [Parámetros generales del motor](./index.md#common-engine-parameters).
:::

### Región

Introduzca la región de almacenamiento de COS, por ejemplo: `ap-chengdu`.

:::info{title=Sugerencia}
Puede ver la información de la región del bucket de almacenamiento en la [Consola de Tencent Cloud COS](https://console.cloud.tencent.com/cos). Solo necesita tomar la parte del prefijo de la región (sin el nombre de dominio completo).
:::

### SecretId

Introduzca el ID de la clave de acceso autorizada de Tencent Cloud.

### SecretKey

Introduzca el Secret de la clave de acceso autorizada de Tencent Cloud.

### Bucket

Introduzca el nombre del bucket de almacenamiento de COS, por ejemplo: `qing-cdn-1234189398`.