# v0.12：更新说明

## 新特性

- 生产环境下，插件加载从本地直接引入改为服务端动态加载，为下个版本会支持插件的在线安装和更新做准备

## 升级操作

```bash
yarn clean
yarn build
```

## 不兼容的变化

### 插件 package.json devDependencies 和 dependencies

因为插件热更新的加载方式要求 package.json 做出如下变更：

- `dependencies` 会被打包到产物中，`devDependencies` 不会
- 如果源码中使用了某个 npm 包，则必须将其添加到 `dependencies` 或者 `devDependencies` 中，否则打包时会报错并提示
- 有一些包是由 `@nocobase/server` 或者 `@nocobase/client` 提供，不必添加到 `dependencies`，而应该添加到 `devDependencies` 中，否则会报错并提示，详细参见：[插件依赖管理](/development/deps)

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

### 插件引入 NPM 包必须使用 ES Module 方式

```diff
- const dayjs = require('dayjs');
+ import dayjs from 'dayjs';
```

```diff
- export const namespace = require('../../package.json').name

+ // @ts-ignore
+ import { name } from '../../package.json'
+ export const namespace = name
```

如果你想动态的引入相对路径的文件，依然可以使用 `require`，例如：

```js
const lang = require(`./locales/${locale}.json`); // ok
```

