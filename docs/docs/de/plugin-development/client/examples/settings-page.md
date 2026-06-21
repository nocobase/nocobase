---
title: "Eine Plugin-Einstellungsseite erstellen"
description: "NocoBase Plugin-Praxis: Mit pluginSettingsManager + Component + ctx.api eine Plugin-Einstellungsseite zur Verwaltung von Drittanbieter-API-Keys erstellen."
keywords: "Plugin-Einstellungsseite,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Eine Plugin-Einstellungsseite erstellen

Viele Plugins benötigen eine Einstellungsseite, damit Benutzer Parameter konfigurieren können — z. B. API-Keys von Drittanbieter-Services, Webhook-Adressen usw. Dieses Beispiel zeigt, wie Sie mit `pluginSettingsManager` + React-Component + `ctx.api` eine vollständige Plugin-Einstellungsseite erstellen.

Dieses Beispiel verwendet keine FlowEngine, sondern eine reine Kombination aus Plugin + Router + Component + Context.

:::tip Vorab lesen

Es empfiehlt sich, zunächst Folgendes zu kennen, damit die Entwicklung reibungsloser verläuft:

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Erstellung und Verzeichnisstruktur
- [Plugin](../plugin) — Plugin-Einstiegspunkt und `load()`-Lebenszyklus
- [Router](../router) — Registrierung der Einstellungsseite mit `pluginSettingsManager`
- [Component-Entwicklung](../component/index.md) — Schreibweise von React-Components und useFlowContext
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien und Verwendung von `useT()`

:::


## Endergebnis

Wir erstellen eine Einstellungsseite „Externe Service-Konfiguration":

- erscheint im Menü „Plugin-Konfiguration"
- bietet eine Formular-UI mit Antd Form
- ruft Konfigurationen über `ctx.api` aus dem Backend ab und speichert sie
- gibt nach erfolgreichem Speichern einen Hinweis aus

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Vollständigen Quellcode siehe [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Wenn Sie es lokal ausprobieren möchten:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

Im Folgenden bauen wir dieses Plugin Schritt für Schritt von Grund auf auf.

## Schritt 1: Plugin-Gerüst erstellen

Im Stammverzeichnis des Repositories ausführen:

```bash
yarn pm create @my-project/plugin-settings-page
```

Dies erzeugt unter `packages/plugins/@my-project/plugin-settings-page` die Grundstruktur einschließlich `src/client-v2/`, `src/server/`, `src/locale/` u. a. Detaillierte Erläuterungen siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

## Schritt 2: Einstellungsseite registrieren

Bearbeiten Sie `src/client-v2/plugin.tsx` und registrieren Sie in `load()` über `this.pluginSettingsManager` die Einstellungsseite. Zwei Schritte: zuerst über `addMenuItem()` den Menüeintrag registrieren, dann über `addPageTabItem()` die eigentliche Seite:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // Menüeintrag registrieren
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Ant Design-Icon, siehe https://5x.ant.design/components/icon
    });

    // Tab 1: API-Konfiguration (key 'index' wird auf den Wurzelpfad des Menüs /admin/settings/external-api abgebildet)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // Kleinere Werte erscheinen weiter vorne
    });

    // Tab 2: Über-Seite (wird auf /admin/settings/external-api/about abgebildet)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'about',
      title: this.t('About'),
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}

export default PluginSettingsPageClient;
```

Nach der Registrierung erscheint im Menü „Plugin-Konfiguration" der Eintrag „Externe Service-Konfiguration", oben befinden sich zwei Tabs — „API-Konfiguration" und „Über". Wenn unter dem Menü nur eine Seite vorhanden ist, wird die Tab-Leiste automatisch ausgeblendet; hier sind zwei Seiten registriert, daher wird sie automatisch angezeigt. `this.t()` verwendet automatisch den Plugin-Paketnamen als i18n-Namespace, Details siehe [Context → Häufige Fähigkeiten](../ctx/common-capabilities#internationalisierung-ctxt--ctxi18n).

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Schritt 3: Component der Einstellungsseite schreiben

Erstellen Sie `src/client-v2/pages/ExternalApiSettingsPage.tsx`. Die Einstellungsseite ist ein gewöhnliches React-Component; hier verwenden wir `Form` und `Card` von Antd für die UI, `useFlowContext()`, um über `ctx.api` mit dem Backend zu kommunizieren, und `useT()`, um die Übersetzungsfunktion zu erhalten.

```tsx
// src/client-v2/pages/ExternalApiSettingsPage.tsx
import React from 'react';
import { Form, Input, Button, Card, Space, message } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';

