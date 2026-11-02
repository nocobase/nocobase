# 更新日志

本文件记录 NocoBase 3 的所有重要变更，每次发布一节：`nocobase-v3-beta/<日期>.<序号>` 是预览版，`release/<日期>.<序号>` 是正式版。每次发布的包版本见对应的 GitHub Release，各个包自己的变更见包内的 CHANGELOG.md。

## [nocobase-v3-beta/2026-10-31.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-31.1)

### 🎉 新特性

- **[实时更新]** Redis 实时广播改为显式注册商业 Broker 插件后使用，单实例应用仍可使用内置 Memory Broker。 ([#11258](https://github.com/nocobase/nocobase/pull/11258)) by @cgyrock
- **[应用模板]** 新增员工入职四步表单示例，支持私有草稿恢复、条件校验和防重复创建员工。 ([#11259](https://github.com/nocobase/nocobase/pull/11259)) by @katherinehhh

### 🚀 优化

- **[项目]** 减少任务详情读取和进度刷新的数据库查询。 ([#11264](https://github.com/nocobase/nocobase/pull/11264)) by @2013xile
- **[并发控制]** 本地锁会持续持有到显式释放、任务完成或应用关闭，不再将租约时长作为任务超时。 ([#11269](https://github.com/nocobase/nocobase/pull/11269)) by @cgyrock
- **[Agent]** 减少执行机会话的重复读取，并批量加载会话列表的关联工作。 ([#11272](https://github.com/nocobase/nocobase/pull/11272)) by @2013xile

### 🐛 修复

- **[实时更新]** 减少打开任务、收件箱和会话时的重复请求，并保留实时更新。 ([#11257](https://github.com/nocobase/nocobase/pull/11257)) by @2013xile
- **[Agent]**
  - 保存 Agent 描述后立即重新打开编辑器时显示最新内容。 ([#11268](https://github.com/nocobase/nocobase/pull/11268)) by @2013xile
  - 区分工作区准备与 Agent 启动，并将已收到的回复保存在排队追问之前。 ([#11271](https://github.com/nocobase/nocobase/pull/11271)) by @2013xile
- **[Agent 会话]** 页面较窄时优先显示会话列表而不是详情，并记住 My Agent 详情的开关状态。 ([#11275](https://github.com/nocobase/nocobase/pull/11275)) by @gchust

## [nocobase-v3-beta/2026-10-30.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-10-30.1)

### 🎉 新特性

- **[并发控制]**
  - 应用开发者可以通过可复用的并发 API 和进程内后端协调固定租期的临界区，支持取消等待、受控的定时器故障处理、准确的关闭超时和自动后端清理。 ([#11209](https://github.com/nocobase/nocobase/pull/11209)) by @cgyrock
  - 应用可以配置具名的单进程并发服务，让多个插件共享同一个锁管理器。 ([#11256](https://github.com/nocobase/nocobase/pull/11256)) by @cgyrock
- **[后台任务]** Redis 后台任务和定时任务现需安装商业 Jobs Redis Server 插件，Memory 任务仍可独立使用。 ([#11229](https://github.com/nocobase/nocobase/pull/11229)) by @cgyrock
- **[认证]** 找回密码支持独立配置 SMTP 或 Resend 发件服务，同时兼容已有自定义函数与旧邮件渠道。 ([#11233](https://github.com/nocobase/nocobase/pull/11233)) by @cgyrock
- **[数据库]** 数据库查询支持用 LOWER 表达式进行可移植的不区分大小写文本搜索。 ([#11236](https://github.com/nocobase/nocobase/pull/11236)) by @2013xile
- **[Agent]**
  - 为每个执行机 Agent 对话选择并保存模型支持的推理强度。 ([#11239](https://github.com/nocobase/nocobase/pull/11239)) by @2013xile
  - 支持执行机对话使用项目仓库，并在更换 Agent 时保留工作目录。 ([#11244](https://github.com/nocobase/nocobase/pull/11244)) by @2013xile

### 🚀 优化

- **[Agent]**
  - Agents 2 移除旧向量集合并提供迁移指引，保留已有数据、模型服务和 Knowledge 独立索引。 ([#11216](https://github.com/nocobase/nocobase/pull/11216)) by @cgyrock
  - 添加或编辑 Agent 时可从小下拉填写「擅长什么」并一步撤销，已知系列的新型号也能自动预填。 ([#11249](https://github.com/nocobase/nocobase/pull/11249)) by @2013xile
- **[项目]**
  - 应用可自定义消息类型来翻译自动评论提示，同时隐藏内部追溯信息。 ([#11220](https://github.com/nocobase/nocobase/pull/11220)) by @2013xile
  - 支持应用在数据库中分页已完成任务，无须加载全部历史任务。 ([#11224](https://github.com/nocobase/nocobase/pull/11224)) by @2013xile
  - 减少任务详情和进度的重复数据库读取与刷新请求。 ([#11225](https://github.com/nocobase/nocobase/pull/11225)) by @2013xile
  - 任务卡片改用轻量批量读取，实时更新时不再重读无关任务详情。 ([#11240](https://github.com/nocobase/nocobase/pull/11240)) by @2013xile
- **[Skills]** 应用开发 Skills 提供可运行并持续测试的列表编辑示例。 ([#11222](https://github.com/nocobase/nocobase/pull/11222)) by @chenos
- **[后台任务]** Redis 队列现在需要显式注册商业服务端插件，进程内 Memory 队列仍可在不依赖 Redis 的情况下使用。 ([#11227](https://github.com/nocobase/nocobase/pull/11227)) by @cgyrock
- **[应用模板]** 精简默认模板和示例模板，移除未使用的客户端扩展入口文件。 ([#11228](https://github.com/nocobase/nocobase/pull/11228)) by @chenos

### 🐛 修复

- **[应用模板]**
  - 模板列表区分暂无数据、筛选无结果、无权限和请求失败，提供明确恢复操作，并支持旧应用通过完整源码升级获得同样能力。 ([#11188](https://github.com/nocobase/nocobase/pull/11188)) by @katherinehhh
  - 修复打开或关闭用户编辑抽屉时加载提示误显、闪烁和表格跳动的问题。 ([#11218](https://github.com/nocobase/nocobase/pull/11218)) by @chenos
- **[Agent]**
  - 返回执行中的 Agent 对话时复用连接，无法恢复时同步已保存回复，并在确认结束后清理仍等待中的浏览器订阅。 ([#11205](https://github.com/nocobase/nocobase/pull/11205)) by @2013xile
  - 当前面的任务不适配时，执行机可在最多 150 个排队候选中继续查找可执行任务。 ([#11210](https://github.com/nocobase/nocobase/pull/11210)) by @2013xile
  - 运行详情首次加载期间状态发生变化时，及时显示最新运行状态。 ([#11226](https://github.com/nocobase/nocobase/pull/11226)) by @2013xile
  - 执行机记录支持每页二十条翻页和准确总数，可按名称进入自己的对话，并统一状态与额度标签。 ([#11238](https://github.com/nocobase/nocobase/pull/11238)) by @2013xile
  - 标记已读时保留会话收尾历史读取。 ([#11251](https://github.com/nocobase/nocobase/pull/11251)) by @2013xile
  - 对话保留受支持的 Agent 默认推理强度，不可用时使用工具默认值，并说明手选强度未能应用的情况。 ([#11255](https://github.com/nocobase/nocobase/pull/11255)) by @2013xile
- **[发布管理]** 生成的初始管理员凭据保留到手动保存或应用删除为止。 ([#11219](https://github.com/nocobase/nocobase/pull/11219)) by @2013xile
- **[Agent 会话]**
  - 统一会话页侧栏工具区的布局，并支持收起和展开侧栏。 ([#11223](https://github.com/nocobase/nocobase/pull/11223)) by @Molunerfinn
  - 发给 Agent 的消息中含长哈希、URL 或无空格英文时，现在会在气泡内换行，不再裁掉每行开头。 ([#11241](https://github.com/nocobase/nocobase/pull/11241)) by @app/nocobase-studio
- **[项目]** 限制长附件历史任务的证据读取量。 ([#11246](https://github.com/nocobase/nocobase/pull/11246)) by @app/nocobase-studio
- **[演示模式]** 安全恢复已结束的每日演示重置失败并推进待处理邮箱清理，避免重复执行已成功的每日重置。 ([#11248](https://github.com/nocobase/nocobase/pull/11248)) by @gchust
- **[应用基础]**
  - 合并重复的设置分组，并将物理外键与逻辑关联字段分开统计。 ([#11253](https://github.com/nocobase/nocobase/pull/11253)) by @katherinehhh
  - 请求日志可识别 API 调用来源，并限制查询参数长度及排除敏感参数。 ([#11254](https://github.com/nocobase/nocobase/pull/11254)) by @2013xile
- **[Skills]** 在开发开始时统一规划前后端，简化常规 CRUD 开发，并在无需常规设计审批停顿的情况下验证完整应用功能。 ([#11260](https://github.com/nocobase/nocobase/pull/11260)) by @chenos
- **[权限]** 统一权限数据范围在操作与分组间的对齐、下拉框宽度及响应式布局。 ([#11262](https://github.com/nocobase/nocobase/pull/11262)) by @katherinehhh

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
