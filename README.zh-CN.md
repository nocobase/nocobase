[English](./README.md) | 简体中文
 
![NocoBase](https://nocobase-file.oss-cn-beijing.aliyuncs.com/main-l.png)

**注意:** 📌

NocoBase 正处在早期开发阶段，可能变动频繁，请谨慎用于生产环境。

## 最近重要更新

- [v0.20：支持多数据源 - 2024/03/03](https://docs-cn.nocobase.com/welcome/release/v0200-changelog)
- [v0.19：应用流程优化 - 2024/01/08](https://blog-cn.nocobase.com/posts/release-v019/)
- [v0.18：建立健全的测试体系 - 2023/12/21](https://blog-cn.nocobase.com/posts/release-v018/)
- [v0.17：全新的 SchemaInitializer 和 SchemaSettings - 2023/12/11](https://blog-cn.nocobase.com/posts/release-v017/)
- [v0.16：全新的缓存模块 - 2023/11/20](https://blog-cn.nocobase.com/posts/release-v016/)
- [v0.15：全新的插件设置中心 - 2023/11/13](https://blog-cn.nocobase.com/posts/release-v015/)
- [v0.14：全新的插件管理器，支持通过界面添加插件 - 2023/09/11](https://blog-cn.nocobase.com/posts/release-v014/)
- [v0.13: 全新的应用状态流转 - 2023/08/24](https://blog-cn.nocobase.com/posts/release-v013/)
- [v0.12: 全新的插件构建工具 - 2023/08/01](https://blog-cn.nocobase.com/posts/release-v012/)
- [v0.11: 全新的客户端 Application、Plugin 和 Router - 2023/07/08](https://blog-cn.nocobase.com/posts/release-v011/)

## NocoBase 是什么

NocoBase 是一个极易扩展的开源无代码开发平台。
不必投入几年时间、数百万资金研发，花几分钟时间部署 NocoBase，马上拥有一个私有、可控、极易扩展的无代码开发平台。

中文官网：  
https://cn.nocobase.com/

在线体验：  
https://demo-cn.nocobase.com/new

文档：  
https://docs-cn.nocobase.com/

## 与众不同之处

### 1. 模型驱动，“数据结构”与“使用界面”分离

多数以表单、表格或者流程驱动的无代码产品都是在使用界面上直接创建数据结构，比如 Airtable 在表格里新增一列就是新增一个字段。这样的好处是使用简单，不足是功能和灵活性受限，难以满足较复杂场景的需求。

NocoBase 采用数据结构与使用界面分离的设计思路，可以为数据表创建任意数量、任意形态的区块（数据视图），每个区块里可以定义不同的样式、文案、操作。这样既兼顾了无代码的简单操作，又具备了原生开发的灵活性。

![model](https://nocobase-file.oss-cn-beijing.aliyuncs.com/model-l.png)

### 2. 所见即所得
NocoBase 可以开发复杂和有特色的业务系统，但这并不意味着需要复杂和专业的操作。只需一次点击，就可以在使用界面上显示出配置选项，具备系统配置权限的管理员可以用所见即所得的操作方式，直接配置用户的使用界面。

![wysiwyg](https://nocobase-file.oss-cn-beijing.aliyuncs.com/wysiwyg.gif)

### 3. 功能即插件

NocoBase 采用插件化架构，所有新功能都可以通过开发和安装插件来实现，扩展功能就像在手机上安装 APP 一样简单。

![plugins](https://nocobase-file.oss-cn-beijing.aliyuncs.com/plugins-l.png)

## 安装

NocoBase 支持三种安装方式：

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose">Docker 安装（推荐）</a>

   适合无代码场景，不需要写代码。升级时，下载最新镜像并重启即可。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app">create-nocobase-app 安装</a>

   项目的业务代码完全独立，支持低代码开发。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone">Git 源码安装</a>

   如果你想体验最新未发布版本，或者想参与贡献，需要在源码上进行修改、调试，建议选择这种安装方式，对开发技术水平要求较高，如果代码有更新，可以走 git 流程拉取最新代码。

## 协议

- [内核](https://github.com/nocobase/nocobase/tree/main/packages/core) 采用 [Apache 2.0 协议](./LICENSE-APACHE-2.0)；
- [插件](https://github.com/nocobase/nocobase/tree/main/packages/plugins) 采用 [AGPL 3.0 协议](./LICENSE-AGPL)。
