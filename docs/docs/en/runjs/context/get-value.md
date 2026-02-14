# ctx.getValue()

In JSField, JSItem, and other editable field contexts, returns the current value of the field. Use with `ctx.setValue(v)` for two-way binding with the form.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSField** | Read user input or current form value in editable custom fields |
| **JSItem** | Read current cell value in table/sub-table editable items |
| **JSColumn** | Read row field value when rendering a column |

> Note: `ctx.getValue()` is only available in RunJS contexts with form binding; it does not exist in event flow, linkage, etc., where there is no field binding.

## Type

```ts
getValue<T = any>(): T | undefined;
```

- **Returns**: Current field value; type depends on the field’s form item type. May be `undefined` if the field is not registered or not filled.

## Value resolution

`ctx.getValue()` resolves in this order:

1. **Form state**: Prefer current Ant Design Form state.
2. **Fallback**: If the field is not in the form, use the field’s initial value or props.

If the form is not yet rendered or the field is not registered, the result may be `undefined`.

## Examples

### Render based on current value

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Please enter something</span>);
} else {
  ctx.render(<span>Current: {current}</span>);
}
```

### Two-way binding with setValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Related

- [ctx.setValue()](./set-value.md): set current field value; use with getValue for two-way binding
- [ctx.form](./form.md): Ant Design Form instance for other fields
- `js-field:value-change`: container event when value changes from outside; use to update display
