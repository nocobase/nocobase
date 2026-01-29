# document

RunJS 执行环境中的 `document` 是一个**安全封装后的全局对象**，只暴露少量用于创建和查询 DOM 的方法，防止脚本随意访问和篡改页面结构。

> 在 RunJS 中，`document` 通常通过安全的 `window` 代理暴露出来，其能力由 `createSafeDocument()` 控制。

## 允许的方法

安全 `document` 仅支持以下方法（以及平台注入的少量额外方法）：

```ts
document.createElement(tagName: string): HTMLElement;
document.querySelector(selectors: string): Element | null;
document.querySelectorAll(selectors: string): NodeListOf<Element>;
```

其他属性与方法（例如 `document.body`、`document.cookie`、`document.write` 等）**一律不可用**，访问会抛出错误：

```ts
// ❌ 不允许：访问未在白名单中的属性
document.body; // 会抛出错误
```

## 说明

- `document` 是对真实 `window.document` 的**代理**：
  - `createElement` 内部调用真实的 `document.createElement`
  - `querySelector` / `querySelectorAll` 内部调用真实方法
  - 只允许访问白名单中的方法，其余访问会抛出错误
- 设计目标：
  - **最小权限原则**：仅暴露创建节点和查询节点的能力
  - 避免通过 `document` 访问到敏感信息或进行危险操作（如注入脚本、修改全局结构等）
- 更推荐在 RunJS 中通过 `ctx.render()` 与 `ctx.element` 渲染 UI，而不是大量直接操作 DOM

## 基本用法

### 创建元素并交给 ctx.render()

```ts
// 创建一个容器元素
const div = document.createElement('div');
div.textContent = 'Hello from safe document';

// 推荐：最终交给 ctx.render() 渲染到安全容器中
ctx.render(div);
```

### 查询已有元素（只读或受控操作）

```ts
// 查询第一个匹配的元素
const firstButton = document.querySelector('button.primary');

// 查询所有匹配的元素
const links = document.querySelectorAll('a[data-track]');

// 建议只做受控、无副作用的读取或受限操作
links.forEach((link) => {
  console.log('Tracked link:', link.getAttribute('href'));
});
```

## 注意事项

- `document` 仅暴露白名单方法，任何未列出的方法 / 属性访问都会抛出错误
- 避免依赖全局 DOM 结构做复杂操作，更推荐：
  - 使用 `ctx.render()` 渲染 React 组件或节点
  - 使用 `ctx.element` 作为渲染容器（通过 `ctx.render()` 间接使用）
- 若需要访问剪贴板、网络等能力，请使用对应的安全 API（例如 `navigator.clipboard`、`ctx.api` 等），而不是通过 `document` 间接实现
