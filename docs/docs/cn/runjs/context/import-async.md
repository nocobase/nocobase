# ctx.importAsync()

按 URL 动态导入 ESM 模块（开发和生产环境均可用）。适用于在 JSBlock / JSField / JSAction 中加载第三方库而无需打包。

## 类型定义（简化）

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- `url`：ESM 模块地址。默认格式为 `<模块名>@<版本>`（如 `vue@3.4.0`），会由 `ESM_CDN_BASE_URL`（默认 `https://esm.sh`）前缀拼接。也支持完整 URL（如 `https://esm.sh/vue@3.4.0`）。
- 返回值：解析后的模块命名空间对象

## 与 ctx.requireAsync() 的区别

- [ctx.importAsync() 与 ctx.requireAsync()](./import-async-vs-require-async.md)
