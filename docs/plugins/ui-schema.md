# ui-schema

将客户端 SchemaComponent 的 Schema 存储在服务端，以实现按需动态输出。

## HTTP API

```bash
POST  /ui_schemas:insert
POST  /ui_schemas:insertAdjacent/<uid>?position=<position>
POST  /ui_schemas:insertBeforeBegin/<uid>
POST  /ui_schemas:insertAfterBegin/<uid>
POST  /ui_schemas:insertBeforeEnd/<uid>
POST  /ui_schemas:insertAfterEnd/<uid>
GET   /ui_schemas:getJsonSchema/<uid>
GET   /ui_schemas:getProperties/<uid>
POST  /ui_schemas:patch
POST  /ui_schemas:remove/<uid>
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
  ['x-uid']: string; // 基于 Formily 的 Schema 扩展了 x-uid 属性
}
```

<Alert title="注意">

- 在 Formily 的 ISchema 协议基础上扩展 `x-uid` 用于记录单 schema 节点的 pk 值，这个值只用于后端 schema 节点的查询。
- `name` 和 `x-uid` 并无联系，缺失时，都随机生成，如果提供了，按照提供的处理。

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

更新节点（部分更新），deepmerge 操作，也可以处理子节点的更新

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
  properties: { // 也可以处理子节点的更新
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

### `repository.insertAdjacent()`

在某节点相邻位置插入，四个位置：beforeBegin、afterBegin、beforeEnd、afterEnd

```ts
class UISchemaRepository {
  insertAdjacent(node1: NodeType, position: Position, node2: NodeType): Promise<Schema>;
}

type UID = string;
type NodeType = UID | ISchema;
type Position = 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';
```

几个插入的位置：

```ts
{
  properties: {
    // beforeBegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterBegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeEnd 在当前节点的最后一个子节点后面
      },
    },
    // afterEnd 在当前节点的后面
  },
}
```

待插入的节点 node2 如果已存在，为位移操作；如果不存在，有两种情况：

- node2(新)->node3(新)...(新) 节点树全部是新节点，全部新建之后并插入在 node1 相邻位置；
- node2(新)->node3(新)->node4(旧)->node5(旧)...(旧) 节点树的上游节点为新节点，下游为已存在节点。上游新节点新建之后插入在 node1 相邻位置，下游节点位移至新节点树指定位置。

insertAdjacent 需要提供 position，你也可以使用快捷的相邻位置插入的方法：

```ts
// 在当前节点的前面插入
repository.insertBeforeBegin(node1, node2);
// 等同于
repository.insertAdjacent('beforeBegin', node1, node2);

// 在当前节点的第一个子节点前面插入
repository.insertAfterBegin(node1, node2);
// 等同于
repository.insertAdjacent('afterBegin', node1, node2);

// 在当前节点的最后一个子节点后面
repository.insertBeforeEnd(node1, node2);
// 等同于
repository.insertAdjacent('beforeEnd', node1, node2);

// 在当前节点的后面
repository.insertAfterEnd(node1, node2);
// 等同于
repository.insertAdjacent('afterEnd', node1, node2);
```

<Alert title="注意">
根节点只能插入子节点，所以只有 afterBegin 和 beforeEnd 两个相邻位置可以插入
</Alert>

##### Examples

将 n4 放到 n2 第一个子节点的前面

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
await repository.insertAfterBegin('n2', 'n4');
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

新建一个 n5 放到 n2 第一个子节点的前面

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
await repository.insertAfterBegin('n2', {
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
        e: {'x-uid': 'n5'},
        c: {'x-uid': 'n3'},
      },
    },
    d: {'x-uid': 'n4'},
  },
}
```

将 n5(新)->n4(旧) 节点树，放到 n1 第一个子节点的前面

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
await repository.insertAfterBegin('n1', {
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

将 n5(新)->n6(新)->n4(旧) 放到 n1 第一个子节点的前面

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
await repository.insertAfterBegin('n1', {
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

### `repository.insertBeforeBegin()`

等同于 `repository.insertAdjacent('beforeBegin', node1, node2)`

### `repository.insertAfterBegin()`

等同于 `repository.insertAdjacent('afterBegin', node1, node2)`

### `repository.insertBeforeEnd()`

等同于 `repository.insertAdjacent('beforeEnd', node1, node2)`

### `repository.insertAfterEnd()`

等同于 `repository.insertAdjacent('afterEnd', node1, node2)`

