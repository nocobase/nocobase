English | [中文](./README.zh-CN.md)

> 当前主题功能是在 antd 5.x 版本的基础上实现的，所以在阅读本文之前最好先阅读一下[定制主题](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98)相关的概念。

## 介绍

目前支持编辑全局范围的 [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken)、[MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken)、[AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken)，和支持[切换](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95)为 `暗黑模式` 和 `紧凑模式`。后期有可能会支持[组件级别](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token)的主题定制。

## 如何使用

### 1、启用主题插件

首先把 NocoBase 更新到最新版本，然后会在[插件管理页面](http://localhost:13000/admin/pm/list/local/)看到 `theme-editor` 的卡片，点击卡片右下角的 `启用` 按钮等待页面刷新。

<a href="https://sm.ms/image/EkiMxUpngzAb8yo" target="_blank"><img src="https://s2.loli.net/2023/07/19/EkiMxUpngzAb8yo.png" height="400" style="object-fit: contain;"></a>

### 2、跳转到主题配置页面

启用之后点击卡片左下角的设置按钮，会跳转到主题编辑页面。默认会有三个主题选项，分别是 `antd 的默认主题`、`暗黑主题` 和 `紧凑主题`。

<a href="https://sm.ms/image/EGXaztphIqRcxgB" target="_blank"><img src="https://s2.loli.net/2023/07/19/EGXaztphIqRcxgB.png" height="400" style="object-fit: contain;"></a>

## 新增一个主题

点击 `添加新主题` 按钮，选择 `新增一个全新的主题`，然后会在页面右侧弹出一个 `主题编辑器`，支持编辑 `颜色`、`尺寸`、`风格`等。编辑好之后输入主题名称然后点击保存即可完成主题的新增。

<a href="https://sm.ms/image/ksxKVAG9ltgFEXo" target="_blank"><img src="https://s2.loli.net/2023/07/19/ksxKVAG9ltgFEXo.png" height="400" style="object-fit: contain;"></a>

## 应用新主题

可以把鼠标移到页面右上角，可以看到一个主题切换项，点击可以切换到其他主题，比如可以切换刚才新增的主题。

<a href="https://sm.ms/image/5I8F9dY4chPltZD" target="_blank"><img src="https://s2.loli.net/2023/07/19/5I8F9dY4chPltZD.png" height="400" style="object-fit: contain;"></a>

## 编辑已经存在的主题

点击卡片左下角的 `编辑` 按钮，如同新增主题一样，会在页面右侧弹出一个 `主题编辑器`，编辑好之后点击保存即可完成主题的编辑。

## 用户切换主题时的可选项

新添加的主题默认是允许非管理员用户切换的，如果不想让非管理员用户切换某个主题，可以关闭主题卡片右下角的 `可被用户选择` 开关，这样用户就无法切换到该主题了。

<a href="https://sm.ms/image/aNOo3n1hzMJkFfv" target="_blank"><img src="https://s2.loli.net/2023/07/19/aNOo3n1hzMJkFfv.png" height="400" style="object-fit: contain;"></a>

## 设置为默认主题（默认主题不可删除）

在初始状态下，默认主题是 `antd 的默认主题`，如果想把某个主题设置为默认主题，可以开启卡片右下角的 `默认主题` 开关，这样当新用户第一次打开页面时应用的就是该默认主题。

<a href="https://sm.ms/image/thZGqcmnJz5gwrY" target="_blank"><img src="https://s2.loli.net/2023/07/19/thZGqcmnJz5gwrY.png" height="400" style="object-fit: contain;"></a>

## 删除主题

点击卡片下方的 `删除` 按钮，然后点击弹出的确认按钮即可删除主题。

<a href="https://sm.ms/image/jAyfnuMNO1vzcB4" target="_blank"><img src="https://s2.loli.net/2023/07/19/jAyfnuMNO1vzcB4.png" height="400" style="object-fit: contain;"></a>
