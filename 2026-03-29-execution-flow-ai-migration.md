# Execution Plan

## 原始计划

# 将 `client/src/ai` 收拢到 `flow/ai` 的迁移计划

## Summary

本次迁移目标是把当前 `packages/core/client/src/ai` 的前端 AI 管理能力收拢到 `packages/core/client/src/flow/ai` 下，同时**暂时保留对 `application` 的单点依赖**，不在这一步追求完全去除旧 `Application` 依赖。  
这样可以先完成目录归位和职责收拢，保证外部插件和现有 `app.aiManager` 接口不变，后续再做第二阶段抽象解耦。

本次计划的核心原则：

- `flow/ai` 内部允许暂时依赖 `packages/core/client/src/application`
- `Application` 继续负责实例化并挂载 `aiManager`
- 对外公共使用方式保持不变：`app.aiManager`、`this.ai.toolsManager`、`@nocobase/client` 的现有导出尽量不变
- 通过兼容转发层避免一次性改动所有外部 import

## Key Changes

### 1. 目录迁移与模块归位

将当前 `packages/core/client/src/ai` 的内容迁移到新的 `packages/core/client/src/flow/ai` 下，保持现有子结构基本不变：

- `ai-manager.ts`
- `tools-manager/`
- `skills-manager/`
- `utils.ts`
- `index.ts`

迁移后的职责定义：

- `flow/ai` 作为前端 AI 基础设施的归属目录
- 当前这层仍然是“前端 AI 薄壳”，主要负责前端 tools 注册、tools 列表聚合、React hooks/provider、类型导出
- 不在这一步把 plugin-ai 的业务逻辑并入 `flow`

### 2. 保留单点 `application` 依赖，不做上下文抽象

本次不引入新的 `AIAppLike` / `ToolInvokeContext` 抽象接口，继续沿用现有 `Application` 能力。

需要调整的地方：

- `flow/ai/ai-manager.ts` 继续依赖 `Application`
- `flow/ai/tools-manager/index.ts` 继续依赖 `Application`
- `flow/ai/tools-manager/types.ts` 中 `invoke(ctx, params)` 的上下文类型继续使用 `Application`

实现要求：

- 所有仅用于类型的 `Application` 引用改成 `import type`
- 避免因类型 import 变运行时 import 而产生不必要循环依赖
- 不修改 `invoke` 的签名，保持现有前端 tool 实现零改动可继续工作

### 3. Application 接线切到 `flow/ai`

调整 `packages/core/client/src/application/Application.tsx`：

- 将 `AIManager` 的 import 从旧 `../ai` 改为新 `../flow/ai`
- 继续在构造函数中执行 `this.aiManager = new AIManager(this)`
- `Application` 上的 `public aiManager: AIManager` 保持不变

这一步的目标是只改“来源路径”，不改实例化时机、不改挂载位置、不改运行时行为。

### 4. 保持旧导出兼容，避免外部调用面扩散

保留旧的 `packages/core/client/src/ai` 入口作为兼容转发层，而不是直接删除。

兼容策略：

- 旧 `src/ai/index.ts` 改为仅转发 `../flow/ai`
- 如有需要，旧 `src/ai/*` 子模块也保留最小转发，优先只保留 `index.ts` 级别兼容；如果构建或现有 import 证明有子路径使用，再补子路径转发
- `packages/core/client/src/index.ts` 继续 `export * from './ai'`，不改对外主入口
- 外部插件不需要因为这次迁移修改 `@nocobase/client` 的 import 写法

### 5. 明确本次不处理的内容

以下内容明确不在本次范围内，避免实现时顺手扩大改动：

- 不把 `app.aiManager` 从 `Application` 上移除
- 不把 `Plugin.ai` getter 改成别的获取方式
- 不把 `plugin-ai` 内部工具注册链改成 flow context 注入
- 不把 `flow/ai` 从 `application` 完全解耦
- 不修改 server 侧 `@nocobase/ai` 包
- 不重构 plugin-ai 自己的 `manager/ai-manager.ts`

