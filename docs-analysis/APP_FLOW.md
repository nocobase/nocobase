# 应用流程（APP_FLOW）

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean
- 子模块状态：无
- 分析范围：安装/启动/登录/搭建/工作流/升级等用户视角流程及其源码对应
- 未覆盖范围：pro 插件提供的流程、移动端细节流程

## 证据分类

- Evidence：CLI 命令、Application 生命周期、plugin-auth 的 signIn/JWT、gateway 请求分发。
- Inference：典型用户操作路径由中间件 + action 链推导。
- Unknown：UI 层具体交互细节（按钮文案/向导）未逐屏核实。

## 核心结论

NocoBase 的用户流程围绕“**安装 → 首次初始化（建表 + 装插件）→ 登录 → 配置数据模型/页面/权限/工作流 → 使用**”展开。所有用户流程最终落到 resource/action HTTP 调用链（见 `核心数据流.md`）。

---

## 1. 安装与启动

- 安装 CLI：`npm i -g @nocobase/cli` 后 `nb init --ui`（`README.md:38-48`）。`nb` bin 来自 `packages/core/cli/package.json:25 "bin":"nb"`。
- 开发启动：`yarn dev`（`nocobase-v1 dev`，`package.json:24`）→ `cli-v1/src/commands/dev.js`。
- 生产启动：`yarn start` → `cli-v1/src/commands/start.js`（含 `--daemon` pm2、`--port`、`--db-sync`、`--quickstart`，见 start.js option 定义）。
- HTTP 入口为 gateway：`packages/core/server/src/gateway/index.ts`，`requestHandler`（:413）根据子应用名选择 app 并 `app.callback()(req,res)`（:609）。

```
前置条件：数据库可达、.env 配置好
→ 用户执行 yarn nocobase install（或首启自动）
→ Application.install()（application.ts:1031）：db.sync + pm.install + 写 applicationVersion
→ yarn nocobase start → gateway.listen
→ 浏览器访问前端 → 进入初始化引导
完成条件：applicationVersion 表存在、preset 插件已启用
```

## 2. 首次运行 / 初始化配置

[Inference] 首次未安装时，`Application.start` 在 `checkInstall` 下抛 `ApplicationNotInstall`（`application.ts:908-912`），提示先 `install`。install 流程：`db.clean`(可选) → `reInit` → `db.sync` → `load` → `beforeInstall` 钩子 → `pm.install()`（执行各插件 `install()`，如 `plugin-users` 创建初始用户/角色、`plugin-auth` 创建默认 authenticator） → `version.update()`（`application.ts:1031-1050`）。

异常分支：数据库连接失败 → `db.auth`/`checkVersion`/`prepare`（`application.ts:759-767`）抛错。

## 3. 用户登录

[Evidence] 存在完整登录流程（与“无登录”相反）：
- 认证由 `plugin-auth` 提供，基于 JWT：`basic-auth.ts` 通过 `ctx.app.authManager.jwt.sign`（:200）/`.decode`（:312）/`.block`（:332）管理 token。
- `AuthManager` 中间件挂载于 dataSource 层（`application.ts:1332 use(this._authManager.middleware())`），解析 `X-Authenticator` 头与 Bearer token。
- 登录 resource：`auth`（`application.ts:1314-1317 define {name:'auth', actions:authActions}`）。
- 登录成功后，后续请求经 `getBearerToken` 中间件取 token（`helper.ts:110-116`），AuthManager 校验并写入 `ctx.state.currentUser`。

```
前置条件：已 install、存在用户
→ 用户在登录页提交账号密码
→ POST /api/auth:signIn → AuthManager → basicAuth 校验 → 签发 JWT
→ 前端保存 token（localStorage/cookie）
→ 后续请求带 Authorization: Bearer <token>
→ acl 中间件按 currentUser 角色鉴权
完成条件：ctx.state.currentUser 就绪
```

异常分支：token 失效/黑名单（`jwt.blacklist`，`basic-auth.ts:347`）→ 401。

## 4. 无登录模式 / 公开访问

[Inference] ACL 支持 `public` 策略与 `allow`（如 `helper.ts:192 app.acl.allow('perf','*','public')`），`plugin-public-forms`、`plugin-embed` 可提供免登录访问的公开表单/嵌入页。具体哪些资源公开由运行时 ACL 配置决定。

## 5. 数据建模 / 页面搭建（核心任务流程）

[Inference] 配置态（WYSIWYG）：
- 数据模型：用户在“数据表配置”界面增删 collection/field → 经 `plugin-collection-manager`（client）→ 调 `collections` resource → server 写 `collections` 元数据表并 `db.sync()` 落库。
- 页面：用户拖拽区块 → `schema-initializer` 生成 Schema → `plugin-ui-schema-storage` 持久化 UiSchema。
- 使用态：切换到使用模式 → 前端按 Schema 渲染（`schema-component` + formily）→ 数据经 `APIClient` → resource/action → DB。

