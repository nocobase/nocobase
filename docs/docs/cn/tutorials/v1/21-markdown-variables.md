# Markdown 模板变量用法

亲爱的小伙伴们，欢迎来到本教程！在这一节中，我们将一步步学习如何利用 Markdown 和 Handlebars 模板引擎实现动态内容展示。之前在《 Markdown 区块的妙用》中，你已了解了基本语法、创建方法及变量填充，接下来让我们深入探讨模板变量的高级用法。

## 1 模板引擎 [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars) 简介

在你创建 Markdown 区块后，右上角的配置中会看到一个“模板引擎”选项，默认即为 Handlebars 。Handlbars 能帮助你根据条件动态呈现页面内容，使 Markdown 也能响应变化。

![模板引擎示意图](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Handlebars 的作用

尽管 Markdown 原生只支持静态内容展示，但通过 Handlebars，你可以依靠条件（如状态、数字或选项）来动态切换展示的文案和样式。这样，即使面对多变的业务场景，你的页面也能时刻更新显示正确的信息。

## 2 实际应用场景

现在，我们来看几个实用的场景，并一步步实现它们的功能。

### 2.1 处理订单状态

在一个在线 Demo 中，我们往往需要根据订单状态来展示不同的提示信息。假设你的订单数据表中有一个状态字段，其状态如下：

![订单状态字段](https://static-docs.nocobase.com/20250304091420.png)

以下是 4 个状态对应的展示内容：


| 选项标签         | 选项值 | 展示内容                                                    |
| ---------------- | ------ | ----------------------------------------------------------- |
| Pending Approval | 1      | 订单已提交，等待内部审核。                                  |
| Pending Payment  | 2      | 等待客户付款。请密切关注订单状态。                          |
| Paid             | 3      | 付款已确认，请进行后续处理。指定顾问将在1小时内与客户联系。 |
| Rejected         | 4      | 订单审批未通过。如有需要，请复查并重新发起。                |

在页面中，我们能够捕获到订单状态的值，进而动态地展示不同信息。下面我们将详细讲解如何使用 if、else 和 else if 语法实现这一功能。

#### 2.1.1 if 语法

使用 if 条件，可以显示符合条件的内容。例如：

```
{{#if 条件}}
  <p>展示结果</p>
{{/if}}
```

此处的“条件”需采用 Handlebars 的语法（如 eq、gt、lt 等）。试试这个简单例子：

```
{{#if (eq 1 1)}}
  <p>展示结果: 1 = 1</p>
{{/if}}
```

效果参考下图：

![if 示例1](https://static-docs.nocobase.com/20250305115416.png)
![if 示例2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 else 语法

当条件不满足时，可以用 else 指定备用内容。例如：

```
{{#if (eq 1 2)}}
  <p>展示结果: 1 = 2</p>
{{else}}
  <p>展示结果：1 ≠ 2</p>
{{/if}}
```

效果如下：

![else 示例](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 多条件判断

若要根据多个条件进行判断，可以使用 else if。示例代码：

```
{{#if (eq 1 7)}}
  <p>展示结果: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>展示结果: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>展示结果: 1 = 4</p>
{{else}}
  <p>展示结果: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

对应效果图：

![多条件判断示例](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 效果展示

配置好订单状态后，页面会根据不同状态动态切换显示。请看下图：

![订单状态动态效果](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

页面中代码如下：

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>订单已提交，等待内部审核。</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>等待客户付款。请密切关注订单状态。</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>付款已确认，请进行后续处理。指定顾问将在1小时内与客户联系。</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>订单审批未通过。如有需要，请复查并重新发起。</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">当前无待处理订单。</p>
{{/if}}
```

试着切换订单状态，观察页面内容是否随之更新，验证你的代码是否正确。

### 2.3 展示订单明细

除了订单状态展示，订单明细（如商品详情列表）也是常见需求。下面，我们利用 each 语法来实现该功能。

#### 2.3.1 each 语法基本介绍

each 用于循环遍历列表。例如，对于数组 [1,2,3]，你可以这样写：

```
{{#each 列表}}
  <p>展示结果：{{this}}</p>
  <p>索引：{{@index}}</p>
{{/each}}
```

在循环中，{{this}} 表示当前元素，{{@index}} 表示当前索引。

#### 2.3.2 商品明细示例

假如你需要展示订单中的所有商品信息，可以使用下面的代码：

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

如果发现页面未出现数据，请确保订单明细字段已被正确展示，否则系统会认为这部分数据为冗余信息而不作查询。
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

你可能会发现 商品对象的名称 ( product.name ) 没有打印出来，和上面的原因一样，我们需要把商品对象也展示出来才行
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

展示出来后，我们在联动规则设置隐藏这个关联字段
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 最终成品：订单商品列表

完成上述步骤后，你将实现一个完整的订单商品列表展示模板。请参考以下代码：

```
### 订单商品列表

{{#if $nRecord.order_items}}
  <div class="cart-summary">总计: {{$nRecord.order_items.length}} 件商品，总价格: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>序号</th>
        <th>商品名称</th>
        <th>单价</th>
        <th>数量</th>
        <th>小计</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>缺货</span>
            {{else if this.low_stock}}
              <span style="color:orange;">库存紧张</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>订单为空</p>
{{/if}}
```

运行后，你会看到如下效果：

![订单商品列表效果](https://static-docs.nocobase.com/20250305124125.png)

为了更好地展示 Handlebars 的灵活性，我们在订单详情中添加了“缺货”（out_of_stock）和“库存紧张”（low_stock）字段：

- 当 out_of_stock 为 true 时，会显示“缺货”，且商品条目变为红色。
- 当 low_stock 为 true 时，右侧提示“库存紧张”并采用橙色显示。

![额外效果：缺货与库存紧张](https://static-docs.nocobase.com/20250305130258.png)

## 3 总结与建议

通过以上讲解，你已学会如何利用 Handlebars 实现 Markdown 模板的动态渲染，包括 if/else 条件、each 循环等核心语法。在实际开发中，对于更复杂的逻辑，建议结合联动规则、计算字段、工作流或 script 节点来提升灵活性和扩展性。

希望你能通过练习掌握这些技巧，并在项目中灵活应用。继续努力，探索更多可能性吧！

---

若在操作过程中遇到任何问题，欢迎前往 [NocoBase 社区](https://forum.nocobase.com)交流或查阅[官方文档](https://docs-cn.nocobase.com)。希望本指南能帮助您根据实际需求顺利实现用户注册审核，并根据需要灵活扩展。祝您使用顺利，项目成功！
