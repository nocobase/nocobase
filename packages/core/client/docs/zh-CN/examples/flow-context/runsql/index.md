# ctx.runsql()

:::info
- **调试模式**：以 upsert 方式创建或更新 SQL。
- **非调试模式**：不允许创建或修改 SQL，后端会根据 `uid` 查找对应 SQL。
:::

## 方法签名

```ts
type RunSQLOptions = {
  uid: string; // 必填，SQL 唯一标识，非调试模式时，后端会根据 `uid` 查找对应 SQL。
  sql: string; // 调试模式时，以 upsert 方式创建或更新 SQL。
  bind?: Record<string, any>; // 可选，SQL bind 参数
  filter?: Record<string, any>; // 可选，过滤条件，支持以 filter 协议的标准，处理 SQL WHERE
  type?: 'selectRows' | 'selectRow' | 'selectVar'; // 可选，默认 selectRows
  debug?: boolean;
};
declare runsql: (options: RunSQLOptions) => Promise<any>;
```

## 用法示例

### 1. 查询结果集（selectRows）

返回多条记录。

```ts
const options = {
  uid: 'uid3',
  sql: 'SELECT * FROM users WHERE age > $age',
  bind: { age: 30 },
};
await ctx.runsql(options);
```

### 2. 查询单条记录（selectRow）

返回一条记录。

```ts
const options = {
  uid: 'uid1',
  type: 'selectRow',
  sql: 'SELECT * FROM users WHERE id = $userId',
  bind: { userId: 1 },
};
await ctx.runsql(options);
```

### 3. 查询单个值（selectVar）

返回单个值。

```ts
const options = {
  uid: 'uid2',
  type: 'selectVar',
  sql: 'SELECT count(id) FROM users',
};
await ctx.runsql(options);
```

### filter

支持以 filter 协议的标准，处理 SQL WHERE

```ts
const options = {
  uid: 'uid1',
  sql: 'SELECT * FROM users',
  filter: { id: 1 },
};
await ctx.runsql(options);
// SELECT * FROM users WHERE id = 1
```
