# Execution Plan

## 原始计划

## 基于 `BaseApplication` 的 `Application` 重构计划

### 摘要
新增共享基类 `BaseApplication`，承载 `client` 与 `client-v2` 共同的应用运行时骨架；然后让：
- `packages/core/client-v2/src/Application.tsx` 继承 `BaseApplication`
- `packages/core/client/src/application/Application.tsx` 继承 `BaseApplication`

本次重构的约束已经确定：
- **初始化顺序以 `client` 当前版本为准**
- **`initRequireJs()` 的实现以 `client-v2` 当前版本为准**
- `ApplicationModel` 已统一，基类直接复用 `@nocobase/client-v2` 的 `ApplicationModel`
- `load()` 与 `loadWebSocket()` 仍保留在具体子类中，不强行统一行为
- **`client-v2` 的 `scopes` 也改为像 `client` 一样执行 merge**
- **`client-v2` 的 `name` 初始化时机前移到与 `client` 一致**

目标是把共享骨架上提到基类，同时保持两边现有对外行为尽量不变；本次允许的明确统一项只有：
- `client-v2` 的 `scopes` merge
- `client-v2` 的 `name` 初始化前移

### 关键改动
#### 1. 新增 `BaseApplication`，统一共享骨架
新增共享基类文件，建议放在：
- `packages/core/client-v2/src/base/BaseApplication.tsx`
或
- `packages/core/client-v2/src/BaseApplication.tsx`

`BaseApplication` 负责以下共享内容：

- 公共字段：
  - `eventBus`
  - `providers`
  - `router`
  - `scopes`
  - `i18n`
  - `ws`
  - `apiClient`
  - `components`
  - `pluginManager`
  - `pluginSettingsManager`
  - `devDynamicImport`
  - `requirejs`
  - `name`
  - `favicon`
  - `flowEngine`
  - `context`
  - `model`
  - `maintained`
  - `maintaining`
  - `error`
  - `apps`
  - `wsAuthorized`
- 公共 getter / 方法：
  - `pm`
  - `disableAcl`
  - `isWsAuthorized`
  - `updateFavicon`
  - `setWsAuthorized`
  - `initListeners`
  - `setTokenInWebSocket`
  - `setMaintaining`
  - `getOptions`
  - `getName`
  - `getPublicPath`
  - `getApiUrl`
  - `getRouteUrl`
  - `getHref`
  - `getComposeProviders`
  - `use`
  - `addProvider`
  - `addProviders`
  - `getComponent`
  - `renderComponent`
  - `addComponent`
  - `addComponents`
  - `mount`
  - `getRootComponent`
  - `addReactRouterComponents`
  - `addRoutes`
- 共享模型初始化：
  - 创建 `FlowEngine`
  - `registerModels({ ApplicationModel })`
  - 创建 `__app_model__`
- 共享构造流程：
  - `languageChanged -> apiClient.auth.locale` 绑定
  - `pluginSettingsManager` 与 `addRoutes()` 的顺序控制
- 共享基础 observable 注册：
  - `maintained`
  - `maintaining`
  - `error`

`BaseApplication` 不直接内置 `client` 或 `client-v2` 的产品语义，所有分叉都通过钩子表达。

#### 2. 基类构造顺序以 `client` 当前版本为准
`BaseApplication` 构造流程必须严格按 `client` 当前顺序组织，固定顺序如下：

1. `initRequireJs()`
2. 注册基础 observable 状态
3. 设置 `devDynamicImport`
4. 合并 `scopes`
5. 初始化默认 `components`
6. merge `options.components`
7. 计算 `name`
8. 创建 `apiClient`
9. 执行扩展状态初始化
10. 创建 `i18n`
11. 创建 `router`
12. 创建其它运行时管理器
13. 创建 `flowEngine`
14. 注册并创建 `ApplicationModel`
15. 创建 `context`
16. 注入基础 context 属性
17. 注册基础默认 providers
18. 追加子类特有 providers
19. 注册 React Router 组件
20. 创建 `ws`
21. 创建 `pluginSettingsManager`
22. 注册基础 routes
23. 绑定 `languageChanged`
24. 初始化 listeners
25. 执行子类收尾钩子

