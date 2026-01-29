# ctx.libs.lodash

内置的 Lodash 工具库，在 RunJS 环境中可直接使用，适合做对象访问、数组处理等常见数据操作。

## 类型定义（简化）

```ts
libs.lodash: typeof import('lodash');
```

## 使用示例

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');

ctx.render(<div>用户名：{name}</div>);
```
