# 产品需求文档（PRD）——以源码为准

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean
- 子模块状态：无
- 分析范围：README 声明、`packages/core/*`、108 个 `@nocobase/plugin-*`、preset
- 未覆盖范围：pro 插件（外部仓库）、示例插件深读

## 证据分类

- Evidence：源码包/插件实际存在且含实现（server/client/collections/tests）。
- Inference：基于插件命名与规模推断的产品能力边界。
- Unknown：AI employee、MCP 等功能在真实生产中的成熟度无法仅凭静态代码定论。

## 核心结论

NocoBase 是一个**面向“用无代码 + AI 快速搭建业务系统”的开源/商业双许可平台**。其产品形态不是单一应用，而是一个**可二次开发的平台框架 + 一整套内置业务模块（数据建模、权限、工作流、审计、AI、数据可视化等）**，最终用户在 WYSIWYG 界面中配置出业务系统，开发者通过插件扩展。

---

## 1. 项目定位

- 自述：“open-source AI + no-code platform for building business systems fast”（`README.md:19`）。
- [Evidence] 架构为微内核 + 插件：`Application extends Koa`（`application.ts:222`）+ 抽象 `Plugin`（`plugin.ts:44`）+ `PluginManager`（`application.ts:71,1295`），所有业务能力以插件形式挂载（preset 默认启用一大批，见下）。

## 2. 目标用户 / 适用场景

- 业务方/实施人员：用 WYSIWYG 配置数据模型、页面、工作流、权限。
- 开发者：用 CLI（`nb`/`nocobase`）与插件机制做深度扩展与 AI 协作（`README.md:38-48,61-92`）。
- 场景：CRM、ERP、项目管理、审批等内部业务系统（由插件矩阵可推断：workflow、kanban、gantt、calendar、comments、departments、notifications 等）。

## 3. 产品边界

- **是**：数据建模驱动、插件化、自托管、数据留存自有数据库（`README.md:144-149`）。
- **非目标（推断）**：不是一个托管型 SaaS（需自部署）；不是面向 C 端消费者应用。

## 4. 核心功能（已实现，由源码证明）

| 功能 | 源码状态 | 运行时入口 | 测试证据 | 最终判断 |
| --- | --- | --- | --- | --- |
| 数据建模（collection/field/relation） | `packages/core/database`（collection.ts/repository.ts/fields/）大量实现 | `app.db.defineCollection` | `database/src/__tests__`（136+ 文件） | 已完整实现 |
| 数据资源 + 通用 CRUD action | `packages/core/resourcer` + `actions`（list/get/create/update/destroy/...） | `registerActions`（`actions/src/index.ts`） | `actions/src/__tests__` | 已完整实现 |
| 权限（角色/策略/资源/字段级/snippet） | `packages/core/acl`（acl.ts/acl-role.ts/acl-resource.ts/snippet-manager.ts） | `app.acl`，`plugin-acl` | `acl/src/__tests__`（8 文件） | 已完整实现 |
| 工作流（触发器+指令+执行） | `plugin-workflow`（triggers/instructions/Dispatcher/Processor）+ 20+ `plugin-workflow-*` | `triggers`/`instructions` Registry（`Plugin.ts:55-56`） | 33 测试文件 | 已完整实现（含子扩展） |
| 审计日志 | `packages/core/server/src/audit-manager` + `plugin-audit-logs` | `app.auditManager.middleware`（`helper.ts:78`） | 存在 | 已实现 |
| 用户与认证 | `plugin-users`、`plugin-auth`（JWT，`basic-auth.ts`） | `authManager`（`application.ts:425`） | 9/多测试 | 已完整实现 |
| 无代码页面搭建（WYSIWYG） | `client/schema-component`、`schema-initializer`、`schema-settings` + `plugin-ui-schema-storage` | v1 Application | 客户端测试 + E2E | 已完整实现（v1） |
| 外部数据源 | `data-source-manager` + `plugin-data-source-manager`/`plugin-collection-fdw`/`plugin-collection-sql` | `dataSourceManager`（`application.ts:467`） | 14 测试 | 已实现（FDW/SQL/外部 DB） |
| AI 能力 | `packages/core/ai`（AIManager + Skills/Tools/Employee/MCP Loader）+ `plugin-ai`/`plugin-ai-gigachat`/`plugin-mcp-server` | `app.aiManager`（`application.ts:262`） | plugin-ai 24 测试 | 已实现 |
| 国际化 | `i18next` + `client/i18n` + `plugin-localization`/`plugin-locale-tester` | `app.i18n` | 存在 | 已完整实现 |
| 通知 | `plugin-notification-manager` + `plugin-notification-email`/`plugin-notification-in-app-message`/`plugin-notifications` | 插件 load | 存在 | 已实现 |
| 数据可视化 | `plugin-data-visualization`/`plugin-data-visualization-echarts`/`plugin-charts` | 插件 | 存在 | 已实现 |
| 备份恢复 | `plugin-backup-restore`/`plugin-backups` | 插件 | 存在 | 已实现 |
| 多应用/多租户 | `app-supervisor`（多 app）+ `plugin-multi-app-manager`/`plugin-multi-app-share-collection` | gateway 按 appName 选择 app（`gateway/index.ts:583`） | 存在 | 已实现 |

