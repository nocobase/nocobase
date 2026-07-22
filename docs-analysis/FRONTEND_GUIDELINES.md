# 前端开发指南（FRONTEND_GUIDELINES）

## 分析快照

- 分支：main
- HEAD：a1878e8d8a23e8c7232a5056ba4c4e9f120988cd
- 工作区状态：clean
- 子模块状态：无
- 分析范围：`@nocobase/client`(v1)、`@nocobase/client-v2`、`@nocobase/flow-engine`、`@nocobase/sdk`、`@nocobase/build`、代表性插件客户端
- 未覆盖范围：逐组件 a11y/视觉细节、移动端原生壳（`plugin-mobile-client`）深读

## 证据分类

- Evidence：源码目录、入口 import、Plugin 基类行号。
- Inference：由重复模式推断的约定。
- Unknown：是否存在统一 Design Token（见下）。

## 核心结论

前端存在两套运行时：**v1（`@nocobase/client`，当前主力，Schema 驱动 + formily + AntD5）** 与 **v2（`@nocobase/client-v2` + `@nocobase/flow-engine`，新一代基座）**。v1 的 `Application`/`Plugin` 已继承 v2 的 `BaseApplication`/`BasePlugin`，导入单向（v1→v2，`AGENTS.md` 明确）。前端核心范式是 **JSON Schema 驱动渲染 + SchemaInitializer（加组件）/SchemaSettings（配置组件）+ Designable（可视化搭建）**。

---

## 1. 前端入口

- v1 入口：`packages/core/client/src/index.ts`（导出 formily、antd、schema-component、application 等全集）。
- v1 Application：`packages/core/client/src/application/Application.tsx`（extends `BaseApplication` from `client-v2`，:18-20）。
- v1 Plugin：`packages/core/client/src/application/Plugin.ts`（`extends BasePlugin` from `client-v2`，:18）。
- v2 基座：`packages/core/client-v2/src/BaseApplication.tsx`、`Application.tsx`、`Plugin.ts`、`PluginManager.ts`、`RouterManager.tsx`、`APIClient.ts`。
- 应用装配入口（dev/build）：`@nocobase/build` + `cli-v1` 的 `dev.js`/`umi.js`/`build.js`。

## 2. 既有并执行的规范（Evidence）

| 规范 | 证据 |
| --- | --- |
| 插件客户端需 `export default class PluginXXX extends Plugin`（来自 `@nocobase/client` 或 `client-v2`） | `client/src/application/Plugin.ts:11,13` |
| 路由经 `RouterManager`（`app.router`/`app.addRoutes`） | `client-v2/src/RouterManager.tsx`、`Plugin.ts` `get router()` |
| 国际化经 `i18n`（`app.i18n.t`），namespace = 包名 | `client-v2/src/Plugin.ts` `t()`、`AGENTS.md` i18n 规则 |
| UI 组件优先 AntD v5 | `package.json:69 resolutions.antd 5.24.2`、`AGENTS.md` |
| Schema 渲染：`SchemaComponent` + formily `Schema`/`RecursionField` | `client/src/schema-component/`、`client/src/formily/` |
| 添加组件：`SchemaInitializerManager` | `client/src/application/schema-initializer/`、`Application.tsx` import |
| 配置组件：`SchemaSettingsManager` | `client/src/application/schema-settings/` |
| 数据获取：`APIClient`（`@nocobase/sdk` 基类） | `client/src/api-client/`、`client-v2/src/APIClient.ts` |
| 状态：`@formily/reactive`（observable/define） | `flow-engine/src/FlowDefinition.ts:16`、`Application.tsx:15` |
| 样式：`@emotion/css` + Less（`global.less`） | `client/src/index.ts`、`client/src/global.less` |

## 3. 由重复模式推断的约定（Inference）

- 插件客户端目录结构：`src/client/index.ts`(导出 plugin) + `plugin.ts` + `components/` + `schema/` + 可选 `__tests__/`、`__e2e__/`。
- 区块（Block）注册经 `BlockProvider`/`DataBlockProvider`（`client/src/data-source/data-block/`）。
- 字段交互：`CollectionFieldInterface`/`CollectionFieldInterfaceFactory`（`client/src/data-source/collection-field-interface/`）。
- Schema 既存库（`plugin-ui-schema-storage`），前端拉取后渲染——数据与 UI 解耦。

## 4. 仓库中不存在证据的规范（Unknown）

- [Evidence] 未发现统一 **Design Token** 定义（无 `tokens.ts`/`design-tokens` 目录；主题经 `global-theme/`、`css-variable/`、AntD `ConfigProvider`）。
- [Evidence] 未发现强制的 a11y lint 规则（`.eslintrc` 未启用 jsx-a11y）；`AGENTS.md` 口头要求 a11y。
- [Evidence] 未发现统一“加载/空状态”组件抽象（各区块自处理）。

