# 介绍

NocoBase 采用微内核架构，各类功能以插件形式扩展。前后端分离，提供了各种插件化接口。插件按功能模块划分，具有可插拔的特点。

<img src="https://www.nocobase.com/images/NocoBaseMindMapLite.png" style="max-width: 800px;" >

插件化的设计降低了模块之间的耦合度，提高了复用率。随着插件库的不断扩充，常见的场景只需要组合插件即可完成基础搭建。例如 NocoBase 的无代码平台，就是由各种插件组合起来。

<img src="./index/pm-built-in.jpg" style="max-width: 800px;" />

## 插件管理器

NocoBase 提供了强大的插件管理器用于管理插件，插件管理器的流程如下：

<img src="./index/pm-flow.svg" style="max-width: 580px;" />

无代码用户可以通过界面管理本地插件的激活和禁用：

<img src="./index/pm-ui.jpg" style="max-width: 800px;" />

开发者也可以通过 CLI 的方式管理完整的插件流程：

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

更多插件示例，查看 [packages/samples](https://github.com/nocobase/nocobase/tree/main/packages/samples)。

## 扩展能力

无论是通用性的功能，还是个性化定制，都建议以插件的形式编写，NocoBase 的扩展性体现在方方面面：

- 可以是用户直观可见的界面相关的页面模块、区块类型、操作类型、字段类型等
- 也可以是用于增强或限制 HTTP API 的过滤器、校验器、访问限制等
- 也可以是更底层的数据表、迁移、事件、命令行等功能的增强


各模块分布：

- Server
  - Collections & Fields：主要用于系统表配置，业务表建议在「配置中心 - 数据表配置」里配置
  - Resources & Actions：主要用于扩展 Action API
  - Middleware：中间件
  - Events：事件
  - I18n：服务端国际化
  - Commands：自定义命令行
  - Migrations：迁移脚本
- Client
  - UI Schema Designer：页面设计器
  - UI Router：有自定义页面需求时
  - Plugin Settings Manager：为插件提供配置页面
  - I18n：客户端国际化

