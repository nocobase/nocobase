# ctx.requireAsync()

按 URL 异步加载外部库（UMD/AMD/global 格式）。适用于在 JSBlock / JSField / JSAction 中加载需要挂到全局对象的第三方库。

## 类型定义（简化）

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- `url`：库的 CDN URL（UMD/AMD 格式）
- 返回值：加载后的库对象（具体形态取决于库的导出方式）

> 说明：
> - `ctx.requireAsync` 适用于 UMD/AMD/global 库（如 FullCalendar、jQuery 插件）
> - 加载后库通常会挂到全局对象（如 `window.FullCalendar`）
> - 若库提供 ESM 版本，建议优先使用 `ctx.importAsync` 以获得现代模块语义

## 与 ctx.importAsync() 的区别

- [ctx.importAsync() 与 ctx.requireAsync()](./import-async-vs-require-async.md)
