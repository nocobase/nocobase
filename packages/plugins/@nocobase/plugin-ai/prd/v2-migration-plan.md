# plugin-ai v2 渐进式迁移方案

## 需要使用的 Skills

后续在任意新会话继续迁移时，先读取本 PRD，并按当前小块任务选择以下 skills：

| Skill | 何时使用 | 用途 |
| --- | --- | --- |
| `nocobase-plugin-v1-to-v2-migration` | 每次开始或继续任何 v1 -> v2 迁移小块时必须使用 | 迁移主流程、v1/v2 边界、models 移动、settings page、cross-plugin、global runtime、provider、hooks、i18n、验收清单 |
| `kimi-webbridge` | 需要浏览器验收 UI、设置页、ChatBox、ACL tab、AI 员工入口时使用 | 使用真实浏览器会话做交互验收、截图、读取页面状态 |
| `nocobase-code-review` | 每个大块进入“待确认 V1 替换”前，或准备提交前使用 | 按 NocoBase 约定审查迁移代码、风险、遗漏和测试缺口 |
| `nocobase-test` | 需要验证插件功能链路、API 请求、工作流式交互时使用 | 执行插件级功能验证，补充单测之外的集成检查 |
| `nocobase-commit` | 用户明确要求提交迁移成果时使用 | 按 NocoBase 提交规范选择文件、生成 Conventional Commit 并提交 |

默认执行顺序：

1. 使用 `nocobase-plugin-v1-to-v2-migration` 读取相关 references 和本 PRD，定位当前小块。
2. 完成该小块 v2 实现后，先做代码层面验收。
3. 该小块涉及可视化交互时，再使用 `kimi-webbridge` 做浏览器验收。
4. 大块完成后，使用 `nocobase-code-review` 做迁移审查。
5. 只有用户确认后，才执行对应 v1 替换任务。

## 背景

`@nocobase/plugin-ai` 目前处于部分 v2 化状态：

- 根目录已经存在 `client-v2.js`、`client-v2.d.ts`，`src/client-v2/` 也已经暴露了少量公共 surface。
- 插件主体仍在 `src/client/`，包括设置页、AI 员工入口、ChatBox、工作上下文、LLM provider UI、MCP 设置、ACL 权限页等。
- `src/client/` 中大量依赖 v1 运行时：`@nocobase/client`、`SchemaComponent`、Formily、v1 workflow client、React Provider/Context、zustand。
- `src/client-v2/` 当前仍有 zustand store 和硬编码样式，不能作为最终迁移形态。
- `@nocobase/plugin-ai/client-v2` 已被其他插件消费，例如 `plugin-localization` 和 `plugin-data-visualization`，因此迁移必须保护公开 API 的稳定性。
- `plugin-ai-gigachat` 仍消费 `@nocobase/plugin-ai/client`，因此 `src/client/` 不能直接删除，只能逐步收敛成兼容入口。

本方案采用渐进式迁移：每个大块先在 `src/client-v2/` 实现对等功能并完成验收；验收通过后必须等待人工确认，才能修改 `src/client/` 用 v2 实现替换旧实现。任何小块都必须可以随时停止、随时继续。

## 总体目标

1. 在 `src/client-v2/` 中逐步实现与 v1 对等的 AI 插件能力。
2. `src/client-v2/` 完全遵守 v2 运行时边界，不依赖 v1 client、不依赖 Formily runtime、不依赖 zustand。
3. `src/client/` 保留为兼容入口，但核心实现尽量移入 `src/client-v2/`。
4. v2 功能验收通过前，不修改 v1 目录对应实现。
5. 每个大块 v2 验收通过后，经用户明确确认，再执行 v1 替换，并对替换结果单独验收。

## 状态定义

每个任务使用以下状态之一：

| 状态 | 含义 |
| --- | --- |
| 未开始 | 尚未动手 |
| 进行中 | 正在实现或审计 |
| V2 已实现 | `src/client-v2/` 对等功能已完成，但未验收 |
| V2 代码验收通过 | grep、类型、lint、单测等代码层面验收已通过 |
| V2 浏览器验收通过 | 必要时已通过 Kimi WebBridge 浏览器操作验收 |
| 待确认 V1 替换 | v2 验收通过，等待用户确认是否替换 v1 |
| V1 替换中 | 正在把 `src/client/` 旧实现改为引用 v2 |
| V1 替换验收通过 | v1 兼容入口替换后验收通过 |
| 完成 | 大块任务完整结束 |
| 阻塞 | 需要外部依赖、上游 v2 surface 或用户决策 |
| 跳过 | 明确不在本轮范围内 |

当前所有任务初始状态均为“未开始”，除“工作流节点配置迁移”为“跳过”。

## 迁移准则

### 一、迁移一定要做的工作

1. 先做 v2 对等实现，再做 v1 替换。
   - 每个小块先只修改 `src/client-v2/` 或必要的 v2 shim、package surface。
   - v2 验收通过前，不修改 `src/client/` 的对应实现。
   - v2 验收通过后，必须等待用户确认，才能执行 v1 替换。

2. 保持可断点续做。
   - 每个小块必须有独立目标、独立验收标准、独立状态。
   - 小块内避免跨多个业务域的大范围重构。
   - 每次结束时更新本 PRD 的任务状态和结论。

3. 遵守 v2 边界。
   - `src/client-v2/` 只能使用 `@nocobase/client-v2`、`@nocobase/flow-engine` 和 framework-neutral 工具。
   - `src/client-v2/` 不得引用 `@nocobase/client` 或任何 `@nocobase/client/...` 子路径。
   - `src/client-v2/` 不得引用其他插件的 `@nocobase/plugin-xxx/client`；只能使用 `/client-v2` 或 v2 registry/runtime API。
   - `src/client-v2/` 不得引用本插件 `src/client/`。

4. 模型迁移必须单源实现。
   - v1 `src/client/**/models` 或 `flow/models` 中的 FlowModel / ActionModel / FieldModel 迁到 `src/client-v2/models/`。
   - 原 v1 位置不保留重复实现。
   - v1 如仍需使用，改成相对路径引用 `../client-v2/models/...`。

5. 设置页必须使用 v2 页面范式。
   - 设置页自身不使用 `SchemaComponent`。
   - 使用纯 React + antd Form/Table/Drawer。
   - 通过 `pluginSettingsManager.addMenuItem` + `addPageTabItem({ componentLoader })` 注册。
   - CRUD 页必须确认主键，不默认使用 `id`。

6. 状态共享迁移到 FlowEngine 体系。
   - 不再用 zustand 做状态共享。
   - 使用 `flowModel`、`flowContext`、`observable`、`observe`。
   - `observable`、`observe` 从 `@nocobase/flow-engine` 导入，不从 `@formily/reactive` 导入。

