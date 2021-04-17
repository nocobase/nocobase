---
title: '@nocobase/blocks'
order: 6
---

# @nocobase/blocks <Badge>未实现</Badge>

<Alert title="注意" type="warning">

因为前端代码的打包还有许多细节问题，核心代码暂时也都放在 @nocobase/app 里了。

v0.4 版本 components 分为了 Action、Field、View 三部分，下一把版本打算都整合到 Block 里。

</Alert>

在 NocoBase 中，区块是所有 HTML 元素片段（包括 React/Vue 等框架的自定义元素）的总称。区块可以任意组合或嵌套，为了方便使用，内置了常用的一些区块，大致分类有：

- Database - 数据
- Fields - 字段
- Buttons - 按钮
- Media - 多媒体
- Design - 设计
- 自定义区块

## Database - 数据

数据类型的区块需要绑定数据源。

### table
### form
### descriptions
### calendar
### kanban

## Fields - 字段

字段是一种特殊的子区块，只用于数据类型区块中，有两种形态：静态纯展示和动态可输入。

### boolean
### checkbox
### cascader
### time
### markdown
### string
### icon
### textarea
### number
### remoteSelect
### drawerSelect
### colorSelect
### subTable
### icon

## Buttons - 按钮

### create
### update
### destroy
### filter
### print
### export
### button

## Media - 多媒体

### markdown

## Design - 设计

### grid
### drawer
### page

## 自定义区块
