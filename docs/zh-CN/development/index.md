# 介绍

NocoBase 采用微内核架构，各类功能以插件形式扩展，所以微内核架构也叫插件化架构，由内核和插件两部分组成。内核提供了最小功能的 WEB 服务器，还提供了各种插件化接口；插件是按功能划分的各种独立模块，通过接口适配，具有可插拔的特点。插件化的设计降低了模块之间的耦合度，提高了复用率。随着插件库的不断扩充，常见的场景只需要组合插件即可完成基础搭建。例如 NocoBase 的无代码平台，就是由各种插件组合起来。

<img src="./guide/pm-built-in.jpg"/>

## 插件管理器

NocoBase 提供了强大的插件管理器用于管理插件，插件管理器的流程如下：

<img src="./pm-flow.svg"/>

开发可以通过 CLI 的方式管理插件：

```bash
# 创建插件
yarn pm create hello
# 注册插件
yarn pm add hello
# 激活插件
yarn pm enable hello
# 禁用插件
yarn pm disable hello
# 删除插件
yarn pm remove hello
```

无代码用户也可以通过插件管理器界面激活、禁用、删除已添加的本地插件：

<img src="./pm-ui.jpg"/>

更多插件示例，查看 [packages/samples](https://github.com/nocobase/nocobase/tree/main/packages/samples)。

## 扩展能力

无论是通用性的功能，还是个性化定制，都建议以插件的形式编写，NocoBase 的扩展性体现在方方面面：

- 可以是用户直观可见的界面相关的页面模块、区块类型、操作类型、字段类型等
- 也可以是用于增强或限制 HTTP API 的过滤器、校验器、访问限制等
- 也可以是更底层的数据表、迁移、事件、命令行等功能的增强

不仅如此，更多扩展介绍请查看 [扩展指南 - 概述](/development/guide) 章节。