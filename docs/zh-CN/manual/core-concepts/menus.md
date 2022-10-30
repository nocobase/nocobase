# 菜单

目前 NocoBase 支持三种类型的菜单项：

- 页面：跳转至菜单关联的 NocoBase 的内容页面；
- 分组：对菜单进行分组，将同类菜单放到统一的位置；
- 链接：跳转至指定的 URL；

以仓储系统为例，如果你的业务里有储位管理，储位管理里又包含出入库日志、库存查询、跳转 ERP 申请储位等功能。那么可以这样设置菜单：

```
- 储位管理（分组）
    - 库存查询（页面）
    - 出入库日志（页面）
    - 跳转ERP申请储位（链接）
```

## 默认位置

在 NocoBase 内置的页面模板中，菜单会出现在顶部和左侧。

![menu-position.jpg](./menus/menu-position.jpg)

## 添加

![5.menu-add.jpg](./menus/5.menu-add.jpg)

点击 Add menu item，选择添加的类型。支持无限级子菜单。

## 配置和排序

将光标移到菜单项上，右上角会出现排序和配置按钮。按住排序按钮，可以拖拽排序。

对菜单项可操作的配置：

- Edit
- Move to
- Insert before
- Insert after
- Insert Inner
- Delete

![menu-move.gif](./menus/menu-move.gif)