---
title: "Распространённые возможности"
description: "Распространённые возможности контекста клиента NocoBase: запросы ctx.api, интернационализация ctx.t, логи ctx.logger, маршрутизация ctx.router, управление видами ctx.viewer, контроль доступа ctx.acl."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Распространённые возможности

Объект контекста предоставляет различные встроенные возможности NocoBase. При этом некоторые доступны только в Plugin, другие — только в компонентах, третьи — в обоих местах, но с разным синтаксисом. Сначала общая таблица:

| Возможность | Plugin (`this.xxx`)            | Component (`ctx.xxx`)        | Описание                          |
| ---------- | ------------------------------ | ---------------------------- | --------------------------------- |
| API-запрос | `this.context.api`             | `ctx.api`                    | Использование одинаковое          |
| Интернационализация | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` автоматически подставляет namespace плагина |
| Логирование | `this.context.logger`          | `ctx.logger`                 | Использование одинаковое          |
| Регистрация маршрута | `this.router.add()`            | -                            | Только в Plugin                   |
| Навигация | -                              | `ctx.router.navigate()`      | Только в компонентах              |
| Информация о маршруте | `this.context.location`        | `ctx.route` / `ctx.location` | Рекомендуется использовать в компонентах |
| Управление видами | `this.context.viewer`         | `ctx.viewer`                 | Открытие модальных окон / выдвижных панелей и т.д. |
| FlowEngine | `this.flowEngine`              | -                            | Только в Plugin                   |

Ниже разбирается каждая возможность по namespace.

## API-запрос (ctx.api)

Через `ctx.api.request()` вызываются бэкенд-интерфейсы, использование совпадает с [Axios](https://axios-http.com/).

### Использование в Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 在 load() 里直接发请求
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('应用信息', response.data);
  }
}
```

### Использование в компонентах

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET 请求
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST 请求
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>加载数据</button>;
}
```

### В сочетании с ahooks useRequest

В компонентах можно использовать `useRequest` из [ahooks](https://ahooks.js.org/hooks/use-request/index) для упрощения управления состоянием запроса:

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

  if (loading) return <div>加载中...</div>;
  if (error) return <div>请求出错: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Перехватчики запросов

Через `ctx.api.axios` можно добавлять перехватчики запросов/ответов, обычно настраиваемые в `load()` Plugin:

```ts
async load() {
  // 请求拦截器：添加自定义请求头
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // 响应拦截器：统一错误处理
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('请求出错', error);
      return Promise.reject(error);
    },
  );
}
```

### Пользовательские заголовки запроса NocoBase

Сервер NocoBase поддерживает следующие пользовательские заголовки запроса. Обычно они автоматически вставляются перехватчиком, и устанавливать их вручную не нужно:

| Header            | Описание                          |
| ----------------- | --------------------------------- |
| `X-App`           | В сценариях нескольких приложений указывает текущее приложение |
| `X-Locale`        | Текущий язык (например, `zh-CN`, `en-US`) |
| `X-Hostname`      | Имя хоста клиента                 |
| `X-Timezone`      | Часовой пояс клиента (например, `+08:00`) |
| `X-Role`          | Текущая роль                      |
| `X-Authenticator` | Текущий способ аутентификации пользователя |

## Интернационализация (ctx.t / ctx.i18n)

Плагин NocoBase управляет файлами многоязычной локализации через каталог `src/locale/`, а в коде использует переводы через `ctx.t()`.

### Файлы многоязычной локализации

Создайте JSON-файлы по языкам в `src/locale/` плагина:

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

:::warning Внимание

При первом добавлении файла языка нужно перезапустить приложение, чтобы он вступил в силу.

:::

### ctx.t()

В компонентах через `ctx.t()` получают переведённый текст:

```tsx
const ctx = useFlowContext();

// 基本用法
ctx.t('Hello');

// 带变量
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// 指定命名空间（默认命名空间是插件的包名）
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

В Plugin использовать `this.t()` удобнее — он **автоматически подставляет имя пакета плагина в качестве namespace**, передавать `ns` вручную не нужно:

```ts
class MyPlugin extends Plugin {
  async load() {
    // 自动使用当前插件的包名作为 ns
    console.log(this.t('Hello'));

    // 等同于
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` — это нижележащий экземпляр [i18next](https://www.i18next.com/). Обычно достаточно `ctx.t()`. Однако если Вам нужно динамически переключать язык, отслеживать изменения языка и т.д., можно использовать `ctx.i18n`:

```ts
// 获取当前语言
const currentLang = ctx.i18n.language; // 'zh-CN'

// 监听语言变化
ctx.i18n.on('languageChanged', (lng) => {
  console.log('语言切换为', lng);
});
```

### tExpr()

`tExpr()` используется для генерации строки отложенного перевода, обычно используется в `FlowModel.define()` — потому что define выполняется на этапе загрузки модуля, и в этот момент ещё нет экземпляра i18n:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // 生成 '{{t("Hello block")}}'，运行时再翻译
});
```

Более полное использование интернационализации (формат файлов перевода, хук useT, tExpr и т.д.) см. в [i18n Интернационализация](../component/i18n). Полный список языков, поддерживаемых NocoBase, см. в [Список языков](../../languages).

## Логирование (ctx.logger)

Через `ctx.logger` выводятся структурированные логи на основе [pino](https://github.com/pinojs/pino).

### Использование в Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('插件加载完成', { plugin: 'my-plugin' });
    this.context.logger.error('初始化失败', { error });
  }
}
```

