# uiSchema - 步骤配置表单

## 概述

在流程步骤中，通常需要为处理函数（handler）配置参数（params），以实现灵活的业务逻辑。通过 `uiSchema`，可以为这些参数生成可视化的表单，方便用户在界面上进行配置。

## 参数说明

流步骤的处理函数支持参数（params），例如：

```ts
{
  handler(ctx, params) {}
}
```

也支持配置默认参数（defaultParams）：

```ts
{
  defaultParams: {},
  handler(ctx, params) {}
}
```

如果 handler 的 params 需要开放给用户配置，就需要配置相对应的 uiSchema：

```ts
{
  uiSchema: {
    title: {
      type: 'string',
      title: '按钮标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    description: {
      type: 'string',
      title: '描述',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams: {},
  handler(ctx, params) {}
}
```

## uiSchema 配置说明

- `type`: 字段类型，如 `string`、`number`、`boolean` 等。
- `title`: 字段显示名称。
- `x-decorator`: 表单项装饰器，通常为 `FormItem`，用于包裹表单控件并提供标签、校验等功能。
- `x-component`: 表单控件类型，如 `Input`、`Select`、`Checkbox` 等，更多组件参考 [Formily Ant Design 组件库](https://antd5.formilyjs.org/components)。
- `default`: 字段默认值，可选。
- `enum`: 枚举值数组，用于下拉选择等场景，可选。
- `required`: 是否必填，布尔值，可选。
- `description`: 字段说明或帮助文本，可选。

## 示例

### 基础用法

<code src="./index.tsx"></code>

> 示例说明：通过配置 uiSchema，自动生成表单，用户可在界面上填写参数。

### uiSchema 也支持函数回调

<code src="./callback.tsx"></code>

> 示例说明：通过函数返回 uiSchema，可根据上下文动态生成表单结构，实现更灵活的配置。
