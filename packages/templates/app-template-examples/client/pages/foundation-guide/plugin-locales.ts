export const enUS = {
  'app-plugin-authz-default-access': {
    title: 'Default record access',
    summary:
      'Adds baseline record visibility for actions a user already holds; it does not grant actions.',
    scenario:
      'Share a common set of records with users who already have the relevant permission.',
    step1: 'Register the Client and Server plugins with Authorization.',
    step2:
      'Add the defaultAccess() factory to the authorization configuration.',
    step3:
      'Configure resource actions and their record selections in the authorization settings.',
  },
  'app-plugin-authz-sharing-rules': {
    title: 'Sharing rules',
    summary:
      'Shares selected records with specified subjects while retaining their existing action permissions.',
    scenario:
      'Share selected customers, projects or orders with collaborators.',
    step1: 'Register the Client and Server plugins with Authorization.',
    step2: 'Add the sharingRules() factory to the authorization configuration.',
    step3:
      'Select recipients, resource actions and records; test with a recipient account.',
  },
  'app-plugin-authz-restriction-rules': {
    title: 'Restriction rules',
    summary:
      'Narrows matching subjects to the allowed record selection after grants and sharing are combined.',
    scenario: 'Further restrict sensitive records for selected users or teams.',
    step1: 'Register the Client and Server plugins with Authorization.',
    step2:
      'Add the restrictionRules() factory to the authorization configuration.',
    step3:
      'Define the records that remain allowed and verify the combined permission result.',
  },
  'app-plugin-concurrency': {
    title: 'Concurrency service',
    summary:
      'Integrates application concurrency configuration, service tokens and process-local mutexes.',
    scenario:
      'Coordinate competing operations within the configured concurrency backend.',
    step1:
      'Register the Server plugin before the business plugins that consume it.',
    step2:
      'Compose defineConcurrencyConfig() under the concurrency configuration key.',
    step3:
      'Resolve the concurrency service; the built-in mutex coordinates only one process.',
  },
  'app-plugin-database-explorer': {
    title: 'Database explorer',
    summary:
      'Provides read-only connection, collection and field APIs and a typed client; the application owns its page.',
    scenario: 'Inspect application database structure without modifying data.',
    step1:
      'Register Authentication, Authorization and this plugin on Client and Server.',
    step2:
      'Grant page:database-explorer/access to the intended administrators.',
    step3:
      'Build the application view with DatabaseExplorerClient; this package supplies no standalone page.',
  },
  'app-plugin-foundation': {
    title: 'Foundation usage',
    summary:
      'Collects runtime evidence showing how the application uses foundation capabilities.',
    scenario:
      'Inspect installed capabilities and their actual application usage.',
    step1:
      'Register the Client and Server plugins with Authentication and Authorization.',
    step2:
      'Open the Foundation page with an unrestricted administrator account.',
    step3:
      'Inspect capability details and runtime evidence; dependency presence alone is not usage.',
  },
  'app-plugin-i18n': {
    title: 'Language switching',
    summary:
      'Adds language selection and persistence on top of the internationalization runtime.',
    scenario:
      'Let users switch between the languages offered by the application.',
    step1: 'Register the Client and Server plugins.',
    step2:
      'Declare locale loaders in the application and configure its default locale.',
    step3:
      'Connect the language picker to the plugin hooks and verify translated resources.',
  },
  'app-plugin-notification-in-app': {
    title: 'In-app inbox',
    summary:
      'Stores user-isolated inbox messages and adds the in-app notification channel.',
    scenario: 'Deliver task updates and reminders inside the application.',
    step1:
      'Register the Server plugin after the notification runtime for message delivery.',
    step2: 'Configure a named channel with type: in-app.',
    step3:
      'Integrate the authenticated inbox APIs or UI; its Client page is for development.',
  },
  'app-plugin-notification-providers': {
    title: 'Notification providers',
    summary:
      'Provides email, SMTP, Resend, Feishu and DingTalk delivery channels.',
    scenario:
      'Send business notifications through external mail and IM services.',
    step1: 'Register this Server plugin after the notification runtime.',
    step2:
      'Configure named channels and their required mailers or provider credentials.',
    step3:
      'Send through the notification service and inspect delivery results.',
  },
  'app-plugin-template-print': {
    title: 'Template printing Skill',
    summary:
      'Provides implementation guidance for document printing; it contains no runtime renderer or printing API.',
    scenario:
      'Implement DOCX or other template-based output with authorized business data.',
    step1: 'Keep this package as a direct development dependency.',
    step2: 'Run pnpm nocobase skills sync from the application.',
    step3:
      'Follow the Skill to implement printing; use the separate example to try DOCX and PDF output.',
  },
  'app-plugin-authorization-example': {
    title: 'Sales permissions example',
    summary:
      'Demonstrates independent project, quote and order permissions, record sharing and restrictions.',
    scenario:
      'Learn how application pages, operations and record scopes work together.',
    step1:
      'Use the Examples registration of Authorization and the optional rule plugins.',
    step2: 'Apply the example migrations and seeds in an example database.',
    step3:
      'Open the guide and compare access with the documented example identities.',
  },
  'app-plugin-cli-example': {
    title: 'Maintenance tool example',
    summary:
      'Contributes greeting and artifact commands to the application CLI.',
    scenario:
      'Learn how a plugin declares commands, flags, arguments and JSON output.',
    step1: 'Register the CLI entry in cli/plugins.ts.',
    step2: 'Run pnpm nocobase cli-example --help from the application.',
    step3:
      'Try greet world --json and inspect the command implementation and tests.',
  },
  'app-plugin-database-example': {
    title: 'Data setup example',
    summary:
      'Demonstrates a plugin-owned migration and seed contributed through its Server declaration.',
    scenario:
      'Learn how plugins add their own schema and initial data to an application.',
    step1: 'Inspect the plugin migration, seed and Server declaration.',
    step2: 'Register its Server entry in an example application.',
    step3:
      'Run the normal database apply workflow and inspect the contributed schema and data.',
  },
  'app-plugin-file-example': {
    title: 'File attachments example',
    summary:
      'Demonstrates uploads, previews, employee avatars and order attachments through File Repository.',
    scenario: 'Learn one-to-one and one-to-many attachment relationships.',
    step1:
      'Register File and the example on Client and Server, then apply their migrations.',
    step2:
      'Open the attachment repository, employee avatar or order attachment page.',
    step3:
      'Upload a sample file and inspect how the business record links to its file record.',
  },
  'app-plugin-jobs-example': {
    title: 'Jobs and schedules example',
    summary:
      'Demonstrates one-off background jobs and recurring schedules with application-owned executors.',
    scenario: 'Learn submission, progress, retry and recurring execution.',
    step1:
      'Use the registered example with the application Jobs service configured.',
    step2: 'Open One-off jobs to submit sample work and inspect its progress.',
    step3: 'Open Schedules to start or stop the predefined recurring rules.',
  },
  'app-plugin-lifecycle-example': {
    title: 'Business process examples',
    summary:
      'Demonstrates support tickets, expenses, orders and other record-based processes.',
    scenario:
      'Learn state transitions, delayed triggers and effects after a transaction commits.',
    step1: 'Use the registered example with its migrations and seeds.',
    step2:
      'Open a workflow example and perform its documented business actions.',
    step3:
      'Inspect state changes, history and effects alongside the lifecycle source.',
  },
  'app-plugin-mail-example': {
    title: 'Offline mail example',
    summary:
      'Runs account management, mailbox synchronization and sending with offline mock providers.',
    scenario:
      'Explore Mail integrations without connecting a real external mailbox.',
    step1: 'Use the three mock provider configurations included in Examples.',
    step2:
      'Open Mail example to initialize and synchronize its sample mailboxes.',
    step3:
      'Try composing, templates, signatures and sync logs; delivery stays simulated.',
  },
  'app-plugin-notification-example': {
    title: 'Task notification example',
    summary: 'Sends in-app notifications when tasks are assigned or updated.',
    scenario:
      'Learn how a business operation triggers a notification and links back to a record.',
    step1: 'Use the registered notification runtime and in-app channel.',
    step2: 'Create a sample task and assign it to an application user.',
    step3: 'Open its notification as the recipient and inspect task updates.',
  },
  'app-plugin-office-flows-example': {
    title: 'Office process examples',
    summary:
      'Demonstrates data-use requests, incoming documents and multi-level office tasks.',
    scenario:
      'Learn parent-child processes, approval stages and scheduled task creation.',
    step1: 'Use the example migrations, seeds and office configuration.',
    step2:
      'Open Data requests or Incoming documents to start a sample process.',
    step3: 'Follow related work in My tasks and inspect the record lifecycles.',
  },
  'app-plugin-queue-example': {
    title: 'Queued work example',
    summary:
      'Publishes greetings and digests and consumes them through application queue services.',
    scenario:
      'Learn channel-based handlers, retry configuration and batch publication.',
    step1:
      'Register the Server plugin and configure an application queue backend.',
    step2:
      'Inspect its queue handlers and the authenticated API in the API document.',
    step3:
      'Publish sample work through the documented API and inspect processing results.',
  },
  'app-plugin-realtime-example': {
    title: 'Realtime business examples',
    summary:
      'Demonstrates collaborative tasks, personal notifications, CSV exports and a subscription lab.',
    scenario:
      'Learn subscriptions, authorization and recovery from missed updates.',
    step1:
      'Use the registered Client and Server example with Realtime enabled.',
    step2: 'Open Tasks, Inbox or Exports and compare updates in two sessions.',
    step3:
      'Use the capability lab to inspect subscriptions, snapshots and recovery.',
  },
  'app-plugin-repository-example': {
    title: 'Business data examples',
    summary:
      'Demonstrates CRM, orders, relation writes, streaming queries, aggregation and atomic updates.',
    scenario:
      'Learn Repository APIs using connected business data and focused query examples.',
    step1:
      'Use the example registration and apply its migrations and sample seeds.',
    step2: 'Open CRM, Orders or a focused Repository example.',
    step3:
      'Compare page operations with the declared resources and API implementations.',
  },
  'app-plugin-routes-example': {
    title: 'Page integration example',
    summary:
      'Demonstrates authenticated server routes, a lazy client page and a React provider.',
    scenario: 'Learn plugin route contributions and application API access.',
    step1: 'Register the Server and Client entries with Authentication.',
    step2: 'Open the example page and inspect its API result.',
    step3:
      'Compare the route declarations, React provider and lazy page implementation.',
  },
  'app-plugin-service-provider-example': {
    title: 'Background service example',
    summary:
      'Registers a Heartbeat service and demonstrates its startup, status and shutdown.',
    scenario:
      'Learn service tokens, dependency injection and provider lifecycle hooks.',
    step1: 'Register the Server plugin in an example application.',
    step2: 'Inspect its token, service and provider implementations.',
    step3:
      'Read the documented status API after startup; add authentication to sensitive business APIs.',
  },
  'app-plugin-skills-example': {
    title: 'Agent guidance example',
    summary:
      'Publishes an AppNotice component, a notice service and an authenticated API described by a Plugin Skill.',
    scenario:
      'Learn how package-owned Skills explain reusable integration contracts.',
    step1: 'Register the Server entry and synchronize the application Skills.',
    step2: 'Read the package Skill and import the public AppNotice component.',
    step3:
      'Compose the component in an application page using the authenticated notice API.',
  },
  'app-plugin-template-print-example': {
    title: 'Template printing example',
    summary:
      'Renders invoices from a fixed DOCX template and authorized sales data, with optional PDF conversion.',
    scenario:
      'Try an end-to-end printing workflow with enforced business permissions.',
    step1:
      'Use the registered example with its migrations, seeds and Sales Quotes permissions.',
    step2: 'Open Template printing and download a sample invoice as DOCX.',
    step3: 'Install LibreOffice on the server to try PDF conversion.',
  },
};

