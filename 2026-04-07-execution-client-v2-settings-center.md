# Execution Plan

## 原始计划

# 在 Client V2 中实现首版 `/admin/settings` 插件配置中心的计划

## Summary

目标是在 `client-v2` 中实现与 `client v1` 同构的 `/admin/settings` 插件配置中心页面壳，但首版不提供任何额外 UI 入口，只要求直接访问路由可用。

首版按“壳先落地 + 内建最小种子页”实施，而不是等待所有插件迁移完成后再开放。基于当前仓库现状，首版必须接受以下事实：

- `client-v2` 已有 `PluginSettingsManager`，能把 `pluginSettingsManager.add()` 自动转成 `/admin/settings/...` 叶子路由
- `client-v2` 目前缺的是 `/admin/settings` 父壳路由与统一 settings layout
- 当前仓库里真正有 `client-v2` 入口的插件极少，且现有 `client-v2` 插件还没有注册实际 settings 页
- 因此首版不能假设“迁完插件自然就有很多页面”，必须主动补少量内建种子页，保证默认可用

首版交付目标：

- `/admin/settings` 在 `client-v2` 下可直接访问
- settings 页面壳具备左侧菜单、顶部标题、tabs、内容区 `<Outlet />`
- 保留并实现内建 `Plugin manager` 特殊页
- 保留并实现内建 `System settings` 普通叶子页
- 普通插件 settings 只展示“当前已被 v2 app 实际加载且调用 `pluginSettingsManager.add()` 注册”的项
- 不做 v1 插件到 v2 的自动桥接
- `client-v2` 新增一个极薄的 `AdminSettingsLayoutModel`
- `client-v1` 的 `AdminSettingsLayoutModel` 改为继承 `client-v2` 的同名基类
- `client-v1` 与 `client-v2` 的 `AdminSettingsLayout` 组件继续各自维护，不共用组件实现

## Key Changes

### 1. 在 `client-v2` 增加 settings host model 与父壳路由

- 在 `client-v2` 新增 `AdminSettingsLayoutModel`
  - 继承 `FlowModel`
  - `render()` 仅返回 `this.props.children`
  - 不引入 `AdminLayoutModel` 的 route coordinator、菜单同步、admin page runtime 等重型能力
- 在 `client-v2` 新增 `AdminSettingsLayout` host 组件
  - 使用 `useFlowEngine + FlowModelRenderer`
  - 创建并复用 `AdminSettingsLayoutModel`
- 在 `client-v2` 内建 settings 模块中新增父壳路由：
  - 路由名 `admin.settings`
  - 路径 `/admin/settings/`
  - 组件 `AdminSettingsLayout`
- 维持现有 `PluginSettingsManager.add()` 语义不变，使 `admin.settings.xxx` 继续自动挂到父壳下

### 2. 在 `client-v2` 实现独立的 settings shell

- 新增 `client-v2` 专用的 settings 页面壳，包含：
  - 左侧 settings 菜单
  - 右侧标题区域
  - 顶部子页 tabs
  - 内容区 `<Outlet />`
- 行为与 `client-v1` 对齐，但适配首版“页很少”的状态：
  - `/admin/settings` 且存在可访问叶子页：跳转到默认优先页
  - `/admin/settings` 且不存在可访问叶子页：显示首页空态
  - 当前 URL 指向不存在或不可访问的 setting，且没有 fallback：显示路由空态
  - 顶级 setting 自己不可打开且无 child：显示空态页
  - 顶级 setting 有 children 且自己不是叶子页：自动跳到第一个 child
  - `link` 类型项：跳外链
  - `showTabs === false`：隐藏顶部 tabs
  - `pluginKey`：用于侧边栏高亮回退
  - 动态段路径：支持 `:param` 匹配与 tabs 导航参数替换
- 允许从 v1 复用纯逻辑函数，但不直接复用整份组件文件：
  - 菜单数据组装
  - 路径匹配
  - `replaceRouteParams`
  - “首个深层可访问页”查找