## 5. 辅助功能

- 批量操作（`plugin-action-bulk-edit/update`）、导出导入（`plugin-action-export/import`）、复制（`plugin-action-duplicate`）、自定义请求（`plugin-action-custom-request`）、打印（`plugin-action-print`）。
- 区块：list/grid-card/tree/iframe/markdown/multi-step-form/workbench/template 等（`plugin-block-*`）。
- 字段：attachment-url/china-region/code/formula/m2m-array/markdown-vditor/sequence/sort（`plugin-field-*`）。
- 视图：kanban/calendar/gantt/map/comments/public-forms/snapshot-field。
- 移动端：`plugin-mobile`/`plugin-mobile-client`。
- API 文档与密钥：`plugin-api-doc`/`plugin-api-keys`。
- MCP 服务端：`plugin-mcp-server`（让外部 Agent 通过 MCP 接入）。

## 6. 用户角色（数据模型层面）

[Inference] 典型角色由 `plugin-acl` + `plugin-users` + `plugin-departments` 提供支撑：超级管理员、自定义角色（带字段级权限）、AI employee（拥有独立角色，`README.md:118-124`）。具体角色由运行时配置决定，源码不内置固定业务角色。

## 7. 输入 / 输出 / 外部依赖

- 输入：HTTP API（resource/action 风格 URL）、WebSocket、CLI、MCP。
- 输出：JSON 响应（`dataWrapping` 中间件统一包装，`helper.ts:121`）、静态前端资源（gateway serve-handler）、审计/日志文件。
- 外部依赖：关系数据库、可选 Redis、可选对象存储（`ali-oss`/`@alicloud/cdn20180510`，见 devDeps/`plugin-file-manager`）、可选 SMTP（通知邮件）、可选 LLM（AI 插件）。

## 8. 实现状态分类（关键声明）

- **已完整实现**：微内核插件架构、数据建模、CRUD、权限、工作流、认证、审计、i18n、WYSIWYG（v1）、外部数据源、备份恢复、通知、数据可视化。
- **已实现但成熟度存疑（Unknown）**：AI employee 业务化程度、MCP 生产可用性——代码与插件存在且有测试，但“是否达到 README 宣传的生产级”需运行时验证。
- **仅配置/接口存在**：[Unknown] 未发现明显“只有类型无实现”的核心功能；个别插件（如 `plugin-hello`、`plugin-mock-collections`、`plugin-locale-tester`）为示例/工具性质。
- **文档声称但需运行验证**：与 OpenClaw/Hermes/Dify/Coze/n8n 以及 Telegram/WhatsApp/Slack/Gmail 的集成（`README.md:112-116`）——本仓库未见这些第三方对接代码，[Unknown] 可能由 pro 插件或外部 Agent 通过 MCP/HTTP 实现。

## 9. 数据与隐私边界

- [Evidence] 业务数据存于自有关系库；`plugin-ui-schema-storage` 把 UI Schema 与业务数据分离（`README.md:144-149` 与插件名印证）。
- 审计日志可追溯数据变更与工作流触发（`README.md:122-124` ↔ `audit-manager` + `plugin-audit-logs`）。

## 10. 当前限制 / 产品风险

- 双客户端运行时（v1/v2）并存，迁移未完成（见 `FRONTEND_GUIDELINES.md`）。
- CI 后端测试不自动跑（见 `测试与CI.md`），产品质量回归存在盲区。
- pro 功能（license、approval 等）闭源，开源用户能力边界小于商业版（`plugin-license` 存在）。

## 已确认事实

- 108 个 `@nocobase/*` 插件 + preset 全量依赖，覆盖数据建模、权限、工作流、AI、通知、可视化、备份、多租户等。
- 微内核：`Application`+`Plugin`+`PluginManager`，preset 默认启用插件集合（`packages/presets/nocobase/package.json`）。

## 合理推断

- 产品定位为“可被 AI Agent 与人协作开发的业务系统平台”，CLI + skills 面向 Agent，WYSIWYG 面向人。

## Unknown 与待验证事项

- README 宣称的第三方平台/IM 集成在本仓库无对应代码。
- AI employee / MCP 在真实业务中的成熟度。
- pro 插件能力边界。

## 批判性评估

- README 营销性表述（“AI employees”“open interfaces for the agent ecosystem”）在源码中可找到对应实现骨架（AIManager、MCP loader、plugin-mcp-server），并非空话；但“与 Dify/Coze/n8n 等无缝连接”更像是生态愿景而非本仓库已交付功能。

## 建设性改善建议

- [Recommendation] 在 README 中区分“核心已交付能力”与“生态愿景/pro 能力”，避免开源用户误判。优先级：低；难度：低。
- [Recommendation] 为 AI employee / MCP 提供可独立运行的示例与端到端测试。优先级：中；难度：中。

## 主要证据索引

- `README.md:17-162`
- `packages/core/server/src/application.ts:222,262,425,431,467`
- `packages/core/server/src/plugin.ts:44`
- `packages/presets/nocobase/package.json`
- `packages/plugins/@nocobase/plugin-workflow/src/server/Plugin.ts:55-56`
- `packages/plugins/@nocobase/plugin-ai`、`plugin-mcp-server`、`plugin-data-source-manager`
