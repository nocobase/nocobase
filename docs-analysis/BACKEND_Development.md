# 后端开发指南（BACKEND_Development）

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean
- 子模块状态：无
- 分析范围：`@nocobase/server`、`database`、`resourcer`、`actions`、`acl`、`auth`、`data-source-manager`、CLI、代表性插件
- 未覆盖范围：pro 后端插件、`cli`(v2) 内部命令实现细节

## 证据分类

- Evidence：源码类/方法行号、中间件注册。
- Inference：典型 handler 调用链由中间件顺序推导。
- Unknown：生产部署的 DB/Redis 实际选型。

## 核心结论

后端是“**Application（Koa）+ DataSource（Sequelize+Resourcer+ACL）+ Plugin**”模型。开发一个后端能力 = 写一个 `Plugin`，在 `load()` 中：定义 collection（`this.db.collection()`）、注册 resource/action（`this.app.resourcer.define()` 或直接用内置 action）、挂事件监听（`this.app.on`/`this.db.on`）、加命令（`this.app.command()`）、加中间件、注册 ACL。

---

## 1. 后端入口与初始化

- 入口：`Application`（`packages/core/server/src/application.ts:222`），由 `cli-v1` 的 `start`/`dev`/`upgrade` 命令与 `gateway` 创建。
- 初始化：`init()`（:1244）创建 DB、DataSourceManager、PluginManager、ACL、AuthManager、AuditManager、Cache、Telemetry、AI、PubSub、Lock、EventQueue、Cron、i18n，注册中间件（`registerMiddlewares` `helper.ts:69`）与内置 action（`registerActions`）。
- 数据库初始化：`createDatabase`（:1383）`new Database({...})`，Sequelize 在其内部；`db.setMaxListeners(100)`（:1416）。

## 2. 中间件链（请求管线）

`registerMiddlewares`（`helper.ts:69-124`）按 Toposort 注册：

```
generateReqId (helper.ts:70)
→ audit (AuditManager.middleware, :78, after generateReqId)
→ requestLogger (:80)
→ bodyParser (:94, after logger)
→ cors (:82, after bodyParser)
→ i18n (:118, before cors)
→ dataWrapping (:121, after cors)
→ dataSourceManager.middleware (:124, after dataWrapping)  ← 进入资源/action
→ extractClientIp (:126, before cors)
```

进入 DataSource 后（`application.ts:1319-1340`）每个数据源再串：

```
validateFilterParams (before auth)
→ AuthManager.middleware (tag:'auth', before default)
→ parseVariables (after acl)
→ dataTemplate (after acl)
→ ACL（由 resourcer 内置集成）
→ action handler
```

## 3. 路由 / 资源 / 动作

- 资源 = collection（默认）或自定义。URL 形如 `/api/<resource>:<action>` 或 `/api/<resource>/<id>`。
- `ResourceManager.define({name, actions})`（`resourcer.ts:212`）。
- `ResourceManager.middleware()`（:330）解析 URL → `execute()`（:425）选 action handler。
- 内置 action：`actions/src/index.ts:36-52`。

### 典型 handler（list）

```
入口: actions/src/actions/list.ts listWithPagination
参数: ctx.action.params {filter, fields, sort, page, pageSize, appends, except, tree}
验证: validate-filter-params 中间件
返回值: ctx.body = {rows, count, page, pageSize, totalPage} 或 simplePaginate {hasNext}
调用服务: getRepositoryFromParams(ctx).find/findAndCount
数据访问: repository → collection.model (Sequelize)
事务边界: 由 repository.getTransaction(options) 决定（repository.ts:276）
错误类型: 抛出由 dataWrapping 统一封装
调用方: HTTP /api/<collection>:list
Evidence: actions/src/actions/list.ts:33-90
```

## 4. 数据访问层 / Repository

- 获取仓储：`ctx.db.getRepository(name[, id])`（`database.ts:680`）；action 内 `getRepositoryFromParams(ctx)`。
- `Repository`（`repository.ts:254`）方法：`count`(:273)、`find`(:542)、`findAndCount`(:597)、`firstOrCreate`(:636)、`updateOrCreate`(:649)、`create`(:680)、`update`(:755)、`destroy`(:859)。
- 关联仓储：`BelongsTo/HasMany/BelongsToMany/HasOne`（`relation-repository/`）。
- 过滤：`FilterParser`（`filter-parser.ts`）、`OptionsParser`（`options-parser.ts`）、自定义算子 `db.registerOperators({...})`（见 plugin-users/server.ts:30）。

## 5. 数据模型 / Collection / Field / Migration

- 定义表：`this.db.collection({name, fields:[...]})`（`database.ts` collection()）。
- 字段类型：`database/src/fields/`（string/text/integer/boolean/belongsTo/hasMany/...）、魔法字段 `magic-attribute-model.ts`、`createdBy/updatedBy`（plugin-users 自动注入 `createdById`，`plugin-users/server.ts:43-50`）。
- 元数据表：collection 定义本身持久化在 `collections`/`fields` 表（由 `plugin-collection-manager`/`plugin-graph-collection-manager` 管理），`loadedFromCollectionManager`（list.ts:67）影响分页策略。
- 同步：`db.sync()`（`database.ts:795`）；新表/列/索引自动同步（见 `AGENTS.md` 数据库规则）。
- 迁移：`Migration` 类（`migration.ts:21`，`up()/down()`），插件目录 `server/migrations/`，由 `Plugin.loadMigrations()`（`plugin.ts:169`）加载，`yarn nocobase upgrade` 执行。

## 6. 事务 / 并发

