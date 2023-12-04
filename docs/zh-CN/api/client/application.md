# Application

## 构造函数

### `constructor()`

创建一个应用实例。

**签名**

* `constructor(options: ApplicationOptions)`

**示例**

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

## 方法

### use()

添加 Providers，内置 Providers 有：

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

渲染 App 组件

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
