# 技术栈（TECH_STACK）

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean（基线无未提交修改）
- 子模块状态：无（仓库未配置 `.gitmodules`）
- 分析范围：根配置、`packages/core/*`、`packages/plugins/@nocobase/*` 抽样、CI/Docker 配置
- 未覆盖范围：pro-plugins（不在本仓库内，需单独克隆）、`packages/plugins/@nocobase-example/*` 仅统计未深读

## 证据分类

- Evidence：依赖清单、`package.json`、源码 `import`、Dockerfile、CI yaml、vitest 配置直接证明。
- Inference：依赖是否进入关键运行路径、是否为“僵尸依赖”等由调用关系推导。
- Unknown：pro 运行时依赖（不在本仓库）无法确认。

## 核心结论

NocoBase 是一个基于 Node.js（>=18，CI 锁定 Node 22）的**插件式无代码/低代码平台**，采用 Yarn workspaces + Lera monorepo 组织。后端以 **Koa** 为 HTTP 框架、**Sequelize** 为 ORM；前端存在两套运行时：legacy **v1（@nocobase/client，基于 formily + Ant Design v5）** 与新一代 **v2（@nocobase/client-v2，FlowEngine/FlowModel）**，二者单向依赖（v1 可 import v2，v2 不可 import v1）。

---

## 1. 语言与运行时

| 项 | 内容 | Evidence |
| --- | --- | --- |
| 主语言 | TypeScript（后端 + 前端），少量纯 JS（`packages/core/cli-v1`） | `tsconfig.json:1-39`；`packages/core/cli-v1/package.json:6 "main":"./src/index.js"` |
| 运行时 | Node.js >=18（CI 实际用 22） | `package.json:9-11 engines.node`；`.github/workflows/nocobase-test-backend.yml` matrix `node_version:['22']` |
| 包管理 | Yarn 1 Classic（workspaces） | `package.json:4-7 workspaces`、`package.jsonManager: yarn@1.22.22` |
| Monorepo 工具 | Lerna 2.1.26 + Yarn workspaces | `lerna.json:1-13`、`package.json:4` |
| 测试运行器 | Vitest ^1.5.0（单元/集成）+ Playwright（E2E） | `package.json:111`；`playwright.config.ts:1-3`；`vitest.config.mts:1-3` |
| 容器 | Docker（node:22-bookworm-slim 运行时） | `Dockerfile:1`；`docker/nocobase/Dockerfile` |

[Evidence] 仓库为典型 JS/TS monorepo，workspaces glob 为 `packages/*/*` 与 `packages/*/*/*`（`package.json:4-7`）。

## 2. 后端框架与关键依赖

| 依赖 | 用途 | 初始化/调用位置 | 关键路径 | Evidence |
| --- | --- | --- | --- | --- |
| **Koa** | Application 直接继承 Koa | `application.ts:222 extends Koa`；`app.callback()` 在 gateway 调用 `gateway/index.ts:609` | 是 | `packages/core/server/src/application.ts:222` |
| **Sequelize** | ORM，Database 封装 sequelize | `database/src/database.ts`（new Database） | 是 | `packages/core/database/src/repository.ts:18-28` |
| **commander** | CLI 命令注册（AppCommand + nocobase CLI） | `application.ts:38`；`cli-v1` 命令 | 是 | `packages/core/server/src/application.ts:38` |
| **i18next** | 服务端国际化 | `application.ts:42 import i18n`；`createI18n` `helper.ts` | 是 | `packages/core/server/src/application.ts:42` |
| **koa-compose / @koa/router 等** | 中间件组合 | `application.ts:44 import compose` | 是 | 同上 |
| **glob** | 插件/迁移文件发现 | `application.ts:40` | 是 | 同上 |
| **pm2** | 生产进程管理（daemon 模式） | `cli-v1/src/commands/start.js`、`pm2.js` | 可选（daemon） | `packages/core/cli-v1/package.json` deps `pm2 ^6.0.5` |
| **compression / serve-handler / qs** | Gateway 静态资源/压缩/查询解析 | `gateway/index.ts:15,25,24` | 是（静态资源） | `packages/core/server/src/gateway/index.ts` |

