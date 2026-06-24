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

* [Plugin de vista previa de archivos de Office](../file-preview/ms-office.md)

## Vista previa de PDF con almacenamiento externo

NocoBase muestra la vista previa de PDF mediante un iframe del navegador. Algunos navegadores o lectores de PDF pueden admitir scripts, formularios u otro contenido interactivo dentro de los archivos PDF. Si el archivo previsualizado procede de una fuente no confiable, conviene prestar atención al límite de seguridad de la ejecución de scripts.

Recomendamos aislar el dominio de acceso a archivos de los dominios del sitio NocoBase y de la API. Por ejemplo, sirve los archivos de OSS, S3, COS o un CDN desde un dominio dedicado, en lugar de compartir el mismo origen con el frontend o la API de NocoBase.

Si el dominio de archivos es diferente del dominio de la API, y la API no habilita CORS para el dominio de archivos, los scripts que se ejecuten en el entorno de vista previa de PDF suelen quedar restringidos por la política de mismo origen del navegador. No pueden leer directamente la página de NocoBase, el almacenamiento del navegador ni las respuestas de la API.
