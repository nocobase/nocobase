# RunJS

RunJS is the JavaScript execution environment used in NocoBase for **JS blocks**, **JS fields**, **JS actions**, and similar contexts. Code runs in a sandboxed context with access to `ctx` (context APIs), and supports **top-level `await`**, **JSX**, and dynamic loading of ESM modules.

## Features

- **Top-level async**: You can use `await` at the top level without wrapping in an async function.
- **Context (`ctx`)**: APIs such as `ctx.render()`, `ctx.importAsync()`, `ctx.message`, `ctx.libs.React`, `ctx.libs.antd`, and many others are available depending on the RunJS context (block, column, flow node, etc.).
- **JSX**: JSX is supported and compiled automatically to `ctx.libs.React.createElement` (or to a React instance you load via `ctx.importAsync('react@18.2.0')`). No manual React import needed when using built-in React.
- **Dynamic ESM**: Load third-party libraries with `ctx.importAsync('package@version')` (e.g. React, ECharts, FullCalendar). See [ctx.importAsync()](./context/import-async/index.md).

## Quick example (top-level await + dynamic React)

RunJS allows top-level `await`, so you can load React and render in one script:

```ts
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');

const rootEl = document.createElement('div');
ctx.render(rootEl);

createRoot(rootEl).render(
  React.createElement('div', null,
    React.createElement('h1', null, 'Hello')
  )
);
```

With JSX enabled, the same logic can be written as:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');

const rootEl = document.createElement('div');
ctx.render(rootEl);

const App = () => (
  <div>
    <h1>Hello</h1>
  </div>
);
createRoot(rootEl).render(<App />);
```

## See also

- [JSX](./jsx/index.md) — JSX syntax, compilation, and using `ctx.libs.React` or a specific React instance
- [ctx.render()](./context/render/index.md) — render React elements, DOM nodes, or HTML strings into the container
- [ctx.importAsync()](./context/import-async/index.md) — load ESM modules by URL (e.g. React, ECharts, FullCalendar)
- [document](./context/document/index.md) — safe `document` API (createElement, querySelector, etc.) in RunJS
- [ctx.libs.React](./context/libs.react/index.md) — built-in React for JSX