7. ChatBox 契约必须保持。
   - `src/client/__tests__/chatbox/state-regression.test.ts` 必须通过。
   - `src/client/__tests__/chatbox/hooks-contract.test.ts` 必须通过。
   - 对外导出的 hooks/stores 在迁移期间保持兼容，除非单独约定 breaking change。

8. 公开 v2 surface 必须稳定。
   - 保留并整理 `client-v2.js`、`client-v2.d.ts`、`src/client-v2/index.tsx`。
   - 继续支持 `plugin-localization`、`plugin-data-visualization` 现有消费路径。
   - 新增公开导出要视为 API 合同。

9. 样式必须 v2 化。
   - 不从 v1 照搬硬编码 pixel、hex、rgba、固定间距、固定宽度。
   - 必要样式使用 antd v5 token。
   - 能使用 antd 默认样式时不做覆盖。

10. 验收分层执行。
    - 先做代码层面验收：grep、lint、类型、单测、定向构建。
    - 对涉及页面/交互的小块，代码验收通过后再用 Kimi WebBridge 做浏览器验收。
    - 浏览器验收只验证该小块用户路径，不扩大范围。

### 二、迁移里一定不能做的红线

1. 未经用户确认，不得在 v2 验收通过前替换或删除 `src/client/` 对应实现。
2. 不得在 `src/client-v2/` 引入 `@nocobase/client`。
3. 不得在 `src/client-v2/` 引入 `@nocobase/plugin-xxx/client`。
4. 不得在 `src/client-v2/` 引入 `@formily/*` runtime。
5. 不得在 `src/client-v2/` 使用 zustand。
6. 不得用 React Provider/Context 发布全局对话状态。
7. 不得把 v1 工作流节点配置迁入 v2；本轮跳过 workflow 节点配置依赖。
8. 不得修改 core，除非用户另行明确要求。
9. 不得同时维护 v1/v2 两套同名 model 实现。
10. 不得用 `any` 或 `as any` 掩盖迁移缺口；必须使用具体类型、泛型或 `unknown` 加类型收窄。
11. 不得用硬编码样式绕过 v2 token 规则。
12. 不得让设置页 submit 出现“未发请求但显示成功”的 silent fallthrough。
13. 不得在 `filterByTk` 中默认使用 `record.id`，必须按集合主键写。
14. 不得为缺少 v2 入口的上游插件临时引用 v1 client；必须跳过、替代或补齐上游 v2 surface。
15. 不得在未完成定向验证时报告任务完成。

## 通用执行流程

每个小块任务都按以下顺序执行：

1. 更新本 PRD 中该任务状态为“进行中”。
2. 审计该小块涉及的 v1 文件、依赖、测试和外部消费者。
3. 只在 `src/client-v2/` 实现对等功能；必要时只改根级 v2 shim 或 v2 package surface。
4. 执行代码层面验收。
5. 如果小块涉及 UI、设置页、对话框、权限页、ChatBox 打开方式，则必要时启用 Kimi WebBridge 做浏览器验收。
6. v2 验收通过后，更新状态为“待确认 V1 替换”，并向用户报告验收结果。
7. 等用户确认后，才修改 `src/client/` 对应代码，改为相对路径引用 v2 或兼容 re-export。
8. 执行 v1 替换验收。
9. 更新本 PRD 中任务状态、验收记录和剩余风险。

## 已知跨插件依赖处理

| 依赖 | 当前用法 | 上游 v2 状态 | 迁移策略 |
| --- | --- | --- | --- |
| `@nocobase/plugin-workflow/client` | workflow instruction/trigger、变量输入、`JOB_STATUS`、工作流任务列表 | 无 `client-v2` 入口 | 本轮跳过工作流节点配置；不得进入 `src/client-v2` |
| `@nocobase/plugin-file-manager/client` | `UploadFieldModel`、上传相关逻辑 | 有 `client-v2`，导出 `UploadFieldModel` | v2 改用 `@nocobase/plugin-file-manager/client-v2` |
| `@nocobase/plugin-acl/client` | ACL settings tab、`RolesManagerContext` | 有 `client-v2`，扩展点为 loader registry | v2 权限页改用 `PermissionTabProps` |
| `@nocobase/plugin-data-source-manager/client` | data modeling setup、datasource 能力 | 有 `client-v2` | v2 代码改用 `/client-v2` 或 FlowEngine datasource API |
| `@nocobase/plugin-ai/client` 被外部消费 | `plugin-ai-gigachat` 等 v1 插件 | 本插件自身提供 v1 entry | 保留兼容入口，后续逐步 re-export v2 |
| `@nocobase/plugin-ai/client-v2` 被外部消费 | `plugin-localization`、`plugin-data-visualization` | 已存在 | 保护公开导出和 hooks/stores 契约 |

## 集合主键审计

| 集合 | 主键 | 迁移影响 |
| --- | --- | --- |
| `aiEmployees` | `username` | Table `rowKey="username"`；update/delete `filterByTk: record.username` |
| `llmServices` | `name` | Table `rowKey="name"`；update/delete `filterByTk: record.name` |
| `aiMcpClients` | `name` | Table `rowKey="name"`；update/delete `filterByTk: record.name` |
| `aiContextDatasources` | 默认 `id` | 可使用 `id`，但仍需从 collection meta 或返回数据确认 |
| `aiConversations` | `sessionId` | ChatBox 会话相关请求不得假设 `id` |
| `aiMessages` | `messageId` | 消息更新/流式处理按 message id 处理 |
| `aiWorkflowTasks` | `id` 或服务层定义 | 本轮 ChatBox 任务列表若迁移需单独确认 |

## 大块任务拆分

### A. 迁移地基和公开 surface 盘点

状态：未开始

目标：建立迁移期间的 v2 入口、公共导出、类型和上下文基础，确保后续任务可以独立推进。

#### A1. v2 入口结构整理

- 状态：完成
- 依赖：无
- 范围：
  - `src/client-v2/index.tsx`
  - 新增 `src/client-v2/plugin.tsx`
  - 新增或整理 `src/client-v2/locale.ts`
- V2 实现：
  - `index.tsx` 导出 default plugin 和公开 API。
  - `plugin.tsx` 继承 `Plugin<any, Application>`。
  - `locale.ts` 提供 `useT`、`tExpr`，`tExpr` 只能从本文件导出给本插件使用。
- 代码验收：
  - `src/client-v2` 中无 `@nocobase/client`。
  - `tExpr` 不从 `@nocobase/flow-engine` 直接在业务文件导入。
  - `client-v2.js` / `client-v2.d.ts` 可解析到 `dist/client-v2`。
- 浏览器验收：
  - 不需要。
- V1 替换门禁：
  - 不涉及 v1 替换。
