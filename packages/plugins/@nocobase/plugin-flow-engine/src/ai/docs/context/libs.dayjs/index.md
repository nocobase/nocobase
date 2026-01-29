# ctx.libs.dayjs

内置的 `dayjs` 日期时间工具库，在 RunJS 环境中可直接使用，适合做时间格式化、区间计算等。

## 类型定义（简化）

```ts
libs.dayjs: typeof import('dayjs');
```

## 使用示例

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');

ctx.render(<div>当前时间：{formatted}</div>);
```

> 提示：
> - 内置版本与前端应用保持一致，一般无需额外通过 `ctx.importAsync` 再引入 dayjs
> - 如需使用插件（如 `timezone`、`relativeTime`），可在脚本中按 dayjs 官方文档进行扩展
