import {
  enUS as businessEnUS,
  zhCN as businessZhCN,
} from './business-locales.js';
import { enUS as pluginEnUS, zhCN as pluginZhCN } from './plugin-locales.js';

export const enUS = {
  business: businessEnUS,
  agentPrompt: 'Ask the Agent to build it',
  copyPrompt: 'Copy prompt',
  promptHint:
    'Replace the bracketed business details, then paste this into your Agent conversation.',
  promptEnding:
    'First check and reuse capabilities already available in this application. Explain missing prerequisites and confirm unclear business rules. Deliver a usable page or entry point and verify the requirements above.',
  promptCopied: 'Copied. Paste into your Agent conversation.',
  promptCopyFailed: 'Could not copy. Select the prompt and copy it manually.',
  technicalReference: 'Development reference',

  title: 'App foundation',
  description:
    'Find the capability you need, then give the Agent a prompt to build it for your business.',
  eyebrow: 'Application building guide',
  preview: 'Preview',
  all: 'All',
  filters: 'Filter by source',
  allIntro:
    'Find a business capability and copy a prompt to give to the Agent.',
  kernel: 'Core',
  plugins: 'Plugins',
  kernelIntro:
    'Shared building blocks for data, execution, realtime and internationalization.',
  pluginsIntro:
    'Business capabilities and examples you can ask the Agent to adapt.',
  scope: '{{count}} capabilities, including {{examples}} example plugins.',
  search: 'Search names or capabilities',
  catalog: 'Directory',
  purpose: 'What it provides',
  scenario: 'When to use it',
  steps: 'Getting started',
  relationships: 'Works with',
  relatedHint:
    'Explore related capabilities and examples for this business requirement.',
  docs: 'Read integration guide',
  underlyingCore: 'Underlying core',
  coreDocs: 'Read core guide',
  source: 'View source',
  demo: 'Open example',
  snippet: 'Configuration example',
  snippetNote:
    'Apply this configuration in the application composition; it does not run here.',
  noResults: 'No matching entries.',
  clear: 'Clear search',
  missing: 'Entry not found',
  missingHint: 'Choose an entry from the directory.',
  back: 'Back to directory',
  overview: 'Application usage',
  scopeNote:
    'Inclusion does not mean a feature is ready to use. Ask the Agent to check what your application already supports.',
  kernelScopeNote:
    'Use the prompts as a starting point. Replace the placeholders with your own business, roles and rules.',
  coreLabel: 'Core',
  pluginLabel: 'Plugin',
  exampleLabel: 'Example plugin',
  skillLabel: 'Skill',
  packageCount: '{{count}} entries',
  groups: {
    runtime: 'Application runtime',
    data: 'Data & files',
    security: 'Identity & access',
    automation: 'Processes & execution',
    interface: 'Interface & realtime',
    integration: 'Integrations & delivery',
    intelligence: 'AI & knowledge',
    examples: 'Example plugins',
    skills: 'Development Skills',
    other: 'Other plugin dependencies',
  },
  packages: {
    ...pluginEnUS,
    unlistedPlugin: {
      title: 'Plugin dependency',
      summary:
        'Declared in this application. A dedicated guide has not been added yet.',
      scenario:
        'Consult the package documentation for its capabilities and prerequisites.',
      step1: 'Inspect this dependency in the application manifest.',
      step2: 'Read the installed package documentation and public exports.',
      step3:
        'Follow its integration instructions; not every package has a Client or Server entry.',
    },
    db: {
      title: 'Business data',
      summary:
        'Define schemas, relations and migrations; read and write business data through repositories.',
      scenario:
        'Structured business data such as customers, orders and inventory.',
      step1: 'Configure a database connection in the application.',
      step2:
        'Define tables and relations in migrations, then generate Collection types.',
      step3:
        'Resolve repositories from the application database service for queries and transactions.',
    },
    lifecycle: {
      title: 'Business processes',
      summary:
        'Keep process state on the business record; declare transitions, guards and post-commit effects.',
      scenario: 'Purchase approvals, support tickets and order fulfilment.',
      step1: 'Declare states and transitions with defineLifecycle.',
      step2: 'Configure a repository store and an effect dispatcher.',
      step3:
        'Fire transitions from authorized APIs and display state and history.',
    },
    jobs: {
      title: 'Background jobs',
      summary:
        'Run one-off tasks and recurring work with application-owned executors.',
      scenario:
        'Long-running exports, asynchronous processing and recurring sync.',
      step1: 'Resolve a scoped executor from the application jobs service.',
      step2: 'Register job classes or recurring rules and set up the executor.',
      step3:
        'Submit work with retry and idempotency handling; choose a suitable backend for multiple instances.',
    },
    queue: {
      title: 'Queued work',
      summary: 'Publish messages to channels for asynchronous consumers.',
      scenario:
        'Decouple expensive operations and coordinate producers and consumers.',
      step1: 'Use the application-configured QueueService.',
      step2: 'Register channel handlers, then publish JSON messages.',
      step3: 'Choose an appropriate backend and design failure handling.',
    },
    concurrency: {
      title: 'Concurrent operations',
      summary:
        'Shared lock, synchronous executor and error contracts backed by a configured service.',
      scenario: 'Coordinate operations competing for the same resource.',
      step1:
        'Obtain a ConcurrentManager from the application concurrency service.',
      step2:
        'Use a stable resource name to create a lock or synchronous executor.',
      step3:
        'Choose waiting or bounded acquisition and ensure release; coordination scope depends on the backend.',
    },
    realtime: {
      title: 'Live updates',
      summary:
        'Provide authorized topic subscriptions and events that invalidate client state.',
      scenario: 'Job progress, collaboration and list-update notifications.',
      step1: 'Declare topics and subscription permissions.',
      step2: 'Publish events after business state changes.',
      step3:
        'Subscribe and refetch data; resynchronize authoritative state after reconnecting.',
    },
    i18n: {
      title: 'Multilingual content',
      summary:
        'Namespaces, resource loading and translation bindings for React and servers.',
      scenario: 'Translate interface copy, validation and server messages.',
      step1: 'Provide language resources under a namespace.',
      step2: 'Register resources through application or plugin declarations.',
      step3:
        'Use translation bindings; the i18n plugin supplies language switching.',
    },
    'app-plugin-file': {
      title: 'Files & attachments',
      summary:
        'File repositories, uploads and stable content URLs for business attachments.',
      scenario:
        'Attach documents and images to contracts, orders or employee records.',
      step1:
        'Register Server and Client entries; configure Database and Drive.',
      step2:
        'Declare a business file collection and expose authorized operations with defineFileRepositoryApiRoutes.',
      step3:
        'Install file-component-ui and connect upload, list and preview components.',
      coreSummary:
        'Drive provides file storage on local disks, S3 and OSS. The File plugin adds business file records, uploads and controlled content access on top of it.',
      coreUsage:
        'Configure disks in server/config/drive.ts and reuse the application Drive service through drive.use(). Direct Drive operations do not create attachment records or run File plugin authorization checks. See the core guide for standalone use.',
    },
    'app-plugin-authentication': {
      title: 'Authentication',
      summary: 'Provide identities, sessions and authentication endpoints.',
      scenario: 'Account sign-in, session management and protected APIs.',
      step1:
        'Register authentication and configure the application sign-in methods.',
      step2: 'Connect sign-in and session state on the client.',
      step3:
        'Require authentication on each private API, then enforce business permissions.',
    },
    'app-plugin-users': {
      title: 'User administration',
      summary:
        'User administration APIs, invitations and role-scope extensions.',
      scenario:
        'Create accounts, invite members, disable users and manage roles.',
      step1: 'Register Users after Authentication and Authorization.',
      step2: 'Grant administrators the required user actions.',
      step3:
        'Build application-owned pages with UsersClient and optional role scopes.',
    },
    'app-plugin-authorization': {
      title: 'Application permissions',
      summary:
        'Integrate authorization with management APIs and database access policies.',
      scenario: 'Control page access, actions, fields and record scopes.',
      step1: 'Register the plugin and declare business resources and actions.',
      step2:
        'Manage permission sets and assignments in application-owned pages.',
      step3:
        'Enforce authorization in APIs and data access, with matching client visibility.',
      coreSummary:
        'The authorization engine defines resources, actions, permission sets and record scopes to evaluate access. The plugin connects it to application identities, persistence and APIs.',
      coreUsage:
        'In an application, reuse the authorization service provided by the plugin. For standalone use, create an engine with createAuthorization, add permissionSetsPlugin({ store }) when using permission sets, and check access through authz.for(identity).require(...).',
    },
    'app-plugin-mail': {
      title: 'User mailboxes',
      summary:
        'Connect user mailboxes for sync, reading, drafts, attachments and send history.',
      scenario: 'Handle customer correspondence inside the application.',
      step1: 'Register Mail and add mailConfig to application configuration.',
      step2: 'Configure providers and let users authorize their mailboxes.',
      step3:
        'Integrate inbox, composition, sending and sync through mail services and components.',
    },
    'app-plugin-notification': {
      title: 'System notifications',
      summary:
        'Deliver notifications through configured channels with attempts and delivery records.',
      scenario:
        'Approval results, task reminders, in-app messages and external notifications.',
      step1: 'Register Notification and the required channel providers.',
      step2: 'Configure named channels and prepare channel-specific messages.',
      step3:
        'Send through the notification service with an idempotency key and inspect delivery results.',
    },
    'app-plugin-knowledge': {
      title: 'Knowledge management',
      summary:
        'Organize spaces, documents and files with versions, search and proposal review.',
      scenario:
        'Policies, project documents and searchable knowledge for agents.',
      step1:
        'Register Knowledge and define application spaces and access policies.',
      step2:
        'Compose KnowledgeView and document features in application pages.',
      step3:
        'Connect search providers and agent retrieval as needed while preserving user access rules.',
    },
    'app-plugin-agents': {
      title: 'AI & agents',
      summary: 'Integrate model services, agents, conversations and runners.',
      scenario:
        'AI assistants, business analysis and runner-backed agent work.',
      step1: 'Register Agents and configure model services and access.',
      step2:
        'Integrate OnlineAgent sessions or register a runner for the scenario.',
      step3:
        'Supply business context and authorized tools, then track runs and usage.',
    },
    'app-plugin-api-keys': {
      title: 'API keys',
      summary:
        'Authenticate external requests as the key owner under their permissions.',
      scenario:
        'Application API calls from ERP, scripts or third-party systems.',
      step1:
        'Register the server plugin and the API key extensions in authentication configuration.',
      step2:
        'Create a personal key through the application UI, limiting its scope as needed.',
      step3:
        'Send x-api-key; requests still follow the owning user permissions.',
    },
    'app-plugin-scheduler': {
      title: 'Scheduling',
      summary:
        'Connect code-defined schedules to Jobs and record each occurrence.',
      scenario:
        'Daily synchronization, scheduled reminders and recurring maintenance.',
      step1: 'Register Scheduler and compose the application jobs service.',
      step2:
        'Register a target type, then declare cron and timezone with defineSchedule.',
      step3:
        'Configure a suitable Jobs backend and inspect occurrence results.',
    },
  },
};