- 验收记录：
  - 已新增 `src/client-v2/plugin.tsx`，`PluginAIClientV2` 继承 `Plugin<any, Application>`，入口逻辑从 `index.tsx` 拆出。
  - 已新增 `src/client-v2/locale.ts`，提供 `NAMESPACE`、`useT`、`useAITranslation`、`tExpr`；业务文件未直接从 `@nocobase/flow-engine` 导入 `tExpr`。
  - `src/client-v2/index.tsx` 保留 default plugin 与既有公开 API 导出。
  - `client-v2.js` / `client-v2.d.ts` 仍解析到 `dist/client-v2`。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/index.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/plugin.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/locale.ts` 通过。
  - `tsc --noEmit` 定向检查 `plugin.tsx`、`locale.ts` 通过；完整 `index.tsx` 导出图检查被既有 `src/client-v2/ai-employees/chatbox/stores/chat-box.ts` 类型错误阻断，属于 B 块范围。

#### A2. `AIConfigRepository` 和 FlowEngine context

- 状态：V1 替换验收通过
- 依赖：A1
- 范围：
  - `src/client-v2/repositories/AIConfigRepository.ts`
  - `src/client-v2/repositories/hooks/useAIConfigRepository.ts`
  - `src/client-v2/plugin.tsx`
- V2 实现：
  - `AIConfigRepository` 使用 `define`、`observable` 从 `@nocobase/flow-engine` 导入。
  - 在 `plugin.load()` 中通过 `flowEngine.context.defineProperty('aiConfigRepository', { value })` 注册。
  - 传入 `toolsManager` 时使用 v2 类型或最小结构类型。
- 代码验收：
  - 无 `@formily/reactive`。
  - 无 `any`；API response 使用明确 envelope 类型或 `unknown` 收窄。
  - repository refresh 缓存行为与 v1 一致。
- 浏览器验收：
  - 不单独需要；后续页面/ChatBox 间接验收。
- V1 替换门禁：
  - v2 验收后，经用户确认，将 `src/client/repositories/*` 改为相对路径 re-export v2。
- 验收记录：
  - `AIConfigRepository` 保持 v1 缓存与 in-flight 复用流程，`define` / `observable` 从 `@nocobase/flow-engine` 导入。
  - API resource 响应统一以 `unknown` 接收，并通过类型守卫收窄为 `LLMServiceItem`、`AIEmployee`、`ToolsEntry`、`SkillsEntry`。
  - `plugin.load()` 通过 `flowEngine.context.defineProperty('aiConfigRepository', { value })` 注册 repository，并传入 v2 `toolsManager.listTools`，保留前端工具注册合并路径。
  - 新增 `src/client-v2/repositories/__tests__/AIConfigRepository.test.ts` 覆盖 get 缓存、refresh 重新请求、并发 in-flight 复用、toolsManager 优先路径。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/plugin.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/repositories/AIConfigRepository.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/repositories/hooks/useAIConfigRepository.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/repositories/__tests__/AIConfigRepository.test.ts` 通过。
  - `tsc --noEmit` 定向检查 `plugin.tsx`、repository、hook 和 repository test 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/repositories/__tests__/AIConfigRepository.test.ts --run --reporter=verbose` 通过。
- V1 替换验收记录：
  - `src/client/repositories/AIConfigRepository.ts` 已改为从 `src/client-v2/repositories/AIConfigRepository.ts` re-export。
  - `src/client/repositories/hooks/useAIConfigRepository.ts` 已改为从 `src/client-v2/repositories/hooks/useAIConfigRepository.ts` re-export。
  - `src/client/repositories` 中不再包含 `@formily/reactive`、`@nocobase/client`、`AIConfigRepository` 重复实现。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client/repositories/AIConfigRepository.ts packages/plugins/@nocobase/plugin-ai/src/client/repositories/hooks/useAIConfigRepository.ts` 通过。
  - `tsc --noEmit` 定向检查 v1/v2 repository 与 hook 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/repositories/__tests__/AIConfigRepository.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/model.test.ts --run --reporter=verbose` 通过。

#### A3. 公开 API 合同冻结

- 状态：完成
- 依赖：A1
- 范围：
  - `src/client-v2/index.tsx`
  - 外部消费方 import 审计记录
- V2 实现：
  - 明确保留：`AIEmployeeShortcut`、`AIEmployeeProfileCard`、`avatars`、`formatModelLabel`、AI 类型、chatbox hooks/stores、`AIConfigRepository`、features。
  - 对外导出不暴露内部实现路径。
- 代码验收：
  - `plugin-localization` 和 `plugin-data-visualization` 当前 import 均可从 `client-v2` 找到导出。
  - TypeScript 声明路径完整。
- 浏览器验收：
  - 不单独需要。
- V1 替换门禁：
  - 不涉及 v1 替换。
- 验收记录：
  - 外部消费方审计确认当前仅有 `plugin-localization` 和 `plugin-data-visualization` 从 `@nocobase/plugin-ai/client-v2` 导入。
  - `plugin-localization` 当前导入：`AIEmployeeShortcut`、`formatModelLabel`、`AIEmployee`、`Task`。
  - `plugin-data-visualization` 当前导入：`useChatMessagesStore`、`useAIConfigRepository`、`useChatBoxStore`、`useChatBoxActions`、`AIEmployeeProfileCard`、`avatars`、`ChatEditorRef`、`Task`。
  - `src/client-v2/index.tsx` 已保留以上导出，并继续导出 `AIConfigRepository`、features、chatbox stores/hooks、AI employee profile/shortcut、avatar、model label 和 AI 类型；新增公开导出 `LLMServiceItem`，避免 repository 相关类型依赖内部路径。
  - `client-v2.d.ts` 已补齐 `export { default } from './dist/client-v2'`，与其他 v2 插件声明 shim 保持一致。
  - 新增 `src/client-v2/__tests__/public-api-contract.test.ts` 覆盖当前公开 API value/type surface。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/index.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
  - 使用临时 tsconfig 继承仓库 `tsconfig.json` 并 include A3 契约测试、`plugin-localization` 消费文件、`plugin-data-visualization` 两个消费文件，`tsc -p <temp>` 通过。
  - `nocobase-code-review` 审查 A 大块当前变更，无 Must Fix / Should Fix 问题。

### B. ChatBox 状态与 hooks v2 迁移

状态：进行中

目标：先在 v2 中实现完整 ChatBox 状态和 hooks 契约，替换当前 v2 下的 zustand 精简实现，并通过两份指定测试。

#### B1. 设计 observable store facade

- 状态：V2 代码验收通过
- 依赖：A2
- 范围：
  - `src/client-v2/ai-employees/chatbox/stores/*`
- V2 实现：
  - 删除 zustand 依赖，使用 `observable` / `observe`。
  - 保持兼容 API：`useXxxStore.use.field()`、`getState()`、`setState()`、action 方法。
  - store 实例挂在 FlowEngine context 或可复用的 v2 singleton factory，避免 React Provider。
- 代码验收：
  - `src/client-v2` grep 无 `zustand`。
  - `src/client-v2` grep 无 `@formily/reactive`。
  - store action 具备稳定引用，React hook 能触发重渲染。
- 浏览器验收：
  - 不单独需要。
- V1 替换门禁：
  - 暂不替换 v1，先完成 B2-B5。
- 验收记录：
  - 已新增 `createObservableStore` facade，内部使用 `observable.shallow` / `observe` 和 `useSyncExternalStore`，保留 zustand 兼容调用形态：store callable hook、`use.field()`、`getState()`、`setState()`、`subscribe()`、action 方法。
  - `chat-box`、`chat-conversations`、`chat-messages` 已切换为 v2 observable store，业务 action 逻辑保持不变。
  - `getState()` 旧快照不会被后续 `setState()` 原地污染，支持 `setState(previousState, true)` restore 场景；普通状态更新后 action 引用保持稳定。
  - 新增 `src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx` 覆盖 action 引用稳定、React hook 重渲染、replace restore 兼容。
  - `rg -n "zustand|@formily/reactive" packages/plugins/@nocobase/plugin-ai/src/client-v2` 无命中。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/create-selectors.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-box.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-conversations.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-messages.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/state-regression.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/hooks-contract.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/ai-coding/context-tools.test.ts --run --reporter=verbose` 通过。
  - 按本小块门禁暂不替换 v1，继续 B2-B5。

#### B2. 迁移 chatbox stores 完整状态

- 状态：V2 代码验收通过
- 依赖：B1
- 范围：
  - `chat-box`
  - `chat-conversations`
  - `chat-messages`
  - `chat-tool-call`
  - `chat-tools`
  - `workflow-tasks`
- V2 实现：
  - 从 v1 完整 store 行为迁移到 v2 observable store。
  - 保留 draft session、session migrate、parallel session isolation、tool call interrupt、workflow task unread 等行为。
- 代码验收：
  - `state-regression.test.ts` 中覆盖的 fixture 行为不退化。
  - store reset 能独立清理每个 store。
- 浏览器验收：
  - 不单独需要。
- V1 替换门禁：
  - 暂不替换 v1，先完成 B3-B5。
- 验收记录：
  - 已在 `src/client-v2/ai-employees/chatbox/stores/` 新增 `chat-tool-call.ts`、`chat-tools.ts`、`workflow-tasks.ts`，补齐 B2 范围内完整 ChatBox store surface。
  - 三个新增 store 均使用 B1 `createObservableStore` facade 和 `getOrCreateGlobalStore` singleton，不引入 zustand、Formily runtime、v1 client 或 v1 相对路径。
  - `workflow-tasks.ts` 在 v2 内定义 `WorkflowTask` / `WorkflowTaskDetail` 类型，避免从 v1 `conversations/common` 反向导入；索引签名使用 `unknown`。
  - 新增 `src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts` 覆盖 tool-call session 隔离与迁移、chat-tools 索引版本、workflow task direct/functional setter。
  - `rg -n "zustand|@formily/reactive" packages/plugins/@nocobase/plugin-ai/src/client-v2` 无命中。
  - `rg -n "\bany\b|zustand|@formily/reactive|@nocobase/client|@nocobase/plugin-.*/client|src/client" packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tool-call.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tools.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/workflow-tasks.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts` 无命中。
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tool-call.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tools.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/workflow-tasks.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose` 中 `observable-store.test.tsx` 通过；`chatbox-stores.test.ts` 已单独通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/state-regression.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/hooks-contract.test.ts --run --reporter=verbose` 通过。
  - 按本小块门禁暂不替换 v1，继续 B3-B5。

