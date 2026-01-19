:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Almacén de Vectores

## Introducción

En una base de conocimiento, al guardar documentos, estos se vectorizan. De manera similar, al recuperar documentos, los términos de búsqueda también se vectorizan. Ambos procesos requieren el uso de un `Embedding model` para transformar el texto original en vectores.

Dentro del plugin de Base de Conocimiento de IA, un almacén de vectores es la vinculación entre un `Embedding model` y una base de datos vectorial.

## Gestión de Almacenes de Vectores

Diríjase a la página de configuración del plugin de Empleados de IA, haga clic en la pestaña `Vector store` y seleccione `Vector store` para acceder a la página de gestión de almacenes de vectores.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Haga clic en el botón `Add new` (Añadir nuevo) en la esquina superior derecha para añadir un nuevo almacén de vectores:

- En el campo `Name`, introduzca el nombre del almacén de vectores.
- En `Vector store`, seleccione una base de datos vectorial ya configurada. Consulte: [Base de Datos Vectorial](/ai-employees/knowledge-base/vector-database).
- En `LLM service`, seleccione un servicio LLM ya configurado. Consulte: [Gestión de Servicios LLM](/ai-employees/quick-start/llm-service).
- En el campo `Embedding model`, introduzca el nombre del modelo `Embedding` que desea utilizar.

Haga clic en el botón `Submit` (Enviar) para guardar la información del almacén de vectores.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)