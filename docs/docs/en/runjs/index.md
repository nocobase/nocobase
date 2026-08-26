# RunJS Overview

RunJS is the JavaScript execution environment used in NocoBase for scenarios such as **JS Blocks**, **JS Fields**, and **JS Actions**. Code runs in a restricted sandbox, providing safe access to the `ctx` (Context API) and includes the following capabilities:

- Top-level `await`
- Importing external modules
- Rendering within containers
- Global variables

## Top-level await

RunJS supports top-level `await`, eliminating the need to wrap code in an IIFE.

**Not Recommended**

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

- Use `ctx.importAsync()` for ESM modules (Recommended)
- Use `ctx.requireAsync()` for UMD/AMD modules

## Rendering within Containers

Use `ctx.render()` to render content into the current container (`ctx.element`). It supports the following three formats:

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

## Global Variables

- `window`
- `document`
- `navigator`
- `ctx`