#### B3. 迁移 chatbox hooks 完整契约

- 状态：待确认 V1 替换
- 依赖：B2
- 范围：
  - `useChat`
  - `useChatBoxActions`
  - `useChatConversationActions`
  - `useChatMessageActions`
  - `useToolCallActions`
  - `useWorkflowTasks`
  - `useUploadFiles`
  - `useLoadMoreObserver`
- V2 实现：
  - v1 hooks 行为迁入 v2。
  - `uid()` 改为 `randomId()`。
  - `useAPIClient` / `useApp` 改为 v2 hook 或 `useFlowContext`。
  - `UploadFieldModel` 从 `@nocobase/plugin-file-manager/client-v2` 引入。
  - workflow v1-only 的 `JOB_STATUS` 若仍需用于 ChatBox 任务列表，先抽为本插件常量或服务返回状态映射，不从 workflow client 引入。
- 代码验收：
  - `hooks-contract.test.ts` 通过。
  - `state-regression.test.ts` 通过。
  - `src/client-v2` 无 `@nocobase/plugin-file-manager/client`。
  - `src/client-v2` 无 `@nocobase/plugin-workflow/client`。
- 浏览器验收：
  - 仅当 hooks 影响已可打开的 v2 ChatBox 时执行。
- V1 替换门禁：
  - 两份测试通过后，更新状态为“待确认 V1 替换”。
- 验收记录：
  - 已在 `src/client-v2/ai-employees/chatbox/hooks/` 补齐 `useChat`、`useChatConversationActions`、`useChatMessageActions`、`useToolCallActions`、`useWorkflowTasks`、`useUploadFiles`、`useLoadMoreObserver`，并将 `useChatBoxActions` 从精简版替换为完整契约版本。
  - 已新增 v2 辅助文件 `chatbox/model.ts`、`chatbox/utils.ts`、`chatbox/roles.ts`、`ai-employees/flow/index.ts`、`debug-logger.ts`，避免 v2 反向引用 v1 实现。
  - `uid()` 已替换为 `randomId()`；`useAPIClient` / v1 `useApp` 已改为 `@nocobase/client-v2` `useApp()` + `app.apiClient`。
  - `UploadFieldModel` 已改用 `@nocobase/plugin-file-manager/client-v2`；workflow `JOB_STATUS` 已在本插件 hook 内定义必要映射，不再从 `@nocobase/plugin-workflow/client` 引入。
  - `src/client-v2/ai-employees/chatbox`、`src/client-v2/debug-logger.ts`、`src/client-v2/ai-employees/types.ts` 定向 grep 无 `zustand`、`@formily`、v1 client、workflow v1 client、file-manager v1 client、`uid()`、`any` / `as any` 命中。
  - `yarn eslint --fix` 覆盖 B3 触达的 v2 hook、types、utils、debug、flow、selector 文件，通过且无 warnings。
  - 使用临时 tsconfig 继承仓库 `tsconfig.json`，include B3 触达的 `src/client-v2/ai-employees/chatbox/**/*`、`types.ts`、`debug-logger.ts`、`flow/index.ts`，`tsc --noEmit` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/state-regression.test.ts --run --reporter=verbose` 通过。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/hooks-contract.test.ts --run --reporter=verbose` 通过。
  - 按门禁等待用户确认后，才能执行 B5 v1 chatbox stores/hooks 替换。

