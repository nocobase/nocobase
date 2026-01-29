# ctx.render()

Render React elements, HTML strings, or DOM nodes into the `ctx.element` container.

## Type Definition

```typescript
render(
  vnode: React.ReactElement | Node | DocumentFragment | string
): ReactDOMClient.Root | null
```

## Parameters

- **vnode**: content to render
  - `React.ReactElement`: React element (JSX), with full React capabilities
  - `Node`: DOM node, appended directly to the container
  - `DocumentFragment`: fragment whose child nodes are appended to the container
  - `string`: HTML string, sets the container's `innerHTML`

## Returns

- When rendering a React element: returns a `ReactDOMClient.Root` instance for future updates
- When rendering an HTML string or DOM node: returns `null`

## Notes

- Content is rendered into the `ctx.element` container
- Multiple calls to `ctx.render()` replace the container's content
- When rendering React elements, React's `createRoot` API is used and app context is inherited automatically
- When rendering an HTML string, any existing React root in the container is unmounted first
