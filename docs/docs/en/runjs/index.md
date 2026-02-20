# RunJS Overview

RunJS is the JavaScript execution environment in NocoBase used for **JS Block**, **JS Field**, **JS Action**, and similar scenarios. Code runs in a restricted sandbox with safe access to the `ctx` (context API) and supports:

- Top-level `await`
- Importing external modules
- Render in container
- Global variables

## Top-level `await`

RunJS supports top-level `await`; you do not need to wrap code in an IIFE.

**Not recommended**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Recommended**

```js
async function test() {}
await test();
```

## Importing External Modules

- ESM modules: use `ctx.importAsync()` (recommended)
- UMD/AMD modules: use `ctx.requireAsync()`

## Render in Container

Use `ctx.render()` to render content into the current container (`ctx.element`) in three ways:

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

## Global Variables

- `window`
- `document`
- `navigator`
- `ctx`