## 5. 页面 / 路由 / 布局 / 组件层级

- 路由：`RouterManager`（hash/browser，运行时可配），插件 `load()` 中 `this.app.router.add(...)`。
- 布局：`plugin-mobile`（移动布局）、桌面布局由 `plugin-block-workbench`/菜单插件提供；`app.addRoutes` 注册页面。
- 组件层级（v1）：`Application` → `APIClientProvider`/`DataSourceApplicationProvider` → 路由 → `SchemaComponent`（渲染 page schema）→ `BlockProvider` → formily `RecursionField` → AntD 组件。

## 6. 表单 / 校验 / 错误 / 状态

- 表单：formily `createForm`/`SchemaForm`，校验由 formily schema 驱动。
- 错误：`APIClient` 拦截 HTTP 错误；`dataWrapping` 统一 `{data/errors}` 结构。
- 加载/空：[Inference] 区块自管理，无统一抽象。

## 7. 主题 / 响应式 / 移动 / a11y / i18n / 图标 / 静态资源

- 主题：`global-theme/`、`css-variable/`（CSS 变量）、AntD `ConfigProvider`；`plugin-theme-editor` 可视化主题。
- 响应式/移动：`plugin-mobile`、`plugin-mobile-client`（独立移动端）。
- a11y：`AGENTS.md` 要求（ARIA/语义化/键盘），但无 lint 强制。
- i18n：`i18next` + `react-i18next`，`plugin-localization`（运行时翻译管理），`locales/` 目录。
- 图标：`@ant-design/icons`（锁 `^5.6.1`）。
- 静态资源：gateway `serve-handler` 提供 dist；`public/` 资源。

## 8. 前端测试 / 构建

- 测试：Vitest + `@testing-library/react`（jsdom），`packages/core/client/__tests__`、插件 `src/client/__tests__`；E2E：Playwright（`__e2e__`）。
- 构建：v1 umi/rsbuild（`@nocobase/build`）；v2 rsbuild/rspack。
- 详见 `测试与CI.md`。

## 9. v1 vs v2 vs 桌面/移动/浏览器差异

- 浏览器：v1/v2 均为 SPA。
- 移动：`plugin-mobile`（响应式布局）与 `plugin-mobile-client`（独立移动端 App 产物）。
- [Unknown] 未发现 Electron/Tauri 桌面端代码（README 未声称桌面端）。

## 10. 前端安全边界

- 鉴权 token 由 `APIClient` 注入（Bearer）；`X-Authenticator` 头选择认证器。
- XSS：依赖 React 转义 + AntD；`plugin-embed` 嵌入场景需关注。
- [Inference] Schema 来自服务端持久化，渲染前未发现统一 schema 消毒层（依赖后端 ACL）。

## 11. UI 技术债

- v1/v2 并存，迁移未完成；`client/src/` 子系统 30+，体量大。
- `any` 在 schema/context 中广泛使用。
- 无统一 Design Token / a11y lint / 加载空状态抽象。

## 已确认事实

- 双运行时，v1 继承 v2 基座，单向依赖。
- Schema 驱动 + SchemaInitializer/Settings + formily + AntD5 为主范式。

## 合理推断

- 大量区块/字段插件遵循同一注册模式（`Plugin.load` 注册 initializer/settings/components）。

## Unknown 与待验证事项

- 是否有计划用 v2/flow-engine 完全替代 v1 的 schema 渲染。
- 是否存在内部 Design Token（未在源码发现）。

## 批判性评估

- 双运行时增加心智负担与重复实现风险；`client-v2` 与 `client` 部分能力重叠（如 `PluginManager`、`RouterManager`、`APIClient` 在两侧都存在）。
- a11y/i18n 仅靠规范口头约束，缺自动化保障。

## 建设性改善建议

- [Recommendation] 引入统一 Design Token 与 a11y lint（eslint-plugin-jsx-a11y）。优先级：中；难度：中。
- [Recommendation] 明确 v1→v2 迁移路线与去重计划。优先级：中；难度：高。
- [Recommendation] 抽象统一 Loading/Empty 组件减少重复。优先级：低；难度：低。

## 主要证据索引

- `packages/core/client/src/index.ts`、`application/Application.tsx:15-53`、`application/Plugin.ts:11,13`
- `packages/core/client-v2/src/Plugin.ts:29-92`、`Application.tsx:37-110`、`BaseApplication.tsx`、`RouterManager.tsx`、`APIClient.ts`
- `packages/core/flow-engine/src/FlowDefinition.ts:16,23`
- `packages/core/client/src/{schema-component,schema-initializer,schema-settings,data-source,api-client,formily,i18n,global-theme,css-variable}/`
- `package.json:62-69`（resolutions）、`.eslintrc`、`AGENTS.md`