关键约束：
- `name` 必须在 `createApiClient()` 和 provider 注册之前可用
- `components` 的构造必须是：
  - 先 `getDefaultComponents()`
  - 再 merge `options.components`
- `pluginSettingsRouter` 的 context getter 继续保持“先定义 getter，后初始化实例”的当前语义
- `pluginSettingsManager` 必须在 `ws` 之后创建
- `addRoutes()` 必须在 `pluginSettingsManager` 创建之后执行
- `client` 当前依赖这个顺序的代码不能被打破

#### 3. `initRequireJs()` 以 `client-v2` 的版本为准
`BaseApplication` 中直接采用 `client-v2` 当前的 `initRequireJs()` 语义：

- 先判断 `typeof window === 'undefined'`
- 已存在 `window.requirejs` 时复用
- 否则初始化 `requirejs`
- 调用 `defineGlobalDeps`
- 设置 `window.define`

这一步不再保留 `client` 旧实现；`client` 与 `client-v2` 都统一使用这一版。

#### 4. `BaseApplication` 中定义明确的可覆写钩子
以下能力必须抽成 `protected` 钩子，默认实现应最小化，不写死某一子类特有行为：

- 工厂钩子：
  - `createApiClient(options)`
  - `createI18n(options)`
  - `createRouterManager(options)`
  - `createPluginManager(options)`
  - `createPluginSettingsManager(options)`
  - `createWebSocketClient(options)`
  - `getDefaultComponents()`
  - `mergeScopes(scopes)`
- 状态初始化钩子：
  - `defineObservableState()`
  - `initializeExtendedState()`
  - `afterManagersInitialized()`
- 上下文与 provider 钩子：
  - `configureContext()`
  - `addCustomProviders()`
- 加载行为钩子：
  - `load()`
  - `loadWebSocket()`
- 根渲染钩子：
  - `getRootFallback()`

要求：
- `BaseApplication` 默认只注册 `maintained / maintaining / error` 为 observable
- `client` 通过 `defineObservableState()` 或等价机制补注册 `loading`
- `BaseApplication` 的 `getRootComponent()` 统一使用共享 `ApplicationModel`
- 不再单独抽 `ApplicationModel` 相关钩子
- `load()` 与 `loadWebSocket()` 不上提为统一实现，只保留为子类负责

#### 5. `BaseApplication` 统一负责基础 context 注入
`BaseApplication` 必须统一保留当前两边共同存在的基础 context 属性注入，至少包括：

- `pluginManager`
- `pluginSettingsRouter`
- `app`
- `api`
- `i18n`
- `router`
- `documentTitle`
- `route`
- `location`

要求：
- 这组基础 context 属性由基类统一注入
- 子类的 `configureContext()` 只负责在这组基础属性之上追加扩展项
- `client` 的 `configureContext()` 不能覆盖或遗漏基础 context 属性
- `client-v2` 的 `configureContext()` 默认只保留基础 context 属性即可

#### 6. `BaseApplication` 固定共同的 React Router 组件注册与基础路由
两边当前实现完全一致，因此直接上提为基类固定逻辑：

- `addReactRouterComponents()` 统一注册：
  - `Link`
  - `Navigate`
  - `NavLink`
- `addRoutes()` 统一注册 not-found route：
  - 路由名：`not-found`
  - 路径：`*`
  - 组件：`this.components['AppNotFound']`

子类不再覆写这两个方法，除非将来确实出现新差异。

#### 7. `BaseApplication` 固定共同的基础默认 providers
两边共同的 provider 注册逻辑上提到基类固定实现，基类负责注册：

- `I18nextProvider`
- `FlowEngineProvider`
- `FlowEngineGlobalsContextProvider`

子类只通过 `addCustomProviders()` 追加各自特有 provider，不再重写整段默认 provider 流程。

#### 8. `client-v2/Application` 改为薄子类，保持当前行为
`packages/core/client-v2/src/Application.tsx` 改为继承 `BaseApplication`，只提供 v2 默认实现：

- `createApiClient()`：
  - 保留当前默认构造语义：`new APIClient(options.apiClient)`
