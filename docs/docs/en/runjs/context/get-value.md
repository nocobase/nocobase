# ctx.getValue()

In editable field scenarios such as JSField and JSItem, use this to get the latest value of the current field. Combined with `ctx.setValue(v)`, it enables two-way binding with the form.

## Scenarios

| Scenario | Description |
|------|------|
| **JSField** | Read user input or the current form value in editable custom fields. |
| **JSItem** | Read the current cell value in editable items of tables/sub-tables. |
| **JSColumn** | Read the field value of the corresponding row during table column rendering. |

> **Note**: `ctx.getValue()` is only available in RunJS contexts with form binding; it does not exist in scenarios without field binding, such as workflows or linkage rules.

## Type Definition

```ts
getValue<T = any>(): T | undefined;
```

- **Return Value**: The current field value, whose type is determined by the field's form item type; it may be `undefined` if the field is not registered or not filled.

## Retrieval Order

`ctx.getValue()` retrieves values in the following order:

1. **Form State**: Prioritizes reading from the current state of the Ant Design Form.
2. **Fallback Value**: If the field is not in the form, it falls back to the field's initial value or props.

> If the form has not finished rendering or the field is not registered, it may return `undefined`.

## Examples

### Render based on current value

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Please enter content first</span>);
} else {
  ctx.render(<span>Current value: {current}</span>);
}
```

### Two-way binding with setValue

```tsx
const { Input } = ctx.libs.antd;

// Read current value as default value
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Related

- [ctx.setValue()](./set-value.md) - Set the current field value, used with `getValue` for two-way binding.
- [ctx.form](./form.md) - Ant Design Form instance, for reading/writing other fields.
- `js-field:value-change` - Container event triggered when external values change, used to update the display.