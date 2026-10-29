# 更新日志

本文件记录 NocoBase 3 的所有重要变更，每次发布一节：`nocobase-v3-beta/<日期>.<序号>` 是预览版，`release/<日期>.<序号>` 是正式版。每次发布的包版本见对应的 GitHub Release，各个包自己的变更见包内的 CHANGELOG.md。

## [nocobase-v3-beta/2026-10-28.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-28.2)

### 🎉 新特性

- **[演示模式]** 完善演示账户角色显示和重置布局，并为应用提供统一的演示模式判断及有副作用请求拦截能力。 ([#11204](https://github.com/nocobase/nocobase/pull/11204)) by @gchust

### 🐛 修复

- **[Agent]** 会话刷新时及时显示已保存的进度消息，并保留正在生成的执行机回复。 ([#11202](https://github.com/nocobase/nocobase/pull/11202)) by @2013xile
- **[演示模式]** 部署时不再要求填写演示模式的可写数据表变量。 ([#11207](https://github.com/nocobase/nocobase/pull/11207)) by @2013xile

## [release-beta/2026-10-28.1](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-28.1)

### 🎉 新特性

- **[Agent]** 支持带任务关联、排队消息和用量的 Runner Agent 对话，并可保留对话历史更换 Agent ([#11189](https://github.com/nocobase/nocobase/pull/11189)) by @2013xile
- **[发布管理]** 支持下载发布版本压缩包，并区分预览和测试环境、查看各环境应用数量 ([#11190](https://github.com/nocobase/nocobase/pull/11190)) by @2013xile
- **[应用模板]** 模板应用默认防止表单和标准动作重复提交，支持安全重试，并为定制应用提供协同升级能力。 ([#11192](https://github.com/nocobase/nocobase/pull/11192)) by @katherinehhh
- **[客户端]** 应用模板在字段旁显示校验原因，自动定位可编辑错误，并在提交失败后保留输入。 ([#11193](https://github.com/nocobase/nocobase/pull/11193)) by @katherinehhh

### 🚀 优化

- **[权限]** 角色权限改用标准顶部标签、紧凑复选框分组、菜单路由和全局授权状态筛选，便于浏览与配置。 ([#11201](https://github.com/nocobase/nocobase/pull/11201)) by @katherinehhh

### 🐛 修复

- **[应用模板]**
  - 删除记录后自动修正无效列表页，并保留筛选、排序及详情返回上下文。 ([#11186](https://github.com/nocobase/nocobase/pull/11186)) by @katherinehhh
  - 模板列表从详情返回时保留排序、每页条数和来源标签，并提供定制应用的源码升级说明。 ([#11187](https://github.com/nocobase/nocobase/pull/11187)) by @katherinehhh
- **[演示模式]** 通过 Users 偏好 API 设置的语言和外观按演示访客会话独立保存，普通部署行为保持不变。 ([#11191](https://github.com/nocobase/nocobase/pull/11191)) by @gchust
- **[Skills]** 允许 Agent 开发无需发布的 App 本地插件，并修复插件 Skill 的 CLI 测试示例在公开 npm 包环境下的运行问题。 ([#11194](https://github.com/nocobase/nocobase/pull/11194)) by @chenos
- **[界面]**
  - 将工作流节点的配置操作显示为紧凑图标按钮，为节点标题保留可读空间。 ([#11195](https://github.com/nocobase/nocobase/pull/11195)) by @mytharcher
  - 将文件预览弹窗的下载按钮移至文件名右侧，避免与窗口右上角的关闭按钮错位。 ([#11196](https://github.com/nocobase/nocobase/pull/11196)) by @mytharcher
- **[Agent]**
  - 发送消息时统一确认最终执行机 Agent，避免为未使用的选择记录切换提示。 ([#11198](https://github.com/nocobase/nocobase/pull/11198)) by @2013xile
  - 对应任务恢复后结清关联会话提问，同时保留更新的问题和未读回复。 ([#11203](https://github.com/nocobase/nocobase/pull/11203)) by @2013xile

## [release-beta/2026-10-27.1](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-27.1)

### 🎉 新特性

- **[插件开发]** 支持直接在已有应用的 packages 工作区中创建插件及自定义 scope 插件，无需下载 NocoBase 源码。 ([#11175](https://github.com/nocobase/nocobase/pull/11175)) by @chenos

### 🚀 优化

- **[Skills]** 插件开发指引随 App 依赖版本提供，并在升级时引导迁移旧的全局 Skill。 ([#11178](https://github.com/nocobase/nocobase/pull/11178)) by @chenos

## [release-beta/2026-10-26.3](https://github.com/nocobase/nocobase/releases/tag/release-beta%2F2026-10-26.3)

### 🎉 新特性

- **[命令行]** 支持在应用工作区中使用私有共享包，涵盖开发更新、包检查和独立部署。 ([#11170](https://github.com/nocobase/nocobase/pull/11170)) by @chenos

### 🚀 优化

- **[插件开发]** 可编辑的文件与通知界面统一由 UI Library 提供并附带翻译，同时移除插件自有 Registry 配方和脚手架的 Registry 能力。 ([#11173](https://github.com/nocobase/nocobase/pull/11173)) by @chenos

### 🐛 修复

- **[应用模板]** 模板应用从详情页返回列表时保留搜索、筛选条件和页码。 ([#11177](https://github.com/nocobase/nocobase/pull/11177)) by @katherinehhh