interface ExternalApiSettings {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

export default function ExternalApiSettingsPage() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm<ExternalApiSettings>();

  // Vorhandene Konfiguration laden
  const { loading } = useRequest(
    () =>
      ctx.api.request({
        url: 'externalApi:get',
        method: 'get',
      }),
    {
      onSuccess(response) {
        if (response?.data?.data) {
          form.setFieldsValue(response.data.data);
        }
      },
    },
  );

  // Konfiguration speichern
  const { run: save, loading: saving } = useRequest(
    (values: ExternalApiSettings) =>
      ctx.api.request({
        url: 'externalApi:set',
        method: 'post',
        data: values,
      }),
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully'));
      },
      onError() {
        message.error(t('Save failed'));
      },
    },
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    save(values);
  };

  return (
    <Card title={t('External API Settings')} loading={loading}>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: t('Please enter API Key') }]}
        >
          <Input placeholder="sk-xxxxxxxxxxxx" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="API Secret"
          name="apiSecret"
          rules={[{ required: true, message: t('Please enter API Secret') }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Endpoint"
          name="endpoint"
          rules={[{ required: true, message: t('Please enter endpoint URL') }]}
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('Save')}
            </Button>
            <Button onClick={() => form.resetFields()}>
              {t('Reset')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
```

Wichtige Punkte:

- **`useFlowContext()`** — Import aus `@nocobase/flow-engine`, liefert `ctx.api` und weitere Kontextfähigkeiten
- **`useT()`** — aus `locale.ts` importierter Übersetzungs-Hook, bereits an den Plugin-Namespace gebunden, Details siehe [i18n Internationalisierung](../component/i18n)
- **`useRequest()`** — aus [ahooks](https://ahooks.js.org/hooks/use-request/index), behandelt Loading- und Error-Zustände einer Anfrage. `manual: true` bedeutet keine automatische Anfrage; `run()` muss manuell aufgerufen werden
- **`ctx.api.request()`** — Verwendung wie bei Axios, NocoBase fügt Authentifizierungsinformationen automatisch hinzu

## Schritt 4: Mehrsprachen-Dateien hinzufügen

Bearbeiten Sie die Übersetzungsdateien unter `src/locale/` des Plugins:

```json
// src/locale/zh-CN.json
{
  "External API Settings": "外部服务配置",
  "API Configuration": "API 配置",
  "About": "关于",
  "Plugin name": "插件名称",
  "Version": "版本",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "这是一个演示插件，展示如何注册带多个 Tab 的设置页。",
  "Please enter API Key": "请输入 API Key",
  "Please enter API Secret": "请输入 API Secret",
  "Please enter endpoint URL": "请输入接口地址",
  "Save": "保存",
  "Reset": "重置",
  "Saved successfully": "保存成功",
  "Save failed": "保存失败"
}
```

```json
// src/locale/en-US.json
{
  "External API Settings": "External API Settings",
  "API Configuration": "API Configuration",
  "About": "About",
  "Plugin name": "Plugin name",
  "Version": "Version",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "This is a demo plugin showing how to register a settings page with multiple tabs.",
  "Please enter API Key": "Please enter API Key",
  "Please enter API Secret": "Please enter API Secret",
  "Please enter endpoint URL": "Please enter endpoint URL",
  "Save": "Save",
  "Reset": "Reset",
  "Saved successfully": "Saved successfully",
  "Save failed": "Save failed"
}
```

:::warning Hinweis

Beim erstmaligen Hinzufügen einer Sprachdatei muss die Anwendung neu gestartet werden, damit sie wirksam wird.

:::

Mehr zur Schreibweise von Übersetzungsdateien sowie zur Verwendung von `useT()`, `tExpr()` u. a. siehe [i18n Internationalisierung](../component/i18n).

## Schritt 5: Server-Schnittstellen

Das Formular auf der Client-Seite benötigt im Backend zwei Schnittstellen: `externalApi:get` und `externalApi:set`. Der serverseitige Teil ist nicht aufwendig — eine Datentabelle für die Konfiguration definieren und zwei Schnittstellen registrieren.

### Datentabelle definieren

Erstellen Sie `src/server/collections/externalApiSettings.ts`. NocoBase lädt automatisch die Collection-Definitionen unter diesem Verzeichnis:

```ts
// src/server/collections/externalApiSettings.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'externalApiSettings',
  fields: [
    { name: 'apiKey', type: 'string', title: 'API Key' },
    { name: 'apiSecret', type: 'string', title: 'API Secret' },
    { name: 'endpoint', type: 'string', title: 'Endpoint' },
  ],
});
```

### Resource und Schnittstellen registrieren

Bearbeiten Sie `src/server/plugin.ts` und registrieren Sie über `resourceManager.define()` die Resource, dann konfigurieren Sie die ACL-Berechtigungen:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // Resource und Schnittstellen registrieren
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — Konfiguration lesen
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — Konfiguration speichern
        async set(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const values = ctx.action.params.values;
          const existing = await repo.findOne();
          if (existing) {
            await repo.update({ values, filter: { id: existing.id } });
          } else {
            await repo.create({ values });
          }
          ctx.body = { ok: true };
          await next();
        },
      },
    });

    // Eingeloggte Benutzer dürfen die Konfiguration lesen
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Wichtige Punkte:

- **`ctx.db.getRepository()`** — holt über den Collection-Namen das Datenoperations-Objekt
- **`ctx.action.params.values`** — der Body einer POST-Anfrage
- **`acl.allow()`** — `'loggedIn'` bedeutet, dass eingeloggte Benutzer Zugriff haben. Da für `set` kein explizites allow gesetzt ist, kann standardmäßig nur ein Administrator die Schnittstelle aufrufen
- **`await next()`** — muss am Ende jeder Action aufgerufen werden, eine Konvention der Koa-Middleware

## Schritt 6: „Über"-Seite schreiben

In Schritt 2 haben wir zwei Tabs registriert. Das Component für „API-Konfiguration" wurde in Schritt 3 erstellt; nun schreiben wir die Seite für den Tab „Über".

Erstellen Sie `src/client-v2/pages/AboutPage.tsx`:

```tsx
// src/client-v2/pages/AboutPage.tsx
import React from 'react';
import { Card, Descriptions, Typography } from 'antd';
import { useT } from '../locale';

