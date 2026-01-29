# ctx.element

ElementProxy instance pointing to the sandboxed DOM container.

## Type Definition

```typescript
element: ElementProxy
```

## Notes

`ctx.element` is an ElementProxy pointing to a sandboxed DOM container. **For safety, do not use the `ctx.element` APIs directly** (such as `innerHTML`, `appendChild`, `querySelector`, etc.).

## Safety Requirements

**Direct use of `ctx.element` APIs is prohibited.** All DOM operations should be done through `ctx.render()`.

### ❌ Incorrect usage

```ts
// ❌ Not allowed: direct use of ctx.element APIs
ctx.element.innerHTML = '<div>Content</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

### ✅ Correct usage: use ctx.render()

All rendering should use `ctx.render()`:

```ts
// ✅ Correct: render a React component with ctx.render()
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Welcome')}>
    <Button type="primary">Click</Button>
  </Card>
);
```

```ts
// ✅ Correct: render an HTML string with ctx.render()
ctx.render('<div style="padding:16px;">' + ctx.t('Content') + '</div>');
```

```ts
// ✅ Correct: render a DOM node with ctx.render()
const div = document.createElement('div');
div.textContent = ctx.t('Hello');
ctx.render(div);
```

## Why ctx.render() is required

Advantages of using `ctx.render()`:
- **Security**: centralized safety controls, avoids risks from direct DOM manipulation
- **React support**: full React and JSX support
- **Context inheritance**: automatically inherits app context
- **Lifecycle management**: better component lifecycle handling
- **Conflict handling**: automatically manages React root creation/unmounting to avoid conflicts

## Notes

- `ctx.element` is only used as the internal container for `ctx.render()`
- Do not access or manipulate any properties or methods of `ctx.element` directly
- All rendering must go through `ctx.render()`
