# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
并且本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

## [v1.9.8](https://github.com/nocobase/nocobase/compare/v1.9.7...v1.9.8) - 2025-11-18

### 🐛 修复

- **[工作流：自定义操作事件]** 修复监听不存在的外部数据源事件产生的报错 by @mytharcher

- **[模板打印]** 解析filter中变量 by @jiannx

- **[工作流：审批]** 修复由于多个审批人并发处理审批时的竞态导致的节点重复执行的问题 by @mytharcher

## [v1.9.7](https://github.com/nocobase/nocobase/compare/v1.9.6...v1.9.7) - 2025-11-17

### 🐛 修复

- **[client]** 修复审批表单的联动规则不生效的问题 ([#7858](https://github.com/nocobase/nocobase/pull/7858)) by @zhangzhonghe

- **[server]** 修复服务拆分模式下未订阅无法发布队列消息的问题 ([#7875](https://github.com/nocobase/nocobase/pull/7875)) by @mytharcher

- **[工作流]**
  - 修复监听不存在的外部数据源事件产生的报错 ([#7855](https://github.com/nocobase/nocobase/pull/7855)) by @mytharcher

  - 使用底层事件队列代替共享后台任务队列，以避免共享队列在服务拆分模式下会被错误消费的问题 ([#7871](https://github.com/nocobase/nocobase/pull/7871)) by @mytharcher

- **[工作流：人工处理节点]** 修复翻译语言指向的命名空间，以正确的翻译内容 ([#7877](https://github.com/nocobase/nocobase/pull/7877)) by @mytharcher

- **[权限控制]** 关系字段关联操作 snippets 不生效的问题 ([#7876](https://github.com/nocobase/nocobase/pull/7876)) by @2013xile

- **[工作流：审批]**
  - 修复通知渠道分页数量太小加载不全的问题 by @mytharcher

  - 修复审批表单的联动规则不生效的问题 by @zhangzhonghe

  - 修复待办中心审批列表卡片上的日期格式，展示完整的日期和时间 by @mytharcher

  - 修复提交审批处理时查询审批记录列表的性能问题 by @mytharcher

## [v1.9.6](https://github.com/nocobase/nocobase/compare/v1.9.5...v1.9.6) - 2025-11-12

### 🐛 修复

- **[client]** 修复拖拽引用模板后再删除引用模板而导致的复制模板不显示的问题 ([#7847](https://github.com/nocobase/nocobase/pull/7847)) by @zhangzhonghe

- **[utils]** 为 intersect 策略增加对象类型支持 ([#7840](https://github.com/nocobase/nocobase/pull/7840)) by @chenos

- **[数据可视化：EChrats]** 修复ECharts选项配置 labelType 不生效的问题 by @heziqiang

- **[邮件管理]** 没有时间戳的情况下同步微软邮件已读状态 by @jiannx

## [v1.9.5](https://github.com/nocobase/nocobase/compare/v1.9.4...v1.9.5) - 2025-11-10

### 🐛 修复

- **[工作流：审批]** 修复重查关系数据时未屏蔽主表字段的问题 by @mytharcher

- **[邮件管理]** 修复outlook内敛图片和同步问题 by @jiannx

## [v1.9.4](https://github.com/nocobase/nocobase/compare/v1.9.3...v1.9.4) - 2025-11-10

### 🚀 优化

- **[权限控制]** 优化关系字段关联操作的权限控制逻辑 ([#7800](https://github.com/nocobase/nocobase/pull/7800)) by @2013xile

- **[工作流：JavaScript 节点]** 修复传递到执行环境中的上层函数导致的安全漏洞，避免通过利用漏洞访问上层执行环境的问题 by @mytharcher

- **[认证：OIDC]** 增加请求超时时间 by @2013xile

### 🐛 修复

- **[server]** 修复消息队列在启用服务拆分模式后，工作进程发消息导致报错的问题 ([#7797](https://github.com/nocobase/nocobase/pull/7797)) by @mytharcher

- **[client]** 修复详情区块简单分页出现空数据下一页的问题 ([#7784](https://github.com/nocobase/nocobase/pull/7784)) by @katherinehhh

- **[工作流]**
  - 为工作流的日志增加 `workflowId` 的数据标识 ([#7789](https://github.com/nocobase/nocobase/pull/7789)) by @mytharcher

  - 修复服务拆分模式下，工作流插件不处于服务模式时仍然消费队列的问题 ([#7820](https://github.com/nocobase/nocobase/pull/7820)) by @mytharcher

- **[用户]** 字段名为 snake_case 风格时，索引字段重置不正确的问题 ([#7785](https://github.com/nocobase/nocobase/pull/7785)) by @2013xile

- **[工作流：自定义变量节点]** 修复变量节点缺失 config 时报错的问题 by @mytharcher

## [v1.9.3](https://github.com/nocobase/nocobase/compare/v1.9.2...v1.9.3) - 2025-11-05

### 🚀 优化

- **[database]** 对 MariaDB 连接实例增加 `multipleStatements` 选项，以支持一次查询中调用多条语句 ([#7781](https://github.com/nocobase/nocobase/pull/7781)) by @mytharcher

- **[工作流]** 支持工作流中的数据区块使用一致的详情区块配置菜单 ([#7771](https://github.com/nocobase/nocobase/pull/7771)) by @mytharcher

### 🐛 修复

- **[server]** 使用应用名称隔离发布订阅的频道 ([#7762](https://github.com/nocobase/nocobase/pull/7762)) by @mytharcher

- **[client]** 修复 “Maximum call stack size exceeded” ([#7780](https://github.com/nocobase/nocobase/pull/7780)) by @zhangzhonghe

- **[database]** 字段名为 snake_case 风格时，索引字段判断不正确的问题 ([#7776](https://github.com/nocobase/nocobase/pull/7776)) by @2013xile

- **[工作流]** 修复了集群模式下工作流调度器无法正确识别空闲状态的问题，该问题可能导致插件未就绪就开始消费队列事件 ([#7768](https://github.com/nocobase/nocobase/pull/7768)) by @mytharcher

- **[移动端（已废弃）]** 修复移动端的日期字段默认值弹窗无法选中日期的问题 ([#7783](https://github.com/nocobase/nocobase/pull/7783)) by @zhangzhonghe

- **[工作流：审批]** 修复复制审批工作流时报错的问题 by @mytharcher

- **[邮件管理]** mailMessages添加索引 by @jiannx

## [v1.9.2](https://github.com/nocobase/nocobase/compare/v1.9.1...v1.9.2) - 2025-11-04

### 🚀 优化

- **[工作流：审批]** 在转签和加签时通知新的审批人 by @mytharcher

### 🐛 修复

- **[工作流]** 修复在服务拆分模式下，手动执行带中断节点的工作流一直等待的问题 ([#7767](https://github.com/nocobase/nocobase/pull/7767)) by @mytharcher

- **[邮件管理]** 给索引添加迁移脚本 by @jiannx

## [v1.9.1](https://github.com/nocobase/nocobase/compare/v1.9.0...v1.9.1) - 2025-11-04

### 🐛 修复

- **[工作流：审批]** 并行分支中不再支持创建审批节点，避免流程状态导致的问题 by @mytharcher

- **[邮件管理]** 添加同步日志 by @jiannx

## [v1.9.0](https://github.com/nocobase/nocobase/compare/v1.8.33...v1.9.0) - 2025-11-02

## 新特性

### 字段验证规则

支持为字段配置多种验证规则（如必填、格式、长度、范围、正则表达式等），在表单提交时自动校验输入数据，确保数据准确性一致性。验证规可在字段设置中灵活配置。

![Field_validations.gif](https://static-docs.nocobase.com/20251031111521_rec_-6mjzt5.gif)

参考文档：[字段验证](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/validation)

### 表格区块支持添加「列设置」

允许用户在不进入编辑模式的情况下调整列顺序、可见性和固定位置，从而使数据显示更加灵活和用户友好

![20251031113318_rec_-5ffltd.gif](https://static-docs.nocobase.com/20251031113318_rec_-5ffltd.gif)

### 审批新增「数据保存前」触发模式

审批现在支持“数据保存前”触发模式——启用后，审批发起时不会存储数据，只有在审批通过后才会保存数据。

![image-m52wzz.png](https://static-docs.nocobase.com/image-m52wzz.png)

### 审批触发器中开放审批单据编号变量以供使用

公开了 Approval ID 变量，允许在工作流其他节点中引用，以实现更灵活的配置和数据跟踪。

![approcal_id.png](https://static-docs.nocobase.com/image-qsspfn.png)

### [异步任务管理器] 支持通过环境变量和队列进行异步任务服务拆分

新增服务拆分机制，支持通过 `WORKER_MODE` 环境变量将工作流、异步任务等服务独立运行，实现多节点部署与性能优化。

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

参考文档：[服务拆分](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode/services-splitting)

### 新增用于处理队列消息的事件队列

增加了一个专用的事件队列来处理系统队列消息，提高了异步任务处理能力和可靠性。

参考文档：[集群模式：消息队列](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode#%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97)

### 为应用增加优雅停机的生命周期处理

引入了优雅关闭处理机制，在应用进程收到 SIGTERM / SIGINT 信号时，开始处理关闭流程，以避免部分进行中的数据操作造成的问题。

## 优化

### 系统表自增 ID 改为 53 位类雪花 ID

将主键为自增 ID 且不具备唯一标识的系统表的 ID 修改为 53 位的类雪花算法 ID

![image-jrjc7e.png](https://static-docs.nocobase.com/image-jrjc7e.png)

### 支持查看和继续执行已停用工作流中的人工待办任务

人工待办的区块列表不再限制已停用工作流的待办任务展示，并允许对待办继续提交。

### 邮件管理器

* 邮件数据支持重新同步
* 允许调整插入到邮件编辑器中的图片大小
* 富文本编辑器支持软换行，优化邮件排版体验。
* 优化邮件列表性能，操作更流畅。

![20251031234300_rec_-jifryr.gif](https://static-docs.nocobase.com/20251031234300_rec_-jifryr.gif)

### 工作流模块优化

- 优化了 Workflow 模块中队列执行相关的查询性能，使用了分离字段与索引来提升数据检索效率。

![Workflow Module.png](https://static-docs.nocobase.com/image-5b3byb.png)

## [v1.8.33](https://github.com/nocobase/nocobase/compare/v1.8.32...v1.8.33) - 2025-10-29

### 🚀 优化

- **[server]** 增加 Gateway 层日志 ([#7683](https://github.com/nocobase/nocobase/pull/7683)) by @2013xile

### 🐛 修复

- **[database]** 跳过 MySQL JSON 列的默认值同步处理 ([#7696](https://github.com/nocobase/nocobase/pull/7696)) by @2013xile

- **[client]**
  - 修复弹窗内 iframe 区块联动规则失效问题 ([#7694](https://github.com/nocobase/nocobase/pull/7694)) by @katherinehhh

  - 修复操作面板中的扫描二维码无法配置联动规则 ([#7693](https://github.com/nocobase/nocobase/pull/7693)) by @katherinehhh

- **[工作流]** 修复在服务拆分模式下，工作流内存等待队列处理不当导致部分工作流不执行的问题 ([#7692](https://github.com/nocobase/nocobase/pull/7692)) by @mytharcher

## [v1.8.32](https://github.com/nocobase/nocobase/compare/v1.8.31...v1.8.32) - 2025-10-27

### 🚀 优化

- **[server]** 优化加载本地化资源的方法，避免阻塞事件循环 ([#7653](https://github.com/nocobase/nocobase/pull/7653)) by @2013xile

- **[cache]** 避免因 clone 布隆过滤器造成的性能损耗 ([#7652](https://github.com/nocobase/nocobase/pull/7652)) by @2013xile

- **[操作：导入记录]** 改进了在未找到表头时的错误提示信息 ([#7656](https://github.com/nocobase/nocobase/pull/7656)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复筛选区块中日期字段清除时报错的问题 ([#7632](https://github.com/nocobase/nocobase/pull/7632)) by @katherinehhh

  - 修复字段标题换行截断单词的问题 ([#7647](https://github.com/nocobase/nocobase/pull/7647)) by @katherinehhh

  - 修复编辑弹窗中子表格默认值失效的问题 ([#7631](https://github.com/nocobase/nocobase/pull/7631)) by @katherinehhh

- **[数据表字段：中国行政区划]** 城市和县区相同时，无法导入数据 ([#7673](https://github.com/nocobase/nocobase/pull/7673)) by @2013xile

- **[工作流]**
  - 修复开启分支的节点删除后，保留的分支内部第一个节点的 key 被改为新值的问题 ([#7665](https://github.com/nocobase/nocobase/pull/7665)) by @mytharcher

  - 修复应用停止时日志报错的问题 ([#7639](https://github.com/nocobase/nocobase/pull/7639)) by @mytharcher

- **[文件管理器]** 修复 `.msg` 文件无法正常上传的问题 ([#7662](https://github.com/nocobase/nocobase/pull/7662)) by @mytharcher

- **[数据源：主数据库]** 修复创建反向关系字段后，多节点未同步元数据的问题 ([#7628](https://github.com/nocobase/nocobase/pull/7628)) by @mytharcher

- **[工作流：审批]**
  - 修复审批完成通知中的状态文本的翻译问题，当用户未设置语言偏好时使用系统配置的默认语言进行翻译 by @mytharcher

  - 修复加签后待办数字未更新的问题 by @mytharcher

## [v1.8.31](https://github.com/nocobase/nocobase/compare/v1.8.30...v1.8.31) - 2025-10-17

### 🐛 修复

- **[database]** 修复 `$in` 操作符的值为 `null` 时的报错问题 ([#7610](https://github.com/nocobase/nocobase/pull/7610)) by @mytharcher

- **[工作流：审批]**
  - 修复审批提交后数据库报错时事务未正常回滚导致的事务超时问题 by @mytharcher

  - 修复提交审批表单中部分变量未被解析的问题 by @mytharcher

## [v1.8.30](https://github.com/nocobase/nocobase/compare/v1.8.29...v1.8.30) - 2025-10-16

### 🐛 修复

- **[client]** 修复标签页图标弹窗被遮挡的问题 ([#7607](https://github.com/nocobase/nocobase/pull/7607)) by @zhangzhonghe

## [v1.8.29](https://github.com/nocobase/nocobase/compare/v1.8.28...v1.8.29) - 2025-10-15

### 🚀 优化

- **[工作流：审批]** 重构分支配置以适配内核变更 by @mytharcher

### 🐛 修复

- **[工作流：审批]** 修复迁移脚本在未安装应用时由于表不存在的报错问题 by @mytharcher

## [v1.8.28](https://github.com/nocobase/nocobase/compare/v1.8.27...v1.8.28) - 2025-10-14

### 🚀 优化

- **[client]** 在前端使用 `mime` 包检测文件的 MIME 类型，以获得更准确的类型数据 ([#7551](https://github.com/nocobase/nocobase/pull/7551)) by @mytharcher

- **[工作流]**
  - 支持通过环境变量限制一个工作流中的最大节点数 ([#7542](https://github.com/nocobase/nocobase/pull/7542)) by @mytharcher

  - 删除节点时增加“保留分支”选项 ([#7571](https://github.com/nocobase/nocobase/pull/7571)) by @mytharcher

- **[工作流：循环节点]** 支持通过环境变量限制循环节点的最大循环次数 ([#7543](https://github.com/nocobase/nocobase/pull/7543)) by @mytharcher

- **[工作流：审批]** 为自定义审批区块的详情弹窗增加打印按钮 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复预览图片同时旋转和缩放显示不正常的问题 ([#7573](https://github.com/nocobase/nocobase/pull/7573)) by @mytharcher

  - 修复 AssignedField 组件未实现动态属性导致的新增、更新节点上传文件错误问题 ([#7556](https://github.com/nocobase/nocobase/pull/7556)) by @mytharcher

- **[公开表单]** 修复公开表单中的文件字段上传规则不正确的问题 ([#7553](https://github.com/nocobase/nocobase/pull/7553)) by @mytharcher

- **[日历]** 修复日历区块数据表设置唯一标识后详情数据查询错误问题 ([#7562](https://github.com/nocobase/nocobase/pull/7562)) by @katherinehhh

- **[认证：LDAP]** 修复含非 ASCII（UTF-8）DN 的 AD 登录失败问题 by @2013xile

## [v1.8.27](https://github.com/nocobase/nocobase/compare/v1.8.26...v1.8.27) - 2025-10-02

### 🚀 优化

- **[client]** 支持预览图片时旋转图片 ([#7523](https://github.com/nocobase/nocobase/pull/7523)) by @mytharcher

- **[工作流]** 将调度相关逻辑拆分为独立的调度器 ([#7535](https://github.com/nocobase/nocobase/pull/7535)) by @mytharcher

### 🐛 修复

- **[client]** 修复左侧菜单栏子菜单不能正确高亮的问题 ([#7520](https://github.com/nocobase/nocobase/pull/7520)) by @duannyuuu

- **[工作流：循环节点]** 修复了循环节点条件未满足时仍错误继续到下一项的问题 ([#7521](https://github.com/nocobase/nocobase/pull/7521)) by @mytharcher

- **[工作流]**
  - 修复由于队列处理不当导致的工作流重复执行问题 ([#7533](https://github.com/nocobase/nocobase/pull/7533)) by @mytharcher

  - 修复绑定工作流配置中加载关系字段上下文的工作流列表条件错误的问题 ([#7516](https://github.com/nocobase/nocobase/pull/7516)) by @mytharcher

  - 修复基于日期字段的定时任务到期后不触发的问题 ([#7524](https://github.com/nocobase/nocobase/pull/7524)) by @mytharcher

## [v1.8.26](https://github.com/nocobase/nocobase/compare/v1.8.25...v1.8.26) - 2025-09-20

### 🚀 优化

- **[client]** 表格列提示信息和分组标题支持本地化 ([#7485](https://github.com/nocobase/nocobase/pull/7485)) by @katherinehhh

- **[日历]** 支持日历区块表头多语言显示 ([#7508](https://github.com/nocobase/nocobase/pull/7508)) by @katherinehhh

### 🐛 修复

- **[client]** 修复菜单的图标配置弹窗被遮挡的问题 ([#7515](https://github.com/nocobase/nocobase/pull/7515)) by @zhangzhonghe

- **[通知：站内信]**
  - 修复通知链接解析错误的问题 ([#7509](https://github.com/nocobase/nocobase/pull/7509)) by @mytharcher

  - 修复打开通知弹窗不展示最近消息的问题 ([#7514](https://github.com/nocobase/nocobase/pull/7514)) by @mytharcher

- **[工作流]** 修复工作流后台任务队列订阅逻辑不正确导致执行消息处理异常的问题 ([#7507](https://github.com/nocobase/nocobase/pull/7507)) by @mytharcher

- **[工作流：审批]**
  - 修复删除外部数据源数据时报错的问题 by @mytharcher

  - 修复审批处理表单中公式字段不自动变化的问题 by @mytharcher

## [v1.8.25](https://github.com/nocobase/nocobase/compare/v1.8.24...v1.8.25) - 2025-09-16

### 🚀 优化

- **[auth]** 支持在用户名中使用 `.` ([#7504](https://github.com/nocobase/nocobase/pull/7504)) by @2013xile

### 🐛 修复

- **[client]** 修复按钮的图标配置弹窗被遮挡的问题 ([#7506](https://github.com/nocobase/nocobase/pull/7506)) by @zhangzhonghe

- **[模板打印]** 支持省市区字段 by @jiannx

## [v1.8.24](https://github.com/nocobase/nocobase/compare/v1.8.23...v1.8.24) - 2025-09-12

### 🎉 新特性

- **[工作流：审批]** 支持审批时退回到任意节点 by @mytharcher

### 🚀 优化

- **[server]** 在消息队列中使用标准的系统日志 ([#7480](https://github.com/nocobase/nocobase/pull/7480)) by @mytharcher

- **[client]** 移除文件列表上多余的省略预览浮层 ([#7479](https://github.com/nocobase/nocobase/pull/7479)) by @mytharcher

- **[工作流]** 优化工作流准备执行过程，支持使用已加载的节点数据 ([#7476](https://github.com/nocobase/nocobase/pull/7476)) by @mytharcher

- **[主题编辑器]** 新增对侧边菜单栏的颜色配置 ([#7483](https://github.com/nocobase/nocobase/pull/7483)) by @duannyuuu

- **[Redis 消息队列适配器]** 在 Redis 消息队列适配器中使用标准的系统日志 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复 Popover 组件被遮挡的问题 ([#7491](https://github.com/nocobase/nocobase/pull/7491)) by @zhangzhonghe

  - 联动规则数值字段「不为空」判断错误 ([#7477](https://github.com/nocobase/nocobase/pull/7477)) by @katherinehhh

  - 修复公开表单 select/多选/日期/富文本在只读时仍可编辑的问题 ([#7484](https://github.com/nocobase/nocobase/pull/7484)) by @katherinehhh

- **[工作流]** 修复潜在的工作流日志缓存报错问题 ([#7490](https://github.com/nocobase/nocobase/pull/7490)) by @mytharcher

- **[HTTP 请求加密]** 修复请求参数不支持原生 URLSearchParams 类型的问题 by @mytharcher

- **[数据源：REST API]** 修复 REST API URL 验证规则 by @katherinehhh

- **[工作流：审批]** 修复审批完成通知中状态文本未翻译的问题 by @mytharcher

## [v1.8.23](https://github.com/nocobase/nocobase/compare/v1.8.22...v1.8.23) - 2025-09-03

### 🚀 优化

- **[database]** 优化了 list API 的统计条数查询，减少资源占用。 ([#7453](https://github.com/nocobase/nocobase/pull/7453)) by @aaaaaajie

- **[通知：站内信]** 支持站内信配置消息提示的自动关闭等待时间 ([#7472](https://github.com/nocobase/nocobase/pull/7472)) by @mytharcher

- **[工作流：通知节点]** 支持通知节点测试执行 ([#7470](https://github.com/nocobase/nocobase/pull/7470)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复 编辑表单区块中，阅读态关系字段在切换为标签组件时渲染失败的问题 ([#7468](https://github.com/nocobase/nocobase/pull/7468)) by @katherinehhh

  - 修复选定日期为最小允许日期时时间选择限制无效的问题 ([#7461](https://github.com/nocobase/nocobase/pull/7461)) by @katherinehhh

- **[移动端]** 修复移动端不含时区的日期字段未正确显示时分秒 ([#7473](https://github.com/nocobase/nocobase/pull/7473)) by @katherinehhh

- **[公开表单]** 修复 公开表单字段配置变量作为默认值时未生效的问题 ([#7467](https://github.com/nocobase/nocobase/pull/7467)) by @katherinehhh

- **[操作：导入记录]** 修复导入xlsx重复数据时报错行数显示错误 ([#7440](https://github.com/nocobase/nocobase/pull/7440)) by @aaaaaajie

- **[数据表：树]** 在删除树表之后移除和该表有关的数据库事件 ([#7459](https://github.com/nocobase/nocobase/pull/7459)) by @2013xile

- **[工作流：自定义操作事件]** 修复自定义操作事件初始化后不能直接手动执行的问题 by @mytharcher

- **[工作流：子流程]** 修复子流程重复恢复执行的问题 by @mytharcher

- **[工作流：审批]** 对非当前审批人，不展示流程表格中的对应查看按钮 by @mytharcher

## [v1.8.22](https://github.com/nocobase/nocobase/compare/v1.8.21...v1.8.22) - 2025-08-27

### 🐛 修复

- **[工作流]** 修复待办中心路由配置错误导致详情弹窗不显示的问题 ([#7452](https://github.com/nocobase/nocobase/pull/7452)) by @mytharcher

## [v1.8.21](https://github.com/nocobase/nocobase/compare/v1.8.20...v1.8.21) - 2025-08-26

### 🐛 修复

- **[文件管理器]** 修复文件表的 storage 字段编辑时的报错 ([#7393](https://github.com/nocobase/nocobase/pull/7393)) by @mytharcher

- **[工作流：并行分支节点]** 修复并行分支节点在全部执行模式下状态判断错误导致提前执行完成的问题 ([#7445](https://github.com/nocobase/nocobase/pull/7445)) by @mytharcher

- **[工作流：审批]** 补充审批完成通知中自定义模板的状态变量 by @mytharcher

## [v1.8.20](https://github.com/nocobase/nocobase/compare/v1.8.19...v1.8.20) - 2025-08-25

### 🚀 优化

- **[工作流]** 调整工作流变量接口，支持预置额外变量列表 ([#7439](https://github.com/nocobase/nocobase/pull/7439)) by @mytharcher

- **[工作流：审批]**
  - 支持在自定义通知中使用审批相关变量 by @mytharcher

  - 支持结束节点终止流程后，变更审批状态 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复在某些场景下，移动端数据选择器弹窗编辑记录时出错的问题 ([#7444](https://github.com/nocobase/nocobase/pull/7444)) by @zhangzhonghe

  - 子表格中附件字段必填校验不生效的问题 ([#7431](https://github.com/nocobase/nocobase/pull/7431)) by @katherinehhh

  - 修复附件 URL 字段的 URL 中包含查询参数时图标展示不正确的问题 ([#7432](https://github.com/nocobase/nocobase/pull/7432)) by @mytharcher

- **[database]**
  - 修复了站内消息加载更多时出现的 MySQL 语法错误。 ([#7438](https://github.com/nocobase/nocobase/pull/7438)) by @aaaaaajie

  - 修复导出 Number 类型字段时的精度问题 ([#7421](https://github.com/nocobase/nocobase/pull/7421)) by @aaaaaajie

- **[undefined]** 修复 MySQL 外部数据源中仅按日期字段筛选数据不正确的问题 ([#7422](https://github.com/nocobase/nocobase/pull/7422)) by @aaaaaajie

- **[操作：导入记录]** 修复了当表的主键为单行文本时导入失败的问题 ([#7416](https://github.com/nocobase/nocobase/pull/7416)) by @aaaaaajie

- **[工作流]**
  - 补全自动删除工作流的执行状态选项 ([#7436](https://github.com/nocobase/nocobase/pull/7436)) by @mytharcher

  - 修复待办中心移动端菜单相关问题 ([#7419](https://github.com/nocobase/nocobase/pull/7419)) by @mytharcher

- **[操作：导入记录 Pro]** 修复在 xlsx 导入中使用字符串主键时更新结果不符合预期的问题。 by @aaaaaajie

## [v1.8.19](https://github.com/nocobase/nocobase/compare/v1.8.18...v1.8.19) - 2025-08-22

### 🎉 新特性

- **[工作流：审批]** 为通知配置增加内联模板类型 by @mytharcher

### 🚀 优化

- **[client]** 支持 Select 组件在阅读态时可以展示字符串标识的图标 ([#7420](https://github.com/nocobase/nocobase/pull/7420)) by @mytharcher

- **[database]** 优化 ACL Meta 查询性能 ([#7400](https://github.com/nocobase/nocobase/pull/7400)) by @aaaaaajie

- **[移动端]** 优化移动端弹窗组件 ([#7414](https://github.com/nocobase/nocobase/pull/7414)) by @zhangzhonghe

### 🐛 修复

- **[database]** 修复了在读取 Postgres 外部数据表时，会错误包含其他 schema 视图的问题 ([#7410](https://github.com/nocobase/nocobase/pull/7410)) by @aaaaaajie

- **[区块：模板]** 修复了邮件区块在继承模版中不可见的问题 ([#7430](https://github.com/nocobase/nocobase/pull/7430)) by @gchust

- **[操作：导入记录 Pro]** 导入识别重复记录时，禁止设置关系字段 by @aaaaaajie

- **[工作流：审批]** 修复加签时加载用户列表为空的问题 by @mytharcher

- **[迁移管理]** 生成迁移文件的时候跳过最新版本 pg_dump 生成的 `\restrict` 和 `\unrestrict` 命令，解决还原报错的问题 by @2013xile

## [v1.8.18](https://github.com/nocobase/nocobase/compare/v1.8.17...v1.8.18) - 2025-08-19

### 🚀 优化

- **[工作流]** 将节点选择菜单更新为两列布局，以提升信息密度使用户能同时查看更多选项 ([#7396](https://github.com/nocobase/nocobase/pull/7396)) by @mytharcher

- **[授权设置]** 授权设置中，每次拷贝最新InstanceID ([#7387](https://github.com/nocobase/nocobase/pull/7387)) by @jiannx

### 🐛 修复

- **[client]**
  - 修复 联动规则为空判断时,数字0 也视为空的问题 ([#7404](https://github.com/nocobase/nocobase/pull/7404)) by @katherinehhh

  - 修复链接按钮中文字换行的问题 ([#7406](https://github.com/nocobase/nocobase/pull/7406)) by @mytharcher

- **[移动端]** 修复移动端日期字段显示为错误格式的问题 ([#7412](https://github.com/nocobase/nocobase/pull/7412)) by @katherinehhh

- **[Office 文件预览]** 修复上传文件至附件 URL 字段报错的问题 ([#7405](https://github.com/nocobase/nocobase/pull/7405)) by @mytharcher

- **[工作流]** 修复编辑工作流分类时报错和表单数据丢失的问题 ([#7408](https://github.com/nocobase/nocobase/pull/7408)) by @mytharcher

- **[工作流：邮件发送节点]** 修复邮件节点可能存在恢复执行不正常的问题 ([#7409](https://github.com/nocobase/nocobase/pull/7409)) by @mytharcher

- **[工作流：自定义操作事件]** 在对多条数据的触发成功后清空选中行 by @mytharcher

- **[模板打印]** 多行数据中单选字段打印 by @jiannx

- **[工作流：审批]** 修复加载审批记录中外部数据源数据出现 404 的问题 by @mytharcher

## [v1.8.17](https://github.com/nocobase/nocobase/compare/v1.8.16...v1.8.17) - 2025-08-15

### 🎉 新特性

- **[工作流：审批]** 支持在同一个工作流中使用统一的待办任务标题 by @mytharcher

### 🚀 优化

- **[用户认证]** 使用 token 参数登录成功后，移除 URL token 参数 ([#7386](https://github.com/nocobase/nocobase/pull/7386)) by @2013xile

- **[模板打印]** 支持多对多数组字段 by @jiannx

### 🐛 修复

- **[移动端]** 修复移动端审批弹窗中的表单提交的数据不正确的问题 ([#7389](https://github.com/nocobase/nocobase/pull/7389)) by @zhangzhonghe

- **[工作流]** 修复待办中心的页面标题翻译 ([#7392](https://github.com/nocobase/nocobase/pull/7392)) by @mytharcher

- **[日历]** 修复了日历事件悬停提示框未显示事件标题字段内容，显示为 “[object Object]” 的问题 ([#7372](https://github.com/nocobase/nocobase/pull/7372)) by @katherinehhh

- **[通知：站内信]** 修复多语言翻译 ([#7384](https://github.com/nocobase/nocobase/pull/7384)) by @mytharcher

- **[文件管理器]** 移除文件上传大小的上限提示 ([#7391](https://github.com/nocobase/nocobase/pull/7391)) by @mytharcher

- **[文件存储：S3 (Pro)]**
  - 弃用可能造成问题的 `attachmentField` 参数 by @mytharcher

  - 修复 IAM 授权方式无法上传文件的问题 by @mytharcher

## [v1.8.16](https://github.com/nocobase/nocobase/compare/v1.8.15...v1.8.16) - 2025-08-14

### 🚀 优化

- **[通知：站内信]** 移除通过 `console.log` 输出的 SQL 日志 ([#7368](https://github.com/nocobase/nocobase/pull/7368)) by @2013xile

### 🐛 修复

- **[server]** 部分请求没有 `ctx.action`, 导致审计日志中间件报错 ([#7369](https://github.com/nocobase/nocobase/pull/7369)) by @2013xile

- **[数据表字段：公式]** 修复公式输入由于变量类型导致无法通过验证的问题 ([#7373](https://github.com/nocobase/nocobase/pull/7373)) by @mytharcher

- **[备份管理器]** 备份大量文件时，任务状态可能提前显示为“已成功”，但实际仍在进行中 by @gchust

## [v1.8.15](https://github.com/nocobase/nocobase/compare/v1.8.14...v1.8.15) - 2025-08-11

### 🚀 优化

- **[client]**
  - 新增“前天”日期变量支持 ([#7359](https://github.com/nocobase/nocobase/pull/7359)) by @katherinehhh

  - 优化切换弹窗标签页的性能 ([#7353](https://github.com/nocobase/nocobase/pull/7353)) by @zhangzhonghe

- **[工作流]**
  - 修复不稳定的测试用例 ([#7349](https://github.com/nocobase/nocobase/pull/7349)) by @mytharcher

  - 工作流禁用后也展示正常的标题 ([#7339](https://github.com/nocobase/nocobase/pull/7339)) by @mytharcher

- **[Office 文件预览]** 为预览 `.odt` 文件增加支持 ([#7347](https://github.com/nocobase/nocobase/pull/7347)) by @mytharcher

- **[备份管理器]** 优化 mysql 数据库备份操作性能 by @gchust

### 🐛 修复

- **[client]**
  - 修复表单的多列布局在移动端没有变成单列布局的问题 ([#7355](https://github.com/nocobase/nocobase/pull/7355)) by @zhangzhonghe

  - 修复批量删除数据表时的错误 ([#7345](https://github.com/nocobase/nocobase/pull/7345)) by @aaaaaajie

  - 修复单独配置权限时未默认选中已保存数据范围的问题。 ([#7288](https://github.com/nocobase/nocobase/pull/7288)) by @aaaaaajie

- **[工作流]**
  - 重构添加节点的菜单，并修复其导致的工作流画布渲染的性能问题 ([#7363](https://github.com/nocobase/nocobase/pull/7363)) by @mytharcher

  - 修复获取单条待办项目时的筛选条件错误问题 ([#7366](https://github.com/nocobase/nocobase/pull/7366)) by @mytharcher

  - 修复字段选择框的搜索关键词匹配问题 ([#7356](https://github.com/nocobase/nocobase/pull/7356)) by @mytharcher

  - 避免应用停止时调用队列报错 ([#7348](https://github.com/nocobase/nocobase/pull/7348)) by @mytharcher

- **[通知：站内信]** 修复接收到站内信消息但未弹出展示的问题 ([#7364](https://github.com/nocobase/nocobase/pull/7364)) by @mytharcher

- **[移动端]** 修复移动端日期组件使用日期变量限制可选范围时日期显示异常的问题 ([#7362](https://github.com/nocobase/nocobase/pull/7362)) by @katherinehhh

- **[文件管理器]** 为文件表增加 `storageId` 字段以支持权限配置 ([#7351](https://github.com/nocobase/nocobase/pull/7351)) by @mytharcher

- **[工作流：并行分支节点]** 修复 MySQL 下并行分支节点在恢复执行后假死的问题 ([#7346](https://github.com/nocobase/nocobase/pull/7346)) by @mytharcher

- **[工作流：抄送]** 修复区块无法移除的问题 ([#7338](https://github.com/nocobase/nocobase/pull/7338)) by @mytharcher

- **[Office 文件预览]** 支持 URL 中包含 `.docx`, `.xlsx` 和 `.pptx` 的文件预览 ([#7336](https://github.com/nocobase/nocobase/pull/7336)) by @mytharcher

- **[数据可视化]** 图表区块中筛选日期字段设置默认值为日期变量时显示不正确的问题 ([#7291](https://github.com/nocobase/nocobase/pull/7291)) by @katherinehhh

- **[工作流：审批]**
  - 修复审批原始详情区块中联动规则失效的问题 by @mytharcher

  - 修复提交草稿时更新关系字段的问题 by @mytharcher

## [v1.8.14](https://github.com/nocobase/nocobase/compare/v1.8.13...v1.8.14) - 2025-08-05

### 🐛 修复

- **[client]** 修复变量原始字符串会随表单提交的问题 ([#7337](https://github.com/nocobase/nocobase/pull/7337)) by @zhangzhonghe

- **[工作流：审批]** 为加签和转签的任务增加标题 by @mytharcher

## [v1.8.13](https://github.com/nocobase/nocobase/compare/v1.8.12...v1.8.13) - 2025-08-04

### 🎉 新特性

- **[认证：SAML 2.0]** 增加签名相关配置项 by @2013xile

### 🚀 优化

- **[工作流：JavaScript 节点]** 将日志改为使用基础缓存以避免集群模式的问题 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复 操作面板鼠标移上去 tooltip 显示 [object Object] 的问题 ([#7322](https://github.com/nocobase/nocobase/pull/7322)) by @katherinehhh

  - 当在筛选表单中使用变量设置字段默认值，且变量值为空时，输入框中会显示变量的原始字符串 ([#7335](https://github.com/nocobase/nocobase/pull/7335)) by @zhangzhonghe

- **[数据表：树]** 修复树表路径同步逻辑 ([#7330](https://github.com/nocobase/nocobase/pull/7330)) by @ChimingLiu

## [v1.8.12](https://github.com/nocobase/nocobase/compare/v1.8.11...v1.8.12) - 2025-08-01

### 🎉 新特性

- **[client]** 为 Input、TextArea、URL 和 InputNumber 组件添加了"自动聚焦"选项，启用后输入框在页面初始渲染时会自动获得焦点 ([#7320](https://github.com/nocobase/nocobase/pull/7320)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 修复文件预览在空 URL 时报错的问题 ([#7315](https://github.com/nocobase/nocobase/pull/7315)) by @mytharcher

  - 为本地文件预览补全 URL ([#7314](https://github.com/nocobase/nocobase/pull/7314)) by @mytharcher

- **[utils]** 修复 parseDate 解析时间变量时区处理错误的问题 ([#7318](https://github.com/nocobase/nocobase/pull/7318)) by @katherinehhh

- **[undefined]** 将新插件加入到预置集合 ([#7319](https://github.com/nocobase/nocobase/pull/7319)) by @mytharcher

- **[文件管理器]** 修复上传文件时存储引擎外键的权限问题 ([#7316](https://github.com/nocobase/nocobase/pull/7316)) by @mytharcher

- **[工作流]** 修复执行器退出时对 `undefined` 结果的处理 ([#7317](https://github.com/nocobase/nocobase/pull/7317)) by @mytharcher

- **[工作流：动态表达式计算节点]** 修复旧 API 导致的错误 ([#7321](https://github.com/nocobase/nocobase/pull/7321)) by @mytharcher

- **[工作流：子流程]** 修复子流程假死的问题 by @mytharcher

## [v1.8.11](https://github.com/nocobase/nocobase/compare/v1.8.10...v1.8.11) - 2025-07-30

### 🎉 新特性

- **[Office 文件预览]** 基于微软在线预览支持预览 Office 相关文件 ([#7300](https://github.com/nocobase/nocobase/pull/7300)) by @mytharcher

### 🚀 优化

- **[client]** 选中菜单后不自动关闭菜单 ([#7252](https://github.com/nocobase/nocobase/pull/7252)) by @kerwin612

- **[通知：站内信]** 站内信消息从 SSE 改为 WebSocket ([#7302](https://github.com/nocobase/nocobase/pull/7302)) by @mytharcher

- **[工作流]** 减少准备执行计划时加载节点结果的数量 ([#7284](https://github.com/nocobase/nocobase/pull/7284)) by @mytharcher

- **[认证：钉钉]** 在钉钉客户端中将导航栏标题设置为空，而不是显示 "Loading..." by @2013xile

### 🐛 修复

- **[client]**
  - 修复树表格无法展开的问题 ([#7309](https://github.com/nocobase/nocobase/pull/7309)) by @zhangzhonghe

  - 修复表格行拖拽排序不符合预期的问题 ([#6959](https://github.com/nocobase/nocobase/pull/6959)) by @ChimingLiu

  - 修复解析字段默认值时出现死循环的问题 ([#7301](https://github.com/nocobase/nocobase/pull/7301)) by @zhangzhonghe

  - date field display issue  in association field data selector popup of filter form ([#7290](https://github.com/nocobase/nocobase/pull/7290)) by @katherinehhh

- **[工作流：HTTP 请求节点]** 修复竞态问题 ([#7310](https://github.com/nocobase/nocobase/pull/7310)) by @mytharcher

- **[工作流]** 修复 MySQL 下保存执行记录时大整型 ID 字段的问题 ([#7292](https://github.com/nocobase/nocobase/pull/7292)) by @mytharcher

- **[操作：导出记录]** 修复导出 Excel 时多层关系字段格式不正确的问题。 ([#7277](https://github.com/nocobase/nocobase/pull/7277)) by @aaaaaajie

- **[数据源：外部 SQL Server]** 修复外部数据源 MSSQL datetime（无时区）字段存储格式不一致 by @aaaaaajie

- **[工作流：审批]** 修复基于外部数据源的审批表单中指派人选择报错问题 by @mytharcher

## [v1.8.10](https://github.com/nocobase/nocobase/compare/v1.8.7...v1.8.10) - 2025-07-24

### 🎉 新特性

- **[认证：SAML 2.0]** 支持用户未认证时，自动跳转到 SSO登录页 by @2013xile

- **[server]** 支持通过环境变量配置请求体大小限制 ([#7273](https://github.com/nocobase/nocobase/pull/7273)) by @aaaaaajie

- **[工作流：并行分支节点]** 为并行分支节点增加“全部执行”的模式 ([#7263](https://github.com/nocobase/nocobase/pull/7263)) by @mytharcher

- **[Redis 消息队列适配器]** 新增基于 Redis 的事件队列适配器 by @mytharcher

### 🚀 优化

- **[工作流]** 为测试节点的变量增加 JSON 常量类型 ([#7274](https://github.com/nocobase/nocobase/pull/7274)) by @mytharcher

- **[AI 集成]** 移除调用 `saveJob` 的 `await` ([#7275](https://github.com/nocobase/nocobase/pull/7275)) by @mytharcher

- **[工作流：JSON 计算]** JSON 计算节点支持可测试 by @mytharcher

- **[server]** 内存队列适配器并发支持未满载时继续处理新任务 ([#7267](https://github.com/nocobase/nocobase/pull/7267)) by @mytharcher

- **[database]** 当数据量超过阈值时，自动启用简易分页模式 ([#7227](https://github.com/nocobase/nocobase/pull/7227)) by @aaaaaajie

- **[工作流：人工处理节点]** storePopupContext 支持保存默认的上下文 ([#7264](https://github.com/nocobase/nocobase/pull/7264)) by @zhangzhonghe

- **[Redis 消息队列适配器]** Redis 队列适配器并发支持未满载时继续处理新任务 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复下拉关系字段使用 formula 作为标题时未按模糊匹配查询的问题 ([#7280](https://github.com/nocobase/nocobase/pull/7280)) by @katherinehhh

  - 修复 子表单联动规则中缺失当前对象变量的问题 ([#7266](https://github.com/nocobase/nocobase/pull/7266)) by @katherinehhh

  - 数据选择器设置标题字段无效 ([#7251](https://github.com/nocobase/nocobase/pull/7251)) by @zhangzhonghe

  - 修复 Markdown 字段在详情视图中未正确渲染为 Markdown 的问题。 ([#7257](https://github.com/nocobase/nocobase/pull/7257)) by @aaaaaajie

  - 字段变更后，依赖该字段的关系字段没有清空值 ([#7262](https://github.com/nocobase/nocobase/pull/7262)) by @zhangzhonghe

  - 修复历史数据中日期字段使用废弃的日期变量时显示异常的问题 ([#7253](https://github.com/nocobase/nocobase/pull/7253)) by @katherinehhh

- **[database]**
  - 修复当数据库表命名风格导致自动开启简单分页模式失效问题。 ([#7256](https://github.com/nocobase/nocobase/pull/7256)) by @aaaaaajie

  - 修复 PostgreSQL 大数据量导出 XLSX 时的报错 ([#7228](https://github.com/nocobase/nocobase/pull/7228)) by @aaaaaajie

  - 表格区块设置mssql外部数据源默认主键排序，读取列表报错 ([#7259](https://github.com/nocobase/nocobase/pull/7259)) by @aaaaaajie

- **[auth]** 修复子应用配置中 `secret` 为空，无法登录的问题 ([#7239](https://github.com/nocobase/nocobase/pull/7239)) by @2013xile

- **[数据源管理]** 修复修改外部数据源导致属性重置 ([#7249](https://github.com/nocobase/nocobase/pull/7249)) by @aaaaaajie

- **[操作：批量编辑]** 数据选择器中无法进行批量编辑和批量更新 ([#7250](https://github.com/nocobase/nocobase/pull/7250)) by @zhangzhonghe

- **[工作流]** 修复错误的依赖版本 ([#7258](https://github.com/nocobase/nocobase/pull/7258)) by @mytharcher

- **[数据源：外部 Oracle]** 修复修改外部数据源导致属性重置 by @aaaaaajie

- **[工作流：审批]** Link 按钮链接地址为当前页面的弹窗，点击打开会显示 404 by @zhangzhonghe

- **[邮件管理]** 邮件与标签关系表在mysql下异常 by @jiannx

## [v1.8.7](https://github.com/nocobase/nocobase/compare/v1.8.6...v1.8.7) - 2025-07-17

### 🎉 新特性

- **[工作流: 日期计算节点]** 支持节点测试执行 by @mytharcher

### 🚀 优化

- **[client]** 颜色选择器：新增四种推荐颜色 ([#7226](https://github.com/nocobase/nocobase/pull/7226)) by @zhangzhonghe

- **[工作流]** 改进比较逻辑以兼容日期值 ([#7237](https://github.com/nocobase/nocobase/pull/7237)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复 表格中操作列的样式规则未生效问题 ([#7225](https://github.com/nocobase/nocobase/pull/7225)) by @katherinehhh

  - 删除菜单时，没有删除 uiSchemas 表中对应的数据 ([#7232](https://github.com/nocobase/nocobase/pull/7232)) by @zhangzhonghe

  - 避免非关系字段在预加载关系字段配置中被选择 ([#7231](https://github.com/nocobase/nocobase/pull/7231)) by @mytharcher

- **[工作流：子流程]** 修复接收到召回信号时，待执行的计划不在当前实例时报错问题 by @mytharcher

## [v1.8.6](https://github.com/nocobase/nocobase/compare/v1.8.5...v1.8.6) - 2025-07-16

### 🐛 修复

- **[client]**
  - 修复错误：Can't resolve 'react-device-detect' ([#7224](https://github.com/nocobase/nocobase/pull/7224)) by @zhangzhonghe

  - 修复联动规则中关系字段显示异常的问题 ([#7220](https://github.com/nocobase/nocobase/pull/7220)) by @katherinehhh

- **[database]** 修复外部数据源表设置简单分页模式时的报错问题 ([#7222](https://github.com/nocobase/nocobase/pull/7222)) by @aaaaaajie

- **[数据表字段：排序]** 修复了在复制操作中缺少排序字段的问题 ([#7116](https://github.com/nocobase/nocobase/pull/7116)) by @katherinehhh

- **[工作流：审批]**
  - 为审批记录列表增加审批已删除的容错 by @mytharcher

  - 修复提交审批时的多级关系数据 by @mytharcher

  - 修复删除数据时的异常 by @mytharcher

## [v1.8.5](https://github.com/nocobase/nocobase/compare/v1.8.4...v1.8.5) - 2025-07-14

### 🚀 优化

- **[数据表字段：公式]** 增加更多可计算的字段类型 ([#7215](https://github.com/nocobase/nocobase/pull/7215)) by @mytharcher

- **[工作流]** 在执行计划由于状态不可执行时用日志替代抛错 ([#7217](https://github.com/nocobase/nocobase/pull/7217)) by @mytharcher

- **[工作流：审批]** 支持当关联业务数据删除时，同时删除审批数据 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复联动规则左侧变量无法选中附件字段的问题 ([#7213](https://github.com/nocobase/nocobase/pull/7213)) by @zhangzhonghe

  - 修复在 IOS 中下拉选择组件被键盘遮挡的问题 ([#7149](https://github.com/nocobase/nocobase/pull/7149)) by @zhangzhonghe

  - 修复编辑表单中联动规则为选项字段同时设置赋值和选项内容时赋值失效的问题 ([#7209](https://github.com/nocobase/nocobase/pull/7209)) by @katherinehhh

  - 筛选折叠面板：字段设置默认值后页面初始化没有触发筛选 ([#7206](https://github.com/nocobase/nocobase/pull/7206)) by @zhangzhonghe

  - 修复列表区块字段赋值操作中选用看板排序字段时报错的问题 ([#7208](https://github.com/nocobase/nocobase/pull/7208)) by @katherinehhh

  - 子菜单切换时浏览器标签标题未同步更新 ([#7207](https://github.com/nocobase/nocobase/pull/7207)) by @zhangzhonghe

  - 打开弹窗操作：切换 Tab 标签之后页面显示不符合预期 ([#7212](https://github.com/nocobase/nocobase/pull/7212)) by @zhangzhonghe

- **[acl]** 修复在使用包含 root 角色的并集模式下删除角色时报错的问题。 ([#7198](https://github.com/nocobase/nocobase/pull/7198)) by @aaaaaajie

- **[多应用管理器]** 修复认证选项出现在意外的位置 ([#7210](https://github.com/nocobase/nocobase/pull/7210)) by @mytharcher

- **[用户认证]** 修复登录页面不能滚动的问题 ([#7159](https://github.com/nocobase/nocobase/pull/7159)) by @zhangzhonghe

- **[工作流：审批]** 修复提交审批时的关系数据 by @mytharcher

## [v1.8.4](https://github.com/nocobase/nocobase/compare/v1.8.3...v1.8.4) - 2025-07-13

### 🎉 新特性

- **[多应用管理器]** 支持为子应用配置独立的认证密钥 ([#7197](https://github.com/nocobase/nocobase/pull/7197)) by @mytharcher

- **[工作流：抄送]** 工作流新增抄送节点 ([#7201](https://github.com/nocobase/nocobase/pull/7201)) by @mytharcher

### 🚀 优化

- **[通知：站内信]** 优化移动端消息页面的字体大小 ([#7199](https://github.com/nocobase/nocobase/pull/7199)) by @zhangzhonghe

- **[认证：钉钉]** 支持配置回调 URL 协议和端口号 by @2013xile

### 🐛 修复

- **[通知：站内信]** 修复字符串格式的大整型时间戳导致的 dayjs 问题 ([#7196](https://github.com/nocobase/nocobase/pull/7196)) by @mytharcher

- **[工作流：审批]**
  - 避免用户不存在时的报错 by @mytharcher

  - 重新加载审批记录上的关系数据 by @mytharcher

  - 迁移脚本中更新 UI schema 时加入 `try/catch` by @mytharcher

## [v1.8.3](https://github.com/nocobase/nocobase/compare/v1.8.2...v1.8.3) - 2025-07-11

### 🚀 优化

- **[多应用管理器]** 为子应用增加数据库和认证的独立配置 ([#7184](https://github.com/nocobase/nocobase/pull/7184)) by @mytharcher

### 🐛 修复

- **[操作：自定义请求]** 修复自定义请求操作成功后，跳转路由时链接地址变量解析错误的问题 ([#7186](https://github.com/nocobase/nocobase/pull/7186)) by @katherinehhh

## [v1.8.2](https://github.com/nocobase/nocobase/compare/v1.8.1...v1.8.2) - 2025-07-10

### 🎉 新特性

- **[工作流：审批]** 为触发器增加区块初始化器 by @mytharcher

### 🚀 优化

- **[工作流]** 字符串比较运算前将操作数转换为字符串 ([#7190](https://github.com/nocobase/nocobase/pull/7190)) by @mytharcher

- **[数据表字段：代码]** 增加字段缩进配置 by @mytharcher

### 🐛 修复

- **[database]** 修复视图在区块中不显示字段的问题。 ([#7162](https://github.com/nocobase/nocobase/pull/7162)) by @aaaaaajie

- **[区块：看板]** 修复看板中子表格 UI 异常 & 支持设置看板每列宽度 ([#7189](https://github.com/nocobase/nocobase/pull/7189)) by @katherinehhh

- **[工作流：审批]** 修复区块和关系数据问题 by @mytharcher

## [v1.8.1](https://github.com/nocobase/nocobase/compare/v1.8.0...v1.8.1) - 2025-07-09

### 🐛 修复

- **[client]**
  - 表单中关系字段表中的勾选字段显示不正确 ([#7176](https://github.com/nocobase/nocobase/pull/7176)) by @zhangzhonghe

  - 修复点击按钮无法打开弹窗的问题 ([#7180](https://github.com/nocobase/nocobase/pull/7180)) by @zhangzhonghe

- **[工作流：人工处理节点]** 修复使用节点变量时的报错 ([#7177](https://github.com/nocobase/nocobase/pull/7177)) by @mytharcher

- **[模板打印]** rootDataType字段添加迁移脚本 by @jiannx

- **[工作流：审批]** 修复通过分支在没有审批人的时候未执行的问题 by @mytharcher

## [v1.8.0](https://github.com/nocobase/nocobase/compare/v1.7.20...v1.8.0) - 2025-07-07

## 新特性

### 新增「忘记密码」功能，支持邮箱找回

支持通过邮件找回密码。在「设置 > 用户认证 > 忘记密码」中启用该功能，配置邮件通知渠道，并自定义重置密码邮件内容（支持变量与 HTML 格式）。

![20250707104631_rec_-ihynhs.gif](https://static-docs.nocobase.com/20250707104631_rec_-ihynhs.gif)

参考文档：[忘记密码](https://docs-cn.nocobase.com/handbook/auth/user#%E5%BF%98%E8%AE%B0%E5%AF%86%E7%A0%81)

### 自定义聚合变量

支持创建计数、求和、平均值等统计变量，可用于菜单徽章、页面标签等位置，让界面展示更加直观、信息更丰富。

![20250707110736_rec_-fzpk98.gif](https://static-docs.nocobase.com/20250707110736_rec_-fzpk98.gif)

参考文档：[自定义变量](https://docs-cn.nocobase.com/handbook/custom-variables)

### 邮件管理

邮件管理模块全面升级，支持邮件删除、批量发送、同步设置、AI 生成内容及多项体验优化。

![image-fyxonb.png](https://static-docs.nocobase.com/image-fyxonb.png)

### 数据源

支持外部数据源中的 SQL Server BIT 字段，支持外部数据源按需加载数据表

![image-h3tk70.png](https://static-docs.nocobase.com/image-h3tk70.png)

### 文本复制

支持一键复制文本字段内容

![20250707105447_rec_-m25b6x.gif](https://static-docs.nocobase.com/20250707105447_rec_-m25b6x.gif)

### [工作流：HTTP 请求节点] 支持 `multipart/form-data` 类型

在工作流中配置 HTTP 请求节点时，现已支持选择 `multipart/form-data` 类型。启用该类型后，可在请求 Body 中以 `form-data` 方式传递数据，支持包含 `file` 类型字段，实现文件上传等场景。

![image-gutu74.png](https://static-docs.nocobase.com/image-gutu74.png)

### [工作流：审批] 审批节点结果支持生成审批记录变量

审批节点执行结果可作为变量供后续节点使用，支持状态与数据自动记录

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

参考文档：[节点结果](https://docs-cn.nocobase.com/handbook/workflow-approval/node#%E8%8A%82%E7%82%B9%E7%BB%93%E6%9E%9C)

## 优化

### 支持在输入框中扫码填充数据

通用文本输入框组件新增 Enable Scan 配置项，启用后将在输入框右侧显示扫码按钮，支持扫码设备录入，并可配置是否允许手动输入。

![image-u7gfro.png](https://static-docs.nocobase.com/image-u7gfro.png)

参考文档：[扫码录入](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/enable-scan)

### Markdown 中支持本地化

Markdown 内容现已支持本地化，可使用 `{{t 'xxx'}}` 语法插入多语言文本。

![20250707132207_rec_-a1fu68.gif](https://static-docs.nocobase.com/20250707132207_rec_-a1fu68.gif)

参考文档：[本地化](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown#%E6%9C%AC%E5%9C%B0%E5%8C%96)

### 菜单链接支持新窗口打开

菜单链接新增“Open in new window”配置项，支持自定义链接的打开方式。

![image-x0qfsq.png](https://static-docs.nocobase.com/image-x0qfsq.png)

### 日历区块支持设置周起始日

可自定义日历视图的周起始日，支持选择「周日」或「周一」，满足不同地区和使用习惯。

![image-uu5ubi.png](https://static-docs.nocobase.com/image-uu5ubi.png)

### Markdown（Vditor）查看模式支持图片点击放大

在查看模式下，支持点击 Markdown 内容中的图片进行放大预览，提升阅读体验。

![20250707134351_rec_-zd0mvw.gif](https://static-docs.nocobase.com/20250707134351_rec_-zd0mvw.gif)

### 工作流模块功能与性能全面提升

- 支持使用更多字段进行工作流筛选，提升查找效率
- 优化移动端展示样式，提升操作体验
- 排除 JSON 字段加载，显著提升执行计划列表加载性能
- 节点测试运行新增日志 API
- 调整 `getCollectionFieldOptions` 方法的 API 接口，增强灵活性

![image-5b3byb.png](https://static-docs.nocobase.com/image-5b3byb.png)

### 审批流程功能增强与体验提升

- 转签、加签人员选择列表新增配置项，支持显示更多字段信息，辅助更精准选人
- 时间线中的时间显示调整为绝对时间，提升可读性
- 从工作流插件中导入审批相关数据表，避免本地表被重写
- 调整变量 API 接口结构，提升灵活性与一致性

![20250707141716_rec_-v2nc4q.gif](https://static-docs.nocobase.com/20250707141716_rec_-v2nc4q.gif)

### 支持通过环境变量配置数据库连接池选项

可通过环境变量灵活设置数据库连接池参数，提升部署灵活性。

![image-tz87as.png](https://static-docs.nocobase.com/image-tz87as.png)

### 评论区块支持分页显示

支持对评论内容进行分页加载，提升大数据量场景下的加载性能与阅读体验。

![20250707135131_rec_-lk66qq.gif](https://static-docs.nocobase.com/20250707135131_rec_-lk66qq.gif)

### 移动端体验提升

- 通知弹窗适配移动端样式，界面更清晰
- 移动端布局判断逻辑优化，提升响应准确性

## [v1.7.20](https://github.com/nocobase/nocobase/compare/v1.7.19...v1.7.20) - 2025-07-07

### 🐛 修复

- **[client]**
  - 字段变更后，依赖该字段的数据范围应自动清空已选值 ([#7161](https://github.com/nocobase/nocobase/pull/7161)) by @zhangzhonghe

  - 修复设置表格列宽度无效的问题 ([#7158](https://github.com/nocobase/nocobase/pull/7158)) by @zhangzhonghe

  - 修复复制按钮弹窗中，筛选表单报错的问题 ([#7154](https://github.com/nocobase/nocobase/pull/7154)) by @zhangzhonghe

  - 修复了保存一对一关系字段报错问题 ([#7153](https://github.com/nocobase/nocobase/pull/7153)) by @aaaaaajie

- **[undefined]** 修复 e2e CI 文件 ([#7160](https://github.com/nocobase/nocobase/pull/7160)) by @mytharcher

- **[文件管理器]**
  - 修复 mimetype 类型检测 ([#7164](https://github.com/nocobase/nocobase/pull/7164)) by @mytharcher

  - 修复 ESM 引起的编译错误 ([#7169](https://github.com/nocobase/nocobase/pull/7169)) by @mytharcher

- **[公开表单]** 修复公开表单中 Date Only 字段选择日期失败的问题 ([#7168](https://github.com/nocobase/nocobase/pull/7168)) by @katherinehhh

- **[工作流]** 修复移动端需要多次左滑才能返回上一页的问题 ([#7165](https://github.com/nocobase/nocobase/pull/7165)) by @zhangzhonghe

- **[数据可视化]** 表格分页器问题 ([#7151](https://github.com/nocobase/nocobase/pull/7151)) by @2013xile

- **[工作流：审批]**
  - 修复撤回后关系数据不全的问题 by @mytharcher

  - 移除因更新 schema 造成超时的事务 by @mytharcher

  - 修复审批被删除后的页面报错 by @mytharcher

  - 修复提交审批修改关系字段的参数 by @mytharcher

## [v1.7.19](https://github.com/nocobase/nocobase/compare/v1.7.18...v1.7.19) - 2025-07-03

### 🚀 优化

- **[database]** 支持从环境变量配置连接池的选项 ([#7133](https://github.com/nocobase/nocobase/pull/7133)) by @mytharcher

- **[工作流]**
  - 排除 JSON 字段加载以改进执行计划列表加载性能 ([#7138](https://github.com/nocobase/nocobase/pull/7138)) by @mytharcher

  - 为节点测试运行增加日志 API ([#7129](https://github.com/nocobase/nocobase/pull/7129)) by @mytharcher

- **[多应用管理器]** 多应用管理支持筛选操作 ([#7124](https://github.com/nocobase/nocobase/pull/7124)) by @katherinehhh

- **[工作流：审批]** 将时间线中的时间调整为绝对时间 by @mytharcher

### 🐛 修复

- **[client]**
  - 在连接视图中设置字段显示名称（displayName）未生效的问题 ([#7130](https://github.com/nocobase/nocobase/pull/7130)) by @aaaaaajie

  - 修复详情区块中子表格设置背景颜色时样式重复的问题 ([#7144](https://github.com/nocobase/nocobase/pull/7144)) by @katherinehhh

  - 工作流人工节点的 UI 配置，设置联动规则不能选择当前表单变量 ([#7125](https://github.com/nocobase/nocobase/pull/7125)) by @zhangzhonghe

  - 修复 编辑表单中子表格的关系字段设置的默认值覆盖已有数据的问题 ([#7120](https://github.com/nocobase/nocobase/pull/7120)) by @katherinehhh

  - 修复表单中的 Markdown 字段未能实时显示 $nForm 变量内容 ([#7147](https://github.com/nocobase/nocobase/pull/7147)) by @katherinehhh

  - 对基于 'x-acl-action' 的表单配置项容错 ([#7128](https://github.com/nocobase/nocobase/pull/7128)) by @mytharcher

- **[utils]** 修复使用 Exact day 变量过滤 DateOnly 或 Datetime (without time zone) 字段时筛选错误的问题 ([#7113](https://github.com/nocobase/nocobase/pull/7113)) by @katherinehhh

- **[工作流]** 修复循环引用导致的报错 ([#7134](https://github.com/nocobase/nocobase/pull/7134)) by @mytharcher

- **[密码策略]** 支持永久锁定用户 by @2013xile

- **[工作流：子流程]** 修复集群模式下的问题 by @mytharcher

- **[工作流：审批]**
  - 从申请列表的筛选项中移除不可筛选的字段 by @mytharcher

  - 补充表单的布局配置项 by @mytharcher

## [v1.7.18](https://github.com/nocobase/nocobase/compare/v1.7.17...v1.7.18) - 2025-06-26

### 🚀 优化

- **[工作流]** 优化移动端样式 ([#7040](https://github.com/nocobase/nocobase/pull/7040)) by @mytharcher

- **[公开表单]** 优化公开表单中日期组件的性能 ([#7117](https://github.com/nocobase/nocobase/pull/7117)) by @zhangzhonghe

### 🐛 修复

- **[工作流]** 修复待办中心加载记录的参数 ([#7123](https://github.com/nocobase/nocobase/pull/7123)) by @mytharcher

- **[WEB 客户端]** 修复设置角色菜单权限后页面下区块不显示的问题 ([#7112](https://github.com/nocobase/nocobase/pull/7112)) by @aaaaaajie

- **[工作流：审批]**
  - 修复审批触发器中申请人变量名的问题 by @mytharcher

  - 修复移动端样式 by @mytharcher

  - 修复审批关联表被删除后的报错 by @mytharcher

## [v1.7.17](https://github.com/nocobase/nocobase/compare/v1.7.16...v1.7.17) - 2025-06-23

### 🐛 修复

- **[client]**
  - 修复日期字段在含时间格式下的范围约束错误 ([#7107](https://github.com/nocobase/nocobase/pull/7107)) by @katherinehhh

  - URL 查询参数变量为空时，数据范围的条件没有被移除 ([#7104](https://github.com/nocobase/nocobase/pull/7104)) by @zhangzhonghe

- **[移动端]** 修复移动端弹窗的层级问题 ([#7110](https://github.com/nocobase/nocobase/pull/7110)) by @zhangzhonghe

- **[日历]** 修复日历区块快速创建事项时，表单日期字段异常问题 ([#7106](https://github.com/nocobase/nocobase/pull/7106)) by @katherinehhh

## [v1.7.16](https://github.com/nocobase/nocobase/compare/v1.7.15...v1.7.16) - 2025-06-19

### 🐛 修复

- **[工作流]**
  - 修复已执行数在大整型数时检查错误的问题 ([#7099](https://github.com/nocobase/nocobase/pull/7099)) by @mytharcher

  - 修复统计数据被不是主版本的工作流级联删除的问题 ([#7103](https://github.com/nocobase/nocobase/pull/7103)) by @mytharcher

- **[操作：导入记录]** 修复批量导入用户名和密码后无法登录的问题 ([#7076](https://github.com/nocobase/nocobase/pull/7076)) by @aaaaaajie

- **[工作流：审批]** 限制只有参与者可以查看审批详情 by @mytharcher

## [v1.7.15](https://github.com/nocobase/nocobase/compare/v1.7.14...v1.7.15) - 2025-06-18

### 🐛 修复

- **[client]**
  - 对每个字段使用独立的变量范围 ([#7012](https://github.com/nocobase/nocobase/pull/7012)) by @mytharcher

  - 字段赋值：关系字段无法被清空数据 ([#7086](https://github.com/nocobase/nocobase/pull/7086)) by @zhangzhonghe

  - 表格列的文本对齐功能无效 ([#7094](https://github.com/nocobase/nocobase/pull/7094)) by @zhangzhonghe

- **[工作流]** 修复已执行数在大整型数时检查错误的问题 ([#7091](https://github.com/nocobase/nocobase/pull/7091)) by @mytharcher

- **[文件管理器]** 修复审批处理中附件字段无法被更新的问题 ([#7093](https://github.com/nocobase/nocobase/pull/7093)) by @mytharcher

- **[工作流：审批]** 使用比较代替隐式逻辑以避免类型问题 by @mytharcher

## [v1.7.14](https://github.com/nocobase/nocobase/compare/v1.7.13...v1.7.14) - 2025-06-17

### 🚀 优化

- **[client]** 网格卡片区块操作栏为空时自动隐藏 ([#7069](https://github.com/nocobase/nocobase/pull/7069)) by @zhangzhonghe

- **[验证]** 移除 `verifiers:listByUser` 接口中响应的认证器配置信息 ([#7090](https://github.com/nocobase/nocobase/pull/7090)) by @2013xile

### 🐛 修复

- **[database]** 修复 updateOrCreate 和 firstOrCreate 不支持关系更新的问题 ([#7088](https://github.com/nocobase/nocobase/pull/7088)) by @chenos

- **[client]**
  - 修复公开表单字段默认值中 URL 查询参数变量无效的问题 ([#7084](https://github.com/nocobase/nocobase/pull/7084)) by @katherinehhh

  - 修复 子表格列字段 style 条件判断无效的问题 ([#7083](https://github.com/nocobase/nocobase/pull/7083)) by @katherinehhh

  - 筛选表单中，通过关系表字段筛选无效 ([#7070](https://github.com/nocobase/nocobase/pull/7070)) by @zhangzhonghe

- **[数据表字段：多对多 (数组)]** 存在 `updatedBy` 字段的时，更新多对多（数组）字段报错 ([#7089](https://github.com/nocobase/nocobase/pull/7089)) by @2013xile

- **[公开表单]** 公开表单：修复提交表单时报无权限的问题 ([#7085](https://github.com/nocobase/nocobase/pull/7085)) by @zhangzhonghe

## [v1.7.13](https://github.com/nocobase/nocobase/compare/v1.7.12...v1.7.13) - 2025-06-17

### 🚀 优化

- **[client]** Logo 容器宽度根据内容类型自适应（图片固定 168px，文本自动宽度） ([#7075](https://github.com/nocobase/nocobase/pull/7075)) by @Cyx649312038

- **[工作流：审批]** 为转签、加签的人员选择列表增加额外字段显示的配置项 by @mytharcher

### 🐛 修复

- **[client]**
  - 修复子表格字段切换页面后必填提示不消失的问题 ([#7080](https://github.com/nocobase/nocobase/pull/7080)) by @katherinehhh

  - 修复金额字段组件从掩码改为数字后小数点丢失的问题 ([#7077](https://github.com/nocobase/nocobase/pull/7077)) by @katherinehhh

  - 修复子表格中 Markdown（Vditor）字段组件渲染不正确的问题 ([#7074](https://github.com/nocobase/nocobase/pull/7074)) by @katherinehhh

- **[数据表字段：自动编码]** 修复基于字符串的大整数序列计算 ([#7079](https://github.com/nocobase/nocobase/pull/7079)) by @mytharcher

- **[备份管理器]** windows 平台下，还原 MySQL 应用时提示无法识别的命令错误 by @gchust

## [v1.7.12](https://github.com/nocobase/nocobase/compare/v1.7.11...v1.7.12) - 2025-06-16

### 🚀 优化

- **[client]** checkbox 字段联动条件判断支持 "为空”和“不为空” ([#7073](https://github.com/nocobase/nocobase/pull/7073)) by @katherinehhh

### 🐛 修复

- **[client]** 创建反向关系字段后，编辑关系字段设置项“在目标数据表里创建反向关系字段”未勾选 ([#6914](https://github.com/nocobase/nocobase/pull/6914)) by @aaaaaajie

- **[数据源管理]** 修改权限的数据范围后，相关角色同步生效 ([#7065](https://github.com/nocobase/nocobase/pull/7065)) by @aaaaaajie

- **[权限控制]** 修复了在没有默认角色时无法进入应用的问题 ([#7059](https://github.com/nocobase/nocobase/pull/7059)) by @aaaaaajie

- **[工作流：自定义操作事件]** 修复操作成功后配置中的重定向链接变量未解析的问题 by @mytharcher

## [v1.7.11](https://github.com/nocobase/nocobase/compare/v1.7.10...v1.7.11) - 2025-06-15

### 🎉 新特性

- **[文本复制]** 支持一键复制文本字段内容 ([#6954](https://github.com/nocobase/nocobase/pull/6954)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 关系字段数据选择器提交后未清空选中数据 ([#7067](https://github.com/nocobase/nocobase/pull/7067)) by @katherinehhh

  - 修复上传组件的大小提示文字 ([#7057](https://github.com/nocobase/nocobase/pull/7057)) by @mytharcher

- **[server]** Cannot read properties of undefined (reading 'setMaaintainingMessage') ([#7064](https://github.com/nocobase/nocobase/pull/7064)) by @chenos

- **[工作流：循环节点]** 修复循环分支在条件未满足时仍然执行的问题 ([#7063](https://github.com/nocobase/nocobase/pull/7063)) by @mytharcher

- **[工作流：审批]**
  - 修复待办统计在执行计划取消后未更新的问题 by @mytharcher

  - 修复触发器变量中按类型过滤的缺陷 by @mytharcher

## [v1.7.10](https://github.com/nocobase/nocobase/compare/v1.7.9...v1.7.10) - 2025-06-12

### 🐛 修复

- **[client]**
  - 修复联动规则卡死的问题 ([#7050](https://github.com/nocobase/nocobase/pull/7050)) by @zhangzhonghe

  - 修复：在 APIClient 中添加可选链以避免 handler 未定义时报错 ([#7054](https://github.com/nocobase/nocobase/pull/7054)) by @sheldon66

  - 修复二级弹窗配置表单字段时自动关闭弹窗的问题 ([#7052](https://github.com/nocobase/nocobase/pull/7052)) by @katherinehhh

- **[数据可视化]** 修复图表区块中筛选表单的日期字段设置为“介于”时组件未正确显示的问题 ([#7051](https://github.com/nocobase/nocobase/pull/7051)) by @katherinehhh

- **[API 文档]** 非 NocoBase 官方插件无法展示API文档 ([#7045](https://github.com/nocobase/nocobase/pull/7045)) by @chenzhizdt

- **[操作：导入记录]** 导入 xlsx 禁止多行文本字段插入非字符串格式数据 ([#7049](https://github.com/nocobase/nocobase/pull/7049)) by @aaaaaajie

## [v1.7.9](https://github.com/nocobase/nocobase/compare/v1.7.8...v1.7.9) - 2025-06-11

### 🐛 修复

- **[client]** 修复区块报错的问题 ([#7048](https://github.com/nocobase/nocobase/pull/7048)) by @gchust

## [v1.7.8](https://github.com/nocobase/nocobase/compare/v1.7.6...v1.7.8) - 2025-06-10

### 🎉 新特性

- **[审计日志]** 添加环境变量 `AUDIT_LOGGER_TRANSPORT` 来控制日志输出方式 by @2013xile

### 🚀 优化

- **[日历]** 支持设置日历区块的周起始日（周日或周一） ([#7032](https://github.com/nocobase/nocobase/pull/7032)) by @katherinehhh

- **[数据表字段：多对多 (数组)]** 修复数据表中 many-to-many(many) 字段的权限错误 ([#7028](https://github.com/nocobase/nocobase/pull/7028)) by @aaaaaajie

### 🐛 修复

- **[client]**
  - 修复二级弹窗配置表单字段时自动关闭弹窗的问题 ([#7042](https://github.com/nocobase/nocobase/pull/7042)) by @katherinehhh

  - 修复筛选表单中联动规则设置下拉选项字段的 options 不生效问题 ([#7035](https://github.com/nocobase/nocobase/pull/7035)) by @katherinehhh

  - 筛选表单的验证规则会导致筛选按钮无效 ([#6975](https://github.com/nocobase/nocobase/pull/6975)) by @zhangzhonghe

  - 修复区块模板中因重复接口请求而导致的字段不显示问题 ([#6985](https://github.com/nocobase/nocobase/pull/6985)) by @zhangzhonghe

- **[操作：导入记录]** 修复子表导入关联字段报错的问题 ([#7039](https://github.com/nocobase/nocobase/pull/7039)) by @aaaaaajie

- **[数据可视化]** 复选框字段在图表中应该显示标签值而不是原始值 ([#7033](https://github.com/nocobase/nocobase/pull/7033)) by @2013xile

- **[工作流]** 修复触发器未正确配置时手动执行的报错 ([#7036](https://github.com/nocobase/nocobase/pull/7036)) by @mytharcher

- **[工作流：审批]**
  - 避免未找到字段报错 by @mytharcher

  - 修复刷新审批内容详情页时 API 报错 by @mytharcher

- **[企业微信]** 网关中间件增加回调路径判断 by @2013xile

## [v1.7.6](https://github.com/nocobase/nocobase/compare/v1.7.5...v1.7.6) - 2025-06-09

### 🚀 优化

- **[client]** 禁止将一个分组菜单移动到自己内部 ([#7005](https://github.com/nocobase/nocobase/pull/7005)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 修复了区块读取外部数据源视图数据时报错的问题。 ([#7017](https://github.com/nocobase/nocobase/pull/7017)) by @aaaaaajie

  - 修复筛选区块参数错误的问题 ([#6966](https://github.com/nocobase/nocobase/pull/6966)) by @zhangzhonghe

  - 在联动规则中使用“当前对象”变量无效 ([#7008](https://github.com/nocobase/nocobase/pull/7008)) by @zhangzhonghe

  - 用联动规则无法清除子表格的必填标志 ([#7022](https://github.com/nocobase/nocobase/pull/7022)) by @zhangzhonghe

- **[undefined]** 修复将 possibleTypes 从数据库固定值改为动态配置，解决应用升级后兼容性问题 by @aaaaaajie

- **[移动端]** 优化移动端弹窗卡顿的问题 ([#7029](https://github.com/nocobase/nocobase/pull/7029)) by @zhangzhonghe

- **[数据源管理]** 修复将 possibleTypes 从数据库固定值改为动态配置，解决应用升级后兼容性问题 ([#7019](https://github.com/nocobase/nocobase/pull/7019)) by @aaaaaajie

- **[操作：导入记录]** 修复导入XLSX树表格数据时批量编辑报错 ([#7013](https://github.com/nocobase/nocobase/pull/7013)) by @aaaaaajie

- **[工作流]** 修复工作流不存在时的页面报错 ([#7023](https://github.com/nocobase/nocobase/pull/7023)) by @mytharcher

- **[工作流：JavaScript 节点]** 修复相对路径引入包失败的问题 by @mytharcher

- **[工作流：审批]**
  - 修复工作流删除之后报错的问题 by @mytharcher

  - 审批详情中重新加载文件数据以避免链接失效 by @mytharcher

  - 修复触发器提供的变量 by @mytharcher

## [v1.7.5](https://github.com/nocobase/nocobase/compare/v1.7.4...v1.7.5) - 2025-06-07

### 🐛 修复

- **[client]** 对每个字段使用独立的变量范围 ([#7012](https://github.com/nocobase/nocobase/pull/7012)) by @mytharcher

- **[database]** 修复导入xlsx功能缺失的创建人和最后更新人字段 ([#7011](https://github.com/nocobase/nocobase/pull/7011)) by @aaaaaajie

- **[工作流]** 修复数据表事件在新增或更新模式时，新增的数据不包含改变的字段导致不触发的问题 ([#7015](https://github.com/nocobase/nocobase/pull/7015)) by @mytharcher

- **[操作：导出记录 Pro]** 修复在带条件导出附件时报错。 by @aaaaaajie

## [v1.7.4](https://github.com/nocobase/nocobase/compare/v1.7.3...v1.7.4) - 2025-06-06

### 🐛 修复

- **[client]**
  - 关系字段阅读模式下 hover 时出现子表格和子表单 ([#7002](https://github.com/nocobase/nocobase/pull/7002)) by @zhangzhonghe

  - 修复弹窗按钮中的 Markdown 区块联动规则不生效的问题 ([#7007](https://github.com/nocobase/nocobase/pull/7007)) by @katherinehhh

- **[本地化]** 修复词条为空导致的报错 ([#7010](https://github.com/nocobase/nocobase/pull/7010)) by @2013xile

- **[异步任务管理器]** 修复异步导入多次执行缺陷 ([#7006](https://github.com/nocobase/nocobase/pull/7006)) by @aaaaaajie

- **[操作：导出记录 Pro]** 修复异步导入多次执行缺陷 by @aaaaaajie

- **[工作流：审批]** 修复转签后其他人通过的审批无法继续的问题 by @mytharcher

## [v1.7.3](https://github.com/nocobase/nocobase/compare/v1.7.2...v1.7.3) - 2025-06-06

### 🚀 优化

- **[工作流]** 支持使用更多字段筛选工作流 ([#6995](https://github.com/nocobase/nocobase/pull/6995)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复弹窗详情区块子表格翻页触发未保存提示的问题 ([#7004](https://github.com/nocobase/nocobase/pull/7004)) by @katherinehhh

  - 修复字段赋值组件赋值变量时未显示字段标题 ([#7001](https://github.com/nocobase/nocobase/pull/7001)) by @katherinehhh

  - 修复字段样式联动规则设置不生效的问题 ([#7003](https://github.com/nocobase/nocobase/pull/7003)) by @katherinehhh

## [v1.7.2](https://github.com/nocobase/nocobase/compare/v1.7.1...v1.7.2) - 2025-06-05

### 🚀 优化

- **[操作：批量编辑]** 在选择模式下使用 `filterByTk` 代替 `filter` 作为筛选参数 ([#6994](https://github.com/nocobase/nocobase/pull/6994)) by @mytharcher

- **[操作：导入记录 Pro]** 优化导入xlsx文件在处理超大数据量（高行列数）时的内存耗尽，系统卡死或崩溃 by @aaaaaajie

### 🐛 修复

- **[client]**
  - 修复字段赋值组件中字段标题未显示的问题 ([#6987](https://github.com/nocobase/nocobase/pull/6987)) by @katherinehhh

  - 移动菜单的列表中，选不到最后一个菜单 ([#6997](https://github.com/nocobase/nocobase/pull/6997)) by @zhangzhonghe

- **[工作流]**
  - 修复筛选组件在切换分组选项卡时不更新的问题 ([#6989](https://github.com/nocobase/nocobase/pull/6989)) by @mytharcher

  - 修复工作流统计数据未自动生成的问题 ([#6993](https://github.com/nocobase/nocobase/pull/6993)) by @mytharcher

## [v1.7.1](https://github.com/nocobase/nocobase/compare/v1.7.0...v1.7.1) - 2025-06-04

### 🎉 新特性

- **[数据可视化]** 在图表转换配置中支持乘法和除法 ([#6788](https://github.com/nocobase/nocobase/pull/6788)) by @bugstark

### 🚀 优化

- **[公开表单]** 支持使用 URL 参数作为变量 ([#6973](https://github.com/nocobase/nocobase/pull/6973)) by @mytharcher

### 🐛 修复

- **[client]** 修复区块模板中因重复接口请求而导致的字段不显示问题 ([#6957](https://github.com/nocobase/nocobase/pull/6957)) by @zhangzhonghe

- **[工作流：人工处理节点]** 修复外部数据源导致初始化区块报错的问题 ([#6983](https://github.com/nocobase/nocobase/pull/6983)) by @mytharcher

## [v1.7.0](https://github.com/nocobase/nocobase/compare/v1.6.38...v1.7.0) - 2025-06-03

## 新特性

### 用户角色并集

角色并集是一种权限管理模式，根据系统设置，系统开发者可以选择使用独立角色、允许角色并集，或者仅使用角色并集，以满足不同的权限需求。

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

参考文档：[角色并集](https://docs-cn.nocobase.com/handbook/acl/manual)

### 验证管理与双因素身份认证（2FA）

验证码功能已升级为验证管理，支持多种身份验证方式（如 TOTP），用户可绑定验证方式，在需要时完成身份验证。系统还支持双因素认证（2FA），登录时需在密码基础上额外验证，有效提升账户安全。

![20250603133219_rec_-vg5hh3.gif](https://static-docs.nocobase.com/20250603133219_rec_-vg5hh3.gif)

参考文档：

* [验证管理](https://docs-cn.nocobase.com/handbook/verification)
* [双因素身份认证](https://docs-cn.nocobase.com/handbook/two-factor-authentication)
* [TOTP 认证器](https://docs-cn.nocobase.com/handbook/verification-totp-authenticator)

### 模板打印

文档模板支持动态图片和条形码渲染功能。

![](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

参考文档：[模版打印](https://docs-cn.nocobase.com/handbook/action-template-print#%E5%9C%A8-docx-%E6%96%87%E4%BB%B6%E4%B8%AD%E6%8F%92%E5%85%A5%E5%8A%A8%E6%80%81%E5%9B%BE%E7%89%87)

### 多关键词筛选

多关键词筛选插件为 NocoBase 平台增加了强大的文本筛选功能，让您能够使用多个关键词进行筛选，大大提高了数据查询的灵活性和效率。

![20250603152726_rec_-ix3j8w.gif](https://static-docs.nocobase.com/20250603152726_rec_-ix3j8w.gif)

参考文档：[多关键词筛选](https://docs-cn.nocobase.com/handbook/multi-keyword-filter)

### 日期筛选支持选择相对时间范围

支持按自定义时间偏移（天/周/月/季度/年）和指定日期进行筛选，满足更灵活的时间范围查询需求。

![20250603130948_rec_-plwa6o.gif](https://static-docs.nocobase.com/20250603130948_rec_-plwa6o.gif)

### 联动规则条件左侧支持变量

条件左侧变量用于定义联动规则中“判断的对象”，即基于该变量的值来进行条件判断，从而决定是否触发联动行为。

![20250417214217](https://static-docs.nocobase.com/20250417214217.png)

参考文档：[左侧变量](https://docs-cn.nocobase.com/handbook/ui/linkage-rule#%E5%B7%A6%E4%BE%A7%E5%8F%98%E9%87%8F)

### 区块继承模板

继承模板主要适用于希望区块能跟随模板的基础更新，但也需要做一些自己的调整的场景。通过继承模板创建的区块，会继承模板的配置，并能在此基础上进行扩展或覆盖。未被区块覆盖的配置会随模板更新而同步。

![主界面](https://static-docs.nocobase.com/main-screen-block-templates.png)

参考文档：[继承模版](https://docs-cn.nocobase.com/handbook/block-template#%E7%BB%A7%E6%89%BF%E6%A8%A1%E6%9D%BF)

### 区块联动规则

支持在区块中配置联动规则，实现动态显示区块。

![image-ccerr7.png](https://static-docs.nocobase.com/image-ccerr7.png)

参考文档：[区块联动规则](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/block-linkage-rule)

### 提交成功后

支持刷新其它区块的数据，支持带参数数跳转详情页。

![image-v29vlv.png](https://static-docs.nocobase.com/image-v29vlv.png)

参考文档：[提交成功后](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/affter-successful)

### 工作流分类管理

![1-62ogb6.png](https://static-docs.nocobase.com/1-62ogb6.png)

### 部门和附件 URL 插件开源

![image-br8u55.png](https://static-docs.nocobase.com/image-br8u55.png)

## 优化

### 联动规则属性优化

* 选择类型字段支持设置可选项属性
* 日期类型字段支持设置日期范围

![20250603143237_rec_-k8hene.gif](https://static-docs.nocobase.com/20250603143237_rec_-k8hene.gif)

参考文档：[字段联动规则](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/field-linkage-rule)

### 导入记录Pro

导入配置支持多字段定唯一记录，支持设置空白单元格覆盖和忽略模式。

![20250603153457_rec_-9zfsfx.gif](https://static-docs.nocobase.com/20250603153457_rec_-9zfsfx.gif)

参考文档：[导入 Pro](https://docs-cn.nocobase.com/handbook/action-import-pro)

### 导出xlsx性能优化

* 导出大数据表内存溢出应用卡死
* 导出有概率出现重复数据
* 导出数据按索引、唯一约束、索引策略查询优化
* 新增导出并发队列和环境变量设置并发数
  ![20250505171706](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250505171706.png)

参考文档：

- [并发导出](https://docs-cn.nocobase.com/handbook/action-export-pro#%E5%B9%B6%E5%8F%91%E5%AF%BC%E5%87%BA)
- [关于性能](https://docs-cn.nocobase.com/handbook/action-export-pro#%E5%85%B3%E4%BA%8E%E6%80%A7%E8%83%BD)

### 导入xlsx性能优化

* 导入策略由原来单条改为批量插入
* 重构重复标识，单条改为批量，更新逻辑，触发工作流等逻辑不变

参考文档：[关于性能](https://docs-cn.nocobase.com/handbook/action-import-pro#%E5%85%B3%E4%BA%8E%E6%80%A7%E8%83%BD)

### 工作流执行效率提升 100%

![image-va9ose.png](https://static-docs.nocobase.com/image-va9ose.png)

## [v1.6.38](https://github.com/nocobase/nocobase/compare/v1.6.37...v1.6.38) - 2025-06-03

### 🐛 修复

- **[client]**
  - 修复在弹窗中创建的区块，其数据表错误的问题 ([#6961](https://github.com/nocobase/nocobase/pull/6961)) by @zhangzhonghe

  - 修复子页面中筛选表单默认值无效的问题 ([#6960](https://github.com/nocobase/nocobase/pull/6960)) by @zhangzhonghe

  - 修复角色数据表自定义范围中外部数据源无法展开关系表字段的问题 ([#6958](https://github.com/nocobase/nocobase/pull/6958)) by @katherinehhh

  - 修复“省略超出长度的内容”选项对关系字段无效的问题 ([#6967](https://github.com/nocobase/nocobase/pull/6967)) by @zhangzhonghe

  - 修复单行文本字段阅读模式下，值会显示成一个数组的问题 ([#6968](https://github.com/nocobase/nocobase/pull/6968)) by @zhangzhonghe

- **[用户认证]** 因清理过期token导致的性能问题 ([#6981](https://github.com/nocobase/nocobase/pull/6981)) by @2013xile

- **[文件管理器]** 修复阿里云 OSS 超时配置项 ([#6970](https://github.com/nocobase/nocobase/pull/6970)) by @mytharcher

- **[工作流：自定义操作事件]** 修复工作台的初始化按钮 by @mytharcher

- **[认证：OIDC]** 登录按钮标题的本地化翻译不生效 by @2013xile

## [v1.6.37](https://github.com/nocobase/nocobase/compare/v1.6.36...v1.6.37) - 2025-05-30

### 🐛 修复

- **[client]**
  - 修复筛选按钮下拉列表的字段顺序 ([#6962](https://github.com/nocobase/nocobase/pull/6962)) by @zhangzhonghe

  - 修复编辑表单中子表格联动规则在清空关系字段后触发请求，未使用表单实时值计算值 ([#6963](https://github.com/nocobase/nocobase/pull/6963)) by @katherinehhh

  - 修复子表格中使用当前对象关系字段值作为变量值时，当关系字段值为空会发起请求的问题 ([#6969](https://github.com/nocobase/nocobase/pull/6969)) by @katherinehhh

- **[主题编辑器]** 隐藏主题切换选项，和修复弹窗样式 ([#6964](https://github.com/nocobase/nocobase/pull/6964)) by @zhangzhonghe

- **[工作流：审批]** 修复转签加签时带关系条件的人员范围查询报错问题 by @mytharcher

## [v1.6.36](https://github.com/nocobase/nocobase/compare/v1.6.35...v1.6.36) - 2025-05-29

### 🚀 优化

- **[认证：OIDC]** 按邮箱绑定用户时忽略大小写 by @2013xile

## [v1.6.35](https://github.com/nocobase/nocobase/compare/v1.6.34...v1.6.35) - 2025-05-29

### 🎉 新特性

- **[undefined]**
  - 新增"输入框复制按钮"插件，为单行文本字段提供一键复制功能 ([#6894](https://github.com/nocobase/nocobase/pull/6894)) by @kerwin612

  - 新增"输入框复制按钮"插件，为单行文本字段提供一键复制功能 ([#6894](https://github.com/nocobase/nocobase/pull/6894)) by @kerwin612

  - 新增gitpod的支持，可以一键启动开发环境，快速开始开发 ([#6922](https://github.com/nocobase/nocobase/pull/6922)) by @kerwin612

### 🚀 优化

- **[client]**
  - 解决表单隐藏控件也捕获了tab键的问题，极大提高了表单操作效率 ([#6942](https://github.com/nocobase/nocobase/pull/6942)) by @kerwin612

  - 菜单链接支持配置是否在新窗口打开 ([#6918](https://github.com/nocobase/nocobase/pull/6918)) by @katherinehhh

  - 弹出二次确认对话框之前先验证字段必填项 ([#6931](https://github.com/nocobase/nocobase/pull/6931)) by @katherinehhh

### 🐛 修复

- **[client]**
  - 关系字段下拉请求数据按 200 条分页 ([#6950](https://github.com/nocobase/nocobase/pull/6950)) by @katherinehhh

  - 修复拖拽表格行时高亮位置不正确的问题 ([#6952](https://github.com/nocobase/nocobase/pull/6952)) by @chenos

  - 区块拖拽调整宽度失效 ([#6944](https://github.com/nocobase/nocobase/pull/6944)) by @chenos

  - 字段赋值组件多语言不生效 ([#6945](https://github.com/nocobase/nocobase/pull/6945)) by @katherinehhh

  - 修复错误弹窗里的复制按钮复制出来是[object Object]的问题 ([#6908](https://github.com/nocobase/nocobase/pull/6908)) by @kerwin612

- **[数据表字段：Markdown(Vditor)]** 修复 markdown-vditor 组件缩放后宽度异常 ([#6946](https://github.com/nocobase/nocobase/pull/6946)) by @katherinehhh

- **[工作流：审批]** 修复语言 by @mytharcher

## [v1.6.34](https://github.com/nocobase/nocobase/compare/v1.6.33...v1.6.34) - 2025-05-27

### 🎉 新特性

- **[操作：导入记录 Pro]**
  - 导入配置支持多字段定唯一记录 by @aaaaaajie

  - 导入配置支持设置空白单元格覆盖和忽略模式 by @aaaaaajie

### 🚀 优化

- **[undefined]** CI 环境升级 Node 版本至 20 ([#6927](https://github.com/nocobase/nocobase/pull/6927)) by @mytharcher

### 🐛 修复

- **[client]**
  - 联动规则条件不包含任意一个判断逻辑错误 ([#6934](https://github.com/nocobase/nocobase/pull/6934)) by @katherinehhh

  - 区块高度设置未实时生效 ([#6904](https://github.com/nocobase/nocobase/pull/6904)) by @katherinehhh

- **[undefined]** 根据 commander 包的需求改用 Node 20 版本 ([#6924](https://github.com/nocobase/nocobase/pull/6924)) by @mytharcher

- **[database]** 修复在多对多关系中，UUID 或nanoid 自动生成功能无法正常工作 ([#6912](https://github.com/nocobase/nocobase/pull/6912)) by @aaaaaajie

- **[操作：导出记录]** 修复导出嵌套关系时失败的问题。 ([#6917](https://github.com/nocobase/nocobase/pull/6917)) by @aaaaaajie

- **[数据源管理]** 解决无法拖拽排序的问题 ([#6937](https://github.com/nocobase/nocobase/pull/6937)) by @chenos

- **[API 文档]** 补全 req.headers 中的子应用信息 ([#6933](https://github.com/nocobase/nocobase/pull/6933)) by @chenos

- **[通知：站内信]** 修复了在应用内消息中“全部标为已读”操作可能影响其他用户数据的问题。 ([#6926](https://github.com/nocobase/nocobase/pull/6926)) by @sheldon66

- **[工作流：自定义操作事件]** 避免插件加载顺序导致的错误 by @mytharcher

- **[文件存储：S3 (Pro)]**
  - 修复预览地址和上传参数 by @mytharcher

  - 修复重复的上传参数 by @mytharcher

- **[区块：分步表单]** 修复类型错误 by @mytharcher

- **[工作流：审批]**
  - 修复查看我的申请详情中 id 取值问题 by @mytharcher

  - 修复提交审批前 appends 和提交数据的计算 by @mytharcher

## [v1.6.33](https://github.com/nocobase/nocobase/compare/v1.6.32...v1.6.33) - 2025-05-23

### 🚀 优化

- **[undefined]** 构建 Full 版本 Docker 镜像 ([#6898](https://github.com/nocobase/nocobase/pull/6898)) by @chenos

- **[client]** 优化页面越用越卡的问题 ([#6888](https://github.com/nocobase/nocobase/pull/6888)) by @zhangzhonghe

- **[日历]** 日历区块支持配置刷新按钮 ([#6920](https://github.com/nocobase/nocobase/pull/6920)) by @katherinehhh

- **[工作流：自定义操作事件]** 基于中文语言的字典表修复英文翻译 by @mytharcher

- **[工作流：审批]** 支持在待办中心处理所有待办任务 by @mytharcher

### 🐛 修复

- **[client]**
  - 添加关联字段时因 style 字段格式导致的渲染报错 ([#6903](https://github.com/nocobase/nocobase/pull/6903)) by @katherinehhh

  - 联动规则中对多关系字段的为空判断不正确 ([#6905](https://github.com/nocobase/nocobase/pull/6905)) by @katherinehhh

- **[数据表字段：Markdown(Vditor)]** Markdown（Vditor）字段未适配主题 ([#6919](https://github.com/nocobase/nocobase/pull/6919)) by @katherinehhh

- **[数据表：树]** 更新路径表的时候避免由于匹配到相似前缀，导致错误更新 ([#6913](https://github.com/nocobase/nocobase/pull/6913)) by @2013xile

- **[文件管理器]**
  - 修复文件预览 URL 的生成匹配规则 ([#6902](https://github.com/nocobase/nocobase/pull/6902)) by @mytharcher

  - 修复前端文件表注入和上传文件参数 ([#6909](https://github.com/nocobase/nocobase/pull/6909)) by @mytharcher

  - 修复非图片文件的预览地址 ([#6889](https://github.com/nocobase/nocobase/pull/6889)) by @mytharcher

- **[工作流：邮件发送节点]** 处理未定义的 'to' 字段并优化邮件收件人处理。 ([#6915](https://github.com/nocobase/nocobase/pull/6915)) by @sheldon66

- **[工作流：自定义操作事件]**
  - 修复自定义操作按钮点击几次后表现不正常 by @mytharcher

  - 修复错误处理函数无法通过类匹配的问题 by @mytharcher

- **[工作流：审批]** 修复关系追加参数计算 by @mytharcher

## [v1.6.32](https://github.com/nocobase/nocobase/compare/v1.6.31...v1.6.32) - 2025-05-20

### 🐛 修复

- **[client]**
  - 删除表格数据后分页未正确跳转 ([#6892](https://github.com/nocobase/nocobase/pull/6892)) by @katherinehhh

  - 关系字段使用级联组件时，在弹窗首次打开未显示数据 ([#6886](https://github.com/nocobase/nocobase/pull/6886)) by @katherinehhh

## [v1.6.31](https://github.com/nocobase/nocobase/compare/v1.6.30...v1.6.31) - 2025-05-18

### 🚀 优化

- **[工作流]** 补全英文语言内容 ([#6885](https://github.com/nocobase/nocobase/pull/6885)) by @mytharcher

### 🐛 修复

- **[database]** 处理导入字段是字符串类型的空白单元格报错 ([#6880](https://github.com/nocobase/nocobase/pull/6880)) by @aaaaaajie

- **[client]**
  - 添加关联表格时未全部过滤已关联的数据 ([#6874](https://github.com/nocobase/nocobase/pull/6874)) by @katherinehhh

  - 子表单中放出关联字段时未提交关联数据 ([#6883](https://github.com/nocobase/nocobase/pull/6883)) by @katherinehhh

  - 拖拽排序字段未正确显示所有可选字段 ([#6875](https://github.com/nocobase/nocobase/pull/6875)) by @katherinehhh

- **[工作流]** 修复循环触发限制更新后数据表事件触发不正确 ([#6876](https://github.com/nocobase/nocobase/pull/6876)) by @mytharcher

- **[区块：操作面板]** 读取扫码器中的路由 basename，以适配桌面端。 ([#6877](https://github.com/nocobase/nocobase/pull/6877)) by @sheldon66

- **[工作流：人工处理节点]** 修复展示未处理待办时的渲染错误 ([#6879](https://github.com/nocobase/nocobase/pull/6879)) by @mytharcher

- **[工作流：审批]** 修复转签和加签时选择指派人的列表加载问题 by @mytharcher

## [v1.6.30](https://github.com/nocobase/nocobase/compare/v1.6.29...v1.6.30) - 2025-05-15

### 🚀 优化

- **[client]** 增加阅读状态图片的内置尺寸选项 ([#6868](https://github.com/nocobase/nocobase/pull/6868)) by @katherinehhh

### 🐛 修复

- **[文件管理器]**
  - 修复类型 ([#6873](https://github.com/nocobase/nocobase/pull/6873)) by @mytharcher

  - 修复无外键权限时创建文件记录 URL 无效的问题 ([#6863](https://github.com/nocobase/nocobase/pull/6863)) by @mytharcher

- **[操作：导出记录]** 导入导出字段配置中删除字段严重卡顿 ([#6861](https://github.com/nocobase/nocobase/pull/6861)) by @katherinehhh

- **[数据可视化]** 在区块级别操作中打开弹窗，添加图表不显示 ([#6864](https://github.com/nocobase/nocobase/pull/6864)) by @2013xile

- **[操作：导出记录 Pro]** pro 导入导出字段配置中删除字段卡顿 by @katherinehhh

- **[文件存储：S3 (Pro)]** 变更为使用数据表字段来定位存储引擎 by @mytharcher

- **[备份管理器]** 修复编译时的类型错误 by @mytharcher

## [v1.6.29](https://github.com/nocobase/nocobase/compare/v1.6.28...v1.6.29) - 2025-05-13

### 🚀 优化

- **[工作流]** 支持复制任意多版本的草稿 ([#6851](https://github.com/nocobase/nocobase/pull/6851)) by @mytharcher

### 🐛 修复

- **[操作：导出记录]** 导出多级关联关系和附件 URL 时的空值问题。 ([#6845](https://github.com/nocobase/nocobase/pull/6845)) by @aaaaaajie

- **[工作流：人工处理节点]** 修复待办中心计数错误问题 ([#6783](https://github.com/nocobase/nocobase/pull/6783)) by @mytharcher

- **[工作流：测试工具包]** 修复由于缺少必要插件造成失败的测试用例 ([#6839](https://github.com/nocobase/nocobase/pull/6839)) by @mytharcher

- **[数据可视化]** 修复筛选嵌套多对多字段报错 ([#6855](https://github.com/nocobase/nocobase/pull/6855)) by @2013xile

- **[工作流：子流程]** 修复不存在触发器时导致的页面崩溃 by @mytharcher

- **[文件存储：S3 (Pro)]** 访问地址有效期无效 by @jiannx

- **[工作流：审批]** 修复待办中心计数错误问题 by @mytharcher

## [v1.6.28](https://github.com/nocobase/nocobase/compare/v1.6.27...v1.6.28) - 2025-05-09

### 🐛 修复

- **[database]** 导入文本字段是数字值时失败 ([#6699](https://github.com/nocobase/nocobase/pull/6699)) by @aaaaaajie

- **[client]** 被隐藏的字段，依然会显示出来 ([#6844](https://github.com/nocobase/nocobase/pull/6844)) by @zhangzhonghe

- **[操作：导出记录]** 修复导出长文本错误 ([#6713](https://github.com/nocobase/nocobase/pull/6713)) by @aaaaaajie

- **[工作流：操作后事件]** 修复操作后事件中当前操作者变量在 Handlebars 模板中无法访问属性的问题 ([#6837](https://github.com/nocobase/nocobase/pull/6837)) by @mytharcher

- **[区块：操作面板]** 操作面板在暗黑模式下颜色不对 ([#6842](https://github.com/nocobase/nocobase/pull/6842)) by @zhangzhonghe

- **[操作：导出记录 Pro]** 修复导出长文本错误 by @aaaaaajie

## [v1.6.27](https://github.com/nocobase/nocobase/compare/v1.6.26...v1.6.27) - 2025-05-08

### 🐛 修复

- **[client]**
  - 表格行内按钮拖拽时无法将其他按钮拖动至「复制」按钮 ([#6822](https://github.com/nocobase/nocobase/pull/6822)) by @katherinehhh

  - 表单中多个关系字段展示关系表字段时会导致关系字段不提交 ([#6833](https://github.com/nocobase/nocobase/pull/6833)) by @katherinehhh

## [v1.6.26](https://github.com/nocobase/nocobase/compare/v1.6.25...v1.6.26) - 2025-05-07

### 🎉 新特性

- **[区块：iframe]** Iframe 区块支持配置 allow 属性 ([#6824](https://github.com/nocobase/nocobase/pull/6824)) by @zhangzhonghe

- **[模板打印]** 新增：模板打印中 Option 字段支持 `{ label, value }` 结构的下拉选项。 by @sheldon66

### 🐛 修复

- **[client]**
  - 嵌套的子页面中，鼠标悬浮在“创建区块”按钮时不显示区块列表 ([#6832](https://github.com/nocobase/nocobase/pull/6832)) by @zhangzhonghe

  - 当改变筛选表单的关系字段组件为数据选择器时，没有“允许多选”配置项 ([#6656](https://github.com/nocobase/nocobase/pull/6656)) by @zhangzhonghe

  - 表单字段验证规则违反时错误信息多次显示 ([#6805](https://github.com/nocobase/nocobase/pull/6805)) by @katherinehhh

  - 子表格中子表单（弹窗）无法配置联动规则的 ([#6803](https://github.com/nocobase/nocobase/pull/6803)) by @katherinehhh

  - 修复无法在筛选表单中选择一对多字段的子字段作为筛选项的问题 ([#6809](https://github.com/nocobase/nocobase/pull/6809)) by @zhangzhonghe

  - 阅读模式下子表格分页栏被遮住 ([#6830](https://github.com/nocobase/nocobase/pull/6830)) by @katherinehhh

  - 筛选表单中的表格选择器，样式异常 ([#6827](https://github.com/nocobase/nocobase/pull/6827)) by @zhangzhonghe

- **[database]**
  - 修复多对一关系字段在 MariaDB 下外键为大整数配置了 appends 时无法加载的问题 ([#6823](https://github.com/nocobase/nocobase/pull/6823)) by @mytharcher

  - 修复测试用例 ([#6811](https://github.com/nocobase/nocobase/pull/6811)) by @mytharcher

- **[数据表字段：附件（URL）]** 联动规则中附件（URL）字段不应支持配置 value ([#6831](https://github.com/nocobase/nocobase/pull/6831)) by @katherinehhh

- **[工作流：自定义操作事件]** 触发工作流按钮联动规则不正常 by @katherinehhh

## [v1.6.25](https://github.com/nocobase/nocobase/compare/v1.6.24...v1.6.25) - 2025-04-29

### 🎉 新特性

- **[undefined]** 添加 license kit 发包ci ([#6786](https://github.com/nocobase/nocobase/pull/6786)) by @jiannx

- **[数据可视化：EChrats]** 条形图支持“y轴反向”设置 by @2013xile

### 🚀 优化

- **[utils]** 增加筛选按钮字段列表的高度，和对字段进行排序分类 ([#6779](https://github.com/nocobase/nocobase/pull/6779)) by @zhangzhonghe

- **[client]** 优化子表格添加按钮样式，并将分页器与按钮排列在同一行 ([#6790](https://github.com/nocobase/nocobase/pull/6790)) by @katherinehhh

- **[文件管理器]** 增加 OSS 存储引擎的超时时间配置项，且默认为 10 分钟 ([#6795](https://github.com/nocobase/nocobase/pull/6795)) by @mytharcher

- **[密码策略]** 默认密码过期时间修改为不过期 by @2013xile

- **[企业微信]** 更新用户邮箱时优先使用企业邮箱而不是个人邮箱 by @2013xile

### 🐛 修复

- **[client]**
  - 折叠面板区块中，当点击关系字段搜索框的清空按钮后，不应该删除数据范围 ([#6782](https://github.com/nocobase/nocobase/pull/6782)) by @zhangzhonghe

  - 关系字段，在显示关系表下的字段数据时不提交数据 ([#6798](https://github.com/nocobase/nocobase/pull/6798)) by @katherinehhh

  - 禁止将菜单移动到页面 tab 的前面和后面 ([#6777](https://github.com/nocobase/nocobase/pull/6777)) by @zhangzhonghe

  - 表格区块在筛选时重复显示数据 ([#6792](https://github.com/nocobase/nocobase/pull/6792)) by @zhangzhonghe

  - 筛选表单中，切换字段操作符后，刷新页面会报错 ([#6781](https://github.com/nocobase/nocobase/pull/6781)) by @zhangzhonghe

- **[database]**
  - 避免文本类型输入数据不是字符串时的报错 ([#6797](https://github.com/nocobase/nocobase/pull/6797)) by @mytharcher

  - 补充sql collection和view collection 的unavailableActions ([#6765](https://github.com/nocobase/nocobase/pull/6765)) by @katherinehhh

- **[create-nocobase-app]** 回退 mariadb 版本至 2.5.6，解决兼容性问题 ([#6762](https://github.com/nocobase/nocobase/pull/6762)) by @chenos

- **[用户认证]** 不允许修改认证器标识 ([#6808](https://github.com/nocobase/nocobase/pull/6808)) by @2013xile

- **[模板打印]** 修复：修正权限校验逻辑，防止未授权操作。 by @sheldon66

- **[文件存储：S3 (Pro)]** 访问地址有效期无效 by @jiannx

- **[区块：树]** 通过外键连接后，点击触发筛选，筛选条件为空 by @zhangzhonghe

## [v1.6.24](https://github.com/nocobase/nocobase/compare/v1.6.23...v1.6.24) - 2025-04-24

### 🚀 优化

- **[client]** 调整上传文件的提示信息 ([#6757](https://github.com/nocobase/nocobase/pull/6757)) by @mytharcher

### 🐛 修复

- **[client]**
  - 视图表，无编辑权限时允许显示导出按钮 ([#6763](https://github.com/nocobase/nocobase/pull/6763)) by @katherinehhh

  - 新增表单中显示关系字段子表格/子表单时关系数据也被新增 ([#6727](https://github.com/nocobase/nocobase/pull/6727)) by @katherinehhh

  - 在表单中获取关联表中的多对多数组字段数据不正确 ([#6744](https://github.com/nocobase/nocobase/pull/6744)) by @2013xile

## [v1.6.23](https://github.com/nocobase/nocobase/compare/v1.6.22...v1.6.23) - 2025-04-23

### 🚀 优化

- **[cli]** 优化 `nocobase upgrade` 命令的内部实现逻辑 ([#6754](https://github.com/nocobase/nocobase/pull/6754)) by @chenos

- **[模板打印]** 用客户端角色访问控制替换了数据源操作权限控制。 by @sheldon66

### 🐛 修复

- **[cli]** 升级时自动更新项目的 package.json ([#6747](https://github.com/nocobase/nocobase/pull/6747)) by @chenos

- **[client]**
  - 添加关联表格时未过滤已关联的数据 ([#6750](https://github.com/nocobase/nocobase/pull/6750)) by @katherinehhh

  - 树表格中添加子记录按钮的联动规则缺失「当前记录」变量 ([#6752](https://github.com/nocobase/nocobase/pull/6752)) by @katherinehhh

- **[操作：导入记录]** 修复设置字段权限时出现的导入导出异常。 ([#6677](https://github.com/nocobase/nocobase/pull/6677)) by @aaaaaajie

- **[区块：甘特图]** 甘特图区块设置月份视图时，日历头部月份重叠 ([#6753](https://github.com/nocobase/nocobase/pull/6753)) by @katherinehhh

- **[操作：导出记录 Pro]**
  - pro导出按钮在点击表格排序后丢失过滤参数 by @katherinehhh

  - 修复设置字段权限时出现的导入导出异常。 by @aaaaaajie

- **[文件存储：S3 (Pro)]** 修复已上传文件的响应数据 by @mytharcher

- **[工作流：审批]** 修复预加载审批记录数据的关系字段 by @mytharcher

## [v1.6.22](https://github.com/nocobase/nocobase/compare/v1.6.21...v1.6.22) - 2025-04-22

### 🚀 优化

- **[create-nocobase-app]** 更新依赖，移除 SQLite 支持 ([#6708](https://github.com/nocobase/nocobase/pull/6708)) by @chenos

- **[文件管理器]** 暴露公共包 API ([#6705](https://github.com/nocobase/nocobase/pull/6705)) by @mytharcher

- **[工作流]** 为变量的类型集合增加日期相关类型 ([#6717](https://github.com/nocobase/nocobase/pull/6717)) by @mytharcher

### 🐛 修复

- **[client]**
  - 移动端顶部的导航栏图标很难被删除的问题 ([#6734](https://github.com/nocobase/nocobase/pull/6734)) by @zhangzhonghe

  - 通过外键连接后，点击触发筛选，筛选条件为空 ([#6634](https://github.com/nocobase/nocobase/pull/6634)) by @zhangzhonghe

  - 筛选按钮中日期字段，切换picker 异常 ([#6695](https://github.com/nocobase/nocobase/pull/6695)) by @katherinehhh

  - 左侧菜单的收起按钮会被绑定工作流弹窗遮挡的问题 ([#6733](https://github.com/nocobase/nocobase/pull/6733)) by @zhangzhonghe

  - 重新打开联动规则时缺少操作选项约束 ([#6723](https://github.com/nocobase/nocobase/pull/6723)) by @katherinehhh

  - 未设置导出权限时仍显示导出按钮 ([#6689](https://github.com/nocobase/nocobase/pull/6689)) by @katherinehhh

  - 被联动规则隐藏的必填字段，不应该影响表单的提交 ([#6709](https://github.com/nocobase/nocobase/pull/6709)) by @zhangzhonghe

- **[server]** create-migration 命令生成的 appVersion 不准确 ([#6740](https://github.com/nocobase/nocobase/pull/6740)) by @chenos

- **[build]** 修复 tar 命令报错的问题 ([#6722](https://github.com/nocobase/nocobase/pull/6722)) by @mytharcher

- **[工作流]** 修复子流程执行定时任务报错的问题 ([#6721](https://github.com/nocobase/nocobase/pull/6721)) by @mytharcher

- **[工作流：自定义操作事件]** 支持多行记录模式的手动执行 by @mytharcher

- **[文件存储：S3 (Pro)]** 增加 multer 逻辑用于服务端上传 by @mytharcher

## [v1.6.21](https://github.com/nocobase/nocobase/compare/v1.6.20...v1.6.21) - 2025-04-17

### 🚀 优化

- **[client]** 为弹窗组件增加 delay API ([#6681](https://github.com/nocobase/nocobase/pull/6681)) by @mytharcher

- **[create-nocobase-app]** 升级部分依赖的版本 ([#6673](https://github.com/nocobase/nocobase/pull/6673)) by @chenos

### 🐛 修复

- **[client]**
  - 修复审批节点配置中引用模板区块的添加按钮报错问题 ([#6691](https://github.com/nocobase/nocobase/pull/6691)) by @mytharcher

  - 自定义的关系字段没有显示关系字段组件 ([#6692](https://github.com/nocobase/nocobase/pull/6692)) by @katherinehhh

  - 修复上传组件语言问题 ([#6682](https://github.com/nocobase/nocobase/pull/6682)) by @mytharcher

  - 懒加载组件不存在时界面报错 ([#6683](https://github.com/nocobase/nocobase/pull/6683)) by @gchust

  - 补全原生的 Password 组件到封装过的输入组件 ([#6679](https://github.com/nocobase/nocobase/pull/6679)) by @mytharcher

  - 字段赋值本表字段列表中显示了继承表字段，应只显示本表字段 ([#6666](https://github.com/nocobase/nocobase/pull/6666)) by @katherinehhh

- **[database]** 修复 CI 编译错误 ([#6687](https://github.com/nocobase/nocobase/pull/6687)) by @aaaaaajie

- **[build]** 插件依赖 AMD 库时构建产物不正确 ([#6665](https://github.com/nocobase/nocobase/pull/6665)) by @gchust

- **[操作：导入记录]** 修复导入包含时间字段的 xlsx 错误 ([#6672](https://github.com/nocobase/nocobase/pull/6672)) by @aaaaaajie

- **[工作流：人工处理节点]** 修复人工节点任务状态常量 ([#6676](https://github.com/nocobase/nocobase/pull/6676)) by @mytharcher

- **[区块：iframe]** iframe 区块设置全高时页面出现滚动条 ([#6675](https://github.com/nocobase/nocobase/pull/6675)) by @katherinehhh

- **[工作流：自定义操作事件]** 修复测试用例 by @mytharcher

- **[备份管理器]** 还原时若备份未设置密码，但用户输入了密码，还原会出现超时报错 by @gchust

## [v1.6.20](https://github.com/nocobase/nocobase/compare/v1.6.19...v1.6.20) - 2025-04-14

### 🎉 新特性

- **[部门]** 商业插件部门、附件 URL、工作流响应消息改为免费提供 ([#6663](https://github.com/nocobase/nocobase/pull/6663)) by @chenos

### 🐛 修复

- **[client]**
  - 筛选表单不应该显示“未保存修改”提示 ([#6657](https://github.com/nocobase/nocobase/pull/6657)) by @zhangzhonghe

  - 筛选表单中关系字段的“允许多选”设置项不生效 ([#6661](https://github.com/nocobase/nocobase/pull/6661)) by @katherinehhh

  - 筛选表单中，当点击筛选按钮时，如果有字段未校验通过，依然会触发筛选的问题 ([#6659](https://github.com/nocobase/nocobase/pull/6659)) by @zhangzhonghe

  - 切换到分组菜单时，不应该跳转到已经在菜单中被隐藏的页面 ([#6654](https://github.com/nocobase/nocobase/pull/6654)) by @zhangzhonghe

- **[文件存储：S3 (Pro)]**
  - 整理语言文案 by @jiannx

  - baseurl 和 public 设置不再互相关联，改进 S3 pro 存储的配置交互体验 by @jiannx

- **[迁移管理]** 迁移时若弹出环境变量弹窗，跳过自动备份选项会失效 by @gchust

## [v1.6.19](https://github.com/nocobase/nocobase/compare/v1.6.18...v1.6.19) - 2025-04-14

### 🐛 修复

- **[client]**
  - 修复预览图片被遮挡的问题 ([#6651](https://github.com/nocobase/nocobase/pull/6651)) by @zhangzhonghe

  - 表单区块中，字段配置的默认值会先显示为原始变量字符串然后再消失 ([#6649](https://github.com/nocobase/nocobase/pull/6649)) by @zhangzhonghe

## [v1.6.18](https://github.com/nocobase/nocobase/compare/v1.6.17...v1.6.18) - 2025-04-11

### 🚀 优化

- **[client]**
  - 为 `Variable.Input` 组件增加默认退避类型的 API ([#6644](https://github.com/nocobase/nocobase/pull/6644)) by @mytharcher

  - 优化未配置页面时的提示 ([#6641](https://github.com/nocobase/nocobase/pull/6641)) by @zhangzhonghe

- **[工作流：延时节点]** 支持延迟时间使用变量 ([#6621](https://github.com/nocobase/nocobase/pull/6621)) by @mytharcher

- **[工作流：自定义操作事件]** 为触发工作流按钮增加刷新配置项 by @mytharcher

### 🐛 修复

- **[client]**
  - 子表格中描述信息与操作按钮遮挡 ([#6646](https://github.com/nocobase/nocobase/pull/6646)) by @katherinehhh

  - 弹窗表单在 horizontal 布局下初始宽度计算错误，导致出现提示和 下划虚线 ([#6639](https://github.com/nocobase/nocobase/pull/6639)) by @katherinehhh

- **[文件存储：S3 (Pro)]** 修复next调用缺少await by @jiannx

- **[邮件管理]** 修复next调用缺少await by @jiannx

## [v1.6.17](https://github.com/nocobase/nocobase/compare/v1.6.16...v1.6.17) - 2025-04-09

### 🚀 优化

- **[utils]** 为 dayjs 包增加时长扩展 ([#6630](https://github.com/nocobase/nocobase/pull/6630)) by @mytharcher

- **[client]**
  - 支持筛选组件中对字段进行搜索 ([#6627](https://github.com/nocobase/nocobase/pull/6627)) by @mytharcher

  - 为 `Input` 和 `Variable.TextArea` 组件增加 `trim` API ([#6624](https://github.com/nocobase/nocobase/pull/6624)) by @mytharcher

- **[错误处理器]** 在 AppError 组件中支持自定义标题。 ([#6409](https://github.com/nocobase/nocobase/pull/6409)) by @sheldon66

- **[IP 限制]** 更新 IP 限制消息内容。 by @sheldon66

- **[文件存储：S3 (Pro)]** 支持存储引擎的配置中使用全局变量 by @mytharcher

### 🐛 修复

- **[client]**
  - 联动规则条件设置为任意且无条件内容时属性设置不生效 ([#6628](https://github.com/nocobase/nocobase/pull/6628)) by @katherinehhh

  - 树表使用甘特图区块时数据显示异常 ([#6617](https://github.com/nocobase/nocobase/pull/6617)) by @katherinehhh

  - 筛选表单中的关系字段在刷新页面后，由于没有携带 x-data-source 而报错 ([#6619](https://github.com/nocobase/nocobase/pull/6619)) by @zhangzhonghe

  - 链接中中文参数变量值解析失败 ([#6618](https://github.com/nocobase/nocobase/pull/6618)) by @katherinehhh

- **[用户]** 用户个人资料表单 schema 的解析问题 ([#6635](https://github.com/nocobase/nocobase/pull/6635)) by @2013xile

- **[移动端]** 下拉单选字段在移动端设置筛选符为包含时组件未支持多选 ([#6629](https://github.com/nocobase/nocobase/pull/6629)) by @katherinehhh

- **[操作：导出记录]** 筛选数据后切换分页再导出时筛选参数丢失 ([#6633](https://github.com/nocobase/nocobase/pull/6633)) by @katherinehhh

- **[邮件管理]** 邮件管理权限无法查看邮件列表 by @jiannx

- **[文件存储：S3 (Pro)]** 当用户上传 logo 失败时提示错误（设置为默认存储的 S3 Pro） by @mytharcher

- **[工作流：审批]** 修复更新时间在迁移后变化 by @mytharcher

- **[迁移管理]** 部分服务器环境下迁移日志创建日期显示不正确 by @gchust

## [v1.6.16](https://github.com/nocobase/nocobase/compare/v1.6.15...v1.6.16) - 2025-04-03

### 🐛 修复

- **[client]**
  - 表单字段设置不可编辑不起作用 ([#6610](https://github.com/nocobase/nocobase/pull/6610)) by @katherinehhh

  - 表单字段标题因冒号导致的截断问题 ([#6599](https://github.com/nocobase/nocobase/pull/6599)) by @katherinehhh

- **[database]** 删除一对多记录时，同时传递 `filter` 和 `filterByTk` 参数，`filter` 包含关系字段时，`filterByTk` 参数失效 ([#6606](https://github.com/nocobase/nocobase/pull/6606)) by @2013xile

## [v1.6.15](https://github.com/nocobase/nocobase/compare/v1.6.14...v1.6.15) - 2025-04-01

### 🚀 优化

- **[database]**
  - 为多行文本类型字段增加去除首尾空白字符的选项 ([#6603](https://github.com/nocobase/nocobase/pull/6603)) by @mytharcher

  - 为单行文本增加自动去除首尾空白字符的选项 ([#6565](https://github.com/nocobase/nocobase/pull/6565)) by @mytharcher

- **[文件管理器]** 为存储引擎表的文本字段增加去除首尾空白字符的选项 ([#6604](https://github.com/nocobase/nocobase/pull/6604)) by @mytharcher

- **[工作流]** 优化代码 ([#6589](https://github.com/nocobase/nocobase/pull/6589)) by @mytharcher

- **[工作流：审批]** 支持审批表单使用区块模板 by @mytharcher

### 🐛 修复

- **[database]** 避免“日期时间（无时区）”字段在值未变动的更新时触发值改变 ([#6588](https://github.com/nocobase/nocobase/pull/6588)) by @mytharcher

- **[client]**
  - 关系字段（select）放出关系表字段时默认显示 N/A ([#6582](https://github.com/nocobase/nocobase/pull/6582)) by @katherinehhh

  - 修复 `SchemaInitializerItem` 配置了 `items` 时 `disabled` 属性无效的问题 ([#6597](https://github.com/nocobase/nocobase/pull/6597)) by @mytharcher

  - 级联组件删除后重新选择时出现 'The value of xxx cannot be in array format' ([#6585](https://github.com/nocobase/nocobase/pull/6585)) by @katherinehhh

- **[数据表字段：多对多 (数组)]** 主表筛选带有多对多（数组）字段的关联表中的字段报错的问题 ([#6596](https://github.com/nocobase/nocobase/pull/6596)) by @2013xile

- **[公开表单]** 查看权限包括 list 和 get ([#6607](https://github.com/nocobase/nocobase/pull/6607)) by @chenos

- **[用户认证]** `AuthProvider` 中的 token 赋值 ([#6593](https://github.com/nocobase/nocobase/pull/6593)) by @2013xile

- **[工作流]** 修复同步选项展示问题 ([#6595](https://github.com/nocobase/nocobase/pull/6595)) by @mytharcher

- **[区块：地图]** 地图管理必填校验不应通过空格输入 ([#6575](https://github.com/nocobase/nocobase/pull/6575)) by @katherinehhh

- **[工作流：审批]**
  - 修复审批表单中的前端变量 by @mytharcher

  - 修复分支模式下配置拒绝则结束时的流程问题 by @mytharcher

## [v1.6.14](https://github.com/nocobase/nocobase/compare/v1.6.13...v1.6.14) - 2025-03-29

### 🐛 修复

- **[日历]** 日历区块以周为视图时，边界日期不显示数据 ([#6587](https://github.com/nocobase/nocobase/pull/6587)) by @katherinehhh

- **[认证：OIDC]** 回调路径是字符串'null'时导致跳转不正确 by @2013xile

- **[工作流：审批]** 修复审批节点界面配置变更后数据未同步的问题 by @mytharcher

## [v1.6.13](https://github.com/nocobase/nocobase/compare/v1.6.12...v1.6.13) - 2025-03-28

### 🚀 优化

- **[异步任务管理器]** 优化 Pro 导入导出按钮异步逻辑 ([#6531](https://github.com/nocobase/nocobase/pull/6531)) by @chenos

- **[操作：导出记录 Pro]** 优化 Pro 导入导出按钮 by @katherinehhh

- **[迁移管理]** 允许执行迁移时跳过自动备份还原 by @gchust

### 🐛 修复

- **[client]** 同一表单中不同关系字段的同名关系字段的联动互相影响 ([#6577](https://github.com/nocobase/nocobase/pull/6577)) by @katherinehhh

- **[操作：批量编辑]** 点击批量编辑按钮，配置完弹窗再打开，弹窗是空白的 ([#6578](https://github.com/nocobase/nocobase/pull/6578)) by @zhangzhonghe

## [v1.6.12](https://github.com/nocobase/nocobase/compare/v1.6.11...v1.6.12) - 2025-03-27

### 🐛 修复

- **[区块：分步表单]**
  - 提交按钮默认和高亮情况下颜色一样 by @jiannx

  - 修复当字段与其他表单字段存在关联时，表单重置无效 by @jiannx

- **[工作流：审批]** 修复审批表单提交值的问题 by @mytharcher

## [v1.6.11](https://github.com/nocobase/nocobase/compare/v1.6.10...v1.6.11) - 2025-03-27

### 🚀 优化

- **[client]**
  - 优化 502 错误提示 ([#6547](https://github.com/nocobase/nocobase/pull/6547)) by @chenos

  - 仅支持纯文本文件预览 ([#6563](https://github.com/nocobase/nocobase/pull/6563)) by @mytharcher

- **[数据表字段：自动编码]** 支持使用 sequence 作为日历区块的标题字段 ([#6562](https://github.com/nocobase/nocobase/pull/6562)) by @katherinehhh

- **[工作流：审批]** 支持审批处理按钮跳过表单验证的设置 by @mytharcher

### 🐛 修复

- **[client]**
  - 数据范围中筛选日期字段显示异常 ([#6564](https://github.com/nocobase/nocobase/pull/6564)) by @katherinehhh

  - 选项“省略超出长度的内容”需要刷新页面，开关的状态才生效 ([#6520](https://github.com/nocobase/nocobase/pull/6520)) by @zhangzhonghe

  - 在弹窗中无法再次打开弹窗 ([#6535](https://github.com/nocobase/nocobase/pull/6535)) by @zhangzhonghe

- **[API 文档]** API 文档页面不能滚动 ([#6566](https://github.com/nocobase/nocobase/pull/6566)) by @zhangzhonghe

- **[工作流]** 确保创建工作流之前 key 已生成 ([#6567](https://github.com/nocobase/nocobase/pull/6567)) by @mytharcher

- **[工作流：操作后事件]** 多行记录的批量操作需要触发多次 ([#6559](https://github.com/nocobase/nocobase/pull/6559)) by @mytharcher

- **[用户认证]** 注册页面字段的本地化问题 ([#6556](https://github.com/nocobase/nocobase/pull/6556)) by @2013xile

- **[公开表单]** 公开表单页面标题不应该显示 Loading... ([#6569](https://github.com/nocobase/nocobase/pull/6569)) by @katherinehhh

## [v1.6.10](https://github.com/nocobase/nocobase/compare/v1.6.9...v1.6.10) - 2025-03-25

### 🐛 修复

- **[client]**
  - 添加链接页面时，无法使用“当前用户”变量 ([#6536](https://github.com/nocobase/nocobase/pull/6536)) by @zhangzhonghe

  - 字段赋值对字段进行“空值”赋值无效 ([#6549](https://github.com/nocobase/nocobase/pull/6549)) by @katherinehhh

  - `yarn doc` 命令报错 ([#6540](https://github.com/nocobase/nocobase/pull/6540)) by @gchust

  - 筛选表单中，移除下拉单选字段的“允许多选”选项 ([#6515](https://github.com/nocobase/nocobase/pull/6515)) by @zhangzhonghe

  - 关系字段的数据范围联动不生效 ([#6530](https://github.com/nocobase/nocobase/pull/6530)) by @zhangzhonghe

- **[数据表：树]** 树表插件的迁移脚本问题 ([#6537](https://github.com/nocobase/nocobase/pull/6537)) by @2013xile

- **[操作：自定义请求]** 无法下载utf8编码的文件 ([#6541](https://github.com/nocobase/nocobase/pull/6541)) by @2013xile

## [v1.6.9](https://github.com/nocobase/nocobase/compare/v1.6.8...v1.6.9) - 2025-03-23

### 🐛 修复

- **[client]** 操作按钮透明状态导致 hover 时按钮 setting 显示异常 ([#6529](https://github.com/nocobase/nocobase/pull/6529)) by @katherinehhh

## [v1.6.8](https://github.com/nocobase/nocobase/compare/v1.6.7...v1.6.8) - 2025-03-22

### 🐛 修复

- **[server]** Upgrade 命令可能造成工作流报错 ([#6524](https://github.com/nocobase/nocobase/pull/6524)) by @gchust

- **[client]** 表单中的子表格高度会随主表单高度一同设置 ([#6518](https://github.com/nocobase/nocobase/pull/6518)) by @katherinehhh

- **[用户认证]**
  - X-Authenticator 缺失 ([#6526](https://github.com/nocobase/nocobase/pull/6526)) by @chenos

  - 移除认证器配置项前后的空格、换行符 ([#6527](https://github.com/nocobase/nocobase/pull/6527)) by @2013xile

- **[区块：地图]** 地图区块 密钥管理中不可见字符导致的密钥请求失败的问题 ([#6521](https://github.com/nocobase/nocobase/pull/6521)) by @katherinehhh

- **[备份管理器]** 还原过程中可能引起工作流执行报错 by @gchust

- **[企业微信]** 获取通知配置时需要解析环境变量和密钥 by @2013xile

## [v1.6.7](https://github.com/nocobase/nocobase/compare/v1.6.6...v1.6.7) - 2025-03-20

### 🚀 优化

- **[工作流：邮件发送节点]** 增加安全字段配置描述。 ([#6510](https://github.com/nocobase/nocobase/pull/6510)) by @sheldon66

- **[通知：电子邮件]** 增加安全字段配置描述。 ([#6501](https://github.com/nocobase/nocobase/pull/6501)) by @sheldon66

- **[日历]** 日历插件添加开启或关闭快速创建事件可选设置 ([#6391](https://github.com/nocobase/nocobase/pull/6391)) by @Cyx649312038

### 🐛 修复

- **[client]** 时间字段在中文语言下提交时报错 invalid input syntax for type time ([#6511](https://github.com/nocobase/nocobase/pull/6511)) by @katherinehhh

- **[文件管理器]** COS 存储的文件无法访问 ([#6512](https://github.com/nocobase/nocobase/pull/6512)) by @chenos

- **[区块：地图]** 地图管理中密钥必填校验失败 ([#6509](https://github.com/nocobase/nocobase/pull/6509)) by @katherinehhh

- **[WEB 客户端]** 路由管理表格中的路径与实际路径不一样 ([#6483](https://github.com/nocobase/nocobase/pull/6483)) by @zhangzhonghe

- **[操作：导出记录 Pro]** 无法导出附件 by @chenos

- **[工作流：审批]**
  - 修复空用户造成页面崩溃 by @mytharcher

  - 修复审批人界面配置添加查询节点时的页面崩溃 by @mytharcher

## [v1.6.6](https://github.com/nocobase/nocobase/compare/v1.6.5...v1.6.6) - 2025-03-18

### 🎉 新特性

- **[client]** 支持长文本字段作为关系字段的标题字段 ([#6495](https://github.com/nocobase/nocobase/pull/6495)) by @katherinehhh

- **[工作流：聚合查询节点]** 支持为聚合结果配置精度选项 ([#6491](https://github.com/nocobase/nocobase/pull/6491)) by @mytharcher

### 🚀 优化

- **[文件存储：S3 (Pro)]** 将文案“访问 URL 基础”改为“基础 URL” by @zhangzhonghe

### 🐛 修复

- **[evaluators]** 将表达式计算保留小数调整回 9 位 ([#6492](https://github.com/nocobase/nocobase/pull/6492)) by @mytharcher

- **[文件管理器]** URL 转义 ([#6497](https://github.com/nocobase/nocobase/pull/6497)) by @chenos

- **[数据源：主数据库]** 无法创建 MySQL 视图 ([#6477](https://github.com/nocobase/nocobase/pull/6477)) by @aaaaaajie

- **[工作流]** 修复历史遗留任务数量工作流删除后统计错误 ([#6493](https://github.com/nocobase/nocobase/pull/6493)) by @mytharcher

- **[嵌入 NocoBase]** 页面显示空白 by @zhangzhonghe

- **[备份管理器]**
  - 通过多应用模板创建子应用时备份中的上传文件未被正确还原 by @gchust

  - 还原 MySQL 数据库备份时由于 GTID 集合重叠导致的失败 by @gchust

- **[工作流：审批]**
  - 将退回的审批单据列入待办 by @mytharcher

  - 修复审批过程表格中发起人查看按钮消失的问题 by @mytharcher

## [v1.6.5](https://github.com/nocobase/nocobase/compare/v1.6.4...v1.6.5) - 2025-03-17

### 🚀 优化

- **[文件管理器]** 简化生成文件 URL 的逻辑和 API ([#6472](https://github.com/nocobase/nocobase/pull/6472)) by @mytharcher

- **[文件存储：S3 (Pro)]** 优化生成文件 URL 的方法 by @mytharcher

- **[备份管理器]** 允许在相同版本的预发布和发布版本之间恢复备份 by @gchust

### 🐛 修复

- **[client]**
  - 富文本字段清空后提交时数据未删除 ([#6486](https://github.com/nocobase/nocobase/pull/6486)) by @katherinehhh

  - 页面右上角图标的颜色不会随主题变化 ([#6482](https://github.com/nocobase/nocobase/pull/6482)) by @zhangzhonghe

  - 点击筛选表单的重置按钮无法清除网格卡片区块的筛选条件 ([#6475](https://github.com/nocobase/nocobase/pull/6475)) by @zhangzhonghe

- **[工作流：人工处理节点]**
  - 修复迁移脚本 ([#6484](https://github.com/nocobase/nocobase/pull/6484)) by @mytharcher

  - 修改迁移脚本确保执行 ([#6487](https://github.com/nocobase/nocobase/pull/6487)) by @mytharcher

  - 修复区块的筛选组件中工作流标题项 ([#6480](https://github.com/nocobase/nocobase/pull/6480)) by @mytharcher

  - 修复 id 列不存在时迁移脚本报错 ([#6470](https://github.com/nocobase/nocobase/pull/6470)) by @chenos

  - 避免历史表被关系字段同步出来 ([#6478](https://github.com/nocobase/nocobase/pull/6478)) by @mytharcher

- **[工作流：聚合查询节点]** 修复对聚合结果为 null 时取整报错 ([#6473](https://github.com/nocobase/nocobase/pull/6473)) by @mytharcher

- **[工作流]** 不统计已删除的工作流的待办 ([#6474](https://github.com/nocobase/nocobase/pull/6474)) by @mytharcher

- **[备份管理器]** 默认的备份设置不存在时服务器无法启动 by @gchust

- **[工作流：审批]**
  - 修复审批表单中文件字段报错问题 by @mytharcher

  - 基于钩子事件修复待办任务数量 by @mytharcher

## [v1.6.4](https://github.com/nocobase/nocobase/compare/v1.6.3...v1.6.4) - 2025-03-14

### 🎉 新特性

- **[client]** 级联选择组件添加数据范围设置 ([#6386](https://github.com/nocobase/nocobase/pull/6386)) by @Cyx649312038

### 🚀 优化

- **[utils]** 将 `md5` 方法移到通用包 ([#6468](https://github.com/nocobase/nocobase/pull/6468)) by @mytharcher

### 🐛 修复

- **[client]** 在树区块中，取消选中时，数据区块的数据没有被清空 ([#6460](https://github.com/nocobase/nocobase/pull/6460)) by @zhangzhonghe

- **[文件管理器]** 无法删除 s3 文件存储的文件 ([#6467](https://github.com/nocobase/nocobase/pull/6467)) by @chenos

- **[工作流]** 在数据选择器中移除绑定工作流的配置按钮 ([#6455](https://github.com/nocobase/nocobase/pull/6455)) by @mytharcher

- **[文件存储：S3 (Pro)]** 修复 s3 pro 的签名 url 无法访问的问题 by @chenos

- **[工作流：审批]** 避免审批流程表格中由于没有发起人时的页面崩溃 by @mytharcher

## [v1.6.3](https://github.com/nocobase/nocobase/compare/v1.6.2...v1.6.3) - 2025-03-13

### 🎉 新特性

- **[企业微信]** 支持自定义登录按钮提示 by @2013xile

### 🐛 修复

- **[client]**
  - 修复图片中特殊字符导致不显示的问题 ([#6459](https://github.com/nocobase/nocobase/pull/6459)) by @mytharcher

  - 子表格切换分页数后新增数据页码显示错误 ([#6437](https://github.com/nocobase/nocobase/pull/6437)) by @katherinehhh

  - Logo 的样式与之前的不一致 ([#6444](https://github.com/nocobase/nocobase/pull/6444)) by @zhangzhonghe

- **[工作流：人工处理节点]** 修复迁移脚本报错 ([#6445](https://github.com/nocobase/nocobase/pull/6445)) by @mytharcher

- **[数据可视化]** 添加自定义筛选字段时会出现已移除字段 ([#6450](https://github.com/nocobase/nocobase/pull/6450)) by @2013xile

- **[文件管理器]** 修复文件管理一些问题 ([#6436](https://github.com/nocobase/nocobase/pull/6436)) by @mytharcher

- **[操作：自定义请求]** 自定义请求的服务端权限校验错误 ([#6438](https://github.com/nocobase/nocobase/pull/6438)) by @katherinehhh

- **[数据源管理]** 角色管理中切换数据源没有加载对应数据表 ([#6431](https://github.com/nocobase/nocobase/pull/6431)) by @katherinehhh

- **[操作：批量编辑]** 修复批量编辑提交时未能触发工作流的问题 ([#6440](https://github.com/nocobase/nocobase/pull/6440)) by @mytharcher

- **[工作流：自定义操作事件]** 移除 E2E 测试中的 `only` by @mytharcher

- **[工作流：审批]**
  - 修复审批表单中关系数据未展示的问题 by @mytharcher

  - 修复外部数据源审批时的报错 by @mytharcher

## [v1.6.2](https://github.com/nocobase/nocobase/compare/v1.6.1...v1.6.2) - 2025-03-12

### 🐛 修复

- **[client]** 表单日期字段日期范围，最大日期可选范围少一天 ([#6418](https://github.com/nocobase/nocobase/pull/6418)) by @katherinehhh

- **[通知：站内信]** 避免错误的接收人配置导致查询出全部用户 ([#6424](https://github.com/nocobase/nocobase/pull/6424)) by @sheldon66

- **[工作流：人工处理节点]**
  - 修复遗漏表前缀和 schema 的迁移脚本 ([#6425](https://github.com/nocobase/nocobase/pull/6425)) by @mytharcher

  - 调整迁移脚本版本范围限制为 `<1.7.0` ([#6430](https://github.com/nocobase/nocobase/pull/6430)) by @mytharcher

## [v1.6.1](https://github.com/nocobase/nocobase/compare/v1.6.0...v1.6.1) - 2025-03-11

### 🐛 修复

- **[client]**
  - 使用“$anyOf”操作符时，联动规则无效 ([#6415](https://github.com/nocobase/nocobase/pull/6415)) by @zhangzhonghe

  - 使用链接按钮打开的弹窗，数据不更新 ([#6411](https://github.com/nocobase/nocobase/pull/6411)) by @zhangzhonghe

  - 子表格删除记录的时候多选字段值错误且选项缺失 ([#6405](https://github.com/nocobase/nocobase/pull/6405)) by @katherinehhh

- **[通知：站内信]** 在站内信列表中，将背景颜色与消息卡片的颜色区分开，以提升视觉层次感和可读性。 ([#6417](https://github.com/nocobase/nocobase/pull/6417)) by @sheldon66

## [v1.6.0](https://github.com/nocobase/nocobase/compare/v1.5.25...v1.6.0) - 2025-03-11

## 新特性

### 集群模式

企业版可通过相关插件支持集群模式部署，应用以集群模式运行时，可以通过多个实例和使用多核模式来提高应用的对并发访问处理的性能。

![20241231010814](https://static-docs.nocobase.com/20241231010814.png)

参考文档：[集群部署](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)

### 密码策略

为所有用户设置密码规则，密码有效期和密码登录安全策略，管理锁定用户。

![](https://static-docs.nocobase.com/202412281329313.png)

参考文档：[密码策略和用户锁定](https://docs-cn.nocobase.com/handbook/password-policy)

### Token 安全策略

Token 安全策略是一种用于保护系统安全和体验的功能配置。它包括了三个主要配置项：“会话有效期”、“Token 有效周期” 和 “过期 Token 刷新时限” 。

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

参考文档：[Token 安全策略](https://docs-cn.nocobase.com/handbook/token-policy)

### IP 限制

NocoBase 支持管理员对用户访问 IP 设置白名单或黑名单，以限制未授权的外部网络连接或阻止已知的恶意 IP 地址，降低安全风险。同时支持管理员查询访问拒绝日志，识别风险 IP。

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

参考文档：[IP 限制](https://docs-cn.nocobase.com/handbook/IP-restriction)

### 变量和密钥

集中配置和管理环境变量和密钥，用于敏感数据存储、配置数据重用、环境配置隔离等。

![1ee6c3fa09533b19f4d6038f53b06006.png](https://static-docs.nocobase.com/1ee6c3fa09533b19f4d6038f53b06006.png)

参考文档：[变量和密钥](https://docs-cn.nocobase.com/handbook/environment-variables)

### 迁移管理

用于将应用配置从一个应用环境迁移到另一个应用环境。

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

参考文档：[迁移管理](https://docs-cn.nocobase.com/handbook/migration-manager)[发布管理](https://docs-cn.nocobase.com/handbook/release-management)

### 路由管理

* **菜单数据独立并改名为路由**：菜单数据从 UI Schema 中拆分出来，改名为**路由**，分为 `desktopRoutes` 和 `mobileRoutes` 两张表，分别对应桌面端路由和移动端路由。
* **菜单前端优化，支持折叠与响应式**：菜单在前端实现了**折叠**与**响应式**适配，提升了使用体验。

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

参考文档：[路由管理](https://docs-cn.nocobase.com/handbook/routes)

### 角色和权限

* 支持配置更多的操作按钮权限，包括弹窗、链接、扫码、触发工作流
  ![b0a7905d9fd4beaaf21592b1f56fe752.png](https://static-docs.nocobase.com/b0a7905d9fd4beaaf21592b1f56fe752.png)
* 支持配置标签页权限

  ![4fd3a5144a2301638b9f24b033d33add.png](https://static-docs.nocobase.com/4fd3a5144a2301638b9f24b033d33add.png)

### 用户管理

支持配置用户个人资料表单

![171e5a4c61033afb237c9ae1a3d89000.png](https://static-docs.nocobase.com/171e5a4c61033afb237c9ae1a3d89000.png)

### 工作流

在全局工具栏中增加流程待办中心入口，并实时提示人工节点、审批的相关待办任务数量。

![855c58536f9fd29ae353dd19b3aff73f.png](https://static-docs.nocobase.com/855c58536f9fd29ae353dd19b3aff73f.png)

### 工作流：自定义操作事件

支持全局和批量数据触发自定义操作事件。

![106ae1296d180718799eb6d7f423805c.png](https://static-docs.nocobase.com/106ae1296d180718799eb6d7f423805c.png)

### 工作流：审批

* 支持转签、加签。![审批节点_界面配置_操作表单区块](https://static-docs.nocobase.com/20241226232013.png)
* 支持审批人在提交审批时修改申请内容。![审批节点_界面配置_操作表单_修改审批内容字段](https://static-docs.nocobase.com/20241226232124.png)
* 支持在审批界面中配置审批基础信息区块。
* 优化审批发起和待办区块的样式和交互，同时也在全局的流程待办中心中内置。![待办中心-审批](https://static-docs.nocobase.com/20250310161203.png)
* 不再区分发起审批的位置，审批中心区块可以发起和处理所有审批。

### 工作流：JSON 变量映射节点

新增用于将上游节点结果中的 JSON 数据映射为变量的专用节点。

![创建节点](https://static-docs.nocobase.com/20250113173635.png)

参考文档：[JSON 变量映射](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-variable-mapping)

### 扩展能力提升及插件示例


| 扩展项                 | 插件示例                                                        |
| ---------------------- | --------------------------------------------------------------- |
| 数据表预置字段扩展     | @nocobase-sample/plugin-data-source-main-custom-preset-fields   |
| 日历颜色字段可选项扩展 | @nocobase-sample/plugin-calendar-register-color-field           |
| 日历标题字段可选项扩展 | @nocobase-sample/plugin-calendar-register-title-field           |
| 公式可选项字段扩展     | @nocobase-sample/plugin-field-formula-register-expression-field |
| 看板分组字段扩展       | @nocobase-sample/plugin-kanban-register-group-field             |
| 筛选操作符扩展         | @nocobase-sample/plugin-register-filter-operator                |
| 文件存储扩展           | @nocobase-sample/plugin-file-storage-demo                       |

## 不兼容变更

### Token 安全策略更新

1.6 版本新增了 [Token 安全策略](https://docs-cn.nocobase.com/handbook/token-policy)，Auth 认证检查未通过时，将返回 401 错误并跳转至登录页。此行为与之前版本有所不同。如需跳过检查，可参考以下示例进行处理：

前端请求

```javascript
useRequest({
  url: '/test',
  skipAuth: true,
});

api.request({
  url: '/test',
  skipAuth: true,
});
```

后端中间件

```javascript
class PluginMiddlewareExampleServer extends plugin {
  middlewareExample = (ctx, next) => {
    if (ctx.path === '/path/to') {
      ctx.skipAuthCheck = true;
    }
    await next();
  };
  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.middlewareExample, {
        before: 'auth',
      });
    });
  }
}
```

### 单元测试函数 agent.login 由同步改为异步

由于认证流程需要进行一些异步操作，测试函数 login 改为异步, 示例：

```TypeScript
import { createMockServer } from '@nocobase/test';

describe('my db suite', () => {
  let app;
  let agent;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl'],
    });
    agent = await app.agent().login(1);
  });

  test('case1', async () => {
    await agent.get('/examples');
    await agent.get('/examples');
    await agent.resource('examples').create();
  });
});
```

### 提供全新的用户中心设置项的扩展 API

API

```ts
type UserCenterSettingsItemOptions = SchemaSettingsItemType & { aclSnippet?: string };

class Application {
  addUserCenterSettingsItem(options: UserCenterSettingsItemOptions);
}
```

示例

```javascript
class PluginUserCenterSettingsExampleClient extends plugin {
  async load() {
    this.app.addUserCenterSettingsItem({
      name: 'nickName',
      Component: NickName,
      sort: 0,
    });
  }
}
```

## [v1.5.25](https://github.com/nocobase/nocobase/compare/v1.5.24...v1.5.25) - 2025-03-09

### 🐛 修复

- **[server]** `yarn start` 启动服务器后前端缓存未刷新 ([#6394](https://github.com/nocobase/nocobase/pull/6394)) by @gchust

- **[工作流：审批]** 避免错误的审批人配置导致查询出全部用户 by @mytharcher

- **[企业微信]** 修复登录提示链接和钉钉登录错误 by @chenzhizdt

## [v1.5.24](https://github.com/nocobase/nocobase/compare/v1.5.23...v1.5.24) - 2025-03-07

### 🎉 新特性

- **[数据可视化]** 支持在图表查询中设置 NULLS 排序 ([#6383](https://github.com/nocobase/nocobase/pull/6383)) by @2013xile

### 🚀 优化

- **[工作流]** 支持在数据表事件中不触发工作流 ([#6379](https://github.com/nocobase/nocobase/pull/6379)) by @mytharcher

### 🐛 修复

- **[操作：导入记录 Pro]** 使用额外的选项来觉得是否在导入时触发工作流的数据表事件 by @mytharcher

- **[操作：导出记录 Pro]** pro 导出按钮导出数据时缺失sort 参数 by @katherinehhh

## [v1.5.23](https://github.com/nocobase/nocobase/compare/v1.5.22...v1.5.23) - 2025-03-06

### 🐛 修复

- **[client]**
  - 日期组件缺陷，选择的日期时间会少一个小时 ([#6359](https://github.com/nocobase/nocobase/pull/6359)) by @katherinehhh

  - 继承父表的字段在表格中缺少排序设置项 ([#6372](https://github.com/nocobase/nocobase/pull/6372)) by @katherinehhh

## [v1.5.22](https://github.com/nocobase/nocobase/compare/v1.5.21...v1.5.22) - 2025-03-06

### 🚀 优化

- **[client]** 按钮添加防双击处理 ([#6351](https://github.com/nocobase/nocobase/pull/6351)) by @Cyx649312038

### 🐛 修复

- **[database]** 修复当关系字段的源表标识字段值为数字型字符串时，获取关系数据记录报错的问题 ([#6360](https://github.com/nocobase/nocobase/pull/6360)) by @2013xile

## [v1.5.21](https://github.com/nocobase/nocobase/compare/v1.5.20...v1.5.21) - 2025-03-05

### 🚀 优化

- **[工作流]** 后置节点结果加载以提升执行记录画布性能 ([#6344](https://github.com/nocobase/nocobase/pull/6344)) by @mytharcher

- **[工作流：聚合查询节点]** 对聚合后的数字进行小数四舍五入的处理 ([#6358](https://github.com/nocobase/nocobase/pull/6358)) by @mytharcher

### 🐛 修复

- **[client]**
  - 子表单隐藏字段标题时字段组件与主表单中的组件未对齐 ([#6357](https://github.com/nocobase/nocobase/pull/6357)) by @katherinehhh

  - 数据表继承模型中关系区块在弹窗中未显示 ([#6303](https://github.com/nocobase/nocobase/pull/6303)) by @katherinehhh

  - 修复创建文件表时的报错 ([#6363](https://github.com/nocobase/nocobase/pull/6363)) by @mytharcher

- **[工作流]** 修复加载节点结果的权限问题 ([#6352](https://github.com/nocobase/nocobase/pull/6352)) by @mytharcher

## [v1.5.20](https://github.com/nocobase/nocobase/compare/v1.5.19...v1.5.20) - 2025-03-03

### 🐛 修复

- **[client]** 已经自定义 favicon 的页面，在页面加载时会闪一下 NocoBase 的 favicon ([#6337](https://github.com/nocobase/nocobase/pull/6337)) by @zhangzhonghe

- **[区块：地图]** 地图字段不显示配置项 ([#6336](https://github.com/nocobase/nocobase/pull/6336)) by @zhangzhonghe

- **[自定义品牌]** 已经自定义 favicon 的页面，在页面加载时会闪一下 NocoBase 的 favicon by @zhangzhonghe

- **[模板打印]** 模板打印插件和备份管理器插件都开启时，无法上传本地备份还原应用 by @gchust

## [v1.5.19](https://github.com/nocobase/nocobase/compare/v1.5.18...v1.5.19) - 2025-03-01

### 🐛 修复

- **[client]** 关系字段阅读模式下hover时出现新增按钮 ([#6322](https://github.com/nocobase/nocobase/pull/6322)) by @katherinehhh

- **[操作：导出记录 Pro]** 导出附件按钮setting多了添加区块 by @katherinehhh

- **[操作：导入记录 Pro]** 关系区块导入按钮的识别重复记录依据字段下拉无内容 by @katherinehhh

## [v1.5.18](https://github.com/nocobase/nocobase/compare/v1.5.17...v1.5.18) - 2025-02-27

### 🐛 修复

- **[区块：操作面板]** 设置操作面板的高度无效 ([#6321](https://github.com/nocobase/nocobase/pull/6321)) by @zhangzhonghe

## [v1.5.17](https://github.com/nocobase/nocobase/compare/v1.5.16...v1.5.17) - 2025-02-27

### 🐛 修复

- **[client]**
  - 无评论表时点击创建评论区块报错 ([#6309](https://github.com/nocobase/nocobase/pull/6309)) by @katherinehhh

  - 点击树区块节点时报错 ([#6314](https://github.com/nocobase/nocobase/pull/6314)) by @zhangzhonghe

  - 点击左侧菜单后，子页面被异常关闭 ([#6305](https://github.com/nocobase/nocobase/pull/6305)) by @zhangzhonghe

  - 当表达式的值为空时，不清空字段的值 ([#6300](https://github.com/nocobase/nocobase/pull/6300)) by @zhangzhonghe

- **[数据表字段：自动编码]** 修复自动编号字段在只读模式下未禁用 ([#6274](https://github.com/nocobase/nocobase/pull/6274)) by @mytharcher

- **[文件管理器]** 修复继承表的迁移问题 ([#6310](https://github.com/nocobase/nocobase/pull/6310)) by @mytharcher

- **[权限控制]** 配置数据表权限，使用多对多字段作为数据范围筛选条件，响应的数据记录不正确 ([#6304](https://github.com/nocobase/nocobase/pull/6304)) by @2013xile

- **[区块：看板]** 弹窗中看板区块使用弹窗记录变量过滤数据不正确 ([#6290](https://github.com/nocobase/nocobase/pull/6290)) by @katherinehhh

- **[区块：树]** 点击树区块节点时报错 by @zhangzhonghe

## [v1.5.16](https://github.com/nocobase/nocobase/compare/v1.5.15...v1.5.16) - 2025-02-26

### 🚀 优化

- **[备份管理器]** 允许还原备份到缺少部分插件的应用 by @gchust

### 🐛 修复

- **[client]** 富文本字段组件无法删除清空所有内容 ([#6287](https://github.com/nocobase/nocobase/pull/6287)) by @katherinehhh

- **[文件管理器]**
  - 修复迁移脚本并补充测试用例 ([#6288](https://github.com/nocobase/nocobase/pull/6288)) by @mytharcher

  - 修复文件表 `path` 列的类型 ([#6294](https://github.com/nocobase/nocobase/pull/6294)) by @mytharcher

  - 修复迁移脚本并补充测试用例 ([#6288](https://github.com/nocobase/nocobase/pull/6288)) by @mytharcher

## [v1.5.15](https://github.com/nocobase/nocobase/compare/v1.5.14...v1.5.15) - 2025-02-25

### 🚀 优化

- **[文件管理器]**
  - URL 字段长度增加为 1024 ([#6275](https://github.com/nocobase/nocobase/pull/6275)) by @mytharcher

  - 文件上传时生成的文件名由随机改成文件名加随机后缀。 ([#6217](https://github.com/nocobase/nocobase/pull/6217)) by @chenos

- **[区块：操作面板]** 优化移动端样式 ([#6270](https://github.com/nocobase/nocobase/pull/6270)) by @zhangzhonghe

### 🐛 修复

- **[cli]** 优化 nocobase upgrade 命令行 ([#6280](https://github.com/nocobase/nocobase/pull/6280)) by @chenos

## [v1.5.14](https://github.com/nocobase/nocobase/compare/v1.5.13...v1.5.14) - 2025-02-24

### 🐛 修复

- **[备份管理器]** 在"从本地备份还原"操作弹窗中，点击删除图标不会清空文件列表 by @gchust

## [v1.5.13](https://github.com/nocobase/nocobase/compare/v1.5.12...v1.5.13) - 2025-02-22

### 🐛 修复

- **[client]** 修复逐个上传文件后之前的文件消失的问题 ([#6260](https://github.com/nocobase/nocobase/pull/6260)) by @mytharcher

- **[工作流：操作前事件]** 修复响应消息节点的错误消息不显示的问题 by @mytharcher

## [v1.5.12](https://github.com/nocobase/nocobase/compare/v1.5.11...v1.5.12) - 2025-02-21

### 🚀 优化

- **[工作流]** 在工作流画布的节点上隐藏节点 ID ([#6251](https://github.com/nocobase/nocobase/pull/6251)) by @mytharcher

### 🐛 修复

- **[文件管理器]** 升级 AWS SDK 版本以修复 MinIO 上传问题 ([#6253](https://github.com/nocobase/nocobase/pull/6253)) by @mytharcher

## [v1.5.11](https://github.com/nocobase/nocobase/compare/v1.5.10...v1.5.11) - 2025-02-20

### 🎉 新特性

- **[工作流]** 支持扩展工作流节点分组 ([#6237](https://github.com/nocobase/nocobase/pull/6237)) by @mytharcher
参考文档：[扩展节点分组](https://docs-cn.nocobase.com/handbook/workflow/development/api#registerinstructiongroup)
### 🐛 修复

- **[client]**
  - 关系区块中的关联按钮弹窗在移动端的显示异常 ([#6235](https://github.com/nocobase/nocobase/pull/6235)) by @katherinehhh

  - 筛选表单字段的 Picker 与格式设置不匹配 ([#6234](https://github.com/nocobase/nocobase/pull/6234)) by @katherinehhh

  - 在禁用状态下正确展示 `<Variable.TextArea />` 组件 ([#6197](https://github.com/nocobase/nocobase/pull/6197)) by @mytharcher

  - 修复上传多个文件后文件丢失的问题 ([#6247](https://github.com/nocobase/nocobase/pull/6247)) by @mytharcher

- **[工作流]**
  - 修复工作流画布的样式细节 ([#6240](https://github.com/nocobase/nocobase/pull/6240)) by @mytharcher

  - 支持修改密码时触发用户表的工作流 ([#6248](https://github.com/nocobase/nocobase/pull/6248)) by @mytharcher

## [v1.5.10](https://github.com/nocobase/nocobase/compare/v1.5.9...v1.5.10) - 2025-02-17

### 🚀 优化

- **[数据表字段：Markdown(Vditor)]** Vditor CDN 使用本地资源 ([#6229](https://github.com/nocobase/nocobase/pull/6229)) by @chenos

### 🐛 修复

- **[工作流：循环节点]** 修复循环内部有等待节点时提前退出的问题 ([#6236](https://github.com/nocobase/nocobase/pull/6236)) by @mytharcher

## [v1.5.9](https://github.com/nocobase/nocobase/compare/v1.5.8...v1.5.9) - 2025-02-17

### 🐛 修复

- **[client]**
  - 页面横向滚动条异常 ([#6232](https://github.com/nocobase/nocobase/pull/6232)) by @katherinehhh

  - 关闭子页面时，会触发多次区块数据请求 ([#6233](https://github.com/nocobase/nocobase/pull/6233)) by @zhangzhonghe

  - 界面上关联字段菜单缺少唯一性 key 属性 ([#6230](https://github.com/nocobase/nocobase/pull/6230)) by @gchust

- **[数据可视化]** 数据源标识包含 `-` 时，筛选报错的问题 ([#6231](https://github.com/nocobase/nocobase/pull/6231)) by @2013xile

## [v1.5.8](https://github.com/nocobase/nocobase/compare/v1.5.7...v1.5.8) - 2025-02-16

### 🐛 修复

- **[client]**
  - 嵌入页面无法打开字段链接的弹窗 ([#6222](https://github.com/nocobase/nocobase/pull/6222)) by @gchust

  - 编辑表单中，显示的关系字段值不会随着关联字段变化而变化 ([#6210](https://github.com/nocobase/nocobase/pull/6210)) by @Cyx649312038

- **[移动端]** 权限配置表格中，移动端菜单数据展示不全 ([#6219](https://github.com/nocobase/nocobase/pull/6219)) by @zhangzhonghe

## [v1.5.7](https://github.com/nocobase/nocobase/compare/v1.5.6...v1.5.7) - 2025-02-13

### 🚀 优化

- **[通知：站内信]** 移除 SSE 连接重试的控制台错误日志。 ([#6205](https://github.com/nocobase/nocobase/pull/6205)) by @sheldon66

### 🐛 修复

- **[client]**
  - 关系数据快捷创建操作的弹窗中组件缺少拖动设置项 ([#6201](https://github.com/nocobase/nocobase/pull/6201)) by @katherinehhh

  - 数值格式化精度设置未生效 ([#6202](https://github.com/nocobase/nocobase/pull/6202)) by @katherinehhh

  - 修复在表单中，清空某个关系字段后，然后点击提交，这个关系字段没有被清空的问题 ([#5540](https://github.com/nocobase/nocobase/pull/5540)) by @zhangzhonghe

  - 提交数据后，区块不刷新 ([#6206](https://github.com/nocobase/nocobase/pull/6206)) by @zhangzhonghe

  - 关系字段清空后，范围联动的关系字段UI数据显示清空但提交时值依然存在 ([#6207](https://github.com/nocobase/nocobase/pull/6207)) by @katherinehhh

  - 表格中无编辑权限的行记录仍显示编辑操作 ([#6204](https://github.com/nocobase/nocobase/pull/6204)) by @katherinehhh

- **[数据表字段：排序]** 修复排序字段类型在外部数据源未注册的问题 ([#6212](https://github.com/nocobase/nocobase/pull/6212)) by @mytharcher

- **[用户认证]** WebSocket 认证问题 ([#6209](https://github.com/nocobase/nocobase/pull/6209)) by @2013xile

- **[数据表字段：附件（URL）]** 修复 hook 中弃用的请求地址 by @mytharcher

## [v1.5.6](https://github.com/nocobase/nocobase/compare/v1.5.5...v1.5.6) - 2025-02-12

### 🐛 修复

- **[client]**
  - 切换页面后，区块不刷新 ([#6200](https://github.com/nocobase/nocobase/pull/6200)) by @zhangzhonghe

  - 表格行的弹窗操作新增表单区块是当前记录的子表时，区块未显示 ([#6190](https://github.com/nocobase/nocobase/pull/6190)) by @katherinehhh

  - 表格区块在无数据时高度设置不生效 ([#6192](https://github.com/nocobase/nocobase/pull/6192)) by @katherinehhh

- **[操作：自定义请求]**
  - 自定义请求按钮中“当前记录”变量值不正确 ([#6196](https://github.com/nocobase/nocobase/pull/6196)) by @zhangzhonghe

  - 自定义请求按钮兼容旧版本的变量 ([#6194](https://github.com/nocobase/nocobase/pull/6194)) by @zhangzhonghe

- **[数据可视化]** 在操作面板弹窗中添加图表区块不显示 ([#6198](https://github.com/nocobase/nocobase/pull/6198)) by @2013xile

## [v1.5.5](https://github.com/nocobase/nocobase/compare/v1.5.4...v1.5.5) - 2025-02-11

### 🚀 优化

- **[通知：站内信]** 增加在站内信渠道中获取最新消息标题和最新接收时间的测试用例。 ([#6189](https://github.com/nocobase/nocobase/pull/6189)) by @sheldon66

## [v1.5.4](https://github.com/nocobase/nocobase/compare/v1.5.3...v1.5.4) - 2025-02-10

### 🚀 优化

- **[工作流]** 为复制工作流操作增加加载中提示 ([#6179](https://github.com/nocobase/nocobase/pull/6179)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复新增数据节点的字段配置报错 ([#6187](https://github.com/nocobase/nocobase/pull/6187)) by @mytharcher

  - 筛选表单中的关系字段不显示“允许多选”配置项 ([#6174](https://github.com/nocobase/nocobase/pull/6174)) by @zhangzhonghe

  - 用联动规则将字段隐藏后，字段不再显示 ([#6182](https://github.com/nocobase/nocobase/pull/6182)) by @zhangzhonghe

- **[utils]** 优化 storage/plugins 读取逻辑 ([#6186](https://github.com/nocobase/nocobase/pull/6186)) by @chenos

- **[通知：站内信]** 修复：在渠道列表 API 的消息时间戳和标题子查询中添加用户过滤条件，确保数据隔离。 ([#6185](https://github.com/nocobase/nocobase/pull/6185)) by @deepure

- **[备份管理器]** 容错模式还原时备份中的用户上传文件未复制到 uploads 文件夹 by @gchust

## [v1.5.3](https://github.com/nocobase/nocobase/compare/v1.5.2...v1.5.3) - 2025-02-07

### 🐛 修复

- **[client]**
  - 点击 belongsToArray 字段打开的弹窗，获取的数据错误 ([#6173](https://github.com/nocobase/nocobase/pull/6173)) by @zhangzhonghe

  - 筛选表单时间字段运算符设置成“介于”，组件未变成时间范围选择器 ([#6170](https://github.com/nocobase/nocobase/pull/6170)) by @katherinehhh

  - 看板、日历区块的弹窗编辑表单未显示 "Unsaved changes" ([#6172](https://github.com/nocobase/nocobase/pull/6172)) by @katherinehhh

## [v1.5.2](https://github.com/nocobase/nocobase/compare/v1.5.1...v1.5.2) - 2025-02-06

### 🚀 优化

- **[移动端]** 当没有配置权限时，隐藏移动端配置页 header ([#6171](https://github.com/nocobase/nocobase/pull/6171)) by @zhangzhonghe

### 🐛 修复

- **[工作流：通知节点]** 确保当用户输入包含 handlebars 语法时，通知能够正确发送。 ([#6164](https://github.com/nocobase/nocobase/pull/6164)) by @sheldon66

- **[工作流：人工处理节点]** 修复人工节点使用终止按钮提交表单数据未被解析的问题 ([#6160](https://github.com/nocobase/nocobase/pull/6160)) by @mytharcher

## [v1.5.1](https://github.com/nocobase/nocobase/compare/v1.5.0...v1.5.1) - 2025-02-06

### 🐛 修复

- **[client]**
  - `子表单(弹窗)`标题翻译不正确 ([#6159](https://github.com/nocobase/nocobase/pull/6159)) by @gchust

  - 子表单字段设置为“隐藏保留值”时，其默认值变量不能正常工作 ([#6165](https://github.com/nocobase/nocobase/pull/6165)) by @zhangzhonghe

## [v1.5.0](https://github.com/nocobase/nocobase/compare/v1.4.34...v1.5.0) - 2025-02-05

## 内核优化

### 文本字段支持启用链接

打开方式支持抽屉、对话框和页面三种方式。

![20250207212903](https://static-docs.nocobase.com/20250207212903.png)

### 关系区块支持关联和解除关联操作

![20250207211837](https://static-docs.nocobase.com/20250207211837.png)

### 支持调试工作流

可以在配置工作流时直接触发工作流进行调试。

<video width="100%" controls>
      <source src="https://static-docs.nocobase.com/20250207213343_rec_.mp4" type="video/mp4">
</video>

### 优化移动端日期相关组件交互体验

![0084553986f6b3de21ca62f22d09a91a.png](https://static-docs.nocobase.com/0084553986f6b3de21ca62f22d09a91a.png)

### 前端性能优化

- 优化首屏加载速度
- 前端构建工具更改为 rspack
- 优化各插件包入口文件大小
- 提升大数据表格渲染性能
- 优化菜单切换时的卡顿现象
- 新增 lazy 和 useLazy 前端库按需加载的方法

`lazy` 和 `useLazy` 用法介绍

```ts
import {lazy, useLazy} from '@nocobase/client';

// 导出一个组件
const { RolesManagement } = lazy(() => import('./RolesManagement'), 'RolesManagement');

// 导出多个组件
const { AuthLayout, SignInPage, SignUpPage } = lazy(() => import('./pages'), 'AuthLayout', 'SignInPage', 'SignUpPage');

// 导出默认组件
const ThemeList = lazy(() => import('./components/ThemeList'));

// 返回hook
const useReactToPrint = useLazy<typeof import('react-to-print').useReactToPrint>(
  () => import('react-to-print'),
  'useReactToPrint',
);
  
// 返回library
const parseExpression = useLazy<typeof import('cron-parser').parseExpression>(
  () => import('cron-parser'),
  'parseExpression',
);
```

## 新插件

### 导入 Pro

支持异步导入操作，独立线程执行，支持大量数据导入。

![20250119221221](https://static-docs.nocobase.com/20250119221221.png)

参考文档：

- [导入 Pro](https://docs-cn.nocobase.com/handbook/action-import-pro)

### 导出 Pro

支持异步导出操作，独立线程执行，支持大量数据导出，支持附件导出。

![20250119221237](https://static-docs.nocobase.com/20250119221237.png)

参考文档：

- [导出 Pro](https://docs-cn.nocobase.com/handbook/action-export-pro)

### 模板打印

模板打印插件支持使用 Word、Excel 和 PowerPoint 编辑模板文件（支持 `.docx`、`.xlsx`、`.pptx` 格式），在模板中设置占位符和逻辑结构，从而动态生成预定格式的文件，如 `.docx`、`.xlsx`、`.pptx` 以及 `.pdf` 文件。可以广泛应用于生成各类业务文档，例如报价单、发票、合同等。

主要功能

* **多格式支持**：兼容 Word、Excel 和 PowerPoint 模板，满足不同文档生成需求。
* **动态数据填充**：通过占位符和逻辑结构，自动填充和生成文档内容。
* **灵活的模板管理**：支持添加、编辑、删除和分类管理模板，便于维护和使用。
* **丰富的模板语法**：支持基本替换、数组访问、循环、条件输出等多种模板语法，满足复杂文档生成需求。
* **格式化器支持**：提供条件输出、日期格式化、数字格式化等功能，提升文档的可读性和专业性。
* **高效的输出格式**：支持直接生成 PDF 文件，方便分享和打印。

![20250119221258](https://static-docs.nocobase.com/20250119221258.png)

参考文档：

- [模板打印](https://docs-cn.nocobase.com/handbook/action-template-print)

### 审计日志

用于记录和追踪系统内的用户活动和资源操作历史。

![20250119221319](https://static-docs.nocobase.com/20250119221319.png)

参考文档：

- [审计日志](https://docs-cn.nocobase.com/handbook/audit-logger)

### 工作流：子流程

用于在一个工作流中调用其他的流程，可以使用当前流程的变量作为子流程的输入，并使用子流程的输出作为当前流程的变量在后续节点中使用。

![20250119221334](https://static-docs.nocobase.com/20250119221334.png)

参考文档：

- [工作流：子流程](https://docs-cn.nocobase.com/handbook/workflow-subflow)

### 邮件管理

允许将对谷歌、微软邮件账户接入到NocoBase中，进行邮件的收发、查看、管理等操作。也可以将邮件集成到页面中。

![20250119221346](https://static-docs.nocobase.com/20250119221346.png)

参考文档：

- [邮件管理](https://docs-cn.nocobase.com/handbook/email-manager/usage-admin)

### 文件存储：S3(Pro)

支持兼容 S3 协议的文件存储类型，例如亚马逊 S3、阿里云 OSS、腾讯云 COS、MinIO 等。支持文件直传、私有访问。

![20250119221404](https://static-docs.nocobase.com/20250119221404.png)

参考文档：

- [文件存储：S3(Pro)](https://docs-cn.nocobase.com/handbook/file-manager/storage/s3-pro)

## [v1.4.34](https://github.com/nocobase/nocobase/compare/v1.4.33...v1.4.34) - 2025-02-02

### 🐛 修复

- **[client]** 选择数据后无法提交 ([#6148](https://github.com/nocobase/nocobase/pull/6148)) by @zhangzhonghe

## [v1.4.33](https://github.com/nocobase/nocobase/compare/v1.4.32...v1.4.33) - 2025-01-28

### 🐛 修复

- **[认证：OIDC]** 设置 state cookie 的 `same-site` 策略为 `lax` by @2013xile

## [v1.4.32](https://github.com/nocobase/nocobase/compare/v1.4.31...v1.4.32) - 2025-01-27

### 🐛 修复

- **[actions]** 修复“移动”操作以触发工作流 ([#6144](https://github.com/nocobase/nocobase/pull/6144)) by @mytharcher

## [v1.4.31](https://github.com/nocobase/nocobase/compare/v1.4.30...v1.4.31) - 2025-01-26

### 🚀 优化

- **[client]** 筛选表单中筛选组件与 filterable 中设置一致 ([#6110](https://github.com/nocobase/nocobase/pull/6110)) by @katherinehhh

- **[文件管理器]** 支持删除文件记录时同时删除文件 ([#6127](https://github.com/nocobase/nocobase/pull/6127)) by @mytharcher

### 🐛 修复

- **[database]**
  - 修复无法按 UUID 筛选的问题 ([#6138](https://github.com/nocobase/nocobase/pull/6138)) by @chareice

  - 修复更新无主键表的问题 ([#6124](https://github.com/nocobase/nocobase/pull/6124)) by @chareice

- **[client]**
  - 数据源管理页面报错 ([#6141](https://github.com/nocobase/nocobase/pull/6141)) by @zhangzhonghe

  - 当联动规则的条件中使用了没有显示出来的关系字段时，按钮的联动规则无效 ([#6140](https://github.com/nocobase/nocobase/pull/6140)) by @zhangzhonghe

  - 修复关系字段的快捷添加操作弹窗表单中变量显示不对的问题 ([#6119](https://github.com/nocobase/nocobase/pull/6119)) by @katherinehhh

  - 快捷新增的弹窗里不显示内容 ([#6123](https://github.com/nocobase/nocobase/pull/6123)) by @zhangzhonghe

  - 修复关系字段区块不请求数据的问题 ([#6125](https://github.com/nocobase/nocobase/pull/6125)) by @zhangzhonghe

  - 修复子表格/子表单上设置的联动规则，会作用关系字段的弹窗中区块中 ([#5543](https://github.com/nocobase/nocobase/pull/5543)) by @katherinehhh

- **[数据表字段：中国行政区划]** 修复行政区划关联的权限问题 ([#6137](https://github.com/nocobase/nocobase/pull/6137)) by @chareice

- **[工作流]** 修复生成错误的 SQL ([#6128](https://github.com/nocobase/nocobase/pull/6128)) by @mytharcher

- **[数据表字段：多对多 (数组)]** 修复在子表单中更新多对多（数组）字段无效的问题 ([#6136](https://github.com/nocobase/nocobase/pull/6136)) by @2013xile

- **[移动端]** 修复 移动端下拉选择只读状态可点击和文本溢出屏幕问题 ([#6130](https://github.com/nocobase/nocobase/pull/6130)) by @katherinehhh

## [v1.4.30](https://github.com/nocobase/nocobase/compare/v1.4.29...v1.4.30) - 2025-01-23

### 🐛 修复

- **[client]** 修复表格中关系字段显示 N/A 的问题 ([#6109](https://github.com/nocobase/nocobase/pull/6109)) by @zhangzhonghe

- **[数据表：树]** 禁止将树表节点自身设置为其父节点 ([#6122](https://github.com/nocobase/nocobase/pull/6122)) by @2013xile

- **[工作流：HTTP 请求节点]** 修复请求节点在循环调用中状态为等待的问题 ([#6120](https://github.com/nocobase/nocobase/pull/6120)) by @mytharcher

- **[工作流：测试工具包]** 修复依赖权限控制的多数据源测试用例 ([#6116](https://github.com/nocobase/nocobase/pull/6116)) by @mytharcher

- **[备份管理器]** 修复部分备份文件无法被正确解压还原的问题 by @gchust

## [v1.4.29](https://github.com/nocobase/nocobase/compare/v1.4.28...v1.4.29) - 2025-01-21

### 🎉 新特性

- **[区块：操作面板]** 支持配置移动端操作面板每行显示的图标数量 ([#6106](https://github.com/nocobase/nocobase/pull/6106)) by @katherinehhh

## [v1.4.28](https://github.com/nocobase/nocobase/compare/v1.4.27...v1.4.28) - 2025-01-21

### 🐛 修复

- **[client]** 关系字段设置的默认值没有更新 ([#6103](https://github.com/nocobase/nocobase/pull/6103)) by @chenos

- **[操作：批量编辑]** 移除批量编辑表单中的表单数据模板配置项 ([#6098](https://github.com/nocobase/nocobase/pull/6098)) by @katherinehhh

- **[验证码]** 修复提供商 ID 可以被修改的问题 ([#6097](https://github.com/nocobase/nocobase/pull/6097)) by @mytharcher

## [v1.4.27](https://github.com/nocobase/nocobase/compare/v1.4.26...v1.4.27) - 2025-01-18

### 🐛 修复

- **[client]** 修复在嵌入页面中，弹窗中的区块数据为空的问题 ([#6086](https://github.com/nocobase/nocobase/pull/6086)) by @zhangzhonghe

- **[工作流]** 修复在准备阶段的调度未能执行的问题 ([#6087](https://github.com/nocobase/nocobase/pull/6087)) by @mytharcher

## [v1.4.26](https://github.com/nocobase/nocobase/compare/v1.4.25...v1.4.26) - 2025-01-16

### 🚀 优化

- **[client]** 支持给 SQL 数据表添加描述 ([#6081](https://github.com/nocobase/nocobase/pull/6081)) by @2013xile

- **[resourcer]** 支持 API 请求中传入空对象作为 values 的值 ([#6070](https://github.com/nocobase/nocobase/pull/6070)) by @mytharcher

### 🐛 修复

- **[本地化]** 译文为空时，点击“删除译文按钮”不请求接口 ([#6078](https://github.com/nocobase/nocobase/pull/6078)) by @2013xile

## [v1.4.25](https://github.com/nocobase/nocobase/compare/v1.4.24...v1.4.25) - 2025-01-15

### 🚀 优化

- **[client]** 改进文件存储扩展 ([#6071](https://github.com/nocobase/nocobase/pull/6071)) by @chenos

- **[工作流]** 修复定时任务重复配置字段组件的问题 ([#6067](https://github.com/nocobase/nocobase/pull/6067)) by @mytharcher

### 🐛 修复

- **[移动端]** 修复移动端底部按钮被遮挡的问题 ([#6068](https://github.com/nocobase/nocobase/pull/6068)) by @zhangzhonghe

- **[工作流：自定义操作事件]** 修复自定义操作事件中对数据的查询请求 by @mytharcher

- **[备份管理器]** 修复 collection-fdw 插件未开启时可能出现的备份报错 by @gchust

- **[部门]** 修复部门表无法触发自定义工作流的问题 by @mytharcher

## [v1.4.24](https://github.com/nocobase/nocobase/compare/v1.4.23...v1.4.24) - 2025-01-14

### 🚀 优化

- **[client]** 日期选择器组件输入框只读 ([#6061](https://github.com/nocobase/nocobase/pull/6061)) by @Cyx649312038

### 🐛 修复

- **[client]**
  - 修复表格区块加载时误加载弹窗区块中的关系字段 ([#6060](https://github.com/nocobase/nocobase/pull/6060)) by @katherinehhh

  - 去掉详情区块中子表格右侧空隙 ([#6049](https://github.com/nocobase/nocobase/pull/6049)) by @katherinehhh

  - 整数字段在阅读模式下设置的格式也会影响编辑模式 ([#6050](https://github.com/nocobase/nocobase/pull/6050)) by @katherinehhh

  - 修复 表格样式问题，调整表头单元格样式 ([#6052](https://github.com/nocobase/nocobase/pull/6052)) by @katherinehhh

- **[database]** 修复排序字段从主键初始化问题 ([#6059](https://github.com/nocobase/nocobase/pull/6059)) by @chareice

- **[数据可视化]** 在图表查询中使用聚合函数且没有设置维度的时候去除 `LIMIT` 语句 ([#6062](https://github.com/nocobase/nocobase/pull/6062)) by @2013xile

- **[备份管理器]** 修复用户仅登录子应用后无法下载备份文件的问题 by @gchust

## [v1.4.23](https://github.com/nocobase/nocobase/compare/v1.4.22...v1.4.23) - 2025-01-13

### 🐛 修复

- **[client]** 修复在表格中固定操作列不生效的问题 ([#6048](https://github.com/nocobase/nocobase/pull/6048)) by @zhangzhonghe

- **[用户]** 在用户管理中给用户设置密码的时候关闭浏览器自动填充 ([#6041](https://github.com/nocobase/nocobase/pull/6041)) by @2013xile

- **[工作流]** 修复基于数据表字段的定时任务在启动后不执行的问题 ([#6042](https://github.com/nocobase/nocobase/pull/6042)) by @mytharcher

## [v1.4.22](https://github.com/nocobase/nocobase/compare/v1.4.21...v1.4.22) - 2025-01-10

### 🚀 优化

- **[evaluators]** 升级 formula.js 库的版本至 4.4.9 ([#6037](https://github.com/nocobase/nocobase/pull/6037)) by @mytharcher

- **[工作流]** 修复工作流插件的日志 API ([#6036](https://github.com/nocobase/nocobase/pull/6036)) by @mytharcher

### 🐛 修复

- **[工作流]** 为避免重复触发增加防御性逻辑 ([#6022](https://github.com/nocobase/nocobase/pull/6022)) by @mytharcher

## [v1.4.21](https://github.com/nocobase/nocobase/compare/v1.4.20...v1.4.21) - 2025-01-10

### 🚀 优化

- **[client]** 详情区块联动规则支持隐藏并保留值 ([#6031](https://github.com/nocobase/nocobase/pull/6031)) by @katherinehhh

### 🐛 修复

- **[client]**
  - 修复 icon 文件路径未加 public path 的问题 ([#6034](https://github.com/nocobase/nocobase/pull/6034)) by @chenos

  - 修复在表单联动规则中，如果依赖了子表格中的字段值，而导致的联动规则失效的问题 ([#5876](https://github.com/nocobase/nocobase/pull/5876)) by @zhangzhonghe

  - 修复子详情中的“当前记录”变量的字段不正确的问题 ([#6030](https://github.com/nocobase/nocobase/pull/6030)) by @zhangzhonghe

- **[备份管理器]** 修复环境变量 API_BASE_PATH 不为 /api 时下载备份失败的问题 by @gchust

## [v1.4.20](https://github.com/nocobase/nocobase/compare/v1.4.19...v1.4.20) - 2025-01-09

### 🎉 新特性

- **[client]** 添加 app.getHref() 方法 ([#6019](https://github.com/nocobase/nocobase/pull/6019)) by @chenos

### 🚀 优化

- **[client]**
  - 支持绑定工作流时进行排序 ([#6017](https://github.com/nocobase/nocobase/pull/6017)) by @mytharcher

  - 将运算引擎的说明文档链接修改为指向文档站 ([#6021](https://github.com/nocobase/nocobase/pull/6021)) by @mytharcher

  - 下拉多选组件支持 maxTagCount: 'responsive' ([#6007](https://github.com/nocobase/nocobase/pull/6007)) by @katherinehhh

  - 筛选区块中时间范围的结束时分秒默认到 23:59:59 ([#6012](https://github.com/nocobase/nocobase/pull/6012)) by @katherinehhh

- **[操作：批量编辑]** 批量编辑中提交按钮移除字段赋值和联动规则配置项 ([#6008](https://github.com/nocobase/nocobase/pull/6008)) by @katherinehhh

### 🐛 修复

- **[client]**
  - 修复 富文本字段设置必填后，填写数据删除后，必填无效 ([#6006](https://github.com/nocobase/nocobase/pull/6006)) by @katherinehhh

  - 修复 操作列按钮隐藏时没有左对齐的问题 ([#6014](https://github.com/nocobase/nocobase/pull/6014)) by @katherinehhh

  - 修复 在 REST API 配置页面点击 Collections 标签导致 Create Collections 按钮异常的问题 ([#5992](https://github.com/nocobase/nocobase/pull/5992)) by @katherinehhh

  - 修复一对多关联的 targetKey 无法选择 NanoID 字段 ([#5999](https://github.com/nocobase/nocobase/pull/5999)) by @katherinehhh

  - 修复紧凑模式下配置按钮错位问题 ([#6001](https://github.com/nocobase/nocobase/pull/6001)) by @katherinehhh

  - 修复列表组件样式 ([#5998](https://github.com/nocobase/nocobase/pull/5998)) by @mytharcher

  - 修复客户端请求中携带的 headers 被覆盖的问题 ([#6009](https://github.com/nocobase/nocobase/pull/6009)) by @2013xile

  - 修复外键、目标数据表标识字段 和源数据表标识字段 不支持中文检索的问题 ([#5997](https://github.com/nocobase/nocobase/pull/5997)) by @katherinehhh

- **[操作：导入记录]** 修复无法导入使用不同 target key 的多对多关联的问题 ([#6024](https://github.com/nocobase/nocobase/pull/6024)) by @chareice

- **[区块：地图]** 详情区块中的地图字段，应显示地图 ([#6010](https://github.com/nocobase/nocobase/pull/6010)) by @katherinehhh

- **[嵌入 NocoBase]** Embed 的 token 与 auth 存在冲突 by @chenos

## [v1.4.19](https://github.com/nocobase/nocobase/compare/v1.4.18...v1.4.19) - 2025-01-06

### 🐛 修复

- **[client]** 修 复 筛选表单/筛选操作中日期范围选择器设置 showTime=true 时未显示时间 ([#5994](https://github.com/nocobase/nocobase/pull/5994)) by @katherinehhh

## [v1.4.18](https://github.com/nocobase/nocobase/compare/v1.4.17...v1.4.18) - 2025-01-06

### 🚀 优化

- **[工作流：测试工具包]** 修复测试表中日期字段的精度 ([#5983](https://github.com/nocobase/nocobase/pull/5983)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复 数据区块在子页面中设置全高时出现滚动条 ([#5989](https://github.com/nocobase/nocobase/pull/5989)) by @katherinehhh

  - 修复 表格操作列按钮隐藏时没有左对齐 ([#5987](https://github.com/nocobase/nocobase/pull/5987)) by @katherinehhh

  - 修复 数据表管理 无法同时删除系统字段和普通字段 ([#5988](https://github.com/nocobase/nocobase/pull/5988)) by @katherinehhh

  - 修复「URL 查询参数」变量在移动端使用无效的问题 ([#5968](https://github.com/nocobase/nocobase/pull/5968)) by @Cyx649312038

- **[server]** 修复还原备份时可能出现的应用崩溃问题 ([#5981](https://github.com/nocobase/nocobase/pull/5981)) by @gchust

- **[移动端]** 修复移动端底部按钮被遮挡的问题 ([#5991](https://github.com/nocobase/nocobase/pull/5991)) by @zhangzhonghe

- **[数据可视化]** 修复在子页面的图表中使用“上级弹窗变量”时，刷新页面后变量失效的问题 ([#5984](https://github.com/nocobase/nocobase/pull/5984)) by @2013xile

- **[区块：看板]** 修复看板未加载数据表的父表字段 ([#5985](https://github.com/nocobase/nocobase/pull/5985)) by @katherinehhh

## [v1.4.17](https://github.com/nocobase/nocobase/compare/v1.4.16...v1.4.17) - 2024-12-31

### 🎉 新特性

- **[client]** 支持多对多（数组）字段使用“表格中选中的记录”变量 ([#5974](https://github.com/nocobase/nocobase/pull/5974)) by @2013xile

### 🚀 优化

- **[数据源：主数据库]** 新增名称冲突校验，防止用户创建与系统 Collection 同名的 Collection ([#5962](https://github.com/nocobase/nocobase/pull/5962)) by @chareice

- **[工作流]** 避免日期范围变量在除了筛选组件中被误用 ([#5954](https://github.com/nocobase/nocobase/pull/5954)) by @mytharcher

### 🐛 修复

- **[database]**
  - 修复 filterByTk 带 filter 参数无法删除数据的问题 ([#5976](https://github.com/nocobase/nocobase/pull/5976)) by @chareice

  - repository 的 firstOrCreate 和 updateOrCreate 方法缺失 context ([#5973](https://github.com/nocobase/nocobase/pull/5973)) by @chenos

- **[client]**
  - 修复表单中添加对一关系字段时控制台报错 ([#5975](https://github.com/nocobase/nocobase/pull/5975)) by @katherinehhh

  - 修复 子表格中通过多对一字段赋值时，删除行记录后再次选择数据未成功赋值的问题 ([#5958](https://github.com/nocobase/nocobase/pull/5958)) by @katherinehhh

  - 修复因数据包含 children 命名的字段，而导致表格区块报错的问题 ([#5951](https://github.com/nocobase/nocobase/pull/5951)) by @zhangzhonghe

- **[数据源：主数据库]** 修复旧版 unixTimestamp 字段的支持问题 ([#5967](https://github.com/nocobase/nocobase/pull/5967)) by @chareice

- **[工作流]** 修复关系字段子详情区块在人工节点界面配置中报错 ([#5953](https://github.com/nocobase/nocobase/pull/5953)) by @mytharcher

## [v1.4.16](https://github.com/nocobase/nocobase/compare/v1.4.15...v1.4.16) - 2024-12-26

### 🐛 修复

- **[client]** 修复时间戳字段精度转换问题 ([#5931](https://github.com/nocobase/nocobase/pull/5931)) by @chenos

- **[操作：复制记录]** 修复详情和表单区块中，一对一关系字段未显示配置的关系表字段 ([#5921](https://github.com/nocobase/nocobase/pull/5921)) by @katherinehhh

- **[备份管理器]** 修复 mysqldump 版本小于8时备份失败的问题 by @gchust

## [v1.4.15](https://github.com/nocobase/nocobase/compare/v1.4.14...v1.4.15) - 2024-12-24

### 🐛 修复

- **[server]** 激活插件时未自动建表 ([#5939](https://github.com/nocobase/nocobase/pull/5939)) by @chenos

- **[client]** 修复 联动规则中属性字段搜索无法匹配正确数据 ([#5925](https://github.com/nocobase/nocobase/pull/5925)) by @katherinehhh

- **[工作流]**
  - 修复定时任务使用无时区字段存在错误的问题 ([#5938](https://github.com/nocobase/nocobase/pull/5938)) by @mytharcher

  - 修复日期范围变量翻译 ([#5919](https://github.com/nocobase/nocobase/pull/5919)) by @mytharcher

## [v1.4.14](https://github.com/nocobase/nocobase/compare/v1.4.13...v1.4.14) - 2024-12-21

### 🐛 修复

- **[数据可视化]** 修复在图表查询中使用嵌套的多对多关系进行过滤时的报错。 ([#5917](https://github.com/nocobase/nocobase/pull/5917)) by @2013xile

- **[工作流：聚合查询节点]** 修复由于事务造成的统计节点结果错误问题 ([#5916](https://github.com/nocobase/nocobase/pull/5916)) by @mytharcher

## [v1.4.13](https://github.com/nocobase/nocobase/compare/v1.4.12...v1.4.13) - 2024-12-19

### 🚀 优化

- **[数据表: SQL]** 禁止在 SQL 中使用危险关键字和函数。 ([#5913](https://github.com/nocobase/nocobase/pull/5913)) by @2013xile

- **[主题编辑器]** 优化用户资料编辑和密码修改的 API 校验逻辑 ([#5912](https://github.com/nocobase/nocobase/pull/5912)) by @2013xile

### 🐛 修复

- **[数据源：主数据库]** 修复外键加载问题 ([#5903](https://github.com/nocobase/nocobase/pull/5903)) by @chareice

- **[数据表: SQL]** 修复 SQL 数据表更新后字段消失的问题。 ([#5909](https://github.com/nocobase/nocobase/pull/5909)) by @chareice

- **[备份管理器]** 修复 Windows 平台备份还原失败的问题 by @gchust

## [v1.4.11](https://github.com/nocobase/nocobase/compare/v1.4.10...v1.4.11) - 2024-12-18

### 🚀 优化

- **[client]** 使更多的组件支持“省略超出长度的内容” 配置项 ([#5888](https://github.com/nocobase/nocobase/pull/5888)) by @zhangzhonghe

- **[database]** 关系 repository 支持 firstOrCreate & updateOrCreate ([#5894](https://github.com/nocobase/nocobase/pull/5894)) by @chareice

### 🐛 修复

- **[client]**
  - 修复 外部数据源区块的复制操作请求模版没有 x-data-source 参数 ([#5882](https://github.com/nocobase/nocobase/pull/5882)) by @katherinehhh

  - 修复 插件中的表格出现横向滚动条 ([#5899](https://github.com/nocobase/nocobase/pull/5899)) by @katherinehhh

  - 修复关系字段的下拉选项中，有时会出现多余的 “N/A” 选项的问题 ([#5878](https://github.com/nocobase/nocobase/pull/5878)) by @zhangzhonghe

  - 修复 PG 视图创建错误，解决跨 schema 选择问题 ([#5881](https://github.com/nocobase/nocobase/pull/5881)) by @katherinehhh

  - 修复：表单区块分组在水平布局下样式异常 ([#5884](https://github.com/nocobase/nocobase/pull/5884)) by @katherinehhh

- **[用户]**
  - 修复用户管理中添加或修改用户后表单没有被重置的问题 。 ([#5875](https://github.com/nocobase/nocobase/pull/5875)) by @2013xile

  - 修复用户管理页面翻页或修改分页数量后，编辑用户资料并提交，分页设置会被重置的问题。 ([#5893](https://github.com/nocobase/nocobase/pull/5893)) by @2013xile

- **[数据源管理]** 修复外部数据源 Collection 的筛选问题 ([#5890](https://github.com/nocobase/nocobase/pull/5890)) by @chareice

- **[公开表单]** 修复全局切换主题导致公开表单预览页主题被影响的问题 ([#5883](https://github.com/nocobase/nocobase/pull/5883)) by @katherinehhh

## [v1.4.10](https://github.com/nocobase/nocobase/compare/v1.4.9...v1.4.10) - 2024-12-12

### 🎉 新特性

- **[操作：自定义请求]** 支持在自定义请求按钮中使用“当前表单”变量 ([#5871](https://github.com/nocobase/nocobase/pull/5871)) by @zhangzhonghe

### 🚀 优化

- **[数据可视化]** 支持在图表的查询配置中使用外键 ([#5869](https://github.com/nocobase/nocobase/pull/5869)) by @2013xile

### 🐛 修复

- **[client]** 修复关联文件表，使用数据选择器时在配置模式下显示文件表区块，非配置模式下未显示的问题 ([#5874](https://github.com/nocobase/nocobase/pull/5874)) by @katherinehhh

- **[权限控制]** 修复配置权限之后复制记录相关问题 ([#5839](https://github.com/nocobase/nocobase/pull/5839)) by @chareice

- **[工作流]** 修复自动删除执行记录时事务超时的问题 ([#5870](https://github.com/nocobase/nocobase/pull/5870)) by @mytharcher

## [v1.4.9](https://github.com/nocobase/nocobase/compare/v1.4.8...v1.4.9) - 2024-12-12

### 🐛 修复

- **[sdk]** 移除默认 locale ([#5867](https://github.com/nocobase/nocobase/pull/5867)) by @chenos

- **[client]**
  - 修复数据范围中，选择嵌套的关系字段变量，变量值为空的问题 ([#5866](https://github.com/nocobase/nocobase/pull/5866)) by @zhangzhonghe

  - 修复 列数少时右固定列滚动条出现 ([#5864](https://github.com/nocobase/nocobase/pull/5864)) by @katherinehhh

  - 修复筛选组件样式错位问题 ([#5851](https://github.com/nocobase/nocobase/pull/5851)) by @mytharcher

- **[备份管理器]** 修复自定义域名的子应用下载备份文件失败的问题 by @gchust

## [v1.4.8](https://github.com/nocobase/nocobase/compare/v1.4.7...v1.4.8) - 2024-12-10

### 🐛 修复

- **[client]**
  - 修复 关系字段 record picker 中配置的筛选表单出现数据模板缺陷 ([#5837](https://github.com/nocobase/nocobase/pull/5837)) by @katherinehhh

  - 修复 Markdown string template 关系变量没有按需加载的问题（外部数据源） ([#5791](https://github.com/nocobase/nocobase/pull/5791)) by @katherinehhh

- **[用户数据同步]** 同步数据时跳过不支持的数据类型，而不是直接报错。 ([#5835](https://github.com/nocobase/nocobase/pull/5835)) by @chenzhizdt

- **[备份管理器]**
  - 修复备份文件较大时下载窗口弹出过慢的问题 by @gchust

  - 修复备份还原子应用时会引起所有应用重启的问题 by @gchust

## [v1.4.7](https://github.com/nocobase/nocobase/compare/v1.4.6...v1.4.7) - 2024-12-09

### 🐛 修复

- **[移动端]** 修复移动端背景色问题，导致看起来区块之间没有间隙 ([#5809](https://github.com/nocobase/nocobase/pull/5809)) by @katherinehhh

## [v1.4.6](https://github.com/nocobase/nocobase/compare/v1.4.5...v1.4.6) - 2024-12-08

### 🐛 修复

- **[操作：导入记录]** 修复关联表格导入的问题 ([#5833](https://github.com/nocobase/nocobase/pull/5833)) by @chareice

- **[权限控制]** 修复 ACL 中使用 fields 查询关系的问题 ([#5832](https://github.com/nocobase/nocobase/pull/5832)) by @chareice

## [v1.4.5](https://github.com/nocobase/nocobase/compare/v1.4.4...v1.4.5) - 2024-12-08

### 🐛 修复

- **[权限控制]** 用户角色不对时刷新页面 ([#5821](https://github.com/nocobase/nocobase/pull/5821)) by @chenos

## [v1.4.4](https://github.com/nocobase/nocobase/compare/v1.4.3...v1.4.4) - 2024-12-08

### 🐛 修复

- **[client]**
  - 修复表格区块中外部数据源字段列表没有显示 ([#5825](https://github.com/nocobase/nocobase/pull/5825)) by @katherinehhh

  - 修复表单配置字段继承字段的显示问题 ([#5822](https://github.com/nocobase/nocobase/pull/5822)) by @katherinehhh

  - 修复表继承缺陷：字段列表未显示继承表字段且在数据表中无法重写继承字段 ([#5800](https://github.com/nocobase/nocobase/pull/5800)) by @katherinehhh

- **[数据可视化]** 修复在 MySQL 中格式化带时区的日期字段的问题 ([#5829](https://github.com/nocobase/nocobase/pull/5829)) by @2013xile

- **[工作流]**
  - 修复由于事务引起的外部数据源数据表同步事件触发错误 ([#5818](https://github.com/nocobase/nocobase/pull/5818)) by @mytharcher

  - 修复定时任务时间字段配置中缺少的日期类型 ([#5816](https://github.com/nocobase/nocobase/pull/5816)) by @mytharcher

- **[数据表字段：多对多 (数组)]** 修复更新对一关联表中多对多（数组）字段不生效的问题 ([#5820](https://github.com/nocobase/nocobase/pull/5820)) by @2013xile

- **[日历]**
  - 修复日历点击空白日期时报错的问题 ([#5803](https://github.com/nocobase/nocobase/pull/5803)) by @katherinehhh

  - 修复关闭通过“日历区块”打开的弹窗，导致所有弹窗都关闭的问题 ([#5793](https://github.com/nocobase/nocobase/pull/5793)) by @zhangzhonghe

- **[公开表单]** 修复子应用中公开表 QC code 扫码打开路径不正确 ([#5799](https://github.com/nocobase/nocobase/pull/5799)) by @katherinehhh

## [v1.4.3](https://github.com/nocobase/nocobase/compare/v1.4.2...v1.4.3) - 2024-12-05

### 🚀 优化

- **[test]** 支持测试用例中登录方法包含角色名称 ([#5794](https://github.com/nocobase/nocobase/pull/5794)) by @mytharcher

- **[通知：站内信]** 更新站内信详情链接的标题 ([#5742](https://github.com/nocobase/nocobase/pull/5742)) by @sheldon66

### 🐛 修复

- **[client]**
  - 修复无角色用户登录报错后，点击“登录其他账号”按钮时，token未清除的问题 ([#5790](https://github.com/nocobase/nocobase/pull/5790)) by @2013xile

  - 静默请求时丢失请求头信息 ([#5795](https://github.com/nocobase/nocobase/pull/5795)) by @chenos

  - 用户无角色时页面空白 ([#5797](https://github.com/nocobase/nocobase/pull/5797)) by @chenos

  - 修复紧凑主题下子表格 size 为 small 时出现滚动条 ([#5796](https://github.com/nocobase/nocobase/pull/5796)) by @katherinehhh

## [v1.4.2](https://github.com/nocobase/nocobase/compare/v1.4.1...v1.4.2) - 2024-12-04

### 🐛 修复

- **[工作流]** 修复异步工作流在工作流列表中未展示字段标识 ([#5787](https://github.com/nocobase/nocobase/pull/5787)) by @mytharcher

## [v1.4.1](https://github.com/nocobase/nocobase/compare/v1.4.0...v1.4.1) - 2024-12-04

### 🚀 优化

- **[cli]** 优化 pkg 命令 ([#5785](https://github.com/nocobase/nocobase/pull/5785)) by @chenos

### 🐛 修复

- **[移动端]** 修复 移动端筛选操作缺少日期输入框 ([#5786](https://github.com/nocobase/nocobase/pull/5786)) by @katherinehhh

## [v1.4.0](https://github.com/nocobase/nocobase/compare/v1.3.53...v1.4.0) - 2024-12-03

## 🎉 主要新特性

### 简化插件的添加和更新流程

![20241201170853](https://static-docs.nocobase.com/20241201170853.png)

- 插件列表直接读取本地目录
- 合并插件添加和更新流程
- 界面支持批量激活插件
- 简化商业插件下载和升级流程

参考文档：

- [发布日志 / 简化插件的添加和更新流程](https://www.nocobase.com/cn/blog/simplify-the-process-of-adding-and-updating-plugins)

### 通知

![20241201171806](https://static-docs.nocobase.com/20241201171806.png)

- 站内信：支持用户在 NocoBase 应用内实时接收消息通知；
- 电子邮件：通过电子邮件渠道发送通知，目前只支持 SMTP 传输方式；
- 企微通知：通过企业微信渠道发送通知。

参考文档：

- [通知管理](https://docs-cn.nocobase.com/handbook/notification-manager)

### 用户数据同步

![20241201172843](https://static-docs.nocobase.com/20241201172843.png)

参考文档：

- [用户数据同步](https://docs-cn.nocobase.com/handbook/user-data-sync)

### 备份管理器

![20241201170237](https://static-docs.nocobase.com/20241201170237.png)

参考文档：

- [备份管理器](https://docs-cn.nocobase.com/handbook/backups)

### 公开表单

对外分享公开表单，向匿名用户收集信息。

![20241201165614](https://static-docs.nocobase.com/20241201165614.png)

参考文档：

- [公开表单](https://docs-cn.nocobase.com/handbook/public-forms)

### 数据源：人大金仓（KingbaseES）

使用人大金仓（KingbaseES）数据库作为数据源，可以作为主数据库，也可以作为外部数据库使用。

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

参考文档：

- [数据源 - 人大金仓（KingbaseES）](https://docs-cn.nocobase.com/handbook/data-source-kingbase)

### 数据源：外部 Oracle

使用外部的 Oracle 数据库作为数据源。

![701f8271f153d417e6f25c8ba74c931d.png](https://static-docs.nocobase.com/701f8271f153d417e6f25c8ba74c931d.png)

参考文档：

- [数据源：外部 Oracle](https://docs-cn.nocobase.com/handbook/data-source-external-oracle)

### 数据表字段：附件（URL）

支持 URL 格式的附件

![e8772bec3d4b1771c1b21d087c9a4185.png](https://static-docs.nocobase.com/e8772bec3d4b1771c1b21d087c9a4185.png)

参考文档：

- [数据表字段：附件（URL）](https://docs-cn.nocobase.com/handbook/field-attachment-url)

### 字段组件：掩码

![20241201165938](https://static-docs.nocobase.com/20241201165938.png)

参考文档：

- [字段组件：掩码](https://docs-cn.nocobase.com/handbook/field-component-mask)

### 工作流：JavaScript

JavaScript 节点允许用户在工作流中执行一段自定义的服务端 JavaScript 脚本。脚本中可以使用流程上游的变量作为参数，并且可以将脚本的返回值提供给下游节点使用。

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

参考文档：

- [工作流 - JavaScript](https://docs-cn.nocobase.com/handbook/workflow-javascript)

### 数据可视化：ECharts

新增 ECharts 的图表的支持，支持漏斗图、雷达图等更多图形，并提供更友好的图形配置项。

![data-visualization-echarts](https://static-docs.nocobase.com/202410091022965.png)

参考文档：

- [数据可视化：ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts)

### 区块：分步表单

![a503e153e8d714b9ca56f512142aeef1.png](https://static-docs.nocobase.com/a503e153e8d714b9ca56f512142aeef1.png)

参考文档：

- [分步表单](https://docs-cn.nocobase.com/handbook/block-multi-step-from)

### 区块：操作面板

用于放置各种快捷操作，目前支持：

- 链接
- 扫二维码
- 弹窗
- 自定义请求

支持栅格和列表两种布局

![48bd2e280aa887f3e5bd43d6c79d6b46.png](https://static-docs.nocobase.com/48bd2e280aa887f3e5bd43d6c79d6b46.png)

参考文档：

- [操作面板](https://docs-cn.nocobase.com/handbook/block-action-panel)

## [v1.3.55](https://github.com/nocobase/nocobase/compare/v1.3.54...v1.3.55) - 2024-12-03

### 🚀 优化

- **[client]** 区块初始化器使用更匹配类型含义的图标 ([#5757](https://github.com/nocobase/nocobase/pull/5757)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复图标变更后导致的 E2E 用例执行失败 ([#5768](https://github.com/nocobase/nocobase/pull/5768)) by @mytharcher

  - 修复 select 数据为空时应显示空白 ([#5762](https://github.com/nocobase/nocobase/pull/5762)) by @katherinehhh

- **[database]** 修复带外键更新关系字段的问题 ([#5754](https://github.com/nocobase/nocobase/pull/5754)) by @chareice

- **[数据源管理]** 修复 source key 显示不正确 ([#5771](https://github.com/nocobase/nocobase/pull/5771)) by @katherinehhh

- **[工作流：自定义操作事件]**
  - 允许所有角色都可触发外部数据源数据表上的自定义操作事件 by @mytharcher

  - 修复自定义操作事件默认数据源 by @mytharcher

  - 修复自定义操作事件数据源不匹配的错误 by @mytharcher

  - 修复自定义操作事件在关系区块无法触发的问题 by @mytharcher

## [v1.3.53](https://github.com/nocobase/nocobase/compare/v1.3.52...v1.3.53) - 2024-11-28

### 🚀 优化

- **[client]**
  - 导出必要的 hook ([#5702](https://github.com/nocobase/nocobase/pull/5702)) by @mytharcher

  - 中国行政区字段插件从内置插件中移除 ([#5693](https://github.com/nocobase/nocobase/pull/5693)) by @katherinehhh

- **[工作流：操作前事件]** 移除拦截器的警告日志 by @mytharcher

### 🐛 修复

- **[cli]** Daemon 模式不删除 sock 文件 ([#5750](https://github.com/nocobase/nocobase/pull/5750)) by @chenos

- **[client]**
  - 修复多个关系字段关联同一张表时，设置关系表字段时互相影响的问题 ([#5744](https://github.com/nocobase/nocobase/pull/5744)) by @katherinehhh

  - 修复 子表格勾选框内容未对齐问题 ([#5735](https://github.com/nocobase/nocobase/pull/5735)) by @katherinehhh

  - 修复 数据选择器未显示外键字段 ([#5734](https://github.com/nocobase/nocobase/pull/5734)) by @katherinehhh

  - 改进 子表格中验证信息的反馈显示方式 ([#5700](https://github.com/nocobase/nocobase/pull/5700)) by @katherinehhh

- **[server]** 按依赖顺序加载插件 ([#5706](https://github.com/nocobase/nocobase/pull/5706)) by @chenos

- **[区块：地图]** 修复 Google Map 切换缩放等级时报错的问题 ([#5722](https://github.com/nocobase/nocobase/pull/5722)) by @katherinehhh

- **[数据源：主数据库]** 修复视图 Collection 字段获取原始字段名的问题 ([#5729](https://github.com/nocobase/nocobase/pull/5729)) by @chareice

- **[文件管理器]** 当 Endpoint 不为空时，forcePathStyle 为 true ([#5712](https://github.com/nocobase/nocobase/pull/5712)) by @chenos

## [v1.3.52](https://github.com/nocobase/nocobase/compare/v1.3.51...v1.3.52) - 2024-11-21

### 🚀 优化

- **[工作流]**
  - 去除工作流查询节点的分页条数限制 ([#5694](https://github.com/nocobase/nocobase/pull/5694)) by @mytharcher

  - 关闭工作流与执行计划之间的级联删除选项 ([#5666](https://github.com/nocobase/nocobase/pull/5666)) by @mytharcher

- **[数据源：REST API]** 优化 REST API 插件相关文案 by @katherinehhh

## [v1.3.51](https://github.com/nocobase/nocobase/compare/v1.3.50-beta...v1.3.51) - 2024-11-19

### 🐛 修复

- **[client]**
  - 修复 字段权限判断被关系字段上下文影响 ([#5672](https://github.com/nocobase/nocobase/pull/5672)) by @katherinehhh

  - 修复 联动规则赋空值保存后变为静态值空 ([#5667](https://github.com/nocobase/nocobase/pull/5667)) by @katherinehhh

- **[数据表字段：多对多 (数组)]** 修复在获取含有多对多（数组）字段的关联表记录时报错的问题 ([#5661](https://github.com/nocobase/nocobase/pull/5661)) by @2013xile

- **[区块：甘特图]** 修复甘特图添加区块时模板列表为日历区块的模板 ([#5673](https://github.com/nocobase/nocobase/pull/5673)) by @katherinehhh

- **[数据可视化]** 修复双轴图中数据转换没有对 tooltip 生效的问题 ([#5649](https://github.com/nocobase/nocobase/pull/5649)) by @2013xile

## [v1.3.50-beta](https://github.com/nocobase/nocobase/compare/v1.3.49-beta...v1.3.50-beta) - 2024-11-14

### 🐛 修复

- **[client]** 修复联动规则标题编辑时无法清空的问题 ([#5644](https://github.com/nocobase/nocobase/pull/5644)) by @katherinehhh

- **[评论]** 修复评论区块设置数据范围不生效问题 by @katherinehhh

## [v1.3.49-beta](https://github.com/nocobase/nocobase/compare/v1.3.48-beta...v1.3.49-beta) - 2024-11-13

### 🚀 优化

- **[client]** 一对一字段和多对多（数组）字段支持选择文件表 ([#5637](https://github.com/nocobase/nocobase/pull/5637)) by @mytharcher

- **[evaluators]** 将运算节点的默认计算引擎更换为 Formula.js ([#5626](https://github.com/nocobase/nocobase/pull/5626)) by @mytharcher

### 🐛 修复

- **[client]** 修复筛选按钮重置后标题恢复为默认名称的问题 ([#5635](https://github.com/nocobase/nocobase/pull/5635)) by @katherinehhh

- **[操作：导入记录]** 修复无法通过 id 字段导入多对多关联数据的问题 ([#5623](https://github.com/nocobase/nocobase/pull/5623)) by @chareice

## [v1.3.48-beta](https://github.com/nocobase/nocobase/compare/v1.3.47-beta...v1.3.48-beta) - 2024-11-11

### 🚀 优化

- **[client]** 支持隐藏菜单项 ([#5624](https://github.com/nocobase/nocobase/pull/5624)) by @chenos

- **[server]** 增加 DB_SQL_BENCHMARK 环境变量 ([#5615](https://github.com/nocobase/nocobase/pull/5615)) by @chareice

### 🐛 修复

- **[client]** 支持一对多关系使用文件表 ([#5619](https://github.com/nocobase/nocobase/pull/5619)) by @mytharcher

- **[操作：导入记录]** 修复无法通过 id 字段导入多对多关联数据的问题 ([#5623](https://github.com/nocobase/nocobase/pull/5623)) by @chareice

## [v1.3.47-beta](https://github.com/nocobase/nocobase/compare/v1.3.46-beta...v1.3.47-beta) - 2024-11-08

### 🚀 优化

- **[用户认证]** 优化登录、注册的错误提示 ([#5612](https://github.com/nocobase/nocobase/pull/5612)) by @2013xile

### 🐛 修复

- **[client]**
  - 修复子表格中的默认值问题 ([#5607](https://github.com/nocobase/nocobase/pull/5607)) by @zhangzhonghe

  - 修复 关系字段标题字段为string 类型时应支持模糊查询 ([#5611](https://github.com/nocobase/nocobase/pull/5611)) by @katherinehhh

- **[用户认证]** 修复用户使用非密码认证器登录时无法修改密码的问题 ([#5609](https://github.com/nocobase/nocobase/pull/5609)) by @2013xile

## [v1.3.45-beta](https://github.com/nocobase/nocobase/compare/v1.3.44-beta...v1.3.45-beta) - 2024-11-06

### 🐛 修复

- **[client]** 表格中关系表字段权限为该关系字段的权限 ([#5569](https://github.com/nocobase/nocobase/pull/5569)) by @katherinehhh

- **[操作：导出记录]** 修复导出过程中的多语言问题 ([#5591](https://github.com/nocobase/nocobase/pull/5591)) by @chareice

- **[操作：导入记录]** 修复无法导入多对一关联的问题 ([#5417](https://github.com/nocobase/nocobase/pull/5417)) by @chareice

## [v1.3.44-beta](https://github.com/nocobase/nocobase/compare/v1.3.43-beta...v1.3.44-beta) - 2024-11-05

### 🎉 新特性

- **[认证：OIDC]** 添加「启用 RP-initiated logout」选项 by @2013xile

### 🐛 修复

- **[client]** 修复 关系字段下拉选项中设置单选字段为标题字段时筛选不生效的问题 ([#5581](https://github.com/nocobase/nocobase/pull/5581)) by @katherinehhh

## [v1.3.43-beta](https://github.com/nocobase/nocobase/compare/v1.3.42-beta...v1.3.43-beta) - 2024-11-05

### 🚀 优化

- **[client]** 数字精确度支持配置 8 位数 ([#5552](https://github.com/nocobase/nocobase/pull/5552)) by @chenos

### 🐛 修复

- **[client]** 修复联动样式在表单里不更新。 ([#5539](https://github.com/nocobase/nocobase/pull/5539)) by @sheldon66

- **[认证：API 密钥]** 修复 API keys 设置页面的 URL 路径 ([#5562](https://github.com/nocobase/nocobase/pull/5562)) by @2013xile

- **[移动端]** 修复预览图片被页面覆盖的问题 ([#5535](https://github.com/nocobase/nocobase/pull/5535)) by @zhangzhonghe

- **[区块：地图]** 子详情中地图字段，渲染地图不正确，应该显示坐标字符/详情区块，没有值的字段，会显示上一条数据的值 ([#5526](https://github.com/nocobase/nocobase/pull/5526)) by @katherinehhh

- **[数据表：树]** 修复更新路径表时的报错 ([#5551](https://github.com/nocobase/nocobase/pull/5551)) by @2013xile

## [v1.3.42-beta](https://github.com/nocobase/nocobase/compare/v1.3.41-beta...v1.3.42-beta) - 2024-10-28

### 🐛 修复

- **[数据表：树]** 修复解除关联子节点，节点路径没有更新的问题 ([#5522](https://github.com/nocobase/nocobase/pull/5522)) by @2013xile

## [v1.3.41-beta](https://github.com/nocobase/nocobase/compare/v1.3.40-beta...v1.3.41-beta) - 2024-10-27

### 🚀 优化

- **[权限控制]** 优化权限系统中的大表查询性能 ([#5496](https://github.com/nocobase/nocobase/pull/5496)) by @chareice

## [v1.3.40-beta](https://github.com/nocobase/nocobase/compare/v1.3.39-beta...v1.3.40-beta) - 2024-10-25

### 🎉 新特性

- **[认证：OIDC]** 添加“跳过 SSL 验证“选项 by @2013xile

### 🚀 优化

- **[client]** 勾选字段未勾选时显示禁用的未勾选框 ([#5503](https://github.com/nocobase/nocobase/pull/5503)) by @katherinehhh

### 🐛 修复

- **[database]** 修复字符串操作符”包含“和”不包含“没有正确处理 `null` 值的问题 ([#5509](https://github.com/nocobase/nocobase/pull/5509)) by @2013xile

- **[client]** 修复联动规则中使用「URL参数变量」作条件判断无效 ([#5504](https://github.com/nocobase/nocobase/pull/5504)) by @katherinehhh

- **[区块：地图]** 修复高德地图多次调用 `load` 方法，导致多张地图存在时，部分地图展示报错的问题 ([#5490](https://github.com/nocobase/nocobase/pull/5490)) by @Cyx649312038

## [v1.3.39-beta](https://github.com/nocobase/nocobase/compare/v1.3.38-beta...v1.3.39-beta) - 2024-10-24

### 🐛 修复

- **[client]** 修复弹窗中无法添加筛选区块的问题 ([#5502](https://github.com/nocobase/nocobase/pull/5502)) by @zhangzhonghe

## [v1.3.38-beta](https://github.com/nocobase/nocobase/compare/v1.3.37-beta...v1.3.38-beta) - 2024-10-24

### 🐛 修复

- **[client]**
  - 使用简单分页的数据表在列表区块上分页异常 ([#5500](https://github.com/nocobase/nocobase/pull/5500)) by @katherinehhh

  - 在非配置状态下，编辑表单应只显示本表区块 ([#5499](https://github.com/nocobase/nocobase/pull/5499)) by @katherinehhh

- **[工作流：HTTP 请求节点]** 修复变量文本输入框中在粘贴时可能产生非标准空格导致服务端逻辑错误的问题 ([#5497](https://github.com/nocobase/nocobase/pull/5497)) by @mytharcher

- **[部门]** 修复在所属部门角色下外部数据源权限判断不正确的问题 by @2013xile

## [v1.3.37-beta](https://github.com/nocobase/nocobase/compare/v1.3.36-beta...v1.3.37-beta) - 2024-10-23

### 🚀 优化

- **[client]** 调整绑定工作流配置面板中的提示文案 ([#5494](https://github.com/nocobase/nocobase/pull/5494)) by @mytharcher

### 🐛 修复

- **[文件管理器]** 修复文件表在关联区块内无法上传和删除记录的问题 ([#5493](https://github.com/nocobase/nocobase/pull/5493)) by @mytharcher

## [v1.3.36-beta](https://github.com/nocobase/nocobase/compare/v1.3.35-beta...v1.3.36-beta) - 2024-10-22

### 🐛 修复

- **[数据表：树]** 修复继承的树表没有自动创建路径表的问题 ([#5486](https://github.com/nocobase/nocobase/pull/5486)) by @2013xile

- **[日历]** 当表格有数据时分页器应该显示 ([#5480](https://github.com/nocobase/nocobase/pull/5480)) by @katherinehhh

- **[文件管理器]** 修复由于上传规则 hook 改动导致文件无法上传的问题 ([#5460](https://github.com/nocobase/nocobase/pull/5460)) by @mytharcher

- **[数据表字段：公式]** 修复 多层子表格嵌套时，公式计算结果的错误 ([#5469](https://github.com/nocobase/nocobase/pull/5469)) by @gu-zhichao

## [v1.3.35-beta](https://github.com/nocobase/nocobase/compare/v1.3.34-beta...v1.3.35-beta) - 2024-10-21

### 🚀 优化

- **[工作流：邮件发送节点]** 为邮件节点的表单项增加占位提示内容 ([#5470](https://github.com/nocobase/nocobase/pull/5470)) by @mytharcher

## [v1.3.34-beta](https://github.com/nocobase/nocobase/compare/v1.3.33-beta...v1.3.34-beta) - 2024-10-21

### 🎉 新特性

- **[test]** 筛选表单中的关系字段支持配置是否多选 ([#5451](https://github.com/nocobase/nocobase/pull/5451)) by @zhangzhonghe

- **[client]** 添加一个名为“上级对象”的变量 ([#5449](https://github.com/nocobase/nocobase/pull/5449)) by @zhangzhonghe
参考文档：[上级对象](https://docs-cn.nocobase.com/handbook/ui/variables#%E4%B8%8A%E7%BA%A7%E5%AF%B9%E8%B1%A1)
### 🐛 修复

- **[client]**
  - 修复 URL 查询参数变量不会被解析的问题 ([#5454](https://github.com/nocobase/nocobase/pull/5454)) by @zhangzhonghe

  - 多层关系下的子表格中关系字段设置数据范围后，选择关系数据后其他行记录被清空 ([#5441](https://github.com/nocobase/nocobase/pull/5441)) by @katherinehhh

  - 修复表格行选中时的背景颜色 ([#5445](https://github.com/nocobase/nocobase/pull/5445)) by @mytharcher

- **[区块：地图]** 表格中的地图字段不应该有缩放等级配置项 ([#5457](https://github.com/nocobase/nocobase/pull/5457)) by @katherinehhh

- **[文件管理器]** 屏蔽阅读模式下附件字段对存储规则不必要的查询 ([#5447](https://github.com/nocobase/nocobase/pull/5447)) by @mytharcher

- **[数据源：主数据库]** 修复由于更换组件导致的 E2E 测试不通过 ([#5437](https://github.com/nocobase/nocobase/pull/5437)) by @mytharcher

## [v1.3.33-beta](https://github.com/nocobase/nocobase/compare/v1.3.32-beta...v1.3.33-beta) - 2024-10-16

### 🚀 优化

- **[工作流]** 对更新数据节点的批量模式增加关于关系字段的提示 ([#5426](https://github.com/nocobase/nocobase/pull/5426)) by @mytharcher

### 🐛 修复

- **[client]**
  - 修复个人资料配置弹窗被子页面遮挡住的问题 ([#5409](https://github.com/nocobase/nocobase/pull/5409)) by @zhangzhonghe

  - 工作流节点变量不显示继承表字段 ([#5415](https://github.com/nocobase/nocobase/pull/5415)) by @chenos

  - 使用筛选区块筛选表格数据时，清空筛选数据查询数据分页器没有跟着调整 ([#5411](https://github.com/nocobase/nocobase/pull/5411)) by @katherinehhh

- **[文件管理器]** 移除文件表选择存储空间时仅加载 20 个的限制 ([#5430](https://github.com/nocobase/nocobase/pull/5430)) by @mytharcher

- **[操作：复制记录]** 修复批量编辑弹窗不显示内容的问题 ([#5412](https://github.com/nocobase/nocobase/pull/5412)) by @zhangzhonghe

- **[数据可视化]** 修复图表筛选区块中不显示默认值的问题 ([#5405](https://github.com/nocobase/nocobase/pull/5405)) by @zhangzhonghe

## [v1.3.32-beta](https://github.com/nocobase/nocobase/compare/v1.3.31-beta...v1.3.32-beta) - 2024-10-13

### 🐛 修复

- **[client]** 关系字段设置必填，数据范围中设置变量后，选中值却报字段必填不通过 ([#5399](https://github.com/nocobase/nocobase/pull/5399)) by @katherinehhh

## [v1.3.31-beta](https://github.com/nocobase/nocobase/compare/v1.3.30-beta...v1.3.31-beta) - 2024-10-11

### 🐛 修复

- **[client]** 修复在筛选表单中使用行政区划字段无法正确筛选出值的问题 ([#5390](https://github.com/nocobase/nocobase/pull/5390)) by @zhangzhonghe

- **[操作：导入记录]** 修复导入 wps 文件报错的问题 ([#5397](https://github.com/nocobase/nocobase/pull/5397)) by @chareice

## [v1.3.30-beta](https://github.com/nocobase/nocobase/compare/v1.3.29-beta...v1.3.30-beta) - 2024-10-11

### 🐛 修复

- **[client]**
  - 修复在移动端中，显示文件表关系字段时报渲染错误的问题 ([#5387](https://github.com/nocobase/nocobase/pull/5387)) by @zhangzhonghe

  - 修复创建区块菜单无法加载更多数据表的问题 ([#5388](https://github.com/nocobase/nocobase/pull/5388)) by @zhangzhonghe

- **[工作流：自定义操作事件]**
  - 修复 自定义工作流事件提交成功后跳转不生效 by @katherinehhh

  - 自定义工作流事件提交成功后跳转不生效 by @katherinehhh

## [v1.3.29-beta](https://github.com/nocobase/nocobase/compare/v1.3.28-beta...v1.3.29-beta) - 2024-10-10

### 🚀 优化

- **[client]** 创建表单中也不禁用日期变量 ([#5376](https://github.com/nocobase/nocobase/pull/5376)) by @zhangzhonghe

### 🐛 修复

- **[工作流：SQL 节点]** 修复在 SQL 节点中调用存储过程没有返回结果时导致错误的问题 ([#5385](https://github.com/nocobase/nocobase/pull/5385)) by @mytharcher

- **[工作流]** 修复基于时间字段的定时任务导致报错的问题，并支持其他数据库数据源 ([#5364](https://github.com/nocobase/nocobase/pull/5364)) by @mytharcher

## [v1.3.28-beta](https://github.com/nocobase/nocobase/compare/v1.3.27-beta...v1.3.28-beta) - 2024-10-09

### 🚀 优化

- **[client]** 将 cdn 链接保存为本地资源，以防止在内网部署时请求外部资源 ([#5375](https://github.com/nocobase/nocobase/pull/5375)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 修复在“用户和权限”配置页打开的弹窗被其它弹窗遮挡的问题 ([#5373](https://github.com/nocobase/nocobase/pull/5373)) by @zhangzhonghe

  - 修复在子页面中删除 tab 页后，再次打开后未生效的问题 ([#5362](https://github.com/nocobase/nocobase/pull/5362)) by @zhangzhonghe

  - 修复继承表关系字段无法正常使用变量的问题 ([#5346](https://github.com/nocobase/nocobase/pull/5346)) by @zhangzhonghe

  - 修复字段配置中当前数据表字段与关系表字段互相影响缺陷 ([#5343](https://github.com/nocobase/nocobase/pull/5343)) by @katherinehhh

- **[操作：导入记录]** 修复导入大日期结果不正确的问题 ([#5356](https://github.com/nocobase/nocobase/pull/5356)) by @chareice

- **[工作流]** 修复新增、更新节点中配置关系字段赋值时切换组件导致的页面崩溃 ([#5366](https://github.com/nocobase/nocobase/pull/5366)) by @mytharcher

- **[区块：甘特图]** 修复在甘特图中打开弹窗，然后再关闭，导致子页面也被关闭的问题 ([#5370](https://github.com/nocobase/nocobase/pull/5370)) by @zhangzhonghe

## [v1.3.27-beta](https://github.com/nocobase/nocobase/compare/v1.3.26-beta...v1.3.27-beta) - 2024-09-30

### 🐛 修复

- **[client]** 修复变量“表格中选中的记录” ([#5337](https://github.com/nocobase/nocobase/pull/5337)) by @zhangzhonghe

- **[工作流：自定义操作事件]** 修复自定义操作事件在关系区块中不触发的问题 by @mytharcher

## [v1.3.26-beta](https://github.com/nocobase/nocobase/compare/v1.3.25-beta...v1.3.26-beta) - 2024-09-29

### 🚀 优化

- **[client]** 隐藏移动端的滚动条 ([#5339](https://github.com/nocobase/nocobase/pull/5339)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 修复在嵌入页面中无法打开子页面的问题 ([#5335](https://github.com/nocobase/nocobase/pull/5335)) by @zhangzhonghe

  - 修复弹窗被遮挡的问题 ([#5338](https://github.com/nocobase/nocobase/pull/5338)) by @zhangzhonghe

  - 修复移动端子页面中，使用数据模板创建区块时，样式异常的问题 ([#5340](https://github.com/nocobase/nocobase/pull/5340)) by @zhangzhonghe

  - 修复通过页面菜单关闭子页面时，不刷新页面区块数据的问题 ([#5331](https://github.com/nocobase/nocobase/pull/5331)) by @zhangzhonghe

- **[操作：导出记录]** 修复 decimal 类型字段的导出格式 ([#5316](https://github.com/nocobase/nocobase/pull/5316)) by @chareice

- **[区块：看板]** 修复在嵌入页面中，点击看板卡片后，无法打开弹窗的问题 ([#5326](https://github.com/nocobase/nocobase/pull/5326)) by @zhangzhonghe

## [v1.3.25-beta](https://github.com/nocobase/nocobase/compare/v1.3.24-beta...v1.3.25-beta) - 2024-09-25

### 🚀 优化

- **[client]** 增加日语本地化翻译 ([#5292](https://github.com/nocobase/nocobase/pull/5292)) by @Albert-mah

- **[工作流]** 增加对未注册的节点类型导致错误的跟踪报错 ([#5319](https://github.com/nocobase/nocobase/pull/5319)) by @mytharcher

### 🐛 修复

- **[client]** 修复变量中没有显示完整字段的问题 ([#5310](https://github.com/nocobase/nocobase/pull/5310)) by @zhangzhonghe

- **[工作流]** 修复数据表事件中发生改变的字段被删除后报错的问题 ([#5318](https://github.com/nocobase/nocobase/pull/5318)) by @mytharcher

- **[操作：导出记录]** 修复导出操作时，关联表中的字段未执行interface渲染逻辑 ([#5296](https://github.com/nocobase/nocobase/pull/5296)) by @gchust

## [v1.3.24-beta](https://github.com/nocobase/nocobase/compare/v1.3.23-beta...v1.3.24-beta) - 2024-09-23

### 🐛 修复

- **[client]**
  - markdown 的handlebars 模板使用#each 渲染数组数据时数据没有正常显示 ([#5305](https://github.com/nocobase/nocobase/pull/5305)) by @katherinehhh

  - 外部数据库数据源表格列头不支持排序的问题 ([#5293](https://github.com/nocobase/nocobase/pull/5293)) by @katherinehhh

- **[数据可视化]** 修复图表区块在暗黑主题下的样式问题 ([#5302](https://github.com/nocobase/nocobase/pull/5302)) by @2013xile

## [v1.3.23-beta](https://github.com/nocobase/nocobase/compare/v1.3.22-beta...v1.3.23-beta) - 2024-09-19

### 🚀 优化

- **[用户]** 优化用户管理表格的渲染速度 ([#5276](https://github.com/nocobase/nocobase/pull/5276)) by @2013xile

- **[部门]** 优化部门管理中的用户表格的渲染速度 by @2013xile

### 🐛 修复

- **[client]**
  - 修复用户和权限设置页面中`通用操作权限表格`的`rowKey`不正确问题 ([#5287](https://github.com/nocobase/nocobase/pull/5287)) by @gchust

  - 修复在筛选表单中，为日期字段设置日期变量后，导致的筛选结果不正确的问题 ([#5257](https://github.com/nocobase/nocobase/pull/5257)) by @zhangzhonghe

  - 表格没有数据时且设置了区块高度时无法设置列宽 ([#5256](https://github.com/nocobase/nocobase/pull/5256)) by @katherinehhh

  - 修复表格区块在一开始出现空白行的问题 ([#5284](https://github.com/nocobase/nocobase/pull/5284)) by @zhangzhonghe

- **[create-nocobase-app]** 修复在新增自动编码字段时，配置编码规则的弹窗缺少提交按钮的问题 ([#5281](https://github.com/nocobase/nocobase/pull/5281)) by @zhangzhonghe

- **[database]** 导入支持勾选字段 ([#4992](https://github.com/nocobase/nocobase/pull/4992)) by @chareice

- **[evaluators]** 修复 Math.js 计算输出矩阵类型导致的问题 ([#5270](https://github.com/nocobase/nocobase/pull/5270)) by @mytharcher

- **[日历]** 删除日程弹窗选项不能选择 ([#5274](https://github.com/nocobase/nocobase/pull/5274)) by @katherinehhh

- **[操作：导出记录]** 修复在导出操作中，生成数据表格时，缺少上下文的问题 ([#5286](https://github.com/nocobase/nocobase/pull/5286)) by @gchust

## [v1.3.22-beta](https://github.com/nocobase/nocobase/compare/v1.3.21-beta...v1.3.22-beta) - 2024-09-12

### 🎉 新特性

- **[操作：自定义请求]** 自定义请求按钮的配置中，支持使用 API token 变量 ([#5263](https://github.com/nocobase/nocobase/pull/5263)) by @zhangzhonghe
参考文档：[自定义请求-变量](https://docs-cn.nocobase.com/handbook/action-custom-request#%E5%8F%98%E9%87%8F)
### 🚀 优化

- **[数据表字段：Markdown(Vditor)]** 在外部数据源中选字段 UI 的时支持 Vidtor ([#5246](https://github.com/nocobase/nocobase/pull/5246)) by @katherinehhh

### 🐛 修复

- **[日历]** 日历区块结束日期跨月时无法正确显示的问题 ([#5239](https://github.com/nocobase/nocobase/pull/5239)) by @katherinehhh

## [v1.3.21-beta](https://github.com/nocobase/nocobase/compare/v1.3.20-beta...v1.3.21-beta) - 2024-09-10

### 🐛 修复

- **[client]** 修复在使用联动规则时报错的问题（通过 create-nocobase-app 安装的 NocoBase） ([#5249](https://github.com/nocobase/nocobase/pull/5249)) by @zhangzhonghe

## [v1.3.20-beta](https://github.com/nocobase/nocobase/compare/v1.3.19-beta...v1.3.20-beta) - 2024-09-10

### 🚀 优化

- **[client]** 数据区块中支持显示更深层级的关系字段 ([#5243](https://github.com/nocobase/nocobase/pull/5243)) by @zhangzhonghe

### 🐛 修复

- **[client]**
  - 修改菜单标题时没有实时生效 ([#5207](https://github.com/nocobase/nocobase/pull/5207)) by @katherinehhh

  - 支持 Handlebars 模板中关系字段的预加载 ([#5236](https://github.com/nocobase/nocobase/pull/5236)) by @katherinehhh

- **[数据可视化]** 修复存在多个数据源时，图表的数据源上下文不正确的问题 ([#5237](https://github.com/nocobase/nocobase/pull/5237)) by @2013xile

## [v1.3.19-beta](https://github.com/nocobase/nocobase/compare/v1.3.18-beta...v1.3.19-beta) - 2024-09-08

### 🐛 修复

- **[client]** 修复因弹窗与 Link 按钮一起使用，所导致的 URL 异常的问题 ([#5219](https://github.com/nocobase/nocobase/pull/5219)) by @zhangzhonghe

## [v1.3.18-beta](https://github.com/nocobase/nocobase/compare/v1.3.17-beta...v1.3.18-beta) - 2024-09-08

### 🐛 修复

- **[数据表字段：多对多 (数组)]** 修复删除包含多对多（数组）字段的数据表时出现的错误 ([#5231](https://github.com/nocobase/nocobase/pull/5231)) by @2013xile

## [v1.3.17-beta](https://github.com/nocobase/nocobase/compare/v1.3.16-beta...v1.3.17-beta) - 2024-09-07

### 🎉 新特性

- **[client]** 支持在子表单和子表格中配置联动规则。 ([#5159](https://github.com/nocobase/nocobase/pull/5159)) by @zhangzhonghe

### 🚀 优化

- **[client]**
  - 显示时间时默认时间为 00:00:00 ([#5226](https://github.com/nocobase/nocobase/pull/5226)) by @chenos

  - 插件依赖版本不一致时也可以激活插件 ([#5225](https://github.com/nocobase/nocobase/pull/5225)) by @chenos

- **[server]** 提供更友好的应用级错误提示 ([#5220](https://github.com/nocobase/nocobase/pull/5220)) by @chenos

### 🐛 修复

- **[client]** 修复在详情区块中出现的 “Maximum call stack size exceeded” 错误 ([#5228](https://github.com/nocobase/nocobase/pull/5228)) by @zhangzhonghe

- **[数据表字段：多对多 (数组)]** 修复将 `uid` 类型的字段设置为多对多（数组）字段的目标键时出现的报错 ([#5229](https://github.com/nocobase/nocobase/pull/5229)) by @2013xile

- **[UI schema 存储服务]** 修复 member 角色点击按钮报无权限的问题 ([#5206](https://github.com/nocobase/nocobase/pull/5206)) by @zhangzhonghe

- **[工作流]** 修复创建工作流后类型列展示错误文字的问题 ([#5222](https://github.com/nocobase/nocobase/pull/5222)) by @mytharcher

- **[用户]** 移除在用户管理中编辑用户资料时的手机号格式验证 ([#5221](https://github.com/nocobase/nocobase/pull/5221)) by @2013xile

## [v1.3.16-beta](https://github.com/nocobase/nocobase/compare/v1.3.15-beta...v1.3.16-beta) - 2024-09-06

### 🚀 优化

- **[client]**
  - 有UI配置权限但没有数据表查看权限时添加占位 ([#5208](https://github.com/nocobase/nocobase/pull/5208)) by @katherinehhh

  - 当缺少 logo 时，显示系统标题。 ([#5175](https://github.com/nocobase/nocobase/pull/5175)) by @maoyutofu

- **[用户认证]** 系统标题支持换行 ([#5211](https://github.com/nocobase/nocobase/pull/5211)) by @chenos

- **[工作流：SQL 节点]** 将 SQL 操作节点的结果数据结构调整为仅包含数据部分。 ([#5189](https://github.com/nocobase/nocobase/pull/5189)) by @mytharcher
Reference: [SQL 操作](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)
- **[权限控制]** 使 `Users & Permissions` 配置页的 `Permissions` Tab 面板可扩展。 ([#5216](https://github.com/nocobase/nocobase/pull/5216)) by @zhangzhonghe
Reference: [开发指南](https://docs-cn.nocobase.com/handbook/acl#%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97)
- **[操作：批量编辑]** 批量更新、批量编辑的 文案 ，“所有” 改成 “全表” ([#5200](https://github.com/nocobase/nocobase/pull/5200)) by @katherinehhh

### 🐛 修复

- **[client]**
  - 修复联动规则中切换赋值类型时组件显示错误 ([#5180](https://github.com/nocobase/nocobase/pull/5180)) by @katherinehhh

  - 修复数据范围中使用变量报错的问题。 ([#5195](https://github.com/nocobase/nocobase/pull/5195)) by @zhangzhonghe

  - 自定义请求按钮的请求后刷新数据设置不生效 ([#5188](https://github.com/nocobase/nocobase/pull/5188)) by @katherinehhh

- **[数据可视化]** 修复聚合选项字段时，获取结果不正确的问题 ([#5214](https://github.com/nocobase/nocobase/pull/5214)) by @2013xile

- **[数据源管理]** 修复`用户和权限`设置页面中数据源表格`rowKey`不正确问题 ([#5215](https://github.com/nocobase/nocobase/pull/5215)) by @gchust

- **[工作流：HTTP 请求节点]** 修复请求节点参数使用非字符串变量时的问题。 ([#5204](https://github.com/nocobase/nocobase/pull/5204)) by @mytharcher

- **[数据表字段：公式]** 修复公式字段时间类型测试用例 ([#5197](https://github.com/nocobase/nocobase/pull/5197)) by @katherinehhh

- **[应用的备份与还原（废弃）]** 修复测试用例报错 ([#5201](https://github.com/nocobase/nocobase/pull/5201)) by @chenos

- **[数据源：REST API]**
  - rest api 数据表 标识不可编辑 by @katherinehhh

  - Rest api  多语言调整 by @katherinehhh

## [v1.3.15-beta](https://github.com/nocobase/nocobase/compare/v1.3.14-beta...v1.3.15-beta) - 2024-09-04

### 🐛 修复

- **[工作流]** 修复工作流变量中缺少部分字段可选的问题。 ([#5187](https://github.com/nocobase/nocobase/pull/5187)) by @mytharcher

- **[数据表字段：Markdown(Vditor)]** 修复  markdown(Vditor) 字段没有正确显数据（缓存） ([#5176](https://github.com/nocobase/nocobase/pull/5176)) by @katherinehhh

## [v1.3.14-beta](https://github.com/nocobase/nocobase/compare/v1.3.13-beta...v1.3.14-beta) - 2024-09-03

### 🎉 新特性

- **[client]** 支持在筛选表单中配置对多关系目标表中的字段。 ([#5178](https://github.com/nocobase/nocobase/pull/5178)) by @zhangzhonghe

### 🚀 优化

- **[操作：自定义请求]** 去掉添加数据表单自定义请求按钮的联动规则 ([#5179](https://github.com/nocobase/nocobase/pull/5179)) by @katherinehhh

### 🐛 修复

- **[数据表字段：公式]** 公式字段使用日期字段时页面报错 ([#5168](https://github.com/nocobase/nocobase/pull/5168)) by @katherinehhh

## [v1.3.13-beta](https://github.com/nocobase/nocobase/compare/v1.3.12-beta...v1.3.13-beta) - 2024-09-03

### 🐛 修复

- **[操作：导出记录]** 修复导出关系数据不正确的问题 ([#5170](https://github.com/nocobase/nocobase/pull/5170)) by @chareice
