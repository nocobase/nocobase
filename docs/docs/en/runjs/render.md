# In-container Rendering

Use `ctx.render()` to render content into the current container (`ctx.element`). It supports the following three forms:

## `ctx.render()`

### Rendering JSX

```jsx
ctx.render(<button>Button</button>);
```

### Rendering DOM Nodes

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Rendering HTML Strings

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX Description

RunJS can render JSX directly. You can use the built-in React/component libraries or load external dependencies on demand.

### Using Built-in React and Component Libraries

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Using External React and Component Libraries

Load specific versions on demand via `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Suitable for scenarios requiring specific versions or third-party components.

## ctx.element

Not recommended (deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Recommended way:

```js
ctx.render(<h1>Hello World</h1>);
```