源码对应：客户端 `schema-initializer/`、`schema-settings/`、`schema-component/`；服务端 `plugin-ui-schema-storage`（`UiSchemaRepository`，被 `plugin-users/server.ts:23` 引用）。

## 6. 权限配置

[Inference] 用户在“角色与权限”界面为角色配置：策略（available-strategy）、资源 action 权限、字段级读写、snippet（菜单片段）。落到 `plugin-acl` 的 `roles`/`rolesResources`/`rolesResourcesFields` 等表（`packages/core/acl/src/`）。

## 7. 工作流配置与触发

```
前置条件：已建数据表/页面
→ 用户创建工作流，选择触发器（如 CollectionTrigger / ScheduleTrigger）
→ 编排指令节点（condition/create/update/query/delay/...，plugin-workflow-* 家族）
→ 启用工作流
→ 触发事件发生（如某表记录新增）
→ Dispatcher 拉起执行（plugin-workflow/src/server/Dispatcher.ts）
→ Processor 逐节点执行（Processor.ts）
→ 副作用落库/发通知/调外部
完成条件：execution 记录完成状态
```
源码：`plugin-workflow/src/server/Plugin.ts:55-56`（triggers/instructions Registry）、`Dispatcher.ts`、`Processor.ts`。

## 8. 数据导入 / 导出 / 同步

- 导出：`plugin-action-export`；导入：`plugin-action-import`（异步任务由 `plugin-async-task-manager` 支撑）。
- 同步：`SyncMessageManager`/`PubSubManager`（`application.ts:73,263-264`）跨实例同步；`plugin-user-data-sync` 提供用户数据同步资源（`plugin-users/server.ts:20`）。

## 9. 错误提示 / 异常恢复

- HTTP 错误经 `dataWrapping` 统一封装（`helper.ts:121`）。
- 维护态：`_maintainingCommandStatus` + `maintaining` 事件（`application.ts:269-270,496-499`），前端展示“维护中”。
- gateway 对未就绪 app 返回 `APP_PREPARING`/`APP_INITIALIZING` 等（`gateway/index.ts:560-602`）。

## 10. 升级 / 迁移 / 数据恢复

- 升级：`yarn nocobase upgrade`（`cli-v1/src/commands/upgrade.js`），运行各插件 migration（`plugin.ts:169 loadMigrations` → `db/migrations`），随后 `db.sync()`。
- 迁移机制：`Migration` 类 `up()/down()`（`database/src/migration.ts:21-49`），Sequelize migrator 执行。
- 数据恢复：`plugin-backup-restore`/`plugin-backups`。

## 11. 多应用 / 多工作区切换

[Inference] 多租户由 `plugin-multi-app-manager` + gateway 子应用名路由实现：请求 URL 前缀解析出 appName → `AppSupervisor.getApp(appName)`（`gateway/index.ts:583`）→ 对应 Application 实例。子应用可独立启停（`startApp`/`setAppLastSeenAt`，`gateway/index.ts:588-591`）。

## 12. 退出 / 再次启动

- 停止：`Application.stop()`（`application.ts:970`）→ `beforeStop` 钩子 → 关 DB → `disposeServices` → `afterStop`。
- 再次启动：gateway 常驻，按需拉起子应用（懒启动，`gateway/index.ts:580-587` initialized → startApp）。

## 已确认事实

- 存在完整登录（JWT）流程；存在 install/start/stop/upgrade 生命周期。
- 用户配置流程对应 schema-initializer/settings、collection-manager、acl、workflow 等子系统。

## 合理推断

- “配置态 ↔ 使用态”一键切换由前端路由 + Schema 渲染实现（WYSIWYG）。

## Unknown 与待验证事项

- 具体首启向导 UI 文案与步骤未逐屏核实。
- 公开表单/嵌入的实际免登录边界由运行时 ACL 决定，无法静态定论。

## 批判性评估

- 维护态/未就绪态的错误码（`APP_PREPARING` 等）设计良好，前端可据此展示进度；但 `install` 流程较长（同步全表 + 全插件 install），首次部署体验依赖 DB 规模。

## 建设性改善建议

- [Recommendation] 为 install/upgrade 提供进度百分比与可恢复断点。优先级：中；难度：中。

## 主要证据索引

- `packages/core/cli-v1/src/commands/start.js`、`upgrade.js`
- `packages/core/server/src/application.ts:901,970,1031,1314-1317,1332`
- `packages/core/server/src/gateway/index.ts:413,560-609`
- `packages/plugins/@nocobase/plugin-auth/src/server/basic-auth.ts:200,312,332`
- `packages/plugins/@nocobase/plugin-workflow/src/server/Plugin.ts:55-56`
