# 容器内渲染

使用 `ctx.render()` 将内容渲染到当前容器（`ctx.element`）中，支持以下三种形式：

## `ctx.render()`

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

## JSX 说明

RunJS 可直接渲染 JSX，既可以使用内置 React/组件库，也可以按需加载外部依赖。

### 使用内置 React 与组件库

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### 使用外部 React 与组件库

通过 `ctx.importAsync()` 按需加载指定版本：

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

适合需要特定版本或第三方组件的场景。

## ctx.element

不推荐的用法（已废弃）：

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

推荐的方式：

```js
ctx.render(<h1>Hello World</h1>);
```
