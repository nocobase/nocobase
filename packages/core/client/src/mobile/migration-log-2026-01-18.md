# 移动端模块迁移记录（2026-01-18）

## 背景与目标
- 目标：把移动端能力从 @nocobase/plugin-mobile/client 迁移到 @nocobase/client（core），避免 RequireJS 生产环境在未启用 plugin-mobile 时引发导入错误。
- 策略：移动端组件、页面、适配器、路由与插件类逐步迁入 core，并让各插件统一从 core 导入移动端 API。
- 兼容：保留 @nocobase/plugin-mobile 作为薄封装（deprecated），继续提供设置区块与 JSBridge，避免旧引用断裂。

## 迁移过程概览（阶段性）
1. 识别依赖
   - 搜索所有 @nocobase/plugin-mobile/client 的引用。
   - 涉及插件：block-template、notification-in-app-message、workflow、workflow-manual、block-workbench、workflow-approval。

2. core/mobile 模块建设
   - 新增并迁入移动端页面、布局、providers、desktop-mode、adaptor-of-desktop、核心工具等。
   - 导出聚合：packages/core/client/src/mobile/index.ts，统一由 core 暴露。
   - 修复内部相对路径引用与 locale/useMobileApp 等路径问题。

3. 插件引用迁移
   - 将插件层移动端组件与 Hook 统一改为从 @nocobase/client 导入。
   - 避免插件依赖 plugin-mobile/client，确保 core 直接提供。

4. plugin-mobile 变薄封装
   - 将 @nocobase/plugin-mobile client 实现重构为继承 core PluginMobileClient。
   - 保留 deprecated 提示、MobileSettings block、JSBridge 挂载。
   - demos 统一改从 @nocobase/client 导入，减少重复实现。

## 关键结果
- @nocobase/client 已完整暴露移动端模块与 PluginMobileClient。
- 插件统一从 core 导入移动端组件与 Hook，减少依赖链。
- @nocobase/plugin-mobile 仅作兼容封装，保留设置块与运行时桥接。
- 移动端页面/布局/导航等路径引用、Schema 组件路径已整理。

## 代码落点（主要路径）
- core 导出入口：
  - packages/core/client/src/index.ts
  - packages/core/client/src/mobile/index.ts
- core 移动端模块：
  - packages/core/client/src/mobile/**
  - 包含 pages、mobile-layout、mobile-providers、desktop-mode、adaptor-of-desktop、PluginMobileClient、MenuPermissions、MobileComponentsProvider 等。
- plugin-mobile 薄封装：
  - packages/plugins/@nocobase/plugin-mobile/src/client/index.tsx