- `createI18n()`：继续默认 `createInstance()`
- `createRouterManager()`：返回 v2 `RouterManager`
- `createPluginManager()`：返回 v2 `PluginManager`
- `createPluginSettingsManager()`：返回 v2 `PluginSettingsManager`
- `createWebSocketClient()`：返回 v2 `WebSocketClient`
- `getDefaultComponents()`：继续返回当前 v2 基础兜底组件
- `mergeScopes()`：**改为与 `client` 一致，执行 `merge(this.scopes, options.scopes)`**
- `configureContext()`：不追加 v2 特有扩展，保留基类注入的基础 context 即可
- `addCustomProviders()`：不追加 v2 特有 provider
- `load()`：保留 v2 当前实现
- `loadWebSocket()`：保留 v2 当前实现，包括：
  - `!event.data` guard
  - `context.notification`
  - `APP_RUNNING` 恢复 reload
  - 当前 maintaining / error 处理
  - `console.log('ws:message', { maintaining, data })`
- `getRootFallback()`：保留 `this.renderComponent('AppSpin')`

另外保留：
- `router.basename` 自动推导逻辑
这可以放在 `createRouterManager()` 后、`afterManagersInitialized()` 或等价钩子里完成，但行为必须不变。

注意：
- `client-v2` **不再宣称完全无行为变化**
- 本次对 `client-v2` 明确允许的统一调整有两项：
  - `scopes` merge
  - `name` 初始化前移

#### 9. `client/Application` 改为薄子类，保持当前行为
`packages/core/client/src/application/Application.tsx` 改为继承 `BaseApplication`，只保留 `client` 特有实现：

- `createApiClient()`：
  - 使用 `packages/core/client/src/api-client` 的 `APIClient`
  - 支持传入 `APIClient` 实例
  - 非实例时补 `appName`
  - `appName` 取值规则保持现状：
    - `this.options.name || getSubAppName(options.publicPath)`
  - **设置 `apiClient.app = this`**
- `createI18n()`：默认使用 `packages/core/client/src/i18n`
- `createRouterManager()`：返回 `client` 的 `RouterManager`
- `createPluginManager()`：返回 `client` 的 `PluginManager`
- `createPluginSettingsManager()`：返回 `client` 的 `PluginSettingsManager`
- `createWebSocketClient()`：返回统一后的 `WebSocketClient`
- `getDefaultComponents()`：
  - `DataBlockProvider`
  - `defaultAppComponents`
  - `schemaInitializerComponents`
  - `CollectionField`
- `mergeScopes()`：保留 `merge(this.scopes, options.scopes)`
- `defineObservableState()`：
  - 在基类基础上补注册 `loading`
- `initializeExtendedState()`：
  - `systemSettings = new SystemSettingsSource(this.apiClient)`
  - `headerActionsManager`
  - `schemaSettingsManager`
  - `schemaInitializerManager`
  - `dataSourceManager`
  - `globalVars`
  - `globalVarCtxs`
  - `variables`
  - `loading`
  - `hasLoadError`
  - `locales`
- `afterManagersInitialized()`：
  - `jsonLogic = getOperators()`
  - `aiManager = new AIManager(this)`
- `configureContext()`：在基类基础 context 之上追加：
  - `routeRepository`
  - `appInfo`
  - `pageInfo`
  - `systemSettings`
- `addCustomProviders()`：
  - `APIClientProvider`
  - `GlobalThemeProvider`
  - `CSSVariableProvider`
  - `AppSchemaComponentProvider`
    - 参数保持现状：
      - `designable`
      - `appName`
      - `components`
      - `scope`
  - `AntdAppProvider`
  - `DataSourceApplicationProvider`
  - `OpenModeProvider`
- `load()`：保留 `loading` / `hasLoadError` / `BLOCKED_IP` 逻辑
- `loadWebSocket()`：保留当前实现，包括：
  - `notification` 通过运行时注入后由 `this.notification[...]` 使用
  - `hasLoadError` 恢复 reload 逻辑
  - 当前 maintaining / error 处理
- `getRootFallback()`：保留 `this.renderComponent('AppSpin', { app: this })`

