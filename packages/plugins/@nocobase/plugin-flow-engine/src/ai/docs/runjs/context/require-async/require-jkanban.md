---
title: "Render a Kanban Board with jKanban"
description: "Load jKanban (CSS + JS) via ctx.requireAsync and render a drag-and-drop kanban board."
---

# Render a Kanban Board with jKanban

Load jKanban with `ctx.requireAsync()`: load the CSS first, then the UMD script (attached to `window.jKanban`, capital K). Use `ctx.libs.React` and `ctx.render()` to mount a React component that initializes jKanban in a `useEffect`.

```ts
// 1) Load styles first
await ctx.requireAsync('jkanban@1.3.1/dist/jkanban.min.css');

// 2) Load script (attached to window.jKanban, capital K)
await ctx.requireAsync('jkanban@1.3.1/dist/jkanban.min.js');

const React = ctx.libs.React;
const mountId = `nb-kanban-${Date.now()}`;

function KanbanApp() {
  const initedRef = React.useRef(false);

  React.useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    if (!('jKanban' in window)) {
      throw new Error('window.jKanban not found (capital K).');
    }

    const kanban = new window.jKanban({
      element: `#${mountId}`,
      gutter: '10px',
      widthBoard: '260px',
      dragBoards: true,
      dragItems: true,
      boards: [
        { id: '_todo', title: 'To Do', item: [{ title: 'Task 1' }, { title: 'Task 2' }] },
        { id: '_doing', title: 'Doing', item: [{ title: 'In progress' }] },
        { id: '_done', title: 'Done', item: [{ title: 'Done' }] },
      ],
    });

    kanban.addElement('_todo', { title: 'New task (addElement)' });

    return () => {
      const el = document.querySelector(`#${mountId}`);
      if (el) el.innerHTML = '';
    };
  }, []);

  return <div id={mountId} style={{ minHeight: 320 }} />;
}

ctx.render(<KanbanApp />);
```

> **Tips:**
> - Load **CSS first**, then the **JS** so styles apply before the board renders.
> - jKanban attaches to **`window.jKanban`** (capital K). Use `new window.jKanban(options)`.
> - Use **`ctx.libs.React`** and **`ctx.render()`** to mount the component. In React 18 strict mode, guard one-time init in `useEffect` with a ref.
> - jKanban does not expose a destroy API; clear the container in the effect cleanup (`el.innerHTML = ''`).