export const zhCN: typeof enUS = {
  'app-plugin-authz-default-access': {
    title: '默认数据访问',
    summary: '为已有操作权限补充默认可见记录，不授予新的操作权限。',
    scenario: '让已有业务权限的用户共同访问一组基础记录。',
    step1: '在授权插件之后注册 Client 和 Server 插件。',
    step2: '在授权配置中加入 defaultAccess() 工厂。',
    step3: '在权限设置中配置资源、操作与默认记录范围。',
  },
  'app-plugin-authz-sharing-rules': {
    title: '数据共享规则',
    summary: '向指定主体共享选中的记录，操作权限仍由原有授权决定。',
    scenario: '将特定客户、项目或订单共享给协作人员。',
    step1: '在授权插件之后注册 Client 和 Server 插件。',
    step2: '在授权配置中加入 sharingRules() 工厂。',
    step3: '选择接收主体、资源操作和记录，并用接收人的账号验证。',
  },
  'app-plugin-authz-restriction-rules': {
    title: '数据限制规则',
    summary: '在授权与共享结果上收窄指定主体可访问的记录范围。',
    scenario: '为指定用户或团队进一步限制敏感业务数据。',
    step1: '在授权插件之后注册 Client 和 Server 插件。',
    step2: '在授权配置中加入 restrictionRules() 工厂。',
    step3: '设置仍然允许访问的记录范围，并验证最终权限结果。',
  },
  'app-plugin-concurrency': {
    title: '并发协调服务',
    summary: '接入应用并发配置、服务 Token 与进程内互斥实现。',
    scenario: '在选定的并发后端范围内协调相互竞争的业务操作。',
    step1: '在消费并发服务的业务插件之前注册 Server 插件。',
    step2: '在 concurrency 配置项下组合 defineConcurrencyConfig()。',
    step3: '通过服务 Token 使用并发能力；内置 Mutex 只协调单个进程。',
  },
  'app-plugin-database-explorer': {
    title: '数据库结构浏览',
    summary:
      '提供只读的连接、集合与字段 API 以及类型化客户端，页面由应用提供。',
    scenario: '查看应用数据库结构，不修改业务数据。',
    step1: '先注册认证与授权，再注册本插件的 Client 和 Server 入口。',
    step2: '向需要使用的管理员授予 page:database-explorer/access。',
    step3: '使用 DatabaseExplorerClient 接入应用页面；本插件不自带独立页面。',
  },
  'app-plugin-foundation': {
    title: '底座使用情况',
    summary: '收集运行证据，展示应用实际使用了哪些底座能力。',
    scenario: '查看已接入的能力及其在当前应用中的实际使用情况。',
    step1: '与认证、授权一起注册本插件的 Client 和 Server 入口。',
    step2: '使用具有不受限权限的管理员账号打开应用底座页面。',
    step3: '查看能力详情和运行证据；声明依赖不等于已经使用。',
  },
  'app-plugin-i18n': {
    title: '语言切换',
    summary: '在多语言运行时之上提供语言选择与偏好保存能力。',
    scenario: '让用户在应用提供的语言之间切换。',
    step1: '注册插件的 Client 和 Server 入口。',
    step2: '在应用中声明语言资源加载器，并配置默认语言。',
    step3: '用插件提供的 Hook 接入语言选择器，检查各语言资源。',
  },
  'app-plugin-notification-in-app': {
    title: '站内通知',
    summary: '保存用户隔离的收件箱消息，并提供站内通知渠道。',
    scenario: '在应用内接收任务更新和业务提醒。',
    step1: '需要消息投递时，在通知运行时之后注册 Server 插件。',
    step2: '配置 type: in-app 的命名通知渠道。',
    step3: '接入经过认证的收件箱 API 或 UI；插件 Client 页面用于开发调试。',
  },
  'app-plugin-notification-providers': {
    title: '通知投递渠道',
    summary: '提供 Email、SMTP、Resend、飞书和钉钉等通知投递渠道。',
    scenario: '通过外部邮件或即时通信服务发送业务通知。',
    step1: '在通知运行时之后注册本 Server 插件。',
    step2: '配置命名渠道，以及对应的邮件发送器或服务凭据。',
    step3: '通过通知服务发送消息，并检查投递结果。',
  },
  'app-plugin-template-print': {
    title: '模板打印 Skill',
    summary: '提供模板打印的开发指南，此 Skill 不包含运行时渲染器或打印 API。',
    scenario: '基于有权限访问的业务数据，实现 DOCX 等模板输出。',
    step1: '将此 Skill 保留为应用的直接开发依赖。',
    step2: '在应用中运行 pnpm nocobase skills sync。',
    step3: '按 Skill 实现打印功能；可通过独立示例体验 DOCX 与 PDF 输出。',
  },
  'app-plugin-authorization-example': {
    title: '销售权限示例',
    summary: '演示项目、报价和订单的独立权限，以及记录共享与限制。',
    scenario: '理解页面权限、操作权限和数据范围如何一起生效。',
    step1: '沿用 Examples 中的授权插件与可选规则插件注册。',
    step2: '在示例数据库中执行对应迁移和种子。',
    step3: '打开使用说明，按文档中的示例身份比较访问结果。',
  },
  'app-plugin-cli-example': {
    title: '维护工具示例',
    summary: '向应用 CLI 注入问候与构建产物命令。',
    scenario: '学习插件如何声明命令、参数、选项和 JSON 输出。',
    step1: '在 cli/plugins.ts 中注册 CLI 入口。',
    step2: '在应用中运行 pnpm nocobase cli-example --help。',
    step3: '尝试 greet world --json，并查看对应命令实现和测试。',
  },
  'app-plugin-database-example': {
    title: '业务数据准备示例',
    summary: '通过 Server 声明贡献插件自己的数据库迁移和种子。',
    scenario: '学习插件如何向应用添加数据结构与初始数据。',
    step1: '查看插件中的迁移、种子与 Server 声明。',
    step2: '在示例应用中注册它的 Server 入口。',
    step3: '执行应用正常的数据库应用流程，并检查新增结构与数据。',
  },
  'app-plugin-file-example': {
    title: '文件附件示例',
    summary: '通过 File Repository 演示上传、预览、员工头像和订单附件。',
    scenario: '学习一对一与一对多的业务附件关系。',
    step1: '注册文件插件和示例的 Client、Server 入口，再执行迁移。',
    step2: '打开附件、员工头像或订单附件页面。',
    step3: '上传测试文件，查看业务记录与文件记录如何关联。',
  },
  'app-plugin-jobs-example': {
    title: '后台任务与周期任务示例',
    summary: '通过应用管理的执行器演示一次性任务和周期任务。',
    scenario: '学习任务提交、进度、重试和周期执行。',
    step1: '使用已注册的示例，并配置应用的 Jobs 服务。',
    step2: '打开一次性任务页面提交测试任务并观察进度。',
    step3: '打开周期任务页面，启动或停止预定义的周期规则。',
  },
  'app-plugin-lifecycle-example': {
    title: '业务流程示例',
    summary: '演示客服工单、费用报销、订单等基于记录状态的业务流程。',
    scenario: '学习状态转换、延迟触发和事务提交后的副作用。',
    step1: '使用已注册的示例，并执行对应迁移和种子。',
    step2: '打开业务流程示例，按场景执行对应业务操作。',
    step3: '结合生命周期源码查看状态变化、历史和副作用执行。',
  },
  'app-plugin-mail-example': {
    title: '离线邮件示例',
    summary: '通过离线模拟 Provider 演示账户管理、邮箱同步和邮件发送。',
    scenario: '不连接真实邮箱即可体验 Mail 的集成方式。',
    step1: '沿用 Examples 内置的三个模拟 Provider 配置。',
    step2: '打开邮件示例，初始化并同步示例邮箱。',
    step3: '体验写信、模板、签名和同步日志；邮件投递为模拟执行。',
  },
  'app-plugin-notification-example': {
    title: '任务通知示例',
    summary: '在任务分配和更新时发送站内通知。',
    scenario: '学习业务操作如何触发消息，并从消息返回业务记录。',
    step1: '使用已注册的通知运行时与站内通知渠道。',
    step2: '创建测试任务并分配给应用用户。',
    step3: '以接收人的身份打开通知，查看和更新对应任务。',
  },
  'app-plugin-office-flows-example': {
    title: '办公流程示例',
    summary: '演示数据使用申请、收文办理和多层级办公待办。',
    scenario: '学习父子流程、审批阶段与定时生成任务的组合。',
    step1: '使用示例的迁移、种子和办公配置。',
    step2: '打开数据使用申请或收文页面，发起测试流程。',
    step3: '在我的待办中处理关联工作，并查看记录生命周期。',
  },
  'app-plugin-queue-example': {
    title: '任务排队示例',
    summary: '通过应用队列服务发布和消费问候消息与摘要任务。',
    scenario: '学习按渠道消费、重试配置和批量发布。',
    step1: '注册 Server 插件并配置应用队列后端。',
    step2: '查看消费处理器，以及 API 文档中的受认证接口。',
    step3: '通过文档中的接口发布测试消息并检查处理结果。',
  },
  'app-plugin-realtime-example': {
    title: '实时业务示例',
    summary: '演示协作任务、个人通知、CSV 导出及订阅能力实验。',
    scenario: '学习实时订阅、访问授权与错过消息后的恢复。',
    step1: '使用已注册的 Client、Server 示例并启用 Realtime。',
    step2: '打开任务、收件箱或导出页面，在两个会话中观察更新。',
    step3: '在能力实验页查看订阅、快照和恢复机制。',
  },
  'app-plugin-repository-example': {
    title: '业务数据操作示例',
    summary: '演示 CRM、订单、关系写入、流式查询、聚合与数值原子更新。',
    scenario: '通过关联业务数据和专项示例学习 Repository API。',
    step1: '使用已注册的示例，执行迁移和示例数据种子。',
    step2: '打开 CRM、订单或某个 Repository 专项示例。',
    step3: '结合资源声明和 API 实现查看页面操作如何落地。',
  },
  'app-plugin-routes-example': {
    title: '页面接入示例',
    summary: '演示受认证的服务端路由、懒加载客户端页面和 React Provider。',
    scenario: '学习插件如何贡献路由，以及页面如何访问应用 API。',
    step1: '与认证插件一起注册 Server 和 Client 入口。',
    step2: '打开示例页面，查看它读取的 API 结果。',
    step3: '对照路由声明、React Provider 和懒加载页面实现。',
  },
  'app-plugin-service-provider-example': {
    title: '后台服务示例',
    summary: '注册 Heartbeat 服务，演示启动、状态读取与关闭。',
    scenario: '学习服务 Token、依赖注入和 Provider 生命周期。',
    step1: '在示例应用中注册 Server 插件。',
    step2: '查看 Token、服务与 Provider 的实现。',
    step3: '启动后读取文档中的状态 API；敏感业务接口应另加认证。',
  },
  'app-plugin-skills-example': {
    title: 'Agent 能力指引示例',
    summary: '通过 Plugin Skill 描述 AppNotice 组件、通知服务和受认证 API。',
    scenario: '学习如何用插件 Skill 说明可复用能力的接入契约。',
    step1: '注册 Server 入口并同步应用 Skills。',
    step2: '阅读插件 Skill，导入公开的 AppNotice 组件。',
    step3: '在应用页面中组合该组件，并接入受认证的通知 API。',
  },
  'app-plugin-template-print-example': {
    title: '模板打印示例',
    summary: '使用固定 DOCX 模板和有权访问的销售数据生成发票，可选转换为 PDF。',
    scenario: '体验带业务权限校验的完整模板打印流程。',
    step1: '使用已注册的示例、迁移、种子及销售报价权限。',
    step2: '打开模板打印页面，将示例发票下载为 DOCX。',
    step3: '在服务端安装 LibreOffice 后可体验 PDF 转换。',
  },
};
