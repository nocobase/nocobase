:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# API HTTP

La carga de archivos, tanto para los campos de adjuntos como para las colecciones de archivos, se puede realizar a través de la API HTTP. El método de invocación varía según el motor de almacenamiento que utilice el campo de adjunto o la colección de archivos.

## Carga desde el Servidor

Para los motores de almacenamiento de código abierto integrados en el proyecto, como S3, OSS y COS, la API HTTP funciona de la misma manera que la función de carga de la interfaz de usuario, es decir, los archivos se cargan desde el servidor. Para llamar a la API, debe pasar un token JWT basado en el inicio de sesión del usuario a través del encabezado de solicitud `Authorization`; de lo contrario, se le denegará el acceso.

### Campo de Adjunto

Para subir un archivo, inicie una operación `create` en el recurso de adjuntos (`attachments`), envíe una solicitud POST y cargue el contenido binario a través del campo `file`. Una vez realizada la llamada, el archivo se subirá al motor de almacenamiento predeterminado.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Si necesita subir un archivo a un motor de almacenamiento diferente, puede usar el parámetro `attachmentField` para especificar el motor de almacenamiento configurado para el campo de la colección (si no está configurado, se subirá al motor de almacenamiento predeterminado).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Colección de Archivos

Al subir un archivo a una colección de archivos, se generará automáticamente un registro de archivo. Para ello, inicie una operación `create` en el recurso de la colección de archivos, envíe una solicitud POST y cargue el contenido binario a través del campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Cuando suba un archivo a una colección de archivos, no es necesario especificar un motor de almacenamiento; el archivo se subirá al motor de almacenamiento configurado para esa colección.

## Carga desde el Cliente

Para los motores de almacenamiento compatibles con S3 que se ofrecen a través del `plugin` comercial S3-Pro, la carga de archivos mediante la API HTTP requiere varios pasos.

### Campo de Adjunto

1.  Obtener Información del Motor de Almacenamiento

    Inicie una operación `getBasicInfo` en la colección `storages`, incluyendo el identificador del espacio de almacenamiento (`storage name`), para solicitar la información de configuración del motor de almacenamiento.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ejemplo de la información de configuración del motor de almacenamiento devuelta:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obtener Información Pre-firmada del Proveedor de Servicios

    Inicie una operación `createPresignedUrl` en el recurso `fileStorageS3`, envíe una solicitud POST e incluya la información relacionada con el archivo en el cuerpo de la solicitud para obtener la información de carga pre-firmada.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Nota:
    > 
    > * `name`: Nombre del archivo
    > * `size`: Tamaño del archivo (en bytes)
    > * `type`: El tipo MIME del archivo. Puede consultar: [Tipos MIME comunes](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * `storageId`: El ID del motor de almacenamiento (el campo `id` devuelto en el primer paso)
    > * `storageType`: El tipo del motor de almacenamiento (el campo `type` devuelto en el primer paso)
    > 
    > Ejemplo de datos de la solicitud:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La estructura de datos de la información pre-firmada obtenida es la siguiente:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Carga del Archivo

    Utilice la `putUrl` devuelta para iniciar una solicitud `PUT` y cargar el archivo como cuerpo de la solicitud.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Nota:
    > * `putUrl`: El campo `putUrl` devuelto en el paso anterior
    > * `file_path`: La ruta local del archivo que desea subir
    > 
    > Ejemplo de datos de la solicitud:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Crear Registro de Archivo

    Después de una carga exitosa, inicie una operación `create` en el recurso de adjuntos (`attachments`) enviando una solicitud POST para crear el registro del archivo.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Descripción de los datos dependientes en `data-raw`:
    > * `title`: El campo `fileInfo.title` devuelto en el paso anterior
    > * `filename`: El campo `fileInfo.key` devuelto en el paso anterior
    > * `extname`: El campo `fileInfo.extname` devuelto en el paso anterior
    > * `path`: Vacío por defecto
    > * `size`: El campo `fileInfo.size` devuelto en el paso anterior
    > * `url`: Vacío por defecto
    > * `mimetype`: El campo `fileInfo.mimetype` devuelto en el paso anterior
    > * `meta`: El campo `fileInfo.meta` devuelto en el paso anterior
    > * `storageId`: El campo `id` devuelto en el primer paso
    > 
    > Ejemplo de datos de la solicitud:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Colección de Archivos

Los tres primeros pasos son idénticos a los de la carga de archivos para un campo de adjunto. Sin embargo, en el cuarto paso, debe crear un registro de archivo iniciando una operación `create` en el recurso de la colección de archivos, enviando una solicitud POST y cargando la información del archivo a través del cuerpo de la solicitud.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Descripción de los datos dependientes en `data-raw`:
> * `title`: El campo `fileInfo.title` devuelto en el paso anterior
> * `filename`: El campo `fileInfo.key` devuelto en el paso anterior
> * `extname`: El campo `fileInfo.extname` devuelto en el paso anterior
> * `path`: Vacío por defecto
> * `size`: El campo `fileInfo.size` devuelto en el paso anterior
> * `url`: Vacío por defecto
> * `mimetype`: El campo `fileInfo.mimetype` devuelto en el paso anterior
> * `meta`: El campo `fileInfo.meta` devuelto en el paso anterior
> * `storageId`: El campo `id` devuelto en el primer paso
> 
> Ejemplo de datos de la solicitud:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```