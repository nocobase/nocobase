# 字段

在 UI 里，字段即字段组件，是单元数据的载体，不同类型数据以不同字段组件呈现。字段只能附属于区块，不能独立使用。

## 区块里的字段

字段一般不单独使用，而是作为数据类型区块的子元素存在。数据类型的区块通常都有「配置字段」，字段列表由当前数据表提供。

![](https://static-docs.nocobase.com/c5ea18ad1847332fe78075413f23de46.png)

## 字段的设计器（工具栏）

和区块一样，字段组件的右上角也有三个图标，分别为：

- 拖拽布局
- 快捷添加字段
- 字段参数配置

![](https://static-docs.nocobase.com/30cc5fcaeeb171862f79449a72a7fcf9.png)

## 字段的布局

通过拖拽移动可以自定义调整字段在区块中的布局。

![](https://static-docs.nocobase.com/0825ea8c014c9073f505e74f707ded66.gif)

## 字段组件

部分字段支持切换为其他组件，例如：`URL` 组件可以切换为 `Preview` 组件。

![20240806164801](https://static-docs.nocobase.com/20240806164801.png)

如果你需要扩展更多的组件，可以参考 [扩展有值字段组件组件](/plugin-samples/field/value)。
