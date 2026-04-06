# Execution Plan

## 原始计划

# client-v2 数据源初始化重构计划

## 摘要
以 `@nocobase/flow-engine` 的 `DataSourceManager` 作为 `client-v2` 唯一数据源元信息中心，`app.dataSourceManager` 与 `flowEngine.context.dataSourceManager` 指向同一实例。  
本期范围只覆盖 `client-v2` / flow 内核调用链，不额外兼容旧 `@nocobase/client` 的 `CollectionManager` 外观，也不引入按 collection 的懒加载。  
实现分为三层：Application 先挂统一 runtime 与字段接口管理器，builtin collection plugin 在 `beforeLoad()` 注册字段接口能力，admin 入口在渲染前执行 metadata 预热。

## 初始化分层

### 1. Application 层只做 runtime 装配
在 [packages/core/client-v2/src/BaseApplication.tsx](/Users/Apple/Projects/nocobase-2.0/packages/core/client-v2/src/BaseApplication.tsx) / [packages/core/client-v2/src/Application.tsx](/Users/Apple/Projects/nocobase-2.0/packages/core/client-v2/src/Application.tsx) 中，明确在以下时机完成挂载：

- `this.flowEngine = new FlowEngine()` 之后
- `this.context = this.flowEngine.context as any` 之后
- `configureBaseContext()/configureContext()` 以及任何 provider/plugin 消费之前

在这个阶段完成：

- `app.dataSourceManager = app.flowEngine.context.dataSourceManager`
- `app.dataSourceManager.setRequester(app.apiClient.request.bind(app.apiClient))`
- 创建 `CollectionFieldInterfaceManager`
- `app.dataSourceManager.setCollectionFieldInterfaceManager(fieldInterfaceManager)`

同时补齐 app 级代理方法：

- `addFieldInterfaces`
- `addFieldInterfaceGroups`
- `addFieldInterfaceComponentOption`
- `addFieldInterfaceOperator`

要求：

- `app.dataSourceManager === app.flowEngine.context.dataSourceManager`
- `collectionFieldInterfaceManager` 在 app 初始化完成后即存在，即便此时还没注册具体接口类
- 不在这里触发任何远程 metadata 请求

### 2. builtin collection plugin 只做同步能力注册
新增或调整 v2 collection plugin，职责仅限于同步注册：

- `main` data source loader
- field interfaces
- field interface groups
- 需要的 component options / operators

实现约束：

- 这些注册动作放在 `beforeLoad()`，不是 `load()`
- 在 `NocoBaseBuildInPlugin.addPlugins()` 中固定顺序：
  - `PluginFlowEngine`
  - `builtin-collection-v2`
  - 其他 builtin plugin

这样其他插件的 `beforeLoad()` / `load()` 都能看到完整的字段接口运行时。

### 3. admin bootstrap 只做异步 metadata 预热
新增 `DataSourceBootstrapProvider`，接入 admin 内容树最外层。

职责固定：

- 仅在非免鉴权路由执行 `app.dataSourceManager.ensureLoaded()`
- loading 时显示 `AppSpin`
- 失败时抛给现有 error boundary
- 不在 `Application.load()` 时全局执行
- 不负责字段接口注册
- 不负责 ACL 合并

要求：

- 必须早于 admin flow route 渲染
- 本期 consumer 统一依赖它先完成 `ensureLoaded()`，不做 miss-triggered lazy fetch

## flow-engine 改动

### 1. `DataSourceManager` 作为唯一加载编排中心
在 [packages/core/flow-engine/src/data-source/index.ts](/Users/Apple/Projects/nocobase-2.0/packages/core/flow-engine/src/data-source/index.ts) 扩展：

- `setRequester(requester)`
- `registerLoader(key, loader)`
- `removeLoader(key)`
- `ensureLoaded(options?: { force?: boolean; keys?: string[] })`
- `reload(options?: { keys?: string[] })`
- `reloadDataSource(key: string)`

状态改为按 key 跟踪：

- `loadingPromise`
- `loadedKeys: Set<string>`
- `loadingKeys: Set<string>`
- `loadErrors: Map<string, Error | null>`

字段接口能力直接挂在同一实例：

- `collectionFieldInterfaceManager`
- `setCollectionFieldInterfaceManager(manager)`
- `addFieldInterfaces(...)`
- `addFieldInterfaceGroups(...)`
- `addFieldInterfaceComponentOption(...)`
- `addFieldInterfaceOperator(...)`

