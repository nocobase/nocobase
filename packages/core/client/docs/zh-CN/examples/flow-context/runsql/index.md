# ctx.runsql()

```ts
type RunSQLOptions = {
  uid: string;
  params?: Record<string, any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows'; // 默认 selectRows
};
declare runsql: (sql: string, options: RunSQLOptions) => Promise<any>;
```

## selectRows - 查询结果集

```ts
const options = {
  uid: 'uid3',
  params: {
    age: 30
  },
};
await ctx.runsql('SELECT * FROM users WHERE age > :age', options);
```

## selectRow - 查询某记录行

```ts
const options = {
  uid: 'uid1',
  // 默认 type: 'selectRows',
  params: {
    userId: 1
  },
};
await ctx.runsql('SELECT * FROM users WHERE id = :userId', options);
```

## selectVar - 查询值

```ts
const options = {
  uid: 'uid2',
};
await ctx.runsql('SELECT count(id) FROM users', options);
```

