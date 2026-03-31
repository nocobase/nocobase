---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Conversación Multimodal

## Imágenes

Si el modelo lo permite, el nodo LLM puede enviar imágenes al modelo. Para usar esta función, debe seleccionar un campo de archivo adjunto o un registro de una colección de archivos asociada a través de una variable. Al seleccionar un registro de la colección de archivos, puede elegir entre el nivel de objeto o el campo URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Existen dos opciones para el formato de envío de imágenes:

- Enviar por URL - Todas las imágenes, excepto las almacenadas localmente, se enviarán como URL. Las imágenes almacenadas localmente se convertirán a formato base64 antes de ser enviadas.
- Enviar por base64 - Todas las imágenes, ya sean almacenadas localmente o en la nube, se enviarán en formato base64. Esto es útil en situaciones donde la URL de la imagen no puede ser accedida directamente por el servicio LLM en línea.

![](https://static-docs.nocobase.com/202503041200638.png)