# Application

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

## 属性

## 方法



## Providers

- APIClientProvider
- I18nextProvider
- AntdConfigProvider
- RemoteRouteSwitchProvider
- SystemSettingsProvider
- PluginManagerProvider
- SchemaComponentProvider
- SchemaInitializerProvider
- BlockSchemaComponentProvider
- AntdSchemaComponentProvider
- ACLProvider
- RemoteDocumentTitleProvider
