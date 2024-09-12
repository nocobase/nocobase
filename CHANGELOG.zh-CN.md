# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
并且本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

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

