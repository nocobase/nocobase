## 基础用法

模板打印插件提供了多种语法，可以在模板中灵活地插入动态数据和逻辑结构。以下是详细的语法说明和使用示例。

### 基本替换

使用 `{d.xxx}` 格式的占位符进行数据替换。例如：

- `{d.title}`：读取数据集中的 `title` 字段。
- `{d.date}`：读取数据集中的 `date` 字段。

**示例**：

模板内容：
```
尊敬的客户，您好！

感谢您购买我们的产品：{d.productName}。
订单编号：{d.orderId}
订单日期：{d.orderDate}

祝您使用愉快！
```

数据集：
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

渲染结果：
```
尊敬的客户，您好！

感谢您购买我们的产品：智能手表。
订单编号：A123456789
订单日期：2025-01-01

祝您使用愉快！
```

### 访问子对象

若数据集中包含子对象，可以通过点符号访问子对象的属性。

**语法**：`{d.parent.child}`

**示例**：

数据集：
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

模板内容：
```
客户姓名：{d.customer.name}
邮箱地址：{d.customer.contact.email}
联系电话：{d.customer.contact.phone}
```

渲染结果：
```
客户姓名：李雷
邮箱地址：lilei@example.com
联系电话：13800138000
```

### 访问数组

若数据集中包含数组，可使用保留关键字 `i` 来访问数组中的元素。

**语法**：`{d.arrayName[i].field}`

**示例**：

数据集：
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

模板内容：
```
第一个员工姓是 {d.staffs[i=0].lastname}，名是 {d.staffs[i=0].firstname}
```

渲染结果：
```
第一个员工姓是 Anderson，名是 James
```


