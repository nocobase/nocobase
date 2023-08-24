# api-doc

[English](./README.md) | 中文

## 简介

该插件基于 `swagger` 编写文档。

## 如何访问文档

1. 在插件中心访问地址是 `{domain}/admin/settings/api-doc/documentation`
2. 在插件中心外访问地址是 `{domain}/api-documentation`

## 如何编写 swagger 文档

> 插件内方式一样

1. `src/swagger.{ts,json}`
2. `src/swagger/index.{ts,json}`

上面的文件路径均可遍写文档，只需最后将您编写的文档默认导出即可，例子如下：

```ts
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {}
  }
};
```

通常你只需要编写 **info.title**, **tags**, **paths**, **components** 即可其他内容如 **server**, **info** 的其他信息都合并我们的 **base-swagger**.

base swagger 包含如下代码
```ts
// base swagger
export default {
  openapi: '3.0.3',
  info: {
    title: 'NocoBase API documentation',
    description: '',
    contact: {
      url: 'https://github.com/nocobase/nocobase/issues',
    },
    license: {
      name: 'Core packages are Apache 2.0 & Plugins packages are AGPL 3.0 licensed.',
      url: 'https://github.com/nocobase/nocobase#license',
    },
  },
  externalDocs: {
    description: 'Find out more about NocoBase',
    url: 'https://docs.nocobase.com/',
  },
  components: {
    securitySchemes: {
      'api-key': {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  security: [
    {
      'api-key': [],
    },
  ],
};

```

> 注意：涉及到运行时才能获取的配置，并没有填写在 base-swagger 里，如 server, version 字段

这些默认的配置你同样也可以覆盖它，在你编写插件的 `swagger` 文档时，你需要视你的插件文档是独立的文档，可以被单独访问。

详细的 `swagger` 编写规则请参考[官方文档](https://swagger.io/docs/specification/about/)
