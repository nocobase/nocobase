# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
并且本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

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
