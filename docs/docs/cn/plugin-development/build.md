# 构建

## 自定义打包配置

如果你想要自定义打包配置，可以在插件根目录下创建 `build.config.ts` 文件，内容如下：

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
