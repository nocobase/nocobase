# ctx.defineProperty() - 定义属性

## 定义同步属性

同步属性适用于绝大多数场景，直接读取即可，无需异步处理。

```ts
ctx.defineProperty({
  get: () => 'foo',
});
```

<code src="./sync-value.tsx"></code>

## 定义异步属性

异步属性需要通过 `await` 获取，不能直接在 render 中使用。推荐配合 [如何维护异步 ctx 属性的 loading 状态](/examples/flow-context/loading) 一起使用。

```ts
ctx.defineProperty({
  get: async () => 'bar',
});
```

<code src="./async-value.tsx"></code>

## 异步属性的并发

- 多次并发访问同一个异步属性，只会执行一次 getter，后续直接读取缓存结果。

<code src="./concurrent-async.tsx"></code>

## 属性缓存机制

- 属性默认带缓存，getter 只会执行一次，后续读取返回缓存值。
- 可通过 `cache: false` 禁用缓存，每次读取都会重新执行 getter。
- 可通过 `ctx.removeCache(key)` 清除指定属性的缓存。

<code src="./cache.tsx"></code>

## Observable 的属性

- `observable: true` 时，如果属性值变更时，所有 observer 的地方都会变更。

<code src="./observable.tsx"></code>

## observable.ref & observable.box 响应式属性

可用于代替 React 的 `useState()`，实现响应式数据。

- `observable.ref(value)`：返回一个响应式对象，直接通过 `.value` 读写。
- `observable.box(value)`：返回一个响应式盒子对象，支持 `.get()` 和 `.set()` 方法。

两者都能实现响应式，区别在于：

- ref：只观察引用（浅观察，不递归）
- box：观察值和它的内部（深度观察）

<code src="./observable-ref-box.tsx"></code>

## once 只定义一次

- 设置 `once: true` 后，属性只会采用第一次定义，后续同名定义无效。

<code src="./once.tsx"></code>

## 属性元信息树

获取当前上下文及代理链上的所有属性元信息，一般用于 UI 变量的级联选择器里。

<code src="./meta.tsx"></code>
