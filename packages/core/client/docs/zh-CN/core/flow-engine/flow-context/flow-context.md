# FlowContext

`FlowContext` 是 NocoBase 流引擎上下文体系的基础类。所有的 `FlowEngineContext`（全局上下文）、`FlowModelContext`（模型上下文）、`FlowRuntimeContext`（流运行时上下文）等，都是 `FlowContext` 的子类或实例。

它支持灵活注册属性和方法，满足不同层级、不同场景下的上下文扩展需求。

---

## 🎯 设计理念

- **统一上下文基类**：所有流相关上下文都基于 `FlowContext`，便于扩展和类型统一。
- **属性/方法动态注册机制**：
  - 支持同步属性、同步函数属性、异步函数属性（惰性初始化，仅初始化一次并缓存）；
  - 支持同步方法、异步方法（每次调用都会重新执行）。
- **适用于全局、模型、流运行时等多种上下文场景**，支持灵活组合与继承。

---

## 🧩 核心 API

### `defineProps(props: Record<string, any | (() => any) | (() => Promise<any>)>): void`

注册属性。支持：

- **同步属性**：直接赋值；
- **同步工厂属性**：通过普通 `function` 或 `() => any` 提供，首次访问时执行并缓存结果，后续访问直接返回缓存值；
- **异步属性**：通过 `async function` 或 `() => Promise<any>` 提供，首次访问时异步初始化并缓存，后续访问直接返回缓存值。

> ⚠️ 工厂属性（无论同步还是异步）均为惰性初始化，首次访问时执行，后续访问直接返回缓存值。

### `defineMethods(methods: Record<string, Function>): void`

注册方法。支持同步和异步函数。
- 每次调用都会重新执行；
- 可用于注册服务方法、数据访问方法等。

### `delegate(otherContext: FlowContext): void`

将当前上下文的属性和方法访问委托给另一个上下文。
- 支持多层委托链（A → B → C）；
- 不修改当前上下文和被委托上下文的数据；
- 当前上下文已有的属性会优先生效，不被覆盖；
- 实时代理，无需初始化或缓存。

---

## 🚀 用法示例

### 注册属性和方法

```ts
const ctx = new FlowContext();

ctx.defineProps({
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

ctx.defineMethods({
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

ctxB.defineProps({
  version: 'v1.0',
});

ctxA.delegate(ctxB);

console.log(ctxA.version); // 输出 'v1.0'
```

### 属性依赖

```ts
const ctx = new FlowContext();

ctx.defineProps({
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
  // 单次流运行作用域
}
```
