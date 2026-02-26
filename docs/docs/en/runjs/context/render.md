# ctx.render()

Renders a React element, HTML string, or DOM node into a container. Without `container`, renders into `ctx.element` and inherits the app’s ConfigProvider, theme, etc.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | Custom block content (charts, lists, cards, etc.) |
| **JSField / JSItem / JSColumn** | Custom editable field or table column |
| **Detail block** | Custom detail field display |

> Note: `ctx.render()` needs a container. If you don’t pass `container` and `ctx.element` is missing (e.g. no-UI logic), an error is thrown.

## Type

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Type | Description |
|------------|------|-------------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Content to render |
| `container` | `Element` \| `DocumentFragment` (optional) | Target container; default `ctx.element` |

**Returns**:

- For **React element**: `ReactDOMClient.Root` (for later `root.render()` updates).
- For **HTML string** or **DOM node**: `null`.

## vnode types

| Type | Behavior |
|------|----------|
| `React.ReactElement` (JSX) | Rendered with React `createRoot`; full React; inherits app context |
| `string` | Sanitized with DOMPurify and set as container `innerHTML`; existing React root is unmounted first |
| `Node` (Element, Text, etc.) | Container cleared then `appendChild`; existing React root unmounted first |
| `DocumentFragment` | Fragment children appended to container; existing React root unmounted first |

## Examples

### React (JSX)

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

### HTML string

```ts
ctx.render('<h1>Hello World</h1>');

ctx.render('<div style="padding:16px">' + ctx.t('Content') + '</div>');

ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### DOM node

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Custom container

```ts
const customEl = document.getElementById('my-container');
ctx.render(<div>Content</div>, customEl);
```

### Multiple calls replace content

```ts
ctx.render(<div>First</div>);
ctx.render(<div>Second</div>);  // Only "Second" is shown
```

## Notes

- **Each call replaces**: Content is replaced, not appended.
- **HTML safety**: HTML is sanitized with DOMPurify; still avoid concatenating untrusted user input.
- **Don’t touch ctx.element directly**: `ctx.element.innerHTML` is deprecated; use `ctx.render()`.
- **No container**: When `ctx.element` is `undefined` (e.g. inside a module loaded by `ctx.importAsync`), pass `container` explicitly.

## Related

- [ctx.element](./element.md): default container when `container` is not passed
- [ctx.libs](./libs.md): React, antd, etc. for JSX
- [ctx.importAsync()](./import-async.md): load external React/components then use with `ctx.render()`
