---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Evento de Acción Personalizada

## Introducción

NocoBase incluye acciones de datos comunes (como añadir, eliminar, actualizar, ver, etc.). Cuando estas acciones no son suficientes para necesidades de negocio complejas, puede utilizar eventos de acción personalizada en un flujo de trabajo. Al vincular este evento a un botón de "Activar flujo de trabajo" en un bloque de página, se activará un flujo de trabajo de acción personalizada cuando un usuario haga clic en él.

## Crear un flujo de trabajo

Al crear un flujo de trabajo, seleccione "Evento de Acción Personalizada":

![Crear "Evento de Acción Personalizada" flujo de trabajo](https://static-docs.nocobase.com/20240509091820.png)

## Configuración del activador

### Tipo de contexto

> v.1.6.0+

El tipo de contexto determina a qué botones de bloque se puede vincular el flujo de trabajo:

*   Sin contexto: Un evento global que se puede vincular a botones de acción en la barra de acciones y en bloques de datos.
*   Registro único: Se puede vincular a botones de acción en bloques de datos como filas de tabla, formularios y detalles.
*   Múltiples registros: Se puede vincular a botones de acción masiva en una tabla.

![Configuración del activador_Tipo de contexto](https://static-docs.nocobase.com/20250215135808.png)

### Colección

Cuando el tipo de contexto es "Registro único" o "Múltiples registros", debe seleccionar la colección a la que vincular el modelo de datos:

![Configuración del activador_Seleccionar colección](https://static-docs.nocobase.com/20250215135919.png)

### Datos de relación a utilizar

Si necesita utilizar los datos de relación de la fila de datos activadora en el flujo de trabajo, puede seleccionar aquí los campos de relación profundos:

![Configuración del activador_Seleccionar datos de relación a utilizar](https://static-docs.nocobase.com/20250215135955.png)

Estos campos se precargarán automáticamente en el contexto del flujo de trabajo después de que se active el evento, lo que los hará disponibles para su uso en el flujo de trabajo.

## Configuración de la acción

La configuración de los botones de acción en los diferentes bloques varía según el tipo de contexto configurado en el flujo de trabajo.

### Sin contexto

> v.1.6.0+

En la barra de acciones y en otros bloques de datos, puede añadir un botón de "Activar flujo de trabajo":

![Añadir botón de acción al bloque_Barra de acciones](https://static-docs.nocobase.com/20250215221738.png)

![Añadir botón de acción al bloque_Calendario](https://static-docs.nocobase.com/20250215221942.png)

![Añadir botón de acción al bloque_Diagrama de Gantt](https://static-docs.nocobase.com/20250215221810.png)

Después de añadir el botón, vincule el flujo de trabajo sin contexto creado anteriormente. A continuación, se muestra un ejemplo utilizando un botón en la barra de acciones:

![Vincular flujo de trabajo al botón_Barra de acciones](https://static-docs.nocobase.com/20250215222120.png)

![Seleccionar flujo de trabajo a vincular_Sin contexto](https://static-docs.nocobase.com/20250215222234.png)

### Registro único

En cualquier bloque de datos, se puede añadir un botón de "Activar flujo de trabajo" a la barra de acciones para un registro único, como en formularios, filas de tabla, detalles, etc.:

![Añadir botón de acción al bloque_Formulario](https://static-docs.nocobase.com/20240509165428.png)

![Añadir botón de acción al bloque_Fila de tabla](https://static-docs.nocobase.com/20240509165340.png)

![Añadir botón de acción al bloque_Detalles](https://static-docs.nocobase.com/20240509165545.png)

Después de añadir el botón, vincule el flujo de trabajo creado anteriormente:

![Vincular flujo de trabajo al botón](https://static-docs.nocobase.com/20240509165631.png)

![Seleccionar flujo de trabajo a vincular](https://static-docs.nocobase.com/20240509165658.png)

Posteriormente, al hacer clic en este botón se activará el evento de acción personalizada:

![Resultado de hacer clic en el botón](https://static-docs.nocobase.com/20240509170453.png)

### Múltiples registros

> v.1.6.0+

En la barra de acciones de un bloque de tabla, al añadir un botón de "Activar flujo de trabajo", hay una opción adicional para seleccionar el tipo de contexto: "Sin contexto" o "Múltiples registros":

![Añadir botón de acción al bloque_Tabla](https://static-docs.nocobase.com/20250215222507.png)

Cuando se selecciona "Sin contexto", se trata de un evento global y solo se puede vincular a flujos de trabajo sin contexto.

Cuando se selecciona "Múltiples registros", puede vincular un flujo de trabajo de tipo "múltiples registros", que se puede utilizar para acciones masivas después de seleccionar varios registros (actualmente solo compatible con tablas). Los flujos de trabajo disponibles se limitan a aquellos configurados para coincidir con la colección del bloque de datos actual:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Al hacer clic en el botón para activar, se deben haber marcado algunas filas de datos en la tabla; de lo contrario, el flujo de trabajo no se activará:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Ejemplo

Por ejemplo, tenemos una colección de "Muestras". Para las muestras con estado "Recopilado", necesitamos proporcionar una acción de "Enviar a inspección". Esta acción primero verificará la información básica de la muestra, luego generará un "Registro de inspección" y finalmente cambiará el estado de la muestra a "Enviado". Esta serie de procesos no se puede completar con simples clics de botones de "añadir, eliminar, actualizar, ver", por lo que se puede utilizar un evento de acción personalizada para implementarlo.

Primero, cree una colección de "Muestras" y una colección de "Registros de inspección", e introduzca algunos datos de prueba básicos en la colección de Muestras:

![Ejemplo_Colección de muestras](https://static-docs.nocobase.com/20240509172234.png)

Luego, cree un flujo de trabajo de "Evento de Acción Personalizada". Si necesita una retroalimentación oportuna del proceso de operación, puede elegir el modo síncrono (en modo síncrono, no puede utilizar nodos asíncronos como el procesamiento manual):

![Ejemplo_Crear flujo de trabajo](https://static-docs.nocobase.com/20240509173106.png)

En la configuración del activador, seleccione "Muestras" para la colección:

![Ejemplo_Configuración del activador](https://static-docs.nocobase.com/20240509173148.png)

Organice la lógica en el proceso según los requisitos del negocio. Por ejemplo, permita el envío a inspección solo cuando el parámetro del indicador sea mayor que `90`; de lo contrario, muestre un mensaje relevante:

![Ejemplo_Organización de la lógica de negocio](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Sugerencia}
El nodo "[Mensaje de respuesta](../nodes/response-message.md)" se puede utilizar en eventos de acción personalizada síncronos para devolver un mensaje de aviso al cliente. No se puede utilizar en modo asíncrono.
:::

Después de configurar y habilitar el flujo de trabajo, regrese a la interfaz de la tabla y añada un botón de "Activar flujo de trabajo" en la columna de acciones de la tabla:

![Ejemplo_Añadir botón de acción](https://static-docs.nocobase.com/20240509174525.png)

Luego, en el menú de configuración del botón, elija vincular un flujo de trabajo y abra la ventana emergente de configuración:

![Ejemplo_Abrir ventana emergente de vinculación de flujo de trabajo](https://static-docs.nocobase.com/20240509174633.png)

Añada el flujo de trabajo habilitado anteriormente:

![Ejemplo_Seleccionar flujo de trabajo](https://static-docs.nocobase.com/20240509174723.png)

Después de enviar, cambie el texto del botón al nombre de la acción, como "Enviar a inspección". El proceso de configuración ya está completo.

Para usarlo, seleccione cualquier dato de muestra en la tabla y haga clic en el botón "Enviar a inspección" para activar el evento de acción personalizada. Según la lógica organizada anteriormente, si el parámetro del indicador de la muestra es inferior a 90, se mostrará el siguiente aviso después de hacer clic:

![Ejemplo_El indicador no cumple los criterios de envío](https://static-docs.nocobase.com/20240509175026.png)

Si el parámetro del indicador es superior a 90, el proceso se ejecutará normalmente, generando un "Registro de inspección" y cambiando el estado de la muestra a "Enviado".

![Ejemplo_Envío exitoso](https://static-docs.nocobase.com/20240509175247.png)

En este punto, un evento de acción personalizada simple está completo. De manera similar, para negocios con operaciones complejas como el procesamiento de pedidos o la presentación de informes, los eventos de acción personalizada se pueden utilizar para su implementación.

## Llamada externa

La activación de eventos de acción personalizada no se limita a las acciones de la interfaz de usuario; también se puede activar mediante llamadas a la API HTTP. Específicamente, los eventos de acción personalizada proporcionan un nuevo tipo de acción para todas las acciones de colección para activar flujos de trabajo: `trigger`, que se puede llamar utilizando la API de acción estándar de NocoBase.

Un flujo de trabajo activado por un botón, como en el ejemplo, se puede llamar de la siguiente manera:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Dado que esta acción es para un solo registro, al llamarla sobre datos existentes, debe especificar el ID de la fila de datos, reemplazando la parte `<:id>` en la URL.

Si se llama para un formulario (como para crear o actualizar), puede omitir el ID para un formulario que crea nuevos datos, pero debe pasar los datos enviados como contexto de ejecución:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Para un formulario de actualización, debe pasar tanto el ID de la fila de datos como los datos actualizados:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Si se pasan tanto un ID como datos, primero se cargará la fila de datos correspondiente al ID, y luego se utilizarán las propiedades del objeto de datos pasado para sobrescribir la fila de datos original y obtener el contexto de datos de activación final.

:::warning{title="Nota"}
Si se pasan datos de relación, también se sobrescribirán. Tenga especial precaución al manejar los datos entrantes si la precarga de elementos de datos de relación está configurada, para evitar sobrescrituras inesperadas de datos de relación.
:::

Además, el parámetro URL `triggerWorkflows` es la clave del flujo de trabajo; varias claves de flujo de trabajo se separan por comas. Esta clave se puede obtener al pasar el ratón sobre el nombre del flujo de trabajo en la parte superior del lienzo del flujo de trabajo:

![Flujo de trabajo_Clave_Método de visualización](https://static-docs.nocobase.com/20240426135108.png)

Después de una llamada exitosa, se activará el evento de acción personalizada para la colección `samples` correspondiente.

:::info{title="Sugerencia"}
Dado que las llamadas externas también deben basarse en la identidad del usuario, al realizar llamadas a través de la API HTTP, al igual que las solicitudes enviadas desde la interfaz normal, debe proporcionar información de autenticación. Esto incluye el encabezado de solicitud `Authorization` o el parámetro `token` (el token obtenido al iniciar sesión), y el encabezado de solicitud `X-Role` (el nombre del rol actual del usuario).
:::

Si necesita activar un evento para datos de relación uno a uno (uno a muchos no es compatible actualmente) en esta acción, puede utilizar `!` en el parámetro para especificar los datos de activación del campo de relación:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Después de una llamada exitosa, se activará el evento de acción personalizada para la colección `categories` correspondiente.

:::info{title="Sugerencia"}
Al activar un evento de acción a través de una llamada a la API HTTP, también debe prestar atención al estado habilitado del flujo de trabajo y si la configuración de la colección coincide; de lo contrario, la llamada podría no tener éxito o podría resultar en un error.
:::