# What is UI Schema?

A protocol for describing front-end components, based on Formily Schema 2.0, JSON Schema-like style.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // wrapper component
  ['x-decorator']? : string;
  // Wrapper component properties
  ['x-decorator-props']? : any;
  // component
  ['x-component']? : string;
  // Component properties
  ['x-component-props']? : any;
  // display state, default is 'visible'
  ['x-display']? : 'none' | 'hidden' | 'visible';
  // child node of the component, simply use
  ['x-content']? : any;
  // children node schema
  properties?: Record<string, ISchema>;

  // The following is used only for field components

  // field linkage
  ['x-reactions']? : SchemaReactions;
  // Field UI interaction mode, default is 'editable'
  ['x-pattern']? : 'editable' | 'disabled' | 'readPretty';
  // Field validation
  ['x-validator']? : Validator;
  // default data
  default: ? :any;

  // Designer related

  // Designer component (toolbar), including: drag and drop to move, insert new nodes, modify parameters, remove, etc.
  ['x-designer']? : any;
  // Initializer component (toolbar), determines what can be inserted inside the current schema
  ['x-initializer']? : any;
}
```

## The simplest component

All native html tags can be converted to schema writing. For example

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!
}
```

JSX examples

```tsx | pure
<h1>Hello, world!</h1>
```

## children components can be written in properties

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

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## The clever use of Decorator

The combination of decorator + component allows you to put two components in a single schema node, reducing the complexity of the schema structure and increasing the reusability of the components.

For example, in a form scenario, you can combine a FormItem component with any field component, where the FormItem is the Decorator.

```ts
{
  type: 'void',
  ['x-component']: 'div',
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

JSX is equivalent to

```tsx | pure
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

It is also possible to provide a CardItem component that wraps all blocks, so that all blocks are Card wrapped.

```ts
{
  type: 'void',
  ['x-component']: 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
    },
    content: {
      type: 'string',
      'x-decorator': 'CardItem',
      'x-component': 'Kanban',
    },
  },
}
```

JSX is equivalent to

```tsx | pure
<div>
  <CardItem>
    <Table />
  </CardItem>
  <CardItem>
    <Kanban />
  </CardItem>
</div>
```

## Display state of the component

- `'x-display': 'visible'`: the component is displayed
- `'x-display': 'hidden'`: component is hidden, data is not hidden
- `'x-display': 'none'`: component is hidden, data is also hidden

### `'x-display': 'visible'`

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
      'x-display': 'visible'
    },
  },
}
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

### `'x-display': 'hidden'`

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
      'x-display': 'hidden'
    },
  },
}
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  {/* The input component is not output here, the corresponding field model with name=title still exists */}
</div>
```

### `'x-display': 'none'`

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
      'x-display': 'none'
    },
  },
}
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  {/* The input component is not output here, and the corresponding field model with name=title does not exist anymore */}
</div>
```

## Display modes for components

For field components, there are three display modes:

- `'x-pattern': 'editable'` Editable
- `'x-pattern': 'disabled'` Non-editable
- `'x-pattern': 'readPretty'` Friendly reading

As in the case of the `<SingleText />` component, the editable and disabled modes are `<input />` and the readPretty mode is `<div />`.

### `'x-pattern': 'editable'`

```ts
const schema = {
  name: 'test',
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      default: 'Hello',
      'x-component': 'SingleText',
      'x-pattern': 'editable'
    },
  },
};
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} value={'Hello'} />
</div>
```

### `'x-pattern': 'disabled'`

```ts
const schema = {
  name: 'test',
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      default: 'Hello',
      'x-component': 'SingleText',
      'x-pattern': 'disabled'
    },
  },
};
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} value={'Hello'} disabled />
</div>
```

### `'x-pattern': 'readPretty'`

```ts
const schema = {
  name: 'test',
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      default: 'Hello',
      'x-component': 'SingleText',
      'x-pattern': 'readPretty',
    },
  },
};
```

JSX is equivalent to

```tsx | pure
<div className={'form-item'}>
  <div>Hello</div>
</div>
```
