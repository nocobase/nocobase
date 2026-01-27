# Markdown 区块

## 介绍

Markdown 区块无需绑定数据源使用，使用 Markdown 语法定义文本内容，可用于显示格式化的文本内容。

## 添加区块

可以在页面或弹窗里添加 Markdown 区块

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

也可以在表单区块和详情区块里添加内联（inline-block）的 Markdown 区块

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## 模板引擎

使用  **[Liquid 模板引擎](https://liquidjs.com/tags/overview.html)**，提供强大且灵活的模板渲染能力，使内容能够动态生成和定制化展示。通过模板引擎，你可以：

- **动态插值**：在模板中使用占位符引用变量，例如 `{{ ctx.user.userName }}` 自动替换为对应的用户名称。
- **条件渲染**：支持条件语句（`{% if %}...{% else %}`），根据不同的数据状态显示不同内容。
- **循环遍历**：使用 `{% for item in list %}...{% endfor %}` 遍历数组或集合，生成列表、表格或重复模块。
- **内置过滤器**：提供丰富的过滤器（如 `upcase`、`downcase`、`date`、`truncate` 等），可对数据进行格式化和处理。
- **可扩展性**：支持自定义变量和函数，使模板逻辑可复用、可维护。
- **安全与隔离**：模板渲染在沙箱环境中执行，避免直接运行危险代码，提高安全性。

借助 Liquid 模板引擎，开发者和内容创作者可以**轻松实现动态内容展示、个性化文档生成、以及复杂数据结构的模板渲染**，大大提升效率和灵活性。


## 使用变量

在页面中的 Markdown 支持通用的系统变量（如当前用户、当前角色等）。

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

而在区块行操作弹窗（或子页面）中的 Markdown，则支持更多的数据上下文变量（如当前记录、当前弹窗记录等）。

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

<!-- ## 本地化

内置了`t` 过滤器，支持本地化翻译文案。

> 注意：文案需要提前录入本地化表中，未来将优化为支持自定义生成本地化词条。

![20251026223542](https://static-docs.nocobase.com/20251026223542.png) -->

## 二维码

Markdown 里支持配置二维码

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```