- 不复用 v1 的以下实现：
  - `useCompile`
  - `useACLRoleContext`
  - `useDocumentTitle`
  - `client` 侧 icon 渲染
  - `PluginSetting.tsx` 整体组件实现

### 3. 首版内建最小种子页

- 首版至少内建两个可落地项：
  - `plugin-manager`
  - `system-settings`
- 两个种子页都由 `client-v2` 的内建 settings 模块统一注册
- 不依赖 `plugin-system-settings` 或其他业务插件先迁移到 v2 才出现

#### `plugin-manager`

- `plugin-manager` 作为 settings 内建特殊页保留，行为与 v1 保持同层级语义：
  - 由 settings 内建模块主动注册
  - 注册为真正的 setting 路由
  - 菜单渲染层仍把它当特殊项单独插入，排在普通 settings 树之前
  - 不依赖业务插件迁移
- ACL snippet 固定为：
  - `pm`
- 左侧“Plugin manager”特殊项是否显示，按 `pm` 权限判定
- `client-v2` 的 `plugin-manager` 页面明确采用“最小可用版”实现：
  - 不复用 v1 的 [PluginManager.tsx](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/pm/PluginManager.tsx)
  - 首版只做只读列表，不做安装、升级、删除、启用、禁用
  - `plugin-manager` 页面展示数据口径固定为 `pm:list`
  - 不使用 `pm:listEnabledV2` 来充当 plugin manager 页面数据源
- 列表最低展示字段固定为：
  - `name`
  - `packageName`
  - `displayName`
  - `enabled`
  - `builtIn`
  - `version`
  - `isCompatible`
- 明确区分两套口径：
  - `plugin-manager` 页面展示用 `pm:list`
  - settings 左侧普通配置菜单只展示“当前 v2 app 实际加载并注册的 settings”
- 首版默认展示所有插件管理数据，不额外筛成“仅 v2 插件”

#### `system-settings`

- `system-settings` 作为首版最小普通叶子页：
  - 注册为可直接打开的配置页
  - 使 `/admin/settings` 有稳定默认落点
- ACL snippet 固定为：
  - `pm.system-settings.system-settings`
- `client-v2` 的 `system-settings` 页面明确采用“最小 v2 页面”实现：
  - 不复用 v1 的 [SystemSettingsShortcut.tsx](/Users/Apple/Projects/nocobase-2.0/packages/core/client/src/system-settings/SystemSettingsShortcut.tsx) 整体页面
  - 复用 v2 已有的数据层：
    - `SystemSettingsSource`
    - [useSystemSettings.tsx](/Users/Apple/Projects/nocobase-2.0/packages/core/client-v2/src/flow/system-settings/useSystemSettings.tsx)
  - 保存继续走现有接口 `systemSettings:put`
  - 首版字段范围固定为：
    - `raw_title`
    - `logo`
    - `enabledLanguages`
  - `logo` 继续复用现有附件上传接口与存储规则
  - 不在首版重做上传组件或存储配置逻辑
  - 不在本次顺带迁移 v1 schema-component / Formily 配置页体系

### 4. 默认首页优先级

- `/admin/settings` 的默认落点必须固定，且建立在 ACL 过滤后的结果上
- 默认优先级写死为：
  1. `system-settings`
  2. `plugin-manager`
  3. 其余可访问叶子页，按现有深层查找规则
- 若 `system-settings` 不可访问，则 fallback 到 `plugin-manager`
- 若两者都不可访问，则再尝试其他可访问叶子页
- 若完全没有任何可访问叶子页，则显示首页空态
- 不允许因注册顺序、菜单顺序或 `sort` 偶然变化而改变默认首页

### 5. 菜单顺序与稳定规则

- `Plugin manager` 作为特殊项永远排在最上面
- `system-settings` 作为普通项排在普通 settings 树最前
- 其他普通项继续沿用现有 `sort` + 名称排序规则
- 菜单顺序不影响默认首页优先级；默认首页始终按固定规则决定

### 6. 把“零页 / 少页”作为首版一等场景设计

- 即使有了种子页，仍要支持以下状态：
  - 只有 `plugin-manager`
  - 只有 `system-settings`
  - 两者都因 ACL 不可访问
  - 未来插件迁移后出现更多叶子页
