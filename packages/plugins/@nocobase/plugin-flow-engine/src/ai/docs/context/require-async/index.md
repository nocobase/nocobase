# ctx.requireAsync()

按 URL 异步加载外部库（UMD/AMD/全局库格式）。适合在 JSBlock / JSField / JSAction 中引入需要挂载到全局对象的第三方库。

## 类型定义（简化）

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- `url`：库的 CDN 地址（UMD/AMD 格式）
- 返回值：加载后的库对象（具体取决于库的导出方式）

> 说明：
> - `ctx.requireAsync` 适合加载 UMD/AMD/全局库（如 FullCalendar、jQuery 插件等）
> - 加载后，库通常会挂载到全局对象（如 `window.FullCalendar`），可直接使用
> - 若库提供 ESM 版本，推荐使用 `ctx.importAsync` 加载，更符合现代模块规范

## 使用示例

- [使用 FullCalendar 渲染日历](./require-async-fullcalendar.md)

## 与 ctx.importAsync() 的区别

- [ctx.importAsync() vs ctx.requireAsync()](../import-async/import-async-vs-require-async.md)
