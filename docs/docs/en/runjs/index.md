# RunJS Overview

RunJS is the JavaScript execution environment in NocoBase for **JS blocks**, **JS fields**, **JS actions**, and related scenarios. Code runs in a restricted sandbox, safely exposing `ctx` (context APIs), and provides:

- Top-level async (Top-level `await`)
- Import external modules
- Render in container
- Globals

## Top-level async (Top-level `await`)

RunJS supports top-level `await`, no IIFE required.

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

## Import external modules

- Use `ctx.importAsync()` for ESM modules (recommended)
- Use `ctx.requireAsync()` for UMD/AMD modules

## Render in container

Use `ctx.render()` to render into the current container (`ctx.element`). Three supported forms:

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

## Globals

- `window`
- `document`
- `navigator`
- `ctx`