- 事务：`repository.getTransaction(options)`（`repository.ts:276`）+ `transactionWrapperBuilder` 装饰器（`decorators/transaction-decorator.ts`，`repository.ts:37`）。
- 并发：`LockManager`（`application.ts:1277`，适配器可配 `LOCK_ADAPTER_DEFAULT`）提供分布式锁；`WorkerIdAllocator`+`Snowflake`（:259,:704）提供分布式唯一 ID。

## 7. 缓存 / 队列 / 后台任务

- 缓存：`CacheManager`/`Cache`（`application.ts:384-393,652-657`），前缀按 app 名（:654）。
- 队列/事件：`EventQueue`（:1276）、`PubSubManager`（:1274，Redis pub/sub）。
- 后台任务：`CronJobManager`（:1268）；异步长任务 `plugin-async-task-manager`；工作流执行 `plugin-workflow` 的 `Dispatcher`/`Processor` + `ExecutionTimeoutManager`。

## 8. 鉴权 / 权限

- Auth：`AuthManager`（:1306）中间件解析 `X-Authenticator`/Bearer；`plugin-auth` 实现 basic/JWT（`basic-auth.ts`，`jwt.sign/decode/block`）；`plugin-auth-sms` 短信登录；`plugin-api-keys` API Key；`plugin-idp-oauth` OAuth IdP。
- 权限：`ACL`（`acl/src/acl.ts`）角色→策略→资源→字段；`SnippetManager` 菜单片段；`plugin-acl` 提供管理 UI 与数据；每个请求经 ACL 中间件校验。
- 审计：`AuditManager.middleware`（`helper.ts:78`）+ `plugin-audit-logs`。

## 9. 错误处理

- 统一封装：`dataWrapping`（`middlewares/data-wrapping.ts`）。
- 错误类型：`server/src/errors/`（`ApplicationNotInstall` 等）；gateway `errors.ts`（`APP_PREPARING/APP_NOT_FOUND/...`）；database `errors/`（`AssociationNotFoundError`）。
- [Evidence] `Plugin.sendSyncMessage` 吞错（`plugin.ts:147-151`）——分布式同步失败仅记日志，需关注。

## 10. 外部服务 / 文件系统

- 外部 DB：`plugin-collection-fdw`（Postgres FDW）、`plugin-collection-sql`（SQL 视图）、`plugin-data-source-manager`。
- 文件：`plugin-file-manager`（存储适配器，含 oss/aliyun/本地）；gateway `static-file-security`。
- LLM：`packages/core/ai` + `plugin-ai`/`plugin-ai-gigachat`。
- 邮件/通知：`plugin-notification-email` 等。

## 11. 扩展方式（插件）

详见 `扩展机制.md`。后端插件 `extends Plugin`（`plugin.ts:44`），重写：
- `beforeLoad()`：注册 models/operators/listeners（如 plugin-users/server.ts:30）。
- `load()`：定义 collection、resource、action、命令、中间件。
- `install()`：种子数据（建初始角色/用户/authenticator）。
- `upgrade()`：版本升级逻辑。
- AI 扩展：`this.ai`（`AIManager`）经 SkillsLoader/ToolsLoader/AIEmployeeLoader/MCPLoader（`plugin.ts:21`）。

## 12. 测试方式

- `yarn test <file>`（`cli-v1/src/commands/test.js`）；服务端用 `mockServer()`/`createMockCluster()`（`packages/core/test/src/server/mock-server.ts`），自动加载 `.env.test`。
- 服务端测试单线程（`AGENTS.md`：禁止并行）。
- 详见 `测试与CI.md`。

## 13. 调试入口 / 已知限制 / 技术债

- 调试：`yarn dev`（热重载，`cli-v1/src/commands/dev.js`）；`LOGGER_LEVEL` 控制；`perf` resource（`helper.ts:171-192`）。
- 限制：`Application` 单文件 1424 行；`@deprecated` 别名多；`any` 广泛。
- 技术债：`tsconfig.json:32-34` 排除 `cli-v1/src`（故 v1 CLI 仍为纯 JS，无类型检查）。

## 已确认事实

- 请求管线：generateReqId→audit→logger→bodyParser→cors→i18n→dataWrapping→dataSource(auth→acl→parseVariables→dataTemplate)→action→repository→Sequelize。
- 插件模型覆盖 collection/resource/action/event/command/middleware/acl/ai 全部后端扩展面。

## 合理推断

- DataSource 抽象使“外部 DB / SQL 视图 / 第三方 API”复用同一套 action+ACL。

## Unknown 与待验证事项

- 生产 Redis/Lock 适配器实际选型。
- plugin-workflow 长时执行的超时与恢复在生产的表现。

## 批判性评估

- `sendSyncMessage` 与部分 `catch{log}` 存在静默失败风险。
- 插件可 `app.db` 直连任意表，缺少代码级隔离。

## 建设性改善建议

- [Recommendation] 为分布式同步失败提供可观测告警（而非仅 log）。优先级：中；难度：低。
- [Recommendation] 为关键 action 增加统一事务边界与超时中间件。优先级：中；难度：中。
- [Recommendation] 文档化“插件应通过仓储而非裸 SQL 访问他表”的约束。优先级：低；难度：低。

## 主要证据索引

- `packages/core/server/src/application.ts:1244,1306-1352,1383`
- `packages/core/server/src/helper.ts:69-126`
- `packages/core/server/src/plugin.ts:44,119-151,169`
- `packages/core/resourcer/src/resourcer.ts:212,323,330,425`
- `packages/core/actions/src/index.ts:36-52`、`actions/list.ts:33-90`
- `packages/core/database/src/database.ts:571,680,795`、`repository.ts:254,273-859`、`migration.ts:21`
- `packages/plugins/@nocobase/plugin-users/src/server/server.ts:20,30-50`
- `packages/plugins/@nocobase/plugin-auth/src/server/basic-auth.ts:200,312,332`
