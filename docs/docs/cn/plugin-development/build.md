---
title: "插件构建配置"
description: "NocoBase 插件构建：build.config.ts、Rsbuild 客户端打包、tsup 服务端打包、modifyRsbuildConfig、beforeBuild 钩子。"
keywords: "插件构建,build.config.ts,Rsbuild,tsup,打包配置,@nocobase/build,NocoBase"
---

# 构建

## 自定义打包配置

如果你想要自定义打包配置，可以在插件根目录下创建 `build.config.ts` 文件，内容如下：

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Rsbuild 是用来打包 `src/client` 端代码的

    // 修改 Rsbuild 配置，具体可参考：https://rsbuild.rs/guide/configuration/rsbuild
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
