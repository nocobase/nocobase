---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/file-manager/file-preview/ms-office).
:::

# Vista previa de archivos de Office <Badge>v1.8.11+</Badge>

El plugin Office File Preview se utiliza para previsualizar archivos en formato Office en las aplicaciones de NocoBase, como Word, Excel y PowerPoint.  
Se basa en un servicio público en línea proporcionado por Microsoft, que permite incrustar archivos accesibles a través de una URL pública en una interfaz de vista previa, permitiendo a los usuarios ver estos archivos en un navegador sin necesidad de descargarlos o utilizar aplicaciones de Office.

## Manual de usuario

Por defecto, el plugin se encuentra en estado **desactivado**. Puede utilizarlo tras activarlo en el gestor de plugins, sin necesidad de configuración adicional.

![Interfaz de activación del plugin](https://static-docs.nocobase.com/20250731140048.png)

Después de cargar correctamente un archivo de Office (Word / Excel / PowerPoint) en un campo de archivo de una colección, haga clic en el icono o enlace del archivo correspondiente para ver el contenido en la interfaz de vista previa emergente o incrustada.

![Ejemplo de operación de vista previa](https://static-docs.nocobase.com/20250731143231.png)

## Principio de implementación

La vista previa incrustada por este plugin depende del servicio público en línea de Microsoft (Office Web Viewer). El proceso principal es el siguiente:

- El frontend genera una URL accesible públicamente para el archivo cargado por el usuario (incluyendo URLs firmadas de S3);
- El plugin carga la vista previa del archivo en un iframe utilizando la siguiente dirección:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL pública del archivo>
  ```

- El servicio de Microsoft solicita el contenido del archivo desde esta URL, lo renderiza y devuelve una página visualizable.

## Notas

- Debido a que este plugin depende del servicio en línea de Microsoft, asegúrese de que la conexión a la red sea normal y que se pueda acceder a los servicios relacionados de Microsoft.
- Microsoft accederá a la URL del archivo que usted proporcione, y el contenido del archivo será almacenado temporalmente en caché por su servidor para renderizar la página de vista previa. Por lo tanto, existe un cierto riesgo de privacidad. Si tiene dudas al respecto, se recomienda no utilizar la función de vista previa proporcionada por este plugin[^1].
- El archivo que se desea previsualizar debe tener una URL accesible públicamente. En circunstancias normales, los archivos cargados en NocoBase generarán automáticamente enlaces públicos accesibles (incluyendo las URLs firmadas generadas por el plugin S3-Pro), pero si el archivo tiene permisos de acceso configurados o está almacenado en un entorno de red interna, no se podrá previsualizar[^2].
- El servicio no admite autenticación de inicio de sesión ni recursos en almacenamiento privado. Por ejemplo, los archivos que solo son accesibles dentro de una red interna o que requieren inicio de sesión no pueden utilizar esta función de vista previa.
- Después de que el servicio de Microsoft rastree el contenido del archivo, este puede quedar en caché durante un breve periodo de tiempo. Incluso si el archivo de origen se elimina, el contenido de la vista previa podría seguir siendo accesible durante un tiempo.
- Existen límites recomendados para el tamaño de los archivos: se recomienda que los archivos de Word y PowerPoint no superen los 10 MB, y los de Excel no superen los 5 MB para garantizar la estabilidad de la vista previa[^3].
- Actualmente, no existe una descripción oficial clara de la licencia de uso comercial para este servicio. Evalúe los riesgos por su cuenta al utilizarlo[^4].

## Formatos de archivo compatibles

El plugin solo admite la vista previa de los siguientes formatos de archivo de Office, basándose en el tipo MIME o la extensión del archivo:

- Documentos de Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) o `application/msword` (`.doc`)
- Hojas de cálculo de Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) o `application/vnd.ms-excel` (`.xls`)
- Presentaciones de PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) o `application/vnd.ms-powerpoint` (`.ppt`)
- Texto OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Otros formatos de archivo no activarán la función de vista previa de este plugin.

[^1]: [¿Cuál es el estado de view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - El acceso denegado o los archivos no públicos no se pueden previsualizar](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - Límites de tamaño de archivo para Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Uso comercial de Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)