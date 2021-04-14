---
title: 了解插件
order: 1
nav:
  title: 插件
  order: 3
  path: /plugins
group: 
  order: 1
  title: 教程
---

# 了解插件

NocoBase 核心提供了丰富的 API 用于处理扩展，如：

```ts
import Server from '@nocobase/server';

const server = new Server({
  // 此处配置省略
});

// 直接调用 database.table 接口配置数据表，在生命周期里属于 加载配置 环节
const table = server.database.table({
  name: 'examples',
  fields: [],
});

// 与数据库表结构同步，可能需要单独一个进程处理这个命令，在生命周期里属于 数据库操作 table.sync 仅在字段结构有变动时执行
await table.sync();

table.addField({
  type: 'string',
  name: 'col2',
});

await table.sync();
```

<Alert title="重要提示" type="warning">
NocoBase 插件之间是平行的，不存在直接的依赖关系。
</Alert>

插件提供一种代码的模块化管理方式，用户只需要将代码放在约定的几个目录里即可。

<Alert title="注意" type="warning">

目前 v0.4 版本的插件还十分简陋，只提供了一个非常原生态的函数扩展，其他的都需要开发者根据情况调用核心 API 来完成各类功能扩展，并未提供约定式目录，也没有完整的生命周期机制。没有安装/卸载、激活/禁用，加载即激活。

</Alert>

## 目录结构

```bash
|- @nocobase/plugin-[name] 或 nocobase-plugin-[name]
  |- src
    |- actions
    |- collections
    |- fields
    |- hooks
    |- interfaces
    |- middlewares
    |- models
    |- resources
    |- blocks
```

## 安装插件

借鉴 [WP-CLI](https://github.com/wp-cli/wp-cli) 的设计灵感，NocoBase 的插件管理也类似。

安装并激活

```bash
yarn nocobase install [name] --activate
```

<Alert title="注意" type="warning">
安装插件，插件只在本地列表里，只有激活的插件才能使用。
</Alert>

等同于

```bash
yarn add @nocobase/plugin-[name]
or 
yarn add nocobase-plugin-[name]
# 激活
yarn nocobase activate [name]
```

更多 CLI 和用法，会陆续提供。

