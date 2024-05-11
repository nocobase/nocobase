# Designable

## Designable

Perform add, delete, and update operations on Schema nodes, and provide an event triggering mechanism to synchronize data to the server.

```tsx | pure
interface Options {
  current: Schema;
  api?: APIClient;
  onSuccess?: any;
  refresh?: () => void;
  t?: any;
}

interface InsertAdjacentOptions {
  wrap?: (s: ISchema) => ISchema;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | BreakFn;
  onSuccess?: any;
}

class Designable {
      constructor(options: Options ) { }
      loadAPIClientEvents(): void;
      on(name: 'insertAdjacent' | 'remove' | 'error' | 'patch' | 'batchPatch', listener: any): void
      emit(name: 'insertAdjacent' | 'remove' | 'error' | 'patch' | 'batchPatch', ...args: any[]): Promise<any>
      refresh(): void
      recursiveRemoveIfNoChildren(schema?: Schema, options?: RecursiveRemoveOptions): Schema;
      remove(schema?: Schema, options?: RemoveOptions): Promise<any>
      removeWithoutEmit(schema?: Schema, options?: RemoveOptions): Schema
      insertAdjacent(position: Position, schema: ISchema, options?: InsertAdjacentOptions): void | Promise<any>
      insertBeforeBeginOrAfterEnd(schema: ISchema, options?: InsertAdjacentOptions): void
      insertBeforeBegin(schema: ISchema, options?: InsertAdjacentOptions): void
      insertAfterBegin(schema: ISchema, options?: InsertAdjacentOptions): void
      insertBeforeEnd(schema: ISchema, options?: InsertAdjacentOptions): Promise<any>
      insertAfterEnd(schema: ISchema, options?: InsertAdjacentOptions): void
}
```

### Constructor