- 空态场景分为两类：
  - 首页空态：没有任何可访问配置页
  - 路由空态：当前地址对应的配置页不存在或无权限
- 允许两类空态首版共用一个组件，但实现语义必须区分
- 空态文案默认表达：
  - 当前没有已迁移到 Client V2 的插件配置页
  - 后续插件迁移后会自动出现在这里
- 首版不展示“未迁移插件列表”
- 首版不展示“v1/v2 迁移进度表”
- 首版不做 v1/v2 混合跳转

### 7. 明确插件显示边界

- settings 树只展示满足以下条件的项：
  - 插件已经被 `client-v2` 应用实际加载
  - 插件在运行时调用了 `pluginSettingsManager.add()`
  - 当前 ACL 允许访问
- 明确不做的事：
  - 不自动扫描仓库并生成 settings 菜单
  - 不根据 `packages/plugins` 目录存在与否生成占位项
  - 不桥接 `client` 侧插件设置注册到 `client-v2`
  - 不因为某插件存在 `src/client-v2` 目录就默认显示它的设置页
- 首版“显示多少个配置页”取决于：
  - 内建种子页数量
  - 当前 v2 app 真实加载的插件
  - 这些插件是否已注册 settings

### 8. 补齐 `client-v2` 侧 settings shell 的依赖接线

- ACL：
  - 继续以 `pluginSettingsManager.getList()` / `get()` 作为过滤后数据源
  - 复用 v2 现有 `roles:check` 流程与 ACL provider
  - 明确依赖 provider 在角色信息返回后调用 `pluginSettingsManager.setAclSnippets(...)`
  - settings 默认首页选择必须基于 ACL 过滤后的结果，而不是静态配置列表
- 标题：
  - 顶部 title 与 document title 取当前顶级 setting
  - title 非字符串时退回 `topLevelName`
- 图标：
  - 使用 `PluginSettingsManager.renderIcon()` 结果
- 国际化：
  - settings shell 自身文案使用 v2 i18n 资源
  - 不要求本次引入 v1 的模板编译体系；只需保证已注册 `title` 能正确显示

### 9. 收敛 `AdminSettingsLayoutModel` 到 `client-v2`

- 在 `client-v2` 导出新的 `AdminSettingsLayoutModel`
- `client-v1` 的 `AdminSettingsLayoutModel` 改成继承 `@nocobase/client-v2` 导出的同名基类
- `client-v1` 当前 `AdminSettingsLayout` 行为保持不变
- 不把 `client-v1` 的 settings shell 上移到 v2
- 不让新的 `AdminSettingsLayoutModel` 继承 `AdminLayoutModel`

### 10. 服务端边界

- 首版不新增服务端接口
- 首版不修改现有服务端协议：
  - `pm:list`
  - `pm:listEnabledV2`
  - `systemSettings:put`
  - `roles:check`
- 所有首版页面均建立在现有接口能力之上实现

## Public APIs / Interfaces

本次不新增插件侧 settings 注册 API，继续使用：

- `app.pluginSettingsManager.add(name, options)`

新增导出仅限内部基建层：

- `@nocobase/client-v2`
  - `AdminSettingsLayoutModel`
  - `AdminSettingsLayout`

首版不修改 `PluginSettingOptions` 字段语义，不新增强制字段。

## Test Plan

### 1. 路由与默认落点

- 访问 `/admin/settings` 且 `system-settings` 可访问：
  - 自动跳转到 `system-settings`
- 访问 `/admin/settings` 且 `system-settings` 不可访问、`plugin-manager` 可访问：
  - 自动跳到 `plugin-manager`
- 访问 `/admin/settings` 且两者都不可访问、但有其他叶子页：
  - 自动跳到第一个其他可访问叶子页
- 访问 `/admin/settings` 且无任何可访问叶子页：
  - 渲染首页空态，不抛错，不死循环重定向
- 访问不存在或无权限的 `/admin/settings/...` 路由：
  - 渲染路由空态
