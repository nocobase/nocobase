# Dependency management

## convention-based

The dependency building for plugins follows a convention-based approach, where dependencies in `devDependencies` of the package.json file *will not be* bundled with the plugin, while the dependencies in `dependencies` *will be* bundled with the application.

## devDependencies npm package list

Some dependencies are provided by `@nocobase/server` and `@nocobase/client` and *do not need to* be bundled with the plugin output. Therefore, they should not be placed in `dependencies` but rather in `devDependencies`. Here are the specific steps:

```bash
# react
react
react-dom

# react-router
react-router
react-router-dom

# antd
antd
antd-style
@ant-design/icons
@ant-design/cssinjs

# i18next
i18next
react-i18next

# formily
@formily/antd-v5
@formily/core
@formily/react
@formily/shared
@formily/json-schema
@formily/reactive

# nocobase
@nocobase/acl
@nocobase/actions
@nocobase/auth
@nocobase/cache
@nocobase/database
@nocobase/evaluators
@nocobase/logger
@nocobase/resourcer
@nocobase/utils

# database
mysql
pg
pg-hstore
sqlite3
```

### Plugins depend on other plugins

If a plugin depends on another plugin, then the dependent plugin should also be placed in `devDependencies`. For example:

```diff
{
  "name": "@nocobase/plugin-hello",
-  "dependencies": {
-    "@nocobase/plugin-users": "^1.0.0"
-  },
+  "devDependencies": {
+    "@nocobase/plugin-users": "^1.0.0"
+  }
}
```

生产环境中，应该先将 `@nocobase/plugin-users` 安装到应用中，然后再安装 `@nocobase/plugin-hello`，激活插件顺序也应该为先激活 `@nocobase/plugin-users`，再激活 `@nocobase/plugin-hello`。


## import package.json

```diff
- export const namespace = require('../../package.json').name

+ // @ts-ignore
+ import { name } from '../../package.json'
+ export const namespace = name
```
