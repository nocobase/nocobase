---
pkg: "@nocobase/plugin-calendar"
---

# 日历区块

## 介绍

日历区块以日历视图显示事件和日期相关的数据，适用于会议安排、活动计划等场景。

## 安装

内置插件，无需安装。

## 添加区块

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. 标题字段: 用于显示在日历条形上的信息；目前支持`input`, `select`, `phone`, `email`, `radioGroup`,`sequence` 类等型字段,可以通过插件扩展日历区块支持的标题字段类型。
2. 开始时间: 任务的开始时间；
3. 结束时间: 任务的结束时间；

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


点击任务条,同一任务条高亮，并弹出弹窗。

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## 区块配置项

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### 展示农历

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### 设置数据范围

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

更多内容参考 

### 设置区块高度

示例：调整订单日历区块高度,日历区块内部不会出现滚动条。

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

更多内容参考 

### 背景颜色字段

:::info{title=提示}
需要 NocoBase 的版本是 v1.4.0-beta 及以上。
:::

该选项可以用来配置日历事件的背景颜色。使用方法如下：

1. 日历数据表中需要有一个**下拉单选（Single select）**或者**单选框（Radio group）**类型的字段，该字段需要配置上颜色。
2. 然后，回到日历区块的配置界面，在**背景颜色字段**中选择刚刚配置上颜色的字段。
3. 最后，可以试一下给一个日历事件选中一个颜色，然后点击提交，就可以看到颜色已经生效了。

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### 周起始日

> v1.7.7 及以上版本支持 

日历区块支持设置每周的起始日，可选择 **周日** 或 **周一** 作为一周的第一天。  
默认起始日为 **周一**，方便用户根据不同地区的习惯调整日历显示，更贴合实际使用需求。

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## 配置操作

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### 今天

日历区块的"今天"按钮提供了便捷的导航功能，允许用户在翻页到其他日期后快速返回到当前日期所在的日历页。

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### 切换视图

默认是月

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
