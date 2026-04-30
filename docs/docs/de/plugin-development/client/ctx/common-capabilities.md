---
title: "Häufige Fähigkeiten"
description: "Häufige Fähigkeiten des NocoBase Client-Kontexts: ctx.api für Anfragen, ctx.t für Internationalisierung, ctx.logger für Logs, ctx.router für Routen, ctx.viewer für Views, ctx.acl für Zugriffskontrolle."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Häufige Fähigkeiten

Das Kontext-Objekt stellt die eingebauten Fähigkeiten von NocoBase bereit. Beachten Sie: Manche sind nur im Plugin verfügbar, manche nur im Component, manche in beiden, aber mit unterschiedlicher Schreibweise. Hier ein Überblick:

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

Im Folgenden werden die Fähigkeiten nach Namespace einzeln vorgestellt.

## API-Anfragen (ctx.api)

Über `ctx.api.request()` rufen Sie Backend-Schnittstellen auf, die Verwendung entspricht [Axios](https://axios-http.com/).

### Verwendung in einem Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Direkt in load() Anfragen senden
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('Anwendungsinformationen', response.data);
  }
}
```

### Verwendung in einem Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET-Anfrage
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST-Anfrage
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Daten laden</button>;
}
```

### In Kombination mit ahooks useRequest

In Components können Sie `useRequest` von [ahooks](https://ahooks.js.org/hooks/use-request/index) verwenden, um die Zustandsverwaltung von Anfragen zu vereinfachen:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Wird geladen...</div>;
  if (error) return <div>Anfragefehler: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Aktualisieren</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Anfrage-Interceptors

Über `ctx.api.axios` können Sie Request- bzw. Response-Interceptors hinzufügen, üblicherweise im `load()` des Plugins:

```ts
async load() {
  // Request-Interceptor: benutzerdefinierten Header hinzufügen
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Response-Interceptor: einheitliche Fehlerbehandlung
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Anfragefehler', error);
      return Promise.reject(error);
    },
  );
}
```

### Benutzerdefinierte Header von NocoBase

Der NocoBase Server unterstützt die folgenden benutzerdefinierten Header, die üblicherweise automatisch durch Interceptors eingefügt werden und nicht manuell gesetzt werden müssen:

| Header            | Hinweis                              |
| ----------------- | --------------------------------- |
| `X-App`           | Bei Multi-App-Szenarien gibt die aktuell zugegriffene App an |
| `X-Locale`        | Aktuelle Sprache (z. B. `zh-CN`, `en-US`) |
| `X-Hostname`      | Hostname des Clients                      |
| `X-Timezone`      | Zeitzone des Clients (z. B. `+08:00`)   |
| `X-Role`          | Aktuelle Rolle                          |
| `X-Authenticator` | Aktuelle Benutzer-Authentifizierungsart                  |

## Internationalisierung (ctx.t / ctx.i18n)

NocoBase-Plugins verwalten Mehrsprachen-Dateien über das Verzeichnis `src/locale/` und verwenden im Code Übersetzungen über `ctx.t()`.

### Mehrsprachen-Dateien

Erstellen Sie unter `src/locale/` des Plugins JSON-Dateien je Sprache:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Hinweis

Beim erstmaligen Hinzufügen einer Sprachdatei muss die Anwendung neu gestartet werden, damit sie wirksam wird.

:::

### ctx.t()

Im Component erhalten Sie übersetzte Texte über `ctx.t()`:

```tsx
const ctx = useFlowContext();

// Grundlegende Verwendung
ctx.t('Hello');

// Mit Variable
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Mit angegebenem Namespace (Standard ist der Plugin-Paketname)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Im Plugin ist `this.t()` praktischer — es **fügt automatisch den Plugin-Paketnamen als Namespace ein**, sodass Sie `ns` nicht manuell übergeben müssen:

```ts
class MyPlugin extends Plugin {
  async load() {
    // Verwendet automatisch den aktuellen Plugin-Paketnamen als ns
    console.log(this.t('Hello'));

    // Entspricht
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` ist die zugrundeliegende [i18next](https://www.i18next.com/)-Instanz. Im Allgemeinen reicht `ctx.t()`. Wenn Sie jedoch dynamisch die Sprache wechseln, Sprachänderungen abhören usw. müssen, können Sie `ctx.i18n` verwenden:

```ts
// Aktuelle Sprache abrufen
const currentLang = ctx.i18n.language; // 'zh-CN'

// Sprachänderung abhören
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Sprache gewechselt zu', lng);
});
```

### tExpr()

`tExpr()` erzeugt verzögerte Übersetzungsausdrücke als Zeichenkette und wird typischerweise in `FlowModel.define()` verwendet — denn `define` wird beim Laden des Moduls ausgeführt, zu diesem Zeitpunkt existiert noch keine i18n-Instanz:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // Erzeugt '{{t("Hello block")}}', wird zur Laufzeit übersetzt
});
```

Vollständige Verwendung der Internationalisierung (Schreibweise von Übersetzungsdateien, useT-Hook, tExpr usw.) siehe [i18n Internationalisierung](../component/i18n). Vollständige Liste der von NocoBase unterstützten Sprachcodes siehe [Sprachenliste](../../languages).

## Logging (ctx.logger)

Über `ctx.logger` werden strukturierte Logs ausgegeben, basierend auf [pino](https://github.com/pinojs/pino).

### Verwendung in einem Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin geladen', { plugin: 'my-plugin' });
    this.context.logger.error('Initialisierung fehlgeschlagen', { error });
  }
}
```

### Verwendung in einem Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Seite geladen', { page: 'UserList' });
    ctx.logger.debug('Aktueller Benutzerstatus', { user });
  };

  // ...
}
```