[Evidence] 后端核心 27 个 `@nocobase/*` 自研包（`packages/core/*`），构成微内核：`server`、`database`、`resourcer`、`actions`、`acl`、`auth`、`data-source-manager`、`cache`、`logger`、`telemetry`、`lock-manager`、`ai`、`flow-engine`、`sdk`、`utils`、`client`、`client-v2` 等（见 `packages/core/` 目录）。

### 数据库与缓存（运行时启用情况）

[Inference] 默认走主数据库（PostgreSQL/MySQL/MariaDB/SQLite/Kingbase 等多方言，Sequelize 支持），缓存默认内存实现，可经 Redis 适配器切换。

- `ApplicationOptions.database`/`redisConfig`/`cacheManager`/`pubSubManager`：`application.ts:111-149`
- Redis：`RedisConnectionManager`（`application.ts:81,258,1261`）；`docker-compose.yml` 含 mysql/postgres/kingbase/verdaccio 但**未含 redis 服务**——生产是否启用 Redis 取决于部署环境。
- [Unknown] 无法仅凭仓库确认生产是否必用 Redis；CI 中 `nocobase-test-backend.yml` 启用了 `redis/redis-stack-server`（见 `测试与CI.md`），说明 Redis 为测试时可选依赖。

## 3. 前端框架与关键依赖

