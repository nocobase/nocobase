---
order: 2
---

# 客户端内核

为了让更多非开发人员也能参与进来，NocoBase 提供了配套的客户端插件 —— 无代码的可视化配置界面。这部分的核心就是 @nocobase/client，理想状态可以用在任意前端构建工具或框架内，如：

- umijs
- create-react-app
- icejs
- vite
- snowpack
- nextjs
- 其他

暂时只支持 umijs（打包编译还有些问题），未来会逐步支持以上罗列的各个框架。

客户端主要的组成部分包括：

## 请求

- API Client
- Request Hook

```ts
const api = new APIClient({
	request,
});

api.auth();
api.get();
api.post();
api.resource('collections').create();
api.resource('collections').findOne({});
api.resource('collections').findMany({});
api.resource('collections').relation('fields').of(1).create();
```

以下细节待定，特殊的资源

```js
api.collections.create();
api.uiSchemas.create();
```

Request Hook

[https://www.npmjs.com/package/@ahooksjs/use-request](https://www.npmjs.com/package/@ahooksjs/use-request)

```js
const { data } = useRequest(() => api.resource('users').findMany());
```

## 路由

- createRouteSwitch

```js
const RouteSwitch = createRouteSwitch({
	components: {},
});

<RouteSwitch routes={[]} />
```

## Schema 组件

- createSchemaComponent

```js
function Hello() {
	return <div>Hello Word</div>
}

const SchemaComponent = createSchemaComponent({
  scope,
  components: {
  	Hello
  },
});

const schema = {
  type: 'void',
	'x-component': 'Hello',
};

<SchemaComponent schema={schema} />
```

## 怎么组装起来？

<pre lang="tsx">
import { I18nextProvider } from 'react-i18next';
import { createRouteSwitch, APIClient } from '@nocobase/client';

const apiClient = new APIClient();
const i18n = i18next.createInstance();

const Hello = () => {
	return <div>Hello</div>;
}

const SchemaComponent = createSchemaComponent({
	components: {
    Hello,
  },
});

const PageTemplate = () => {
  const schema = {
  	type: 'void',
    'x-component': 'Hello',
  };
	return (
  	<SchemaComponent schema={schema}/>
  );
}

const RouteSwitch = createRouteSwitch({
	components: {
    PageTemplate,
  },
});

const routes = [
  { path: '/hello', component: 'Hello' },
];

function AntdProvider(props) {
  // 可以根据 i18next 的情况动态处理这里的 locale
	return (
  	<ConfigProvider locale={locale}>{props.children}</ConfigProvider>
  );
}

const App = () => {
	return (
    <APIClientProvider client={apiClient}>
      <I18nextProvider i18n={i18n}>
        <AntdProvider>
          <Router>
            <RouteSwitch routes=[routes]/>
          </Router>
        </AntdProvider>
      </I18nextProvider>
    </APIClientProvider>
  );
}
</pre>

- APIClientProvider：提供 APIClient
- I18nextProvider：国际化
- AntdProvider：处理 antd 组件的国际化，需要放在 I18nextProvider 里
- Router：路由驱动
- RouteSwitch：路由分发

上面代码看似有些啰嗦，实际各部分的功能和作用并不一样，不适合过度封装。如果需要可以根据实际情况，再进一步封装。