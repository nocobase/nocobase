---
nav:
  path: /client
group:
  path: /client
---

# SchemaInitializer

用于配置各种 schema 的初始化

```tsx | pure
const actions = {
  // 表单可选操作
  FormAction: [],
  // 抽屉表单可选操作
  DrawerFormAction: [],
  // 对话框表单可选操作
  ModalFormAction: [],
  // 详情区块可选操作
  DetailsAction: [],
  // 表格区块可选操作
  TableAction: [],
  // 表格行可选操作
  TableRowAction: [],
  // 日历可选操作
  CalendarAction: [],
};

const blocks = {
  // 普通页面可添加区块
  Block: [],
  // 当前数据页面可添加区块
  RecordBlock: [],
  // 可添加的表单项
  FormItem: [],
  // 可添加的表格列
  TableColumn: [],
};

const initializer = new SchemaInitializer({ actions, blocks });

initializer.addActionSchema({});
initializer.addBlockSchema({});

<SchemaInitializerProvider initializer={initializer}>
</SchemaInitializerProvider>
```