规则固定：

- 默认 `ensureLoaded()` 只保证 `main`
- 同一轮并发 `ensureLoaded()` 复用一个 `loadingPromise`
- `loadedKeys` 决定目标 key 是否已完成
- `reload({ keys })` / `reloadDataSource(key)` 必定重新执行目标 loader
- `'*'` loader 若存在，先执行 `'*'`，再执行显式 key loader
- loader 错误按 key 记录并继续抛出

### 2. 收紧 loader 协议
为了减少实现分支，loader 协议固定为两种：

- `registerLoader('main', loader)`：
  - 只允许返回 `{ collections }`
- `registerLoader('*', loader)`：
  - 只允许返回 `{ dataSources }`

其中：

- `dataSources` 元素允许自带 `collections`
- manager 统一负责：
  - `upsertDataSource`
  - 把 `collections` 写入对应 data source
- 单 key loader 不返回 `dataSources`
- 本期只要求实现 `main` loader，`'*'` 仅保留扩展位

### 3. `DataSource` 补刷新和状态语义
同文件扩展 `DataSource`：

- `status`
- `errorMessage`
- `reload()`

语义固定：

- `reload()` 委托到 `dataSourceManager.reloadDataSource(this.key)`
- `status/errorMessage` 从 `options` 读取
- manager 在加载前后更新对应 `DataSource.options`

状态值沿用旧语义：

- `loading`
- `loaded`
- `loading-failed`
- `reloading`
- `reloading-failed`

### 4. `main` data source 生命周期固定
`FlowEngineContext` 构造时创建的 `main` data source 视为常驻实例，生命周期规则写死：

- `main` 永远存在
- loader 只能更新 `main` 的 options / collections
- loader 不能重新 `addDataSource('main')`
- reload 不能替换 `main` 实例引用

避免已有 `DataSource` / `Collection` 引用失效。

### 5. metadata 变更时清理继承缓存
在 `CollectionManager` 中，以下路径必须清理缓存：

- `setCollections`
- `upsertCollections`
- `updateCollection`
- `removeCollection`
- `clearCollections`

清理对象：

- `childrenCollectionsName`
- `allCollectionsInheritChain`

避免 reload 后继承链与 view source 仍读旧值。

### 6. 统一“consumer 读取过早”的行为
在 metadata 尚未加载完成时，行为固定为：

- `getDataSource('main')` 永远返回实例
- `getCollection(...)` / `getCollectionField(...)` 返回 `undefined`
- 不因“未初始化”而抛异常
- 只有显式 `ensureLoaded/reload` 失败时才通过异常上抛

这样“未预热”和“加载失败”语义清晰分离。

### 7. 增加 metadata 加载事件
为后续插件扩展和 UI 同步，增加事件：

- `dataSource:loaded`
- `dataSource:loadFailed`

事件 payload 至少包含：

- `dataSourceKey`
- `initial`
- `error`（失败时）

事件由 manager 在单 key loader 完成或失败后发出。

### 8. 防止 loader 重入与递归触发
明确 manager 的重入保护策略：

- `reloadDataSource(key)` 遇到该 key 正在 loading 时复用当前 promise
- loader 内部不得依赖会再次触发 `ensureLoaded/reload` 的 consumer 逻辑
- manager 内部对同 key 做重入保护，避免循环调用

## client-v2 侧具体行为

### 1. 主数据源 loader
`builtin-collection-v2.beforeLoad()` 注册 `main` loader，固定走：

- `resource: 'collections'`
- `action: 'listMeta'`

返回：

- `{ collections }`

manager 将结果写入 `getDataSource('main')`。

### 2. 字段接口体系
复用现有 `client` 的：

- `CollectionFieldInterfaceManager`
- 当前 `CollectionPlugin` 的字段接口列表
- 字段接口分组
- 必要的 component option / operator 注册方式

本期明确不迁移：

- `CollectionTemplateManager`
- v1 的 `CollectionManager` facade/adapter
- 旧 `DataSource` OO 加载体系

### 3. 同步消费语义保持不变
以下 API 保持同步读取语义：

- `getDataSource`
- `getCollection`
- `getCollectionField`

本期明确不做：

