# ctx.form

The Ant Design Form instance within the current block, used to read/write form fields, trigger validation, and submission. It is equivalent to `ctx.blockModel?.form` and can be used directly in form-related blocks (Form, Edit Form, Sub-form, etc.).

## Use Cases

| Scenario | Description |
|------|------|
| **JSField** | Read/write other form fields to implement linkage, or perform calculations and validation based on other field values. |
| **JSItem** | Read/write same-row or other fields within sub-table items to achieve in-table linkage. |
| **JSColumn** | Read the current row or association field values in a table column for rendering. |
| **Form Actions / Workflow** | Pre-submission validation, batch updating fields, resetting forms, etc. |

> Note: `ctx.form` is only available in RunJS contexts related to form blocks (Form, Edit Form, Sub-form, etc.). It may not exist in non-form scenarios (such as independent JSBlocks or Table blocks). It is recommended to perform a null check before use: `ctx.form?.getFieldsValue()`.

## Type Definition

```ts
form: FormInstance<any>;
```

`FormInstance` is the instance type of Ant Design Form. Common methods are as follows.

## Common Methods

### Reading Form Values

```ts
// Read values of currently registered fields (defaults to rendered fields only)
const values = ctx.form.getFieldsValue();

// Read values of all fields (including registered but unrendered fields, e.g., hidden or inside collapsed sections)
const allValues = ctx.form.getFieldsValue(true);

// Read a single field
const email = ctx.form.getFieldValue('email');

// Read nested fields (e.g., in a sub-table)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Writing Form Values

```ts
// Batch update (commonly used for linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Update a single field
ctx.form.setFieldValue('remark', 'Updated remark');
```

### Validation and Submission

```ts
// Trigger form validation
await ctx.form.validateFields();

// Trigger form submission
ctx.form.submit();
```

### Resetting

```ts
// Reset all fields
ctx.form.resetFields();

// Reset only specific fields
ctx.form.resetFields(['status', 'remark']);
```

## Relationship with Related Contexts

### ctx.getValue / ctx.setValue

| Scenario | Recommended Usage |
|------|----------|
| **Read/Write current field** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Read/Write other fields** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Within the current JS field, prioritize using `getValue`/`setValue` to read/write the field itself; use `ctx.form` when you need to access other fields.

### ctx.blockModel

| Requirement | Recommended Usage |
|------|----------|
| **Read/Write form fields** | `ctx.form` (Equivalent to `ctx.blockModel?.form`, more convenient) |
| **Access parent block** | `ctx.blockModel` (Contains `collection`, `resource`, etc.) |

### ctx.getVar('ctx.formValues')

Form values must be obtained via `await ctx.getVar('ctx.formValues')` and are not directly exposed as `ctx.formValues`. In a form context, it is preferred to use `ctx.form.getFieldsValue()` to read the latest values in real-time.

## Notes

- `getFieldsValue()` returns only rendered fields by default. To include unrendered fields (e.g., in collapsed sections or hidden by conditional rules), pass `true`: `getFieldsValue(true)`.
- Paths for nested fields like sub-tables are arrays, e.g., `['orders', 0, 'amount']`. You can use `ctx.namePath` to get the current field's path and construct paths for other columns in the same row.
- `validateFields()` throws an error object containing `errorFields` and other information. If validation fails before submission, you can use `ctx.exit()` to terminate subsequent steps.
- In asynchronous scenarios like workflows or linkage rules, `ctx.form` might not be ready yet. It is recommended to use optional chaining or null checks.

## Examples

### Field Linkage: Display different content based on type

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Calculate current field based on other fields

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Read/Write other columns in the same row within a sub-table

```ts
// ctx.namePath is the path of the current field in the form, e.g., ['orders', 0, 'amount']
// Read 'status' in the same row: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Pre-submission Validation

```ts
try {
  await ctx.form.validateFields();
  // Validation passed, continue with submission logic
} catch (e) {
  ctx.message.error('Please check the form fields');
  ctx.exit();
}
```

### Submit after Confirmation

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm Submission',
  content: 'You will not be able to modify this after submission. Continue?',
  okText: 'Confirm',
  cancelText: 'Cancel',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Terminate if user cancels
}
```

## Related

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Read and write the current field value.
- [ctx.blockModel](./block-model.md): Parent block model; `ctx.form` is equivalent to `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Confirmation dialogs, often used with `ctx.form.validateFields()` and `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Terminate the process upon validation failure or user cancellation.
- `ctx.namePath`: The path (array) of the current field in the form, used to construct names for `getFieldValue` / `setFieldValue` in nested fields.