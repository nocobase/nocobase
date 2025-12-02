:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Integración de Solicitudes HTTP en Flujos de Trabajo

El nodo de Solicitud HTTP permite que los **flujos de trabajo** de NocoBase envíen solicitudes de forma proactiva a cualquier servicio HTTP, facilitando el intercambio de datos y la integración de negocios con sistemas externos.

## Descripción General

El nodo de Solicitud HTTP es un componente de integración fundamental en los **flujos de trabajo**, que le permite llamar a APIs de terceros, interfaces de servicios internos u otros servicios web durante la ejecución del **flujo de trabajo** para recuperar datos o activar operaciones externas.

## Casos de Uso Típicos

### Recuperación de Datos

- **Consultas de datos de terceros**: Obtenga datos en tiempo real de APIs de clima, APIs de tipo de cambio, etc.
- **Resolución de direcciones**: Llame a APIs de servicios de mapas para el análisis de direcciones y geocodificación.
- **Sincronización de datos empresariales**: Recupere datos de clientes y pedidos de sistemas CRM y ERP.

### Activadores de Negocio

- **Envío de mensajes**: Llame a servicios de SMS, correo electrónico o WeCom para enviar notificaciones.
- **Solicitudes de pago**: Inicie pagos, reembolsos y otras operaciones con pasarelas de pago.
- **Procesamiento de pedidos**: Envíe albaranes y consulte el estado logístico con sistemas de envío.

### Integración de Sistemas

- **Llamadas a microservicios**: Llame a APIs de otros servicios en arquitecturas de microservicios.
- **Reporte de datos**: Informe datos de negocio a plataformas de análisis y sistemas de monitoreo.
- **Servicios de terceros**: Integre servicios de IA, reconocimiento OCR, síntesis de voz, etc.

### Automatización

- **Tareas programadas**: Llame periódicamente a APIs externas para sincronizar datos.
- **Respuesta a eventos**: Llame automáticamente a APIs externas cuando los datos cambien para notificar a los sistemas relevantes.
- **Flujos de trabajo de aprobación**: Envíe solicitudes de aprobación a través de APIs de sistemas de aprobación.

## Características

### Soporte HTTP Completo

- Soporta todos los métodos HTTP: GET, POST, PUT, PATCH, DELETE.
- Encabezados de solicitud (Headers) personalizados.
- Múltiples formatos de datos: JSON, datos de formulario, XML, etc.
- Varios tipos de parámetros: parámetros de URL, parámetros de ruta, cuerpo de la solicitud.

### Procesamiento Flexible de Datos

- **Referencias de variables**: Construya solicitudes dinámicamente utilizando variables del **flujo de trabajo**.
- **Análisis de respuestas**: Analice automáticamente las respuestas JSON y extraiga los datos necesarios.
- **Transformación de datos**: Transforme los formatos de datos de solicitud y respuesta.
- **Manejo de errores**: Configure estrategias de reintento, ajustes de tiempo de espera y lógica de manejo de errores.

### Autenticación de Seguridad

- **Autenticación Básica**: Autenticación HTTP básica.
- **Token Bearer**: Autenticación por token.
- **Clave API**: Autenticación personalizada con clave API.
- **Encabezados personalizados**: Soporte para cualquier método de autenticación.

## Pasos de Uso

### 1. Verifique que el **plugin** esté habilitado

El nodo de Solicitud HTTP es una característica integrada del **plugin** de **flujo de trabajo**. Asegúrese de que el **plugin** de **[Flujo de trabajo](/plugins/@nocobase/plugin-workflow/)** esté habilitado.

### 2. Agregue un nodo de Solicitud HTTP al **flujo de trabajo**

1. Cree o edite un **flujo de trabajo**.
2. Agregue un nodo de **Solicitud HTTP** en la posición deseada.

