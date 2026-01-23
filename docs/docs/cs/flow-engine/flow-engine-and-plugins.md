:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vztah mezi FlowEngine a pluginy

**FlowEngine** není plugin, ale **základní API**, které je poskytováno pluginům k použití pro propojení klíčových funkcí s rozšířeními pro konkrétní obchodní potřeby.
V NocoBase 2.0 jsou všechna API centralizována ve FlowEngine a pluginy k němu mají přístup prostřednictvím `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Centrálně spravované globální funkce

FlowEngine poskytuje centralizovaný **Context**, který sdružuje API potřebná pro různé scénáře, například:

```ts
class PluginHello extends Plugin {
  async load() {
    // Rozšíření routeru
    this.engine.context.router;

    // Odeslání požadavku
    this.engine.context.api.request();

    // Související s internacionalizací (i18n)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Poznámka**:
> Context ve verzi 2.0 řeší následující problémy z verze 1.x:
>
> *   Roztříštěný kontext, nejednotné volání
> *   Ztráta kontextu mezi různými renderovacími stromy Reactu
> *   Možnost použití pouze v rámci komponent Reactu
>
> Více podrobností naleznete v **kapitole FlowContext**.

---

## Zkratkové aliasy v pluginech

Pro zjednodušení volání poskytuje FlowEngine na instanci pluginu některé aliasy:

*   `this.context` → ekvivalent k `this.engine.context`
*   `this.router` → ekvivalent k `this.engine.context.router`

## Příklad: Rozšíření routeru

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

// Pro příklady a testovací scénáře
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

V tomto příkladu:

*   Plugin rozšiřuje routu pro cestu `/` pomocí metody `this.router.add`;
*   `createMockClient` poskytuje čistou mock aplikaci pro snadnou demonstraci a testování;
*   `app.getRootComponent()` vrací kořenovou komponentu, kterou lze přímo připojit na stránku.