#### B4. v2 ChatBox hook 对外兼容验收

- 状态：待确认 V1 替换
- 依赖：B3
- 范围：
  - `src/client-v2/index.tsx` exports
  - 外部消费方 import 编译检查
- V2 实现：
  - 对外导出保持 `useChatBoxStore`、`useChatMessagesStore`、`useChatConversationsStore`、`useChatBoxActions`。
- 代码验收：
  - `plugin-data-visualization` 对 `plugin-ai/client-v2` 的 imports 可类型检查。
  - `plugin-localization` 对 `plugin-ai/client-v2` 的 imports 可类型检查。
- 浏览器验收：
  - 不单独需要。
- V1 替换门禁：
  - 经用户确认后，将 v1 chatbox stores/hooks 改为相对路径 re-export v2。
- 验收记录：
  - 已审计当前 `@nocobase/plugin-ai/client-v2` 外部消费方，仍仅有 `plugin-localization` 和 `plugin-data-visualization`。
  - `src/client-v2/index.tsx` 保留 `useChatBoxStore`、`useChatMessagesStore`、`useChatConversationsStore`、`useChatBoxActions` 导出。
  - `plugin-data-visualization` 当前消费 `useChatMessagesStore`、`useAIConfigRepository`、`useChatBoxStore`、`useChatBoxActions`、`AIEmployeeProfileCard`、`avatars`、`ChatEditorRef`、`Task`，均可从 `client-v2` 解析。
  - `plugin-localization` 当前消费 `AIEmployeeShortcut`、`formatModelLabel`、`AIEmployee`、`Task`，均可从 `client-v2` 解析。
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
  - 使用最小临时 tsconfig 继承 `tsconfig.paths.json`，并定向 include `src/client-v2/index.tsx`、公开契约测试、`plugin-localization` 消费文件、`plugin-data-visualization` 两个消费文件，`tsc --noEmit` 通过。
  - 本小块不涉及浏览器验收；按门禁等待用户确认后，才能执行 B5 v1 chatbox stores/hooks 替换。

#### B5. v1 chatbox 替换

- 状态：未开始
- 依赖：B4 且用户确认
- 范围：
  - `src/client/ai-employees/chatbox/stores/*`
  - `src/client/ai-employees/chatbox/hooks/*`
- V1 替换：
  - 删除重复实现或改成从 `../../../../client-v2/...` re-export。
  - v1 UI 继续使用同一 v2 store/hook 契约。
- V1 替换验收：
  - 两份 chatbox 测试继续通过。
  - `src/client/ai-employees/chatbox/stores` 不再有 zustand 实现。
  - 无重复 store 逻辑。

### C. ChatBox UI 与 AI 员工入口

状态：未开始

目标：在 v2 中实现可打开、可交互、可嵌入的 ChatBox UI，并把 AI 员工入口改成通过 FlowModel action / flow handler 使用 `ctx.viewer` embed 模式打开。

#### C1. v2 ChatBox UI 组件迁移

- 状态：未开始
- 依赖：B3
- 范围：
  - `src/client-v2/ai-employees/chatbox/components/*`
  - markdown/tool card/conversation list/attachments/sender 等 UI
- V2 实现：
  - 从 v1 迁移 UI，但去除 v1 client import、SchemaComponent、Formily runtime。
  - 样式改用 antd token 或默认样式。
  - v1 中通过 `Schema.compile` 编译的 server-returned title 改用 `useT()`。
- 代码验收：
  - `src/client-v2` 无 `SchemaComponent`。
  - `src/client-v2` 无硬编码 px/hex/rgba。
  - `src/client-v2` 无 `@nocobase/client`。
- 浏览器验收：
  - 使用 Kimi WebBridge 打开 v2 页面中的 ChatBox。
  - 验证打开、关闭、切换员工、切换模型、发送草稿、附件展示、会话列表基础路径。
- V1 替换门禁：
  - v2 浏览器验收通过后等待用户确认。

#### C2. AI 员工入口 viewer embed 打开

- 状态：未开始
- 依赖：C1
- 范围：
  - `AIEmployeeShortcut`
  - AI employee action model
  - Flow handler
- V2 实现：
  - 点击 AI 员工入口时，在 FlowModel action 或 flow handler 内通过 `ctx.viewer` embed 模式打开对话窗口。
  - 不使用 React Provider/Context 发布全局对话状态。
  - 入口可以传入 workContext、tasks、autoSend 等参数。
- 代码验收：
  - click handler 中可以拿到 FlowContext 或明确传入的 ctx。
  - 没有 `this.app.use(AIEmployeesProvider)` 类似状态 Provider。
- 浏览器验收：
  - 在 v2 block/action 里点击 AI 员工入口能打开 embed ChatBox。
  - workContext 能带入当前 FlowModel。
- V1 替换门禁：
  - v2 验收通过后等待用户确认。

#### C3. v1 AIEmployeesProvider 收敛

- 状态：未开始
- 依赖：C2 且用户确认
- 范围：
  - `src/client/ai-employees/AIEmployeesProvider.tsx`
  - `src/client/index.tsx`
- V1 替换：
  - 移除或降级 `this.app.use(AIEmployeesProvider)` 的全局状态职责。
  - v1 如仍需兼容入口，只挂载必要的 v1-only UI，不发布全局对话状态。
- V1 替换验收：
  - v1 页面不因缺少 Provider 崩溃。
  - ChatBox 状态来源仍为 v2 store/context。

### D. FlowModels 和 AI action 模型迁移

状态：未开始

目标：把 AI 员工 shortcut/action FlowModel 移入 v2，保留 v1 可用性但不维护两套实现。

#### D1. 迁移 AIEmployeeShortcutModel 系列

- 状态：未开始
- 依赖：A2、B3、C1
- 范围：
  - `src/client/ai-employees/flow/models/AIEmployeeActionModel.tsx`
  - `AIEmployeeShortcutModel.tsx`
  - `AIEmployeeShortcutListModel.tsx`
  - `index.ts`
  - 目标：`src/client-v2/models/ai-employees/*`
- V2 实现：
  - v2 模型只引用 `@nocobase/client-v2` 或 `@nocobase/flow-engine`。
  - v1 `ActionModel` 等改用 v2 可用 ActionModel/FlowModel API。
  - `tExpr` 从 `src/client-v2/locale.ts` 导入。
  - 设置表单中 Formily 字段改为 v2 registerFlow + antd/FlowEngine 支持组件。
- 代码验收：
  - `src/client-v2/models` 无 `@nocobase/client`。
  - `src/client-v2/models` 无 Formily runtime。
  - `registerModelLoaders` 可加载模型。
- 浏览器验收：
  - v2 页面/action 菜单能看到 AI employees action。
  - 能创建、配置、删除 AI employee shortcut。