`client` 独有公开 API 保持在子类中：
- `getCollectionManager`
- `addScopes`
- `addFieldInterfaces`
- `addFieldInterfaceComponentOption`
- `addFieldInterfaceOperator`
- `addGlobalVar`
- `getGlobalVar`
- `getGlobalVarCtx`
- `addUserCenterSettingsItem`
- `registerVariable`
- `getVariables`
- `setAppsComponent`

#### 10. 明确不进入 `BaseApplication` 的内容
以下内容不放入基类，只留在具体子类中：

- `client` 的数据源、Schema、AI、系统设置、变量系统
- `client` 与 `client-v2` 不同的默认组件集合
- `client` 与 `client-v2` 不同的特有 provider 集
- `client` 与 `client-v2` 不同的 `load()` / `loadWebSocket()` 行为
- `client-v2` 的 basename 自动推导细节
- `client` 的 `notification` 使用协议

原则：
- 共享骨架上提
- 产品语义不混进基类

### 类型与接口要求
- 新增 `BaseApplication` 导出
- `client-v2/Application` 和 `client/Application` 的对外类名不变
- `BaseApplication` 的 `ApplicationOptions` 需要支持子类扩展，建议采用泛型 options：
  - `BaseApplication<TOptions extends BaseApplicationOptions = BaseApplicationOptions>`
- `client` 保留自己的扩展 options：
  - `apiClient?: APIClientOptions | APIClient`
  - `schemaSettings?`
  - `schemaInitializers?`
  - `dataSourceManager?`
- `client-v2` 保留自己的精简 options 定义
- 基类中涉及 `RouterManager` / `PluginManager` / `PluginSettingsManager` / `WebSocketClient` 的属性类型，需要允许子类返回各自的具体实现

### 测试与验收
#### 1. `client-v2` 回归验证
确保以下行为不变，除 `scopes` merge 与 `name` 初始化前移外：

- 默认 `router.basename` 自动推导仍有效
- 默认 `i18n` 仍使用 `createInstance()`
- `PluginManager` 仍请求 `pm:listEnabledV2`
- `PluginSettingsManager` icon 仍走 `renderIon`
- `RouterManager` 的 `componentLoader` 仍可工作
- `loadWebSocket()` 的 `APP_RUNNING` 恢复逻辑仍保留
- `loadWebSocket()` 的 `!event.data` guard 和 `console.log('ws:message', ...)` 仍保留
- 默认根渲染与当前 `ApplicationModel` 行为一致
- 新增校验：`options.scopes` 传入后会被 merge 进 `app.scopes`
- 新增校验：`name` 在创建 `apiClient` / providers 前已经可用
- 新增校验：基础 context 属性仍完整存在
- 新增校验：共同 React Router 组件与 not-found 路由仍存在
- 新增校验：基础默认 providers 仍包含 `I18nextProvider` / `FlowEngineProvider` / `FlowEngineGlobalsContextProvider`

#### 2. `client` 回归验证
确保以下行为不变：
- 使用 `client` 的 `APIClient`
- `apiClient.app === app`
- `appName` 计算规则不变
- 使用共享 `i18n`
- 使用 `client` 的 `RouterManager` / `PluginManager` / `PluginSettingsManager`
- `PluginManager` 仍请求 `pm:listEnabled`
- `PluginSettingsManager` 仍用 `Icon` 渲染字符串 icon
- `AppSchemaComponentProvider` 的参数仍完整正确
- `routeRepository` / `pageInfo` / `systemSettings` / `dataSourceManager` 仍在 context 中可用
- 基础 context 属性仍完整存在
- 共同 React Router 组件与 not-found 路由仍存在
- `loading` 仍是 observable
- `load()` 的 `loading` / `hasLoadError` / `BLOCKED_IP` 逻辑不变
- `loadWebSocket()` 的通知和恢复逻辑不变
- `jsonLogic` 与 `aiManager` 仍被初始化
- `globalVars` / `globalVarCtxs` / `variables` 初始值与行为不变
- `client` 的专有公开 API 保持可用

#### 3. 类型与集成检查
至少执行：
- `Application` 相关单测
- `Plugin` / `RouterManager` / `PluginManager` / `PluginSettingsManager` / `WebSocketClient` 相关测试
- `packages/core/client` 与 `packages/core/client-v2` 的 TypeScript 检查
- 搜索验证没有模块依赖已删除的旧构造细节或旧初始化顺序

