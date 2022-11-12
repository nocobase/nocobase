# UI Schema 是什么？

一种描述前端组件的协议，基于 Formily Schema 2.0，类 JSON Schema 风格。

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
  // 组件的子节点，简单使用
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
  default: ?:any;

  // 设计器相关

  // 设计器组件（工具栏），包括：拖拽移动、插入新节点、修改参数、移除等
  ['x-designer']?: any;
  // 初始化器组件（工具栏），决定当前 schema 内部可以插入什么
  ['x-initializer']?: any;
}
```

## 最简单的组件

所有的原生 html 标签都可以转为 schema 的写法。如：

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

JSX 示例

```tsx | pure
<h1>Hello, world!</h1>
```

## children 组件可以写在 properties 里

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

JSX 等同于

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## decorator 的巧妙用法

decorator + component 的组合，可以将两个组件放在一个 schema 节点里，降低 schema 结构复杂度，提高组件的复用率。

例如表单场景里，可以将 FormItem 组件与任意字段组件组合，在这里 FormItem 就是 Decorator。

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

JSX 等同于

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

也可以提供一个 CardItem 组件，用于包裹所有区块，这样所有区块就都是 Card 包裹的了。

```ts
{
  type: 'void',
  ['x-component']: 'div',
  properties: {
    table: {
      type: 'array',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
    },
    kanban: {
      type: 'array',
      'x-decorator': 'CardItem',
      'x-component': 'Kanban',
    },
  },
}
```

JSX 等同于

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

## 组件的展示状态

- `'x-display': 'visible'`：显示组件
- `'x-display': 'hidden'`：隐藏组件，数据不隐藏
- `'x-display': 'none'`：隐藏组件，数据也隐藏

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

JSX 等同于

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

JSX 等同于

```tsx | pure
<div className={'form-item'}>
  {/* 此处不输出 input 组件，对应的 name=title 的字段模型还存在 */}
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

JSX 等同于

```tsx | pure
<div className={'form-item'}>
  {/* 此处不输出 input 组件，对应的 name=title 的字段模型也不存在了 */}
</div>
```

## 组件的显示模式

用于字段组件，有三种显示模式：

- `'x-pattern': 'editable'` 可编辑
- `'x-pattern': 'disabled'` 不可编辑
- `'x-pattern': 'readPretty'` 友好阅读

如单行文本 `<SingleText />` 组件，编辑和不可编辑模式为 `<input />`，友好阅读模式为 `<div />`

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

JSX 等同于

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

JSX 等同于

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

JSX 等同于

```tsx | pure
<div className={'form-item'}>
  <div>Hello</div>
</div>
```
