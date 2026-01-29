# ctx.form

The form instance within the current block.

In form-related JSField and JSItem, you can use `ctx.form` to:

- Read values of all fields in the current form
- Update other field values to implement field linkage
- Trigger form validation or submission logic

## Type Definition

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

## Common Methods

```ts
// Read values of currently registered fields (only rendered/registered fields by default)
const values = ctx.form.getFieldsValue();

// Read values of all fields (including registered but not rendered fields)
const allValues = ctx.form.getFieldsValue(true);

// Read a single field value
const email = ctx.form.getFieldValue('email');

// Bulk update field values (for linkage scenarios)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Trigger validation / submission
await ctx.form.validateFields();
await ctx.form.submit();
```

> Tip:
> - `getFieldsValue()` returns values only for fields that are currently rendered/registered; `getFieldsValue(true)` returns all fields (including registered but not rendered)
> - In JS fields, prefer `ctx.form.getFieldsValue()` / `ctx.form.getFieldValue()` to read other field values for calculations or linkage
> - Avoid manipulating DOM form elements directly; always read/write form state via `ctx.form`
