# 示例

## Application

- [最简单的单应用](./app/single-app.ts)
- [支持多应用（子应用）](./app/multi-app.ts)
- 配置 Resources 和 Actions
  - [最简单的 resource actions](./app/resource-actions/simple.ts)
  - [带默认参数的 Action](./app/resource-actions/action-with-default-options.ts)
  - [使用全局 Action](./app/resource-actions/global-action.ts)
  - [Action 参数的多来源合并](./app/resource-actions/action-merge-params.ts)
  - 内置 Actions 的用法
- [Collection 自动转 Resource](./app/collection2resource.ts)
- [Association 自动转 Resource](./app/association2resource.ts)
- Context
  - [ctx.db 示例](./app/context/ctx.db.ts)
  - [ctx.action 的重要参数示例](./app/context/ctx.action.ts)
  - [ctx.action.mergeParams() 示例](./app/context/ctx.action.mergeParams.ts)
  - [ctx.i18n & ctx.t() 示例](./app/context/ctx.i18n.ts)
- 中间件
  - [app.use 用法](./app/middleware/app.ts)
  - [app.resourcer.use 用法](./app/middleware/resourcer.ts)
  - [app.acl.use 用法](./app/middleware/acl.ts)
- [ACL](./app/acl.ts)
- [国际化多语言](./app/i18n.ts)
- [自定义命令行](./app/custom-command.ts)
- [编写一个最简单的插件](./app/custom-plugin.ts)
- Application Migration
  - [编写一个新的 Migration 文件](./app/migrations/add-migration.ts)
- 编写 Application 测试用例
  - [最简单的测试用例](./app/__tests__/app.test.ts)
- 客户端 SDK（APIClient）示例
  - [客户端常规请求 —— api.request()](./api-client/api.request.ts)
  - [客户端资源请求 —— api.resource().action()](./api-client/api.resource.ts)

## Database

- 配置 Collections & Fields
- 通过 Repository 增删改查数据
- 通过 Model 增删改查数据
- 关系数据的增删改查
- 关系数据的关联操作
- 扩展字段
- 数据库事件
- 数据库迁移

## Client
