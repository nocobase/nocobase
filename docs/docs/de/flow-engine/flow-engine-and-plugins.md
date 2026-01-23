:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Beziehung zwischen FlowEngine und Plugins

**FlowEngine** ist kein Plugin, sondern wird als **Kern-API** bereitgestellt, die Plugins nutzen können, um Kernfunktionen mit Geschäftserweiterungen zu verbinden. In NocoBase 2.0 sind alle APIs im FlowEngine zentralisiert, und Plugins können über `this.engine` darauf zugreifen.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Zentral verwaltete globale Funktionen

FlowEngine stellt einen zentralisierten **Context** bereit, der die für verschiedene Szenarien benötigten APIs zusammenführt, zum Beispiel:

```ts
class PluginHello extends Plugin {
  async load() {
    // Router-Erweiterung
    this.engine.context.router;

    // Eine Anfrage senden
    this.engine.context.api.request();

    // i18n-bezogen
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Hinweis**:
> Der Context in Version 2.0 löst die folgenden Probleme aus Version 1.x:
>
> * Verteilter Context, inkonsistente Aufrufe
> * Context geht zwischen verschiedenen React-Render-Bäumen verloren
> * Kann nur innerhalb von React-Komponenten verwendet werden
>
> Weitere Details finden Sie im **FlowContext-Kapitel**.

---

## Abkürzungs-Aliase in Plugins

Um Aufrufe zu vereinfachen, stellt FlowEngine einige Aliase auf der Plugin-Instanz bereit:

* `this.context` → entspricht `this.engine.context`
* `this.router` → entspricht `this.engine.context.router`

## Beispiel: Erweitern des Routers

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

// Für Beispiel- und Testszenarien
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

In diesem Beispiel:

* Das Plugin erweitert die Route für den Pfad `/` mithilfe der Methode `this.router.add`;
* `createMockClient` stellt eine saubere Mock-Anwendung für einfache Demonstrationen und Tests bereit;
* `app.getRootComponent()` gibt die Root-Komponente zurück, die direkt auf der Seite eingebunden werden kann.