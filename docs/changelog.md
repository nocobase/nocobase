
# Changelog

## v0.5 - 2021/5 ~ 2021/9

Redesign client to achieve WYSIWYG configuration interface without code; refactor some core plugins; provide server API.

Changed：

- @nocobase/client
- @nocobase/database
- @nocobase/plugin-collections
- @nocobase/plugin-permissions
- @nocobase/server
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs

Added：

- @nocobase/plugin-ui-schemas
- @nocobase/plugin-ui-router
- @nocobase/plugin-client
- @nocobase/plugin-notifications
- @nocobase/plugin-system-settings
- @nocobase/plugin-multi-apps
- create-nocobase-app

Deprecated：

- @nocobase/plugin-pages

## v0.4 - 2021/3 ~ 2021/4

Provide no-code configuration UI.

Changed：

- @nocobase/plugin-collections
- @nocobase/plugin-pages
- @nocobase/client
- @nocobase/plugin-permissions
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs
- @nocobase/plugin-automations

Added：

- @nocobase/plugin-china-region
- @nocobase/plugin-export

## v0.3 - 2020/10 ~ 2021/1

Split the app and api, refined the server and client kernels, and implemented some core plugins.

Changes：

- @nocobase/database
- @nocobase/actions

Added：

- @nocobase/server
- @nocobase/client
- @nocobase/plugin-collections
- @nocobase/plugin-pages
- @nocobase/plugin-permissions
- @nocobase/plugin-users
- @nocobase/plugin-file-manager
- @nocobase/plugin-action-logs
- @nocobase/plugin-automations

Deprecated：

- @nocobase/app
- @nocobase/api

## v0.2 - 2020/7 ~ 2020/9

Refactored database using sequelize. Split router into resourcer and actions.Initially built app and api for no-code platform.

Changed：

- @nocobase/database

Added：

- @nocobase/resourcer
- @nocobase/actions
- @nocobase/app
- @nocobase/api

Deprecated：

- @nocobase/router

## v0.1 - 2020/6

Built the first version of configured database and router based on Bookshelf and Koa.

Added：

- @nocobase/database
- @nocobase/router
