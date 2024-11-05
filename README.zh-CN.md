[English](./README.md) | 简体中文 | [日本語](./README.ja-JP.md)
 
https://github.com/nocobase/nocobase/assets/1267426/29623e45-9a48-4598-bb9e-9dd173ade553

## 感谢支持
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## 最近重要更新
- [v1.3：REST API 数据源、移动端 V2 和更多功能 - 2024/08/29](https://www.nocobase.com/cn/blog/nocobase-1-3)
- [v1.0.1-alpha.1：区块支持高度设置 - 2024/06/07](https://www.nocobase.com/cn/blog/release-v101-alpha1)
- [v1.0.0-alpha.15：新增插件、改进「配置操作」交互 - 2024/05/19](https://www.nocobase.com/cn/blog/release-v100-alpha15)
- [v1.0：新的里程碑 - 2024/04/28](https://www.nocobase.com/cn/blog/release-v10)
- [v0.21：优化区块性能 - 2024/03/29](https://www.nocobase.com/cn/blog/release-v021)
- [v0.20：支持多数据源 - 2024/03/03](https://www.nocobase.com/cn/blog/release-v020)
- [v0.19：应用流程优化 - 2024/01/08](https://www.nocobase.com/cn/blog/release-v019)
- [v0.18：建立健全的测试体系 - 2023/12/21](https://www.nocobase.com/cn/blog/release-v018)
- [v0.17：全新的 SchemaInitializer 和 SchemaSettings - 2023/12/11](https://www.nocobase.com/cn/blog/release-v017)
- [v0.16：全新的缓存模块 - 2023/11/20](https://www.nocobase.com/cn/blog/release-v016)
- [v0.15：全新的插件设置中心 - 2023/11/13](https://www.nocobase.com/cn/blog/release-v015)
- [v0.14：全新的插件管理器，支持通过界面添加插件 - 2023/09/11](https://www.nocobase.com/cn/blog/release-v014)
- [v0.13: 全新的应用状态流转 - 2023/08/24](https://www.nocobase.com/cn/blog/release-v013)

## NocoBase 是什么

NocoBase 是一个极易扩展的开源无代码开发平台。
不必投入几年时间、数百万资金研发，花几分钟时间部署 NocoBase，马上拥有一个私有、可控、极易扩展的无代码开发平台。

中文官网：  
https://www.nocobase.com/cn

在线体验：  
https://demo-cn.nocobase.com/new

文档：  
https://docs-cn.nocobase.com/

社区：  
https://forum.nocobase.com/

## 与众不同之处

### 1. 数据模型驱动

多数以表单、表格或者流程驱动的无代码产品都是在使用界面上直接创建数据结构，比如 Airtable 在表格里新增一列就是新增一个字段。这样的好处是使用简单，不足是功能和灵活性受限，难以满足较复杂场景的需求。

NocoBase 采用数据结构与使用界面分离的设计思路，可以为数据表创建任意数量、任意形态的区块（数据视图），每个区块里可以定义不同的样式、文案、操作。这样既兼顾了无代码的简单操作，又具备了原生开发的灵活性。

![model](https://static-docs.nocobase.com/model.png)

### 2. 所见即所得
NocoBase 可以开发复杂和有特色的业务系统，但这并不意味着需要复杂和专业的操作。只需一次点击，就可以在使用界面上显示出配置选项，具备系统配置权限的管理员可以用所见即所得的操作方式，直接配置用户的使用界面。

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 3. 一切皆插件

NocoBase 采用插件化架构，所有新功能都可以通过开发和安装插件来实现，扩展功能就像在手机上安装 APP 一样简单。

![plugins](https://static-docs.nocobase.com/plugins.png)

## 安装

NocoBase 支持三种安装方式：

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose">Docker 安装（推荐）</a>

   适合无代码场景，不需要写代码。升级时，下载最新镜像并重启即可。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app">create-nocobase-app 安装</a>

   项目的业务代码完全独立，支持低代码开发。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone">Git 源码安装</a>

   如果你想体验最新未发布版本，或者想参与贡献，需要在源码上进行修改、调试，建议选择这种安装方式，对开发技术水平要求较高，如果代码有更新，可以走 git 流程拉取最新代码。

## 一键部署

通过云厂商一键部署 NocoBase，并享受多种部署选项的灵活性：

- [阿里云](https://computenest.console.aliyun.com/service/instance/create/default?type=user&ServiceName=NocoBase%20%E7%A4%BE%E5%8C%BA%E7%89%88)
