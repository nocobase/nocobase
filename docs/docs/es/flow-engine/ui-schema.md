---
title: "UI Schema"
description: "Referencia de sintaxis de UI Schema en NocoBase: protocolo de descripción de componentes basado en Formily Schema, con explicación de las propiedades type, x-component, x-decorator, x-pattern, etc."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema es el protocolo que NocoBase utiliza para describir componentes de front-end. Está basado en [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema) y sigue un estilo similar a JSON Schema. En FlowEngine, el campo `uiSchema` de `registerFlow` utiliza esta sintaxis para definir la UI del panel de configuración.

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

## Uso básico

### El componente más simple

Todas las etiquetas HTML nativas se pueden expresar como schema:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Equivalente en JSX:

```tsx
<h1>Hello, world!</h1>
```

### Componentes hijos

Los componentes hijos se escriben dentro de `properties`:

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

Equivalente en JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Descripción de las propiedades

### type

Tipo del nodo:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Nombre del schema. El nombre de un nodo hijo es la clave dentro de `properties`:

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

Título del nodo; se utiliza habitualmente como etiqueta de los campos de un formulario.

### x-component

Nombre del componente. Puede ser una etiqueta HTML nativa o un componente React registrado:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Propiedades del componente:

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

Componente envoltorio. La combinación `x-decorator` + `x-component` permite tener dos componentes en un mismo nodo del schema, lo que reduce la complejidad estructural y aumenta la reutilización.

Por ejemplo, en un formulario, `FormItem` actúa como decorator:

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

Equivalente en JSX:

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

Estado de visualización del componente:

| Valor | Descripción |
|----|------|
| `'visible'` | Mostrar el componente (valor por defecto) |
| `'hidden'` | Ocultar el componente, pero los datos no se ocultan |
| `'none'` | Ocultar el componente y también los datos |

### x-pattern

Modo de interacción del componente de campo:

| Valor | Descripción |
|----|------|
| `'editable'` | Editable (valor por defecto) |
| `'disabled'` | No editable |
| `'readPretty'` | Modo de lectura amigable: por ejemplo, un componente de texto de una línea es `<input />` en modo de edición y `<div />` en modo de lectura amigable |

## Uso en registerFlow

Durante el desarrollo de plugins, uiSchema se utiliza principalmente en el panel de configuración de `registerFlow`. Cada campo suele envolverse con `'x-decorator': 'FormItem'`:

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

:::tip Sugerencia

La v2 mantiene la compatibilidad con la sintaxis de uiSchema, aunque sus casos de uso son limitados: se utiliza principalmente para describir la UI del formulario en el panel de configuración de Flow. Para la mayoría del renderizado de componentes en tiempo de ejecución, se recomienda emplear directamente los [componentes de Antd](https://5x.ant.design/components/overview).

:::

## Referencia rápida de componentes habituales

| Componente | x-component | type | Descripción |
|------|-------------|------|------|
| Texto de una línea | `Input` | `string` | Entrada de texto básica |
| Texto multilínea | `Input.TextArea` | `string` | Área de texto multilínea |
| Número | `InputNumber` | `number` | Entrada numérica |
| Interruptor | `Switch` | `boolean` | Conmutador booleano |
| Selector desplegable | `Select` | `string` | Requiere `enum` para proveer las opciones |
| Selección única | `Radio.Group` | `string` | Requiere `enum` para proveer las opciones |
| Selección múltiple | `Checkbox.Group` | `string` | Requiere `enum` para proveer las opciones |
| Fecha | `DatePicker` | `string` | Selector de fecha |

## Enlaces relacionados

- [Resumen de FlowEngine (desarrollo de plugins)](../plugin-development/client/flow-engine/index.md) — uso real de uiSchema en registerFlow
- [Definición de Flow (FlowDefinition)](./definitions/flow-definition.md) — descripción completa de los parámetros de registerFlow
- [Documentación de Formily Schema](https://react.formilyjs.org/api/shared/schema) — el protocolo de Formily en el que se basa uiSchema
