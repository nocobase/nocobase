# Execution Plan

## 原始计划

1. 将 `AdminLayoutComponent.tsx` 的真实实现迁入 `packages/core/client/src/flow/admin-shell/admin-layout`，仅迁移运行所需的最小实现闭包。
2. 将 `global-theme` 的核心真实实现迁入 `packages/core/client/src/flow/theme`，旧 `packages/core/client/src/global-theme/*` 保留原路径文件，但文件内容改为从 `flow/theme` 中的新实现回导出。
3. `AdminLayoutModel` 继续保留在旧目录，作为 host model 的真实实现，仅补充 `isMobileLayout` 响应式状态。
4. `global-theme` 的新真实实现路径固定为：
   - `packages/core/client/src/flow/theme/index.tsx`
   - `packages/core/client/src/flow/theme/compatOldTheme.ts`
   - `packages/core/client/src/flow/theme/customAlgorithm.ts`
   - `packages/core/client/src/flow/theme/defaultTheme.ts`
   - `packages/core/client/src/flow/theme/type.ts`
5. 旧 `global-theme` 路径保留，但改为回导出；每个文件只保留从 `flow/theme` 公共入口回导出的实现，不允许残留真实主题逻辑。
6. `Application.tsx` 改为直接注册 `flow/theme` 中的新 `GlobalThemeProvider`；`AntdAppProvider` 继续保留在应用 provider 链中；在应用初始化逻辑中补充 `flowEngine.context.systemSettings`。
7. `AdminLayoutComponent` 真实实现迁入 `flow/admin-shell/admin-layout`，迁入：
   - `AdminLayoutComponent`
   - `AdminLayoutContent`
   - `useApplications`
   - `ResetThemeTokenAndKeepAlgorithm`
   菜单相关文件按实际 import/编译闭包迁移，不预先整包搬迁。
8. `AdminLayoutComponent` 的状态来源固定为：
   - `allAccessRoutes`：`flowEngine.context.routeRepository.listAccessible()`
   - `designable`：`flowSettingsEnabled && !isMobileLayout`
   - 设计态启停：启用 `flowEngine.flowSettings.enable()`，禁用 `flowEngine.flowSettings.disable()`
   - `systemSettings`：`flowEngine.context.systemSettings`
   - `menu translation`：`ctx.t(value, { ns: 'lm-desktop-routes' })`
   - `isDarkTheme`：`flowEngine.context.isDarkTheme`
   - `theme`：`flow/theme` 中迁移后的 `useGlobalTheme`
   - `themeToken`：优先使用 `flowEngine.context.themeToken`；仅局部纯 React 样式场景才使用 antd `theme.useToken()`
9. `AdminLayoutModel` 保留在旧目录，但补充最小 host 能力：增加响应式 `isMobileLayout`、增加 `setIsMobileLayout`，继续提供 `syncMenuRoutes`、`toProLayoutRoute`、`setLayoutContentElement`。
10. `AdminLayoutComponent` 在 `flow` 中只依赖最小 host 接口，不再 import `AdminLayoutModel` 类型，通过 `ADMIN_LAYOUT_MODEL_UID` 取实例。
11. `PinnedPluginList` 本次改为轻量实现：保留 header actions、保留 `Help`、去掉 `UserCenter`，`LanguageSettings` 不纳入本次范围。
12. `AdminLayoutSlotModels` 一并迁入 `flow`，“无页面提示”逻辑改为使用 `routeRepository.listAccessible()` 判断是否有页面，使用 `flowSettingsEnabled` 判断是否处于配置态。
13. 旧 `route-switch/antd/admin-layout` 目录中，`AdminLayoutModel` 继续保留真实实现；入口文件、导出文件、装配文件只保留模型注册、插件注册、兼容导出；这些入口/导出文件不允许继续新增真实 UI 逻辑和状态逻辑。
14. `flow/theme` 的公共入口固定为 `packages/core/client/src/flow/theme/index.tsx`；`flow/admin-shell/admin-layout` 的公共入口固定为 `packages/core/client/src/flow/admin-shell/admin-layout/index.ts`；旧路径兼容导出只允许指向这两个公共入口。
15. 边界校验要求：
   - `flow/admin-shell/admin-layout` 下不得直接 import `flow` 外 `client/src/*`
   - 旧 `global-theme/*` 文件中不再包含真实实现，只保留 re-export
   - 旧 `admin-layout` 入口/导出文件不再包含真实 UI 逻辑
   - 旧路径兼容导出只指向公共入口，不指向深层实现

## To do list

- [x] 建立 `flow/theme` 真实实现，并改造旧 `global-theme/*` 为回导出
- [x] 更新 `Application.tsx` 的主题 provider 注册与 `systemSettings` 上下文注入
- [x] 给 `AdminLayoutModel` 增加响应式 `isMobileLayout` 与 setter
- [x] 迁移 `AdminLayoutComponent`、`AdminLayoutContent`、`useApplications`、`ResetThemeTokenAndKeepAlgorithm` 到 `flow/admin-shell/admin-layout`
- [x] 按编译依赖补齐 `AdminLayout` 菜单相关最小闭包
- [x] 改造 `PinnedPluginList` 为不含 `UserCenter` 的轻量实现
- [x] 改造旧 `admin-layout` 入口/导出文件为兼容导出
- [x] 跑最小测试与边界校验

## 2026-03-27 浏览器回归记录

- [x] 修复 `Application.tsx` 对 `AntdAppProvider` 的错误命名导入，解除页面启动白屏
- [x] 修复迁移后 link 菜单与设计器按钮复用 `'/'` 导致的 `Duplicated key '/' used in Menu by path [/]`
- [x] 收口旧 `admin-layout` 与纯主题兼容导出到公共入口，保留 `AntdAppProvider` 例外实现
- [x] 将 `systemSettings` 请求下沉到 `Application` 的 `flowEngine.context` getter，移除 `SystemSettingsProvider` 内部直连请求
- [x] 删除仓库内已无引用的旧 `AdminLayoutComponent` / `AdminLayoutSlotModels` / `useApplications` 薄壳文件

## 2026-03-27 system-settings 收口记录

- [x] 将 `SystemSettingsSource` 真实实现迁入 `packages/core/client/src/flow/system-settings`
- [x] 将 `useSystemSettings` 真实实现迁入 `packages/core/client/src/flow/system-settings`
- [x] 旧 `packages/core/client/src/system-settings/*` 保留兼容回导出
- [x] `SystemSettingsProvider` 不再参与运行时 provider 链，`SystemSettingsPlugin.load()` 改为空实现
- [x] `AdminLayoutComponent` 改为直接通过 `useSystemSettings()` 消费系统设置
