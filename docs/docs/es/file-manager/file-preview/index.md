---
pkg: '@nocobase/plugin-file-manager'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Vista previa de archivos

En interfaces que contienen campos de archivo, incluidos campos de adjuntos, puede obtener una vista previa de los archivos haciendo clic en la miniatura o el icono del archivo. La función de vista previa integrada admite varios tipos de archivo, incluidas imágenes, PDF y la mayoría de los tipos de archivo compatibles de forma nativa con los navegadores.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Para los tipos de archivo que no admiten vista previa nativa, puede habilitar la vista previa instalando o ampliando los plugins de vista previa de archivos correspondientes. Por ejemplo, después de instalar el plugin de vista previa de archivos de Office, puede previsualizar archivos de Word, Excel y PowerPoint.

Actualmente, NocoBase proporciona los siguientes plugins de vista previa de archivos:

* Plugin de vista previa de archivos de Office

## Vista previa de PDF con almacenamiento externo

La vista previa de PDF utiliza PDF.js para renderizar archivos en el navegador. El navegador debe leer primero el contenido del archivo PDF y después pasarlo a PDF.js para su renderizado. Por lo tanto, cuando los archivos se almacenan en un almacenamiento externo como OSS, S3, COS o un CDN, y el dominio de acceso al archivo es diferente del dominio del sitio NocoBase, el almacenamiento externo debe permitir que el sitio NocoBase lea archivos entre orígenes.

Si CORS no está configurado, la descarga de PDF puede seguir funcionando normalmente, pero la vista previa puede fallar con un error de carga del archivo.

La configuración CORS del almacenamiento externo o CDN debe incluir:

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` debe configurarse con el dominio real usado para acceder a NocoBase. Evite usar `*` a largo plazo para archivos no públicos, porque amplía el rango de sitios que pueden leer los archivos.
