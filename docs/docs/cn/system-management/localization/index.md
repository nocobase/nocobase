---
title: '本地化管理'
description: '本地化管理：翻译菜单、数据表、字段、插件文案，同步词条、自动创建词条、编辑翻译、发布翻译，支持多语言切换，内置插件。'
keywords: '本地化管理,翻译,多语言,i18n,词条同步,发布翻译,系统管理,NocoBase'
---

# 本地化管理

## 介绍

本地化管理插件用于管理和实现 NocoBase 的本地化资源，可对系统的菜单、数据表、字段以及所有插件进行翻译，以适应特定地区的语言和文化。

## 使用说明

### 激活插件

![](https://static-docs.nocobase.com/202605121121079.png)

### 进入本地化管理页面

![](https://static-docs.nocobase.com/202605121145721.png)

### 同步翻译词条

![](https://static-docs.nocobase.com/202605121146132.png)

目前支持同步以下内容：

- 系统和插件的本地语言包
- 数据表标题、字段标题和字段选项标签
- 菜单标题

同步完成后，系统会列出当前语言的所有可翻译词条。

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

### 使用 AI 翻译

本地化管理支持通过 AI 员工 Lina 翻译词条。启用 AI 员工和模型服务后，可以在本地化管理页面中使用 AI 翻译能力，为当前语言批量生成译文。

![](https://static-docs.nocobase.com/202605121152196.png)

支持多种翻译方式：

- **全量翻译**：翻译当前语言中需要处理的全部词条。
- **增量翻译**：仅翻译当前语言中尚未填写译文的词条。
- **翻译所选项**：在词条列表中勾选部分词条，只翻译指定内容。

AI 员工翻译会创建后台任务，任务执行过程中可以查看进度。翻译完成后，译文会写入对应语言的翻译内容中，仍需根据实际语境进行检查和校对。

完整使用手册参考：[AI 员工 - Lina](/ai-employees/built-in/lina).

:::warning{title=注意}
AI 生成的译文可能存在语义偏差、术语不一致或上下文理解不足。发布前建议由人工复核重要页面、业务术语和面向最终用户的文案。
:::

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
