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
```

## ES module

```diff
- const dayjs = require('dayjs');
+ import dayjs from 'dayjs';
```

```diff
- export const namespace = require('../../package.json').name

+ // @ts-ignore
+ import { name } from '../../package.json'
+ export const namespace = name
```

If you want to dynamically import a relative path file, you can still use `require`, for example:

```js
const lang = require(`./locales/${locale}.json`); // ok
```
