# ctx.form

当前区块中的表单实例。

在表单相关的 JSField、JSItem 中，可以通过 `ctx.form`：

- 读取当前表单的所有字段值
- 更新其他字段的值，实现字段间联动
- 触发表单校验或提交逻辑

## 类型定义

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

## 常用方法

```ts
// 读取当前已注册字段的值（默认只包含已经渲染/注册过的字段）
const values = ctx.form.getFieldsValue();

// 读取所有字段的值（包括未渲染但已注册的字段）
const allValues = ctx.form.getFieldsValue(true);

// 读取单个字段值
const email = ctx.form.getFieldValue('email');

// 批量更新字段值（联动场景）
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// 触发校验 / 提交
await ctx.form.validateFields();
await ctx.form.submit();
```

> 提示：
> - `getFieldsValue()` 只会返回当前已渲染/注册的字段值；`getFieldsValue(true)` 会返回所有字段的值（包括未渲染但已注册的字段）
> - 在 JS 字段中，推荐通过 `ctx.form.getFieldsValue()` / `ctx.form.getFieldValue()` 获取其它字段值做运算或联动
> - 避免直接操作 DOM 表单元素，应始终通过 `ctx.form` 来读写表单状态
