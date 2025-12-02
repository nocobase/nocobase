:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Integración de Webhooks en flujos de trabajo

A través de los disparadores de Webhook, NocoBase puede recibir llamadas HTTP de sistemas de terceros y activar automáticamente flujos de trabajo, logrando una integración fluida con sistemas externos.

## Resumen

Un Webhook es un mecanismo de "API inversa" que permite a los sistemas externos enviar datos de forma proactiva a NocoBase cuando ocurren eventos específicos. En comparación con el sondeo activo (polling), los Webhooks ofrecen un enfoque de integración más eficiente y en tiempo real.

## Casos de uso típicos

### Envío de datos de formularios

Sistemas externos de encuestas, formularios de registro o formularios de comentarios de clientes pueden enviar datos a NocoBase a través de un Webhook después de que un usuario los envíe. Esto permite crear registros automáticamente y activar procesos de seguimiento (como el envío de correos electrónicos de confirmación o la asignación de tareas).

### Notificaciones de mensajes

Eventos de plataformas de mensajería de terceros (como WeCom, DingTalk o Slack), tales como nuevos mensajes, menciones o aprobaciones completadas, pueden activar procesos automatizados en NocoBase mediante Webhooks.

### Sincronización de datos

Cuando los datos cambian en sistemas externos (como CRM o ERP), los Webhooks envían las actualizaciones a NocoBase en tiempo real para mantener la sincronización de los datos.

### Integración de servicios de terceros

- **GitHub**: Eventos como el envío de código (code pushes) o la creación de solicitudes de extracción (PR) activan flujos de trabajo de automatización.
- **GitLab**: Notificaciones de estado de los procesos de CI/CD.
- **Envío de formularios**: Sistemas de formularios externos envían datos a NocoBase.
- **Dispositivos IoT**: Cambios de estado de dispositivos, informes de datos de sensores.

## Características

### Mecanismo de disparador flexible

- Soporta métodos HTTP como GET, POST, PUT y DELETE.
- Analiza automáticamente formatos comunes como JSON y datos de formularios.
- Permite configurar la validación de solicitudes para asegurar que las fuentes sean confiables.

### Capacidades de procesamiento de datos

- Los datos recibidos se pueden usar como variables en los flujos de trabajo.
- Soporta lógica compleja de transformación y procesamiento de datos.
- Se puede combinar con otros nodos de flujo de trabajo para implementar lógica de negocio compleja.

### Garantía de seguridad

- Soporta verificación de firma para prevenir solicitudes falsificadas.
- Permite configurar una lista blanca de IP.
- Transmisión cifrada HTTPS.

## Pasos de uso

### 1. Instalar el plugin

