# ctx.form

The form instance inside the current block.

In form-related JSField/JSItem, you can use `ctx.form` to:

- Read values of all fields in the current form
- Update other fields to implement linkage
- Trigger validation or submit logic

## Type definition

```ts
form: FormInstance<any>;

interface FormInstance<Values = any> {
  getFieldValue: (name: NamePath<Values>) => StoreValue;
  getFieldsValue: (() => Values) & ((nameList: NamePath<Values>[] | true, filterFunc?: FilterFunc) => any) & ((config: GetFieldsValueConfig) => any);
  getFieldError: (name: NamePath<Values>) => string[];
  getFieldsError: (nameList?: NamePath<Values>[]) => FieldError[];
  getFieldWarning: (name: NamePath<Values>) => string[];
  isFieldsTouched: ((nameList?: NamePath<Values>[], allFieldsTouched?: boolean) => boolean) & ((allFieldsTouched?: boolean) => boolean);
  isFieldTouched: (name: NamePath<Values>) => boolean;
  isFieldValidating: (name: NamePath<Values>) => boolean;
  isFieldsValidating: (nameList?: NamePath<Values>[]) => boolean;
  resetFields: (fields?: NamePath<Values>[]) => void;
  setFields: (fields: FieldData<Values>[]) => void;
  setFieldValue: (name: NamePath<Values>, value: any) => void;
  setFieldsValue: (values: RecursivePartial<Values>) => void;
  validateFields: ValidateFields<Values>;
  submit: () => void;
}
```

## Common methods

```ts
// Read values of registered fields (only rendered/registered fields)
const values = ctx.form.getFieldsValue();

// Read all field values (including registered but not rendered fields)
const allValues = ctx.form.getFieldsValue(true);

// Read a single field value
const email = ctx.form.getFieldValue('email');

// Batch update field values (for linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Trigger validation / submit
await ctx.form.validateFields();
await ctx.form.submit();
```

> Tips:
> - `getFieldsValue()` returns values of rendered/registered fields only; `getFieldsValue(true)` returns all fields
> - In JS fields, use `ctx.form.getFieldsValue()` / `ctx.form.getFieldValue()` to compute or link other field values
> - Do not manipulate DOM form elements directly; always use `ctx.form` to read/write form state
