---
order: 2
---

# 客户端内核

## Providers

客户端界面是由组件构成的组件树。为了便于数据在组件间共享，提供了一些核心的 Providers 组件，包括：

- APIClientProvider
- I18nextProvider
- AntdConfigProvider
- ACLProvider
- CurrentUserProvider
- SystemSettingsProvider
- DocumentTitleProvider
- DesignableProvider
- SchemaComponentProvider
- CollectionManagerProvider
- 其他扩展

Provider 一个一个嵌套，层级太深了，也不利于扩展。为此提供了一个 compose 方法用于连接多个 Providers，如：

```jsx | pure
export providers = [
  [APIClientProvider, { apiClient }], // apiClient 的放最外层
  [I18nextProvider, { i18n }], // 由 i18next 提供
  AntdConfigProvider, // 会用到 ApiClient、I18next，所有放在这里
  ACLProvider, // 通过 api 获取当前可读的 ACL 配置
  CurrentUserProvider, // 当前用户信息
  SystemSettingsProvider, // 获取开放的系统配置，主要是站点信息之类
  DocumentTitleProvider, // 页面标题，需要放到 SystemSettingsProvider 后面
  DesignableProvider, // designable 主要用于控制 SchemaComponent 是否显示配置工具栏按钮
  [SchemaComponentProvider, { components, scope }], // SchemaComponent 配置
  [CollectionManagerProvider, { interfaces }], // 全局的 Collection Manager
];

const App = compose(providers)((props) => {
  return <div>Hello World</div>;
});
```

## RouteSwitch

实现复杂的应用肯定会用到路由，为此提供了 RouteSwitch，用于实现组件的切换，与上述例子结合，是这样的：

```jsx | pure
import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { createRouteSwitch, RouteRedirectProps } from '@nocobase/client';

const RouteSwitch = createRouteSwitch({
  components: {
    Signin: () => <div>Signin</div>,
    Home: (props) => <div>Home {props.children}</div>,
    Page: () => <div>Page</div>,
  },
});

const routes: Array<RouteRedirectProps> = [
  {
    type: 'route',
    path: '/signin',
    exact: true,
    component: 'Signin',
  },
  {
    type: 'route',
    path: '/home',
    component: 'Home',
    routes: [
      {
        type: 'route',
        path: '/home/123',
        exact: true,
        component: 'Page',
      },
    ],
  },
];

const App = compose(providers)((props) => {
  return (
    <Router initialEntries={['/home/123']}>
      <RouteSwitch routes={routes} />
    </Router>
  );
});
```

## APIClient

APIClientProvider 放在最外层，因为在 WEB 应用里，客户端请求无处不在。为了便于客户端请求，提供的 API 有：

- APIClient：客户端 SDK
- APIClientProvider：Context Provider，全局共享
- useRequest()：需要结合 APIClientProvider 来使用
- useApiClient()：获取到当前配置的 apiClient 实例

### APIClient

```ts
const api = new APIClient({
  request, // 将 request 抛出去，方便各种自定义适配
});
api.request(options);
api.resource(name);
```

### APIClientProvider

提供可在组件间共享的 apiClient 实例

```jsx | pure
const api = new APIClient({
  request, // 将 request 抛出去，方便各种自定义适配
});

<APIClientProvider apiClient={api}>
  {/* children */}
</APIClientProvider>
```

### useRequest

需要结合 APIClientProvider 一起使用，是对 ahooks 的 useRequest 的封装，支持 resource 请求。

```ts
const { data, loading } = useRequest({
  actionName,
  resourceName,
});
```

## i18next

客户端内核使用 i18next 作国际化支持，如：

```js
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: 'en-US',
  debug: true,
  defaultNS: 'client',
  resources: {
    'en-US': {
      client: {},
    },
    'zh-CN': {
      client: {},
    },
  },
});
```

可以通过添加监听，来处理一些额外的需求

```js
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('locale', lng);
  setMomentLng(lng);
});
```

### I18nextProvider

通过 I18nextProvider 传递给其他组件

```jsx | pure
<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>
```

### useTranslation()

其他组件里可以通过 useTranslation() 取得 t 和 i18n。

```jsx | pure
import React from 'react';
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();

  return <p>{t('my translated text')}</p>
}
```

## Ant Design

NocoBase 使用 antd 作为默认组件库，多语言的适配，做了一些处理：

### AntdConfigProvider

```jsx | pure
import React, { createContext } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ConfigProvider, Spin } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';

function AntdConfigProvider(props) {
  const { i18n } = useTranslation();
  // 从服务端获取 lang
  const { loading } = useRequest('app:getLang', {
    onSuccess(data) {
      i18n.changeLanguage(data.lang);
    },
  });
  if (loading) {
    return <Spin />;
  }
  // 根据 lang 设置 antd 的 locale
  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;
  return <ConfigProvider locale={locale}>{props.children}</AntdConfigProvider>;
}
```

## ACL

`plugin-acl` 的客户端模块，提供：

- ACL.Provider
- ACL.Manager
- ACL.Action

细节待补充...

## SystemSettings

`plugin-system-settings` 的客户端模块，提供的 API 包括：

- SystemSettingsProvider
- useSystemSettings()
- SystemSettingsForm

### SystemSettingsProvider

```jsx | pure
const SystemSettingsContext = createContext();

export function SystemSettingsProvider() {
  const service = useRequest('system_settings:get');
  return <SystemSettingsContext.Provider value={service}>{props.children}</SystemSettingsContext>
}
```

### useSystemSettings()

可用于获取系统设置的数据，当系统设置更新后，需要 refresh 处理。

```js
const { data, refresh, loading } = useSystemSettings();
```

### SystemSettingsForm

系统设置表单

## DocumentTitle

页面标题

### DocumentTitleProvider

### useDocumentTitle()

## Designable

### DesignableProvider

细节待补充...

## SchemaComponent

### SchemaComponentProvider

```jsx | pure
<SchemaComponentProvider components={{}} scope={{}}>
</SchemaComponentProvider>
```

### useSchemaComponent()

## CollectionManager

`plugin-collection-manager` 的前端模块

细节待补充...