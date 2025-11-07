# API 文档

<PluginInfo name="api-doc"></PluginInfo>

## 介绍

基于 Swagger 生成 NocoBase HTTP API 文档。  

## 安装

内置插件，无需安装。激活即可使用。

## 使用说明

### 访问 API 文档页面

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### 文档概览

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- 总 API 文档：`/api/swagger:get`
- 内核 API 文档：`/api/swagger:get?ns=core`
- 所有插件 API 文档：`/api/swagger:get?ns=plugins`
- 每个插件的文档：`/api/swagger:get?ns=plugins/{name}`
- 用户自定义 collections 的 API 文档：`/api/swagger:get?ns=collections`
- 指定 `${collection}` 及相关 `${collection}.${association}` 资源：`/api/swagger:get?ns=collections/{name}`

## 开发指南

### 如何为插件编写 swagger 文档

在插件 `src` 文件夹里添加 `swagger/index.ts` 文件，内容如下：

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

详细编写规则请参考 [Swagger 官方文档](https://swagger.io/docs/specification/about/)