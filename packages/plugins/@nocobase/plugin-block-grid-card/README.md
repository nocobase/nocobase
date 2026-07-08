# NocoBase

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/4d11a87b-00e2-48f3-9bf7-389d21072d13" type="video/mp4">
</video>

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## What is NocoBase

NocoBase is the most extensible AI-powered no-code platform.   
Total control. Infinite extensibility. AI collaboration.  
Enable your team to adapt quickly and cut costs dramatically.  
No years of development. No millions wasted.  
Deploy NocoBase in minutes — and take control of everything.

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/

Use Cases:  
https://www.nocobase.com/en/blog/tags/customer-stories

## Release Notes

Our [blog](https://www.nocobase.com/en/blog/timeline) is regularly updated with release notes and provides a weekly summary.

## Distinctive features

### 1. Data model-driven, not form/table–driven

Instead of being constrained by forms or tables, NocoBase adopts a data model–driven approach, separating data structure from user interface to unlock unlimited possibilities.

- UI and data structure are fully decoupled
- Multiple blocks and actions can be created for the same table or record in any quantity or form
- Supports the main database, external databases, and third-party APIs as data sources

![model](https://static-docs.nocobase.com/model.png)

### 2. AI employees, integrated into your business systems
Unlike standalone AI demos, NocoBase allows you to embed AI capabilities seamlessly into your interfaces, workflows, and data context, making AI truly useful in real business scenarios.

- Define AI employees for roles such as translator, analyst, researcher, or assistant
- Seamless AI–human collaboration in interfaces and workflows
- Ensure AI usage is secure, transparent, and customizable for your business needs

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

### 3. What you see is what you get, incredibly easy to use

While enabling the development of complex business systems, NocoBase keeps the experience simple and intuitive.

- One-click switch between usage mode and configuration mode
- Pages serve as a canvas to arrange blocks and actions, similar to Notion
- Configuration mode is designed for ordinary users, not just programmers

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 4. Everything is a plugin, designed for extension
Adding more no-code features will never cover every business case. NocoBase is built for extension through its plugin-based microkernel architecture.

- All functionalities are plugins, similar to WordPress
- Plugins are ready to use upon installation
- Pages, blocks, actions, APIs, and data sources can all be extended through custom plugins

![plugins](https://static-docs.nocobase.com/plugins.png)

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Installing With Docker (👍Recommended)</a>

  Suitable for no-code scenarios, no code to write. When upgrading, just download the latest image and reboot.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Installing from create-nocobase-app CLI</a>

  The business code of the project is completely independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Installing from Git source code</a>

  If you want to experience the latest unreleased version, or want to participate in the contribution, you need to make changes and debug on the source code, it is recommended to choose this installation method, which requires a high level of development skills, and if the code has been updated, you can git pull the latest code.

## How NocoBase works

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/8d183b44-9bb5-4792-b08f-bc08fe8dfaaf" type="video/mp4">
</video>

## 总览

本包覆盖网格卡片区块在页面中的创建、卡片内容配置、区块操作、卡片记录操作与区块设置能力。E2E 用例使用 NocoBase Playwright fixtures 创建临时页面和数据，验证用户在配置模式下可完成真实区块配置，并断言页面中产生对应可见结果。

## 用例大纲

- 网格卡片区块创建
  - 页面中添加网格卡片区块
- 网格卡片内容配置
  - 配置集合字段
  - 配置关联字段
  - 配置 Markdown 内容
- 网格卡片区块操作
  - 配置筛选、新增和刷新等区块全局操作
- 网格卡片记录操作
  - 配置查看、编辑和删除等卡片记录操作
  - 配置弹窗和更新记录等自定义卡片记录操作
- 网格卡片布局配置
  - 区块设置菜单
  - 配置桌面端单行显示列数

## 用例清单

### 1. create grid card block on a page

- 编号：1
- 功能：验证页面 Add block 入口可以创建 Grid Card 区块，并在页面中显示网格卡片区块容器。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaInitializer.test.ts`
- 执行步骤与断言：创建临时页面；通过页面 Add block 入口选择 `Grid Card`；断言 `users` 集合的 Grid Card 区块可见。
- 清理：由 `mockPage` fixture 清理临时页面和 schema。

### 2. configure grid card fields and markdown content

- 编号：2
- 功能：验证 Grid Card 卡片内容可以配置集合字段、关联字段和 Markdown 内容，并可移除已配置字段。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaInitializer.test.ts`
- 执行步骤与断言：创建带记录的 Grid Card 临时页面；通过卡片字段配置入口添加 `ID` 字段和 `Many to one / Nickname` 关联字段；断言字段在卡片中可见；再次点击字段开关移除字段；断言字段不可见；添加 Markdown 内容；断言 Markdown 区块可见。
- 清理：由 `mockPage` 和 `mockRecord` fixtures 清理临时页面、schema 和测试记录。

### 3. configure grid card collection actions

- 编号：3
- 功能：验证 Grid Card 区块可以配置区块级操作，并且删除后操作入口从页面消失。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaInitializer.test.ts`
- 执行步骤与断言：打开空 Grid Card 区块页面；通过区块操作配置入口依次添加 `Filter`、`Add new`、`Refresh`；断言三个按钮可见；再通过各按钮设置菜单删除；断言三个按钮不可见。
- 清理：由 `mockPage` fixture 清理临时页面和 schema。

### 4. configure grid card record actions

- 编号：4
- 功能：验证 Grid Card 卡片内可以配置记录级操作，并且删除后记录操作从卡片中消失。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaInitializer.test.ts`
- 执行步骤与断言：创建带记录的 Grid Card 临时页面；通过卡片操作配置入口添加 `View`、`Edit`、`Delete`；断言三个记录操作在卡片中可见；再删除三个操作；断言三个记录操作不可见。
- 清理：由 `mockPage` 和 `mockRecord` fixtures 清理临时页面、schema 和测试记录。

### 5. configure grid card custom record actions

- 编号：5
- 功能：验证 Grid Card 卡片内可以配置弹窗和更新记录等自定义记录操作。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaInitializer.test.ts`
- 执行步骤与断言：创建带记录的 Grid Card 临时页面；通过卡片操作配置入口添加 `Popup` 和 `Update record`；断言两个自定义记录操作在卡片中可见。
- 清理：由 `mockPage` 和 `mockRecord` fixtures 清理临时页面、schema 和测试记录。

### 6. show grid card block settings options

- 编号：6
- 功能：验证 Grid Card 区块设置菜单提供列数、数据范围、默认排序、分页数量和删除等可配置项。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaSettings.test.ts`
- 执行步骤与断言：打开空 Grid Card 区块页面；悬停区块设置入口；断言设置菜单中显示 `Set the count of columns displayed in a row`、`Set the data scope`、`Set default sorting rules`、`Records per page` 和 `Delete`。
- 清理：由 `mockPage` fixture 清理临时页面和 schema。

### 7. set grid card desktop column count

- 编号：7
- 功能：验证 Grid Card 区块可以配置桌面端单行列数，并影响卡片宽度。
- Spec 文件：`packages/plugins/@nocobase/plugin-block-grid-card/src/client/__e2e__/schemaSettings.test.ts`
- 执行步骤与断言：创建带 10 条记录的 Grid Card 临时页面；记录默认卡片宽度对应 3 列布局；打开区块设置并将桌面端列数改为 2；刷新页面；断言卡片宽度变大并符合 2 列布局范围。
- 清理：由 `mockPage` 和 `mockRecords` fixtures 清理临时页面、schema 和测试记录；列数设置随临时页面删除。
