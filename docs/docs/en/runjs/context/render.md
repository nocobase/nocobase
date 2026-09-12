# ctx.render()

Renders React elements, HTML strings, or DOM nodes into a specified container. If `container` is not provided, it defaults to rendering into `ctx.element` and automatically inherits the application's context, such as ConfigProvider and themes.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock** | Render custom block content (charts, lists, cards, etc.) |
| **JSField / JSItem / JSColumn** | Render custom displays for editable fields or table columns |
| **Details Block** | Customize the display format of fields in details pages |

> Note: `ctx.render()` requires a rendering container. If `container` is not passed and `ctx.element` does not exist (e.g., in pure logic scenarios without a UI), an error will be thrown.

## Type Definition

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Type | Description |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Content to be rendered |
| `container` | `Element` \| `DocumentFragment` (Optional) | Target rendering container, defaults to `ctx.element` |

**Return Value**:

- When rendering a **React element**: Returns `ReactDOMClient.Root`, making it easy to call `root.render()` for subsequent updates.
- When rendering an **HTML string** or **DOM node**: Returns `null`.

## vnode Type Description

| Type | Behavior |
|------|------|
| `React.ReactElement` (JSX) | Rendered using React's `createRoot`, providing full React capabilities and automatically inheriting the application context. |
| `string` | Sets the container's `innerHTML` after sanitization with DOMPurify; any existing React root will be unmounted first. |
| `Node` (Element, Text, etc.) | Appends via `appendChild` after clearing the container; any existing React root will be unmounted first. |
| `DocumentFragment` | Appends fragment child nodes to the container; any existing React root will be unmounted first. |

## Examples

### Rendering React Elements (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Title')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked'))}>
      {ctx.t('Button')}
    </Button>
  </Card>
);
```

### Rendering HTML Strings

```ts
ctx.render('<h1>Hello World</h1>');

// Combining with ctx.t for internationalization
ctx.render('<div style="padding:16px">' + ctx.t('Content') + '</div>');

// Conditional rendering
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Rendering DOM Nodes

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Render an empty container first, then hand it over to a third-party library (e.g., ECharts) for initialization
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Specifying a Custom Container

```ts
// Render to a specific DOM element
const customEl = document.getElementById('my-container');
ctx.render(<div>Content</div>, customEl);
```

### Multiple Calls Will Replace Content

```ts
// The second call will replace the existing content in the container
ctx.render(<div>First</div>);
ctx.render(<div>Second</div>);  // Only "Second" will be displayed
```

## Notes

- **Multiple calls will replace content**: Each `ctx.render()` call replaces the existing content in the container rather than appending to it.
- **HTML string safety**: Passed HTML is sanitized via DOMPurify to reduce XSS risks, but it is still recommended to avoid concatenating untrusted user input.
- **Do not manipulate ctx.element directly**: `ctx.element.innerHTML` is deprecated; `ctx.render()` should be used consistently instead.
- **Pass container when no default exists**: In scenarios where `ctx.element` is `undefined` (e.g., within modules loaded via `ctx.importAsync`), a `container` must be explicitly provided.

## Related

- [ctx.element](./element.md) - Default rendering container, used when no container is passed to `ctx.render()`.
- [ctx.libs](./libs.md) - Built-in libraries like React and Ant Design, used for JSX rendering.
- [ctx.importAsync()](./import-async.md) - Used in conjunction with `ctx.render()` after loading external React/component libraries on demand.