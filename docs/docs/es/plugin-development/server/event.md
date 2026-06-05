:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Eventos

El servidor de NocoBase desencadena eventos correspondientes durante el ciclo de vida de la aplicación, el ciclo de vida de los **plugins** y las operaciones de la base de datos. Los desarrolladores de **plugins** pueden escuchar estos eventos para implementar lógica de extensión, operaciones automatizadas o comportamientos personalizados.

El sistema de eventos de NocoBase se divide principalmente en dos niveles:

-   **`app.on()` - Eventos a nivel de aplicación**: Permite escuchar los eventos del ciclo de vida de la aplicación, como el inicio, la instalación o la habilitación de **plugins**.
-   **`db.on()` - Eventos a nivel de base de datos**: Permite escuchar los eventos de operación a nivel del modelo de datos, como la creación, actualización o eliminación de registros.

Ambos heredan de `EventEmitter` de Node.js y admiten las interfaces estándar `.on()`, `.off()` y `.emit()`. NocoBase también extiende el soporte para `emitAsync`, que se utiliza para desencadenar eventos de forma asíncrona y esperar a que todos los oyentes finalicen su ejecución.

## Dónde registrar los oyentes de eventos

Los oyentes de eventos generalmente deben registrarse en el método `beforeLoad()` del **plugin**, para asegurar que los eventos estén listos durante la fase de carga del **plugin** y que la lógica posterior pueda responder de manera adecuada.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Escuchar eventos de la aplicación
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase se ha iniciado');
    });

    // Escuchar eventos de la base de datos
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nueva publicación: ${model.get('title')}`);
      }
    });
  }
}
```

## Escuchar eventos de la aplicación `app.on()`

Los eventos de la aplicación se utilizan para capturar los cambios en el ciclo de vida de la aplicación NocoBase y los **plugins**, y son adecuados para la lógica de inicialización, el registro de recursos o la detección de dependencias de **plugins**.

### Tipos de eventos comunes

| Nombre del evento | Momento de activación | Usos típicos |
|---|---|---|
| `beforeLoad` / `afterLoad` | Antes / después de la carga de la aplicación | Registrar recursos, inicializar configuración |
| `beforeStart` / `afterStart` | Antes / después del inicio del servicio | Iniciar tareas, registrar logs de inicio |
| `beforeInstall` / `afterInstall` | Antes / después de la instalación de la aplicación | Inicializar datos, importar plantillas |
| `beforeStop` / `afterStop` | Antes / después de la detención del servicio | Limpiar recursos, guardar estado |
| `beforeDestroy` / `afterDestroy` | Antes / después de la destrucción de la aplicación | Eliminar caché, desconectar conexiones |
| `beforeLoadPlugin` / `afterLoadPlugin` | Antes / después de la carga del **plugin** | Modificar la configuración del **plugin** o extender funcionalidades |
| `beforeEnablePlugin` / `afterEnablePlugin` | Antes / después de la habilitación del **plugin** | Verificar dependencias, inicializar la lógica del **plugin** |
| `beforeDisablePlugin` / `afterDisablePlugin` | Antes / después de la deshabilitación del **plugin** | Limpiar recursos del **plugin** |
| `afterUpgrade` | Después de completar la actualización de la aplicación | Ejecutar migración de datos o correcciones de compatibilidad |

Ejemplo: Escuchar el evento de inicio de la aplicación

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 ¡El servicio de NocoBase se ha iniciado!');
});
```

Ejemplo: Escuchar el evento de carga de un **plugin**

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`El plugin ${plugin.name} se ha cargado`);
});
```

## Escuchar eventos de la base de datos `db.on()`

Los eventos de la base de datos pueden capturar varios cambios de datos a nivel del modelo, y son adecuados para auditorías, sincronización, autocompletado y otras operaciones.

### Tipos de eventos comunes

| Nombre del evento | Momento de activación |
|---|---|
| `beforeSync` / `afterSync` | Antes / después de sincronizar la estructura de la base de datos |
| `beforeValidate` / `afterValidate` | Antes / después de la validación de datos |
| `beforeCreate` / `afterCreate` | Antes / después de crear registros |
| `beforeUpdate` / `afterUpdate` | Antes / después de actualizar registros |
| `beforeSave` / `afterSave` | Antes / después de guardar (incluye creación y actualización) |
| `beforeDestroy` / `afterDestroy` | Antes / después de eliminar registros |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Después de operaciones que incluyen datos asociados |
| `beforeDefineCollection` / `afterDefineCollection` | Antes / después de definir **colecciones** |
| `beforeRemoveCollection` / `afterRemoveCollection` | Antes / después de eliminar **colecciones** |

Ejemplo: Escuchar el evento después de la creación de datos

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('¡Los datos se han creado!');
});
```

Ejemplo: Escuchar el evento antes de la actualización de datos

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('¡Los datos están a punto de actualizarse!');
});
```