| 依赖 | 用途 | Evidence |
| --- | --- | --- |
| **React 18** | 视图库（resolutions 锁 `^18.0.0`） | `package.json:65-66`；`packages/core/client/package.json` |
| **Ant Design v5**（锁 `5.24.2`） | UI 组件库 | `package.json:69 resolutions.antd`；`AGENTS.md` 规定优先 antd v5 |
| **@formily/* (antd-v5 1.2.3, reactive, json-schema)** | Schema 驱动表单/响应式状态 | `package.json:57`；`packages/core/client/src/formily/`；`flow-engine/src/FlowDefinition.ts:16 import {observable} from '@formily/reactive'` |
| **react-router-dom 6.30** | 路由（resolutions 锁） | `package.json:62-64` |
| **@nocobase/client-v2** | 新一代运行时基座（FlowEngine），v1 客户端继承之 | `packages/core/client/src/application/Plugin.ts:11,13 extends BasePlugin from '@nocobase/client-v2'` |
| **@emotion/css** | CSS-in-JS | `packages/core/client/src/index.ts` `export * from '@emotion/css'` |
| **dayjs 1.11.13** | 时间处理（resolutions 锁） | `package.json:69` |

[Inference] v1 客户端（`@nocobase/client`）仍是当前主前端运行时，体量远大于 v2（`packages/core/client/src/` 子系统 30+，见 `FRONTEND_GUIDELINES.md`）；v2（`@nocobase/client-v2` + `@nocobase/flow-engine`）是新一代基座，v1 的 `Application`/`Plugin` 已改为继承 v2 的 `BaseApplication`/`BasePlugin`（`packages/core/client/src/application/Application.tsx:110`、`Plugin.ts:11,13`），故 v2 处于“基座已落地、逐步承载”阶段。

## 4. 构建工具

[Inference] 双构建链：
- v1：基于 umi / `@nocobase/build`（`scripts.dev:umi`、`dev` 带 `--rsbuild`，`package.json:23-24`）。
- v2：rsbuild/rspack（`resolutions.@rspack/core 1.7.8`，`package.json:58`）。
- 根 `Dockerfile` 使用内部 Verdaccio（`VERDACCIO_URL`）构建并打包（`Dockerfile:2-3`）。

## 5. 状态管理 / 数据获取

- 前端响应式：`@formily/reactive`（`observable`、`define`），见 `flow-engine/src/FlowDefinition.ts:16`、`client/src/application/Application.tsx:15`。
- API 客户端：`@nocobase/sdk` + `packages/core/client/src/api-client/`（`APIClient`）。
- WebSocket：`WebSocketClient`（`packages/core/client/src/application/WebSocketClient.ts`、`client-v2/src/`），服务端 `gateway/ws-server.ts`。

## 6. 测试与质量工具

| 工具 | 用途 | Evidence |
| --- | --- | --- |
| Vitest ^1.5.0 + @vitest/coverage-istanbul | 单元/集成/覆盖率 | `package.json:111`；`packages/core/test/vitest.mjs` |
| Playwright | E2E | `playwright.config.ts`；`packages/core/test/src/e2e/` |
| ESLint 8.57.1 + Prettier | Lint/格式 | `package.json:70`；`.eslintrc`；`.prettierrc` |
| TypeScript 5.1.3 | 类型 | `package.json:110` |
| commitlint + ghooks + lint-staged | 提交规范/预提交 | `package.json:72-85` |

## 7. CI/CD 与部署

- CI：GitHub Actions，25 个 workflow（`.github/workflows/`）。
- 发布：Lerna publish（npmjs.org + 内部 `pkg.nocobase.com`/`pkg-src.nocobase.com`），`release.yml`、`release.sh`。
- Docker：`Dockerfile`、`docker/nocobase/Dockerfile`、`Dockerfile-full`（含 LibreOffice/Oracle Client/mysql/postgres 客户端/CJK 字体）；多架构 `linux/amd64,linux/arm64`。
- 详见 `测试与CI.md`。

## 8. 子模块 / vendored source / Feature flag

[Unknown] `patches/` 目录存在（`patch-package`），但本次未逐条核对补丁内容。
- [Evidence] 无 Git 子模块（`.gitmodules` 不存在）。
- [Evidence] Feature flag 形式：`process.env` 大量用于运行时分支（如 `API_BASE_PATH`、`SOCKET_PATH`、`LOGGER_LEVEL`、`__E2E__`、`LOCK_ADAPTER_DEFAULT`），见 `application.ts:1278`、`data-source.ts:62`。
- [Evidence] `resolutions` 中对 `@mongodb-js/zstd`、`node-liblzma` 使用本地 `file:` shim（`package.json:61-62`，位于 `plugin-ai/npm-shims/`），属 vendored 补丁依赖。

## 9. 依赖分类速览

- **声明且运行时初始化**：Koa、Sequelize、i18next、commander、formily、antd、react。
- **声明但仅配置/可选**：pm2（daemon 才用）、Redis（适配器可选）。
- **仅测试**：vitest、playwright、@testing-library/*。
- **可能僵尸/未充分核实**：[Unknown] 未逐包做 unused-deps 扫描，不下结论。

## 已确认事实

- TS/JS monorepo，Yarn+Lerna，Node>=18（CI 用 22）。
- 后端 Koa + Sequelize；前端 React18 + AntD5 + formily；双客户端运行时 v1/v2，单向依赖。
- 测试用 Vitest + Playwright；CI 仅前端单测自动跑，后端/E2E 手动触发。

## 合理推断

- v2（client-v2 + flow-engine）是新基座，v1 正在向其迁移（v1 的 Plugin/Application 已继承 v2）。
- 生产部署是否启用 Redis/多实例取决于 `.env`，仓库本身不强制。

## Unknown 与待验证事项

- pro 插件运行时依赖（不在本仓库）。
- `patches/` 内补丁具体作用未逐一核实。
- 是否存在未使用依赖未做穷尽扫描。

## 批判性评估

- `engines.node: ">=18"` 与 CI 仅测 Node 22、`volta.node:20.16.0` 三者不一致，存在版本支持声明与实际验证的差距（详见 `测试与CI.md`）。
- resolutions 大量硬锁版本（antd/dayjs/react-router/formily），降低了上游安全修复的自动跟进能力，但保证了插件生态一致性。

## 建设性改善建议

- [Recommendation] 在 CI 中加入 Node 18/20 矩阵以兑现 `>=18` 声明。优先级：中；难度：低。
- [Recommendation] 统一并文档化“哪些依赖是运行时必需 vs 可选（Redis/pm2）”。优先级：低；难度：低。

## 主要证据索引

- `package.json`、`lerna.json`、`tsconfig.json`、`Dockerfile`、`docker-compose.yml`
- `packages/core/server/src/application.ts:38-86,222,111-149`
- `packages/core/client/src/application/Plugin.ts:11,13`（import + `extends BasePlugin`）、`Application.tsx:110`
- `packages/core/flow-engine/src/FlowDefinition.ts:16`
- `.github/workflows/nocobase-test-backend.yml`、`nocobase-test-frontend.yml`
