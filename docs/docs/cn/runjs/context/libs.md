# ctx.libs

RunJS 内置的库集合，可直接在 RunJS 中使用。推荐在 JSX 渲染（`ctx.render`）或配合 `ctx.element` 做自定义渲染时使用，而不是原生 HTML 元素。

常见子属性示例：

- `ctx.libs.antd`：Ant Design 组件库（Button、Card、Table、Form、Input、Modal、Space / Row / Col 等）
- 其他内置库（如 dayjs、lodash、echarts 等）视运行环境而定

详见各子模块文档。
