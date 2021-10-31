---
order: 2
---

# Client-side Kernel

To allow more non-developers to participate, NocoBase provides a companion client-side plugin -- a visual configuration interface with no code. The core of this part is @nocobase/client, which ideally can be used within any front-end build tool or framework, e.g.

- umijs
- create-react-app
- icejs
- vite
- snowpack
- nextjs
- Other

For the time being only support umijs (packaging compilation is still some problems), the future will gradually support the above-listed frameworks.

The main components of the client include.

## Request

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
api.resource('collections').relationship('fields').of(1).create();
```

The following details are TBD, special resources

```js
api.collections.create();
api.uiSchemas.create();
```

Request Hook

[https://www.npmjs.com/package/@ahooksjs/use-request](https://www.npmjs.com/package/@ahooksjs/use-request)

```js
const { data } = useRequest(() => api.resource('users').findMany());
```

## Routing

- createRouteSwitch

```js
const RouteSwitch = createRouteSwitch({
  components: {},
});

<RouteSwitch routes={[]} />
```

## Schema component

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

## How do you assemble it?

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
  // The locale here can be handled dynamically depending on the i18next
  return (
    <ConfigProvider locale={locale}>{props.children}</ConfigProvider
  );
}

const App = () => {
  return (
    <APIClientProvider client={apiClient}>
      <I18nextProvider i18n={i18n}>
        <AntdProvider
          <Router
            <RouteSwitch routes=[routes]/>
          </Router>
        </AntdProvider>
      </I18nextProvider>
    </APIClientProvider>
  );
}
</pre>

- APIClientProvider: provides the APIClient
- I18nextProvider: internationalization
- AntdProvider: handles the internationalization of antd components, which needs to be placed in I18nextProvider
- Router: route driver
- RouteSwitch: route distribution

The above code may seem a bit verbose, but the actual function and role of each part is not the same, so it is not suitable for over-encapsulation. If needed, it can be further encapsulated according to the actual situation.