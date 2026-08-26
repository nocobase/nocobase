---
title: "Создание страницы настроек плагина"
description: "Практика плагинов NocoBase: создание страницы настроек плагина с pluginSettingsManager + Component + ctx.api для управления API-ключами сторонних сервисов."
keywords: "страница настроек плагина,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Создание страницы настроек плагина

Многим плагинам нужна страница настроек, чтобы пользователь мог конфигурировать параметры — например, API-ключ стороннего сервиса, адрес Webhook и т.д. Этот пример показывает, как с помощью `pluginSettingsManager` + React-компонентов + `ctx.api` создать полноценную страницу настроек плагина.

Этот пример не задействует FlowEngine, это чисто комбинация Plugin + Router + Component + Context.

:::tip Предварительное чтение

Рекомендуется сначала ознакомиться со следующим — это упростит разработку:

- [Написание первого плагина](../../write-your-first-plugin) — создание плагина и структура каталогов
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл `load()`
- [Router (Маршрутизация)](../router) — регистрация страницы настроек через `pluginSettingsManager`
- [Разработка Component-компонентов](../component/index.md) — написание React-компонентов и использование useFlowContext
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование `useT()`

:::


## Конечный результат

Мы делаем страницу настроек «Внешний сервис»:

- Появляется в меню «Конфигурация плагинов»
- Использует Antd Form в качестве UI формы
- Через `ctx.api` вызывает бэкенд-интерфейсы для чтения и сохранения конфигурации
- После успешного сохранения выводит уведомление

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Полный исходный код см. в [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Если хотите запустить и посмотреть локально:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

Ниже шаг за шагом построим этот плагин с нуля.

## Шаг 1: создать каркас плагина

Выполните в корне репозитория:

```bash
yarn pm create @my-project/plugin-settings-page
```

Это сгенерирует базовую файловую структуру в `packages/plugins/@my-project/plugin-settings-page`, включая каталоги `src/client-v2/`, `src/server/`, `src/locale/` и т.д. Подробное описание см. в [Написание первого плагина](../../write-your-first-plugin).

## Шаг 2: зарегистрировать страницу настроек

Отредактируйте `src/client-v2/plugin.tsx`, в `load()` через `this.pluginSettingsManager` зарегистрируйте страницу настроек. В два этапа: сначала через `addMenuItem()` зарегистрируйте пункт меню, затем через `addPageTabItem()` зарегистрируйте сами страницы:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // 注册菜单入口
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Ant Design 图标，参考 https://5x.ant.design/components/icon
    });

    // Tab 1：API 配置（key 为 'index'，映射到菜单根路径 /admin/settings/external-api）
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // 排序值越小越靠前
    });

    // Tab 2：关于页面（映射到 /admin/settings/external-api/about）
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

