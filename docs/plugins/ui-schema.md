# ui-schema

将客户端 SchemaComponent 的 Schema 存储在服务端，以实现按需动态输出。

## HTTP API

```bash
GET   /ui_schemas:getJsonSchema/<x-uid>
GET   /ui_schemas:getProperties/<x-uid>
POST  /ui_schemas:insert
POST  /ui_schemas:patch
POST  /ui_schemas:remove/<x-uid>
POST  /ui_schemas:prepend/<x-uid>
POST  /ui_schemas:append/<x-uid>
POST  /ui_schemas:insertBefore/<x-uid>
POST  /ui_schemas:insertAfter/<x-uid>
```

例子参考下文的 UISchemaRepository  API

## UISchemaRepository  API

如何获取 UISchemaRepository？

```ts
const repository = db.getCollection('ui_schemas').repository;
```

### `repository.insert()`

创建根节点、根节点树。如果有子节点，也会同步创建。

```ts
import { Schema, ISchema as FormilyISchema } from '@formily/json-schema';

class UISchemaRepository {
  insert(schema: ISchema): Promise<Schema>;
}
interface ISchema extends FormilyISchema {
  ['x-uid']: string;
}
```

<Alert title="注意">

- 在 Formily 的 ISchema 协议基础上扩展 `x-uid` 用于记录单 schema 节点的 pk 值，这个值只用于后端 schema 节点的查询。
- `name` 和 `x-uid` 缺失时，随机生成，如果提供了，按照提供的处理。

</Alert>

##### Examples

`x-key`、`name` 未提供时，随机生成

```ts
const schema = await repository.insert({
  type: 'string',
  title: 'ttt',
  'x-component': 'Input',
});

// 结果为：
{
  name: 'tkt2jhj8sat', // 随机生成
  'x-uid': 'momkt16x7mx', // 随机生成
  type: 'string',
  title: 'ttt',
  'x-component': 'Input',
}
```

有 properties 时：

```ts
const schema = await repository.insert({
  type: 'object',
  title: 'title',
  properties: {
    a1: {
      type: 'string',
      title: 'A1',
      'x-component': 'Input',
    },
    b1: {
      'x-async': true, // 添加了一个异步节点
      type: 'string',
      title: 'B1',
      properties: {
        c1: {
          type: 'string',
          title: 'C1',
        },
        d1: {
          'x-async': true,
          type: 'string',
          title: 'D1',
        },
      },
    },
  },
});

// 以上创建 5 个 schema 节点，结果为：
{
  name: 'tkt2jhj8sat',
  'x-uid': 'momkt16x7mx',
  type: 'object',
  title: 'title',
  properties: {
    a1: {
      'x-uid': 'dtf9j0b8p9u',
      type: 'string',
      title: 'A1',
      'x-component': 'Input',
    },
    b1: {
      'x-async': true,
      'x-uid': 'k3s7zqvqmom',
      type: 'string',
      title: 'B1',
      properties: {
        c1: {
          'x-uid': 'bx33j95zx96',
          type: 'string',
          title: 'C1',
        },
        d1: {
          'x-async': true,
          'x-uid': '95u0x6o2nws',
          type: 'string',
          title: 'D1',
        },
      },
    },
  },
}
```

### `repository.getJsonSchema()`

查询某节点的 JSON Schema，跳过 async 的子节点

```ts
class UISchemaRepository {
  getJsonSchema(uid: PrimaryKey): Promise<Schema>;
}
```

##### Examples

上文 insert 的例子，查询的结果为（跳过 async 的子节点）：

```ts
const schema = await repository.getJsonSchema('momkt16x7mx');

// b1 节点为 async 未输出，结果为：
{
  name: 'tkt2jhj8sat',
  'x-uid': 'momkt16x7mx',
  type: 'object',
  title: 'title',
  properties: {
    a1: {
      'x-uid': 'dtf9j0b8p9u',
      type: 'string',
      title: 'A1',
      'x-component': 'Input',
    },
  },
}
```

### `repository.getProperties()`

查询某节点的所有 properties 子节点，第一层子节点如果为 async 不跳过，其他层的跳过。

```ts
class UISchemaRepository {
  getProperties(uid: PrimaryKey): Promise<Schema>;
}
```

##### Examples

getProperties 查询，无需输出根节点信息，无 name 和 x-uid，固定格式为：

```ts
{
  type: 'object',
  // 所有子节点放这里
  properties: {},
}
```

上文 insert 的例子，对应 getProperties 的查询结果为：

```ts
const schema = await repository.getProperties('momkt16x7mx');
// 结果为：
{
  type: 'object',
  properties: {
    a1: {
      'x-uid': 'dtf9j0b8p9u',
      type: 'string',
      title: 'A1',
      'x-component': 'Input',
    },
    b1: {
      'x-async': true, // 第一层子节点如果为 async 不跳过
      'x-uid': 'k3s7zqvqmom',
      type: 'string',
      title: 'B1',
      properties: {
        c1: {
          'x-uid': 'bx33j95zx96',
          type: 'string',
          title: 'C1',
        },
        // d1 节点为 async 跳过了
      },
    },
  },
}
```

### `repository.patch()`

更新节点（部分更新），deepmerge 操作

```ts
class UISchemaRepository {
  patch(schema: ISchema): Promise<Schema>;
}
```

##### Examples

```ts
await repository.patch({
  'x-uid': 'momkt16x7mx',
  title: 'title1111',
  properties: {
    a1: {
      title: 'A1111',
    },
    // b1 虽然为 async，但也可以更新
    b1: {
      title: 'B1111',
    },
  },
});

// 被修改的节点的结果为（这里的例子只贴了被修改的节点）：
{
  name: 'tkt2jhj8sat',
  'x-uid': 'momkt16x7mx',
  type: 'object',
  title: 'title',
  properties: {
    a1: {
      'x-uid': 'dtf9j0b8p9u',
      type: 'string',
      title: 'A1111',
      'x-component': 'Input',
    },
    b1: {
      'x-async': true,
      'x-uid': 'k3s7zqvqmom',
      type: 'string',
      title: 'B1111',
    },
  },
}
```

