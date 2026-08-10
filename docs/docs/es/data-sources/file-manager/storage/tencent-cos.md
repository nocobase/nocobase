---
title: "Tencent Cloud COS"
description: "Configuración del motor de almacenamiento Tencent Cloud COS: Bucket, Region, SecretId y carga de archivos en el almacenamiento de objetos."
keywords: "Tencent Cloud COS, almacenamiento de objetos de Tencent Cloud, almacenamiento COS, almacenamiento en la nube, NocoBase"
---

# Tencent Cloud COS

El motor de almacenamiento basado en Tencent Cloud COS requiere preparar previamente las cuentas y los permisos correspondientes.

## Parámetros de configuración

![Ejemplo de configuración del motor de almacenamiento Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Nota}
Aquí solo se presentan los parámetros específicos del motor de almacenamiento Tencent Cloud COS. Para consultar los parámetros generales, véase [Parámetros generales del motor](./index.md#引擎通用参数).
:::

### Región

Introduce la región del almacenamiento COS, por ejemplo: `ap-chengdu`.

:::info{title=Nota}
Puedes consultar la información de la región del espacio de almacenamiento en la [consola de Tencent Cloud COS](https://console.cloud.tencent.com/cos). Solo es necesario extraer el prefijo de la región (no el nombre de dominio completo).
:::

### SecretId

Introduce el ID de la clave de acceso autorizada de Tencent Cloud.

### SecretKey

Introduce el secreto de la clave de acceso autorizada de Tencent Cloud.

### Bucket

Introduce el nombre del bucket del almacenamiento COS, por ejemplo: `qing-cdn-1234189398`.