- `getCollection()` miss 后自动远程拉取
- `getCollectionField()` miss 后自动补请求
- 按 collection 粒度懒加载

所有 consumer 都依赖 `ensureLoaded()` 先完成。

### 4. ACL 范围明确收敛
本期 `ensureLoaded()` 只负责 collection metadata。

明确不做：

- 把 ACL `meta.dataSources` 合并进 data source runtime
- 多数据源 ACL 裁剪
- 复刻旧 client 的 data-source ACL 叠加语义

这部分若后续需要，单独立项。

## 测试计划

### flow-engine
- `ensureLoaded()` 首次只加载 `main`
- 并发 `ensureLoaded()` 只触发一次请求
- `loadedKeys` / `loadingKeys` / `loadErrors` 按 key 正确变化
- `reloadDataSource('main')` 会刷新 metadata 并更新 `DataSource.status`
- `DataSource.reload()` 会委托到 manager
- loader 失败时：
  - `loadingKeys` 正确复位
  - `loadErrors.get(key)` 被设置
  - `DataSource.errorMessage` 可读
  - 异常继续抛出
- `upsertCollections()` 后继承缓存被清空并按新 metadata 重建
- `dataSource:loaded` / `dataSource:loadFailed` 事件按预期触发
- 同 key 重入时 promise 被复用，不出现递归加载

### client-v2
- `app.dataSourceManager` 与 `flowEngine.context.dataSourceManager` 为同一实例
- `collectionFieldInterfaceManager` 在 app 初始化完成后即存在
- `app.addFieldInterfaces()` 等方法可用，并真实影响 `CollectionField.getInterfaceOptions()`
- builtin collection plugin 在 `beforeLoad()` 后，其他 plugin 的 `beforeLoad/load` 能读取字段接口
- admin bootstrap provider 会在 admin 内容渲染前完成 `ensureLoaded()`
- `titleFieldQuickSync` 继续通过 `dataSource.reload()` 工作
- 未进入 admin 页面时不会主动请求 `collections:listMeta`

## 验收标准
本期交付完成的判断标准是以下真实消费点稳定工作：

- 标题字段同步后调用 `dataSource.reload()` 能刷新 metadata
- filter/linkage/operator 推导可正常读取字段接口元信息
- association label / record select 可读取 target collection field metadata
- admin 页面进入后不再因为 metadata 缺失报错
- metadata 未预热时相关同步读取返回空值而非抛“未初始化”异常
- metadata 加载失败时错误通过既有边界可见

## 实现顺序
建议按以下顺序落地，降低回归风险：

1. 先实现 `flow-engine` 的 runtime、状态、事件与单测
2. 再实现 `Application` 挂载统一实例与 app 级代理 API
3. 再接入 builtin collection plugin 的 `beforeLoad()` 注册
4. 最后接 `DataSourceBootstrapProvider` 和端到端回归测试

## 非目标与默认决策
- 本期只覆盖 `client-v2` / flow 内核元信息初始化，不兼容旧 `CollectionManager` 外观
- `collectionFieldInterfaceManager` 是运行时必需项，不按可选能力处理
- 首期只保证 `main` 数据源初始化闭环，多数据源只保留 loader 协议与 key 级状态设计
- 不迁移 `CollectionTemplateManager`
- 不改变 `Collection` / `CollectionField` 现有同步消费语义
- 不让 `flow-engine` 直接依赖 `@nocobase/client-v2` 或 `APIClient` 类型，只接受通用 requester

## 还能优化的地方
这版计划已经比较完整，剩下还能优化的主要是实现组织，不是方案边界：

- manager 的 loader/state 逻辑可以拆成小型私有辅助方法，降低主类复杂度
- 如实现时发现 `'*'` loader 明显增加复杂度，本期可只保留类型与空扩展位，不接实际调用路径
- 如后续确实需要支持旧插件 facade，再单独立项做 `CollectionManager` adapter，不建议混入本期

## To do list

- [x] 复查并收敛 `flow-engine` 数据源运行时改动
- [x] 补齐 `flow-engine` 相关单测
- [x] 接入 `client-v2` Application 的统一 `dataSourceManager`
- [x] 新增并注册 v2 collection plugin
- [x] 接入 admin metadata 预热 provider
- [x] 跑针对性测试并修复回归
- [x] 访问 `http://localhost:20002/v2/admin/25zzsnfwlmv` 验证区块正常显示数据
