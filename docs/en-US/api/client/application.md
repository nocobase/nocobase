# Application

## Constructor

### `constructor()`

Create an application instance.

**Signature**

* `constructor(options: ApplicationOptions)`

**Example**

```ts
const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`../plugins/${name}`);
  },
});
```

## Methods

### use()

Add Providers, build-in Providers are:

- APIClientProvider
- I18nextProvider
- AntdConfigProvider
- SystemSettingsProvider
- PluginManagerProvider
- SchemaComponentProvider
- BlockSchemaComponentProvider
- AntdSchemaComponentProvider
- ACLProvider
- RemoteDocumentTitleProvider

### render()

Component to render the App.

```ts
import { Application } from '@nocobase/client';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`../plugins/${name}`);
  },
});

export default app.render();
```
