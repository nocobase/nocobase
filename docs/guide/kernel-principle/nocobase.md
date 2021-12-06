# Talking about the design ideas of NocoBase

NocoBase 的内核只是一个无 GUI（Client）的 Server，Client 作为插件集成进来。Client 是变化的，不限于 React、Vue 等。虽然 Client 作为插件存在，但也是非常重要的一个分支，用于支持无代码平台。

在概念上有很多可能，但是 NocoBase 也需要基于特定的技术框架实现 Server 和 Client 内核。

- Server：Nodejs、Koa、Sequelize
- Client：React、Formily、Ant Design

在实际应用中，Server 可能只有一个，但 Client 可能有很多，WEB、小程序、Android、IOS 都不一样。为了最大的兼容多端可能，客户端核心的 Schema Component 基于 Formily 实现，理论上支持适配 React/ReactNative/Vue2/Vue3 框架。

理想状态 Server 和 Client 都可以单独使用。只用 NocoBase 的 Server，对接的其他 Client。只用 NocoBase 的 Client，对接其他的 Server。不过 Client 是为 NocoBase 的 Server 服务，虽然可以适配非 NocoBase 的 Server，但是会有些局限（不是所有功能都能使用）。

Server 和 Client 是非常重要的两个分支，插件也围绕着这两部分开展。NocoBase 提供了公共的接口用于对接各类插件，但是实现插件的核心在于内核提供了哪些 Extension API。

## 扩展 - Extensions

扩展是按「概念」划分的最小化的独立模块。

<Alert title="注意">
扩展的划分还比较清晰，但是有些扩展怎么更好的协调起来，有待商榷。
</Alert>

Database

- Collections
- Field Types
- Filter Operators
- Repositories
- Models
- Events/Hooks

Application

- Middlewares
- Resources（也可以理解为提供 Services）
- Actions
- Events/Hooks
- CLI

Client

- SchemaComponent
- CollectionField
- RouteSwitch

SchemaComponent（只列三个特殊的存在扩展的组件）

- Action
- AddNew
- DesignableBar

## 插件 - Plugins

插件是按「功能」划分的可插拔的独立模块。插件可能需要由多个扩展协调起来才能正常工作。

<Alert title="扩展和插件的区别">
两者虽然都称之为模块，但是存在差别。扩展是概念性的，比较抽象；插件是功能性的，比较具体。插件可能需要由多个扩展协调起来才能正常工作。
</Alert>

以完整的导出功能为例，需要实现的扩展包括：

- `服务端` 实现 Export Action API（Application -> Action）
- `客户端` 实现 Export Action Button（SchemaComponent -> Action）
- `客户端` 为 Export Action Button 实现自己的 Export DesignableBar（SchemaComponent -> Action 和 DesignableBar）

除此之外，还有两个需要考虑的细节：

- `客户端` Action Button 是放在区块的可操作区（Block.ActionBar），那这个 Export Button 可以放在哪些区块的 Block.ActionBar 里。在表格区块里导入的可能是表格，在详情区块里导出的可能是 PDF、图片、Word 文档。
- `服务端` Action 是有权限的，权限除了控制服务端的 Action API，也需要控制 Action Button 的显示和隐藏。

再举个例子，例如文件管理器，相关扩展包括：

- `服务端` 提供 attachments 表，用于存上传的文件信息
- `服务端` 提供 storages 表，用于配置存储服务信息，如 oss、s3、minio、local 等
- `服务端` 提供 upload action api
- `客户端` 提供 attachment 的 field interface（扩展的附件字段）
- `客户端` 提供 file-manager 区块，用于管理上传的文件（特定的 SchemaComponent）

以上两个例子都有服务端和客户端代码，有两个没有考虑清楚的细节：

- 前后端代码怎么安排比较合适？
- 客户端代码怎么动态载入和去除呢？

这就是下一个话题了 —— 插件管理器

## 插件管理器

插件可能需要由多个扩展协调起来才能正常工作，那如何让插件正常工作？

上述的两个例子

- 导出只需要把各扩展模块放到该放的地方（模块的加载）就能正常工作了。
- 文件管理器除了模块的加载，还需要初始化 attachments 和 storages 表，并且配置上 storage。

以上工作就是插件管理器负责的，协调各扩展模块的加载，让插件可以正常的运作起来。

插件管理器的职责：

- 负责插件的下载、安装、激活、禁用和移除
- 协调插件
  - 各模块归位，包括按依赖顺序载入/移除模块
    - 如果是客户端的代码，如何处理
  - 什么时候做什么事情，包括：
    - `nocobase init`
    - `nocobase start`
    - `nocobase pm:download <plugin-name> --enable`
    - `nocobase pm:enable <plugin-name>`
    - `nocobase pm:disable <plugin-name>`
    - `nocobase pm:remove <plugin-name>`

## Events & Middlewares

在上面列举的几类扩展中，Events 和 Middlewares 需要考虑优先级问题。以 Events 为例，假设有个 `tests.beforeCreate` 事件：

A 插件：

```ts
db.on('tests.beforeCreate', (model) => {
  model.set('x', 'a1');
});
```

B 插件：

```ts
db.on('tests.beforeCreate', (model) => {
  model.set('x', 'b1');
});
```

如果是按照 A、B 顺序加载，model.x 的结果为 b1，如果是按照 B、A 的顺序加载，model.x 的结果为 a1。A、B 的加载顺序对结果会有影响，但这个影响并不是插件的依赖关系，所以并不能通过插件依赖来解决。较好的思路，可以给事件的 listener 加个 priority，如：

A 插件：

```ts
db.on('tests.beforeCreate', (model) => {
  model.set('x', 'a1');
}, {
  priority: 100,
});

db.on('tests.beforeCreate', (model) => {
  model.set('y', 'a2');
}, {
  priority: 400,
});
```

B 插件：

```ts
db.on('tests.beforeCreate', (model) => {
  model.set('x', 'b1');
}, {
  priority: 200,
});

db.on('tests.beforeCreate', (model) => {
  model.set('y', 'b2');
}, {
  priority: 300,
});
```

有了 priority，不管插件通过什么顺序加载，最终的 model.x 的值都是 b1， model.y 的值都是 a2。进一步整理，可以给 priority 设定一些常量，比如：

- highest：200
- higher：300
- high：400
- normal：500（默认值）
- low：600
- lower：700
- lowest：800

这个思路能够解决大部分优先级问题。不过，钻牛角尖来说，如果想把 C 的事件放在 A、B 中间呢？如：

```ts
// A 插件
db.on('tests.beforeCreate', (model) => {
  
}, {
  priority: 500,
});

// C 插件
db.on('tests.beforeCreate', (model) => {
  
}, {
  priority: 500,
});

// B 插件
db.on('tests.beforeCreate', (model) => {
  
}, {
  priority: 500,
});
```

上述例子是个非常极端的情况，一般不用考虑这么细，如果想要支持精确插入，可以考虑加个 name 参数，再配合 insertAfter 或 insertBefore 指定插入位置，如：

```ts
// A 插件
db.on('tests.beforeCreate', (model) => {
  
});

// B 插件
db.on('tests.beforeCreate', (model) => {
  
}, {
  name: 'b1'
});

// C 插件
db.on('tests.beforeCreate', (model) => {
  
}, {
  name: 'c1',
  insertBefore: 'b1', // 虽然写在最后，但是要插入在 b1 前面，
  // insertAfter: 'a1',
});
```
