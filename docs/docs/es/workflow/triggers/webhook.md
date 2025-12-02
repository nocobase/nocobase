---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Webhook

## Introducción

El disparador de Webhook proporciona una URL que puede ser invocada por sistemas de terceros mediante solicitudes HTTP. Cuando ocurre un evento en un sistema externo, este envía una solicitud HTTP a dicha URL para activar la ejecución del flujo de trabajo. Es ideal para notificaciones iniciadas por sistemas externos, como devoluciones de pago (callbacks) o mensajes.

## Crear un flujo de trabajo

Al crear un flujo de trabajo, seleccione el tipo "Evento Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Nota"}
La diferencia entre los flujos de trabajo "síncronos" y "asíncronos" radica en que un flujo de trabajo síncrono espera a que su ejecución se complete antes de devolver una respuesta. Por otro lado, un flujo de trabajo asíncrono devuelve inmediatamente la respuesta configurada en el disparador y pone la ejecución en cola en segundo plano.
:::

## Configuración del disparador

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL del Webhook

La URL del disparador de Webhook es generada automáticamente por el sistema y está vinculada a este flujo de trabajo. Puede hacer clic en el botón de la derecha para copiarla y pegarla en el sistema de terceros.

Solo se admite el método HTTP POST; otros métodos devolverán un error `405`.

### Seguridad

Actualmente, se admite la autenticación básica HTTP. Puede habilitar esta opción y establecer un nombre de usuario y una contraseña. Para implementar la autenticación de seguridad del Webhook, incluya el nombre de usuario y la contraseña en la URL del Webhook en el sistema de terceros (para más detalles sobre el estándar, consulte: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Cuando se configuran un nombre de usuario y una contraseña, el sistema verificará si coinciden con los de la solicitud. Si no se proporcionan o no coinciden, se devolverá un error `401`.

### Parsear datos de la solicitud

Cuando un tercero invoca el Webhook, los datos que contiene la solicitud deben ser parseados antes de poder utilizarlos en el flujo de trabajo. Una vez parseados, estos datos se convierten en variables del disparador, que pueden ser referenciadas en nodos posteriores.

El parseo de las solicitudes HTTP se divide en tres partes:

1.  Encabezados de la solicitud

    Los encabezados de la solicitud suelen ser pares clave-valor simples de tipo cadena de texto. Los campos de encabezado que necesite utilizar pueden configurarse directamente, como `Date`, `X-Request-Id`, etc.

2.  Parámetros de la solicitud

    Los parámetros de la solicitud son la parte de los parámetros de consulta en la URL, como el parámetro `query` en `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Puede pegar una URL de ejemplo completa o solo la parte de los parámetros de consulta, y hacer clic en el botón de parseo para analizar automáticamente los pares clave-valor.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    El parseo automático convertirá la parte de los parámetros de la URL en una estructura JSON y generará rutas como `query[0]`, `query[0].a` según la jerarquía de los parámetros. El nombre de esta ruta puede modificarse manualmente si no se ajusta a sus necesidades, aunque normalmente no es necesario. El alias es el nombre de visualización de la variable cuando se utiliza, y es opcional. Además, el parseo generará una tabla completa de parámetros del ejemplo; puede eliminar cualquier parámetro que no necesite.

3.  Cuerpo de la solicitud

    El cuerpo de la solicitud es la parte `Body` de la solicitud HTTP. Actualmente, solo se admiten cuerpos de solicitud con un formato `Content-Type` de `application/json`. Puede configurar directamente las rutas que desea parsear, o puede introducir un ejemplo JSON y hacer clic en el botón de parseo para un análisis automático.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    El parseo automático convertirá los pares clave-valor de la estructura JSON en rutas. Por ejemplo, `{"a": 1, "b": {"c": 2}}` generará rutas como `a`, `b` y `b.c`. El alias es el nombre de visualización de la variable cuando se utiliza, y es opcional. Además, el parseo generará una tabla completa de parámetros del ejemplo; puede eliminar cualquier parámetro que no necesite.

### Configuración de la respuesta

La configuración de la respuesta del Webhook difiere entre los flujos de trabajo síncronos y asíncronos. Para los flujos de trabajo asíncronos, la respuesta se configura directamente en el disparador. Al recibir una solicitud de Webhook, se devuelve inmediatamente la respuesta configurada en el disparador al sistema de terceros, y luego se ejecuta el flujo de trabajo. En cambio, los flujos de trabajo síncronos requieren que se añada un nodo de respuesta dentro del flujo para manejarla según los requisitos del negocio (para más detalles, consulte: [Nodo de respuesta](#nodo-de-respuesta)).

Normalmente, la respuesta para un evento Webhook disparado de forma asíncrona tiene un código de estado `200` y un cuerpo de respuesta `ok`. También puede personalizar el código de estado, los encabezados y el cuerpo de la respuesta según sea necesario.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Nodo de respuesta

Referencia: [Nodo de respuesta](../nodes/response.md)

## Ejemplo

En un flujo de trabajo de Webhook, puede devolver diferentes respuestas según las distintas condiciones de negocio, como se muestra en la siguiente imagen:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Utilice un nodo de bifurcación condicional para determinar si se cumple un determinado estado de negocio. Si se cumple, devuelva una respuesta de éxito; de lo contrario, devuelva una respuesta de fallo.