---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Evento Antes de la Acción

## Introducción

El plugin Evento Antes de la Acción ofrece un mecanismo de intercepción para las operaciones. Se activa después de que se envía una solicitud para una operación de creación, actualización o eliminación, pero antes de que esta sea procesada.

Si se ejecuta un nodo de "Finalizar flujo de trabajo" en el flujo de trabajo activado, o si cualquier otro nodo falla (por un error o una ejecución incompleta), la operación del formulario será interceptada. De lo contrario, la operación prevista se ejecutará con normalidad.

Al usarlo junto con el nodo "Mensaje de respuesta", puede configurar un mensaje que se devolverá al cliente, proporcionando información o avisos relevantes. Los eventos antes de la acción se pueden utilizar para realizar validaciones de negocio o comprobaciones lógicas, permitiendo o interceptando las solicitudes de operaciones de creación, actualización y eliminación enviadas por el cliente.

## Configuración del Disparador

### Crear un Disparador

Al crear un flujo de trabajo, seleccione el tipo "Evento Antes de la Acción":

![Crear Evento Antes de la Acción](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Seleccionar colección

En el disparador de un flujo de trabajo de intercepción, lo primero que debe configurar es la colección correspondiente a la operación:

![Configuración del Evento de Intercepción_Colección](https://static-docs.nocobase.com/8f7122caca8159d334cf776b838d53d6.png)

Luego, seleccione el modo de intercepción. Puede optar por interceptar solo el botón de acción vinculado a este flujo de trabajo, o por interceptar todas las operaciones seleccionadas para esta colección (sin importar de qué formulario provengan y sin necesidad de vincular el flujo de trabajo correspondiente):

### Modo de Intercepción

![Configuración del Evento de Intercepción_Modo de Intercepción](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Actualmente, los tipos de operación compatibles son "Crear", "Actualizar" y "Eliminar". Puede seleccionar varios tipos de operación simultáneamente.

## Configuración de la Operación

Si en la configuración del disparador seleccionó el modo "Activar intercepción solo cuando se envía un formulario vinculado a este flujo de trabajo", también deberá volver a la interfaz del formulario y vincular este flujo de trabajo al botón de operación correspondiente:

![Añadir Pedido_Vincular Flujo de Trabajo](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

En la configuración de vinculación del flujo de trabajo, seleccione el flujo de trabajo correspondiente. Normalmente, la selección predeterminada del contexto para los datos del disparador, "Datos completos del formulario", es suficiente:

![Seleccionar Flujo de Trabajo a Vincular](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Nota}
Los botones a los que se puede vincular un Evento Antes de la Acción actualmente solo admiten los botones "Enviar" (o "Guardar"), "Actualizar datos" y "Eliminar" en los formularios de creación o actualización. El botón "Activar flujo de trabajo" no es compatible (solo se puede vincular a un "Evento Después de la Acción").
:::

## Condiciones para la Intercepción

En un "Evento Antes de la Acción", existen dos condiciones que provocarán la intercepción de la operación correspondiente:

1. El flujo de trabajo llega a cualquier nodo de "Finalizar flujo de trabajo". De manera similar a las instrucciones anteriores, cuando los datos que activaron el flujo de trabajo no cumplen las condiciones preestablecidas en un nodo de "Condición", se ingresará a la rama "No" y se ejecutará el nodo "Finalizar flujo de trabajo". En este punto, el flujo de trabajo finalizará y la operación solicitada será interceptada.
2. Cualquier nodo del flujo de trabajo falla al ejecutarse, incluyendo errores de ejecución u otras situaciones excepcionales. En este caso, el flujo de trabajo finalizará con el estado correspondiente y la operación solicitada también será interceptada. Por ejemplo, si el flujo de trabajo llama a datos externos mediante una "Solicitud HTTP" y la solicitud falla, el flujo de trabajo finalizará con un estado de error y también interceptará la solicitud de operación correspondiente.

Una vez que se cumplen las condiciones de intercepción, la operación correspondiente ya no se ejecutará. Por ejemplo, si se intercepta el envío de un pedido, no se generarán los datos de pedido correspondientes.

## Parámetros Relacionados para la Operación Correspondiente

En un flujo de trabajo de tipo "Evento Antes de la Acción", el disparador contiene diferentes datos que pueden utilizarse como variables en el flujo para distintas operaciones:

| Tipo de operación \ Variable | "Operador" | "Identificador de rol del operador" | Parámetro de operación: "ID" | Parámetro de operación: "Objeto de datos enviado" |
| ---------------------------- | ---------- | ----------------------------------- | ---------------------------- | --------------------------------- |
| Crear un registro            | ✓          | ✓                                   | -                            | ✓                                 |
| Actualizar un registro       | ✓          | ✓                                   | ✓                            | ✓                                 |
| Eliminar uno o varios registros | ✓          | ✓                                   | ✓                            | -                                 |

:::info{title=Nota}
La variable "Datos del disparador / Parámetros de la operación / Objeto de datos enviado" en un Evento Antes de la Acción no son los datos reales de la base de datos, sino los parámetros relacionados con la operación enviada. Si necesita los datos reales de la base de datos, debe consultarlos mediante un nodo de "Consultar datos" dentro del flujo de trabajo.

Además, para una operación de eliminación, el "ID" en los parámetros de la operación es un valor único cuando se trata de un solo registro, pero es un array cuando se trata de varios registros.
:::

## Mensaje de Respuesta de Salida

Una vez configurado el disparador, puede personalizar la lógica de decisión en el flujo de trabajo. Normalmente, utilizará el modo de ramificación del nodo "Condición" para decidir si "Finalizar flujo de trabajo" y devolver un "Mensaje de respuesta" preestablecido, basándose en los resultados de las condiciones de negocio específicas:

![Configuración del Flujo de Trabajo del Interceptor](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Con esto, la configuración del flujo de trabajo correspondiente está completa. Ahora puede intentar enviar datos que no cumplan con las condiciones configuradas en el nodo de condición del flujo de trabajo para activar la lógica de intercepción. En ese momento, verá el mensaje de respuesta devuelto:

![Mensaje de Respuesta de Error](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Estado del Mensaje de Respuesta

Si el nodo "Finalizar flujo de trabajo" está configurado para salir con un estado de "Éxito", la solicitud de la operación seguirá siendo interceptada cuando se ejecute este nodo, pero el mensaje de respuesta devuelto se mostrará con un estado de "Éxito" (en lugar de "Error"):

![Mensaje de Respuesta de Estado de Éxito](https://static-docs.nocobase.com/9559bbf65067144759451294b18c790e.png)

## Ejemplo

Combinando las instrucciones básicas anteriores, tomemos como ejemplo un escenario de "Envío de Pedido". Supongamos que necesitamos verificar el inventario de todos los productos seleccionados por el usuario al enviar un pedido. Si el inventario de cualquiera de los productos seleccionados es insuficiente, se intercepta el envío del pedido y se devuelve un mensaje de aviso correspondiente. El flujo de trabajo recorrerá y verificará cada producto hasta que el inventario de todos los productos sea suficiente, momento en el cual procederá y creará los datos del pedido para el usuario.

Los demás pasos son los mismos que en las instrucciones. Sin embargo, dado que un pedido involucra varios productos, además de agregar una relación de muchos a muchos "Pedido" <-- M:1 -- "Detalle de Pedido" -- 1:M --> "Producto" en el modelado de datos, también necesita agregar un nodo de "Bucle" en el flujo de trabajo "Evento Antes de la Acción" para verificar iterativamente si el inventario de cada producto es suficiente:

![Ejemplo_Flujo de Trabajo de Verificación en Bucle](https://static-docs.nocobase.com/8307de47d629595ab6cf00f8aa898e3.png)

El objeto para el bucle se selecciona como el array "Detalle de Pedido" de los datos del pedido enviado:

![Ejemplo_Configuración del Objeto del Bucle](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

El nodo de condición dentro del bucle se utiliza para determinar si el inventario del objeto de producto actual en el bucle es suficiente:

![Ejemplo_Condición en el Bucle](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Otras configuraciones son las mismas que en el uso básico. Cuando finalmente se envía el pedido, si algún producto tiene inventario insuficiente, el envío del pedido será interceptado y se devolverá un mensaje de aviso correspondiente. Durante las pruebas, intente enviar un pedido con varios productos, donde uno tiene inventario insuficiente y otro tiene inventario suficiente. Podrá ver el mensaje de respuesta devuelto:

![Ejemplo_Mensaje de Respuesta después del Envío](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Como puede ver, el mensaje de respuesta no indica que el primer producto, "iPhone 15 pro", tiene inventario insuficiente, sino solo el segundo producto, "iPhone 14 pro". Esto se debe a que, en el bucle, el primer producto tiene inventario suficiente, por lo que no se intercepta, mientras que el segundo producto tiene inventario insuficiente, lo que sí intercepta el envío del pedido.

## Invocación Externa

El Evento Antes de la Acción se inyecta durante la fase de procesamiento de la solicitud, por lo que también admite ser activado mediante llamadas a la API HTTP.

Para los flujos de trabajo que están vinculados localmente a un botón de operación, puede invocarlos de esta manera (tomando como ejemplo el botón de creación de la colección `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

El parámetro URL `triggerWorkflows` es la clave del flujo de trabajo; varias claves de flujo de trabajo se separan por comas. Esta clave se puede obtener al pasar el ratón sobre el nombre del flujo de trabajo en la parte superior del lienzo del flujo de trabajo:

![Flujo de Trabajo_Clave_Método de Vista](https://static-docs.nocobase.com/20240426135108.png)

Una vez realizada la llamada anterior, se activará el Evento Antes de la Acción para la colección `posts` correspondiente. Después de que el flujo de trabajo asociado se procese de forma síncrona, los datos se crearán y se devolverán con normalidad.

Si el flujo de trabajo configurado llega a un "nodo final", la lógica es la misma que con una operación de interfaz: la solicitud será interceptada y no se crearán datos. Si el estado del nodo final se configura como fallido, el código de estado de la respuesta devuelta será `400`; si es exitoso, será `200`.

Si también se configura un nodo de "Mensaje de respuesta" antes del nodo final, el mensaje generado también se devolverá en el resultado de la respuesta. La estructura para un error es:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

La estructura del mensaje cuando el "nodo final" se configura para éxito es:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Nota}
Dado que se pueden añadir varios nodos de "Mensaje de respuesta" en un flujo de trabajo, la estructura de datos del mensaje devuelto es un array.
:::

Si el Evento Antes de la Acción está configurado en modo global, al llamar a la API HTTP, no necesita usar el parámetro URL `triggerWorkflows` para especificar el flujo de trabajo correspondiente; simplemente invocar la operación de la colección asociada lo activará.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Nota"}
Al activar un evento antes de la acción mediante una llamada a la API HTTP, también debe prestar atención al estado de habilitación del flujo de trabajo y si la configuración de la colección coincide, de lo contrario, la llamada podría no tener éxito o generar un error.
:::