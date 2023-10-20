# Overview

Most of the extensions for the NocoBase client are provided as Providers.

## Built-in Providers

- APIClientProvider
- I18nextProvider
- AntdConfigProvider
- SystemSettingsProvider
- PluginManagerProvider
- SchemaComponentProvider
- BlockSchemaComponentProvider
- AntdSchemaComponentProvider
- DocumentTitleProvider
- ACLProvider

## Registration of client-side Provider modules

Static Providers are registered with app.use() and dynamic Providers are adapted with dynamicImport.

```tsx | pure
import React from 'react';
import { Application } from '@nocobase/client';

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`... /plugins/${name}`);
  },
});

// When visiting the /hello page, display Hello world!
const HelloProvider = React.memo((props) => {
  const location = useLocation();
  if (location.pathname === '/hello') {
    return <div>Hello world!</div>
  }
  return <>{props.children}</>
});
HelloProvider.displayName = 'HelloProvider'

app.use(HelloProvider);
```

## Client-side of plugins

Directory structure of the client-side of an empty plugin is as follows

```bash
|- /my-plugin
  |- /src
    |- /client
      |- index.tsx
  |- client.d.ts
  |- client.js
```

``client/index.tsx`` reads as follows.

```tsx | pure
import React from 'react';

// This is an empty Provider, only children are passed, no custom Context is provided
export default React.memo((props) => {
  return <>{props.children}</>;
});
```

After the plugin pm.add, it writes the `my-plugin.ts` file to the `packages/app/client/src/plugins` directory.
