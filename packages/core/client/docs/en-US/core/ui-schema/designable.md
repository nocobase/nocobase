# Designable

## Designable

对 Schema 节点进行增、删、改操作，并且提供了事件触发机制，用于将数据同步到服务端。

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

### 构造函数

- 参数讲解

  - `current`：需要操作的 Schema 节点
  - `api`：用于发起后端请求的 [APIClient](https://docs.nocobase.com/api/sdk) 实例
  - `onSuccess`：后端接口请求成功后的回调
  - `refresh`：用于更新节点后，刷新页面
  - `t`：`useTranslation()` 的返回值
- 示例

```tsx | pure
const schema = new Schema({
  type: 'void',
  name: 'hello',
  'x-component': 'div',
})

const dn = new Designable({ current: schema });
```

### Schema 操作方法

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

移除当前节点

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

在当前节点的前面插入，并会触发 `insertAdjacent` 事件。

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

在当前节点的前面插入，并会触发 `insertAdjacent` 事件。

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

在当前节点的前面插入，并会触发 `insertAdjacent` 事件。

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

在当前节点的前面插入，并会触发 `insertAdjacent` 事件。

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

根据第一个参数决定插入的位置，是前面四个方法的封装。

```tsx | pure
class Designable {
    insertAdjacent(position: Position, schema: ISchema, options?: InsertAdjacentOptions): void | Promise<any>
}
```

### 事件监听和 API 请求

- `on` ：添加事件监听的基础方法
- `loadAPIClientEvents`：调用 `on` 方法添加对 `insertAdjacent`、`patch`、`batchPatch`、`remove` 的事件的监听，主要功能是将变更的 Schema 更新到服务端
- `emit`：是根据事件名称，调用之前注册过的方法，具体是由前面讲过的 *插入操作和删除操作* 触发

而 `loadAPIClientEvents()` 并非在初始化时调用，需要手动调用，换而言之，如果不调用 `dn.loadAPIClientEvents()`，则不会将更新发送到服务端，主要是简化在单测或者 DEMO 环境对服务端的 Mock。

## 工具函数

### createDesignable()

对 `new Designable()` 的简单封装。

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

用户获取当前节点 Schema JSON 对象，更多信息请参考 [formily useFieldSchema()](https://react.formilyjs.org/api/hooks/use-field-schema)。

- 类型

```tsx | pure
import { Schema } from '@formily/json-schema';
const useFieldSchema: () => Schema;
```

- 示例

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
    'x-component': 'Demo',  // 这里是 Demo 组件
    'properties': {
        'world': {
            'type': 'void',
            'x-component': 'Demo',  // 这里也是 Demo 组件
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

获取当前节点 Schema 实例，更多信息请参考 [formily useField()](https://react.formilyjs.org/api/hooks/use-field)

- 类型

```tsx | pure
import { GeneralField } from '@formily/core';
const useField: <T = GeneralField>() => T;
```

- 示例

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

对当前 Schema 节点的修改操作。

- 类型

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

- 详细解释

  - designable、reset、refresh、setDesignable：这些值继承自 [SchemaComponentContext](https://www.baidu.com)
  - dn：是 `Designable` 的实例
  - findComponent：用于查找 Schema 中字符串对应真正的组件，如果组件未注册则返回 `null`
  - remove：内部调用的是 `dn.remove` 方法
  - on：内部调用的是 `dn.on` 方法
  - insertAdjacent：插入新的 Schema 节点，内部调用的是 `dn.insertAdjacent` 方法
    - position：插入位置
    - schema：新的 Schema 节点
    - Options
      - wrap：对 Schema 的二次处理的回调函数
      - removeParentsIfNoChildren：当没有子元素时，删除父元素
      - breakRemoveOn：停止删除的判断回调
      - onSuccess：插入成功的回调
  - insertBeforeBegin：内部调用的是 `dn.insertBeforeBegin` 方法
  - insertAfterBegin：内部调用的是 `dn.insertAfterBegin` 方法
  - insertBeforeEnd：内部调用的是 `dn.insertBeforeEnd` 方法
  - insertAfterEnd：内部调用的是 `dn.insertAfterEnd` 方法
- 示例

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

部分更新。

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