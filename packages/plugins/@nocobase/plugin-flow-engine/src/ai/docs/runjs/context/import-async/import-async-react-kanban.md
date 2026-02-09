---
title: "Load @asseinfo/react-kanban with importAsync"
description: "Load @asseinfo/react-kanban in NocoBase RunJS via ctx.importAsync, and render the kanban board with ctx.render and createRoot."
---

# Load @asseinfo/react-kanban with importAsync

In NocoBase RunJS (e.g. JS block or JS field), use `ctx.importAsync()` to load React and `@asseinfo/react-kanban`; create a container with `document.createElement`, render it into the current block with `ctx.render()`, then mount the board with `createRoot().render()`. No JSX—use `React.createElement`.

```ts
// 1. Load styles (ctx.importAsync directly loads .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Load React, react-dom, @asseinfo/react-kanban (?deps ensures same React instance)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const { Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Add card', description: 'Add capability to add a card in a column' },
      ],
    },
    {
      id: 2,
      title: 'Doing',
      cards: [
        { id: 2, title: 'Drag-n-drop support', description: 'Move a card between the columns' },
      ],
    },
  ],
};

// 3. Create container and render to current block with ctx.render
const rootEl = document.createElement('div');
rootEl.style.minHeight = '400px';
ctx.render(rootEl);

// 4. Mount the board
createRoot(rootEl).render(React.createElement(Board, { initialBoard: board }));
```

## Notes

- **Module loading**: `ctx.importAsync` calls can be placed at the top.
- **CSS**: `ctx.importAsync` also supports loading `.css` files.
- **React in this scenario**: Do not rely on a built-in or in-page React instance. Always load React and react-dom via `ctx.importAsync('react@18.2.0')` and `ctx.importAsync('react-dom@18.2.0/client')` so that @asseinfo/react-kanban (and any other ESM-loaded React libs) use the same React instance; otherwise you get "Invalid hook call" or duplicate React.
- **React version**: Use `?deps=react@18.2.0,react-dom@18.2.0` so @asseinfo/react-kanban shares the same React instance as the page and avoids "Invalid hook call".
- **No JSX**: Use `React.createElement`; no JSX compilation required.
