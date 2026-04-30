---
title: "Context"
description: "NocoBase Client-Kontext-Mechanismus: this.context im Plugin und useFlowContext() im Component sind dasselbe Objekt mit unterschiedlichen Zugriffspunkten."
keywords: "Context,Kontext,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context

In NocoBase ist der **Context (Kontext)** die Brücke zwischen Plugin-Code und den Fähigkeiten von NocoBase. Über den Kontext können Sie Anfragen senden, Internationalisierung durchführen, Logs schreiben, zwischen Seiten navigieren und mehr.

Der Kontext hat zwei Zugriffspunkte:

- **In Plugins**: `this.context`
- **In React Components**: `useFlowContext()` (Import aus `@nocobase/flow-engine`)

Beide geben **dasselbe Objekt** zurück (eine Instanz von `FlowEngineContext`), unterscheiden sich nur im Verwendungsszenario.

## Verwendung in einem Plugin

In Lebenszyklus-Methoden wie `load()` greifen Sie über `this.context` darauf zu:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Über this.context auf die Kontextfähigkeiten zugreifen
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('Anwendungsinformationen', response.data);

    // Internationalisierung: this.t() fügt automatisch den Plugin-Paketnamen als Namespace ein
    console.log(this.t('Hello'));
  }
}
```

## Verwendung in einem Component

In React Components erhalten Sie dasselbe Kontext-Objekt über `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Plugin-Shortcut-Eigenschaften vs ctx-Eigenschaften

Die Plugin-Klasse stellt einige Shortcut-Eigenschaften bereit, die in `load()` praktisch sind. Beachten Sie jedoch: **Manche Shortcut-Eigenschaften der Plugin-Klasse und gleichnamige Eigenschaften auf ctx zeigen auf unterschiedliche Dinge**:

| Plugin-Shortcut             | Verweist auf          | Zweck                               |
| --------------------------- | --------------------- | ----------------------------------- |
| `this.router`               | RouterManager         | Routen registrieren mit `.add()`    |
| `this.pluginSettingsManager` | PluginSettingsManager | Plugin-Einstellungsseite registrieren (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`           | FlowEngine-Instanz    | FlowModel registrieren              |
| `this.t()`                  | i18n.t() + automatisches ns | Internationalisierung, Plugin-Paketname automatisch eingefügt |
| `this.context`              | FlowEngineContext     | Kontext-Objekt, identisch mit useFlowContext() |

Am leichtesten zu verwechseln sind `this.router` und `ctx.router`:

- **`this.router`** (Plugin-Shortcut) → RouterManager, dient zum **Registrieren von Routen** (`.add()`)
- **`ctx.router`** (Kontext-Eigenschaft) → React-Router-Instanz, dient zur **Seitennavigation** (`.navigate()`)

```ts
// Im Plugin: Route registrieren
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// Im Component: zur Seite navigieren
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Häufig verwendete Fähigkeiten des Kontexts

Hier eine Liste der häufig verwendeten Kontextfähigkeiten. Beachten Sie: Manche sind nur im Plugin verfügbar, manche nur im Component, manche in beiden, aber mit unterschiedlicher Schreibweise.

| Fähigkeit  | Plugin (`this.xxx`)            | Component (`ctx.xxx`)         | Hinweis                            |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API-Anfrage | `this.context.api`            | `ctx.api`                    | Gleiche Verwendung                |
| Internationalisierung | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` fügt Plugin-Namespace automatisch ein |
| Logging    | `this.context.logger`         | `ctx.logger`                 | Gleiche Verwendung                |
| Routen-Registrierung | `this.router.add()`     | -                            | Nur Plugin                        |
| Seitennavigation | -                       | `ctx.router.navigate()`      | Nur Component                     |
| Routen-Info | `this.context.location`      | `ctx.route` / `ctx.location` | Empfohlen im Component zu verwenden |
| View-Verwaltung | `this.context.viewer`    | `ctx.viewer`                 | Modal / Drawer öffnen usw.        |
| FlowEngine | `this.flowEngine`             | -                            | Nur Plugin                        |

Detaillierte Verwendung und Codebeispiele für jede Fähigkeit siehe [Häufige Fähigkeiten](./common-capabilities).

## Verwandte Links

- [Häufige Fähigkeiten](./common-capabilities) — Detaillierte Verwendung von ctx.api, ctx.t, ctx.logger usw.
- [Plugin](../plugin) — Plugin-Einstiegspunkt und Shortcut-Eigenschaften
- [Component-Entwicklung](../component/index.md) — Grundlegende Verwendung von useFlowContext im Component
