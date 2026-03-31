# ctx.setValue()

In JSField, JSItem, and other editable field contexts, sets the current field’s value. Use with `ctx.getValue()` for two-way binding with the form.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSField** | Write user selection or computed value in editable custom fields |
| **JSItem** | Update current cell value in table/sub-table editable items |
| **JSColumn** | Update row field value when rendering a column |

> Note: `ctx.setValue(v)` is only available in RunJS contexts with form binding; in event flow, linkage, JSBlock, etc. (no field binding) the method may not exist—use optional chaining: `ctx.setValue?.(value)`.

## Type

```ts
setValue<T = any>(value: T): void;
```

- **Parameter**: `value` is the value to write; type depends on the field’s form item type.

## Behavior

- `ctx.setValue(v)` updates the current field’s value in the Ant Design Form and triggers linkage and validation.
- If the form is not yet rendered or the field is not registered, the call may have no effect; use `ctx.getValue()` to confirm.

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

### Set default by condition

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Write current field when linking others

```ts
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Custom', value: 'custom' });
}
```

## Notes

- In non-editable contexts (e.g. JSField detail mode, JSBlock), `ctx.setValue` may be `undefined`; use `ctx.setValue?.(value)`.
- For association fields (m2o, o2m, etc.), pass a value that matches the field type (e.g. `{ id, [titleField]: label }`); see field config.

## Related

- [ctx.getValue()](./get-value.md): get current field value; use with setValue for two-way binding
- [ctx.form](./form.md): Ant Design Form; read/write other fields
- `js-field:value-change`: container event when value changes from outside; use to update display
