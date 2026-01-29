# ctx.importAsync()

按 URL 动态导入 ESM 模块（开发/生产均可用）。适合在 JSBlock / JSField / JSAction 中引入第三方库，而无需预先打包。

## 类型定义（简化）

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- `url`：ESM 模块地址，默认格式为 `<module-name>@<version>`（如 `vue@3.4.0`），会自动拼接 `NPM_MODULE_BASE_URL` 前缀（默认 `https://esm.sh`）；也支持完整 URL（如 `https://esm.sh/vue@3.4.0`）
- 返回值：解析后的模块命名空间对象

## 使用示例

- [按 URL 导入 ESM 模块](./import-esm.md)
- [使用 importAsync 加载 FullCalendar ESM 模块](./import-async-fullcalendar.md)
- [使用 importAsync 加载 Tabulator 表格库](./import-async-tabulator.md)
- [使用 importAsync 加载 ECharts 图表库](./import-async-echarts.md)
- [使用 importAsync 加载 frappe-gantt 甘特图组件](./import-async-frappe-gantt.md)

## 与 ctx.requireAsync() 的区别

- [ctx.importAsync() vs ctx.requireAsync()](./import-async-vs-require-async.md)
