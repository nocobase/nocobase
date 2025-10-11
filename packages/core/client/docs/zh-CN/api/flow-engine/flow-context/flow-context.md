# FlowContext

`FlowContext` 是 NocoBase 流引擎上下文体系的基础类，负责属性、方法的动态注册与访问代理。所有流引擎相关的上下文（如 `FlowEngineContext`、`FlowModelContext`、`FlowRuntimeContext` 等）都继承自该类。

---

## ✨ 设计理念

- **统一上下文基类**：所有流相关上下文均继承自 `FlowContext`，便于扩展和类型统一。
- **动态属性/方法注册**：支持同步/异步属性、方法的动态注册，满足多样化扩展需求。
- **代理链机制**：支持多层上下文代理，实现属性/方法的链式查找和复用。

---

## 🧩 核心 API

### 属性注册

#### `defineProperty(key: string, options: PropertyOptions): void`

注册属性，支持静态值、同步/异步 getter、缓存等。

- **静态属性**：`{ value: any }`
- **同步 getter**：`{ get: (ctx) => any }`
- **异步 getter**：`{ get: async (ctx) => any }`
- **缓存控制**：`cache: true`（默认）或 `false`（每次访问都执行 getter）
- **元信息**：`meta` 参数可用于描述属性结构

##### 服务端解析标记（可选）

- `resolveOnServer?: boolean | (subPath: string) => boolean`
  - 默认不设置（即 false）：该变量仅在前端解析
  - 设为 true：该变量的所有用法都交由服务端解析（会通过 variables:resolve 调用服务器）
  - 设为函数：可按子路径精确控制哪些片段由服务端解析，例如仅 `record` 分支：
    ```ts
    ctx.defineProperty('view', {
      get: () => currentView,
      meta: createViewMeta(ctx, () => currentView),
      resolveOnServer: (p) => p === 'record' || p.startsWith('record.'),
    });
    ```

#### `has(key: string): boolean`

判断当前上下文是否有某个属性。

---

### 方法注册

#### `defineMethod(name: string, fn: Function): void`

注册方法（同步或异步均可）。

---

### 属性工具方法

#### `getPropertyOptions(key: string): PropertyOptions | undefined`

获取属性定义选项（包含代理链）。

- 先查找当前上下文通过 `defineProperty` 注册的属性；若不存在，则沿委托链向上查找第一个命中的定义
- 返回 `PropertyOptions` 或 `undefined`

---

### 代理机制

#### `addDelegate(ctx: FlowContext): void`

将当前上下文的属性和方法访问代理给另一个上下文（插入代理链头部）。

#### `removeDelegate(ctx: FlowContext): void`

从代理链中移除指定上下文。

---

### 属性/方法访问

- 通过 `ctx.foo` 直接访问属性或方法，自动查找自身及代理链。
- 支持链式代理（A → B → C），自身优先，代理链次之。
- 方法自动绑定上下文。

---

### 属性元信息

#### `getPropertyMetaTree(): MetaTreeNode[]`

获取当前上下文及代理链上的所有属性元信息（可用于 UI 变量的级联选择等）。

---

## 🚀 用法示例

### 属性注册与访问

```ts
const ctx = new FlowContext();
ctx.defineProperty('foo', { value: 123 });
console.log(ctx.foo); // 123

ctx.defineProperty('bar', { get: () => 456 });
console.log(ctx.bar); // 456

ctx.defineProperty('baz', { get: async () => 'hello' });
console.log(await ctx.baz); // 'hello'
```

### 属性依赖与上下文引用

```ts
const ctx = new FlowContext();
ctx.defineProperty('a', { get: () => 'a' });
ctx.defineProperty('b', { get: (ctx) => ctx.a + 'b' });
console.log(ctx.b); // 'ab'

ctx.defineProperty('c', { get: async () => 'c' });
ctx.defineProperty('d', { get: async (ctx) => (await ctx.c) + 'd' });
console.log(await ctx.d); // 'cd'
```

### 属性缓存控制

```ts
const ctx = new FlowContext();
let count = 0;
ctx.defineProperty('cached', { get: () => ++count });
console.log(ctx.cached); // 1
console.log(ctx.cached); // 1（默认缓存）

let count2 = 0;
ctx.defineProperty('noCache', { get: () => ++count2, cache: false });
console.log(ctx.noCache); // 1
console.log(ctx.noCache); // 2（不缓存）
```

### 代理链（多级代理）

```ts
const root = new FlowContext();
root.defineProperty('deep', { value: 42 });

const mid = new FlowContext();
mid.addDelegate(root);

const ctx = new FlowContext();
ctx.addDelegate(mid);

console.log(ctx.deep); // 42
```

### 本地属性覆盖代理属性

```ts
const delegate = new FlowContext();
delegate.defineProperty('foo', { value: 'delegate' });

const ctx = new FlowContext();
ctx.addDelegate(delegate);
ctx.defineProperty('foo', { value: 'local' });

console.log(ctx.foo); // 'local'
```

### 方法注册与调用

```ts
const ctx = new FlowContext();
ctx.defineMethod('hello', function (name: string) {
  return `Hello, ${name}!`;
});
console.log(ctx.hello('World')); // 'Hello, World!'
```

### 代理链中的方法查找与 this 绑定

```ts
const delegate = new FlowContext();
delegate.defineMethod('add', function (a: number, b: number) {
  return a + b + (this.extra || 0);
});
delegate.extra = 10;

const ctx = new FlowContext();
ctx.addDelegate(delegate);

console.log(ctx.add(1, 2)); // 13
delegate.extra = 100;
console.log(ctx.add(1, 2)); // 103
```

### 属性元信息树

```ts
const ctx = new FlowContext();
ctx.defineProperty('foo', {
  meta: { type: 'string', title: 'Foo' },
});
ctx.defineProperty('bar', {
  meta: {
    type: 'object',
    title: 'Bar',
    properties: {
      baz: { type: 'number', title: 'Baz' },
      qux: { type: 'string', title: 'Qux' },
    },
  },
});

const delegate = new FlowContext();
delegate.defineProperty('hello', {
  meta: { type: 'string', title: 'Hello' },
});
ctx.addDelegate(delegate);

console.log(JSON.stringify(ctx.getPropertyMetaTree(), null, 2));
/*
[
  {
    "name": "foo",
    "title": "Foo",
    "type": "string"
  },
  {
    "name": "bar",
    "title": "Bar",
    "type": "object",
    "children": [
      {
        "name": "baz",
        "title": "Baz",
        "type": "number"
      },
      {
        "name": "qux",
        "title": "Qux",
        "type": "string"
      }
    ]
  },
  {
    "name": "hello",
    "title": "Hello",
    "type": "string"
  }
]
*/
```

### 代理优先级与移除

```ts
const d1 = new FlowContext();
d1.defineProperty('foo', { value: 'from d1' });

const d2 = new FlowContext();
d2.defineProperty('foo', { value: 'from d2' });

const ctx = new FlowContext();
ctx.addDelegate(d1);
ctx.addDelegate(d2);

console.log(ctx.foo); // 'from d2'（后添加的优先）
ctx.removeDelegate(d2);
console.log(ctx.foo); // 'from d1'（d2 被移除后，d1 成为代理链顶端）
```
