# 表单区块

## 介绍

表单区块是用于构建数据输入和编辑界面的重要区块。它具有高度的定制性，基于数据模型来使用相应的组件显示所需的字段。通过联动规则等事件流，表单区块可以动态展示字段。此外，还可以与工作流程结合，实现自动化流程触发和数据处理，进一步提高工作效率或实现逻辑编排。

## 添加表单区块

- **编辑表单**：用于修改已有数据。
- **新增表单**：用于创建新的数据条目。

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## 区块配置项

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

<!-- ![20240416220148](https://static-docs.nocobase.com/20240416220148.png) -->

### 区块联动规则

通过联动规则控制区块行为（如是否显示或执行javaScript）。

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

更多内容参考 [联动规则](/interface-builder/linkage-rule)

### 字段联动规则

通过联动规则控制表单字段行为。

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

更多内容参考 [联动规则](/interface-builder/linkage-rule)

### 布局

表单区块支持两种布局方式，通过 `layout` 属性进行设置：

- **horizontal**（水平布局）：标签和字段在同一行排列，适合字段较少、表单较宽的场景。
- **vertical**（垂直布局）：标签在字段上方排列，适合字段较多或需要多行显示的表单。

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## 配置字段

### 本表字段

> **注意**：继承表中的字段（即父表字段）会自动合并显示在当前字段列表中。

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### 其他字段

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- 编写 javaScript 可以实现自定义显示内容，实现复杂内容的展示。

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## 配置操作

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [提交](/interface-builder/actions/types/submit)
- [触发工作流](/interface-builder/actions/types/trigger-workflow)
- [JS action ](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)
