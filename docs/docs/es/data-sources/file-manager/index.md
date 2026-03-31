---
pkg: "@nocobase/plugin-file-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: "@nocobase/plugin-file-manager"
---

# Gestor de Archivos

## Introducción

El plugin Gestor de Archivos le proporciona una colección de archivos, campos de adjunto y motores de almacenamiento de archivos para gestionar sus archivos de forma eficaz. Los archivos son registros en un tipo especial de colección, conocida como colección de archivos, que almacena los metadatos de los archivos y se puede gestionar a través del Gestor de Archivos. Los campos de adjunto son campos de relación específicos asociados a la colección de archivos. El plugin admite múltiples métodos de almacenamiento. Actualmente, los motores de almacenamiento de archivos compatibles incluyen el almacenamiento local, Alibaba Cloud OSS, Amazon S3 y Tencent Cloud COS.

## Manual de Usuario

### Colección de Archivos

Se incluye una colección de adjuntos integrada para almacenar todos los archivos asociados a los campos de adjunto. Además, puede crear nuevas colecciones de archivos para almacenar archivos específicos.

[Obtenga más información en la documentación de la Colección de Archivos](/data-sources/file-manager/file-collection)

### Campo de Adjunto

Los campos de adjunto son campos de relación específicos relacionados con la colección de archivos, que puede crear a través del tipo de campo "Adjunto" o configurar mediante un campo de "Relación".

[Obtenga más información en la documentación del Campo de Adjunto](/data-sources/file-manager/field-attachment)

### Motor de Almacenamiento de Archivos

El motor de almacenamiento de archivos se utiliza para guardar archivos en servicios específicos, incluido el almacenamiento local (guardado en el disco duro del servidor), el almacenamiento en la nube, etc.

[Obtenga más información en la documentación del Motor de Almacenamiento de Archivos](./storage/index.md)

### API HTTP

Las cargas de archivos se pueden gestionar a través de la API HTTP. Consulte la [API HTTP](./http-api.md).

## Desarrollo

*