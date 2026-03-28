# ctx.element

An `ElementProxy` instance pointing to the sandbox DOM container, serving as the default rendering target for `ctx.render()`. It is available in scenarios where a rendering container exists, such as `JSBlock`, `JSField`, `JSItem`, and `JSColumn`.

## Applicable Scenarios

| Scenario | Description |
|------|------|
| **JSBlock** | The DOM container for the block, used to render custom block content. |
| **JSField / JSItem / FormJSFieldItem** | The rendering container for a field or form item (usually a `<span>`). |
| **JSColumn** | The DOM container for a table cell, used to render custom column content. |

> Note: `ctx.element` is only available in RunJS contexts that have a rendering container. In contexts without a UI (such as pure backend logic), it may be `undefined`. It is recommended to perform a null check before use.

## Type Definition

```typescript
element: ElementProxy | undefined;

// ElementProxy is a proxy for the raw HTMLElement, exposing a secure API
class ElementProxy {
  __el: HTMLElement;  // The internal raw DOM element (accessible only in specific scenarios)
  innerHTML: string;  // Sanitized via DOMPurify during read/write
  outerHTML: string; // Same as above
  appendChild(child: HTMLElement | string): void;
  // Other HTMLElement methods are passed through (direct use is not recommended)
}
```

## Security Requirements

**Recommended: All rendering should be performed via `ctx.render()`.** Avoid using the DOM APIs of `ctx.element` directly (e.g., `innerHTML`, `appendChild`, `querySelector`, etc.).

### Why ctx.render() is Recommended

| Advantage | Description |
|------|------|
| **Security** | Centralized security control to prevent XSS and improper DOM operations. |
| **React Support** | Full support for JSX, React components, and lifecycles. |
| **Context Inheritance** | Automatically inherits the application's `ConfigProvider`, themes, etc. |
| **Conflict Handling** | Automatically manages React root creation/unmounting to avoid multi-instance conflicts. |

### ❌ Not Recommended: Direct Manipulation of ctx.element

```ts
// ❌ Not recommended: Using ctx.element APIs directly
ctx.element.innerHTML = '<div>Content</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` is deprecated. Please use `ctx.render()` instead.

### ✅ Recommended: Using ctx.render()

```ts
// ✅ Rendering a React component
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Welcome')}>
    <Button type="primary">Click</Button>
  </Card>
);

// ✅ Rendering an HTML string
ctx.render('<div style="padding:16px;">' + ctx.t('Content') + '</div>');

// ✅ Rendering a DOM node
const div = document.createElement('div');
div.textContent = ctx.t('Hello');
ctx.render(div);
```

## Special Case: As a Popover Anchor

When you need to open a Popover using the current element as an anchor, you can access `ctx.element?.__el` to get the raw DOM as the `target`:

```ts
// ctx.viewer.popover requires a raw DOM as the target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Popup Content</div>,
});
```

> Use `__el` only in scenarios like "using the current container as an anchor"; do not manipulate the DOM directly in other cases.

## Relationship with ctx.render

- If `ctx.render(vnode)` is called without a `container` argument, it renders into the `ctx.element` container by default.
- If both `ctx.element` is missing and no `container` is provided, an error will be thrown.
- You can explicitly specify a container: `ctx.render(vnode, customContainer)`.

## Notes

- `ctx.element` is intended for internal use by `ctx.render()`. Directly accessing or modifying its properties/methods is not recommended.
- In contexts without a rendering container, `ctx.element` will be `undefined`. Ensure the container is available or pass a `container` manually before calling `ctx.render()`.
- Although `innerHTML`/`outerHTML` in `ElementProxy` are sanitized via DOMPurify, it is still recommended to use `ctx.render()` for unified rendering management.

## Related

- [ctx.render](./render.md): Rendering content into a container
- [ctx.view](./view.md): Current view controller
- [ctx.modal](./modal.md): Shortcut API for modals