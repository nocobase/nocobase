---
title: "Router"
description: "NocoBase-Client-Routing: this.router.add zur Registrierung von Seitenrouten, pluginSettingsManager zur Registrierung von Plugin-Einstellungsseiten (addMenuItem + addPageTabItem)."
keywords: "Router,Routing,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,Seitenregistrierung,NocoBase"
---

# Router

In NocoBase registrieren Plugins ihre Seiten über Routen. Es gibt zwei gängige Ansätze:

- `this.router.add()` – Registriert reguläre Seitenrouten
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` – Registriert Plugin-Einstellungsseiten

Die Registrierung von Routen erfolgt üblicherweise in der `load()`-Methode des Plugins. Siehe [Plugin](./plugin) für Details.

:::warning Hinweis

Bei NocoBase-v2-Plugins erhalten registrierte Routen standardmäßig das Präfix `/v`. Beim Aufruf der Routen müssen Sie dieses Präfix angeben.

:::

## Standardrouten

NocoBase hat die folgenden Standardrouten registriert:

| Name           | Pfad                  | Komponente          | Beschreibung               |
| -------------- | --------------------- | ------------------- | -------------------------- |
| admin          | /v/admin/\*          | AdminLayout         | Admin-Seiten               |
| admin.page     | /v/admin/:name       | AdminDynamicPage    | Dynamisch erstellte Seiten |
| admin.settings | /v/admin/settings/\* | AdminSettingsLayout | Plugin-Einstellungsseiten  |

## Seitenrouten

Registrieren Sie Seitenrouten über `this.router.add()`. Für Seitenkomponenten sollte `componentLoader` zum Lazy Loading verwendet werden, damit der Seitencode erst geladen wird, wenn die Seite tatsächlich aufgerufen wird.

:::warning Hinweis

Seitendateien müssen die Komponente per `export default` exportieren.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Registrierung in der `load()`-Methode des Plugins:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Lazy Loading: Das Modul wird erst geladen, wenn /v/hello aufgerufen wird
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

Das erste Argument von `router.add()` ist der Routenname, der die Punktnotation `.` unterstützt, um Eltern-Kind-Beziehungen auszudrücken. Beispielsweise steht `root.home` für eine untergeordnete Route von `root`.

In Komponenten können Sie über `ctx.router.navigate('/hello')` zu einer Route navigieren.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Weitere Details finden Sie im Abschnitt zum Routing in [Component](./component/index.md).

### Verschachtelte Routen

Verschachtelung wird über die Punktnotation umgesetzt. Übergeordnete Routen verwenden `<Outlet />`, um den Inhalt der untergeordneten Routen zu rendern:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Übergeordnete Route, mit element als Inline-Layout
    this.router.add('root', {
      element: (
        <div>
          <nav>Navigationsleiste</nav>
          <Outlet />
        </div>
      ),
    });

    // Untergeordnete Route, mit componentLoader zum Lazy Loading
    this.router.add('root.home', {
      path: '/', // -> /v/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Dynamische Parameter

Routenpfade unterstützen dynamische Parameter:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

In Komponenten können Sie dynamische Parameter über `ctx.route.params` abrufen:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Dynamischen Parameter id abrufen
  return <h1>User ID: {id}</h1>;
}
```

Weitere Details finden Sie im Abschnitt zum Routing in [Component](./component/index.md).

### componentLoader vs. element

- **`componentLoader`** (empfohlen): Lazy Loading, geeignet für Seitenkomponenten. Seitendateien benötigen `export default`.
- **`element`**: Übergibt JSX direkt, geeignet für Layout-Komponenten oder sehr leichtgewichtige Inline-Seiten.

Wenn die Seite selbst umfangreiche Abhängigkeiten hat, sollte `componentLoader` bevorzugt werden.

## Plugin-Einstellungsseiten

Registrieren Sie Plugin-Einstellungsseiten über `this.pluginSettingsManager`. Die Registrierung erfolgt in zwei Schritten – verwenden Sie zuerst `addMenuItem()`, um den Menüeintrag zu registrieren, und dann `addPageTabItem()`, um die eigentliche Seite zu registrieren. Einstellungsseiten erscheinen im Menü „Plugin-Einstellungen" von NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Menüeintrag registrieren
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Name eines Ant-Design-Icons, siehe https://5x.ant.design/components/icon
    });

    // Seite registrieren (key 'index' wird auf den Menü-Stammpfad abgebildet)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Nach der Registrierung lautet der Aufrufpfad `/v/admin/settings/hello`. Wenn unter dem Menü nur eine Seite vorhanden ist, wird die obere Tab-Leiste automatisch ausgeblendet.

### Einstellungsseite mit mehreren Tabs

Wenn die Einstellungsseite mehrere Unterseiten benötigt, registrieren Sie mehrere `addPageTabItem`-Aufrufe mit demselben `menuKey` – oben erscheint dann automatisch eine Tab-Leiste:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Menüeintrag registrieren
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Tab 1: Allgemeine Einstellungen (key 'index' wird auf /v/admin/settings/hello abgebildet)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Tab 2: Erweiterte Einstellungen (wird auf /v/admin/settings/hello/advanced abgebildet)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### addMenuItem-Parameter

| Feld       | Typ                   | Erforderlich | Beschreibung                                                          |
| ---------- | --------------------- | ------------ | -------------------------------------------------------------------- |
| `key`      | `string`              | Ja           | Eindeutige Menükennung, darf kein `.` enthalten                      |
| `title`    | `ReactNode`           | Nein         | Menütitel                                                            |
| `icon`     | `string \| ReactNode` | Nein         | Menüsymbol, wird bei einem String als integriertes `Icon` gerendert  |
| `sort`     | `number`              | Nein         | Sortierwert, kleinere Werte erscheinen weiter vorn, Standard `0`     |
| `showTabs` | `boolean`             | Nein         | Ob die obere Tab-Leiste angezeigt wird, standardmäßig nach Seitenanzahl bestimmt |
| `hidden`   | `boolean`             | Nein         | Ob der Navigationseintrag ausgeblendet wird                          |

### addPageTabItem-Parameter

| Feld              | Typ         | Erforderlich | Beschreibung                                                          |
| ----------------- | ----------- | ------------ | -------------------------------------------------------------------- |
| `menuKey`         | `string`    | Ja           | Der `key` des übergeordneten Menüs, entspricht dem `key` von `addMenuItem` |
| `key`             | `string`    | Ja           | Eindeutige Seitenkennung. `'index'` bezeichnet die Standardseite, abgebildet auf den Menü-Stammpfad |
| `title`           | `ReactNode` | Nein         | Seitentitel (wird auf dem Tab angezeigt)                             |
| `componentLoader` | `Function`  | Nein         | Seitenkomponente per Lazy Loading (empfohlen)                        |
| `Component`       | `Component` | Nein         | Komponente direkt übergeben (Alternative zu `componentLoader`)       |
| `sort`            | `number`    | Nein         | Sortierwert, kleinere Werte erscheinen weiter vorn                   |
| `hidden`          | `boolean`   | Nein         | Ob in der Tab-Leiste ausgeblendet                                    |
| `link`            | `string`    | Nein         | Externer Link; wenn gesetzt, führt ein Klick auf den Tab zur externen URL |

## Verwandte Links

- [Plugin](./plugin) – Routen werden in `load()` registriert
- [Component](./component/index.md) – Wie man die von Routen eingebundenen Seitenkomponenten schreibt
- [Plugin-Beispiel: Eine Einstellungsseite erstellen](./examples/settings-page) – Vollständiges Beispiel für eine Einstellungsseite