- V1 替换门禁：
  - v2 验收通过后等待用户确认。

#### D2. v1 FlowModel 替换

- 状态：未开始
- 依赖：D1 且用户确认
- 范围：
  - `src/client/ai-employees/flow/models/*`
  - `src/client/index.tsx` model 注册
- V1 替换：
  - v1 model 文件删除或改为相对路径 re-export v2。
  - v1 注册引用 v2 model。
- V1 替换验收：
  - `src/client/ai-employees/flow/models` 不再有重复实现。
  - v1 编译通过。
  - v1 action 菜单不退化。

#### D3. Datasource 设置模型处理

- 状态：未开始
- 依赖：F4
- 范围：
  - `src/client/ai-employees/admin/datasource/flow-models/*`
- V2 实现：
  - 如果 datasource 设置页改为纯 React CRUD，该 FlowModel 不迁入 v2。
  - 如果仍需 designable/resource 模型，迁到 `src/client-v2/models/datasource/*`，并去掉 `@nocobase/client` 的 `DEFAULT_DATA_SOURCE_KEY` 引用。
- 代码验收：
  - 不存在 v1/v2 重复模型实现。
- 浏览器验收：
  - 跟随 F4 datasource 页面验收。
- V1 替换门禁：
  - 跟随 F4。

### E. LLM provider 和 AIManager v2 化

状态：未开始

目标：迁移 LLM provider 注册、provider settings form、model label、tool/workContext registry，使设置页和 ChatBox 能使用 v2 surface。

#### E1. AIManager v2 类型与注册表

- 状态：未开始
- 依赖：A2
- 范围：
  - `src/client-v2/manager/*`
  - `src/client-v2/features/*`
- V2 实现：
  - `AIManager` 移入 v2 或补齐 v2 版本。
  - `ToolOptions`、`ToolsEntry`、`SkillsEntry` 使用 v2 类型或本插件 shared 类型。
  - `chatSettings`、`llmProviders`、`workContext` 保持行为。
- 代码验收：
  - 无 `@nocobase/client` 类型导入，除非是 type-only 且确认无 v2 替代；优先不用。
  - 外部 provider 插件仍可注册。
- 浏览器验收：
  - 不单独需要。
- V1 替换门禁：
  - v2 provider 设置页验收后再替换 v1。

#### E2. 内置 LLM providers v2 form

- 状态：未开始
- 依赖：E1
- 范围：
  - `llm-providers/*`
  - provider settings/model settings components
- V2 实现：
  - SchemaComponent/Formily 表单改为 antd Form。
  - `TextAreaWithGlobalScope` 等变量输入按 v2 decision table 改用 `VariableInput` / `VariableTextArea` / `EnvVariableInput`。
  - API key 等单行 `$env` 字段使用 `EnvVariableInput password`。
- 代码验收：
  - `src/client-v2/llm-providers` 无 SchemaComponent/Formily runtime。
  - provider settings value shape 与 v1 持久化一致。
- 浏览器验收：
  - 至少验证 OpenAI/Responses、OpenAI-compatible、DashScope、Ollama 的创建和编辑表单。
- V1 替换门禁：
  - v2 settings page 验收通过后等待用户确认。

#### E3. v1 LLM provider 兼容导出

- 状态：未开始
- 依赖：E2 且用户确认
- 范围：
  - `src/client/llm-providers/*`
  - `src/client/manager/*`
- V1 替换：
  - 能 re-export v2 的组件优先 re-export。
  - 仍被 v1 workflow 配置强依赖的组件留在 v1，标记为 v1-only。
- V1 替换验收：
  - `plugin-ai-gigachat` 的 `@nocobase/plugin-ai/client` imports 不破坏。
  - v1 workflow node settings 不退化。

### F. 设置页 v2 对等实现

状态：未开始

目标：按 `settings-page-crud.md` 模板迁移设置页。每个页面先 v2 实现和验收，再决定是否替换 v1。

#### F1. AdminSettings 页面

- 状态：未开始
- 依赖：A2
- 范围：
  - `src/client-v2/pages/AdminSettingsPage.tsx`
- V2 实现：
  - antd `Card` + `Form`。
  - 加载 `aiSettings.get/publicGet`，保存 `aiSettings.update({ filterByTk: 1 })`。
  - 文件 storage 选择用 v2 `RemoteSelect` 或原生 Select + API。
- 代码验收：
  - 无 SchemaComponent/Formily。
  - 保存成功只在 update 请求完成后提示。
- 浏览器验收：
  - 打开 AI settings，修改 storage，保存，刷新后值仍正确。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### F2. Employees 页面

- 状态：未开始
- 依赖：A2、E1
- 范围：
  - `src/client-v2/pages/EmployeesPage.tsx`
  - employee form 子组件
- V2 实现：
  - antd Table + category segmented/radio + create/edit Drawer。
  - `rowKey="username"`。
  - create/update/delete 使用 `aiEmployees` resource。
  - Tabs 下所有 Form.Item 共用一个 Form 时每个 tab `forceRender: true`。
  - profile、prompt、model、skills、tools、knowledge base 等拆成独立子组件。
- 代码验收：
  - create 调 `resource.create`。
  - edit 调 `resource.update({ filterByTk: username })`。
  - delete 调 `resource.destroy({ filterByTk: username })`。
  - 无 silent fallthrough。
- 浏览器验收：
  - 列表加载、分类切换、启用开关、创建、编辑、删除。
  - 重点验证非 `id` 主键。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### F3. LLMServices 页面

- 状态：未开始
- 依赖：E1、E2
- 范围：
  - `src/client-v2/pages/LLMServicesPage.tsx`
  - LLM test flight、enabled models、model options
- V2 实现：
  - antd Table + Drawer。
  - `rowKey="name"`。
  - provider title 用 `useT()` 编译 server-returned `{{t(...)}}`。
  - provider form 动态组件用 async loader 或 registry，不同步硬 import 大量 provider UI。
- 代码验收：
  - create/update/delete 请求覆盖。
  - update/delete 使用 `filterByTk: name`。
  - 无 Schema.compile/Formily。
- 浏览器验收：
  - 添加 LLM service、编辑 provider options、启用/停用、删除。
  - 测试连接按钮能发请求并反馈。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### F4. MCPSettings 页面

- 状态：未开始
- 依赖：A2
- 范围：
  - `src/client-v2/pages/MCPSettingsPage.tsx`
  - MCP tools list、test connection、rebuild client
- V2 实现：
  - antd Table + Drawer。
  - `rowKey="name"`。
  - `args/env/headers/restart` value shape 与 v1 一致。
  - create/edit 前保留 test connection 逻辑。
  - mutation 后触发 rebuild client。
- 代码验收：
  - create/update/delete 请求覆盖。
  - update/delete 使用 `filterByTk: name`。
  - no silent fallthrough。