- 访问 `/admin/settings/plugin-manager`：
  - 能在 settings 壳内正确渲染
- 访问 `/admin/settings/system-settings`：
  - 能在 settings 壳内正确渲染

### 2. 菜单与 tabs

- 左侧菜单包含 `Plugin manager` 特殊项
- `Plugin manager` 特殊项显示受 `pm` 权限控制
- `system-settings` 叶子页显示受 `pm.system-settings.system-settings` 权限控制
- `Plugin manager` 永远排在菜单最上面
- `system-settings` 在普通 settings 树中排第一
- 普通顶级 settings 按 `isPinned/sort/hidden` 生效
- 子页 tabs 按 `sort` 排序
- `showTabs: false` 时不显示 tabs
- `pluginKey` 存在时侧栏高亮正确
- 动态路径页在 tabs 切换时参数替换正确

### 3. 种子页行为

- `plugin-manager` 最小版页面：
  - 使用 `pm:list` 请求插件列表
  - 能展示 `name`、`packageName`、`displayName`、`enabled`、`builtIn`、`version`、`isCompatible`
  - 不依赖 v1 `PluginManager.tsx`
  - 不提供安装、升级、删除、启用、禁用操作
- `system-settings` 最小版页面：
  - 能读取当前系统设置
  - 能保存 `raw_title`、`logo`、`enabledLanguages`
  - `logo` 上传继续走现有附件能力
  - 保存后状态与数据源同步

### 4. ACL

- `pluginSettingsManager.setAclSnippets()` 后：
  - settings 菜单只显示有权限项
  - `/admin/settings` 遵循固定优先级选择默认页
  - 若所有叶子页都无权限，则显示首页空态
- `getList(false)` 的行为保持不变，供 ACL 配置场景使用

### 5. 兼容性

- `client-v1` 的 `AdminSettingsLayoutModel` 改为继承 v2 后，现有 v1 单测继续通过
- `PluginSettingsManager` 现有测试继续通过：
  - route path
  - nested children
  - acl snippet
  - icon 渲染
- 后续任何 v2 插件一旦被 app 加载并调用 `pluginSettingsManager.add()`，无需改 settings 壳即可显示

## Assumptions

- 当前版本不需要提供任何额外 UI 入口；只要求 `/admin/settings` 路由可直接访问。
- 首版按“壳先落地 + 内建最小种子页”实施，不等待所有插件迁移完成。
- 首版必须包含 `plugin-manager` 与 `system-settings` 两个可访问页。
- `plugin-manager` 与 `system-settings` 都采用 `client-v2` 最小版页面实现，不复用 v1 整页组件。
- `plugin-manager` 页面展示数据使用 `pm:list`；运行时远程 v2 插件加载仍使用 `pm:listEnabledV2`，两者口径不强行统一。
- `plugin-manager` 首版只做只读列表。
- `system-settings` 首版只做 `raw_title`、`logo`、`enabledLanguages` 三个字段。
- 普通插件 settings 只展示“当前已被 v2 app 实际加载且实际注册”的项。
- `AdminSettingsLayout` 组件在 v1/v2 中分别维护；只共享极薄的 `AdminSettingsLayoutModel` 基类。
- 不做 v1 插件设置到 v2 的自动桥接，不做未迁移插件的占位展示。

## To do list

- [x] 创建并维护 `client-v2` 的执行面板与变更记录
- [x] 在 `client-v2` 新增 `AdminSettingsLayoutModel`、settings shell 与导出
- [x] 在 `client-v2` 内建模块注册 `/admin/settings` 父壳路由
- [x] 在 `client-v2` 实现 settings 菜单、tabs、默认落点与两类空态
- [x] 在 `client-v2` 接入 ACL 过滤与标题更新
- [x] 在 `client-v2` 注册 `plugin-manager` 特殊页与 `system-settings` 种子页
- [x] 实现 `plugin-manager` 最小只读页
- [x] 实现 `system-settings` 最小设置页
- [x] 让 `client-v1` 的 `AdminSettingsLayoutModel` 继承 `client-v2` 基类
- [x] 补充并运行相关测试
