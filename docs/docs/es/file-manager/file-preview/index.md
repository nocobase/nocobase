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

- [Plugin de vista previa de archivos de Office](./ms-office.md)

## Mecanismo de vista previa de PDF

NocoBase elige el método de vista previa según si la URL del archivo PDF tiene el mismo origen que la página actual:

| URL del archivo | Almacenamiento habitual | Método de vista previa | Requisito de CORS |
| --- | --- | --- | --- |
| Mismo origen que NocoBase | Almacenamiento local | NocoBase lee el archivo y lo renderiza con PDF.js integrado | No interviene CORS entre orígenes |
| Origen distinto | Almacenamiento externo como OSS, S3, COS o CDN | El navegador abre la URL en un iframe | La vista previa en iframe no requiere CORS |

:::tip Criterio de selección

El método depende del origen de la URL, no directamente del nombre del motor de almacenamiento. El almacenamiento local servido desde un dominio de archivos independiente se trata como un origen distinto. El almacenamiento externo accedido mediante un proxy de NocoBase con el mismo origen se trata como el mismo origen.

:::

### Almacenamiento local o URL del mismo origen

Las URL del almacenamiento local suelen comenzar por `/storage/uploads/` y tienen el mismo origen que la página de NocoBase. Durante la vista previa, NocoBase lee los datos del PDF y utiliza PDF.js integrado para renderizar las páginas y el texto.

Este método no depende del lector de PDF integrado en el navegador. Aunque la respuesta use `Content-Disposition: attachment` por seguridad, NocoBase puede leer el archivo y renderizarlo en el componente de vista previa. La URL debe ser accesible con la sesión actual.

### Almacenamiento externo o URL de otro origen

Los servicios OSS, S3, COS y CDN suelen usar un dominio independiente. NocoBase coloca la URL del PDF en un iframe, por lo que el resultado depende del navegador y de los encabezados de respuesta del servicio de almacenamiento.

Para abrir el PDF en el iframe, el servicio normalmente debe devolver `Content-Type: application/pdf` y no debe forzar la descarga mediante `Content-Disposition: attachment`. Si la respuesta exige una descarga, el navegador descarga el archivo directamente y NocoBase no puede reemplazar este comportamiento desde el frontend.

Cargar un PDF de otro origen en un iframe no requiere CORS. Sin embargo, el botón de descarga lee el archivo con `fetch` y crea un Blob, de modo que las descargas entre orígenes sí requieren que el servicio permita solicitudes CORS desde el sitio de NocoBase.

### Consideraciones para Aliyun OSS

En algunos casos, el dominio predeterminado de Aliyun OSS fuerza la descarga mediante `Content-Disposition: attachment` y `x-oss-force-download: true`. Las imágenes pueden seguir mostrándose, mientras que un PDF abierto en el iframe se descarga.

Normalmente se resuelve vinculando un dominio personalizado al bucket y configurando NocoBase para acceder a los archivos mediante ese dominio. Consulte [Problemas comunes de Aliyun OSS](../storage/aliyun-oss.md#problemas-comunes) para ver la configuración y el diagnóstico.

### Límite de seguridad de la vista previa entre orígenes

Algunos navegadores o lectores de PDF pueden admitir scripts, formularios u otro contenido interactivo dentro de los archivos PDF. Si el archivo previsualizado procede de una fuente no confiable, conviene prestar atención al límite de seguridad de la ejecución de scripts.

Recomendamos aislar el dominio de acceso a archivos de los dominios del sitio NocoBase y de la API. Por ejemplo, sirve los archivos de OSS, S3, COS o un CDN desde un dominio dedicado, en lugar de compartir el mismo origen con el frontend o la API de NocoBase.

Si el dominio de archivos es diferente del dominio de la API, y la API no habilita CORS para el dominio de archivos, los scripts que se ejecuten en el entorno de vista previa de PDF suelen quedar restringidos por la política de mismo origen del navegador. No pueden leer directamente la página de NocoBase, el almacenamiento del navegador ni las respuestas de la API.

## Enlaces relacionados

- [Plugin de vista previa de archivos de Office](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
