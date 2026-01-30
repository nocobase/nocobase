---
title: "Load @dnd-kit/core with importAsync"
description: "Load React and @dnd-kit in NocoBase RunJS via ctx.importAsync, and render drag-and-drop or sortable lists with ctx.render and createRoot."
---

# Load @dnd-kit/core with importAsync

In NocoBase RunJS (e.g. JS block or JS field), use `ctx.importAsync()` to load React and @dnd-kit; create a container with `document.createElement`, render it into the current block with `ctx.render()`, then mount React with `createRoot().render()`. Use `ctx.message` for feedback. No JSX—use `React.createElement`.

## Simple drag example (@dnd-kit/core only: useDraggable + useDroppable)

Uses only `@dnd-kit/core` with `useDraggable` and `useDroppable` to implement a draggable block and a drop zone. Logic matches [dnd-kit.html](./dnd-kit.html); in RunJS we use `ctx.importAsync`, `ctx.render`, and `ctx.message` instead of page DOM and a status area.

```ts
// 1. Load React, react-dom, @dnd-kit/core (?deps ensures same React instance as page, avoids Invalid hook call)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const core = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } = core;

function DraggableBox() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'box' });
  const style = {
    padding: 12,
    marginBottom: 8,
    background: '#e6f7ff',
    cursor: 'grab',
    transform: transform ? 'translate3d(' + transform.x + 'px,' + transform.y + 'px,0)' : undefined,
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Drag me');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement('div', {
    ref: setNodeRef,
    style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
  }, 'Drop here');
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Dropped in zone');
  }
  return React.createElement(
    DndContext,
    { sensors, collisionDetection: closestCenter, onDragEnd },
    React.createElement('div', { style: { maxWidth: 280 } },
      React.createElement(DraggableBox),
      React.createElement(DropZone)
    )
  );
}

// 2. Create container, render to current block with ctx.render, then mount React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

## Sortable list example (@dnd-kit/core + sortable + utilities)

Uses `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` to implement a sortable list. Same pattern: `rootEl` + `ctx.render(rootEl)` + `createRoot(rootEl).render(...)` with the same React instance.

```ts
// 1. Load React and @dnd-kit packages (?deps ensures same React instance)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const dndCore = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const dndSortable = await ctx.importAsync('@dnd-kit/sortable@10.0.0?deps=react@18.2.0,react-dom@18.2.0');
const dndUtils = await ctx.importAsync('@dnd-kit/utilities@3.2.2');

const { useState } = React;
const {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} = dndCore;
const {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} = dndSortable;
const { CSS } = dndUtils;

// 2. Sortable item component (must be inside SortableContext)
function SortableItem(props) {
  const { id, label } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    marginBottom: 8,
    background: '#f5f5f5',
    borderRadius: 6,
    cursor: 'grab',
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, label);
}

// 3. App: DndContext + SortableContext + drag end handler
const labels = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth' };
function App() {
  const [items, setItems] = useState([1, 2, 3, 4]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(function (prev) {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      ctx.message.success('List reordered');
    }
  }

  return React.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: handleDragEnd,
    },
    React.createElement(
      SortableContext,
      { items, strategy: verticalListSortingStrategy },
      React.createElement(
        'div',
        { style: { maxWidth: 320 } },
        items.map(function (id) {
          return React.createElement(SortableItem, { key: id, id, label: labels[id] });
        })
      )
    )
  );
}

// 4. Create container, ctx.render to current block, then mount React (same as simple drag example)
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

## Notes

- **React and deps**: Use `ctx.importAsync('react@18.2.0')` and `ctx.importAsync('react-dom@18.2.0/client')`; add `?deps=react@18.2.0,react-dom@18.2.0` to @dnd-kit packages so they share the same React instance as the page and avoid "Invalid hook call". Use `React.createElement(type, props, ...children)` when not using JSX.
- **Package roles**: `@dnd-kit/core` provides `DndContext`, sensors, `useDraggable`, `useDroppable`; `@dnd-kit/sortable` provides `SortableContext`, `useSortable`, `arrayMove`; `@dnd-kit/utilities` provides `CSS.Transform`, etc.
- **SortableContext**: `items` should match the current list order; in `onDragEnd` reorder with `arrayMove` and update state.
- **ctx.render()**: Create a container with `document.createElement('div')`, then `ctx.render(container)` to render it into the current block, then `createRoot(container).render(...)` to mount React.
- **Feedback**: In RunJS use `ctx.message.success()` / `ctx.message.info()` etc. instead of an on-page status area.