### `repository.remove()`

移除某节点，子节点也全部删除

```ts
class UISchemaRepository {
  remove(uid: PrimaryKey): Promise<void>;
}
```

##### Eexamples

```ts
const schema = await repository.getJsonSchema('k3s7zqvqmom');
// 结果为：
schema === null
```

### `repository.prepend()`

```ts
class UISchemaRepository {
  prepend(node1: ISchema | PrimaryKey, node2: ISchema | PrimaryKey): Promise<void>;
}
```

将 node2 插入到 node1 的所有相邻子节点最前面。

- 如果 node2 为 PrimaryKey 时，为位移操作，node2 的整个节点树都移动到 node1 下
- 如果 node2 为 JSON 时（ISchema 格式），node2 可能为单个节点或者是多个节点组成的节点树
  - 如果 node2 节点存在，只是位移操作
  - 如果 node2 节点不存在，创建节点
  - 如果是 node2(新)->node3(新)->node4(旧) 的节点树，新建 node2->node3 节点，并将旧的 node4 节点移至 node3 里

##### Examples

将 n4 放到 n2 里（最前面）

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n2', 'n4');
// 结果为：
{
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        d: {'x-uid': 'n4'},
        c: {'x-uid': 'n3'},
      },
    },
  },
}
```

新建一个 n5 节点并放到 n2 里（最前面）

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n2', {
  name: 'e',
  'x-uid': 'n5',
});
// 结果为：
{
  'x-uid': 'u1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
        e: {'x-uid': 'n5'},
      },
    },
    d: {'x-uid': 'n4'},
  },
}
```

将 n5(新)->n4(旧) 节点树，放到 n1 里（最前面）

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n1', {
  name: 'e',
  'x-uid': 'n5',
  properties: {
    d: {'x-uid': 'n4'}, // n4 节点移至这里了
  },
});
// 结果为：
{
  'x-uid': 'u1',
  name: 'a',
  type: 'object',
  properties: {
    e: {
      'x-uid': 'n5',
      properties: {
        d: {'x-uid': 'n4'}, // n4 节点移至这里了
      },
    },
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
  },
}
```

将 n5(新)->n6(新)->n4(旧) 放到 n1 里（最前面）

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n1', {
  name: 'e',
  'x-uid': 'n5',
  properties: {
    f: {
      'x-uid': 'n6',
      properties: {
        d: {'x-uid': 'n4'}, // n4 节点移至这里了
      },
    },
  },
});
// 结果为：
{
  'x-uid': 'u1',
  name: 'a',
  type: 'object',
  properties: {
    e: {
      'x-uid': 'n5',
      properties: {
        f: {
          'x-uid': 'n6',
          properties: {
            d: {'x-uid': 'n4'}, // n4 节点移至这里了
          },
        },
      },
    },
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
  },
}
```

### `repository.append()`

```ts
class UISchemaRepository {
  append(node1: ISchema | PrimaryKey, node2: ISchema | PrimaryKey): Promise<void>;
}
```

将 node2 插入到 node1 的所有相邻子节点最后面。

##### Examples

例子参考 repository.prepend() 操作。

### `repository.insertBefore()`

```ts
class UISchemaRepository {
  insertBefore(node1: ISchema | PrimaryKey, node2: ISchema | PrimaryKey): Promise<void>;
}
```

将 node2 插入到 node1 之前。

##### Examples

- 如果 node2 为 PrimaryKey 时，为位移操作，node2 的整个节点树都移动到 node1 之前
- 如果 node2 为 JSON 时（ISchema 格式），node2 可能为单个节点或者是多个节点组成的节点树
  - 如果 node2 节点存在，只是位移操作
  - 如果 node2 节点不存在，创建节点
  - 如果是 node2(新)->node3(新)->node4(旧) 的节点树，新建 node2->node3 节点，并将旧的 node4 节点移至 node3 里

##### Examples

新建 n5 并放到 n2 前面

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n2', {
  name: 'e',
  'x-uid': 'n5',
});
// 结果为：
{
  'x-uid': 'u1',
  name: 'a',
  type: 'object',
  properties: {
    e: {'x-uid': 'n5'},
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
}
```

将 n5(新)->n6(新)->n4(旧) 放到 n2 前面

```ts
await repository.insert({
  'x-uid': 'n1',
  name: 'a',
  type: 'object',
  properties: {
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
});
await repository.prepend('n1', {
  name: 'e',
  'x-uid': 'n5',
  properties: {
    f: {
      'x-uid': 'n6',
      properties: {
        d: {'x-uid': 'n4'}, // n4 节点移至这里了
      },
    },
  },
});
// 结果为：
{
  'x-uid': 'u1',
  name: 'a',
  type: 'object',
  properties: {
    e: {
      'x-uid': 'n5',
      properties: {
        f: {
          'x-uid': 'n6',
          properties: {
            d: {'x-uid': 'n4'}, // n4 节点移至这里了
          },
        },
      },
    },
    b: {
      'x-uid': 'n2',
      type: 'object',
      properties: {
        c: {'x-uid': 'n3'},
      },
    },
  },
}
```

### `repository.insertAfter()`

```ts
class UISchemaRepository {
  insertAfter(node1: ISchema | PrimaryKey, node2: ISchema | PrimaryKey): Promise<void>;
}
```

将 node2 插入到 node2 之后。

##### Examples

例子参考 repository.insertBefore() 操作。
