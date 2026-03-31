:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Plugin

En NocoBase, el **plugin de cliente** es la forma principal de extender y personalizar la funcionalidad del frontend. Al extender la clase base `Plugin` que proporciona `@nocobase/client`, usted puede registrar lógica, añadir componentes de página, extender menús o integrar funcionalidades de terceros en diferentes etapas del ciclo de vida.

## Estructura de la clase Plugin

Una estructura básica de un plugin de cliente es la siguiente:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Se ejecuta después de que el plugin se añade
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Se ejecuta antes de que el plugin se cargue
    console.log('Before plugin load');
  }

  async load() {
    // Se ejecuta cuando el plugin se carga, para registrar rutas, componentes de UI, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Descripción del ciclo de vida

Cada plugin pasa por el siguiente ciclo de vida en secuencia cuando el navegador se actualiza o la aplicación se inicializa:

| Método del ciclo de vida | Momento de ejecución | Descripción |
|--------------------------|----------------------|-------------|
| **afterAdd()**           | Se ejecuta inmediatamente después de que el plugin se añade al gestor de plugins. | En este punto, la instancia del plugin ya se ha creado, pero no todos los plugins han terminado de inicializarse. Es adecuado para inicializaciones ligeras, como leer configuraciones o vincular eventos básicos. |
| **beforeLoad()**         | Se ejecuta antes del método `load()` de todos los plugins. | Puede acceder a todas las instancias de plugins habilitados (`this.app.pm.get()`). Es adecuado para lógica de preparación que depende de otros plugins. |
| **load()**               | Se ejecuta cuando el plugin se carga. | Este método se ejecuta después de que todos los métodos `beforeLoad()` de los plugins hayan finalizado. Es adecuado para registrar rutas de frontend, componentes de UI y otra lógica central. |

## Orden de ejecución

Cada vez que el navegador se actualiza, se ejecutarán los métodos `afterAdd()` → `beforeLoad()` → `load()` en ese orden.

## Contexto del Plugin y FlowEngine

A partir de NocoBase 2.0, las APIs de extensión del lado del cliente se concentran principalmente en **FlowEngine**. Dentro de la clase del plugin, usted puede obtener la instancia del motor a través de `this.engine`.

```ts
// Acceda al contexto del motor en el método load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Para más información, consulte:  
- [FlowEngine](/flow-engine)  
- [Contexto](./context.md)