---
title: "TypedVariableInput"
description: "TypedVariableInput：让字段同时支持类型化常量和变量引用。"
keywords: "TypedVariableInput,变量,常量,$env,client-v2,NocoBase"
---

# TypedVariableInput

`TypedVariableInput` 用于字段同时接受常量和变量的场景。比如 SMTP 端口可以直接写 `465`，也可以写 `{{ $env.SMTP_PORT }}`。

如果字段只接受字面值，直接用 Antd `InputNumber`、`Select` 或 `DatePicker`。如果字段只接受变量，默认用 `EnvVariableInput` 或 `VariableInput`。

## 基本用法

```tsx file="../_demos/typed-variable-input.tsx" preview
```

```tsx
import { TypedVariableInput } from '@nocobase/client-v2';

<Form.Item name={['options', 'port']} label={t('Port')} initialValue={465}>
  <TypedVariableInput
    types={[['number', { min: 1, max: 65535, step: 1 }]]}
    namespaces={['$env']}
  />
</Form.Item>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | - | 当前值 |
| `onChange` | `(next: unknown) => void` | - | 值变化回调 |
| `types` | `TypedConstantSpec[]` | `['string', 'number', 'boolean', 'date']` | 允许的常量类型 |
| `namespaces` | `string[]` | - | 限定可选变量命名空间 |
| `extraNodes` | `MetaTreeNode[]` | - | 追加局部变量节点 |
| `nullable` | `boolean` | `true` | 是否允许选择空值 |
| `delimiters` | `[string, string]` | `['{{', '}}']` | 变量分隔符 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `placeholder` | `string` | - | 占位文字 |
| `style` | `React.CSSProperties` | - | 自定义样式 |
| `className` | `string` | - | 自定义 class |

`types` 可以传裸类型，也可以传 `[type, editorProps]` 元组：

```tsx
<TypedVariableInput
  types={[
    ['number', { min: 1, max: 65535 }],
    'boolean',
  ]}
/>;
```

## 值的形态

| 模式 | 保存值 |
| --- | --- |
| 字符串常量 | `string` |
| 数字常量 | `number` |
| 布尔常量 | `boolean` |
| 日期常量 | `Date` |
| 变量 | 形如 `{{ $env.SMTP_PORT }}` 的字符串 |
| 空值 | `null` |

:::tip 提示

即使 `types` 只允许一种类型，组件也会保留「常量」二级菜单。这是为了让用户能明确看到当前选择的是常量类型，而不是普通输入框。

:::
