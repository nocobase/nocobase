# 测试与 CI（测试与CI.md）

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean
- 子模块状态：无
- 分析范围：`vitest.config.mts`、`playwright.config.ts`、`packages/core/test`、`packages/core/cli-v1/src/commands/{test,test-coverage,e2e,p-test}.js`、`.github/workflows/*`、`.eslintrc`/`tsconfig.json`
- 未覆盖范围：pro 插件测试（外部仓库）、实际 CI 历史运行结果

## 证据分类

- Evidence：配置文件、CI yaml、test 命令实现、workflow `on:` 触发块。
- Inference：测试是否被 CI 执行由 trigger + job step 推导。
- Unknown：各 workflow 实际成功率（需运行历史）。

> 本节关键纪律：严格区分四层——**①测试文件存在 / ②测试命令配置 / ③CI 执行 / ④仅手动或被禁用**。

## 核心结论

测试体系成熟（Vitest 单元/集成 + Playwright E2E，单一 `@nocobase/test` 装配，自动按 `TEST_ENV` 路由 server/client），**但 CI 门禁很窄**：PR/push 自动跑的只有**前端 Vitest（Linux 4 分片）**、**Windows 服务端 Vitest（仅 sqlite、按路径过滤）**、**依赖漏洞扫描**；**后端 Linux 测试、E2E、ESLint、TypeScript、覆盖率全部仅 `workflow_dispatch` 手动触发或不在 CI**。

---

## 1. 测试框架

| 框架 | 用途 | 配置位置 | Evidence |
| --- | --- | --- | --- |
| Vitest ^1.5.0 | 单元/集成（server+client） | `vitest.config.mts:1-3` → `packages/core/test/vitest.mjs` | package.json:111 |
| @vitest/coverage-istanbul / -v8 | 覆盖率 | provider=istanbul（`vitest.mjs:94`） | packages/core/test/package.json:63-64 |
| Playwright | E2E | `playwright.config.ts:1-3` → `packages/core/test/src/e2e/defineConfig.ts` | playwright.config.ts |
| @testing-library/react + jsdom | 客户端单测 | `packages/core/test/setup/client.ts` | packages/core/test/package.json |

- server/client 自动路由：`process.env.TEST_ENV`（`vitest.mjs:115-166`）；默认按文件路径推断 `/client/|/client-v2/|/flow-engine/`（`cli-v1/src/commands/test.js:181-188`）。
- 服务端 setup：`packages/core/test/setup/server.ts`（加载 `.env.test`）；客户端 setup：`setup/client.ts`（jsdom + matchers）。
- 超时：testTimeout/hookTimeout=300000ms（5 分钟，`vitest.mjs:68-69`）。
- 服务端默认单线程（`test.js:190-192`，呼应 `AGENTS.md` “禁止并行”）。
- E2E：`workers:1`、`fullyParallel:false`、CI 重试 2、超时 30s/60s（`defineConfig.ts`）。

## 2. 测试命令实现（`yarn test`）

- 全部脚本经 `nocobase-v1`（`package.json:30-37`：`test/test:server/test:client/test:server-coverage/test:client-coverage/e2e/ts/tc`）。
- 驱动：`packages/core/cli-v1/src/commands/test.js`（v2 CLI `packages/core/cli` 不实现 test 命令）。
  - workspace 委托（test.js:86-116）：若首个参数是含 `scripts.test` 的包目录，转发到 `yarn --cwd <pkg> test`。
  - 环境选择（:159-188）：`test:server`→`TEST_ENV=server-side`；`test:client`→`client-side`；裸 `test` 无路径时**并行双跑** client+server（:204-217）。
  - 单文件运行：`yarn test <path>`（`AGENTS.md` 示例）。
- 覆盖率：`test-coverage.js:31-55`，逐包循环 `yarn test:<env> <dir> --coverage`，**吞错**（`continue` on catch）。
- E2E 驱动：`e2e.js`（install+enable-all+dev/start+playwright）、`p-test.js`（并行分块，每块独立 DB+port+auth）。

## 3. 测试夹具 / Mock

