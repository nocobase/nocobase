:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Relación entre FlowEngine y los plugins

**FlowEngine** no es un plugin, sino una **API central** que se proporciona a los plugins para que la utilicen. Su propósito es conectar las capacidades del núcleo con las extensiones de negocio.
En NocoBase 2.0, todas las API se centralizan en FlowEngine, y los plugins pueden acceder a FlowEngine a través de `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Capacidades globales gestionadas de forma centralizada

FlowEngine proporciona un **Context** centralizado que agrupa las API necesarias para diversos escenarios, por ejemplo:

```ts
class PluginHello extends Plugin {
  async load() {
    // Extensión del enrutador
    this.engine.context.router;

    // Realizar una solicitud
    this.engine.context.api.request();

    // Relacionado con la internacionalización (i18n)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Nota**:
> En la versión 2.0, el Context resuelve los siguientes problemas de la versión 1.x:
>
> * Contexto disperso, llamadas inconsistentes
> * El contexto se perdía entre diferentes árboles de renderizado de React
> * Solo se podía usar dentro de componentes de React
>
> Para más detalles, consulte el **capítulo FlowContext**.

---

## Alias de acceso directo en los plugins

Para simplificar las llamadas, FlowEngine proporciona algunos alias en la instancia del plugin:

* `this.context` → equivalente a `this.engine.context`
* `this.router` → equivalente a `this.engine.context.router`

## Ejemplo: Extender el enrutador

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// Para escenarios de ejemplo y prueba
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

En este ejemplo:

* El plugin extiende la ruta para la dirección `/` utilizando el método `this.router.add`;
* `createMockClient` proporciona una aplicación simulada (mock) limpia para facilitar la demostración y las pruebas;
* `app.getRootComponent()` devuelve el componente raíz, que se puede montar directamente en la página.