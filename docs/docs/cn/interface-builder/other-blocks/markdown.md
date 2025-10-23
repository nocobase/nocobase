# Markdown 区块

## 介绍

Markdown 区块无需绑定数据源使用，使用 Markdown 语法定义文本内容，可用于显示格式化的文本内容。

## 添加区块

可以在页面或弹窗里添加 Markdown 区块

![20240612205004](https://static-docs.nocobase.com/20240612205004.png)

也可以在表单区块和详情区块里添加内联（inline-block）的 Markdown 区块

![20240612205215](https://static-docs.nocobase.com/20240612205215.png)

## 模板引擎

### 字符串模板

使用 `{{xxx}}` 来进行插值

![20240817175031](https://static-docs.nocobase.com/20240817175031.png)

### Handlebars 模板

支持使用条件、循环等丰富的语法动态生成 HTML 内容。

![20240817175355](https://static-docs.nocobase.com/20240817175355.png)

![20240817175501](https://static-docs.nocobase.com/20240817175501.png)

更多内容参考 [Handlebars 模板引擎](/handbook/template-handlebars)

## 使用变量

不同位置的 Markdown 支持的变量不同。

在页面中的 Markdown 支持通用的系统变量（如当前用户、当前角色、日期等）。

![20240612205857](https://static-docs.nocobase.com/20240612205857.png)

而在区块行操作弹窗（或子页面）中的 Markdown，则支持更多的数据上下文变量（如当前记录、当前弹窗记录等）。

![20240612210333](https://static-docs.nocobase.com/20240612210333.png)

### 变量中的关系数据

以订单/发货单（一对一）为例:

使用「当前弹窗记录」变量在详情操作弹窗的 Markdown 区块中展示当前订单关联的运单发货号。

#### 字符串模板会自动处理关系数据（自动加载所需的关系数据）

![20241210165519](https://static-docs.nocobase.com/20241210165519.png)

效果如下:

![20241210165541](https://static-docs.nocobase.com/20241210165541.png)

#### Handlebars 目前不支持关系数据的预加载，用户需要在数据区块中显式配置相应的关系字段，以便在渲染时获取相关数据。

![20241210165625](https://static-docs.nocobase.com/20241210165625.png)

在订单表格区块中配置「发货单」关系字段后，详情操作中的 Markdown 区块（使用 Handlebars）才能获取到该关系数据并进行渲染。

![20241210165655](https://static-docs.nocobase.com/20241210165655.png)

### 语法规则

两种模版除了关系预加载上的差异，还有语法规则的差异，如在使用包含对多关系的变量时，获取到的数据通常是一个数组，两种模板在处理数组类型数据也有所不同。

以订单/商品（多对多）为例

使用「当前弹窗记录」变量在详情操作弹窗的 Markdown 区块中展示当前订单关联的商品数据名称（多个）。

#### 字符串模板将数组用","分割显示。

![20241210170508](https://static-docs.nocobase.com/20241210170508.png)

效果如下:
![20241210170545](https://static-docs.nocobase.com/20241210170545.png)

#### Handlebars 模板遍历数组数据需要使用 `#each`

![20241210205357](https://static-docs.nocobase.com/20241210205357.png)

同时需要将用到的关系数据在数据区块中配置出来。

![20241210170814](https://static-docs.nocobase.com/20241210170814.png)

```javascript

<ul>
  {{#each   $nPopupRecord.products }}
    <li>{{this.product_name}}</li>
  {{/each}}
</ul>
```

更多变量的介绍查看 [配置界面 / 变量](/handbook/ui/variables) 章节

## 本地化
>  v1.8.0 及以上版本支持。

Markdown 内容现已支持本地化，可使用 `{{t 'xxx'}}` 语法插入多语言文本(需先启用本地化插件)，并在本地化管理中配置对应译文。

![20250707154720](https://static-docs.nocobase.com/20250707154720.png)

在本地化管理中对词条进行翻译,配置后需要发布。

![20250707154933](https://static-docs.nocobase.com/20250707154933.png)

![20250707155049](https://static-docs.nocobase.com/20250707155049.png)

![20250707155236](https://static-docs.nocobase.com/20250707155236.gif)
## 二维码

Markdown 里支持配置二维码，可以结合变量使用。

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```

## RoadMap

- 计划或进行中
  - Handlebars 支持关系预加载
