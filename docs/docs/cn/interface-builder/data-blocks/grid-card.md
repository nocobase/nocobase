# 网格卡片

## 介绍

网格卡片区块以卡片形式展示数据记录的摘要信息，支持根据不同屏幕尺寸配置列数，以确保在不同尺寸的设备上友好显示。


## 区块配置项

![20240419220708](https://static-docs.nocobase.com/20240419220708.png)

### 数据范围

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419173617.mp4" type="video/mp4">
</video>

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 设置一行展示的列数

![20240408160228](https://static-docs.nocobase.com/20240408160228.png)

支持为不同屏幕尺寸配置列数。

![20240408160844](https://static-docs.nocobase.com/20240408160844.png)

### 设置数据加载方式

示例：连接数据区块+设置数据加载方式。

订单表和商品表是多对多的关系，订单表格区块和商品网格卡片区块实现数据筛选联动，同时设置网格区块数据加载方式为“筛选数据后”。

<video width="100%" height="440" controls>
<source src="https://static-docs.nocobase.com/20240419175643.mp4" type="video/mp4">
</video>


## 配置字段

### 本表字段

![20240418123118](https://static-docs.nocobase.com/20240418123118.png)

### 关系表字段

![20240418123147](https://static-docs.nocobase.com/20240418123147.png)

网格卡片区块字段配置项可参考 [详情字段](/handbook/ui/fields/generic/detail-form-item)

## 配置操作

### 全局操作

![20240418122905](https://static-docs.nocobase.com/20240418122905.png)

- [筛选](/handbook/ui/actions/types/filter)
- [添加](/handbook/ui/actions/types/add-new)
- [删除](/handbook/ui/actions/types/delete)
- [刷新](/handbook/ui/actions/types/refresh)
- [导入](/handbook/action-import)
- [导出](/handbook/action-export)

### 行操作

![20240419222251](https://static-docs.nocobase.com/20240419222251.png)

- [编辑](/handbook/ui/actions/types/edit)
- [删除](/handbook/ui/actions/types/delete)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [触发工作流](/handbook/workflow/manual/triggers/custom-action)
