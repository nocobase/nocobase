---
title: "Alibaba Cloud OSS"
description: "Configuración del motor de almacenamiento Alibaba Cloud OSS: Bucket, Endpoint y AccessKey, con compatibilidad para acceso público y acceso interno."
keywords: "Alibaba Cloud OSS, almacenamiento de objetos de Alibaba Cloud, almacenamiento OSS, almacenamiento en la nube, NocoBase"
---

# Alibaba Cloud OSS

Motor de almacenamiento basado en Alibaba Cloud OSS. Antes de utilizarlo, es necesario preparar las cuentas y los permisos correspondientes.

## Parámetros de configuración

![Ejemplo de configuración del motor de almacenamiento Alibaba Cloud OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Nota}
Solo se presentan los parámetros específicos del motor de almacenamiento Alibaba Cloud OSS. Para consultar los parámetros generales, véase [Parámetros generales del motor](./index.md#引擎通用参数).
:::

### Región

Introduzca la región del almacenamiento OSS, por ejemplo: `oss-cn-hangzhou`.

:::info{title=Nota}
Puede consultar la información de la región del espacio de almacenamiento en la [consola de Alibaba Cloud OSS](https://oss.console.aliyun.com/). Solo es necesario extraer el prefijo de la región (no es necesario incluir el nombre de dominio completo).
:::

### AccessKey ID

Introduzca el ID de la clave de acceso autorizada de Alibaba Cloud.

### AccessKey Secret

Introduzca el secreto de la clave de acceso autorizada de Alibaba Cloud.

### Bucket

Introduzca el nombre del bucket del almacenamiento OSS.