- `packages/core/test/src/server/mock-server.ts`：`MockServer`/`mockServer`/`createMockServer`/`createMockCluster`，`ExtendedAgent`（`.login()`/`.resource()`）。
- `packages/core/test/src/scripts/test-db-creator.ts`：postgres/mysql/mariadb 隔离 DB 分配。
- mockDatabase：`packages/core/database/src/mock-database.ts`。

## 4. CI 工作流触发与执行（核心区分）

### 4.1 PR/push 自动触发

| Workflow | 触发 | 执行内容 | Evidence |
| --- | --- | --- | --- |
| `nocobase-test-frontend.yml` | push(main/next/develop)+PR | `install-deps` 打包 node_modules.tar；4 分片 `yarn test:client --shard=i/4 --silent` | nocobase-test-frontend.yml:7-31,91 |
| `nocobase-test-windows.yml` | push+PR（**路径过滤**：core server/cli/acl/actions/database/resourcer/data-source-manager/server/utils + 插件 src/server） | `yarn test --server --single-thread=false`（sqlite） | nocobase-test-windows.yml:7-39,72-80 |
| `dependency-review.yml` | PR（改 package.json/yarn.lock） | `dependency-review-action`（fail-on moderate） | dependency-review.yml:3-11 |
| `deploy-client-docs.yml` | push(main, path client/**) | 文档部署 | deploy-client-docs.yml:8-12 |
| `release.yml`/`changelog-and-release.yml` | tag `v*` | 发布流水线 | — |

### 4.2 仅 `workflow_dispatch`（手动）

| Workflow | 真实触发 | 跑什么 |
| --- | --- | --- |
| `nocobase-test-backend.yml` | **仅 workflow_dispatch**（`push:`/`pull_request:` 被**注释掉**，:10-41） | sqlite/postgres/mysql/mariadb × underscored 矩阵，`yarn test --server`，含 Redis 服务 |
| `manual-e2e.yml` | workflow_dispatch | postgres + `yarn e2e p-test`（需 pro 分支） |
| `build-docker.yml`/`build-internal-image.yml`/`build-pro-image.yml`/`manual-build-*.yml` | workflow_dispatch | Docker 构建 |
| `release.yml` | workflow_dispatch 或 tag | 发布 |
| `manual-release*.yml`/`manual-npm-publish*.yml`/`auto-merge.yml`/`create-branch.yml`/`test-feishu-notify.yml` | workflow_dispatch | 发布/分支/通知 |
| `get-plugins.yml` | workflow_call | 可复用工作流 |

### 4.3 典型 PR 实际跑什么

PR 同时改 server+client 时自动触发：① 前端 4 分片 Vitest（Linux）；② Windows 服务端 sqlite Vitest（**仅当命中路径过滤**）；③ 依赖审查（仅当改依赖文件）。

**不会**触发：Linux 后端测试、E2E、ESLint、TypeScript 类型检查、覆盖率。

## 5. E2E 在 CI 中——仅手动

`manual-e2e.yml` 是唯一跑 Playwright 的 CI，`workflow_dispatch` 且需输入 pro 分支；步骤：`yarn install`→`yarn build __E2E__=true`→`npx playwright install chromium --with-deps`→`yarn e2e p-test`（postgres）。**无 PR 时 E2E**。约 317 个 E2E 文件存在但不自动跑。

## 6. Lint / 类型检查——不在 CI

- `.eslintrc:1-73`：扩展 `eslint:recommended`/`@typescript-eslint/recommended`/`react`/`react-hooks`/`promise`/`prettier`；但根目录**关闭** `no-explicit-any`/`no-unused-vars`/`ban-ts-comment` 等（.eslintrc:43-58）；仅 e2e 文件 `no-floating-promises:error`（:59-72）；`plugin:import/recommended` 被注释（未启用未用导入检查）。
- `.prettierrc`：单引号、trailing all、120 宽。
- `tsconfig.json:1-39`：`noUnusedLocals:false`、`skipLibCheck:true`；**无 `yarn typecheck` 脚本**（package.json:18-52）；`tsconfig.json:32-34` 排除 `cli-v1/src`（故 v1 CLI 无类型检查）。
- 预提交：`ghooks`（`package.json:72-85`）跑 `lint-staged`（eslint --fix + prettier）+ `addLicense.js`；commitlint 校验提交信息。**可被 `--no-verify` 绕过**。
- [Evidence] 在 `.github/workflows/*.yml` grep `eslint|tsc|typecheck|prettier|lint` **无匹配**——CI 不强制任何静态检查。

## 7. 覆盖率

- 工具齐全（istanbul/v8），include `packages/**/src/**/*.{ts,tsx}`（`vitest.mjs:93-110`），报告 `storage/coverage/...`（:230-248）。
- 命令：`yarn test:server-coverage`/`test:client-coverage`（逐包、吞错）。
- [Evidence] **无 CI workflow 调用覆盖率**，无 PR 时门槛。

## 8. 发布流程

- `release.yml`（tag `v*` 或 workflow_dispatch）：解析 tag→version/dist-tag；`get-plugins` 枚举插件仓库；`publish-packages`：npmjs.org（`lerna publish from-package`，**`continue-on-error:true`**）+ 内部 `pkg.nocobase.com`/`pkg-src.nocobase.com`（逐包 `npm publish`，E409 当成功）；`push-docker` 4 变体多架构推 Docker Hub + Aliyun；飞书通知。
- `changelog-and-release.yml`、`release.sh`、`manual-release*.yml`：版本计算（main→rc/patch、next→beta、develop→alpha）与跨仓库打 tag。
- `manual-npm-publish.yml`/`-license-kit.yml`：手动重发；license-kit 为跨平台原生二进制（Rust）矩阵构建。

## 9. Docker 构建

- `docker/nocobase/Dockerfile`（两阶段，`create-nocobase-app` + `yarn install --production`，runtime `node:22-bookworm-slim`，可选 nginx）。
- `docker/nocobase/Dockerfile-full`（加 LibreOffice/Oracle Client/mysql/postgres 客户端/CJK 字体）。
- 根 `Dockerfile`（内部 Verdaccio 构建，支持 `BEFORE_PACK_NOCOBASE`/`APPEND_PRESET_LOCAL_PLUGINS` 烘焙 pro 插件）。
- `build-docker.yml`（workflow_dispatch，多架构 `nocobase/nocobase:<tag>-full`）。

## 10. 测试覆盖矩阵

| 模块/功能 | 单元/集成(vitest) | E2E(playwright) | CI 自动执行? | 主要缺口 |
| --- | --- | --- | --- | --- |
| core/database | 重（136+ 文件） | — | Linux:**否**；Windows:sqlite/路径过滤 | postgres/mysql/mariadb 不自动跑 |
| core/server | 27 文件（Application.test.ts 等） | — | 同上 | 同上 |
| core/acl/actions/resourcer/data-source-manager/auth/utils/sdk | 是 | — | 同上 | 同上 |
| core/client | 是 | `__e2e__/**` | Linux 前端:是(4分片)；E2E:手动 | E2E 不自动 |
| core/client-v2/flow-engine | 是 | 部分 | Linux 前端:是 | E2E 不自动 |
| core/cli(v2) | 75+ 文件 | — | 前端分片:是 | Windows 不覆盖 |
| core/cli-v1 | `__tests__/*.test.js` | — | 前端分片:是 | 无类型检查 |
| 插件 server | `src/server/__tests__` | — | Linux:**否**；Windows:路径过滤 | 跨 DB 不自动 |
| 插件 client | `src/client/__tests__` | `src/client/__e2e__` | Linux 前端:是；E2E:手动 | E2E 不自动 |
| 跨 DB(postgres/mysql/mariadb) | 同套件不同环境 | — | 手动 dispatch | 不自动 |
| 集群/pubsub | createMockCluster | — | 手动 | 不自动 |
| lint/typecheck/coverage | 配置存在 | — | **否** | CI 不强制 |
| pro 插件 | 外部仓库 | 外部 | 仅发布流水线 | 不在本仓库 |

## 11. 缺口与风险

**高**
1. **后端 Linux 测试实质 opt-in**：`nocobase-test-backend.yml:10-41` push/PR 被注释，仅 `workflow_dispatch`。server 回归可无 CI 把关即合入。这是**最大 CI 缺口**。
2. **E2E 仅手动**（`manual-e2e.yml`）：317+ Playwright 用例不自动跑，UI 回归易漏。
3. **CI 无 ESLint/TypeScript**：类型错误可随 `--no-verify` 入库。
4. **npm publish `continue-on-error:true`**（`release.yml:287-289`）：发布失败不阻断 job。

**中**
5. 覆盖率工具齐全但 CI 不用，且 `test-coverage.js` 吞错。
6. Windows CI 路径过滤：纯 client 改动不触发 server 测试。
7. 前端 CI `--silent`，排障困难。
8. Node 矩阵固定 22，但 `engines.node>=18`/`volta.node:20.16.0` 声明 18/20 未验证。
9. backend CI 用 `postgres:11`（已 EOL）、`mysql:8.2`（注释称 8.3+ 有未解错误），矩阵陈旧。
10. `p-test.js:83` 硬编码 `concurrency:4`，忽略按 CPU 计算的并发。

**低**
11. mariadb job 重复 `yarn install`。
12. `eslint-plugin-import` 被注释。
13. Playwright `workers:1`+`maxFailures:0`+5 分钟超时，E2E 可能数小时。
14. `__E2E__` 标志在当前 Playwright 驱动下基本无效。
15. `tsconfig.json:32-34` 排除 `cli-v1/src`，v1 CLI 无编译器兜底。

## 已确认事实

- Vitest + Playwright 双框架，`@nocobase/test` 统一装配，server/client 自动路由。
- CI 自动门禁：仅前端 Vitest(Linux 4 分片) + Windows server(sqlite, 路径过滤) + 依赖审查。
- 后端 Linux/E2E/lint/typecheck/coverage 均为手动或缺失。

## 合理推断

- 后端在 Linux 的回归主要靠人工本地跑 `yarn test`，存在质量盲区。

## Unknown 与待验证事项

- 各 workflow 实际历史成功率/是否长期红。
- pro 插件 CI 覆盖。

## 批判性评估

- 测试**资产丰富但 CI 把关薄弱**：存在≠配置≠执行三层落差明显。后端核心（database/server/acl）在主平台 Linux 无自动测试是显著风险。
- 发布链 `continue-on-error` 与逐包 E409 处理，降低了发布失败的可见性。

## 建设性改善建议

- [Recommendation] **重新启用 `nocobase-test-backend.yml` 的 push/PR 触发**（至少 sqlite+postgres 快速门禁）。优先级：高；难度：低。
- [Recommendation] 在 CI 加 ESLint + `tsc --noEmit`（typecheck 脚本）作为必需检查。优先级：高；难度：低。
- [Recommendation] 将关键 E2E（冒烟集）纳入 PR CI（非全部 317 个）。优先级：中；难度：中。
- [Recommendation] Node 矩阵补 18/20；升级 postgres/mysql 镜像。优先级：中；难度：低。
- [Recommendation] npm publish 去除 `continue-on-error`，失败显式告警。优先级：中；难度：低。

## 主要证据索引

- `vitest.config.mts:1-3`、`playwright.config.ts:1-3`、`packages/core/test/vitest.mjs:59-291`
- `packages/core/cli-v1/src/commands/test.js:86-217`、`test-coverage.js:31-55`、`e2e.js`、`p-test.js:67-90`
- `.github/workflows/nocobase-test-backend.yml:7-41`（push/PR 注释）、`nocobase-test-frontend.yml:7-31,91`、`nocobase-test-windows.yml:7-39,72-80`、`manual-e2e.yml:3-8`、`release.yml:287-289`
- `.eslintrc:1-73`、`tsconfig.json:1-39`、`package.json:18-52,72-85,110-111`
- `packages/core/test/src/server/mock-server.ts`、`packages/core/test/src/e2e/defineConfig.ts`