- 浏览器验收：
  - 创建 stdio/http/sse 三类配置。
  - test connection、启用开关、查看 tools、删除。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### F5. Datasource 页面

- 状态：未开始
- 依赖：A2
- 范围：
  - `src/client-v2/pages/DatasourceSettingsPage.tsx`
  - datasource form/grid 子组件
- V2 实现：
  - 优先纯 React + antd CRUD。
  - 如需要 collection/filter 配置能力，使用 `@nocobase/client-v2` 现有组件，不引入 v1。
  - schema-only collection `aiContextDatasources` 的字段、filter、sort value shape 与 v1 一致。
- 代码验收：
  - 无 `@nocobase/client`。
  - 无 Formily runtime。
  - create/update/delete 请求正确。
- 浏览器验收：
  - 新增 datasource、选择数据源/collection/fields/filter/sort、保存、编辑、删除。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### F6. 设置菜单注册替换

- 状态：未开始
- 依赖：F1-F5
- 范围：
  - `src/client-v2/plugin.tsx`
- V2 实现：
  - `addMenuItem({ key: 'ai', showTabs: true })`。
  - `addPageTabItem` keys：`employees`、`llm-services`、`mcp-settings`、`datasource`、`settings`。
  - 所有页面使用 `componentLoader`。
- 代码验收：
  - 无 `Component:` eager settings registration。
  - key/menuKey 不含 `.`。
- 浏览器验收：
  - `/admin/settings/ai/...` 下 tab 导航可用。
- V1 替换门禁：
  - v2 设置页整体验收通过后等待用户确认。

#### F7. v1 设置页替换

- 状态：未开始
- 依赖：F6 且用户确认
- 范围：
  - `src/client/index.tsx` settings registration
  - `src/client/admin-settings/*`
  - `src/client/ai-employees/admin/*`
  - `src/client/llm-services/*`
- V1 替换：
  - v1 设置页入口尽量 re-export v2 页面或改为轻量兼容包装。
  - 仍被 workflow v1 配置使用的组件保留为 v1-only，并在文件头注释说明。
- V1 替换验收：
  - v1 settings 路径不崩溃。
  - v2 settings 路径不回退。
  - `Script error for ".../client"` 风险消除。

### G. ACL 权限页 v2 集成

状态：未开始

目标：将 AI employees 权限 tab 改为 ACL v2 registry 扩展点。

#### G1. v2 PermissionsTab

- 状态：未开始
- 依赖：A1、F2
- 范围：
  - `src/client-v2/pages/permissions/PermissionsTab.tsx`
  - `src/client-v2/pages/permissions/Permissions.tsx`
- V2 实现：
  - 使用 `@nocobase/plugin-acl/client-v2` 的 `PermissionTabProps`。
  - 不使用 `RolesManagerContext`。
  - `allowNewAiEmployee` 用 antd Checkbox + `roles.update`。
  - AI employee 可用列表用 antd Table。
- 代码验收：
  - 无 SchemaComponent/Formily。
  - role update 成功后调用 `onRoleChange`。
  - `roles.aiEmployees` add/remove/set 请求正确。
- 浏览器验收：
  - 打开 ACL roles 页面，切到 AI employees tab。
  - 勾选默认允许、批量可用、单行可用，保存状态正确。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### G2. 注册 ACL v2 tab

- 状态：未开始
- 依赖：G1
- 范围：
  - `src/client-v2/plugin.tsx`
- V2 实现：
  - `this.app.pm.get(PluginACLClientV2)` 后调用 `settingsUI.addPermissionsTab({ key, label, componentLoader })`。
  - ACL v2 插件不存在时安全跳过。
- 代码验收：
  - import 从 `@nocobase/plugin-acl/client-v2`。
  - componentLoader lazy。
- 浏览器验收：
  - 跟随 G1。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### G3. v1 ACL 权限页替换

- 状态：未开始
- 依赖：G2 且用户确认
- 范围：
  - `src/client/ai-employees/permissions/*`
  - `src/client/index.tsx` ACL registration
- V1 替换：
  - v1 ACL 仍需保留时包装 v2 或标记 v1-only。
  - 不在 v2 中引用 v1 `RolesManagerContext`。
- V1 替换验收：
  - v1 ACL 页面不崩溃。
  - v2 ACL tab 正常。

### H. 工作上下文、工具和 data/modeling 能力

状态：未开始

目标：将非 workflow 的 AI tools、work contexts 和 data/modeling 能力迁到 v2 registry，不把 v1-only workflow 配置带入。

#### H1. WorkContext registry v2 化

- 状态：未开始
- 依赖：E1、C1
- 范围：
  - `src/client-v2/ai-employees/context/*`
- V2 实现：
  - `flow-model`、`datasource`、`code-editor`、`chart-config` 等 workContext 注册迁到 v2。
  - 与 ChatBox contextItems 的 value shape 保持一致。
- 代码验收：
  - 无 `@nocobase/client`。
  - 无 React Provider 发布全局状态。
- 浏览器验收：
  - 从 v2 ChatBox 添加 flow-model/datasource context。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### H2. AI tools v2 注册

- 状态：未开始
- 依赖：E1
- 范围：
  - data modeling、chart generator、business report、ai coding、suggestions、sub agents、workflow task output 等非 workflow 配置工具
- V2 实现：
  - 工具注册改为 v2 `toolsManager` 可消费的结构。
  - UI card/modal 使用 v2 公开类型和 antd token。
  - workflow 节点配置类工具保持 v1-only。
- 代码验收：
  - 无 `@nocobase/client` runtime。
  - tool modal 动态加载，不同步加载所有重 UI。
- 浏览器验收：
  - ChatBox 中 tool call card/modal 可展示。
- V1 替换门禁：
  - 验收通过后等待用户确认。

#### H3. v1 tools/context 替换

- 状态：未开始
- 依赖：H1-H2 且用户确认
- 范围：
  - `src/client/ai-employees/context/*`
  - `src/client/ai-employees/*/tools/*`
- V1 替换：
  - 能复用 v2 的迁到 re-export。
  - workflow v1-only 保留并标注。
- V1 替换验收：
  - ChatBox tools 不退化。
  - workflow v1 节点配置仍可用。

### I. v1 兼容入口收敛

状态：未开始

目标：在所有 v2 对等功能验收后，逐步把 `src/client/` 收敛为兼容入口，避免重复实现。

#### I1. client entry 分层

- 状态：未开始
- 依赖：B5、D2、F7、G3、H3
- 范围：
  - `src/client/index.tsx`
- V1 替换：
  - 保留 v1 workflow 注册。
  - 保留 gigachat 等外部 v1 插件需要的导出。
  - 其他可迁移导出改为相对路径指向 `../client-v2/...`。
