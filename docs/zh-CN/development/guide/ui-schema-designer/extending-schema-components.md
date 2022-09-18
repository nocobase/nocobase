# 扩展 Schema 组件

除了原生的 html 标签，开发也可以适配更多的自定义组件，用于丰富 Schema 组件库。

扩展组件时，常用的方法：

- [connect](https://react.formilyjs.org/api/shared/connect) 无侵入接入第三方组件，一般用于适配字段组件，和 [mapProps](https://react.formilyjs.org/api/shared/map-props)[、mapReadPretty](https://react.formilyjs.org/api/shared/map-read-pretty) 搭配使用
- [observer](https://react.formilyjs.org/api/shared/observer) 当组件内部使用了 observable 对象，而你希望组件响应 observable 对象的变化时

## 最简单的扩展

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

## 通过 connect 接入第三方组件

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { Input } from 'antd'
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const ReadPretty = (props) => {
  return <div>{props.value}</div>
};

const SingleText = connect(
  Input, 
  mapProps((props, field) => {
    return {
      ...props,
      suffix: '后缀',
    }
  }), 
  mapReadPretty(ReadPretty),
);

const schema = {
  type: 'object',
  properties: {
    t1: {
      type: 'string',
      default: 'hello t1',
      'x-component': 'SingleText',
    },
    t2: {
      type: 'string',
      default: 'hello t2',
      'x-component': 'SingleText',
      'x-pattern': 'readPretty',
    },
  }
};

export default () => {
  return (
    <SchemaComponentProvider components={{ SingleText }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

## 使用 observer 响应数据

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { Input } from 'antd';
import { connect, observer, useForm } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const SingleText = connect(Input);

const UsedObserver = observer((props) => {
  const form = useForm();
  return <div>UsedObserver: {form.values.t1}</div>
});

const NotUsedObserver = (props) => {
  const form = useForm();
  return <div>NotUsedObserver: {form.values.t1}</div>
};

const schema = {
  type: 'object',
  properties: {
    t1: {
      type: 'string',
      'x-component': 'SingleText',
    },
    t2: {
      type: 'string',
      'x-component': 'UsedObserver',
    },
    t3: {
      type: 'string',
      'x-component': 'NotUsedObserver',
    },
  }
};

const components = {
  SingleText,
  UsedObserver,
  NotUsedObserver
};

export default () => {
  return (
    <SchemaComponentProvider components={components}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

## 嵌套的 Schema

- `props.children` 嵌套，适用于 void 和 object 类型，例子见 [void 和 object 类型 schema 的嵌套](#void-和-object-类型-schema-的嵌套)
- `<RecursionField />` 嵌套，适用于各种场景，例子见 [array 类型 schema 的嵌套](#array-类型-schema-的嵌套)

注意：仅 void 和 object 类型的 schema 可以与 onlyRenderProperties 使用

```tsx | pure
<RecursionField schema={schema} onlyRenderProperties />
```

### void 和 object 类型 schema 的嵌套

直接通过 props.children 就可以适配 properties 节点了

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

### array 类型 schema 的嵌套

可以通过 `<RecursionField />` 解决自定义嵌套问题

#### Array 元素是 string 或 number 时

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

const ArrayList = observer((props) => {
  const field = useField();
  const schema = useValueSchema();
  return (
    <>
      String Array
      <ul>
        {field.value?.map((item, index) => {
          // 只有一个元素
          return <RecursionField name={index} schema={schema} />
        })}
      </ul>
    </>
  );
});

const Value = connect((props) => {
  return <li>value: {props.value}</li>
});

const schema = {
  type: 'object',
  properties: {
    strArr: {
      type: 'array',
      default: [1, 2, 3],
      'x-component': 'ArrayList',
      properties: {
        value: {
          type: 'number',
          'x-component': 'Value',
        },
      }
    },
  }
};

export default () => {
  return (
    <SchemaComponentProvider components={{ ArrayList, Value }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```

#### Array 元素是 Object 时

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { useFieldSchema, Schema, RecursionField, useField, observer, connect } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const ArrayList = observer((props) => {
  const field = useField();
  const schema = useFieldSchema();
  // array 类型的 schema 无法 onlyRenderProperties，需要转化为 object 类型
  const objSchema = new Schema({
    type: 'object',
    properties: schema.properties,
  });
  return (
    <ul>
      {field.value?.map((item, index) => {
        // array 元素是 object
        return (
          <RecursionField name={index} schema={objSchema} onlyRenderProperties />
        )
      })}
    </ul>
  );
});

const Value = connect((props) => {
  return <li>value: {props.value}</li>
});

const schema = {
  type: 'object',
  properties: {
    objArr: {
      type: 'array',
      default: [
        { value: 't1' },
        { value: 't2' },
        { value: 't3' },
      ],
      'x-component': 'ArrayList',
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
    <SchemaComponentProvider components={{ ArrayList, Value }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```