После регистрации в меню «Конфигурация плагинов» появится пункт «Внешний сервис», вверху будут две вкладки — «API Configuration» и «About». Когда в меню только одна страница, панель вкладок автоматически скрывается; здесь зарегистрированы две страницы, поэтому она будет автоматически отображаться. `this.t()` автоматически использует имя пакета текущего плагина в качестве namespace i18n. Подробнее см. в [Context → Распространённые возможности](../ctx/common-capabilities#интернационализация-ctxt--ctxi18n).

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Шаг 3: написать компонент страницы настроек

Создайте `src/client-v2/pages/ExternalApiSettingsPage.tsx`. Страница настроек — это обычный React-компонент. Здесь используем `Form` и `Card` из Antd для построения UI, через `useFlowContext()` получаем `ctx.api` для взаимодействия с бэкендом, через `useT()` — функцию перевода.

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

  // 加载已有配置
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

  // 保存配置
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

Несколько ключевых моментов:

- **`useFlowContext()`** — импортируется из `@nocobase/flow-engine`, даёт доступ к `ctx.api` и другим возможностям контекста
- **`useT()`** — хук перевода, импортируемый из `locale.ts`, уже привязан к namespace плагина. Подробнее см. [i18n Интернационализация](../component/i18n)
- **`useRequest()`** — из [ahooks](https://ahooks.js.org/hooks/use-request/index), обрабатывает состояния loading, error для запросов. `manual: true` означает, что запрос не выполняется автоматически — нужно вручную вызвать `run()`
- **`ctx.api.request()`** — использование совпадает с Axios, NocoBase автоматически добавляет аутентификационную информацию

## Шаг 4: добавить файлы локализации

Отредактируйте файлы перевода в `src/locale/` плагина:

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

:::warning Внимание

При первом добавлении файла языка нужно перезапустить приложение, чтобы он вступил в силу.

:::

О формате файлов перевода, хуке `useT()`, `tExpr()` и других способах использования подробнее см. в [i18n Интернационализация](../component/i18n).

## Шаг 5: серверные интерфейсы

Форме на клиенте нужны два бэкенд-интерфейса: `externalApi:get` и `externalApi:set`. Серверная часть несложная — определяется таблица для хранения конфигурации, регистрируются два интерфейса.

### Определение таблицы данных

Создайте `src/server/collections/externalApiSettings.ts`. NocoBase автоматически загружает определения collection из этого каталога:

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

### Регистрация ресурса и интерфейсов

Отредактируйте `src/server/plugin.ts`, через `resourceManager.define()` зарегистрируйте ресурс, затем настройте права ACL:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // 注册资源和接口
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — 读取配置
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — 保存配置
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

    // 登录用户可以读取配置
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Несколько ключевых моментов:

- **`ctx.db.getRepository()`** — получение объекта операций над данными по имени collection
- **`ctx.action.params.values`** — данные тела POST-запроса
- **`acl.allow()`** — `'loggedIn'` означает, что доступ имеет любой авторизованный пользователь. Для интерфейса `set` явно `allow` не указан, по умолчанию его может вызвать только администратор
- **`await next()`** — каждый action в конце должен вызывать это, это соглашение middleware Koa

## Шаг 6: написать страницу «О плагине»

На втором шаге мы зарегистрировали две вкладки. Компонент страницы «API Configuration» был написан на третьем шаге, теперь напишем страницу вкладки «About».

Создайте `src/client-v2/pages/AboutPage.tsx`:

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

Эта страница очень простая — через `Descriptions` от Antd выводится информация о плагине. В реальных проектах вкладка «About» может использоваться для номера версии, журнала обновлений, ссылок на справку и т.д.

## Шаг 7: включить плагин

```bash
yarn pm enable @my-project/plugin-settings-page
```

После включения и обновления страницы в меню «Конфигурация плагинов» появится пункт «Внешний сервис».

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Полный исходный код

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — полный пример страницы настроек плагина

## Резюме

Возможности, использованные в этом примере:

| Возможность      | Использование                                              | Документация                                                      |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Регистрация страницы настроек | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router (Маршрутизация)](../router)                          |
| Многовкладочная страница настроек | Несколько `addPageTabItem()` с одним `menuKey`        | [Router (Маршрутизация)](../router)                                  |
| API-запрос       | `ctx.api.request()`                                        | [Context → Распространённые возможности](../ctx/common-capabilities#api-запрос-ctxapi) |
| Интернационализация (клиент) | `this.t()` / `useT()`                          | [i18n Интернационализация](../component/i18n)                     |
| Интернационализация (сервер) | `ctx.t()` / `plugin.t()`                       | [i18n Интернационализация (сервер)](../../server/i18n)            |
| UI формы         | Antd Form                                                  | [Ant Design Form](https://5x.ant.design/components/form)          |

## Связанные ссылки

- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина с нуля
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл
- [Router (Маршрутизация)](../router) — маршруты страниц и регистрация страницы настроек плагина
- [Context → Распространённые возможности](../ctx/common-capabilities) — ctx.api, ctx.t и т.д.
- [Разработка Component-компонентов](../component/index.md) — написание React-компонентов
- [Обзор серверной разработки](../../server) — определение серверных интерфейсов
- [i18n Интернационализация](../component/i18n) — формат файлов перевода
- [i18n Интернационализация (сервер)](../../server/i18n) — серверный перевод
