:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Relacja między FlowEngine a wtyczkami

**FlowEngine** nie jest wtyczką, lecz **rdzeniowym API** udostępnianym wtyczkom, służącym do łączenia podstawowych funkcjonalności z rozszerzeniami biznesowymi. W NocoBase 2.0 wszystkie API są scentralizowane w FlowEngine, a wtyczki mogą uzyskać dostęp do FlowEngine za pośrednictwem `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Centralnie zarządzane globalne możliwości

FlowEngine udostępnia scentralizowany **Context**, który gromadzi API potrzebne w różnych scenariuszach, na przykład:

```ts
class PluginHello extends Plugin {
  async load() {
    // Rozszerzenie routera
    this.engine.context.router;

    // Wykonanie zapytania
    this.engine.context.api.request();

    // Związane z i18n
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Uwaga**:
> Context w wersji 2.0 rozwiązuje następujące problemy z wersji 1.x:
>
> * Rozproszony kontekst, niespójne wywołania
> * Kontekst gubił się między różnymi drzewami renderowania React
> * Możliwość użycia tylko w komponentach React
>
> Więcej szczegółów znajdą Państwo w **rozdziale FlowContext**.

---

## Skrócone aliasy we wtyczkach

Aby uprościć wywołania, FlowEngine udostępnia kilka aliasów w instancji wtyczki:

* `this.context` → równoważne z `this.engine.context`
* `this.router` → równoważne z `this.engine.context.router`

## Przykład: Rozszerzanie routera

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

// Do celów przykładów i scenariuszy testowych
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

W tym przykładzie:

* Wtyczka rozszerza trasę dla ścieżki `/` za pomocą metody `this.router.add`;
* `createMockClient` udostępnia czystą aplikację mockową, ułatwiającą demonstrację i testowanie;
* `app.getRootComponent()` zwraca komponent główny, który można bezpośrednio zamontować na stronie.