export const zhCN: typeof enUS = {
  business: businessZhCN,
  agentPrompt: '让 Agent 帮你搭建',
  copyPrompt: '复制提示词',
  promptHint: '替换【】中的业务信息，再粘贴到与 Agent 的对话中。',
  promptEnding:
    '先检查并复用当前应用已有的能力；缺少使用条件时先说明，业务规则不明确时先确认。完成后提供可操作的页面或使用入口，并按上述要求验证。',
  promptCopied: '已复制，可粘贴到与 Agent 的对话中。',
  promptCopyFailed: '复制失败，请选中提示词手动复制。',
  technicalReference: '开发参考',

  title: '应用底座',
  description: '找到需要的业务能力，复制提示词，让 Agent 帮你搭建。',
  eyebrow: '应用搭建指南',
  preview: '预览',
  all: '全部',
  filters: '按来源筛选',
  allIntro: '按业务需要查找能力，复制提示词交给 Agent。',
  kernel: '内核',
  plugins: '插件',
  kernelIntro: '应用的通用基础能力：数据、任务执行、实时通信与国际化。',
  pluginsIntro: '可用于业务搭建的能力，以及供 Agent 参考的示例。',
  scope: '已收录 {{count}} 项能力，含 {{examples}} 个示例插件。',
  search: '搜索名称或功能',
  catalog: '目录',
  purpose: '提供什么能力',
  scenario: '适合什么场景',
  steps: '如何开始使用',
  relationships: '配合使用',
  relatedHint: '这些能力或示例可以一起用于你的业务需求。',
  docs: '阅读接入指南',
  underlyingCore: '底层内核',
  coreDocs: '阅读内核使用指南',
  source: '查看源码',
  demo: '打开示例',
  snippet: '配置示例',
  snippetNote: '需加入应用配置集合；此处只展示示例，不执行代码。',
  noResults: '没有找到匹配项。',
  clear: '清除搜索',
  missing: '未找到此项',
  missingHint: '请从目录选择内核或插件。',
  back: '返回目录',
  overview: '应用使用情况',
  scopeNote:
    '列入目录不代表功能已经启用；搭建前让 Agent 检查当前应用已有能力。',
  kernelScopeNote: '提示词是需求起点，请替换其中的业务名称、角色和规则。',
  coreLabel: '内核',
  pluginLabel: '插件',
  exampleLabel: '示例插件',
  skillLabel: 'Skill',
  packageCount: '{{count}} 项',
  groups: {
    runtime: '应用运行时',
    data: '数据与文件',
    security: '身份与权限',
    automation: '流程与执行',
    interface: '界面与实时通信',
    integration: '集成与消息',
    intelligence: 'AI 与知识',
    examples: '示例插件',
    skills: '开发 Skills',
    other: '其他插件依赖',
  },
  packages: {
    ...pluginZhCN,
    unlistedPlugin: {
      title: '插件依赖',
      summary: '已列入当前应用依赖，专属使用指南尚未补充。',
      scenario: '请查阅该插件的文档，了解其功能与接入前提。',
      step1: '在应用依赖清单中查看该插件。',
      step2: '阅读已安装插件的文档及其公开入口。',
      step3: '按照接入要求使用；并非每个插件都有 Client 或 Server 入口。',
    },
    db: {
      title: '业务数据',
      summary: '定义数据结构、关联和迁移，通过统一的 Repository 读写业务数据。',
      scenario: '客户、订单、库存等结构化业务数据。',
      step1: '在应用中配置数据库连接。',
      step2: '用迁移定义表结构和关联，再生成 Collection 类型。',
      step3: '从应用数据库服务取得 Repository，完成查询与事务操作。',
    },
    lifecycle: {
      title: '业务生命周期',
      summary: '把流程状态放在业务记录上，声明流转、校验和提交后的动作。',
      scenario: '采购审批、工单流转、订单支付与履约。',
      step1: '用 defineLifecycle 声明状态与流转。',
      step2: '配置 Repository 存储及后续动作的执行器。',
      step3: '从已鉴权的业务接口触发流转，展示状态和历史。',
    },
    jobs: {
      title: '后台任务',
      summary: '执行一次性任务和周期任务，由应用统一管理执行器。',
      scenario: '耗时导出、异步处理、周期性同步。',
      step1: '从应用 Jobs 服务获取对应作用域的执行器。',
      step2: '注册 Job 类或配置周期规则，完成执行器初始化。',
      step3: '提交任务并处理重试与幂等；多实例部署选择匹配的后端。',
    },
    queue: {
      title: '任务排队',
      summary: '生产者向通道投递消息，消费者异步处理，实现业务解耦。',
      scenario: '拆分高耗时操作，协调生产者与消费者。',
      step1: '使用应用统一配置的 QueueService。',
      step2: '注册通道处理器，再由生产者投递 JSON 消息。',
      step3: '根据部署方式选择内存或扩展后端，并设计失败处理。',
    },
    concurrency: {
      title: '并发操作协调',
      summary: '统一锁、串行执行器和错误类型，由配置的服务提供具体实现。',
      scenario: '协调同一资源的竞争操作。',
      step1: '通过应用并发服务取得 ConcurrentManager。',
      step2: '为资源指定稳定名称，创建锁或同步执行器。',
      step3: '选择等待或限时尝试，并确保释放；协调范围取决于后端。',
    },
    realtime: {
      title: '实时更新',
      summary: '提供主题订阅与事件推送，通知客户端重新读取最新状态。',
      scenario: '任务进度、多人协作和列表更新提示。',
      step1: '声明主题与订阅权限。',
      step2: '服务端在业务状态变更后发布事件。',
      step3: '客户端订阅并重新读取数据；重连后重新同步权威状态。',
    },
    i18n: {
      title: '多语言运行时',
      summary: '提供命名空间、资源加载以及 React 和服务端翻译绑定。',
      scenario: '让界面文案、校验信息和服务端消息支持多语言。',
      step1: '按命名空间提供语言资源。',
      step2: '通过应用或插件声明注册资源。',
      step3: '在页面和服务端使用翻译绑定；语言切换由 i18n 插件提供。',
    },
    'app-plugin-file': {
      title: '文件与附件',
      summary: '提供文件 Repository、上传接口与稳定内容地址，接入业务附件。',
      scenario: '为合同、订单或员工记录添加附件和图片。',
      step1: '注册文件插件的 Server 与 Client 入口，配置 Database 和 Drive。',
      step2:
        '声明业务文件 Collection，用 defineFileRepositoryApiRoutes 暴露受控操作。',
      step3: '安装 file-component-ui 组件，在页面接入上传、列表与预览。',
      coreSummary:
        'Drive 提供文件存储能力，统一访问本地磁盘、S3 和 OSS。文件插件在此基础上提供业务附件记录、上传接口与受控的内容访问。',
      coreUsage:
        '在 server/config/drive.ts 配置磁盘，复用应用的 Drive 服务，通过 drive.use() 读写文件。直接调用 Drive 不会创建附件记录，也不会执行文件插件的权限检查；独立使用方式见内核指南。',
    },
    'app-plugin-authentication': {
      title: '身份认证',
      summary: '提供登录身份、会话和认证接口，建立应用的身份边界。',
      scenario: '账号登录、会话管理与受保护接口。',
      step1: '注册认证插件并配置应用的认证方式。',
      step2: '在客户端接入登录与会话状态。',
      step3: '每个私有 API 显式要求认证，再执行业务权限校验。',
    },
    'app-plugin-users': {
      title: '用户管理',
      summary: '提供用户管理 API、邀请流程及角色范围扩展点。',
      scenario: '创建员工账号、邀请成员、停用账号和管理角色。',
      step1: '在认证和授权插件之后注册 Users。',
      step2: '为管理者授予所需的 user 操作。',
      step3: '用 UsersClient 构建应用自己的用户页面，按需接入角色范围。',
    },
    'app-plugin-authorization': {
      title: '应用权限',
      summary: '把授权引擎接入应用，提供权限管理接口和数据库访问策略。',
      scenario: '控制页面、操作、字段和记录范围。',
      step1: '注册授权插件，并声明业务资源和操作。',
      step2: '在应用管理页配置权限集和分配关系。',
      step3: '在 API 与数据访问中强制执行授权，界面同步控制可见性。',
      coreSummary:
        '授权引擎定义资源、操作、权限集和记录范围，负责权限判定。授权插件将它与应用身份、持久化和 API 接口连接起来。',
      coreUsage:
        '在应用中复用授权插件提供的服务。独立使用时，通过 createAuthorization 创建引擎；需要权限集时接入 permissionSetsPlugin({ store })，再通过 authz.for(identity).require(...) 检查权限。',
    },
    'app-plugin-mail': {
      title: '用户邮箱',
      summary: '连接用户邮箱，支持同步、阅读、草稿、附件和发送历史。',
      scenario: '在业务系统中处理客户往来邮件。',
      step1: '注册 Mail，并将 mailConfig 加入应用配置集合。',
      step2: '配置邮件提供方，由用户授权连接自己的邮箱。',
      step3: '通过邮件服务与组件接入收件、撰写、发送和同步。',
    },
    'app-plugin-notification': {
      title: '系统通知',
      summary: '按配置的通道投递通知，记录发送、重试与投递结果。',
      scenario: '审批结果、任务提醒、站内消息和外部通道通知。',
      step1: '注册 Notification 以及所需的通道提供方。',
      step2: '配置具名 Channel，准备各通道需要的消息内容。',
      step3: '通过通知服务发送，设置幂等键并查看投递结果。',
    },
    'app-plugin-knowledge': {
      title: '知识管理',
      summary: '组织知识空间、文档和文件，提供版本、检索及提案审核。',
      scenario: '公司制度、项目资料以及 Agent 可检索的业务知识。',
      step1: '注册 Knowledge，定义应用的知识空间与访问规则。',
      step2: '在页面组合 KnowledgeView 及文档功能。',
      step3: '按需要接入搜索提供方和 Agent 检索，保留用户访问边界。',
    },
    'app-plugin-agents': {
      title: 'AI 与 Agent',
      summary: '接入模型服务、Agent、会话和 Runner，组织 AI 执行。',
      scenario: 'AI 助手、业务分析与需要执行环境的 Agent 任务。',
      step1: '注册 Agents，配置模型服务与授权。',
      step2: '按场景接入 OnlineAgent 会话或注册 Runner。',
      step3: '把业务上下文和受控工具交给 Agent，跟踪运行与用量。',
    },
    'app-plugin-api-keys': {
      title: 'API 密钥',
      summary: '让外部调用通过密钥认证，以密钥所有者的身份接受权限校验。',
      scenario: 'ERP、集成脚本或第三方系统调用应用 API。',
      step1: '注册服务端插件并在认证配置中接入 API Key 扩展。',
      step2: '通过应用页面创建个人密钥，按需限制作用域。',
      step3: '调用时使用 x-api-key，请求继续遵守所属用户的权限。',
    },
    'app-plugin-scheduler': {
      title: '定时调度',
      summary: '将代码声明的周期规则接入 Jobs，记录每次触发和执行。',
      scenario: '每日数据同步、定时提醒和周期性维护。',
      step1: '注册 Scheduler 并组合应用 Jobs 服务。',
      step2: '注册任务目标类型，再用 defineSchedule 声明 cron 和时区。',
      step3: '配置匹配部署方式的 Jobs 后端，检查每次触发结果。',
    },
  },
};
