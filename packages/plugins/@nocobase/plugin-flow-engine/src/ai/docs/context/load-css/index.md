# ctx.loadCSS()

按 URL 异步加载外部 CSS 样式表。适合在 JSBlock / JSField / JSAction 中动态引入第三方库的样式文件。

## 类型定义（简化）

```ts
loadCSS(url: string): Promise<void>;
```

- `url`：CSS 文件的 CDN 地址
- 返回值：Promise，加载成功时 resolve，失败时 reject

> 说明：
> - `ctx.loadCSS` 会自动检查 CSS 是否已加载，避免重复加载
> - CSS 会被添加到 `document.head` 中，全局生效
> - 适合在加载第三方库（如 Tabulator、FullCalendar 等）时，同时加载其样式文件

## 使用示例

```ts
// 加载 Tabulator 的样式
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 加载 FullCalendar 的样式
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.min.css');

// 加载多个样式文件
await Promise.all([
  ctx.loadCSS('https://cdn.jsdelivr.net/npm/library@1.0.0/dist/css/main.css'),
  ctx.loadCSS('https://cdn.jsdelivr.net/npm/library@1.0.0/dist/css/theme.css'),
]);
```

> 提示：
> - 通常在使用 `ctx.importAsync` 或 `ctx.requireAsync` 加载第三方库后，需要同时加载其 CSS 文件
> - 建议在加载库之前或之后立即加载对应的 CSS，确保样式正确应用
