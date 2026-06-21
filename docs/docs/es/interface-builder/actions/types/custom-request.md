# Solicitud personalizada

## Introducción

Cuando en un proceso es necesario invocar una API externa o un servicio de terceros, se puede activar una solicitud HTTP personalizada mediante Custom Request. Los escenarios de uso comunes incluyen:

* Invocar API de sistemas externos (como CRM, servicios de IA, etc.)
* Obtener datos remotos y procesarlos en pasos posteriores del flujo
* Enviar datos a sistemas de terceros (Webhook, notificaciones de mensajes, etc.)
* Activar flujos automatizados de servicios internos o externos

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Configuración de la Action

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

En Configuración del botón -> Solicitud personalizada, se pueden configurar los siguientes elementos:

* HTTP method: método de la solicitud HTTP, por ejemplo GET, POST, PUT, DELETE, etc.
* URL: dirección de destino de la solicitud; se puede introducir una URL completa o concatenar dinámicamente mediante variables.
* Headers: información de los headers de la solicitud, utilizada para transmitir información de autenticación o configuración de la API, por ejemplo Authorization, Content-Type, etc.
* Parameters: parámetros de consulta de URL (Query Parameters), normalmente utilizados en solicitudes GET.
* Body: contenido del cuerpo de la solicitud, normalmente utilizado en solicitudes POST, PUT, etc.; se puede introducir JSON, datos de formulario, etc.
* Timeout config: configuración del tiempo de espera de la solicitud, utilizada para limitar el tiempo máximo de espera y evitar que el flujo quede bloqueado durante demasiado tiempo.
* Response type: tipo de datos de la respuesta de la solicitud.
* JSON: la API devuelve datos JSON; el resultado se inyecta en el contexto del flujo y puede obtenerse en pasos posteriores mediante ctx.steps.
* Stream: la API devuelve un flujo de datos (Stream); tras una solicitud exitosa, se activará automáticamente la descarga del archivo.
* Access control: control de acceso, utilizado para limitar qué roles pueden activar este paso de solicitud, garantizando la seguridad de la invocación de la API.

## Otros elementos de configuración de la Action

Además de la configuración de la solicitud, el botón de solicitud personalizada también admite estas configuraciones comunes:

- [Editar botón](/interface-builder/actions/action-settings/edit-button): configurar título, estilo, icono, etc. del botón;
- [Reglas de interacción de Action](/interface-builder/actions/action-settings/linkage-rule): controlar dinámicamente la visibilidad, deshabilitación, etc. del botón según condiciones;
- [Doble confirmación](/interface-builder/actions/action-settings/double-check): mostrar primero un cuadro de confirmación al hacer clic, antes de enviar realmente la solicitud;
