---
title: "UI Schema"
description: "NocoBase UI Schema syntax reference: a Formily Schema-based component description protocol, covering type, x-component, x-decorator, x-pattern, and other property descriptions."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema is the protocol NocoBase uses to describe frontend components, based on [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema) in a JSON Schema-like style. In FlowEngine, the `uiSchema` field in `registerFlow` uses this syntax to define the UI for configuration panels.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Wrapper component
  ['x-decorator']?: string;
  // Wrapper component props
  ['x-decorator-props']?: any;
  // Component
  ['x-component']?: string;
  // Component props
  ['x-component-props']?: any;
  // Display state, defaults to 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Component's child content
  ['x-content']?: any;
  // Children node schema
  properties?: Record<string, ISchema>;

  // The following are only used for field components

  // Field reactions
  ['x-reactions']?: SchemaReactions;
  // Field UI interaction mode, defaults to 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Field validation
  ['x-validator']?: Validator;
  // Default data
  default?: any;
}
```

## Basic Usage

### Simplest Component

All native HTML tags can be converted to schema notation:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Equivalent JSX:

```tsx
<h1>Hello, world!</h1>
```

### Child Components

Children components are written in `properties`:

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

Equivalent JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Property Reference

### type

The type of the node:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

The schema name. The name of a child node is the key in `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // No need to write name here
    },
  },
}
```

### title

The node title, typically used as the label for form fields.

### x-component

The component name. Can be a native HTML tag or a registered React component:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Component props:

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

Wrapper component. The `x-decorator` + `x-component` combination allows placing two components in a single schema node — reducing structural complexity and improving reusability.

For example, in form scenarios, `FormItem` serves as the decorator:

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

Equivalent JSX:

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

The display state of the component:

| Value | Description |
|----|------|
| `'visible'` | Show the component (default) |
| `'hidden'` | Hide the component, but data remains visible |
| `'none'` | Hide both the component and its data |

### x-pattern

The interaction mode of field components:

| Value | Description |
|----|------|
| `'editable'` | Editable (default) |
| `'disabled'` | Not editable |
| `'readPretty'` | Read-pretty mode — for example, a text input component renders as `<input />` in edit mode and `<div />` in read-pretty mode |

## Usage in registerFlow

In plugin development, uiSchema is primarily used in `registerFlow` configuration panels. Each field is typically wrapped with `'x-decorator': 'FormItem'`:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Edit Title',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Show Border',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Color',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Red', value: 'red' },
            { label: 'Blue', value: 'blue' },
            { label: 'Green', value: 'green' },
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

:::tip Tip

v2 is compatible with the uiSchema syntax, but its use cases are limited — it is mainly used in Flow configuration panels to describe form UI. For most runtime component rendering, it is recommended to use [Antd components](https://5x.ant.design/components/overview) directly.

:::

## Common Components Quick Reference

| Component | x-component | type | Description |
|------|-------------|------|------|
| Single-line text | `Input` | `string` | Basic text input |
| Multi-line text | `Input.TextArea` | `string` | Multi-line text area |
| Number | `InputNumber` | `number` | Number input |
| Switch | `Switch` | `boolean` | Boolean toggle |
| Dropdown select | `Select` | `string` | Requires `enum` for options |
| Radio | `Radio.Group` | `string` | Requires `enum` for options |
| Checkbox | `Checkbox.Group` | `string` | Requires `enum` for options |
| Date | `DatePicker` | `string` | Date picker |

## Related Links

- [FlowEngine Overview (Plugin Development)](../plugin-development/client/flow-engine/index.md) — Practical usage of uiSchema in registerFlow
- [FlowDefinition](./definitions/flow-definition.md) — Complete parameter reference for registerFlow
- [Formily Schema Documentation](https://react.formilyjs.org/api/shared/schema) — The underlying Formily protocol that uiSchema is based on
