# 本地化管理

## 介绍

本地化管理插件用于管理和实现 NocoBase 的本地化资源，可对系统的菜单、数据表、字段以及所有插件进行翻译，以适应特定地区的语言和文化。

## 安装

该插件为内置插件，无需额外安装。

## 使用说明

### 激活插件

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### 进入本地化管理页面

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### 同步翻译词条

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

目前支持同步以下内容：

- 系统和插件的本地语言包
- 数据表标题、字段标题和字段选项标签
- 菜单标题

同步完成后，系统会列出当前语言的所有可翻译词条。

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=提示}
不同模块可能存在相同的原文词条，需要分别进行翻译。
:::

### 自动创建词条

页面编辑时，各区块中的自定义文案将自动创建对应词条，并同步生成当前语言的翻译内容。

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=提示}
代码中定义文案时，需手动指定 ns（namespace），如：`${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### 编辑翻译内容

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### 发布翻译

翻译完成后，需要点击"发布"按钮，才能使修改生效。

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### 翻译其他语言

在"系统设置"中启用其他语言，例如简体中文。

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

切换到该语言环境。

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

同步词条。

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

翻译并发布。

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
