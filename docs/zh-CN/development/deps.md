# 依赖管理

插件的依赖构建采用约定式的方式，即 `package.json` 中 `devDependencies` 中的依赖*不会*被打包到插件中，`dependencies` 中的依赖*会*被打包到应用中。

其中有一些依赖由 `@nocobase/server` 和 `@nocobase/client` 提供，不需要打包到插件产物中，因此不应该放到 `dependencies`，而应该放到 `devDependencies` 中。具体如下：

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

## 必须使用 ES Module 方式

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