## Public API / Interface Impact

本次对外接口应保持兼容，不允许引入行为变化。

需要显式保持不变的接口：

- `Application#aiManager`
- `Plugin#ai`
- `ToolsManager#listTools()`
- `ToolsManager#useTools()`
- `ToolsRegistration#registerTools(name, options)`
- `ToolsOptions`
- `ToolCall`
- `DecisionActions`
- `useTools()`
- `ToolsProvider`

兼容要求：

- 现有 `@nocobase/client` 导出的 AI 相关类型和工具仍可照常 import
- 现有 plugin-ai 前端代码不需要因为目录迁移改业务逻辑
- 已注册的前端 tools 继续通过 `this.ai.toolsManager.registerTools(...)` 工作
- `app.aiManager.toolsManager` 的访问方式不变

## Test Plan

### 1. 静态与类型层验证

至少验证以下场景：

- `packages/core/client/src/application/Application.tsx` 能正确引用新 `flow/ai` 路径
- `packages/core/client/src/index.ts` 的 AI 导出仍可被 TypeScript 正常解析
- plugin-ai 中对 `ToolsOptions`、`DecisionActions`、`ToolCall`、`AIManager` 的 import 不报类型错误
- 不出现新的循环依赖导致的运行时报错或初始化顺序问题

建议执行：

- 面向 `client` 与 `plugin-ai` 的 TypeScript/构建检查
- 至少一次包含 `@nocobase/plugin-ai` 的构建或测试入口验证

### 2. 前端运行链路验证

至少覆盖以下行为：

- 应用启动后 `app.aiManager` 存在
- `plugin-ai` 在 `load/setupAIFeatures` 中可以继续访问 `this.app.aiManager.toolsManager`
- 前端 tool 注册后，`toolsManager.useTools()` 能拿到注册结果
- `toolsManager.listTools()` 仍能合并后端 `aiTools` 返回结果与前端本地注册项

### 3. 回归场景

至少验证以下实际链路：

- chatbox 中 `useToolCallActions` 通过 `app.aiManager.toolsManager.useTools()` 取工具映射成功
- `formFiller` 这类依赖 `app.flowEngine` 的前端 tool 能继续执行
- `getContextApis` / `getContextEnvs` / `lintAndTestJS` 这类使用 `useHooks()` 的 tool 行为不变
- 无 AI 插件时，`Application` 实例化 `aiManager` 不报错

## Assumptions

- 本次迁移的目标是“收拢目录”和“降低后续解耦成本”，不是一步到位完成架构纯化
- `flow/ai` 暂时允许依赖 `application`，这是本计划的明确前提
- 当前外部对 `src/ai` 的直接子路径 import 预计不多；默认先保留 `src/ai/index.ts` 转发，如检查中发现有子路径使用，再补对应兼容转发文件
- 本次默认不改动 plugin-ai 的业务实现，只保证它在迁移后零行为变化
- 下一阶段若要彻底满足“`flow/ai` 不依赖 `flow` 外 client 代码”，再单独做 `Application` 窄接口抽象与注入改造

## To do list

- [x] 扫描旧 `src/ai` 的内部/外部引用，确认兼容入口范围：仓库内未命中旧 `src/ai` 子路径消费，仅保留顶层兼容入口即可
- [x] 迁移 `src/ai` 实现到 `src/flow/ai`
- [x] 切换 `Application` 到新的 `flow/ai` 实现
- [x] 保留旧 `src/ai` 兼容转发层：旧目录现仅保留 `index.ts`
- [x] 运行最小必要检查验证类型与接线：`plugin-ai` 客户端最小用例通过；全量 `tsc` 可跑完但仓库存在大量既有类型错误，与本次改动无关
- [x] 回写计划文件进度并整理结果
