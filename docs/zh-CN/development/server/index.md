# 概述

初始化的空插件，服务端相关目录结构如下：

```bash
|- /my-plugin
  |- /src
    |- /server      # 插件服务端代码
      |- plugin.ts  # 插件类
      |- index.ts   # 服务端入口
  |- server.d.ts
  |- server.js
```

`plugin.ts` 提供了插件生命周期的各种方法的调用

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class MyPlugin extends Plugin {
  afterAdd() {
    // 插件 pm.add 注册进来之后。主要用于放置 app beforeLoad 事件的监听
    this.app.on('beforeLoad');
  }
  beforeLoad() {
    // 自定义类或方法
    this.db.registerFieldTypes()
    this.db.registerModels()
    this.db.registerRepositories()
    this.db.registerOperators()
    // 事件监听
    this.app.on();
    this.db.on();
  }
  async load() {
    // 定义 collection
    this.db.collection();
    // 导入 collection
    this.db.import();
    this.db.addMigrations();

    // 定义 resource
    this.resourcer.define();
    // resource action
    this.resourcer.registerActions();

    // 注册 middleware
    this.resourcer.use();
    this.acl.use();
    this.app.use();

    // 自定义多语言包
    this.app.i18n.addResources();
    // 自定义命令行
    this.app.command();
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
