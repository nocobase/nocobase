# v0.12：全新的插件构建工具

## 新特性

- 全新的插件构建工具。构建好的插件将可以直接在生产环境上使用，无需二次构建。

## 应用升级

### Docker 安装的升级

无变化，升级参考 [Docker 镜像升级指南](/welcome/getting-started/upgrading/docker-compose)

### 源码安装的升级

插件构建工具已全新升级，在拉取新源码之后，需要清除缓存。

```bash
git pull # 拉取新源码
yarn clean # 清除缓存
```

更多详情参考 [Git 源码升级指南](/welcome/getting-started/upgrading/git-clone)

### create-nocobase-app 安装的升级

通过 `yarn create` 重新下载新版本，再更新 .env 配置，更多详情参考 [大版本升级指南](/welcome/getting-started/upgrading/create-nocobase-app#大版本升级)

<Alert>
create-nocobase-app 安装的应用不再有 packages/app 目录了，在 packages/app 里自定义的代码，需要移至自定义插件中。
</Alert>

## 第三方插件升级指南

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

### 插件的多语言放置 `src/locale` 目录

无论前后端，多语言翻译文件都统一放在 `src/locale` 目录，插件无需自己加载多语言包。

### 插件依赖的调整

将所有的依赖都改到 devDependencies 里

```diff
{
  "dependencies": {
-   "@nocobase/server": "*",
-   "dayjs": "^4.17.21"
  }
  "devDependencies": {
+   "@nocobase/server": "*",
+   "dayjs": "^4.17.21"
  }
}
```

### 插件的构建产物从 `lib` 目录变更为 `dist` 目录

package.json 的 main 参数调整

```diff
{
  - "main": "./lib/server/index.js",
  + "main": "./dist/server/index.js",
}
```

client.d.ts

```ts
export * from './dist/client';
export { default } from './dist/client';
```

client.js

```js
module.exports = require('./dist/client/index.js');
```

server.d.ts

```ts
export * from './dist/server';
export { default } from './dist/server';
```

server.js

```js
module.exports = require('./dist/server/index.js');
```
