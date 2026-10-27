# 更新日志

本文件记录 NocoBase 3 的所有重要变更，每次发布一节：`release-beta/<日期>.<序号>` 是预览版，`release/<日期>.<序号>` 是正式版。每次发布的包版本见对应的 GitHub Release，各个包自己的变更见包内的 CHANGELOG.md。

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
