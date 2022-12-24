# Extending Schema Components

In addition to the native html tags, developers can also adapt more custom components to enrich the Schema component library.

Common methods used to extend components are

- [connect](https://react.formilyjs.org/api/shared/connect) to access third-party components without intrusion, generally used to adapt field components, and [mapProps](https://react.formilyjs.org/api/shared/map-props)[, mapReadPretty](https://react.formilyjs.org/api/shared/map-read-pretty) are used with
- [observer](https://react.formilyjs.org/api/shared/observer) when the component uses an observable object internally and you want the component to respond to changes to the observable object

## The simplest extension

Register a ready-made React component directly into it.

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

## Access to third-party components via connect

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

## Using observer response data

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

## Nested Schema

- `props.children` nesting for void and object types properties, see [nesting of void and object-type schema](#void-and-object-type-schema-nesting) for examples
- `<RecursionField />` custom nesting, for all types, see [nesting of array-type schema](#nesting-of-array-type-schema)

Note:

- `properties` of schema other than void and object types cannot be rendered directly by `props.children`, but nesting can be resolved using `<RecursionField />`
- Only schema of type void and object can be used with onlyRenderProperties
```tsx | pure
<RecursionField schema={schema} onlyRenderProperties />
```

### Nesting of void and object type schema

The properties node can be adapted directly via props.children

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

Comparison of rendering results by property type 

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
      'x-content': 'Void schema，渲染 properties',
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
      'x-content': 'Object schema，渲染 properties',
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
      'x-content': 'Array schema，不渲染 properties',
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
      'x-content': 'String schema，不渲染 properties',
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
### Nesting of array type schema

Custom nesting can be solved with `<RecursionField />`

#### Array element is a string or number

```tsx
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
          // Only one element
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

#### When the Array element is an Object

```tsx
import React from 'react';
import { useFieldSchema, Schema, RecursionField, useField, observer, connect } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

const ArrayList = observer((props) => {
  const field = useField();
  const schema = useFieldSchema();
  // The schema of array type cannot be onlyRenderProperties and needs to be converted to object type
  const objSchema = new Schema({
    type: 'object',
    properties: schema.properties,
  });
  return (
    <ul>
      {field.value?.map((item, index) => {
        // When the Array element is an Object
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

#### Tree structure data

```tsx
import { ArrayField } from '@formily/core';
import { connect, ISchema, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Table, TableColumnType } from 'antd';
import React from 'react';

const ArrayTable = observer((props: any) => {
  const { rowKey } = props;
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const columnSchemas = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'ArrayTable.Column') {
      buf.push(s);
    }
    return buf;
  }, []);

  const columns = columnSchemas.map((s) => {
    return {
      render: (value, record) => {
        return <RecursionField name={record.__path} schema={s} onlyRenderProperties />;
      },
    } as TableColumnType<any>;
  });

  return <Table rowKey={rowKey} columns={columns} dataSource={field.value} />;
});

const Value = connect((props) => {
  return <li>value: {props.value}</li>;
});

const schema: ISchema = {
  type: 'object',
  properties: {
    objArr: {
      type: 'array',
      default: [
        { __path: '0', id: 1, value: 't1' },
        {
          __path: '1',
          id: 2,
          value: 't2',
          children: [
            {
              __path: '1.children.0',
              id: 5,
              value: 't5',
              parentId: 2,
            },
          ],
        },
        {
          __path: '2',
          id: 3,
          value: 't3',
          children: [
            {
              __path: '2.children.0',
              id: 4,
              value: 't4',
              parentId: 3,
              children: [
                {
                  __path: '2.children.0.children.0',
                  id: 6,
                  value: 't6',
                  parentId: 4,
                },
                {
                  __path: '2.children.0.children.1',
                  id: 7,
                  value: 't7',
                  parentId: 4,
                },
              ],
            },
          ],
        },
      ],
      'x-component': 'ArrayTable',
      'x-component-props': {
        rowKey: 'id',
      },
      properties: {
        c1: {
          type: 'void',
          'x-component': 'ArrayTable.Column',
          properties: {
            value: {
              type: 'string',
              'x-component': 'Value',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ ArrayTable, Value }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
```
