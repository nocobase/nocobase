---
title: "UI Schema"
description: "NocoBase UI Schema 语法参考：基于 Formily Schema 的组件描述协议，type、x-component、x-decorator、x-pattern 等属性说明。"
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema 是 NocoBase 用来描述前端组件的协议，基于 [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema)，类 JSON Schema 风格。在 FlowEngine 中，`registerFlow` 的 `uiSchema` 字段就是用这个语法来定义配置面板的 UI。

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // 包装器组件
  ['x-decorator']?: string;
  // 包装器组件属性
  ['x-decorator-props']?: any;
  // 组件
  ['x-component']?: string;
  // 组件属性
  ['x-component-props']?: any;
  // 展示状态，默认为 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // 组件的子节点
  ['x-content']?: any;
  // children 节点 schema
  properties?: Record<string, ISchema>;

  // 以下仅字段组件时使用

  // 字段联动
  ['x-reactions']?: SchemaReactions;
  // 字段 UI 交互模式，默认为 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // 字段校验
  ['x-validator']?: Validator;
  // 默认数据
  default?: any;
}
```

## 基本用法

### 最简单的组件

所有的原生 HTML 标签都可以转为 schema 写法：

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

等同于 JSX：

```tsx
<h1>Hello, world!</h1>
```

### 子组件

children 组件写在 `properties` 里：

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

等同于 JSX：

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## 属性说明

### type

节点的类型：

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

schema 名称。子节点的 name 就是 `properties` 的 key：

```ts
{
  name: 'root',
  properties: {
    child1: {
      // 这里不需要再写 name
    },
  },
}
```

### title

节点标题，通常用于表单字段的标签。

### x-component

组件名称。可以是原生 HTML 标签，也可以是注册的 React 组件：

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

组件属性：

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

包装器组件。`x-decorator` + `x-component` 的组合，可以将两个组件放在一个 schema 节点里——降低结构复杂度，提高复用率。

比如表单场景里，`FormItem` 就是 decorator：

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

等同于 JSX：

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

组件的展示状态：

| 值 | 说明 |
|----|------|
| `'visible'` | 显示组件（默认） |
| `'hidden'` | 隐藏组件，但数据不隐藏 |
| `'none'` | 隐藏组件，数据也隐藏 |

### x-pattern

字段组件的交互模式：

| 值 | 说明 |
|----|------|
| `'editable'` | 可编辑（默认） |
| `'disabled'` | 不可编辑 |
| `'readPretty'` | 友好阅读模式——比如单行文本组件在编辑模式下是 `<input />`，友好阅读模式下是 `<div />` |

## 在 registerFlow 中使用

在插件开发中，uiSchema 主要用在 `registerFlow` 的配置面板里。每个字段通常用 `'x-decorator': 'FormItem'` 包裹：

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: '编辑标题',
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: '显示边框',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: '颜色',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '红色', value: 'red' },
            { label: '蓝色', value: 'blue' },
            { label: '绿色', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip 提示

v2 对 uiSchema 语法是兼容的，不过使用场景有限——主要用在 Flow 的配置面板中描述表单 UI。大部分运行时的组件渲染推荐直接用 [Antd 组件](https://5x.ant.design/components/overview) 实现。

:::

## 常用组件速查

| 组件 | x-component | type | 说明 |
|------|-------------|------|------|
| 单行文本 | `Input` | `string` | 基础文本输入 |
| 多行文本 | `Input.TextArea` | `string` | 多行文本域 |
| 数字 | `InputNumber` | `number` | 数字输入 |
| 开关 | `Switch` | `boolean` | 布尔开关 |
| 下拉选择 | `Select` | `string` | 需配合 `enum` 提供选项 |
| 单选 | `Radio.Group` | `string` | 需配合 `enum` 提供选项 |
| 多选 | `Checkbox.Group` | `string` | 需配合 `enum` 提供选项 |
| 日期 | `DatePicker` | `string` | 日期选择器 |

## 相关链接

- [FlowEngine 概述（插件开发）](../plugin-development/client/flow-engine/index.md) — registerFlow 中 uiSchema 的实际用法
- [FlowDefinition 流定义](./definitions/flow-definition.md) — registerFlow 的完整参数说明
- [Formily Schema 文档](https://react.formilyjs.org/api/shared/schema) — uiSchema 底层基于的 Formily 协议
