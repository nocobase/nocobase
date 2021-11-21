
# 更新日志

## v0.5 - 2021/5 ~ 2021/9

v0.4 重构的界面配置，实际体验并不理想，所以又改了，进而整个客户端都重新设计了。基于 Formily v2 内核重写了客户端，实现页面级的所见即所得配置，并实现了 NocoBase 需要的近 30 个基础组件。为了配合新版配置，server 也重构了，提炼了第一版公开的 server API。

- create-nocobase-app
- @nocobase/database
- @nocobase/client
- @nocobase/server
- @nocobase/plugin-collections
- @nocobase/plugin-ui-schemas
- @nocobase/plugin-ui-router
- @nocobase/plugin-client
- @nocobase/plugin-multi-apps
- @nocobase/plugin-notifications

## v0.4 - 2021/3 ~ 2021/4

重构了界面配置方案，实现了页面向导的配置方式，但依旧是传统表单形式，并不是所见即所得。

- @nocobase/client
- @nocobase/plugin-collections
- @nocobase/plugin-pages
- @nocobase/plugin-china-region

## v0.3 - 2020/10 ~ 2021/1

将 app 和 api 进行拆分，提炼了 server 和 client 内核，并实现了核心的一些插件。

- @nocobase/server
- @nocobase/client
- @nocobase/app
- @nocobase/api
- @nocobase/plugin-collections
- @nocobase/plugin-pages
- @nocobase/plugin-permissions
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs
- @nocobase/plugin-automations

## v0.2 - 2020/7 ~ 2020/9

使用 sequelize 重构 database，将 router 拆分为 resourcer 和 actions，并初步构建了无代码平台的 app 和 api。

- @nocobase/database
- @nocobase/resourcer
- @nocobase/actions
- @nocobase/app
- @nocobase/api

## v0.1 - 2020/6

基于 Bookshelf 和 Koa 构建了第一版无代码的 database 和 router

- @nocobase/database
- @nocobase/router
