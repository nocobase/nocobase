---
title: "Administrador de archivos"
description: "Tablas de archivos, campos de adjuntos y motores de almacenamiento de archivos, con compatibilidad para almacenamiento local, Alibaba Cloud OSS, Amazon S3 y Tencent Cloud COS; gestión de metadatos y cargas de archivos."
keywords: "Administrador de archivos, tablas de archivos, campos de adjuntos, motores de almacenamiento, OSS, S3, COS, NocoBase"
---

# Administrador de archivos

<PluginInfo name="file-manager"></PluginInfo>

## Introducción

El complemento Administrador de archivos proporciona tablas de archivos, campos de adjuntos y motores de almacenamiento de archivos para gestionar los archivos de forma eficaz. Los archivos son registros de tablas de datos con una estructura específica. Las tablas de datos con esta estructura específica se denominan tablas de archivos y se utilizan para almacenar los metadatos de los archivos, que pueden gestionarse mediante el Administrador de archivos. Los campos de adjuntos son campos de relación específicos asociados a las tablas de archivos. Los archivos admiten varios métodos de almacenamiento. Actualmente, los motores de almacenamiento de archivos compatibles incluyen el almacenamiento local, Alibaba Cloud OSS, Amazon S3 y Tencent Cloud COS.

## Manual de uso

### Tablas de archivos

Se incluye una tabla attachments integrada para almacenar los archivos asociados a todos los campos de adjuntos. Además, se pueden crear nuevas tablas de archivos para almacenar archivos específicos.

[Para obtener más información sobre el uso, consulta la documentación de introducción a las tablas de archivos](/data-sources/file-manager/file-collection)

### Campos de adjuntos

Los campos de adjuntos son campos de relación específicos asociados a las tablas de archivos. Se pueden crear mediante un «campo de tipo adjunto» o configurar mediante un «campo de relación».

[Para obtener más información sobre el uso, consulta la documentación de introducción a los campos de adjuntos](/data-sources/file-manager/field-attachment)

### Motores de almacenamiento de archivos

Los motores de almacenamiento de archivos se utilizan para guardar archivos en servicios específicos, incluido el almacenamiento local (que guarda los archivos en el disco duro del servidor) y el almacenamiento en la nube.

[Para obtener más información, consulta la introducción a los motores de almacenamiento de archivos](./storage/index.md)

### API HTTP

La carga de archivos puede realizarse mediante la API HTTP. Consulta [API HTTP](./http-api.md).

## Desarrollo de extensiones

*