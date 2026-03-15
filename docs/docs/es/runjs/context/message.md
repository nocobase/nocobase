:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/message).
:::

# ctx.message

API de mensajes globales de Ant Design, utilizada para mostrar avisos temporales ligeros en la parte superior central de la página. Los mensajes se cierran automáticamente después de un tiempo determinado o pueden ser cerrados manualmente por el usuario.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback de operaciones, avisos de validación, éxito al copiar y otros avisos ligeros |
| **Operaciones de formulario / Flujo de trabajo** | Feedback para éxito en el envío, fallo al guardar, error de validación, etc. |
| **Eventos de acción (JSAction)** | Feedback inmediato para clics, finalización de operaciones por lotes, etc. |

## Definición de tipos

```ts
message: MessageInstance;
```

`MessageInstance` es la interfaz de mensaje de Ant Design, que proporciona los siguientes métodos.

## Métodos comunes

| Método | Descripción |
|------|------|
| `success(content, duration?)` | Muestra un aviso de éxito |
| `error(content, duration?)` | Muestra un aviso de error |
| `warning(content, duration?)` | Muestra un aviso de advertencia |
| `info(content, duration?)` | Muestra un aviso de información |
| `loading(content, duration?)` | Muestra un aviso de carga (debe cerrarse manualmente) |
| `open(config)` | Abre un mensaje utilizando una configuración personalizada |
| `destroy()` | Cierra todos los mensajes mostrados actualmente |

**Parámetros:**

- `content` (`string` | `ConfigOptions`): Contenido del mensaje o objeto de configuración
- `duration` (`number`, opcional): Retraso de cierre automático (segundos), por defecto 3 segundos; establezca 0 para no cerrar automáticamente

**ConfigOptions** (cuando `content` es un objeto):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Contenido del mensaje
  duration?: number;        // Retraso de cierre automático (segundos)
  onClose?: () => void;    // Función de callback al cerrar
  icon?: React.ReactNode;  // Icono personalizado
}
```

## Ejemplos

### Uso básico

```ts
ctx.message.success('Operación exitosa');
ctx.message.error('Operación fallida');
ctx.message.warning('Por favor, seleccione los datos primero');
ctx.message.info('Procesando...');
```

### Internacionalización con ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading y cierre manual

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Ejecutar operación asíncrona
await saveData();
hide();  // Cerrar manualmente el loading
ctx.message.success(ctx.t('Saved'));
```

### Uso de open con configuración personalizada

```ts
ctx.message.open({
  type: 'success',
  content: 'Aviso de éxito personalizado',
  duration: 5,
  onClose: () => console.log('mensaje cerrado'),
});
```

### Cerrar todos los mensajes

```ts
ctx.message.destroy();
```

## Diferencia entre ctx.message y ctx.notification

| Característica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posición** | Parte superior central de la página | Esquina superior derecha |
| **Propósito** | Aviso temporal ligero, desaparece automáticamente | Panel de notificación, puede incluir título y descripción, adecuado para una visualización más prolongada |
| **Escenarios típicos** | Feedback de operación, avisos de validación, éxito al copiar | Notificaciones de finalización de tareas, mensajes del sistema, contenido extenso que requiere atención del usuario |

## Relacionado

- [ctx.notification](./notification.md) - Notificaciones en la esquina superior derecha, adecuadas para tiempos de visualización más largos
- [ctx.modal](./modal.md) - Confirmación modal, interacción bloqueante
- [ctx.t()](./t.md) - Internacionalización, comúnmente utilizada con message