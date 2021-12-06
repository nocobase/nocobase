
# 更新日志

## v0.5 - 2021/5 ~ 2021/9

重新设计 client，实现所见即所得的无代码配置界面；重构部分核心插件；提供 server API。

重构：

- @nocobase/client
- @nocobase/database
- @nocobase/plugin-collections
- @nocobase/plugin-permissions

更新：

- @nocobase/server
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs

新增：

- @nocobase/plugin-ui-schemas
- @nocobase/plugin-ui-router
- @nocobase/plugin-client
- @nocobase/plugin-notifications
- @nocobase/plugin-system-settings
- @nocobase/plugin-multi-apps
- create-nocobase-app

废弃：

- @nocobase/plugin-pages

## v0.4 - 2021/3 ~ 2021/4

实现表单形式的无代码配置方案。

重构：

- @nocobase/plugin-collections
- @nocobase/plugin-pages

更新：

- @nocobase/client
- @nocobase/plugin-permissions
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs
- @nocobase/plugin-automations

新增：

- @nocobase/plugin-china-region
- @nocobase/plugin-export

## v0.3 - 2020/10 ~ 2021/1

将 app 和 api 进行拆分，提炼了 server 和 client 内核，并实现了核心的一些插件。

更新：

- @nocobase/database
- @nocobase/actions

新增：

- @nocobase/server
- @nocobase/client
- @nocobase/plugin-collections
- @nocobase/plugin-pages
- @nocobase/plugin-permissions
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs
- @nocobase/plugin-automations

废弃：

- @nocobase/app
- @nocobase/api

## v0.2 - 2020/7 ~ 2020/9

使用 sequelize 重构 database，将 router 拆分为 resourcer 和 actions，并初步构建了无代码平台的 app 和 api。

重构：

- @nocobase/database

新增：

- @nocobase/resourcer
- @nocobase/actions
- @nocobase/app
- @nocobase/api

废弃：

- @nocobase/router

## v0.1 - 2020/6

基于 Bookshelf 和 Koa 构建了第一版配置化的 database 和 router。

新增：

- @nocobase/database
- @nocobase/router
