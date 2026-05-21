---
title: "构建与打包"
description: "NocoBase 插件构建打包：yarn build、yarn nocobase tar、build.config.ts 自定义配置、Rsbuild 客户端打包、tsup 服务端打包。"
keywords: "插件构建,插件打包,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# 构建与打包

插件开发完成后，需要经过构建（编译源码）和打包（生成 `.tar.gz`）两个步骤，才能分发到其他 NocoBase 应用中使用。

## 构建插件

构建会把 `src/` 下的 TypeScript 源码编译为 JavaScript——客户端代码由 Rsbuild 打包，服务端代码由 tsup 打包：

```bash
yarn build @my-project/plugin-hello
```

构建产物会输出到插件根目录的 `dist/` 下。

:::tip 提示

如果插件是在源码仓库中创建的，首次构建会触发整仓库的类型检查，耗时可能较长。建议确保依赖已安装，并保持仓库处于可构建状态。

:::

## 打包插件

打包会把构建产物压缩成一个 `.tar.gz` 文件，方便上传到其他环境：

```bash
yarn nocobase tar @my-project/plugin-hello
```

打包文件默认输出到 `storage/tar/@my-project/plugin-hello.tar.gz`。

你也可以用 `--tar` 参数把构建和打包合成一步：

```bash
yarn build @my-project/plugin-hello --tar
```

## 上传到其他 NocoBase 应用

把 `.tar.gz` 文件上传并解压到目标应用的 `./storage/plugins` 目录即可。详细步骤见 [安装与升级插件](../get-started/install-upgrade-plugins.mdx)。

## 自定义构建配置

通常来说默认的构建配置就够用了。如果你需要自定义——比如修改打包入口、添加别名、调整压缩选项等——可以在插件根目录下创建 `build.config.ts` 文件：

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // 修改客户端（src/client-v2）的 Rsbuild 打包配置
    // 参考：https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // 修改服务端（src/server）的 tsup 打包配置
    // 参考：https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // 构建开始前的回调，比如清理临时文件、生成代码等
  },
  afterBuild: (log) => {
    // 构建完成后的回调，比如拷贝额外资源、输出统计信息等
  },
});
```

几个关键点：

- `modifyRsbuildConfig` — 用来调整客户端打包，比如添加 Rsbuild 插件、修改 resolve 别名、调整代码分割策略等。配置项参考 [Rsbuild 文档](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — 用来调整服务端打包，比如修改 target、externals、entry 等。配置项参考 [tsup 文档](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — 构建前后的钩子，接收一个 `log` 函数用于输出日志。比如在 `beforeBuild` 里生成一些代码文件，在 `afterBuild` 里拷贝静态资源到产物目录

## 相关链接

- [编写第一个插件](./write-your-first-plugin.md) — 从零创建插件，包含完整的构建打包流程
- [项目目录结构](./project-structure.md) — 了解 `packages/plugins`、`storage/tar` 等目录的作用
- [依赖管理](./dependency-management.md) — 插件的依赖声明与全局依赖
- [插件开发概述](./index.md) — 插件开发整体介绍
- [安装与升级插件](../get-started/install-upgrade-plugins.mdx) — 把打包文件上传到目标环境
