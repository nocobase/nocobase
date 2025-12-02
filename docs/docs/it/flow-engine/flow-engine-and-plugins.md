:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Relazione tra FlowEngine e i plugin

**FlowEngine** non è un plugin, ma un'**API di base** fornita ai plugin per connettere le funzionalità del core con le estensioni aziendali. In NocoBase 2.0, tutte le API sono centralizzate in FlowEngine, e i plugin possono accedervi tramite `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Funzionalità globali gestite centralmente

FlowEngine fornisce un **Context** centralizzato che raggruppa le API necessarie per vari scenari, ad esempio:

```ts
class PluginHello extends Plugin {
  async load() {
    // Estensione del router
    this.engine.context.router;

    // Effettua una richiesta
    this.engine.context.api.request();

    // Relativo all'internazionalizzazione
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Nota**:
> Il Context in NocoBase 2.0 risolve i seguenti problemi della versione 1.x:
>
> *   Context disperso, chiamate incoerenti
> *   Il context viene perso tra diversi alberi di rendering React
> *   Utilizzabile solo all'interno dei componenti React
>
> Per maggiori dettagli, consulti il **capitolo FlowContext**.

## Alias di scorciatoia nei plugin

Per semplificare le chiamate, FlowEngine fornisce alcuni alias sull'istanza del plugin:

*   `this.context` → equivalente a `this.engine.context`
*   `this.router` → equivalente a `this.engine.context.router`

## Esempio: Estendere il Router

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

// Per scenari di esempio e test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

In questo esempio:

*   Il plugin estende la rotta per il percorso `/` utilizzando il metodo `this.router.add`;
*   `createMockClient` fornisce un'applicazione mock pulita per facilitare la dimostrazione e i test;
*   `app.getRootComponent()` restituisce il componente radice, che può essere montato direttamente sulla pagina.