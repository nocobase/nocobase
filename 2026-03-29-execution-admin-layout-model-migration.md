# Execution Plan

## 原始计划

# AdminLayoutModel 迁移到 flow 并收敛为运行时基类

## Summary
将 [`packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutModel.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutModel.tsx) 中现有 `AdminLayoutModel` 的运行时逻辑迁到 [`packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutModel.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutModel.tsx)，形成新的 flow 基类 `AdminLayoutModel`。该基类不含 `render()`，且只能依赖 `flow/**` 内代码和外部包。旧文件保留为极薄的 `AdminLayoutModelV1`，继承 flow 基类，仅实现当前 `render()`。

## Key Changes
- 新增 flow 基类 [`packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutModel.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutModel.tsx)。
  - 迁入当前运行时职责：菜单树同步、页面注册/更新/注销、`toProLayoutRoute()`、`layoutContentElement` 管理、`currentRoute/layoutContentElement/isMobileLayout` 上下文桥接、`onMount/onUnmount`。
  - `NocoBaseDesktopRoute` 从 `@nocobase/client-v2/flow-compat` 导入。
  - 文件内不允许引用 `flow` 目录外的 client 模块。
  - `AdminLayoutStructure` 一并迁入，不在 v1 包装层重复定义。
- 重构 flow 基类内部结构，明确公开契约与内部实现。
  - 公开方法只保留：
    - `registerRoutePage`
    - `updateRoutePage`
    - `unregisterRoutePage`
    - `syncMenuRoutes`
    - `toProLayoutRoute`
    - `setLayoutContentElement`
    - `setIsMobileLayout`
  - 私有实现保留：
    - `getCoordinator`
    - `getCurrentRouteByPageUid`
    - `getCurrentRouteByActivePage`
    - `setupContextBindings`
    - `setupRouteReaction`
    - `teardownRuntime`
  - `onMount/onUnmount` 只做装配和释放，不直接堆副作用细节。
- 用 `AdminLayoutModel` 直接替换 [`packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutComponent.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/flow/admin-shell/admin-layout/AdminLayoutComponent.tsx) 中的 `AdminLayoutHostModel` 匿名结构类型。
- 新增 flow 内 helper，统一模型获取与创建。
  - 放在 `flow/admin-shell/admin-layout` 下，并从同目录 `index.ts` 导出。
  - 只提供一个 `getAdminLayoutModel(flowEngine, options?)`。
  - 该 helper 统一负责：
    - 用 `ADMIN_LAYOUT_MODEL_UID` 查找已有实例
    - 按需创建模型
    - 在已有实例上更新 `props`
    - 在要求必须存在但未拿到模型时抛统一错误
  - 通过参数控制“只取/取或创建/取不到时报错”的语义，不再拆成多个 helper。
  - 旧入口可显式传入 `use: AdminLayoutModelV1`，flow 内默认使用 `AdminLayoutModel`。
- 改造旧文件 [`packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutModel.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/route-switch/antd/admin-layout/AdminLayoutModel.tsx)。
  - 类名改为 `AdminLayoutModelV1`。
  - 继承 flow 侧 `AdminLayoutModel`。
  - 文件内只保留：
    - `React`
    - `AdminShellProvider`
    - `AdminLayoutComponent`
    - `render()`
  - 不保留任何已迁走的字段、类型、辅助方法、生命周期和注释副本。
- 更新 [`packages/core/client/src/route-switch/antd/admin-layout/index.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/route-switch/antd/admin-layout/index.tsx)。
  - `useRef`、泛型和实例类型改为 `AdminLayoutModelV1`。
  - 模型获取/创建逻辑改为调用 flow 内 `getAdminLayoutModel(...)`，不再直接操作 `ADMIN_LAYOUT_MODEL_UID`、`getModel`、`createModel` 和 `setProps`。
  - `registerModels` 仍保持注册 key 为 `AdminLayoutModel`，值为 `AdminLayoutModelV1`，即 `AdminLayoutModel: AdminLayoutModelV1`，以保持现有模型名兼容，不把注册名改成 `AdminLayoutModelV1`。
  - 旧入口保持为纯渲染适配层。

## Public APIs / Interfaces
- 新增公开导出：`flow/admin-shell/admin-layout` 下的：
  - `AdminLayoutModel`
  - `getAdminLayoutModel`
- 旧 `route-switch` 文件导出 `AdminLayoutModelV1`。
- `AdminLayoutComponent` 直接依赖 `AdminLayoutModel` 类型。
- `registerModels` 中的模型注册名继续使用 `AdminLayoutModel`，不改变外部按名称获取模型的兼容行为。
- `NocoBaseDesktopRoute` 类型统一从 `@nocobase/client-v2/flow-compat` 获取。

## Test Plan
- 调整 [`packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-model.test.tsx`](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-model.test.tsx)。
  - 仅保留旧入口包装相关测试：
    - 创建的是 `AdminLayoutModelV1`
    - 已有实例可复用
    - `props` 会更新
    - `FlowModelRenderer` 正常拿到模型
  - 增加继承关系断言，确认 `AdminLayoutModelV1` 继承 flow 侧 `AdminLayoutModel`。
  - 增加 `registerModels({ AdminLayoutModel: AdminLayoutModelV1 })` 相关断言或覆盖，确保注册名兼容。
- 将运行时行为测试归位到 flow 侧。
  - 把当前菜单树、route/pageActive、context bridge 等测试迁到 flow admin-layout 相关测试文件下，直接针对 flow 侧 `AdminLayoutModel`。
  - `useAdminLayoutRoutePage` 改用 `getAdminLayoutModel(..., { required: true })` 或等价参数形式，并验证统一报错语义。
- 定向验证场景至少覆盖：
  - `registerRoutePage/updateRoutePage/unregisterRoutePage`
  - `syncMenuRoutes/toProLayoutRoute`
  - `currentRoute` 跟随激活页变化
  - `layoutContentElement` 实时暴露
  - `isMobileLayout` 上下文可观察
  - `getAdminLayoutModel()` 的获取、创建、props 更新和报错分支
- 运行定向测试：
  - `yarn test --client packages/core/client/src/route-switch/antd/admin-layout/__tests__/admin-layout-model.test.tsx`
  - `yarn test --client` 运行迁移后的 flow 侧 admin-layout 相关测试文件

## Assumptions
- 本次只迁移 `AdminLayoutModel` 的运行时逻辑，不迁移 `AdminLayoutComponent` 本身。
- `AdminLayoutModelV1` 是临时兼容层，目标是尽可能薄，仅承担旧入口的渲染包装职责。
- “flow 不能依赖 flow 外 client 代码”的约束，仅作用于新的 flow 基类和新增 flow helper。
- 运行时类名改为 `AdminLayoutModelV1`，但模型注册名继续保持 `AdminLayoutModel`，避免影响现有注册键与字符串依赖。

## To do list

- [x] 新增 flow 侧 AdminLayoutModel 与 getAdminLayoutModel helper
- [x] 将 route-switch 侧 AdminLayoutModel 改为极薄的 AdminLayoutModelV1
- [x] 更新 AdminLayout 入口与 registerModels 注册方式
- [x] 更新 AdminLayoutComponent 与 useAdminLayoutRoutePage 的模型获取逻辑
- [x] 迁移并调整相关测试
- [x] 运行定向测试并整理结果
- [x] 让 AdminLayoutComponent 直接依赖 AdminLayoutModel 类型
