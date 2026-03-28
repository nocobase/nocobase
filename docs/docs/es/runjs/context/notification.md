:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/notification).
:::

# ctx.notification

API de notificación global basada en Ant Design Notification, utilizada para mostrar paneles de notificación en la **esquina superior derecha** de la página. En comparación con `ctx.message`, las notificaciones pueden incluir un título y una descripción, lo que las hace adecuadas para contenido que debe mostrarse durante más tiempo o que requiere la atención del usuario.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / Eventos de acción** | Notificaciones de finalización de tareas, resultados de operaciones por lotes, finalización de exportaciones, etc. |
| **Flujo de eventos** | Alertas a nivel de sistema tras la finalización de procesos asíncronos. |
| **Contenido que requiere una visualización más prolongada** | Notificaciones completas con títulos, descripciones y botones de acción. |

## Definición de tipos

```ts
notification: NotificationInstance;
```

`NotificationInstance` es la interfaz de notificación de Ant Design, que proporciona los siguientes métodos.

## Métodos comunes

| Método | Descripción |
|------|------|
| `open(config)` | Abre una notificación con una configuración personalizada |
| `success(config)` | Muestra una notificación de tipo éxito |
| `info(config)` | Muestra una notificación de tipo información |
| `warning(config)` | Muestra una notificación de tipo advertencia |
| `error(config)` | Muestra una notificación de tipo error |
| `destroy(key?)` | Cierra la notificación con la clave (`key`) especificada; si no se proporciona una clave, se cierran todas |

**Parámetros de configuración** (consistentes con [Ant Design notification](https://ant.design/components/notification)):

| Parámetro | Tipo | Descripción |
|------|------|------|
| `message` | `ReactNode` | Título de la notificación |
| `description` | `ReactNode` | Descripción de la notificación |
| `duration` | `number` | Retraso de cierre automático (segundos). El valor predeterminado es 4.5 segundos; establezca 0 para que no se cierre automáticamente |
| `key` | `string` | Identificador único de la notificación, utilizado en `destroy(key)` para cerrar una notificación específica |
| `onClose` | `() => void` | Función de callback al cerrar |
| `placement` | `string` | Ubicación: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Ejemplos

### Uso básico

```ts
ctx.notification.open({
  message: 'Operación exitosa',
  description: 'Los datos se han guardado en el servidor.',
});
```

### Llamadas rápidas por tipo

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Duración y clave personalizadas

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // No cerrar automáticamente
});

// Cerrar manualmente tras la finalización de la tarea
ctx.notification.destroy('task-123');
```

### Cerrar todas las notificaciones

```ts
ctx.notification.destroy();
```

## Diferencia con ctx.message

| Característica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Ubicación** | Centro superior de la página | Esquina superior derecha (configurable) |
| **Estructura** | Aviso ligero de una sola línea | Puede incluir título + descripción |
| **Propósito** | Retroalimentación temporal, desaparece automáticamente | Notificación completa, puede mostrarse durante mucho tiempo |
| **Escenarios típicos** | Éxito de operación, fallo de validación, copia exitosa | Finalización de tareas, mensajes del sistema, contenido extenso que requiere atención |

## Relacionado

- [ctx.message](./message.md) - Aviso ligero superior, adecuado para una retroalimentación rápida
- [ctx.modal](./modal.md) - Confirmación en ventana emergente, interacción de tipo bloqueante
- [ctx.t()](./t.md) - Internacionalización, se utiliza a menudo junto con las notificaciones