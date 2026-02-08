# ctx.importAsync()

按 URL 动态加载 **ESM 模块**或 **CSS**，适用于 JS 区块、JS 字段、JS 操作等场景。需要第三方 ESM 库时使用 `ctx.importAsync()`，UMD/AMD 库使用 `ctx.requireAsync()`；传入 `.css` 地址会加载并注入样式。

## 类型定义

```typescript
importAsync<T = any>(url: string): Promise<T>;
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | string | ESM 模块或 CSS 地址。支持简写 `<包名>@<版本>` 或带子路径 `<包名>@<版本>/<文件路径>`（如 `vue@3.4.0`、`dayjs@1/plugin/relativeTime.js`），会按配置拼接 CDN 前缀；也支持完整 URL。传入 `.css` 时会加载并注入样式。 |

## 返回值

- 解析后的模块命名空间对象（Promise 解析值）。

## 说明

- **ESM 与 CSS**：除 ESM 模块外，也支持加载 CSS（传入 `.css` URL，加载后注入页面）。
- **简写格式**：未配置时使用 **https://esm.sh** 作为 CDN 前缀。例如 `vue@3.4.0` 实际请求 `https://esm.sh/vue@3.4.0`。
- **自建 CDN**：可通过环境变量指定内网或自建服务：
  - **ESM_CDN_BASE_URL**：ESM CDN 基础地址（默认 `https://esm.sh`）
  - **ESM_CDN_SUFFIX**：可选后缀（如 jsDelivr 的 `/+esm`）
  - 自建服务可参考：[nocobase/esm-server](https://github.com/nocobase/esm-server)

## 示例

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// 等价于从 https://esm.sh/vue@3.4.0 加载

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// 带子路径（如 dayjs 插件）

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// 完整 URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// 加载 CSS 并注入页面
```

## 与 ctx.requireAsync() 的区别

- **ctx.importAsync()**：加载 **ESM 模块**，返回模块命名空间，适合现代库（Vue、dayjs 等 ESM 构建）。
- **ctx.requireAsync()**：加载 **UMD/AMD** 或挂到全局的脚本，多用于 ECharts、FullCalendar 等 UMD 库。若库同时提供 ESM，优先用 `ctx.importAsync()`。
