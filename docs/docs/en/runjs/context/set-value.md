# ctx.setValue()

Sets the value of the current field in editable field scenarios such as JSField and JSItem. Combined with `ctx.getValue()`, it enables two-way binding with the form.

## Use Cases

| Scenario | Description |
|------|------|
| **JSField** | Write user-selected or calculated values into editable custom fields. |
| **JSItem** | Update the current cell value in editable items of tables/sub-tables. |
| **JSColumn** | Update the field value of the corresponding row based on logic during table column rendering. |

> **Note**: `ctx.setValue(v)` is only available in RunJS contexts with form binding. It is not available in scenarios without field binding, such as FlowEngine, linkage rules, or JSBlock. It is recommended to use optional chaining before use: `ctx.setValue?.(value)`.

## Type Definition

```ts
setValue<T = any>(value: T): void;
```

- **Parameters**: `value` is the field value to be written. The type is determined by the form item type of the field.

## Behavior

- `ctx.setValue(v)` updates the value of the current field in the Ant Design Form and triggers related form linkage and validation logic.
- If the form has not finished rendering or the field is not registered, the call may be ineffective. It is recommended to use `ctx.getValue()` to confirm the write result.

## Examples

### Two-way binding with getValue

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

### Setting default values based on conditions

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Writing back to the current field when linked to other fields

```ts
// Synchronously update the current field when another field changes
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Custom', value: 'custom' });
}
```

## Notes

- In non-editable fields (e.g., JSField in Read-only Mode, JSBlock), `ctx.setValue` may be `undefined`. It is recommended to use `ctx.setValue?.(value)` to avoid errors.
- When setting values for association fields (M2O, O2M, etc.), you need to pass a structure that matches the field type (e.g., `{ id, [titleField]: label }`), depending on the specific field configuration.

## Related

- [ctx.getValue()](./get-value.md) - Get the current field value, used with setValue for two-way binding.
- [ctx.form](./form.md) - Ant Design Form instance, used to read or write other fields.
- `js-field:value-change` - A container event triggered when an external value changes, used to update the display.