- V1 替换验收：
  - `plugin-ai-gigachat` import 不破坏。
  - `src/client/index.tsx` 中非 workflow 的 v1 重实现明显减少。

#### I2. 删除重复实现

- 状态：未开始
- 依赖：I1
- 范围：
  - 已有 v2 对等实现的 v1 文件
- V1 替换：
  - 删除重复 model/store/hook 实现。
  - 保留 v1-only workflow 目录。
  - 保留必要兼容 shim。
- V1 替换验收：
  - `src/client/models` 或等价模型目录无重复实现。
  - grep 重复 store/model 关键类名只有 v2 实现或 v1 re-export。

#### I3. package 依赖收敛

- 状态：未开始
- 依赖：I2
- 范围：
  - `package.json`
- V1 替换：
  - 仅当 legacy `src/client/` 不再需要时，移除 `zustand`、`use-context-selector`、Formily 相关 devDependency。
  - 本轮若 workflow v1-only 仍需 Formily，则不强删。
- 验收：
  - build/test 不缺依赖。
  - 没有为 v2 保留不必要依赖。

### J. 全局验证与发布前检查

状态：未开始

目标：每个大块完成后做局部验收；全部大块完成后做全局验收。

#### J1. 静态边界检查

- 状态：未开始
- 依赖：每个大块完成后执行
- 命令：
  - `rg -n "from ['\"]@nocobase/client|@nocobase/client/" packages/plugins/@nocobase/plugin-ai/src/client-v2`
  - `rg -n "@nocobase/plugin-[^'\"]+/client" packages/plugins/@nocobase/plugin-ai/src/client-v2`
  - `rg -n "from ['\"]@formily/|@formily/" packages/plugins/@nocobase/plugin-ai/src/client-v2`
  - `rg -n "zustand" packages/plugins/@nocobase/plugin-ai/src/client-v2`
  - `rg -n "style=\\{\\{|#[0-9a-fA-F]{3,8}|[0-9]+px|rgba\\(" packages/plugins/@nocobase/plugin-ai/src/client-v2`
- 验收：
  - 所有禁止项为 0，或剩余项有明确豁免记录。

#### J2. 定向测试

- 状态：未开始
- 依赖：B3 后开始，后续每次相关改动重复执行
- 命令：
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/state-regression.test.ts --run --reporter=verbose`
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client/__tests__/chatbox/hooks-contract.test.ts --run --reporter=verbose`
- 验收：
  - 两个测试全部通过。

#### J3. lint

- 状态：未开始
- 依赖：每个小块代码改动后执行
- 命令：
  - `yarn eslint --fix <touched-files>`
- 验收：
  - touched files 无 lint error。
  - 不通过新增 disable 注释绕过问题。

#### J4. build/start 风险检查

- 状态：未开始
- 依赖：每个大块完成后执行
- 命令：
  - 视改动范围执行插件定向 build 或仓库约定 build。
  - 检查 v2 bundle 是否还有 `.../client` script error 风险。
- 验收：
  - v2 bundle 不引用其他插件 v1 client。
  - 无 `Script error for ".../client"` 可预见路径。

#### J5. 浏览器验收

- 状态：未开始
- 依赖：对应 UI 小块代码验收通过
- 工具：
  - Kimi WebBridge
- 流程：
  - 先确认本地服务可访问。
  - 使用用户真实浏览器会话操作对应页面。
  - 每次只验证当前小块路径。
  - 截图或 snapshot 记录关键页面状态。
- 验收：
  - 操作路径与任务验收标准一致。
  - 若发现 UI/运行时问题，回到对应小块修复，不扩大范围。

## 本轮明确跳过

### W. 工作流节点配置迁移

- 状态：跳过
- 原因：
  - 工作流节点配置依赖 `@nocobase/plugin-workflow/client`。
  - 当前 `plugin-workflow` 没有 `client-v2` 入口。
  - 用户明确要求“工作流节点的配置依赖工作流 v1 的包，这部分这次不迁移”。
- 保留范围：
  - `src/client/workflow/**`
  - 仅 v1 workflow 注册与配置继续留在 v1。
- 红线：
  - 不得把 workflow node/trigger 配置 import 带入 `src/client-v2/`。
  - 不得为了迁移 plugin-ai 修改 workflow core 或 workflow 插件。

## 大块验收组织方式

每完成一个大块，必须提交以下结果：

1. 已完成小块列表和状态。
2. 修改文件列表。
3. v2 实现说明。
4. 代码层面验收结果。
5. 浏览器验收结果，若该大块需要浏览器验收。
6. 剩余风险和跳过项。
7. 是否进入“待确认 V1 替换”。

只有用户回复确认后，才能执行该大块的 v1 替换任务。v1 替换完成后，再单独报告：

1. v1 替换文件列表。
2. 删除了哪些重复实现。
3. 保留了哪些兼容层。
4. v1 替换验收结果。
5. 是否关闭该大块。

## 推荐执行顺序

1. A. 迁移地基和公开 surface 盘点
2. B. ChatBox 状态与 hooks v2 迁移
3. C. ChatBox UI 与 AI 员工入口
4. D. FlowModels 和 AI action 模型迁移
5. E. LLM provider 和 AIManager v2 化
6. F. 设置页 v2 对等实现
7. G. ACL 权限页 v2 集成
8. H. 工作上下文、工具和 data/modeling 能力
9. I. v1 兼容入口收敛
10. J. 全局验证与发布前检查

其中 B 是最高优先级，因为它有明确回归测试，并且被外部 v2 consumer 使用。F 可在 B 的 store/hook 契约稳定后并行拆小块推进，但每个设置页仍要独立验收。

## 当前初始状态快照

| 大块 | 状态 | 备注 |
| --- | --- | --- |
| A. 迁移地基和公开 surface 盘点 | 未开始 | 已有少量 v2 入口，需要整理 |
| B. ChatBox 状态与 hooks v2 迁移 | 未开始 | 当前 v2 下仍有 zustand |
| C. ChatBox UI 与 AI 员工入口 | 未开始 | 需要 viewer embed 打开 |
| D. FlowModels 和 AI action 模型迁移 | 未开始 | v1 flow models 需迁到 v2 |
| E. LLM provider 和 AIManager v2 化 | 未开始 | provider UI 仍大量 v1 SchemaComponent |
| F. 设置页 v2 对等实现 | 未开始 | 必须纯 React + antd CRUD |
| G. ACL 权限页 v2 集成 | 未开始 | 上游 ACL 有 v2 registry |
| H. 工作上下文、工具和 data/modeling 能力 | 未开始 | 需要避开 workflow v1-only |
| I. v1 兼容入口收敛 | 未开始 | 必须等各块 v2 验收和用户确认 |
| J. 全局验证与发布前检查 | 未开始 | 每块完成后重复执行 |
| W. 工作流节点配置迁移 | 跳过 | 本轮明确不迁移 |
