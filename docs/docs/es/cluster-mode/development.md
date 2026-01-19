:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Desarrollo de plugins

## Problema de fondo

En un entorno de nodo único, los plugins suelen satisfacer los requisitos a través de estados en proceso, eventos o tareas. Sin embargo, en un modo de clúster, el mismo plugin puede ejecutarse simultáneamente en múltiples instancias, enfrentando los siguientes problemas típicos:

-   **Consistencia del estado**: Si los datos de configuración o de tiempo de ejecución se almacenan solo en memoria, resulta difícil sincronizarlos entre instancias, lo que puede provocar lecturas inconsistentes o ejecuciones duplicadas.
-   **Programación de tareas**: Sin un mecanismo claro de cola y confirmación, las tareas de larga duración pueden ser ejecutadas concurrentemente por múltiples instancias.
-   **Condiciones de carrera**: Las operaciones que implican cambios de esquema o asignación de recursos deben serializarse para evitar conflictos causados por escrituras concurrentes.

El núcleo de NocoBase proporciona varias interfaces de middleware en la capa de aplicación para ayudar a los plugins a reutilizar capacidades unificadas en un entorno de clúster. Las siguientes secciones presentarán el uso y las mejores prácticas de caché, mensajería síncrona, colas de mensajes y bloqueos distribuidos, con referencias al código fuente.

## Soluciones

### Componente de caché (Cache)

Para los datos que necesitan almacenarse en memoria, se recomienda utilizar el componente de caché integrado del sistema para su gestión.

-   Obtenga la instancia de caché predeterminada a través de `app.cache`.
-   `Cache` proporciona operaciones básicas como `set/get/del/reset`, y también admite `wrap` y `wrapWithCondition` para encapsular la lógica de caché, así como métodos por lotes como `mset/mget/mdel`.
-   Al implementar en un clúster, se recomienda colocar los datos compartidos en un almacenamiento persistente (como Redis) y establecer un `ttl` razonable para evitar la pérdida de caché al reiniciar la instancia.

Ejemplo: [Inicialización y uso de caché en `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Crear y usar una caché en un plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Administrador de mensajes síncronos (SyncMessageManager)

Si el estado en memoria no puede gestionarse con una caché distribuida (por ejemplo, no puede serializarse), entonces cuando el estado cambie debido a las acciones del usuario, el cambio debe notificarse a otras instancias a través de una señal síncrona para mantener la consistencia del estado.

-   La clase base del plugin ha implementado `sendSyncMessage`, que internamente llama a `app.syncMessageManager.publish` y añade automáticamente un prefijo a nivel de aplicación al canal para evitar conflictos.
-   `publish` puede especificar una `transaction`, y el mensaje se enviará después de que la transacción de la base de datos se haya confirmado, asegurando la sincronización del estado y del mensaje.
-   Utilice `handleSyncMessage` para procesar mensajes de otras instancias. La suscripción durante la fase `beforeLoad` es muy adecuada para escenarios como cambios de configuración y sincronización de esquemas.

Ejemplo: [`plugin-data-source-main` utiliza mensajes síncronos para mantener la consistencia del esquema en múltiples nodos](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Sincronizar actualizaciones de esquema dentro de un plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Llama automáticamente a app.syncMessageManager.publish
  }
}
```

### Administrador de publicación/suscripción (PubSubManager)

La difusión de mensajes es el componente subyacente de las señales síncronas y también puede utilizarse directamente. Cuando necesite difundir mensajes entre instancias, puede utilizar este componente.

-   `app.pubSubManager.subscribe(channel, handler, { debounce })` puede utilizarse para suscribirse a un canal entre instancias; la opción `debounce` se utiliza para evitar devoluciones de llamada frecuentes causadas por difusiones repetidas.
-   `publish` admite `skipSelf` (el valor predeterminado es `true`) y `onlySelf` para controlar si el mensaje se envía de vuelta a la instancia actual.
-   Se debe configurar un adaptador (como Redis, RabbitMQ, etc.) antes de que la aplicación se inicie; de lo contrario, por defecto no se conectará a un sistema de mensajería externo.

Ejemplo: [`plugin-async-task-manager` utiliza PubSub para difundir eventos de cancelación de tareas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Difundir señal de cancelación de tarea"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Componente de cola de eventos (EventQueue)

La cola de mensajes se utiliza para programar tareas asíncronas, siendo adecuada para operaciones de larga duración o que pueden reintentarse.

-   Declare un consumidor con `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` devuelve una `Promise`, y puede utilizar `AbortSignal.timeout` para controlar los tiempos de espera.
-   `publish` añade automáticamente el prefijo del nombre de la aplicación y admite opciones como `timeout` y `maxRetries`. Por defecto, utiliza un adaptador de cola en memoria, pero puede cambiarse a adaptadores extendidos como RabbitMQ según sea necesario.
-   En un clúster, asegúrese de que todos los nodos utilicen el mismo adaptador para evitar la fragmentación de tareas entre nodos.

Ejemplo: [`plugin-async-task-manager` utiliza EventQueue para programar tareas](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Distribuir tareas asíncronas en una cola"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Administrador de bloqueos distribuidos (LockManager)

Cuando necesite evitar condiciones de carrera, puede utilizar un bloqueo distribuido para serializar el acceso a un recurso.

-   Por defecto, proporciona un adaptador `local` basado en procesos. Puede registrar implementaciones distribuidas como Redis. Utilice `app.lockManager.runExclusive(key, fn, ttl)` o `acquire`/`tryAcquire` para controlar la concurrencia.
-   `ttl` se utiliza como salvaguarda para liberar el bloqueo, evitando que se mantenga indefinidamente en casos excepcionales.
-   Los escenarios comunes incluyen: cambios de esquema, prevención de tareas duplicadas, limitación de velocidad, etc.

Ejemplo: [`plugin-data-source-main` utiliza un bloqueo distribuido para proteger el proceso de eliminación de campos](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serializar operación de eliminación de campo"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Recomendaciones de desarrollo

-   **Consistencia del estado en memoria**: Intente evitar el uso de estados en memoria durante el desarrollo. En su lugar, utilice caché o mensajes síncronos para mantener la consistencia del estado.
-   **Priorice la reutilización de interfaces integradas**: Utilice capacidades unificadas como `app.cache` y `app.syncMessageManager` para evitar reimplementar la lógica de comunicación entre nodos en los plugins.
-   **Preste atención a los límites de las transacciones**: Las operaciones con transacciones deben utilizar `transaction.afterCommit` (`syncMessageManager.publish` ya lo tiene integrado) para garantizar la consistencia de los datos y los mensajes.
-   **Desarrolle una estrategia de retroceso**: Para las tareas de cola y difusión, establezca valores razonables para `timeout`, `maxRetries` y `debounce` para evitar nuevos picos de tráfico en situaciones excepcionales.
-   **Utilice monitoreo y registro complementarios**: Aproveche los registros de la aplicación para registrar nombres de canales, cargas de mensajes, claves de bloqueo, etc., para facilitar la resolución de problemas intermitentes en un clúster.

Con estas capacidades, los plugins pueden compartir estados de forma segura, sincronizar configuraciones y programar tareas entre diferentes instancias, cumpliendo con los requisitos de estabilidad y consistencia de los escenarios de implementación en clúster.