Log-Level von hoch nach niedrig: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Nur Logs, die größer oder gleich dem aktuell konfigurierten Level sind, werden ausgegeben.

## Routen (ctx.router / ctx.route / ctx.location)

Routen-bezogene Fähigkeiten gliedern sich in drei Bereiche: Registrierung (nur Plugin), Navigation und Informationsabruf (nur Component).

### Routen-Registrierung (this.router / this.pluginSettingsManager)

In `load()` des Plugins registrieren Sie Seitenrouten über `this.router.add()` und Plugin-Einstellungsseiten über `this.pluginSettingsManager`:

```ts
async load() {
  // Normale Seitenroute registrieren
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Plugin-Einstellungsseite registrieren (erscheint im Menü „Plugin-Konfiguration")
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design-Icon, siehe https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Ausführliche Verwendung siehe [Router](../router). Vollständiges Beispiel einer Einstellungsseite siehe [Eine Plugin-Einstellungsseite erstellen](../examples/settings-page).

:::warning Hinweis

`this.router` ist der RouterManager und dient zum **Registrieren von Routen**. `this.pluginSettingsManager` ist der PluginSettingsManager und dient zum **Registrieren von Einstellungsseiten**. Beide sind nicht dasselbe wie `ctx.router` (React Router, dient zur **Seitennavigation**) im Component.

:::

### Seitennavigation (ctx.router)

Im Component navigieren Sie über `ctx.router.navigate()` zu einer anderen Seite:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Routen-Informationen (ctx.route)

Im Component erhalten Sie über `ctx.route` Informationen zur aktuellen Route:

```tsx
const ctx = useFlowContext();

// Dynamische Parameter abrufen (z. B. mit der Routendefinition /users/:id)
const { id } = ctx.route.params;

