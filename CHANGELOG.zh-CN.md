# 更新日志

本文件记录 NocoBase 3 的所有重要变更，每次发布一节：`nocobase-v3-beta/<日期>.<序号>` 是预览版，`release/<日期>.<序号>` 是正式版。每次发布的包版本见对应的 GitHub Release，各个包自己的变更见包内的 CHANGELOG.md。

## [nocobase-v3-beta/2026-11-09.3](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.3)

### 🎉 新特性

- **[Skills]** 新增指导 Agent 配置和验证多实例应用及 Redis 共享后端的 Skills。 ([#11397](https://github.com/nocobase/nocobase/pull/11397)) by @chenos
- **[应用基础]** 新增 `foundation.scanOnStart` 配置，可关闭应用启动时的 App Foundation 扫描；测试应用默认关闭，测试启动和关闭更快。 ([#11403](https://github.com/nocobase/nocobase/pull/11403)) by @Molunerfinn

### 🚀 优化

- **[应用模板]** 改进数据库浏览器布局和移动端页面间距，将功能与扩展移至系统设置路径并支持配置访问权限。 ([#11386](https://github.com/nocobase/nocobase/pull/11386)) by @chenos

## [nocobase-v3-beta/2026-11-09.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.2)

### 🚀 优化

- **[应用基础]** 桌面端进入功能与扩展时默认打开第一个匹配功能，并保留筛选条件。 ([#11396](https://github.com/nocobase/nocobase/pull/11396)) by @chenos

### 🐛 修复

- **[应用模板]** 修复生成应用安装扩展插件后，功能目录测试因使用通用介绍而误报失败的问题。 ([#11399](https://github.com/nocobase/nocobase/pull/11399)) by @chenos

## [nocobase-v3-beta/2026-11-09.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-09.1)

### 🎉 新特性

- **[Agent]** Agent 额度用完后保留原 Runner 上的工作，并在额度恢复后继续原会话。 ([#11372](https://github.com/nocobase/nocobase/pull/11372)) by @2013xile
- **[多语言]** Agent、项目、发布、知识库等核心插件新增俄语和韩语，并修正其他语言中“任务”“执行者”等术语的错译。 ([#11379](https://github.com/nocobase/nocobase/pull/11379)) by @2013xile
- **[应用基础]** 在系统设置中查看功能与扩展及其配置情况，通过 Agent 指引添加或完善功能，并浏览数据库连接、数据表和字段。 ([#11383](https://github.com/nocobase/nocobase/pull/11383)) by @chenos

### 🚀 优化

- **[认证]** 找回密码改用 auth.passwordReset.mailer 配置发件服务，原 auth.email.mailer 引用需直接改到新字段。 ([#11346](https://github.com/nocobase/nocobase/pull/11346)) by @cgyrock
- **[权限]** 减少权限检查和工单自动关闭过程中的重复数据库读取。 ([#11357](https://github.com/nocobase/nocobase/pull/11357)) by @chenos
- **[Agent]**
  - 运行记录的 Agent 筛选可以只列出在该对象上运行过的 Agent，包括已删除的 Agent。 ([#11367](https://github.com/nocobase/nocobase/pull/11367)) by @app/nocobase-studio
  - 执行机所有者和管理员可以在已知重置时间之前清除额度标记；同一额度窗口再次上报未用完时，标记会自动解除。 ([#11369](https://github.com/nocobase/nocobase/pull/11369)) by @2013xile
  - 支持应用将独立 Agent 会话的固定指令前置，提高提示缓存复用机会。 ([#11371](https://github.com/nocobase/nocobase/pull/11371)) by @2013xile
  - 执行机按各自对该编码工具的并发上限等比例领取排队的 Agent 任务，越空闲的执行机越先领到。 ([#11388](https://github.com/nocobase/nocobase/pull/11388)) by @2013xile
- **[发布管理]**
  - 托管环境列表页为每个共享宿主显示一张容量卡片，并可跳到其运行中的应用；应用列表显示运行状态和原因并可按状态筛选；应用页只在受宿主影响时提示。 ([#11380](https://github.com/nocobase/nocobase/pull/11380)) by @2013xile
  - 应用改在环境详情页查看和创建，显示每个应用的运行状态并可按状态筛选；共享宿主卡片按环境链到运行中的应用。 ([#11385](https://github.com/nocobase/nocobase/pull/11385)) by @2013xile
- **[项目]** 任务动态中添加或移除关联时，双方任务都显示「添加了关联」「移除了关联」，不再显示为依赖。 ([#11389](https://github.com/nocobase/nocobase/pull/11389)) by @2013xile
- **[实时更新]** 将应用实时消息的 Broker 配置统一放在 `realtime.broker` 下，保留默认内存模式，并在使用旧配置路径时提供迁移提示。 ([#11392](https://github.com/nocobase/nocobase/pull/11392)) by @cgyrock
- **[服务端]** 统一将 Concurrency、Jobs 和 Queue 的后端配置放在 `backends` 下，旧配置或混合配置会明确提示迁移，不再静默回退到本地执行。 ([#11393](https://github.com/nocobase/nocobase/pull/11393)) by @cgyrock

### 🐛 修复

- **[数据库]** 优化非空字段的索引排序，同时保持空值排序和分页语义。 ([#11356](https://github.com/nocobase/nocobase/pull/11356)) by @chenos
- **[应用托管]**
  - 堆用量短暂升高时保持预览名额准入稳定，并保留宿主轮换的最长等待期限。 ([#11359](https://github.com/nocobase/nocobase/pull/11359)) by @2013xile
  - 通过有界归档处理、实时内存准入及保护在途请求和部署的回收机制，保持共享应用托管服务可用。 ([#11373](https://github.com/nocobase/nocobase/pull/11373)) by @2013xile
- **[Agent]**
  - 保留被拒的对话消息以便恢复，并为对话问题显示统一的下一步。 ([#11361](https://github.com/nocobase/nocobase/pull/11361)) by @2013xile
  - Agent 启动前遇到仓库临时故障时自动退避重试，无法恢复时保留准确的失败原因。 ([#11374](https://github.com/nocobase/nocobase/pull/11374)) by @2013xile
  - Agent 在只读与可写工作之间切换时开启新会话，同时保留已有可写会话的复用。 ([#11377](https://github.com/nocobase/nocobase/pull/11377)) by @2013xile
  - 连接中断过的对话在空闲并刷新后恢复正常。 ([#11381](https://github.com/nocobase/nocobase/pull/11381)) by @2013xile
- **[应用模板]**
  - 移除新建 Examples 应用默认加载的底部悬浮标注工具栏。 ([#11366](https://github.com/nocobase/nocobase/pull/11366)) by @gchust
  - 非英文界面的应用启动时不再先显示英文的 “Loading application…”。 ([#11376](https://github.com/nocobase/nocobase/pull/11376)) by @chenos
- **[发布管理]** 发布页面说明充分利用可用宽度，同时保持页面操作按钮可见。 ([#11368](https://github.com/nocobase/nocobase/pull/11368)) by @gchust
- **[Skills]** UI 组件检查现在会报告原生和 shadcn Input 日期字段；Examples 工作日历的节假日日期改为从日历中选择，不再弹出浏览器原生日期选择器。 ([#11378](https://github.com/nocobase/nocobase/pull/11378)) by @chenos
- **[Agent 运行器]** Runner 服务意外终止后自动恢复，主动停止后保持停止，并报告更新重启失败。 ([#11384](https://github.com/nocobase/nocobase/pull/11384)) by @2013xile

## [nocobase-v3-beta/2026-11-06.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-06.1)

### 🎉 新特性

- **[Agent]** 向指定用户分享已结束的对话快照，并可撤销其只读访问权限。 ([#11326](https://github.com/nocobase/nocobase/pull/11326)) by @2013xile

### 🚀 优化

- **[发布管理]**
  - 支持在切换前取消部署、替换旧排队部署并显示排队位置，归档处理移到应用 Host 进程之外。 ([#11337](https://github.com/nocobase/nocobase/pull/11337)) by @2013xile
  - 允许应用在制品操作日志中记录已认证的运行身份，便于排查问题。 ([#11360](https://github.com/nocobase/nocobase/pull/11360)) by @2013xile
- **[客户端]** 统一页面、表格、列表、选择器、上传和后台任务的加载反馈，保持提交按钮尺寸稳定，同时保留表单提交保护。 ([#11349](https://github.com/nocobase/nocobase/pull/11349)) by @katherinehhh
- **[应用模板]** 取消普通应用页面及公共生成规范中的默认刷新按钮，保留自动更新和错误场景的重试入口。 ([#11353](https://github.com/nocobase/nocobase/pull/11353)) by @chenos
- **[应用基础]** 应用底座页面的能力改为自动换行的网格，状态以醒目的标签显示，选中状态单独标识，扩展名称更易读，关键数字按能力分组。 ([#11362](https://github.com/nocobase/nocobase/pull/11362)) by @katherinehhh

### 🐛 修复

- **[Agent 会话]** 智能体选项说明超长时仍可加载设置，并显示设置发现失败的具体原因。 ([#11344](https://github.com/nocobase/nocobase/pull/11344)) by @zhouyanliang
- **[发布管理]** 保持使用中的预览连接，让后台标签页释放容量，并限制宿主内存占用与轮换等待时间。 ([#11345](https://github.com/nocobase/nocobase/pull/11345)) by @2013xile
- **[通用]** 统一弹窗底部链接与原生按钮的尺寸和对齐，并支持窄屏长文案换行。 ([#11351](https://github.com/nocobase/nocobase/pull/11351)) by @chenos
- **[应用模板]** 详情页在桌面和手机端保留安全的上级导航入口，并统一新建页面的导航规范。 ([#11352](https://github.com/nocobase/nocobase/pull/11352)) by @chenos
- **[Agent]** 手机 Agent 面板分享弹窗显示遮罩，快照截止时间跟随应用语言，共享回复显示会话的实际 Agent 名称。 ([#11358](https://github.com/nocobase/nocobase/pull/11358)) by @2013xile

## [nocobase-v3-beta/2026-11-05.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-05.2)

### 🚀 优化

- **[Agent]** 支持应用为 Agent 开启独立会话并提供有界交接摘要。 ([#11341](https://github.com/nocobase/nocobase/pull/11341)) by @2013xile
- **[应用基础]** 应用底座统计改为“指标名称 + 数值”，去掉数量单位，顶部卡片与能力详情使用一致的名称。 ([#11342](https://github.com/nocobase/nocobase/pull/11342)) by @katherinehhh

### 🐛 修复

- **[发布管理]** 修复环境表单中标签换行导致应用输入框不对齐的问题。 ([#11338](https://github.com/nocobase/nocobase/pull/11338)) by @gchust

## [nocobase-v3-beta/2026-11-05.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-05.1)

### 🎉 新特性

- **[Agent 运行器]**
  - 支持运行使用所提供凭据调用官方 Gitea CLI。 ([#11313](https://github.com/nocobase/nocobase/pull/11313)) by @2013xile
  - 执行机现在可以通过 ACP 使用 DeepSeek Harness 作为编码工具。 ([#11314](https://github.com/nocobase/nocobase/pull/11314)) by @2013xile
- **[通知]** 在统一的只读通知模板目录中展示已登记通知场景并提供安全的合成内容预览。 ([#11331](https://github.com/nocobase/nocobase/pull/11331)) by @katherinehhh
- **[用户]** 跨浏览器和设备保留用户选择的语言，并支持后台任务按用户 ID 解析其偏好语言。 ([#11332](https://github.com/nocobase/nocobase/pull/11332)) by @mytharcher
- **[应用模板]** 基于模板搭建的应用将管理功能统一为一个“系统设置”入口，打开后按分类展示功能卡片，模块内用标签页切换。 ([#11333](https://github.com/nocobase/nocobase/pull/11333)) by @katherinehhh

### 🚀 优化

- **[应用模板]** 将 Default 与 Examples 侧栏和登录页标语统一为“AI + NocoBase”和“Build reliable business systems”，并去掉 Default 页脚模板名称、保留版本号。 ([#11321](https://github.com/nocobase/nocobase/pull/11321)) by @katherinehhh
- **[Agent 会话]**
  - My Agent 会话详情中的用量改为逐行显示，与 Runner 对话一致。 ([#11329](https://github.com/nocobase/nocobase/pull/11329)) by @zhouyanliang
  - 精简 Runner Agent 与 My Agent 会话行，移除多余的 Agent、运行环境和项目名称。 ([#11330](https://github.com/nocobase/nocobase/pull/11330)) by @zhouyanliang
  - 会话详情中关联任务的标题独占首行，编号和状态放在第二行。 ([#11335](https://github.com/nocobase/nocobase/pull/11335)) by @zhouyanliang
- **[Agent]** 运行环境抽屉中概览、工作目录和运行记录表格的宽度优先留给额度、目录和任务，大小、类型和 Agent 名称不再被截断。 ([#11336](https://github.com/nocobase/nocobase/pull/11336)) by @zhouyanliang

### 🐛 修复

- **[演示模式]** 直接打开演示模式业务链接时自动登录，并保留已有账号和目标地址。 ([#11319](https://github.com/nocobase/nocobase/pull/11319)) by @gchust
- **[Agent]** 恢复会话后自动从已归档列表移除。 ([#11320](https://github.com/nocobase/nocobase/pull/11320)) by @gchust
- **[认证]** 准确反馈注册请求结果，默认让新账号自动登录，并对无法提供后续指引的配置发出警告。 ([#11322](https://github.com/nocobase/nocobase/pull/11322)) by @katherinehhh
- **[服务端]** 请求的接收时限由 5 分钟延长到 10 分钟，慢速网络下上传大文件不再因 HTTP 408 中断。 ([#11323](https://github.com/nocobase/nocobase/pull/11323)) by @gchust
- **[命令行]** 命令行升级后重启运行中的后台智能体连接，并在智能体设置无法加载时提供恢复操作提示。 ([#11334](https://github.com/nocobase/nocobase/pull/11334)) by @zhouyanliang

## [nocobase-v3-beta/2026-11-04.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-04.1)

### 🎉 新特性

- **[服务端]** 找回密码、用户邀请和邮件通知统一使用具名应用发件配置，并保留现有发件配置兼容。 ([#11284](https://github.com/nocobase/nocobase/pull/11284)) by @cgyrock
- **[缓存]** 自定义缓存驱动按应用隔离，并可在首次使用前完成注册。 ([#11302](https://github.com/nocobase/nocobase/pull/11302)) by @cgyrock

### 🚀 优化

- **[界面]**
  - 页面和面板共用对话头部，支持可选关联工作详情和优先打开列表。 ([#11285](https://github.com/nocobase/nocobase/pull/11285)) by @2013xile
  - 会话页面和侧边面板使用同一个工作区，根据可用宽度自动调整布局，两处的样子和交互保持一致。 ([#11312](https://github.com/nocobase/nocobase/pull/11312)) by @2013xile
- **[数据库]** 应用和插件可统一识别受支持数据库的重复键错误，避免将其他 SQLite 约束错误误判为重复键。 ([#11298](https://github.com/nocobase/nocobase/pull/11298)) by @mytharcher
- **[应用基础]** 持久保存应用底座结果，在刷新或内核版本变化时后台更新，并提供紧凑统计和明确的历史状态。 ([#11300](https://github.com/nocobase/nocobase/pull/11300)) by @katherinehhh
- **[Agent]** 说明执行机对话的等待原因，并允许撤回尚未领取的一轮后选择其他 Agent。 ([#11303](https://github.com/nocobase/nocobase/pull/11303)) by @2013xile
- **[应用模板]** 将两套应用模板的主题设置收进用户菜单，并保留已保存的偏好。 ([#11309](https://github.com/nocobase/nocobase/pull/11309)) by @katherinehhh

### 🐛 修复

- **[邮件]** IMAP/SMTP 邮箱可安全移动、归档和删除当前文件夹中的邮件副本，并在操作不可用时显示原因。 ([#10895](https://github.com/nocobase/nocobase/pull/10895)) by @cgyrock
- **[文件]** 在文件预览弹窗中居中显示图片。 ([#11292](https://github.com/nocobase/nocobase/pull/11292)) by @katherinehhh
- **[应用基础]** 保留经已证明的本地回调和查询访问器建立的数据库模型关联，并拒绝格式错误的请求头名称。 ([#11293](https://github.com/nocobase/nocobase/pull/11293)) by @katherinehhh
- **[界面]**
  - 默认文字头像对中日韩姓名忽略空格并显示最后两个字。 ([#11294](https://github.com/nocobase/nocobase/pull/11294)) by @katherinehhh
  - 会话详情在对话区域内打开，点击详情外的区域即可关闭，桌面和手机一致。 ([#11304](https://github.com/nocobase/nocobase/pull/11304)) by @2013xile
- **[Agent]** 允许应用按执行人权限接纳 Agent 运行，并将运行修改评论的范围限定为当前运行自己发布的评论。 ([#11307](https://github.com/nocobase/nocobase/pull/11307)) by @2013xile

## [nocobase-v3-beta/2026-11-02.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-02.1)

### 🚀 优化

- **[Agent]** 应用可按最近更新时间排列对话关联工作，无需额外请求。 ([#11283](https://github.com/nocobase/nocobase/pull/11283)) by @2013xile
- **[用户]** 受邀用户可选填用户名，遇到冲突时可修改重试而不丢失表单内容。 ([#11289](https://github.com/nocobase/nocobase/pull/11289)) by @2013xile

### 🐛 修复

- **[Agent]**
  - 排队任务额度用完时显示额度原因和已知恢复时间，避免误报为工具不可用。 ([#11279](https://github.com/nocobase/nocobase/pull/11279)) by @zhouyanliang
  - 停止 Runner 当前轮后，未被接收的排队消息沿用原消息继续执行，不再新增副本。 ([#11282](https://github.com/nocobase/nocobase/pull/11282)) by @zhouyanliang
- **[项目]** 返回已保存评论未启动工作的原因，包括达到评论运行次数上限的情况。 ([#11280](https://github.com/nocobase/nocobase/pull/11280)) by @2013xile
- **[Agent 会话]** 手机端我的 Agent 会话中按回车换行，点击发送按钮发送消息。 ([#11281](https://github.com/nocobase/nocobase/pull/11281)) by @app/nocobase-studio
- **[应用基础]** 恢复应用底座通过受保护服务工厂识别有证据的数据模型关联。 ([#11287](https://github.com/nocobase/nocobase/pull/11287)) by @katherinehhh

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
