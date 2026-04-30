# Nodo de AI Employee

## Introducción

El nodo de AI Employee se utiliza para asignar a un AI Employee la realización de una tarea específica dentro de un workflow y obtener una salida estructurada.

Una vez creado el workflow, al añadir un nodo del workflow podrá seleccionar el nodo de AI Employee.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Configuración del nodo
### Preparativos

Antes de configurar el nodo de AI Employee, debe conocer cómo construir un workflow, cómo configurar el servicio LLM, así como el papel de los AI Employees integrados y la forma de crear AI Employees.

Puede consultar la siguiente documentación:
  - [Workflow](/workflow)
  - [Configurar el servicio LLM](/ai-employees/features/llm-service)
  - [AI Employees integrados](/ai-employees/features/built-in-employee)
  - [Crear AI Employees](/ai-employees/features/new-ai-employees)

### Tarea
#### Selección del AI Employee

Seleccione un AI Employee responsable de gestionar la tarea de este nodo. Elija de la lista desplegable un AI Employee integrado ya habilitado en el sistema o uno creado por usted.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Selección del modelo

Seleccione el modelo de lenguaje grande que impulsará al AI Employee. Elija de la lista desplegable un modelo proporcionado por un servicio LLM ya configurado en el sistema.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Selección del operador

Seleccione un usuario del sistema para proporcionar al AI Employee permisos de acceso a los datos. Cuando el AI Employee consulte datos, lo hará dentro del ámbito de permisos de dicho usuario.

Si el disparador proporciona un operador (por ejemplo, `Custom action event`), se utilizarán de forma prioritaria los permisos de ese operador.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompt y descripción de la tarea

`Background` se utiliza como el prompt del sistema enviado a la IA y, normalmente, sirve para describir la información de contexto y las restricciones de la tarea.

`Default user message` es el prompt de usuario enviado a la IA y, normalmente, describe el contenido de la tarea, indicando a la IA qué debe hacer.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Adjuntos

`Attachments` se envía a la IA junto con `Default user message`. Suele tratarse de los documentos o imágenes que deben procesarse en la tarea.

Los adjuntos admiten dos tipos:

1. `File(load via Files collection)`: utiliza la clave primaria para obtener datos de la tabla de archivos indicada y los emplea como adjunto enviado a la IA.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL`: obtiene un archivo desde la URL indicada y lo utiliza como adjunto enviado a la IA.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Skills y Tools

Por lo general, un AI Employee tiene asociadas varias Skills y Tools. Aquí puede limitar el uso a unas pocas Skills o Tools en la tarea actual.

El valor por defecto es `Preset`, que utiliza las Skills y Tools predefinidas del AI Employee. Si lo establece en `Customer`, podrá seleccionar y utilizar solo algunas Skills o Tools del AI Employee.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Búsqueda en la web

El interruptor `Web search` controla si la IA del nodo actual utiliza la capacidad de búsqueda en la web. Para más detalles sobre la búsqueda en la web del AI Employee consulte: [Búsqueda en la web](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Comentarios y notificaciones
#### Salida estructurada

El usuario puede definir la estructura de los datos de salida final del nodo de AI Employee siguiendo la especificación [JSON Schema](https://json-schema.org/).

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Otros nodos del workflow que obtengan datos del nodo de AI Employee también generarán las opciones disponibles a partir de este `JSON Schema`.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Valor por defecto

Por defecto se proporciona la siguiente definición de `JSON Schema`. Define un objeto que contiene una propiedad llamada result de tipo cadena. Además, se ha establecido un título para esa propiedad: Result.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

De acuerdo con esta definición, el nodo de AI Employee generará datos JSON con una estructura conforme a la definición.

```json
{
  result: "Some text generated from LLM "
}
```

#### Configuración de aprobación

El nodo admite tres modos de aprobación:

- `No required`: el contenido generado por la IA no requiere revisión humana. Una vez la IA termina su salida, el workflow continúa de forma automática.
- `Human decision`: el contenido generado por la IA debe ser notificado obligatoriamente al revisor para revisión humana; el workflow solo continúa después de dicha revisión.
- `AI decision`: la IA decide si notificar al revisor para una revisión humana del contenido de salida.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Si el modo de aprobación no es `No required`, se debe configurar uno o varios revisores para el nodo.

Cuando la IA del nodo de AI Employee termina de generar todo el contenido, se envía una notificación a todos los revisores configurados en el nodo. Basta con que uno de los revisores notificados complete la operación de aprobación para que el workflow pueda continuar.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
