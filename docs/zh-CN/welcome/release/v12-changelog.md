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

## 不兼容的变化

### @nocobase/app-client 和 @nocobase/app-server 合并为 @nocobase-app

通过 create-nocobase-app 安装的应用不再有 packages/app 目录了，在 packages/app 里自定义的代码，需要移至自定义插件中。

### app 的 dist/client 路径变更

如果是自己配置的 nginx，需要做类似调整

```diff
server {
- root /app/nocobase/packages/app/client/dist;
+ root /app/nocobase/node_modules/@nocobase/app/dist/client;

  location / {
-       root /app/nocobase/packages/app/client/dist;
+       root /app/nocobase/node_modules/@nocobase/app/dist/client;
        try_files $uri $uri/ /index.html;
        add_header Last-Modified $date_gmt;
        add_header Cache-Control 'no-store, no-cache';
        if_modified_since off;
        expires off;
        etag off;
    }
}
```

### 第三方插件需要重新构建

参考下文的第三方插件升级指南

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

插件的依赖分为自身的依赖和全局依赖，全局依赖直接使用全局，不会打包到插件产物中，自身的依赖会被打包到产物中。插件构建之后，生产环境即插即用，无需再安装依赖或二次构建。插件依赖的调整包括：

- 将 `@nocobase/*` 相关包放到 `peerDependencies` 里，并指定版本号为 `0.x`；
- 其他依赖放到 `devDependencies` 里，不要放 `dependencies` 里，因为插件打包之后会将生产环境所需依赖全部提取了。

```diff
{
  "devDependencies": {
    "@formily/react": "2.x",
    "@formily/shared": "2.x",
    "ahooks": "3.x",
    "antd": "5.x",
    "dayjs": "1.x",
    "i18next": "22.x",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "11.x"
  },
  "peerDependencies": {
    "@nocobase/actions": "0.x",
    "@nocobase/client": "0.x",
    "@nocobase/database": "0.x",
    "@nocobase/resourcer": "0.x",
    "@nocobase/server": "0.x",
    "@nocobase/test": "0.x",
    "@nocobase/utils": "0.x"
  }
}
```

### 插件的构建产物从 `lib` 目录变更为 `dist` 目录

dist 目录介绍

```bash
|- dist
  |- client       # 前端，umd 规范
    |- index.js
    |- index.d.ts
  |- server       # 后端，cjs 规范
    |- index.js
    |- index.d.ts
    |- 其他文件
  |- locale       # 多语言目录
  |- node_modules # 后端依赖
```

其他相关调整包括：

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
