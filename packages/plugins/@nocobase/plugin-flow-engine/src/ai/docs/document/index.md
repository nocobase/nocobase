# document

In the RunJS execution environment, `document` is a **safely wrapped global object** that only exposes a small set of DOM creation and query methods to prevent scripts from arbitrarily accessing or mutating the page structure.

> In RunJS, `document` is typically exposed through the safe `window` proxy, and its capabilities are controlled by `createSafeDocument()`.

## Allowed methods

The safe `document` only supports the following methods (plus a small number of platform-injected methods):

```ts
document.createElement(tagName: string): HTMLElement;
document.querySelector(selectors: string): Element | null;
document.querySelectorAll(selectors: string): NodeListOf<Element>;
```

All other properties and methods (such as `document.body`, `document.cookie`, `document.write`, etc.) are **not available**, and access will throw an error:

```ts
// ❌ Not allowed: access to properties not on the allowlist
document.body; // throws an error
```

## Notes

- `document` is a **proxy** for the real `window.document`:
  - `createElement` calls the real `document.createElement`
  - `querySelector` / `querySelectorAll` call the real methods
  - Only allowlisted methods are accessible; others throw errors
- Design goals:
  - **Principle of least privilege**: only expose node creation and query capabilities
  - Prevent access to sensitive information or dangerous operations via `document` (e.g., injecting scripts, modifying global structure)
- It is recommended to render UI through `ctx.render()` and `ctx.element` in RunJS instead of directly manipulating the DOM

## Basic Usage

### Create an element and pass it to ctx.render()

```ts
// Create a container element
const div = document.createElement('div');
div.textContent = 'Hello from safe document';

// Recommended: hand off to ctx.render() to render into the safe container
ctx.render(div);
```

### Query existing elements (read-only or controlled operations)

```ts
// Query the first matching element
const firstButton = document.querySelector('button.primary');

// Query all matching elements
const links = document.querySelectorAll('a[data-track]');

// Prefer controlled, side-effect-free reads or limited operations
links.forEach((link) => {
  console.log('Tracked link:', link.getAttribute('href'));
});
```

## Notes

- `document` only exposes allowlisted methods; any other method/property access will throw an error
- Avoid relying on the global DOM structure for complex operations; prefer:
  - Render React components or nodes with `ctx.render()`
  - Use `ctx.element` as the render container (via `ctx.render()`)
- If you need access to the clipboard, network, or other capabilities, use the corresponding safe APIs (e.g., `navigator.clipboard`, `ctx.api`) instead of indirect access via `document`
