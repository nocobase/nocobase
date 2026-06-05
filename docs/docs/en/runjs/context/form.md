# ctx.form

The Ant Design Form instance for the current block; used to read/write form fields, trigger validation, and submit. Same as `ctx.blockModel?.form`; in form blocks (Form, EditForm, sub-forms, etc.) you can use it directly.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSField** | Read/write other fields for linkage, compute or validate from other field values |
| **JSItem** | Read/write same row or other fields in sub-table items |
| **JSColumn** | Read row or related field values for column rendering |
| **Form actions / event flow** | Pre-submit validation, batch field updates, reset form, etc. |

> Note: `ctx.form` is only available in RunJS contexts tied to a form block (Form, EditForm, sub-forms, etc.); in non-form contexts (e.g. standalone JSBlock, table block) it may be absent—check before use: `ctx.form?.getFieldsValue()`.

## Type

```ts
form: FormInstance<any>;
```

`FormInstance` is the Ant Design Form instance type.

## Common Methods

### Read form values

```ts
// Current registered field values (default: only rendered fields)
const values = ctx.form.getFieldsValue();

// All field values (including unrendered, e.g. hidden, collapsed)
const allValues = ctx.form.getFieldsValue(true);

// Single field
const email = ctx.form.getFieldValue('email');

// Nested (e.g. sub-table)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Write form values

```ts
// Batch update (e.g. linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Single field
ctx.form.setFieldValue('remark', 'Noted');
```

### Validation and submit

```ts
// Trigger validation
await ctx.form.validateFields();

// Trigger submit
ctx.form.submit();
```

### Reset

```ts
// All fields
ctx.form.resetFields();

// Specific fields
ctx.form.resetFields(['status', 'remark']);
```

## Relation to Other Context

### ctx.getValue / ctx.setValue

| Scenario | Recommended |
|----------|-------------|
| **Current field** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Other fields** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

In the current JS field, use `getValue`/`setValue` for that field; use `ctx.form` for other fields.

### ctx.blockModel

| Need | Recommended |
|------|-------------|
| **Read/write form fields** | `ctx.form` (same as `ctx.blockModel?.form`) |
| **Parent block** | `ctx.blockModel` (includes `collection`, `resource`, etc.) |

### ctx.getVar('ctx.formValues')

Form values are obtained via `await ctx.getVar('ctx.formValues')`, not as `ctx.formValues`. In form contexts, prefer `ctx.form.getFieldsValue()` for up-to-date values.

## Notes

- `getFieldsValue()` by default returns only rendered fields; for unrendered (e.g. collapsed) use `getFieldsValue(true)`.
- Nested paths use arrays, e.g. `['orders', 0, 'amount']`; you can use `ctx.namePath` to build paths for other columns in the same row.
- `validateFields()` throws with `errorFields` etc. on failure; use `ctx.exit()` to stop further steps when validation fails.
- In event flow or linkage, `ctx.form` may not be ready yet; use optional chaining or null checks.

## Examples

### Field linkage by type

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Compute current field from others

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Same row in sub-table

```ts
// ctx.namePath is current field path, e.g. ['orders', 0, 'amount']
// Same row status: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Pre-submit validation

```ts
try {
  await ctx.form.validateFields();
  // Continue submit logic
} catch (e) {
  ctx.message.error('Please fix form errors');
  ctx.exit();
}
```

### Confirm then submit

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm submit',
  content: 'Cannot be changed after submit. Continue?',
  okText: 'OK',
  cancelText: 'Cancel',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit();
}
```

## Related

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): read/write current field
- [ctx.blockModel](./block-model.md): parent block; `ctx.form` is `ctx.blockModel?.form`
- [ctx.modal](./modal.md): confirm dialog, often with `ctx.form.validateFields()` / `ctx.form.submit()`
- [ctx.exit()](./exit.md): stop flow on validation failure or cancel
- `ctx.namePath`: current field path in the form (array); use for nested `getFieldValue` / `setFieldValue` names
