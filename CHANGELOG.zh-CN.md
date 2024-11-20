# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
并且本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

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
