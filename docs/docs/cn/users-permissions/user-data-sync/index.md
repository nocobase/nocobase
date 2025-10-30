# 用户数据同步

<PluginInfo name="user-data-sync"></PluginInfo>

## 介绍

注册和管理用户数据同步来源，默认提供 HTTP API, 可以通过插件扩展其他数据来源。默认支持向**用户**和**部门**表同步数据，也可以通过插件扩展其他同步目标资源。

## 安装

内置插件，无需单独安装。

## 数据源管理和数据同步

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
在未安装提供用户数据同步来源的插件时，可以通过 HTTP API 同步用户数据。参考 [数据源 - HTTP API](./sources/api.md).
:::

## 添加数据源

安装提供用户数据同步来源的插件之后，即可添加相应的数据源。只有启用的数据源才会显示同步和任务按钮。

> 以企业微信为例

![](https://static-docs.nocobase.com/202412041053785.png)

## 同步数据

点击「同步」按钮，开始进行数据同步。

![](https://static-docs.nocobase.com/202412041055022.png)

点击「任务」按钮可以查看同步状态。同步成功后可以到用户和部门列表查看数据。

![](https://static-docs.nocobase.com/202412041202337.png)

同步失败的任务，可以点击「重试」。

![](https://static-docs.nocobase.com/202412041058337.png)

同步失败时可以通过系统日志排查原因，同时在应用日志目录下的 `user-data-sync` 目录里保存有原始的数据同步记录。

![](https://static-docs.nocobase.com/202412041205655.png)
