---
title: "Campo de archivos adjuntos"
description: "Campo de archivos adjuntos que se relaciona con la tabla de archivos para almacenar imágenes, documentos y otros archivos."
keywords: "campo de archivos adjuntos,field-attachment,relación de archivos,imágenes,documentos,NocoBase"
---

# Campo de archivos adjuntos

## Introducción

El sistema incluye el tipo de campo «Archivo adjunto», que permite a los usuarios cargar archivos en las tablas de datos personalizadas.

El campo de archivos adjuntos es, internamente, un campo de relación de muchos a muchos que apunta a una tabla de archivos integrada del sistema llamada «Archivos adjuntos» (`attachments`). Al crear un campo de archivos adjuntos en cualquier tabla de datos, se genera automáticamente una tabla intermedia para la relación de muchos a muchos con la tabla de archivos adjuntos. Los metadatos de los archivos cargados se almacenan en la tabla «Archivos adjuntos», mientras que la información de los archivos referenciados en la tabla de datos se relaciona mediante esta tabla intermedia.

## Configuración del campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Límite de tipos MIME

Se utiliza para limitar los tipos de archivo permitidos para la carga. El formato se describe mediante la sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo: `image/*` representa archivos de imagen. Se pueden separar varios tipos con comas en inglés; por ejemplo: `image/*,application/pdf` indica que se permiten archivos de imagen y archivos PDF.

### Motor de almacenamiento

Selecciona el motor de almacenamiento utilizado para guardar los archivos cargados. Si se deja vacío, se utilizará el motor de almacenamiento predeterminado del sistema.
