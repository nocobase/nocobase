# FlowSQLRepository

`FlowSQLRepository` 提供了 SQL 执行和管理的能力，支持动态 SQL 执行、参数绑定、结果类型控制等功能。

## API 方法

### run(sql, options?)

执行 SQL 查询语句。

**参数**
- `sql` (string): 要执行的 SQL 语句
- `options` (SQLRunOptions, 可选): 执行选项
  - `bind`: 参数绑定，支持对象或数组格式
  - `type`: 返回类型
    - `'selectVar'`: 返回单个值
    - `'selectRow'`: 返回单行数据
    - `'selectRows'`: 返回多行数据（默认）
  - `dataSourceKey`: 数据源标识
  - `filter`: 额外的过滤条件

**返回值**
- `Promise<any>`: 查询结果

**示例**
```ts
// 基本查询
const result = await ctx.sql.run('SELECT * FROM users');

// 参数绑定 - 对象形式
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id', 
  { bind: { id: 1 } }
);

// 参数绑定 - 数组形式
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE age > ? AND city = ?', 
  { bind: [18, 'Beijing'] }
);

// 返回单个值
const count = await ctx.sql.run(
  'SELECT COUNT(*) as total FROM users', 
  { type: 'selectVar' }
);

// 返回单行数据
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = 1', 
  { type: 'selectRow' }
);
```

### save(data)

保存 SQL 模板供后续使用。

**参数**
- `data` (SQLSaveOptions): 保存数据
  - `uid`: 唯一标识符
  - `sql`: SQL 语句
  - `dataSourceKey`: 数据源标识（可选）

**返回值**
- `Promise<void>`

**示例**
```ts
await ctx.sql.save({
  uid: 'get-user-by-id',
  sql: 'SELECT * FROM users WHERE id = :id',
  dataSourceKey: 'main'
});
```

### runById(uid, options?)

通过保存的模板 ID 执行 SQL。

**参数**
- `uid` (string): 模板唯一标识符
- `options` (SQLRunOptions, 可选): 执行选项，同 `run` 方法

**返回值**
- `Promise<any>`: 查询结果

**示例**
```ts
// 先保存模板
await ctx.sql.save({
  uid: 'get-user-by-id',
  sql: 'SELECT * FROM users WHERE id = :id'
});

// 后续使用
const user = await ctx.sql.runById('get-user-by-id', {
  bind: { id: 123 },
  type: 'selectRow'
});
```

### destroy(uid)

删除保存的 SQL 模板。

**参数**
- `uid` (string): 模板唯一标识符

**返回值**
- `Promise<void>`

**示例**
```ts
await ctx.sql.destroy('get-user-by-id');
```
