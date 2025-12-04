:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Relatie tussen FlowEngine en plugins

**FlowEngine** is geen plugin, maar een **kern-API** die plugins kunnen gebruiken om kernfunctionaliteiten te verbinden met bedrijfsmatige uitbreidingen. In NocoBase 2.0 zijn alle API's gecentraliseerd in FlowEngine, en plugins hebben toegang tot FlowEngine via `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Centraal beheerde globale functionaliteiten

FlowEngine biedt een gecentraliseerde **Context** die de API's samenbrengt die nodig zijn voor verschillende scenario's, bijvoorbeeld:

```ts
class PluginHello extends Plugin {
  async load() {
    // Router-uitbreiding
    this.engine.context.router;

    // Een verzoek indienen
    this.engine.context.api.request();

    // i18n gerelateerd
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Opmerking**:
> Context in 2.0 lost de volgende problemen uit 1.x op:
>
> * Verspreide context, inconsistente aanroepen
> * Context gaat verloren tussen verschillende React render-trees
> * Kan alleen binnen React-componenten worden gebruikt
>
> Voor meer details, zie het hoofdstuk **FlowContext**.

---

## Snelkoppeling-aliassen in plugins

Om aanroepen te vereenvoudigen, biedt FlowEngine enkele aliassen op de plugin-instantie:

* `this.context` → gelijk aan `this.engine.context`
* `this.router` → gelijk aan `this.engine.context.router`

## Voorbeeld: De router uitbreiden

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

// Voor voorbeeld- en testscenario's
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

In dit voorbeeld:

* De plugin breidt de route voor het pad `/` uit met behulp van de methode `this.router.add`;
* `createMockClient` biedt een schone mock-applicatie voor eenvoudige demonstratie en tests;
* `app.getRootComponent()` retourneert de root-component, die direct op de pagina kan worden gemonteerd.