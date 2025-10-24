# 区块联动规则

> **注意**: 该功能**从v1.7.0-beta.24版本起支持**

## 介绍

区块联动规则允许用户动态控制区块的显示，从区块层面整体管理元素的展示。区块作为字段和操作按钮的载体，通过这些规则，用户可以从区块维度灵活控制整个视图的显示。

![20250427140619](https://static-docs.nocobase.com/20250427140619.png)

![20250427144259](https://static-docs.nocobase.com/20250427144259.png)

> **注意**: 在执行区块联动规则之前，区块的显示首先需要经过 **ACL 权限判断**，只有当用户具备相应的访问权限时，才能进入区块联动规则的判断逻辑。换句话说，区块联动规则仅在满足 ACL 查看权限要求后生效，无区块联动规则时区块默认显示。

### 全局变量控制区块

区块联动规则支持通过全局变量来控制区块的展示内容。例如，不同角色对同一订单表具有查看权限，但每个角色的查看内容可以具有个性化和差异化，可以根据不同角色的权限配置区块展示的字段和操作按钮从而实现灵活的数据展示和操作权限控制。

#### 客服角色（Customer Service）

- **数据范围**：仅限查看订单状态为待发货的订单，隐藏支付信息、折扣客户信息等敏感数据。
- **可操作的按钮**：
  - 查看订单详情
  - 处理退换货
  - 生成退款请求
- **可查看字段**：OrderNumber, OrderDate, OrderStatus, shippingAddress（不包括 totalAmount, Discount, Customers 等敏感字段）。

  ![20250427141800](https://static-docs.nocobase.com/20250427141800.png)

#### 财务角色（Finance）

- **数据范围**：仅限查看订单状态为已付款或退款中的订单，不需要查看商品详情和客户信息。
- **可操作的按钮**：
  - 审核退款
  - 生成发票
- **可查看字段**：OrderNumber, OrderDate, OrderStatus, shippingAddress, totalAmount（不包括 items, Customers 等敏感字段）。

  ![20250427142420](https://static-docs.nocobase.com/20250427142420.png)

### 上下文变量控制区块

区块还可以通过上下文中的变量来控制其显示。例如，可以使用「当前记录」、「当前表单」、「当前弹窗记录」等上下文变量来动态显示或隐藏区块。

示例：仅订单的状态为「已发货」，才显示“发货信息”区块。

![20250427143707](https://static-docs.nocobase.com/20250427143707.png)

![20250427143951](https://static-docs.nocobase.com/20250427143951.png)

### 区块中的 Markdown

示例： 详情区块中配置 Markdown 显示运单信息。
![20250427150236](https://static-docs.nocobase.com/20250427150236.png)

![20250427150308](https://static-docs.nocobase.com/20250427150308.png)
订单状态为「已发货」才显示 Markdown 信息
![20250427150341](https://static-docs.nocobase.com/20250427150341.png)

效果如下：
<video width="100%" height="440" controls>
  <source src="https://static-docs.nocobase.com/20250427150738.mp4" type="video/mp4">
</video>

更多联动规则说明参考 [联动规则](/handbook/ui/linkage-rule)
