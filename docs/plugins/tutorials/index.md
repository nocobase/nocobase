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

NocoBase 核心提供了丰富的 API 用于处理扩展，但是直接调用底层 API 成本较高。因此，又提供了更为灵活、便捷的插件化管理方式，用户只需要将代码放在约定的几个目录里即可。

<Alert title="重要提示" type="warning">
NocoBase 插件之间是平行的，不存在直接的依赖关系，不过插件在加载时可能有优先级。
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

<Alert title="注意" type="warning">

目前 v0.4 版本的插件还十分简陋，只提供了一个非常原生态的函数扩展，其他的都需要开发者根据情况调用核心 API 来完成各类功能扩展，并未提供约定式目录，也没有完整的生命周期机制。没有安装/卸载、激活/禁用，加载即激活。

</Alert>

## PluginManager

插件的几个状态

- 下载
- 启动
- 停止
- 重启
- 删除

### API

- `pluginManager.pull()`
- `pluginManager.start()`
- `pluginManager.stop()`
- `pluginManager.restart()`
- `pluginManager.remove()`

### CLI

- `yarn nocobase pull <name>`
- `yarn nocobase start <name>`
- `yarn nocobase stop <name>`
- `yarn nocobase restart <name>`
- `yarn nocobase remove <name>`