Localice e instale el plugin **[Flujo de trabajo: Disparador de Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** en el gestor de plugins.

> Nota: Este es un plugin comercial que requiere compra o suscripción por separado.

### 2. Crear un flujo de trabajo de Webhook

1. Vaya a la página de **Gestión de flujos de trabajo**.
2. Haga clic en **Crear flujo de trabajo**.
3. Seleccione **Disparador de Webhook** como tipo de disparador.

![Crear flujo de trabajo de Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Configure los parámetros del Webhook.

![Configuración del disparador de Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Ruta de solicitud**: Ruta URL personalizada del Webhook.
   - **Método de solicitud**: Seleccione los métodos HTTP permitidos (GET/POST/PUT/DELETE).
   - **Sincrónico/Asincrónico**: Elija si desea esperar a que el flujo de trabajo finalice antes de devolver los resultados.
   - **Validación**: Configure la verificación de firma u otros mecanismos de seguridad.

### 3. Configurar los nodos del flujo de trabajo

Añada nodos de flujo de trabajo según sus requisitos de negocio, por ejemplo:

- **Operaciones de colección**: Crear, actualizar, eliminar registros.
- **Lógica condicional**: Crear ramas basadas en los datos recibidos.
- **Solicitud HTTP**: Llamar a otras API.
- **Notificaciones**: Enviar correos electrónicos, SMS, etc.
- **Código personalizado**: Ejecutar código JavaScript.

### 4. Obtener la URL del Webhook

Una vez creado el flujo de trabajo, el sistema generará una URL de Webhook única, normalmente con el formato:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configurar en el sistema de terceros

Configure la URL del Webhook generada en el sistema de terceros:

- Establezca la dirección de devolución de llamada para el envío de datos en los sistemas de formularios.
- Configure el Webhook en GitHub/GitLab.
- Configure la dirección de envío de eventos en WeCom/DingTalk.

### 6. Probar el Webhook

Pruebe el Webhook utilizando herramientas como Postman o cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Acceso a los datos de la solicitud

En los flujos de trabajo, puede acceder a los datos recibidos por el Webhook a través de variables:

- `{{$context.data}}`: Datos del cuerpo de la solicitud.
- `{{$context.headers}}`: Información de los encabezados de la solicitud.
- `{{$context.query}}`: Parámetros de consulta de la URL.
- `{{$context.params}}`: Parámetros de ruta.

![Análisis de parámetros de solicitud](https://static-docs.nocobase.com/20241210111155.png)

![Análisis del cuerpo de la solicitud](https://static-docs.nocobase.com/20241210112529.png)

## Configuración de la respuesta

![Configuración de la respuesta](https://static-docs.nocobase.com/20241210114312.png)

### Modo sincrónico

Devuelve los resultados una vez que el flujo de trabajo ha finalizado su ejecución. Se puede configurar:

- **Código de estado de respuesta**: 200, 201, etc.
- **Datos de respuesta**: Datos JSON personalizados a devolver.
- **Encabezados de respuesta**: Encabezados HTTP personalizados.

### Modo asincrónico

Devuelve una confirmación inmediata y el flujo de trabajo se ejecuta en segundo plano. Es adecuado para:

- Flujos de trabajo de larga duración.
- Escenarios que no requieren la devolución de resultados de ejecución.
- Escenarios de alta concurrencia.

## Mejores prácticas de seguridad

### 1. Habilitar la verificación de firma

La mayoría de los servicios de terceros soportan mecanismos de firma:

```javascript
// Ejemplo: Verificar la firma de un Webhook de GitHub
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Usar HTTPS

Asegúrese de que NocoBase esté desplegado en un entorno HTTPS para proteger la transmisión de datos.

### 3. Restringir las fuentes de solicitud

Configure una lista blanca de IP para permitir únicamente solicitudes de fuentes confiables.

### 4. Validación de datos

Añada lógica de validación de datos en los flujos de trabajo para asegurar que los datos recibidos tienen el formato correcto y un contenido válido.

### 5. Auditoría de registros

Registre todas las solicitudes de Webhook para facilitar el seguimiento y la resolución de problemas.

## Solución de problemas

### ¿El Webhook no se dispara?

1. Verifique que la URL del Webhook sea correcta.
2. Confirme que el estado del flujo de trabajo sea "Habilitado".
3. Revise los registros de envío del sistema de terceros.
4. Revise la configuración del firewall y de la red.

### ¿Cómo depurar Webhooks?

1. Consulte los registros de ejecución del flujo de trabajo para obtener información detallada sobre las solicitudes y los resultados.
2. Utilice herramientas de prueba de Webhooks (como Webhook.site) para verificar las solicitudes.
3. Revise los datos clave y los mensajes de error en los registros de ejecución.

### ¿Cómo gestionar los reintentos?

Algunos servicios de terceros reintentan el envío si no reciben una respuesta exitosa:

- Asegúrese de que el flujo de trabajo sea idempotente.
- Utilice identificadores únicos para la deduplicación.
- Registre los ID de las solicitudes procesadas.

### Consejos para la optimización del rendimiento

- Utilice el modo asincrónico para operaciones que consumen mucho tiempo.
- Añada lógica condicional para filtrar las solicitudes que no necesitan ser procesadas.
- Considere usar colas de mensajes para escenarios de alta concurrencia.

## Escenarios de ejemplo

### Procesamiento de envíos de formularios externos

```javascript
// 1. Verificar la fuente de datos
// 2. Analizar los datos del formulario
const formData = context.data;

// 3. Crear un registro de cliente
// 4. Asignar al responsable correspondiente
// 5. Enviar un correo electrónico de confirmación al remitente
if (formData.email) {
  // Enviar notificación por correo electrónico
}
```

### Notificación de envío de código de GitHub

```javascript
// 1. Analizar los datos de envío
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Si es la rama principal
if (branch === 'main') {
  // 3. Activar el proceso de despliegue
  // 4. Notificar a los miembros del equipo
}
```

![Ejemplo de flujo de trabajo de Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Recursos relacionados

- [Documentación del plugin de flujos de trabajo](/plugins/@nocobase/plugin-workflow/)
- [Flujo de trabajo: Disparador de Webhook](/workflow/triggers/webhook)
- [Flujo de trabajo: Nodo de solicitud HTTP](/integration/workflow-http-request/)
- [Autenticación con claves API](/integration/api-keys/)