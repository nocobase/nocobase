---
title: NocoBase 生命周期
order: 2
toc: menu
---

# NocoBase 生命周期 

每个 NocoBase 实例在被创建时都要经过一系列的初始化过程，在这个过程中某些节点会运行一些函数，这些节点就是生命周期的钩子，有了钩子的存在，代码不论按什么顺序书写，都会按照既定的顺序执行。NocoBase 的生命周期大概分为四个环节：

1. 初始化实例
2. 加载配置
3. 数据库操作
4. 每次请求中

## 初始化实例

- koa：nocobase 实例
- database：数据库实例
- resourcer：koa 的分支，负责 resource router
- pluginManager：插件管理器实例

现阶段的设计 sever 直接继承了 koa application，其他三个作为 server 实例的成员存在。

<Alert title="注意" type="warning">
pluginManager 的初始化存在较大缺陷，在初始化时直接加载了配置，暂时无法处理数据库操作。
</Alert>

## 加载配置

- table hooks：表配置事件
- table options：表配置
- model hooks：model 事件

系统表配置从文件目录里导入，业务表配置从数据库里导入，部分开放的系统表从文件目录导入之后，又从数据库里更新，如用户表。

<Alert title="注意" type="warning">

resourcer 配置是运行时初始化，在 koa middleware 中。hooks 分 table、model、plugin、resourcer 四类，暂时并不统一。

另外，还有个非常重要的细节，生命周期解决了大结构的执行顺序，但并未解决同一挂载点多钩子之间的执行顺序。

</Alert>

## 数据库操作

- initialize：初始化，app 启动或重启时都执行
- install：安装操作，只执行一次
- upgrade：更新操作，只执行一次
- uninstall：卸载操作，只执行一次

<Alert title="注意" type="warning">
目前还不支持，这部分的钩子主要用于管理插件。
</Alert>

## 每次请求中

- koa middleware
- resourcer middleware
- resource middleware
- action middleware
- action handler

客户端请求时，都会执行。

虽然大部分框架都提供了中间件，但是中间件的执行顺序（优先级）依赖于编码顺序，这种方式非常不利于插件化管理。因此，在 Resourcer 设计思想里，将中间件做了分层，不同层级的 middlewares 不依赖于编码顺序，而是如下顺序：

1. 首先，koa 层：`koa.use`
2. 其次，resourcer 层：`resourcer.use`
3. 再次，resource 层（每个资源独立）：`resourcer.registerActionMiddleware`
4. 然后，action 层：`resourcer.registerResourceMiddleware`
5. 最后，执行 action handler

不过，每个层次的中间件执行顺序还依赖于编码顺序，如有需要再进行更细微的改进。
