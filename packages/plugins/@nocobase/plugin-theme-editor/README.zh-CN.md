[English](./README.md) | 中文

# 主题编辑器

> 当前主题功能是在 antd 5.x 版本的基础上实现的，所以在阅读本文之前最好先阅读一下[定制主题](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98)相关的概念。

## 介绍

可以简单理解为该插件就是用来修改整个前端页面的样式的。目前支持编辑全局范围的 [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken)、[MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken)、[AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken)，和支持[切换](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95)为 `暗黑模式` 和 `紧凑模式`。后期有可能会支持[组件级别](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token)的主题定制。

## 使用说明

### 启用主题插件

首先把 NocoBase 更新到最新版本（v0.11.1 及以上），然后在 `插件管理页面` 搜索 `主题编辑器` 的卡片，点击卡片右下角的 `启用` 按钮等待页面刷新。

![20240409132838](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409132838.png)

### 跳转到主题配置页面

启用之后点击卡片左下角的设置按钮，会跳转到主题编辑页面。默认会有四个主题选项，分别是 `默认主题`、`暗黑主题` 、 `紧凑主题` 和 `紧凑暗黑主题`。

![20240409133020](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133020.png)

## 新增一个主题

点击 `添加新主题` 按钮，选择 `新增一个全新的主题`，然后会在页面右侧弹出一个 `主题编辑器`，支持编辑 `颜色`、`尺寸`、`风格`等。编辑好之后输入主题名称然后点击保存即可完成主题的新增。

![20240409133147](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133147.png)

## 应用新主题

可以把鼠标移到页面右上角，可以看到一个主题切换项，点击可以切换到其他主题，比如可以切换刚才新增的主题。

![20240409133247](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133247.png)

## 编辑已经存在的主题

点击卡片左下角的 `编辑` 按钮，如同新增主题一样，会在页面右侧弹出一个 `主题编辑器`，编辑好之后点击保存即可完成主题的编辑。

![20240409134413](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409134413.png)

## 用户切换主题时的可选项

新添加的主题默认是允许用户切换的，如果不想让用户切换到某个主题，可以关闭主题卡片右下角的 `可被用户选择` 开关，这样用户就无法切换到该主题了。

![20240409133331](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133331.png)

## 设置为默认主题（默认主题不可删除）

在初始状态下，默认主题是 `默认主题`，如果想把某个主题设置为默认主题，可以开启卡片右下角的 `默认主题` 开关，这样当用户第一次打开页面时看到的就是该主题。

![20240409133409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133409.png)

## 删除主题

点击卡片下方的 `删除` 按钮，然后点击弹出的确认按钮即可删除主题。

![20240409133435](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240409133435.png)
