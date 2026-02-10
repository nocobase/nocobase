# ctx.render

Render a React element, HTML string, or DOM node into the `ctx.element` container.

## Type definition

```typescript
render(
  vnode: React.ReactElement | Node | DocumentFragment | string
): ReactDOMClient.Root | null
```

## Parameters

- **vnode**: content to render
  - `React.ReactElement`: React element (JSX) with full React capabilities
  - `Node`: DOM node appended to the container
  - `DocumentFragment`: child nodes appended to the container
  - `string`: HTML string assigned to `innerHTML`

## Return value

- When rendering a React element: returns a `ReactDOMClient.Root` instance for further updates
- When rendering HTML string or DOM node: returns `null`

## Notes

- Content is rendered into the `ctx.element` container
- Calling `ctx.render()` multiple times replaces existing content
- React rendering uses React `createRoot` and inherits app context automatically
- When rendering an HTML string, any existing React root is unmounted first
