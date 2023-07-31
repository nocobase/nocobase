# v0.12：更新说明

## 新特性

- 生产环境下，插件加载从本地直接引入改为服务端动态加载，为下个版本会支持插件的在线安装和更新做准备

## 升级操作

```bash
yarn clean
yarn install
yarn build
```

## 不兼容的变化

### 插件依赖打包

插件的依赖分为自身的依赖和全局依赖，全局依赖由 `@nocobase/server` 和 `@nocobase/client` 提供，不会打包到插件产物中，自身的依赖会被打包到产物中。

因为自身的依赖会被打包到产物中（包括 server 依赖的 npm 包，也会被打包到 `dist/node_modules`），所以在开发插件时，将所有依赖放到 `devDependencies` 中即可。

```diff
{
  "dependencies": {
-   "@nocobase/server": "^0.11.0",
-   "dayjs": "^4.17.21"
  }
  "devDependencies": {
+   "@nocobase/server": "^0.11.0",
+   "dayjs": "^4.17.21"
  }
}
```

更新信息和全局插件列表，参见：[插件依赖管理](/development/deps)。

### 升级 formily 版本从 2.2.6 到 2.2.7

所有的 `@formily/xx` 都从 `2.2.6` 升级到 `2.2.7`，请更新依赖。例如：

```diff
{
  "dependencies": {
-   "@formily/antd": "2.2.26",
+   "@formily/antd": "2.2.27",
  }
}
```

### 插件目录必须同时有 `src/client` 和 `src/server` 目录

```js
// src/client/index.ts
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    // ...
  }
}

export default MyPlugin;
```

```js
// src/server/index.ts
import { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {
  async load() {
    // ...
  }
}

export default MyPlugin;
```

具体 Demo 代码可以参考：[sample-hello](https://github.com/nocobase/nocobase/tree/main/packages/samples/hello)

### 插件产物目录变化

插件的构建产物从 `lib` 目录变更为 `dist` 目录，所以你需要：

```diff
{
  - "main": "./lib/server/index.js",
  + "main": "./dist/server/index.js",
}
```


## 其他

本地以远程的方式加载插件需要设置环境为 `USE_REMOTE_PLUGIN=true`：

```bash
yarn cross-env USE_REMOTE_PLUGIN=true nocobase dev
```
