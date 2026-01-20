:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campo de Adjunto

## Introducción

El sistema incluye un tipo de campo "Adjunto" que permite a los usuarios subir archivos en sus colecciones personalizadas.

El campo de Adjunto es, fundamentalmente, un campo de relación de muchos a muchos que apunta a la colección "Attachments" (`attachments`) integrada en el sistema. Cuando se crea un campo de Adjunto en cualquier colección, se genera automáticamente una tabla intermedia para la relación de muchos a muchos. Los metadatos de los archivos subidos se almacenan en la colección "Attachments", y la información de los archivos referenciados en la colección se asocia a través de esta tabla intermedia.

## Configuración del Campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restricciones de Tipo MIME

Se utiliza para restringir los tipos de archivos que se pueden subir, empleando el formato de sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo: `image/*` representa archivos de imagen. Puede separar varios tipos con una coma, como en `image/*,application/pdf`, que permite tanto archivos de imagen como PDF.

### Motor de Almacenamiento

Seleccione el motor de almacenamiento que se utilizará para guardar los archivos subidos. Si lo deja en blanco, se usará el motor de almacenamiento predeterminado del sistema.