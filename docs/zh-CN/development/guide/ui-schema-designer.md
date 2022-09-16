# UI Schema Designer

## UI Schema 是什么？

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
  // 组件的子节点，简单使用
  ['x-content']?: any;
  // 展示状态，默认为 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // children 节点 schema
  properties?: Record<string, ISchema>;

  // 以下仅字段组件时使用

  // 字段联动
  ['x-reactions']?: SchemaReactions;
  // 字段 UI 交互模式，默认为 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readOnly' | 'readPretty';
  // 字段校验
  ['x-validator']?: FieldValidator;
  // 默认数据
  default: ?:any;
}
```

### 最简单的组件

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

### children 组件可以写在 properties 里

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

### decorator 巧妙的用法

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

另外，decorator + component 的组合，可以将两个组件放在一个 schema 节点里，降低 schema 结构复杂度，提高组件的复用率。

### 组件的展示状态

- `'x-display': 'visible'`：显示组件
- `'x-display': 'hidden'`：隐藏组件，数据不隐藏
- `'x-display': 'none'`：隐藏组件，数据也隐藏

#### `'x-display': 'visible'`

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

#### `'x-display': 'hidden'`

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

#### `'x-display': 'none'`

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

### 组件的显示模式

用于字段组件，有三种显示模式：

- `'x-pattern': 'editable'` 可编辑
- `'x-pattern': 'disabled'` 不可编辑
- `'x-pattern': 'readPretty'` 友好阅读

如单行文本 `<SingleText />` 组件，编辑和不可编辑模式为 `<input />`，友好阅读模式为 `<div />`

#### `'x-pattern': 'editable'`

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

JSX 等价于

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} value={'Hello'} />
</div>
```

#### `'x-pattern': 'disabled'`

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

JSX 等价于

```tsx | pure
<div className={'form-item'}>
  <input name={'title'} value={'Hello'} disabled />
</div>
```

#### `'x-pattern': 'readPretty'`

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

JSX 等价于

```tsx | pure
<div className={'form-item'}>
  <div>Hello</div>
</div>
```

## 如何扩展 Schema 组件？

除了原生的 html 标签，开发也可以适配更多的自定义组件，用于丰富 Schema 组件库。

### 最简单的扩展

直接将现成的 React 组件注册进来。

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const Hello = () => <h1>Hello, world!</h1>;

const schema = {
  type: 'void',
  name: 'hello',
  'x-component': 'Hello',
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Hello }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

### 嵌套的 Schema

- `props.children` 嵌套，适用于 void 和 object
- `<RecursionField />` 嵌套，适用于各种场景

void 和 object 类型的 schema，直接通过 props.children 就可以适配 properties 节点了

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

// Hello 组件适配了 children，可以嵌套 properties 了
const Hello = (props) => <h1>Hello, {props.children}!</h1>;
const World = () => <span>world</span>;

const schema = {
  type: 'object',
  name: 'hello',
  'x-component': 'Hello',
  properties: {
    world: {
      type: 'string',
      'x-component': 'World',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Hello, World }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

各类型对比，array 和 string 并不会渲染 World 节点

```tsx
import React from 'react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const Hello = (props) => <h1>Hello, {props.children}!</h1>;
const World = () => <span>world</span>;

const schema = {
  type: 'object',
  properties: {
    title1: {
      type: 'void',
      'x-content': 'Void schema',
    },
    void: {
      type: 'void',
      name: 'hello',
      'x-component': 'Hello',
      properties: {
        world: {
          type: 'void',
          'x-component': 'World',
        },
      },
    },
    title2: {
      type: 'void',
      'x-content': 'Object schema',
    },
    object: {
      type: 'object',
      name: 'hello',
      'x-component': 'Hello',
      properties: {
        world: {
          type: 'string',
          'x-component': 'World',
        },
      },
    },
    title3: {
      type: 'void',
      'x-content': 'Array schema',
    },
    array: {
      type: 'array',
      name: 'hello',
      'x-component': 'Hello',
      properties: {
        world: {
          type: 'string',
          'x-component': 'World',
        },
      },
    },
    title4: {
      type: 'void',
      'x-content': 'String schema',
    },
    string: {
      type: 'string',
      name: 'hello',
      'x-component': 'Hello',
      properties: {
        world: {
          type: 'string',
          'x-component': 'World',
        },
      },
    },
  }
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Hello, World }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

array 类型的 schema 可以通过 `<RecursionField />` 解决自定义嵌套问题

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { useFieldSchema, Schema, RecursionField, useField, observer, connect } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const useValueSchema = () => {
  const schema = useFieldSchema();
  return schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Value') {
      return s;
    }
    return buf;
  });
};

const StrArr = observer((props) => {
  const field = useField();
  const schema = useValueSchema();
  return (
    <>
      String Array
      <ul>
        {field.value?.map((item, index) => {
          return <RecursionField name={index} schema={schema} />
        })}
      </ul>
    </>
  );
});

const ObjArr = observer((props) => {
  const field = useField();
  const schema = useFieldSchema();
  // array 类型的 schema 无法 onlyRenderProperties，需要转化为 object 类型
  const objSchema = new Schema({
    type: 'object',
    properties: schema.properties,
  });
  return (
    <>
      Object Array
      <ul>
        {field.value?.map((item, index) => {
          return (
            <RecursionField name={index} schema={objSchema} onlyRenderProperties />
          )
        })}
      </ul>
    </>
  );
});

const Value = connect((props) => {
  const schema = useFieldSchema();
  return <li>value: {props.value}</li>
});

const schema = {
  type: 'object',
  properties: {
    strArr: {
      type: 'array',
      default: [1, 2, 3],
      'x-component': 'StrArr',
      properties: {
        value: {
          type: 'number',
          'x-component': 'Value',
        },
      }
    },
    objArr: {
      type: 'array',
      default: [
        { value: 't1' },
        { value: 't2' },
        { value: 't3' },
      ],
      'x-component': 'ObjArr',
      properties: {
        value: {
          type: 'number',
          'x-component': 'Value',
        },
      }
    }
  }
};

export default () => {
  return (
    <SchemaComponentProvider components={{ StrArr, ObjArr, Value }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

注意：仅限 void 和 object 类型的 schema 可以与 onlyRenderProperties 使用

```tsx | pure
<RecursionField schema={schema} onlyRenderProperties />
```
