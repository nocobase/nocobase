# ctx.element

Points to the sandbox DOM container as an ElementProxy instance.

## Type definition

```typescript
element: ElementProxy
```

## Notes

`ctx.element` is an ElementProxy for the sandbox container. **For safety, do not call `ctx.element` APIs directly** (e.g. `innerHTML`, `appendChild`, `querySelector`).

NocoBase JS blocks provide an element proxy that only exposes safe attributes and methods.

## Security requirements

**Do not use `ctx.element` APIs directly.** All DOM operations must go through `ctx.render()`.

### Incorrect usage

```ts
// Not allowed: direct ctx.element access
ctx.element.innerHTML = '<div>Content</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

### Correct usage: use ctx.render()

All rendering should go through `ctx.render()`:

```ts
// Render React components
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Welcome')}>
    <Button type="primary">Click</Button>
  </Card>
);
```

```ts
// Render HTML string
ctx.render('<div style="padding:16px;">' + ctx.t('Content') + '</div>');
```

```ts
// Render DOM node
const div = document.createElement('div');
div.textContent = ctx.t('Hello');
ctx.render(div);
```

## Why ctx.render() is required

Benefits of `ctx.render()`:

- **Security**: centralized safety checks
- **React support**: full React and JSX support
- **Context inheritance**: app context is inherited automatically
- **Lifecycle**: better component lifecycle management
- **Conflict handling**: manages React root creation/unmounting

## Notes

- `ctx.element` is only used as the internal container for `ctx.render()`
- Do not access or modify `ctx.element` properties directly
- All rendering must go through `ctx.render()`
