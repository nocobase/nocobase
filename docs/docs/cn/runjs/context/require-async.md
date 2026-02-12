# ctx.requireAsync()

按 URL 异步加载 **UMD/AMD** 或挂载到全局的脚本，也可加载 **CSS**，适用于 JS 区块、JS 字段、JS 操作等场景。需要 UMD/AMD 库时使用 `ctx.requireAsync()`，ESM 库使用 `ctx.importAsync()`；传入 `.css` 地址会加载并注入样式。

## 类型定义

```typescript
requireAsync<T = any>(url: string): Promise<T>;
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | string | 支持两种形式：**简写路径** `<包名>@<版本>/<文件路径>`（与 `ctx.importAsync()` 相同，会按 ESM CDN 配置解析，请求时加上 `?raw` 取原始 UMD 文件）；或 **完整 URL**（如 `https://cdn.jsdelivr.net/npm/xxx`）。也可传入 `.css` 地址，加载后注入页面。 |

## 返回值

- 加载后的库对象（具体形式取决于该库的导出方式）。许多 UMD 库会挂到全局（如 `window.xxx`），使用时按该库文档即可。

## 说明

- **UMD/AMD 与 CSS**：除 UMD/AMD 脚本外，也支持加载 CSS（传入 `.css` URL，加载后注入页面）。
- **简写路径**：例如 `echarts@5/dist/echarts.min.js` 在默认使用 esm.sh 时会请求 `https://esm.sh/echarts@5/dist/echarts.min.js?raw`。
- **完整 URL**：可直接写任意 CDN 的完整地址。

## 示例

```javascript
// 简写路径（经 esm.sh 解析为 ...?raw）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 完整 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// 加载 CSS 并注入页面
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

## 与 ctx.importAsync() 的区别

- **ctx.requireAsync()**：加载 **UMD/AMD/global** 脚本，适合 ECharts、FullCalendar、jQuery 插件等；加载后库常挂到 `window`。
- **ctx.importAsync()**：加载 **ESM 模块**，返回模块命名空间。若库同时提供 ESM 版本，优先使用 `ctx.importAsync()` 以获得更好的模块语义与 Tree-shaking。