- Params
  - `current`: The Schema node to operate on
  - `api`: An instance of [APIClient](https://docs.nocobase.com/api/sdk) used to make backend requests
  - `onSuccess`: Callback function to be executed after a successful backend API request
  - `refresh`: Function to refresh the page after updating the node
  - `t`: The return value of `useTranslation()`

- Example

```tsx | pure
const schema = new Schema({
  type: 'void',
  name: 'hello',
  'x-component': 'div',
})

const dn = new Designable({ current: schema });
```

### Schema Operation Methods

```tsx | pure
const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
      b: {
          type: 'void',
          properties: {
              c: {
                  type: 'void',
              }
          }
      }
  }
});

const b = schema.b;

const dn = createDesignable({
  current: b,
})

console.log(schema.toJSON());
```

```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

#### remove

Remove the current node.

```tsx | pure
dn.remove();
console.log(schema.toJSON());
```

```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

dn.remove();

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

```diff
{
  type: 'void',
  name: 'a',
  properties: {
-      b: {
-          type: 'void',
-          properties: {
-              c: {
-                  type: 'void',
-              }
-          }
-      }
  }
}
```

#### insertBeforeBegin

Insert before the current node and trigger the `insertAdjacent` event.

```tsx | pure
dn.insertBeforeBegin({
  type: 'void',
  name: 'd',
});
console.log(schema.toJSON());
```

```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

dn.insertBeforeBegin({
  type: 'void',
  name: 'd',
});

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

```diff
{
  type: 'void',
  name: 'a',
  properties: {
+     d: {
+       type: 'void',
+     },
      b: {
          type: 'void',
          properties: {
              c: {
                  type: 'void',
              }
          }
      }
  }
}
```

#### insertAfterBegin

Insert after the current node and trigger the `insertAdjacent` event.

```tsx | pure
dn.insertAfterBegin({
  type: 'void',
  name: 'd',
});
console.log(schema.toJSON());
```


```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

dn.insertAfterBegin({
  type: 'void',
  name: 'd',
});

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

```diff
{
  type: 'void',
  name: 'a',
  properties: {
      b: {
          type: 'void',
          properties: {
+             d: {
+               type: 'void',
+             },
              c: {
                  type: 'void',
              }
          }
      }
  }
}
```

#### insertBeforeEnd

Insert after the current node and trigger the `insertAdjacent` event.

```tsx | pure
dn.insertBeforeEnd({
  type: 'void',
  name: 'd',
});
console.log(schema.toJSON());
```


```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

dn.insertBeforeEnd({
  type: 'void',
  name: 'd',
});

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

```diff
{
  type: 'void',
  name: 'a',
  properties: {
      b: {
          type: 'void',
          properties: {
              c: {
                  type: 'void',
              },
+             d: {
+               type: 'void',
+             },
          }
      }
  }
}
```

#### insertAfterEnd

Insert after the current node and trigger the `insertAdjacent` event.

```tsx | pure
dn.insertAfterEnd({
  type: 'void',
  name: 'd',
});
console.log(schema.toJSON());
```


```tsx
import React from 'react';
import { Schema } from '@formily/json-schema';
import { createDesignable } from '@nocobase/client';

const schema = new Schema({
  type: 'void',
  name: 'a',
  properties: {
    b: {
      type: 'void',
      properties: {
        c: {
          type: 'void',
        },
      },
    },
  },
});

const b = schema.properties['b'];

const dn = createDesignable({
  current: b,
});

dn.insertAfterEnd({
  type: 'void',
  name: 'd',
});

export default () => <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre>;
```

```diff
{
  type: 'void',
  name: 'a',
  properties: {
      b: {
          type: 'void',
          properties: {
              c: {
                  type: 'void',
              }
          }
      },
+     d: {
+       type: 'void',
+     },
  }
}
```

#### insertAdjacent

Determines the insertion position based on the first parameter, which is a wrapper for the previous four methods.

```tsx | pure
class Designable {
    insertAdjacent(position: Position, schema: ISchema, options?: InsertAdjacentOptions): void | Promise<any>
}
```

### Event Listeners and API Requests

- `on`: The basic method for adding event listeners.
- `loadAPIClientEvents`: Calls the `on` method to add event listeners for `insertAdjacent`, `patch`, `batchPatch`, and `remove` events. Its main function is to update the changed schema on the server.
- `emit`: Calls the previously registered methods based on the event name, triggered by *insertion and deletion operations*.

`loadAPIClientEvents()` is not called during initialization and needs to be manually called. In other words, if `dn.loadAPIClientEvents()` is not called, the updates will not be sent to the server. This is mainly used to simplify mocking the server in unit tests or demo environments.

## Utility Functions

### createDesignable()

A simple wrapper for `new Designable()`.

```tsx | pure
function createDesignable(options: CreateDesignableProps) {
  return new Designable(options);
}
```

```tsx | pure
const dn = createDesignable({ current: schema });
```

## Hooks

### useFieldSchema()

Used to get the current node's Schema JSON object. For more information, please refer to [formily useFieldSchema()](https://react.formilyjs.org/api/hooks/use-field-schema).

- Type

```tsx | pure
import { Schema } from '@formily/json-schema';
const useFieldSchema: () => Schema;
```

- Example

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { useFieldSchema } from '@formily/react';
import { Application, Plugin, SchemaComponent } from '@nocobase/client';
const Demo = ({ children }) => {
 const fieldSchema = useFieldSchema();
 return <div style={{ border: '1px solid red' }}>
  <pre>{ JSON.stringify(fieldSchema, null, 2)}</pre>
  <div style={{ paddingLeft: 20 }}>{children}</div>
 </div>
}
const schema = {
    type: 'void',
    name: 'hello',
    'x-component': 'Demo',
    'properties': {
        'world': {
            'type': 'void',
            'x-component': 'Demo',
        },
    }
}

const Root = () => {
    return <SchemaComponent components={{ Demo }} schema={schema} />
}

const app = new Application({
    providers: [Root]
})

export default app.getRootComponent();
```

### useField()

Get the current node's Schema instance. For more information, please refer to [formily useField()](https://react.formilyjs.org/api/hooks/use-field).

- Type

```tsx | pure
import { GeneralField } from '@formily/core';
const useField: <T = GeneralField>() => T;
```

- Example

```tsx | pure
const Demo = () => {
 const field = useField();
 console.log('field', field);
 return <div></div>
}

const schema = {
    type: 'void',
    name: 'hello',
    'x-component': 'Demo',  // 这里是 Demo 组件
    'properties': {
        'world': {
            'type': 'void',
            'x-component': 'Demo',  // 这里也是 Demo 组件
        },
    }
}

const Root = () => {
    return <SchemaComponent components={{ Hello }} schema={schema} />
}
```

### useDesignable()

Modify the current Schema node.

- Type

```tsx | pure
interface InsertAdjacentOptions {
  wrap?: (s: ISchema) => ISchema;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | BreakFn;
  onSuccess?: any;
}

type Position = 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';

function useDesignable(): {
    dn: Designable;
    designable: boolean;
    reset: () => void;
    refresh: () => void;
    setDesignable: (value: boolean) => void;
    findComponent(component: any): any;
    patch: (key: ISchema | string, value?: any) => void
    on(name: "error" | "insertAdjacent" | "remove" | "patch" | "batchPatch", listener: any): void
    remove(schema?: any, options?: RemoveOptions): void
    insertAdjacent(position: Position, schema: ISchema, options?: InsertAdjacentOptions): void
    insertBeforeBegin(schema: ISchema): void;
    insertAfterBegin(schema: ISchema): void;
    insertBeforeEnd(schema: ISchema): void;
    insertAfterEnd(schema: ISchema): void;
}
```

- Details
  - designable, reset, refresh, setDesignable: These values are inherited from [SchemaComponentContext](https://www.baidu.com).
  - dn: An instance of `Designable`.
  - findComponent: Used to find the actual component corresponding to a string in the Schema. Returns `null` if the component is not registered.
  - remove: Internally calls the `dn.remove` method.
  - on: Internally calls the `dn.on` method.
  - insertAdjacent: Inserts a new Schema node. Internally calls the `dn.insertAdjacent` method.
    - position: The position to insert.
    - schema: The new Schema node.
    - Options:
      - wrap: A callback function for secondary processing of the Schema.
      - removeParentsIfNoChildren: Removes the parent element when there are no child elements.
      - breakRemoveOn: A callback for determining when to stop removing.
      - onSuccess: A callback for successful insertion.
  - insertBeforeBegin: Internally calls the `dn.insertBeforeBegin` method.
  - insertAfterBegin: Internally calls the `dn.insertAfterBegin` method.
  - insertBeforeEnd: Internally calls the `dn.insertBeforeEnd` method.
  - insertAfterEnd: Internally calls the `dn.insertAfterEnd` method.

- Example

插入节点。

```tsx
import React from 'react';
import {
  SchemaComponentProvider,
  SchemaComponent,
  useDesignable,
} from '@nocobase/client';
import { observer, Schema, useFieldSchema } from '@formily/react';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const Hello = observer(
  (props) => {
    const { insertAdjacent } = useDesignable();
    const fieldSchema = useFieldSchema();
    return (
      <div>
        <h1>{fieldSchema.name}</h1>
        <Space>
          <Button
            onClick={() => {
              insertAdjacent('beforeBegin', {
                'x-component': 'Hello',
              });
            }}
          >
            before begin
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('afterBegin', {
                'x-component': 'Hello',
              });
            }}
          >
            after begin
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('beforeEnd', {
                'x-component': 'Hello',
              });
            }}
          >
            before end
          </Button>
          <Button
            onClick={() => {
              insertAdjacent('afterEnd', {
                'x-component': 'Hello',
              });
            }}
          >
            after end
          </Button>
        </Space>
        <div style={{ margin: 50 }}>{props.children}</div>
      </div>
    );
  },
  { displayName: 'Hello' },
);

const Page = observer(
  (props) => {
    return <div>{props.children}</div>;
  },
  { displayName: 'Page' },
);

export default () => {
  return (
    <SchemaComponentProvider components={{ Page, Hello }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            hello1: {
              type: 'void',
              'x-component': 'Hello',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
};
```

Partial update.

```tsx
import React from 'react';
import {
  SchemaComponentProvider,
  SchemaComponent,
  useDesignable,
} from '@nocobase/client';
import { observer, Schema, useField, useFieldSchema } from '@formily/react';
import { FormItem } from '@formily/antd-v5';
import { Button } from 'antd';
import { uid } from '@formily/shared';

const Hello = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { dn } = useDesignable();
    return (
      <div>
        <h1>{field.title}</h1>
        { JSON.stringify(props) }
        <br/>
        { JSON.stringify(field.componentProps) }
        <br/>
        { JSON.stringify(field.decoratorProps) }
        <br/>
        { JSON.stringify(fieldSchema.toJSON()) }
        <br/>
        <Button onClick={() => {
          dn.shallowMerge({
            title: uid(),
            'x-component-props': {a: uid(), },
            'x-decorator-props': {b: uid(), },
          });
        }}>shallowMerge</Button>
        <Button onClick={() => {
          dn.deepMerge({
            title: uid(),
            'x-component-props': {c: uid() },
            'x-decorator-props': {d: uid(), },
          });
        }}>deepMerge</Button>
      </div>
    );
  },
  { displayName: 'Hello' },
);

const Page = observer(
  (props) => {
    return <div>{props.children}</div>;
  },
  { displayName: 'Page' },
);

export default () => {
  return (
    <SchemaComponentProvider components={{ FormItem, Page, Hello }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
          properties: {
            hello1: {
              type: 'string',
              title: 'Title 1',
              'x-decorator': 'FormItem',
              'x-component': 'Hello',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
};
```
