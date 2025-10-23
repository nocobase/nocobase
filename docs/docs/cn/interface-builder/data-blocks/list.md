# 列表区块

## 介绍

列表区块以列表形式展示数据，适用于任务列表、新闻资讯、产品信息等数据展示场景。

## 添加区块

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240417224417.mp4" type="video/mp4">
</video>

## 区块配置项

![20240417224539](https://static-docs.nocobase.com/20240417224539.png)

### 设置数据范围

如图：默认筛选订单状态为退款的单据

![20240417224701](https://static-docs.nocobase.com/20240417224701.png)

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 设置排序规则

如图：按订单金额大小倒序排序

![20240417225302](https://static-docs.nocobase.com/20240417225302.png)

更多内容参考 [设置排序规则](/handbook/ui/blocks/block-settings/sorting-rule)

### 设置数据加载方式

通常与筛选区块搭配使用，实现筛选时才加载数据

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240417225539.mp4" type="video/mp4">
</video>

更多内容参考 [设置数据加载方式](/handbook/ui/blocks/block-settings/loading-mode)

### 设置区块高度

示例：设置订单列表区块高度为「全高」模式。

![20240604233102](https://static-docs.nocobase.com/20240604233102.gif)

更多内容参考 [区块高度](/handbook/ui/blocks/block-settings/block-height)

- [编辑区块标题](/handbook/ui/blocks/block-settings/block-title)
- [保存为区块模板](/handbook/block-template)

## 配置字段

### 本表字段

![20240417230027](https://static-docs.nocobase.com/20240417230027.png)

### 关系表字段

![20240417230115](https://static-docs.nocobase.com/20240417230115.png)

列表字段配置项可参考 [详情字段](/handbook/ui/fields/generic/detail-form-item)

## 配置操作

### 全局操作

![20240421115811](https://static-docs.nocobase.com/20240421115811.png)

- [筛选](/handbook/ui/actions/types/filter)
- [添加](/handbook/ui/actions/types/add-new)
- [刷新](/handbook/ui/actions/types/refresh)
- [导入](/handbook/action-import)
- [导出](/handbook/action-export)

### 行操作

![20240418114424](https://static-docs.nocobase.com/20240418114424.png)

- [查看](/handbook/ui/actions/types/view)
- [编辑](/handbook/ui/actions/types/edit)
- [删除](/handbook/ui/actions/types/delete)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [更新记录](/handbook/ui/actions/types/update-record)
- [自定义请求](/handbook/action-custom-request)
