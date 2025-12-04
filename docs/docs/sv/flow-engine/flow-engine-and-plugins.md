:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Sambandet mellan FlowEngine och plugin

**FlowEngine** är inte en plugin, utan ett **kärn-API** som tillhandahålls för att plugin ska kunna använda det. Det kopplar samman kärnfunktioner med affärsutökningar.
I NocoBase 2.0 är alla API:er samlade i FlowEngine, och plugin kan komma åt FlowEngine via `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Centralt hanterade globala funktioner

FlowEngine tillhandahåller ett centraliserat **Context** som samlar de API:er som behövs för olika scenarier, till exempel:

```ts
class PluginHello extends Plugin {
  async load() {
    // Router-utökning
    this.engine.context.router;

    // Gör en förfrågan
    this.engine.context.api.request();

    // i18n-relaterat
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Obs**!
> Context i version 2.0 löser följande problem från version 1.x:
>
> * Spridd kontext, inkonsekventa anrop
> * Kontext förloras mellan olika React-renderingsträd
> * Kan endast användas inom React-komponenter
>
> För mer information, se **kapitlet om FlowContext**.

---

## Genvägsalias i plugin

För att förenkla anrop tillhandahåller FlowEngine några alias på plugin-instansen:

* `this.context` → motsvarar `this.engine.context`
* `this.router` → motsvarar `this.engine.context.router`

## Exempel: Utöka routern

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

// För exempel- och testscenarier
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

I det här exemplet:

* Pluginet utökar routen för sökvägen `/` med metoden `this.router.add`;
* `createMockClient` tillhandahåller en ren mock-applikation för enkel demonstration och testning;
* `app.getRootComponent()` returnerar rotkomponenten, som kan monteras direkt på sidan.