const { Paragraph } = Typography;

export default function AboutPage() {
  const t = useT();

  return (
    <Card title={t('About')}>
      <Descriptions column={1} bordered style={{ maxWidth: 600 }}>
        <Descriptions.Item label={t('Plugin name')}>
          @nocobase-example/plugin-settings-page
        </Descriptions.Item>
        <Descriptions.Item label={t('Version')}>1.0.0</Descriptions.Item>
      </Descriptions>
      <Paragraph style={{ marginTop: 16, color: '#888' }}>
        {t('This is a demo plugin showing how to register a settings page with multiple tabs.')}
      </Paragraph>
    </Card>
  );
}
```

Diese Seite ist sehr einfach — sie verwendet `Descriptions` von Antd, um Plugin-Informationen anzuzeigen. In tatsächlichen Projekten kann der „Über"-Tab Versionsnummern, Changelogs, Hilfelinks usw. enthalten.

## Schritt 7: Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-settings-page
```

Aktivieren Sie das Plugin, aktualisieren Sie die Seite, und im Menü „Plugin-Konfiguration" erscheint der Eintrag „Externe Service-Konfiguration".

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Vollständiger Quellcode

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — Vollständiges Beispiel einer Plugin-Einstellungsseite

## Zusammenfassung

In diesem Beispiel verwendete Fähigkeiten:

| Fähigkeit             | Verwendung                                                       | Dokumentation                                                            |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Einstellungsseite registrieren | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router)                                        |
| Mehrere Tabs auf der Einstellungsseite | Mehrere `addPageTabItem()` mit demselben `menuKey` registrieren | [Router](../router)                                        |
| API-Anfragen | `ctx.api.request()`                                        | [Context → Häufige Fähigkeiten](../ctx/common-capabilities#api-anfragen-ctxapi) |
| Internationalisierung (Client) | `this.t()` / `useT()`                                      | [i18n Internationalisierung](../component/i18n)                                |
| Internationalisierung (Server) | `ctx.t()` / `plugin.t()`                                   | [i18n Internationalisierung (Server)](../../server/i18n)                      |
| Formular-UI | Antd Form                                                  | [Ant Design Form](https://5x.ant.design/components/form)        |

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst von Grund auf erstellen
- [Plugin](../plugin) — Plugin-Einstiegspunkt und Lebenszyklus
- [Router](../router) — Seitenrouten und Registrierung der Plugin-Einstellungsseite
- [Context → Häufige Fähigkeiten](../ctx/common-capabilities) — ctx.api, ctx.t usw.
- [Component-Entwicklung](../component/index.md) — Schreibweise von React-Components
- [Server-Entwicklungs-Übersicht](../../server) — Backend-Schnittstellen definieren
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien
- [i18n Internationalisierung (Server)](../../server/i18n) — Serverseitige Übersetzung
