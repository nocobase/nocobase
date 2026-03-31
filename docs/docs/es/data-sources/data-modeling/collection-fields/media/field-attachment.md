:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campo de Adjunto

## Introducción

El sistema incluye un tipo de campo "Adjunto" para permitir a los usuarios subir archivos en sus colecciones personalizadas.

A nivel interno, el campo de adjunto es un campo de relación de muchos a muchos que apunta a la colección de "Adjuntos" (`attachments`) integrada en el sistema. Cuando usted crea un campo de adjunto en cualquier colección, se genera automáticamente una tabla de unión de muchos a muchos. Los metadatos de los archivos subidos se almacenan en la colección de "Adjuntos", y la información de los archivos referenciados en su colección se vincula a través de esta tabla de unión.

## Configuración del campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restricción de tipo MIME

Se utiliza para restringir los tipos de archivos que se pueden subir, empleando la sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo, `image/*` representa archivos de imagen. Puede separar varios tipos con comas, como `image/*,application/pdf`, lo que permite archivos de imagen y PDF.

### Motor de almacenamiento

Seleccione el motor de almacenamiento para los archivos subidos. Si lo deja en blanco, se utilizará el motor de almacenamiento predeterminado del sistema.