### 假设与默认决策
- `ApplicationModel` 视为当前已统一的共享实现，直接由 `BaseApplication` 复用。
- 初始化顺序完全以 `client` 当前版本为准，不做折中。
- `initRequireJs()` 完全以 `client-v2` 当前版本为准，不保留 `client` 旧实现。
- `client-v2` 允许的统一行为调整只有两项：
  - `scopes` merge
  - `name` 初始化前移
- `load()` 和 `loadWebSocket()` 继续保留在子类中，不在本次重构中统一行为。
- 若某项逻辑无法明确判断是否属于共享骨架，默认保留在具体子类，不强行上提。

## To do list

- [x] 阅读 `Application` 与相关依赖文件，确定共享骨架与子类差异边界
- [x] 新增 `BaseApplication`，先承接共享字段、初始化顺序、context、公共 providers、公共 routes
- [x] 改造 `client-v2/Application.tsx` 继承 `BaseApplication` 并保留 v2 特有行为
- [x] 改造 `client/Application.tsx` 继承 `BaseApplication` 并保留 client 特有行为
- [x] 调整相关导出与类型，修复编译问题
- [x] 执行类型检查和最小回归验证
- [x] 同步更新计划文件状态并整理结果
- [x] 全量检查 `BaseApplication` 重构后的类型报错，区分新增问题与仓库既有噪音
- [x] 修复本次重构引入的 `flow-compat` 路径映射与 `PluginFlowEngine` 类型兼容问题
- [x] 回归验证修复结果，并更新计划状态

## 变更记录

- 共享 `ApplicationModel` 上提到 `client-v2/src/BaseApplication.tsx`，并补回了 client 当前依赖的 `AppMain` 渲染、`AppError` 透传与 root children 同步逻辑。
- 为避免 `Application` 子类之间因 protected hook 产生名义类型冲突，外围运行时类型逐步改为依赖 `BaseApplication` 或更宽的插件构造类型。
- 全量 `tsc` 仍有仓库既有类型噪音，因此本次使用提高内存后的过滤式类型检查，仅确认本次改动文件没有新增类型错误。
- 已补跑最小回归验证：`packages/core/client-v2/src/__tests__/app.test.tsx`、`packages/core/client/src/application/__tests__/ApplicationModel.host.test.tsx`、`packages/core/client/src/application/__tests__/Application.test.tsx`，均通过。
- 在全量 `tsc` 中新增识别出两类由本次重构直接带出的错误：`@nocobase/client-v2/flow-compat` 缺少源码路径映射，以及 `PluginFlowEngine` 继承链不再满足 client 侧 `PluginType`；两者已分别通过补充 `tsconfig.paths.json` 映射和改回继承 client 侧 `Plugin` 修复。
- `flow-compat` 路径恢复后，又暴露出兼容层类型过窄的问题：`useApp` 返回值无法覆盖 client 扩展能力，`flow-compat/data.ts` 中的 `DataSourceManager` 与 flow-engine 上下文类型不兼容；已通过放宽兼容层返回类型与数据源接口签名修复。
- 为修复 `BaseApplication` 中 `FlowEngineGlobalsContextProvider` 的上下文顺序回归，已将 `packages/core/client/src/flow/theme` 与 `packages/core/client/src/global-theme/AntdAppProvider.tsx` 下沉到 `client-v2`，并将 `GlobalThemeProvider`、`AntdAppProvider` 上提到 `BaseApplication` 的基础 provider 链中，确保其位于 `FlowEngineGlobalsContextProvider` 之前。
- client 侧对主题与 Antd App 的业务引用路径已统一切换为 `@nocobase/client-v2` 或共享重导出位置，本地 `flow/theme`、`global-theme` 仅保留兼容性重导出，不再承载独立实现。
- 已补跑与本次迁移直接相关的最小回归验证：`packages/core/client-v2/src/__tests__/app.test.tsx`、`packages/core/client/src/application/__tests__/Application.test.tsx`、`packages/core/client/src/application/__tests__/ApplicationModel.host.test.tsx`，均通过。
