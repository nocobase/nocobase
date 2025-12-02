:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Plugin

En NocoBase, un plugin de servidor (Server Plugin) ofrece una forma modular de extender y personalizar la funcionalidad del lado del servidor. Los desarrolladores pueden heredar de la clase `Plugin` de `@nocobase/server` para registrar eventos, interfaces, configuraciones de permisos y otra lógica personalizada en las distintas etapas del ciclo de vida.

## Clase Plugin

La estructura básica de una clase plugin es la siguiente:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Ciclo de Vida

Los métodos del ciclo de vida de un plugin se ejecutan en el siguiente orden. Cada método tiene un momento de ejecución y un propósito específicos:

| Método del ciclo de vida | Momento de ejecución | Descripción |
|--------------------------|----------------------|-------------|
| **staticImport()** | Antes de la carga del plugin | Método estático de la clase, se ejecuta durante la fase de inicialización, independientemente del estado de la aplicación o del plugin. Se utiliza para tareas de inicialización que no dependen de instancias del plugin. |
| **afterAdd()** | Inmediatamente después de añadir el plugin al gestor de plugins | La instancia del plugin ya ha sido creada, pero no todos los plugins han terminado de inicializarse. Puede realizar algunas tareas básicas de inicialización. |
| **beforeLoad()** | Antes de la ejecución de todos los `load()` de los plugins | En este punto, se puede acceder a todas las **instancias de plugins habilitados**. Es adecuado para registrar modelos de base de datos, escuchar eventos de base de datos, registrar middleware y otras tareas de preparación. |
| **load()** | Cuando el plugin se carga | Todos los `beforeLoad()` de los plugins deben completarse antes de que comience la ejecución de `load()`. Es adecuado para registrar recursos, interfaces API, servicios y otra lógica de negocio central. |
| **install()** | Cuando el plugin se activa por primera vez | Solo se ejecuta una vez cuando el plugin se habilita por primera vez. Generalmente se utiliza para inicializar estructuras de tablas de base de datos, insertar datos iniciales y otra lógica de instalación. |
| **afterEnable()** | Después de que el plugin es habilitado | Se ejecuta cada vez que el plugin es habilitado. Se puede utilizar para iniciar tareas programadas, registrar tareas planificadas, establecer conexiones y otras acciones posteriores a la habilitación. |
| **afterDisable()** | Después de que el plugin es deshabilitado | Se ejecuta cuando el plugin es deshabilitado. Se puede utilizar para liberar recursos, detener tareas, cerrar conexiones y otras tareas de limpieza. |
| **remove()** | Cuando el plugin es eliminado | Se ejecuta cuando el plugin es completamente eliminado. Se utiliza para escribir la lógica de desinstalación, como eliminar tablas de base de datos, limpiar archivos, etc. |
| **handleSyncMessage(message)** | Sincronización de mensajes en despliegues multinodo | Cuando la aplicación se ejecuta en modo multinodo, se utiliza para procesar mensajes sincronizados desde otros nodos. |

### Descripción del Orden de Ejecución

El flujo de ejecución típico de los métodos del ciclo de vida es el siguiente:

1.  **Fase de inicialización estática**: `staticImport()`
2.  **Fase de inicio de la aplicación**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Fase de primera habilitación del plugin**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Fase de segunda habilitación del plugin**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Fase de deshabilitación del plugin**: `afterDisable()` se ejecuta cuando el plugin es deshabilitado.
6.  **Fase de eliminación del plugin**: `remove()` se ejecuta cuando el plugin es eliminado.

## `app` y Miembros Relacionados

En el desarrollo de plugins, a través de `this.app`, usted puede acceder a diversas APIs proporcionadas por la instancia de la aplicación. Esta es la interfaz central para extender la funcionalidad del plugin. El objeto `app` contiene varios módulos funcionales del sistema, y los desarrolladores pueden utilizar estos módulos en los métodos del ciclo de vida del plugin para implementar sus requisitos de negocio.

### Lista de Miembros de `app`

| Nombre del miembro | Tipo/Módulo | Propósito principal |
|--------------------|-------------|---------------------|
| **logger** | `Logger` | Registra los logs del sistema, soporta diferentes niveles (info, warn, error, debug) de salida de logs, facilitando la depuración y el monitoreo. Consulte [Logs](./logger.md) |
| **db** | `Database` | Proporciona operaciones de la capa ORM, registro de modelos, escucha de eventos, control de transacciones y otras funciones relacionadas con la base de datos. Consulte [Base de Datos](./database.md). |
| **resourceManager** | `ResourceManager` | Se utiliza para registrar y gestionar recursos de API REST y sus manejadores de operaciones. Consulte [Gestor de Recursos](./resource-manager.md). |
| **acl** | `ACL` | Capa de control de acceso, se utiliza para definir permisos, roles y políticas de acceso a recursos, implementando un control de permisos granular. Consulte [Control de Acceso](./acl.md). |
| **cacheManager** | `CacheManager` | Gestiona la caché a nivel de sistema, soporta Redis, caché en memoria y otros backends de caché para mejorar el rendimiento de la aplicación. Consulte [Caché](./cache.md) |
| **cronJobManager** | `CronJobManager` | Se utiliza para registrar, iniciar y gestionar tareas programadas, soporta la configuración de expresiones Cron. Consulte [Tareas Programadas](./cron-job-manager.md) |
| **i18n** | `I18n` | Soporte de internacionalización, proporciona funcionalidad de traducción y localización multilingüe, facilitando que los plugins soporten múltiples idiomas. Consulte [Internacionalización](./i18n.md) |
| **cli** | `CLI` | Gestiona la interfaz de línea de comandos, registra y ejecuta comandos personalizados, extendiendo la funcionalidad de la CLI de NocoBase. Consulte [Línea de Comandos](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Gestiona múltiples instancias de fuente de datos y sus conexiones, soporta escenarios de múltiples fuentes de datos. Consulte [Gestión de Fuentes de Datos](./collections.md) |
| **pm** | `PluginManager` | Gestor de plugins, se utiliza para cargar, habilitar, deshabilitar y eliminar plugins dinámicamente, así como para gestionar las dependencias entre ellos. |

> **Consejo**: Para el uso detallado de cada módulo, consulte los capítulos de documentación correspondientes.