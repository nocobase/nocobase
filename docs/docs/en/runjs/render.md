# Render in Container

Use `ctx.render()` to render content into the current container (`ctx.element`) in three ways:

## ctx.render()

### Render JSX

```jsx
ctx.render(<button>Button</button>);
```

### Render DOM Node

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Render HTML String

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX Notes

RunJS can render JSX directly, using either the built-in React/component library or externally loaded dependencies.

### Using Built-in React and Components

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Using External React and Components

Load a specific version via `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Use this when you need a specific version or third-party components.

## ctx.element

**Not recommended** (deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

**Recommended**:

```js
ctx.render(<h1>Hello World</h1>);
```
