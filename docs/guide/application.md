---
title: 应用 - Application
nav:
  title: 教程
---

# 进阶教程

NocoBase 的 Application 的继承关系

```ts
class Application extends Koa {

}

class Koa extends EventEmitter {

}
```

Koa 和 EventEmitter 详细 API 可以查阅相关文档，就不多说了。这里主要列一些重点：

实例属性：

- app.db：数据库实例，每个 app 都有自己的 db，完全隔离。
- app.resources，数据资源实例，为数据提供 API 操作
- app.cli，commander 实例，提供命令行操作
- app.context，上下文
- app.plugins 插件

实例方法：

- app.constructor()
- app.collection()
- app.resource()
- app.command()
- app.plugin()
- app.load()
- app.start()
- app.use() 添加中间件的方法，由 Koa 提供
- app.on() 添加事件监听，由 EventEmitter 提供
- app.emit() 触发事件，由 EventEmitter 提供
- app.emitSync() 触发异步事件
