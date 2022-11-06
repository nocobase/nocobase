# 生命周期

## 应用的生命周期

<img src="./index/app-flow.svg" style="max-width: 380px;" />

## 插件的生命周期

<img src="./index/pm-flow.svg" style="max-width: 600px;"  />

## 插件的生命周期方法

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class MyPlugin extends Plugin {
  afterAdd() {
    // 插件 pm.add 注册进来之后。主要用于放置 app.beforeLoad 的事件。
  }
  beforeLoad() {
    // 所有插件执行 load 之前。一般用于注册类和事件监听
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

export default MyPlugin;
```
