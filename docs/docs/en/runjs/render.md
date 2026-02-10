# Render in Container

Use `ctx.render()` to render content into the current container (`ctx.element`). Three forms are supported:

## `ctx.render()`

### Render JSX

```jsx
ctx.render(<button>Button</button>);
```

### Render DOM nodes

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Render HTML strings

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX notes

RunJS can render JSX directly, using either built-in React/components or external dependencies.

### Use built-in React and component library

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Use external React and component library

Load specific versions with `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

This is useful when you need a specific version or third-party components.

## ctx.element

Not recommended (deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Recommended:

```js
ctx.render(<h1>Hello World</h1>);
```
