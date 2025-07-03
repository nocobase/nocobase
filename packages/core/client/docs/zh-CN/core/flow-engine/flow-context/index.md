# FlowContext

`FlowContext` 是流引擎上下文体系的基础类。所有的 `FlowEngineContext`（全局上下文）、`FlowModelContext`（模型上下文）、`FlowRuntimeContext`（流运行时上下文）等，都是 `FlowContext` 的子类。

它支持灵活注册属性和方法，满足不同层级、不同场景下的上下文扩展需求。

---

## 🎯 设计理念

- **统一上下文基类**：所有流相关上下文都基于 `FlowContext`，便于扩展和类型统一。
- **属性/方法动态注册机制**：
  - 支持同步属性、同步函数属性、异步函数属性（**惰性初始化，仅初始化一次并缓存**）；
  - 支持同步方法、异步方法（每次调用都会重新执行）。
- **适用于全局、模型、流运行时等多种上下文场景**，支持灵活组合与继承。

---

## 🧩 核心 API

### `setProps(props: Record<string, any | () => any | () => Promise<any>>): void`

注册属性，支持三种类型：

1. **同步属性值**：如 `prop1: 'hello'`，直接赋值；
2. **同步函数属性**：如 `prop2: () => 'value'`，函数返回值将初始化为属性，**仅执行一次并缓存**；
3. **异步函数属性**：如 `prop3: async () => 'value'`，首次访问会执行异步逻辑并缓存结果。

> ⚠️ **无论是同步函数还是异步函数，都只会初始化一次，后续访问返回缓存值。**

---

### `setMethods(methods: Record<string, Function>): void`

注册方法。支持同步和异步函数。

- 每次调用都会重新执行；
- 可用于注册服务方法、数据访问方法等。


### `delegate(otherContext: FlowContext): void`

将当前上下文的属性和方法访问委托给另一个上下文。

当当前上下文中访问某个属性或方法时，如果本地不存在，会自动向被委托的 `otherContext` 查找。这种方式不会复制属性，仅建立访问代理关系，适用于上下文继承、共享服务访问等场景。

特性

- 支持多层委托链（A → B → C）；
- 不修改当前上下文和被委托上下文的数据；
- 当前上下文已有的属性会优先生效，不被覆盖；
- 实时代理，无需初始化或缓存。

---

## 🚀 用法示例

### 注册属性和方法

```ts
const ctx = new FlowContext();

ctx.setProps({
  // 1. 同步属性值
  prop1: 'hello',

  // 2. 同步函数属性（惰性执行一次）
  prop2: () => {
    console.log('init prop2');
    return 'value';
  },

  // 3. 异步函数属性（惰性执行一次）
  prop3: async () => {
    console.log('init prop3');
    await new Promise((r) => setTimeout(r, 100));
    return 'async value';
  },
});

ctx.setMethods({
  fn1: () => {
    return 'fn1 called';
  },
  fn2: async () => {
    return 'fn2 called';
  },
});

(async () => {
  console.log(ctx.prop1); // hello
  console.log(ctx.prop2); // init prop2\nvalue
  console.log(ctx.prop2); // value（缓存返回）
  console.log(await ctx.prop3); // init prop3\nasync value
  console.log(await ctx.prop3); // async value（缓存返回）
  console.log(ctx.fn1()); // fn1 called
  console.log(await ctx.fn2()); // fn2 called
})();
```

### 委托访问示例（继承）

```ts
const ctxA = new FlowContext();
const ctxB = new FlowContext();

ctxB.setProps({
  version: 'v1.0',
});

ctxA.delegate(ctxB);

console.log(ctxA.version); // 输出 'v1.0'
```

## 属性依赖

```ts
const ctx = new FlowContext();

ctx.setProps({
  a: (ctx) => {
    console.log('init a');
    return 1;
  },
  b: (ctx) => {
    console.log('init b');
    return ctx.a + 1;
  },
  c: async (ctx) => {
    console.log('init c');
    return ctx.b * 2;
  },
});

(async () => {
  console.log('read a:', ctx.a); // init a \n read a: 1
  console.log('read b:', ctx.b); // init b \n read b: 2
  console.log('read c:', await ctx.c); // init c \n read c: 4

  // 再访问，不会重复初始化
  console.log('read a again:', ctx.a); // 1
  console.log('read b again:', ctx.b); // 2
  console.log('read c again:', await ctx.c); // 4
})();
```

---

## 🧬 继承结构

```ts
class FlowEngineContext extends FlowContext {
  // 全局作用域
}

class FlowModelContext extends FlowContext {
  // 单个模型或模型树作用域
}

class FlowRuntimeContext extends FlowContext {
  // 单次流程运行作用域
}
```

---

## 🌐 上下文体系概览

NocoBase 流引擎的上下文体系分为三层，分别对应不同的作用域，合理使用可实现服务、配置、数据的灵活共享与隔离，提升业务可维护性和可扩展性。

### **1. FlowEngineContext（全局上下文）**

- 在整个应用生命周期中初始化一次；
- 所有模型、流程都可访问；
- 适用于注册全局服务、配置、数据库连接等。

### **2. FlowModelContext（模型上下文）**

- 用于模型树内部共享上下文；
- 子模型会自动继承父模型上下文；
- 支持局部覆盖（若有同名属性，以子模型的为准）；
- 适用于模型级别的逻辑和数据隔离。

### **3. FlowRuntimeContext（流运行时上下文）**

- 每次流程执行时创建；
- 贯穿整个流程运行周期；
- 适用于流程中的数据传递、变量存储、运行状态记录等。

---

## 🗂️ 层级结构图

```text
FlowEngineContext（全局上下文）
│
├── FlowModelContext（模型上下文） 1
│     ├── 子 FlowModelContext（子模型） 1-1（继承父上下文）
│     │     ├── FlowRuntimeContext（流运行时上下文） 1-1-1
│     │     └── FlowRuntimeContext（流运行时上下文） 1-1-2
│     └── FlowRuntimeContext（流运行时上下文） 1-1
│
├── FlowModelContext（模型上下文） 2
│     └── FlowRuntimeContext（流运行时上下文） 2-1
│
└── FlowModelContext（模型上下文） 3
      ├── 子 FlowModelContext（子模型） 3-1（继承父上下文）
      │     └── FlowRuntimeContext（流运行时上下文） 3-1-1
      └── FlowRuntimeContext（流运行时上下文） 3-1
```
