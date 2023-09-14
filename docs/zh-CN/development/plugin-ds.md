# 插件目录结构

可以通过 `yarn pm create my-plugin` 快速创建一个空插件，目录结构如下：

```bash
|- /my-plugin
  |- /src
    |- /client      # 插件客户端代码
    |- /server      # 插件服务端代码
  |- client.d.ts
  |- client.js
  |- package.json   # 插件包信息
  |- server.d.ts
  |- server.js
  |- build.config.ts # 或者 `build.config.js` ，用于修改打包配置，实现自定义逻辑
```

`/src/server` 的教程参考 [服务端](./server) 章节，`/src/client` 的教程参考 [客户端](./client) 章节。

如果你想要自定义打包配置，可以在根目录下创建 `config.js` 文件，内容如下：

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite 是用来打包 `src/client` 端代码的

    // 修改 Vite 配置，具体可参考：https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup 是用来打包 `src/server` 端代码的

    // 修改 tsup 配置，具体可参考：https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // 构建开始前的回调函数，可以在构建开始前做一些操作
  },
  afterBuild: (log: PkgLog) => {
    // 构建完成后的回调函数，可以在构建完成后做一些操作
  };
});
```