// Routennamen abrufen
const { name } = ctx.route;
```

Vollständiger Typ von `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // Eindeutige Routen-ID
  path?: string;         // Routenvorlage
  pathname?: string;     // Vollständiger Pfad der Route
  params?: Record<string, any>; // Routenparameter
}
```

### Aktuelle URL (ctx.location)

`ctx.location` stellt detaillierte Informationen zur aktuellen URL bereit, ähnlich dem `window.location` des Browsers:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

Auch wenn `ctx.route` und `ctx.location` über `this.context` im Plugin zugänglich sind, ist die URL beim Plugin-Laden unbestimmt und die abgerufenen Werte ohne Bedeutung. Verwendung im Component empfohlen.

## View-Verwaltung (ctx.viewer / ctx.view)

`ctx.viewer` bietet die Möglichkeit, Modals, Drawer und andere Views imperativ zu öffnen. Verfügbar sowohl im Plugin als auch im Component.

### Verwendung in einem Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Beispielsweise in einer Initialisierungslogik ein Modal öffnen
    this.context.viewer.dialog({
      title: 'Willkommen',
      content: () => <div>Plugin-Initialisierung abgeschlossen</div>,
    });
  }
}
```

### Verwendung in einem Component

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Modal öffnen
    ctx.viewer.dialog({
      title: 'Benutzer bearbeiten',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Drawer öffnen
    ctx.viewer.drawer({
      title: 'Details',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Bearbeiten</Button>
      <Button onClick={openDrawer}>Details ansehen</Button>
    </div>
  );
}
```

### Allgemeine Methode

```tsx
// Über type den View-Typ angeben
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Titel',
  content: () => <SomeComponent />,
});
```

### In einem View arbeiten (ctx.view)

In Components innerhalb eines Modals/Drawers können Sie über `ctx.view` den aktuellen View steuern (z. B. schließen):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Modal-Inhalt</p>
      <Button onClick={() => ctx.view.close()}>Schließen</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` ist die FlowEngine-Instanz und nur im Plugin verfügbar. Üblicherweise wird sie zum Registrieren von FlowModel verwendet:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // FlowModel registrieren (Lazy-Loading-Schreibweise empfohlen)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel ist der Kern des visuellen Konfigurationssystems von NocoBase — wenn Ihr Component im Menü „Block / Feld / Aktion hinzufügen" erscheinen soll, müssen Sie es mit einem FlowModel verpacken. Ausführliche Verwendung siehe [FlowEngine](../flow-engine/index.md).

## Weitere Fähigkeiten

Die folgenden Fähigkeiten kommen in fortgeschrittenen Szenarien zum Einsatz, hier kurz aufgeführt:

| Eigenschaft             | Hinweis                                            |
| ----------------------- | ----------------------------------------------- |
| `ctx.model`             | Aktuelle FlowModel-Instanz (verfügbar im Flow-Ausführungskontext) |
| `ctx.ref`               | Component-Referenz, in Verbindung mit `ctx.onRefReady` verwendbar |
| `ctx.exit()`            | Ausführung des aktuellen Flow beenden                            |
| `ctx.defineProperty()`  | Dem Kontext dynamisch eine benutzerdefinierte Eigenschaft hinzufügen                      |
| `ctx.defineMethod()`    | Dem Kontext dynamisch eine benutzerdefinierte Methode hinzufügen                      |
| `ctx.useResource()`     | Datenressourcen-Operationsschnittstelle abrufen                            |
| `ctx.dataSourceManager` | Datenquellen-Verwaltung                                      |

Detaillierte Verwendung dieser Fähigkeiten siehe [vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md).

## Verwandte Links

- [Context-Übersicht](../ctx/index.md) — Gemeinsamkeiten und Unterschiede der beiden Kontext-Zugriffspunkte
- [Plugin](../plugin) — Plugin-Shortcut-Eigenschaften
- [Component-Entwicklung](../component/index.md) — Verwendung von useFlowContext im Component
- [Router](../router) — Routen-Registrierung und -Navigation
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige FlowEngine-Referenz
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien, tExpr, useT
- [Sprachenliste](../../languages) — Von NocoBase unterstützte Sprachcodes
- [Eine Plugin-Einstellungsseite erstellen](../examples/settings-page) — Vollständiges Verwendungsbeispiel von ctx.api
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel
