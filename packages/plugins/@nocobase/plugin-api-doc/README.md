# api-doc

English | [中文](./README.zh-CN.md)


## Introduction

This plugin is based on `swagger` to write documentation.

## How to access the documentation

1. The access address in the plugin center is `{domain}/admin/settings/api-doc/documentation`
2. The access address outside the plugin center is `{domain}/api-documentation`

## How to write swagger documentation

> The method in the plugin is the same

1. `src/swagger.{ts,json}`
2. `src/swagger/index.{ts,json}`

The file paths above can all be traversed to write documentation. Just export your written documentation by default. An example is shown below:

```ts
export default {
  info: {
    title: 'NocoBase API - Api-doc plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {}
  }
};
```

Usually, you only need to write **info.title**, **tags**, **paths**, and **components**. Other information such as **server** and **info** are merged into our **base-swagger**.

Base swagger includes the following code:

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

> Note that configurations that can only be obtained at runtime, such as the server and version fields, are not filled in the base-swagger.

You can also override these defaults. When writing the swagger documentation for your plugin, you should consider whether your plugin's documentation can be accessed independently.

For detailed swagger writing rules, please refer to the [official documentation](https://swagger.io/docs/specification/about/).
