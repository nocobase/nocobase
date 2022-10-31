# v0.8：插件管理器和文档

从 v0.8 开始，NocoBase 开始提供可用的插件管理器和开发文档。以下是 v0.8 的主要变化。

## 界面右上角的调整

- 界面配置
- 插件管理器
- 配置中心
- 个人中心

<img src="./v08-changelog/topright.jpg" style="max-width: 500px;" />

## 全新的插件管理器

v0.8 提供了强大的插件管理器用于无代码的方式管理插件。

### 插件管理器流程

<img src="./v08-changelog/pm-flow.svg" style="max-width: 580px;"/>

### 插件管理器界面

目前主要用于本地插件的禁用、激活和删除。内置插件不能删除，插件市场敬请期待。

<img src="./v08-changelog/pm-ui.jpg" />

### 插件管理器命令行

除了可以在无代码界面激活、禁用插件，也可以通过命令行更完整的管理插件。

```bash
# 创建插件
yarn pm create hello
# 注册插件
yarn pm add hello
# 激活插件
yarn pm enable hello
# 禁用插件
yarn pm disable hello
# 删除插件
yarn pm remove hello
```

备注：插件的发布和升级会在后续的版本里支持。

```bash
# 发布插件
yarn pm publish hello
# 升级插件
yarn pm upgrade hello
```

更多插件示例，查看 [packages/samples](https://github.com/nocobase/nocobase/tree/main/packages/samples)。

## 插件的变化

### 插件目录结构

```bash
|- /hello
  |- /src
    |- /client      # 插件客户端代码
    |- /server      # 插件服务端代码
  |- client.d.ts
  |- client.js
  |- package.json   # 插件包信息
  |- server.d.ts
  |- server.js
```

### 插件名称规范

NocoBase 插件也是 NPM 包，插件名和 NPM 包名的对应规则为 `${PLUGIN_PACKAGE_PREFIX}-${pluginName}`。

`PLUGIN_PACKAGE_PREFIX` 为插件包前缀，可以在 .env 里自定义，[点此查看 PLUGIN_PACKAGE_PREFIX 说明](/api/env#plugin_package_prefix)。

例如，有一名为 `my-nocobase-app` 的项目，新增了 `hello` 插件，包名为 `@my-nocobase-app/plugin-hello`。

PLUGIN_PACKAGE_PREFIX 配置如下：

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase/preset-,@my-nocobase-app/plugin-
```

插件名和包名的对应关系为：

- `users` 插件包名为 `@nocobase/plugin-users`
- `nocobase` 插件包名为 `@nocobase/preset-nocobase`
- `hello` 插件包名为 `@my-nocobase-app/plugin-hello`

### 插件的生命周期

v0.8 提供了更完整的插件生命周期方法

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  afterAdd() {
    // 插件通过 pm.add 添加之后
  }

  beforeLoad() {
    // 所有插件执行 load 之前，一般用于注册类和事件监听
  }

  async load() {
    // 加载配置
  }

  async install(options?: InstallOptions) {
    // 安装逻辑
  }

  async afterEnable() {
    // 激活之后
  }

  async afterDisable() {
    // 禁用之后
  }

  async remove() {
    // 删除逻辑
  }
}

export default HelloPlugin;
```

### 插件的前后端入口

插件的生命周期由服务端控制

```ts
import { Application } from '@nocobase/server';

const app = new Application({
  // ...
});

class MyPlugin extends Plugin {
  afterAdd() {}
  beforeLoad() {}
  load() {}
  install() {}
  afterEnable() {}
  afterDisable() {}
  remove() {}
}

app.plugin(MyPlugin, { name: 'my-plugin' });
```

插件的客户端以 Context.Provider 形式存在（类似于服务端的 Middleware）

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

app.use(HelloProvider);
```

## 自定义的业务代码

v0.7 的插件并不完整，自定义的业务代码可能分散在 `packages/app/client` 和 `packages/app/server` 里，不利于升级、维护。v0.8 推荐以插件包的形式整理，并使用 `yarn pm` 来管理插件。

## 提供了更完整的文档

- **欢迎**：快速了解 NocoBase
- **用户使用手册**：进一步了解 NocoBase 平台提供的核心功能
- **插件开发教程**：进阶深入插件开发
- **API 参考**：插件开发过程中，查阅各 API 用法
- **客户端组件库**（正在准备中）：提供 NocoBase 各组件的示例和用法

备注：文档还有很多细节待补充，也会根据大家进一步反馈，继续调整。

## 提供了更多插件示例

- [command](https://github.com/nocobase/nocobase/tree/develop/packages/samples/command "command")
- [custom-block](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-block "custom-block")
- [custom-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-page "custom-page")
- [custom-signup-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-signup-page "custom-signup-page")
- [hello](https://github.com/nocobase/nocobase/tree/develop/packages/samples/hello "hello")
- [ratelimit](https://github.com/nocobase/nocobase/tree/develop/packages/samples/ratelimit "ratelimit")
- [shop-actions](https://github.com/nocobase/nocobase/tree/develop/packages/samples/shop-actions "shop-actions")
- [shop-events](https://github.com/nocobase/nocobase/tree/develop/packages/samples/shop-events "shop-events")
- [shop-i18n](https://github.com/nocobase/nocobase/tree/develop/packages/samples/shop-i18n "shop-i18n")
- [shop-modeling](https://github.com/nocobase/nocobase/tree/develop/packages/samples/shop-modeling "shop-modeling")

## 其他新特性和功能

- 导入
- 批量更新 & 编辑
- 图形化数据表配置
- 工作流支持查看执行历史
- JSON 字段