![Solicitud HTTP - Agregar nodo](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Configure los parámetros de la solicitud.

### 3. Configure los Parámetros de la Solicitud

![Nodo de Solicitud HTTP - Configuración](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Configuración Básica

- **URL de la solicitud**: Dirección de la API de destino, admite el uso de variables.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Método de solicitud**: Seleccione GET, POST, PUT, DELETE, etc.

- **Encabezados de solicitud**: Configure los encabezados HTTP (Headers).
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parámetros de la solicitud**:
  - **Parámetros de consulta (Query)**: Parámetros de consulta de la URL.
  - **Parámetros de cuerpo (Body)**: Datos del cuerpo de la solicitud (POST/PUT).

#### Configuración Avanzada

- **Tiempo de espera (Timeout)**: Establezca el tiempo de espera de la solicitud (30 segundos por defecto).
- **Reintentar en caso de fallo**: Configure el número de reintentos y el intervalo entre ellos.
- **Ignorar fallo**: El **flujo de trabajo** continuará ejecutándose incluso si la solicitud falla.
- **Configuración de proxy**: Configure el proxy HTTP (si es necesario).

### 4. Utilice los Datos de la Respuesta

Después de la ejecución del nodo de Solicitud HTTP, los datos de la respuesta se pueden utilizar en nodos posteriores:

- `{{$node.data.status}}`: Código de estado HTTP.
- `{{$node.data.headers}}`: Encabezados de la respuesta.
- `{{$node.data.data}}`: Datos del cuerpo de la respuesta.
- `{{$node.data.error}}`: Mensaje de error (si la solicitud falla).

![Nodo de Solicitud HTTP - Uso de la respuesta](https://static-docs.nocobase.com/20240529110610.png)

## Escenarios de Ejemplo

### Ejemplo 1: Obtener Información Meteorológica

```javascript
// Configuración
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Usar la respuesta
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Ejemplo 2: Enviar Mensaje de WeCom

```javascript
// Configuración
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "El pedido {{$context.orderId}} ha sido enviado"
  }
}
```

### Ejemplo 3: Consultar Estado de Pago

```javascript
// Configuración
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Lógica condicional
Si {{$node.data.data.status}} es igual a "paid"
  - Actualizar el estado del pedido a "Pagado"
  - Enviar notificación de pago exitoso
De lo contrario, si {{$node.data.data.status}} es igual a "pending"
  - Mantener el estado del pedido como "Pendiente de pago"
De lo contrario
  - Registrar el fallo del pago
  - Notificar al administrador para gestionar la excepción
```

### Ejemplo 4: Sincronizar Datos con CRM

```javascript
// Configuración
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Configuración de Métodos de Autenticación

### Autenticación Básica

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Token Bearer

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Clave API

```javascript
// En el Encabezado
Headers:
  X-API-Key: your-api-key

// O en la Consulta (Query)
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Primero obtenga el `access_token`, luego utilícelo:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Manejo de Errores y Depuración

### Errores Comunes

1. **Tiempo de espera de conexión**: Verifique la conexión de red, aumente el tiempo de espera.
2. **401 No autorizado**: Verifique que las credenciales de autenticación sean correctas.
3. **404 No encontrado**: Verifique que la URL sea correcta.
4. **500 Error del servidor**: Consulte el estado del servicio del proveedor de la API.

### Consejos de Depuración

1. **Utilice nodos de registro**: Agregue nodos de registro antes y después de las solicitudes HTTP para registrar los datos de la solicitud y la respuesta.

2. **Revise los registros de ejecución**: Los registros de ejecución del **flujo de trabajo** contienen información detallada de las solicitudes y respuestas.

3. **Herramientas de prueba**: Pruebe la API primero utilizando herramientas como Postman, cURL, etc.

4. **Manejo de errores**: Agregue lógica condicional para manejar diferentes estados de respuesta.

```javascript
Si {{$node.data.status}} >= 200 y {{$node.data.status}} < 300
  - Procesar lógica de éxito
De lo contrario
  - Procesar lógica de fallo
  - Registrar error: {{$node.data.error}}
```

## Recomendaciones para la Optimización del Rendimiento

### 1. Utilice Procesamiento Asíncrono

Para las solicitudes que no requieren resultados inmediatos, considere utilizar **flujos de trabajo** asíncronos.

### 2. Configure Tiempos de Espera Razonables

Establezca tiempos de espera basados en los tiempos de respuesta reales de la API para evitar esperas excesivas.

### 3. Implemente Estrategias de Caché

Para datos que no cambian con frecuencia (configuraciones, diccionarios), considere almacenar en caché las respuestas.

### 4. Procesamiento por Lotes

Si necesita realizar múltiples llamadas a la misma API, considere utilizar los puntos finales de procesamiento por lotes de la API (si son compatibles).

### 5. Reintentos en Caso de Error

Configure estrategias de reintento razonables, pero evite reintentos excesivos que puedan provocar la limitación de la tasa de la API.

## Mejores Prácticas de Seguridad

### 1. Proteja la Información Sensible

- No exponga información sensible en las URLs.
- Utilice HTTPS para la transmisión cifrada.
- Almacene las claves API y los datos sensibles en variables de entorno o mediante gestión de configuración.

### 2. Valide los Datos de la Respuesta

```javascript
// Validar estado de la respuesta
if (![200, 201].includes($node.data.status)) {
  throw new Error('La solicitud a la API falló');
}

// Validar formato de datos
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Datos de respuesta inválidos');
}
```

### 3. Limite la Frecuencia de Solicitudes

Respete los límites de tasa de las APIs de terceros para evitar ser bloqueado.

### 4. Anonimización de Registros

Al registrar, asegúrese de anonimizar la información sensible (contraseñas, claves, etc.).

## Comparación con Webhook

| Característica | Nodo de Solicitud HTTP | Activador Webhook |
|-------------|--------------------------|-------------------|
| Dirección | NocoBase llama externamente | Externo llama a NocoBase |
| Momento | Durante la ejecución del **flujo de trabajo** | Cuando ocurre un evento externo |
| Propósito | Obtener datos, activar operaciones externas | Recibir notificaciones, eventos externos |
| Escenarios típicos | Llamar a API de pago, consultar el clima | Devoluciones de llamada de pago, notificaciones de mensajes |

Estas dos características se complementan entre sí para construir una solución completa de integración de sistemas.

## Recursos Relacionados

- [Documentación del **plugin** de **Flujo de trabajo**](/plugins/@nocobase/plugin-workflow/)
- [**Flujo de trabajo**: Nodo de Solicitud HTTP](/workflow/nodes/request)
- [**Flujo de trabajo**: Activador Webhook](/integration/workflow-webhook/)
- [Autenticación con Claves API](/integration/api-keys/)
- [**Plugin** de Documentación de API](/plugins/@nocobase/plugin-api-doc/)