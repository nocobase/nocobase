# RunJS 概述

RunJS 是 NocoBase 中用于 **JS 区块**、**JS 字段**、**JS 操作** 等场景的 JavaScript 执行环境。代码运行在受限沙箱中，可安全访问 `ctx`（上下文 API），并具备以下能力：

- 顶层异步（Top-level `await`）
- 导入外部模块
- 容器内渲染
- 全局变量

## 顶层异步（Top-level `await`）

RunJS 内支持顶层 `await`，无需包裹在 IIFE 中。

**不推荐**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**推荐**

```js
async function test() {}
await test();
```

## 导入外部模块

- ESM 模块使用 `ctx.importAsync()`（推荐）
- UMD/AMD 模块用 `ctx.requireAsync()`

## 容器内渲染

使用 `ctx.render()` 将内容渲染到当前容器（`ctx.element`）中，支持以下三种形式：

### 渲染 JSX

```jsx
ctx.render(<button>Button</button>);
```

### 渲染 DOM 节点

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### 渲染 HTML 字符串

```js
ctx.render('<h1>Hello World</h1>');
```

## 全局变量

- `window`
- `document`
- `navigator`
- `ctx`
