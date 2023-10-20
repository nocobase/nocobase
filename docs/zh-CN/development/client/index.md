# 概述

NocoBase 客户端的扩展大多以 Provider 的形式提供。

## 内置的 Providers

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

## 客户端 Provider 模块的注册

静态的 Provider 通过 app.use() 注册，动态的 Provider 通过 dynamicImport 适配。

```tsx | pure
import React from 'react';
import { Application } from '@nocobase/client';

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`../plugins/${name}`);
  },
});

// 访问 /hello 页面时，显示 Hello world!
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

## 插件的客户端

初始化的空插件，客户端相关目录结构如下：

```bash
|- /my-plugin
  |- /src
    |- /client
      |- index.tsx
  |- client.d.ts
  |- client.js
```

`client/index.tsx` 内容如下：

```tsx | pure
import React from 'react';

// 这是一个空的 Provider，只有 children 传递，并未提供自定义的 Context
export default React.memo((props) => {
  return <>{props.children}</>;
});
```

插件 pm.add 之后，会向 `packages/app/client/src/plugins` 目录写入 `my-plugin.ts` 文件