### Использование в компонентах

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('页面加载完成', { page: 'UserList' });
    ctx.logger.debug('当前用户状态', { user });
  };

  // ...
}
```

Уровни логирования по убыванию: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Выводятся только логи уровня выше или равного текущему настроенному.

## Маршрутизация (ctx.router / ctx.route / ctx.location)

Возможности маршрутизации делятся на три части: регистрация (только в Plugin), навигация и получение информации (только в компонентах).

### Регистрация маршрута (this.router / this.pluginSettingsManager)

В `load()` плагина через `this.router.add()` регистрируются маршруты страниц, через `this.pluginSettingsManager` регистрируется страница настроек плагина:

```ts
async load() {
  // 注册普通页面路由
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // 注册插件设置页（会出现在「插件配置」菜单里）
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design 图标，参考 https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Подробнее см. в [Router (Маршрутизация)](../router). Полный пример страницы настроек см. в [Создание страницы настроек плагина](../examples/settings-page).

:::warning Внимание

`this.router` — это RouterManager, используется для **регистрации маршрутов**. `this.pluginSettingsManager` — это PluginSettingsManager, используется для **регистрации страницы настроек**. Ни одно из них не совпадает с `ctx.router` (React Router, используется для **навигации между страницами**) в компонентах.

:::

### Навигация (ctx.router)

В компонентах через `ctx.router.navigate()` выполняется переход между страницами:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Информация о маршруте (ctx.route)

В компонентах через `ctx.route` получают информацию о текущем маршруте:

```tsx
const ctx = useFlowContext();

// 获取动态参数（比如路由定义为 /users/:id）
const { id } = ctx.route.params;

// 获取路由名字
const { name } = ctx.route;
```

Полный тип `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // 路由唯一标识
  path?: string;         // 路由模板
  pathname?: string;     // 路由的完整路径
  params?: Record<string, any>; // 路由参数
}
```

### Текущий URL (ctx.location)

`ctx.location` предоставляет подробную информацию о текущем URL, аналогично `window.location` браузера:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

Хотя `ctx.route` и `ctx.location` доступны через `this.context` и в Plugin, на момент загрузки плагина URL не определён, и полученные значения не имеют смысла. Рекомендуется использовать в компонентах.

## Управление видами (ctx.viewer / ctx.view)

`ctx.viewer` предоставляет императивную возможность открытия модальных окон, выдвижных панелей и других видов. Доступен и в Plugin, и в компонентах.

### Использование в Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 比如在某个初始化逻辑中打开一个弹窗
    this.context.viewer.dialog({
      title: '欢迎',
      content: () => <div>插件初始化完成</div>,
    });
  }
}
```

### Использование в компонентах

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // 打开弹窗
    ctx.viewer.dialog({
      title: '编辑用户',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // 打开抽屉
    ctx.viewer.drawer({
      title: '详情',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>编辑</Button>
      <Button onClick={openDrawer}>查看详情</Button>
    </div>
  );
}
```

### Универсальный метод

```tsx
// 通过 type 指定视图类型
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: '标题',
  content: () => <SomeComponent />,
});
```

### Операции внутри вида (ctx.view)

В компонентах внутри модального окна/выдвижной панели через `ctx.view` можно управлять текущим видом (например, закрывать его):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>弹窗内容</p>
      <Button onClick={() => ctx.view.close()}>关闭</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` — это экземпляр FlowEngine, доступный только в Plugin. Обычно используется для регистрации FlowModel:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 注册 FlowModel（推荐按需加载写法）
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel — это ядро системы визуальной конфигурации NocoBase. Если Ваш компонент должен появиться в меню «Добавить блок / поле / действие», его нужно обернуть через FlowModel. Подробное использование см. в [FlowEngine](../flow-engine/index.md).

## Дополнительные возможности

Следующие возможности могут потребоваться в более продвинутых сценариях, кратко перечислим их здесь:

| Свойство                | Описание                                            |
| ----------------------- | --------------------------------------------------- |
| `ctx.model`             | Текущий экземпляр FlowModel (доступен в контексте выполнения Flow) |
| `ctx.ref`               | Ссылка на компонент, используется вместе с `ctx.onRefReady` |
| `ctx.exit()`            | Выход из выполнения текущего Flow                   |
| `ctx.defineProperty()`  | Динамическое добавление пользовательского свойства в контекст |
| `ctx.defineMethod()`    | Динамическое добавление пользовательского метода в контекст |
| `ctx.useResource()`     | Получение интерфейса операций над ресурсом данных   |
| `ctx.dataSourceManager` | Управление источниками данных                       |

Подробное использование этих возможностей см. в [полной документации FlowEngine](../../../flow-engine/index.md).

## Связанные ссылки

- [Обзор Context](../ctx/index.md) — сходства и различия двух точек входа в контекст
- [Plugin (Плагин)](../plugin) — сокращённые свойства Plugin
- [Разработка Component-компонентов](../component/index.md) — использование useFlowContext в компонентах
- [Router (Маршрутизация)](../router) — регистрация и навигация маршрутов
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowEngine
- [i18n Интернационализация](../component/i18n) — формат файлов перевода, tExpr, useT
- [Список языков](../../languages) — поддерживаемые NocoBase коды языков
- [Создание страницы настроек плагина](../examples/settings-page) — полный пример использования ctx.api
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
