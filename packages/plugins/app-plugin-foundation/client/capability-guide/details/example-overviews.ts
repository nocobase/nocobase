import type { ModuleOverview } from './module-overview-types.js';

export const exampleOverviews: Readonly<Record<string, ModuleOverview>> = {
  'app-plugin-authorization-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Adapt sales collaboration to the team’s responsibilities and permissions.',
          '将销售协作示例改为团队实际的职责和权限。',
        ],
        prompt: [
          'Use the sales collaboration example to let [salespeople manage their own customers and managers view their team’s customers].',
          '参考销售协作示例，为【销售团队】设置【销售只能管理自己的客户、主管可查看团队客户】的权限。',
        ],
        steps: [
          [
            'Identify actual resources, actions and data scopes, reusing the existing authorization model.',
            '先确认实际业务对象、操作和数据范围，复用现有授权模型。',
          ],
          [
            'Use default scopes, sharing and restriction rules to implement responsibilities.',
            '结合默认数据范围、共享和限制规则实现职责分工。',
          ],
          [
            'Do not copy demo accounts, permission-reset controls or demo data into production.',
            '不复制演示账号、权限重置入口或示例生产数据。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Sales collaboration example interface', '销售协作示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/authorization-example'],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-cli-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Add a command-line entry for a specific business operation.',
          '为明确的业务操作增加命令行入口。',
        ],
        prompt: [
          'Use the CLI example to add [customer import] with a file argument and an import preview.',
          '参考 CLI 示例，为【客户数据导入】增加命令行操作，支持指定文件和预览导入结果。',
        ],
        steps: [
          [
            'Register the business command through the CLI plugin using existing argument and output conventions.',
            '通过 CLI 插件注册业务命令，沿用现有命令参数和输出约定。',
          ],
          [
            'Reuse business services for import and distinguish preview from writes.',
            '复用业务服务处理导入，明确预览和实际写入的边界。',
          ],
          [
            'Provide readable errors and exit statuses; command registration does not mean import completion.',
            '为错误和退出状态提供可读输出，不把命令注册当成导入完成。',
          ],
        ],
      },
    ],
    evidence: [
      {
        title: ['Example commands', '示例命令'],
        description: [
          'Actual command registrations are not available yet; this example needs no browser page.',
          '实际命令注册信息尚待获取；该示例不要求浏览器页面。',
        ],
      },
    ],
    note: [
      'Commands are registered by the CLI plugin, without a universal page or dedicated YAML toggle.',
      '命令由 CLI 插件注册，不存在统一的页面或专属 YAML 开关。',
    ],
  },
  'app-plugin-database-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Create business structures with migrations and initial data.',
          '通过迁移和初始数据建立业务数据结构。',
        ],
        prompt: [
          'Use the database example to add [customers and contacts] tables and relations while preserving existing data.',
          '参考数据库示例，为【客户和联系人】增加数据表和关联，保留现有数据。',
        ],
        steps: [
          [
            'Confirm the target connection, fields and relations, reusing application db configuration.',
            '确认目标数据库连接和字段、关联需求，复用应用的 db 配置。',
          ],
          [
            'Add structures through new migrations without modifying merged or applied migrations.',
            '通过新迁移增加结构，不修改已合并或已执行的历史迁移。',
          ],
          [
            'Add initial data separately as needed; migration execution must be established from actual records.',
            '初始数据按业务需要单独添加；迁移是否执行以实际记录为准。',
          ],
        ],
      },
    ],
    evidence: [
      {
        title: ['Migrations and initial data', '迁移与初始数据'],
        description: [
          'Execution records are not available yet; a dependency does not prove tables were created.',
          '执行记录尚待获取，依赖存在不能证明表已创建。',
        ],
      },
    ],
    configurations: [
      {
        title: ['Target database', '目标数据库'],
        fields: [['Connection used by the example', '示例使用的连接']],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-file-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Add authorized attachments to business records.',
          '给业务记录添加可授权访问的附件。',
        ],
        prompt: [
          'Use the file association example to add attachments to [contracts] for [contract participants] to upload, view and download.',
          '参考文件关联示例，为【合同】增加附件，让【合同参与人员】上传、查看和下载文件。',
        ],
        steps: [
          [
            'Confirm drive configuration and file collections, reusing existing storage.',
            '确认 drive 存储配置与业务使用的文件表，复用已有存储。',
          ],
          [
            'Define contract-file relations and reuse file resource APIs and components.',
            '定义合同与文件的关联，并复用文件资源接口和组件。',
          ],
          [
            'Apply contract permissions to upload, preview and download instead of demo access rules.',
            '上传、预览和下载均使用合同的权限范围，不沿用演示访问规则。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['File association example interface', '文件关联示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/file-repository'],
      },
    ],
    configurations: [
      {
        title: ['File resource configuration', '文件资源配置'],
        fields: [['File storage and collections', '文件存储与文件表']],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-jobs-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Run expensive business work in the background.',
          '将耗时业务交给后台执行。',
        ],
        prompt: [
          'Use the jobs example to run [monthly report generation] in the background and let users view results without keeping the page open.',
          '参考后台任务示例，为【批量生成月报】增加后台执行和结果查看，让用户不用一直等待页面。',
        ],
        steps: [
          [
            'Select an existing jobs configuration and define inputs and result storage.',
            '选择应用已有的 jobs 配置，明确业务输入和结果保存位置。',
          ],
          [
            'Implement processing and authorized progress/result entries while preserving existing job configuration.',
            '实现任务处理和授权的进度、结果入口，保留现有任务配置。',
          ],
          [
            'Define periodic execution separately; the example schedules page is not a generic scheduler manager.',
            '周期执行另行定义，示例周期任务页面不能当成通用定时任务管理器。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['One-off job example', '一次性任务示例'],
        names: [],
        knownRoute: true,
        paths: ['/jobs-example/jobs'],
      },
      {
        title: ['Periodic job example', '周期任务示例'],
        names: [],
        knownRoute: true,
        paths: ['/jobs-example/schedules'],
      },
    ],
    configurations: [
      {
        title: ['Background execution configuration', '后台执行配置'],
        fields: [['Selected jobs configuration', '使用的 jobs 配置']],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-lifecycle-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Adapt example processes to business states and actions.',
          '把示例流程改为业务自己的状态和操作。',
        ],
        prompt: [
          'Use the lifecycle example to add [Pending, In progress, Resolved, Closed] states and actions to [support tickets].',
          '参考流程示例，为【售后工单】增加【待处理、处理中、已解决、已关闭】状态及对应操作。',
        ],
        steps: [
          [
            'Choose the closest process definition and define transitions and action permissions.',
            '选择与需求最接近的流程定义，明确状态转换与操作权限。',
          ],
          [
            'Implement business records and page actions, adding post-commit notifications as needed.',
            '实现实际业务记录及其页面操作，按需接入提交后通知。',
          ],
          [
            'Confirm parameter sources separately instead of inventing a lifecycle configuration section or generic designer.',
            '单独确认业务参数来源，不创建假定的 lifecycle 配置段或通用设计器。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Ticket process example', '工单流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/tickets'],
      },
      {
        title: ['Expense process example', '报销流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/expenses'],
      },
      {
        title: ['Invoice process example', '发票流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/invoices'],
      },
      {
        title: ['Order process example', '订单流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/orders'],
      },
      {
        title: ['Export process example', '导出流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/exports'],
      },
      {
        title: ['Purchase process example', '采购流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/purchases'],
      },
      {
        title: ['Fulfilment process example', '履约流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/fulfilments'],
      },
      {
        title: ['Subscription process example', '订阅流程示例'],
        names: [],
        knownRoute: true,
        paths: ['/lifecycle-example/subscriptions'],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-mail-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Turn the offline mailbox demo into a business workspace.',
          '把离线邮箱演示改为真实业务工作台。',
        ],
        prompt: [
          'Use the mail example to provide a mailbox workspace for [support], using real accounts to send, receive and inspect sync results.',
          '参考邮箱示例，为【客服团队】提供邮箱工作台，使用实际邮箱账号收发邮件并查看同步结果。',
        ],
        steps: [
          [
            'Confirm mail.providers and account authorization prerequisites; offline mock services do not connect external mailboxes.',
            '先确认 mail.providers 和账号授权条件；离线模拟服务不连接外部邮箱。',
          ],
          [
            'Reuse public Mail components for account and workspace entries, isolating mailboxes by user permissions.',
            '复用 Mail 公开组件提供账号和工作台入口，按用户权限隔离邮箱。',
          ],
          [
            'Configure actual sync jobs instead of retaining demo messages or mock sync records as real state.',
            '配置实际同步任务，不把演示邮件和模拟同步记录保留为真实业务状态。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Mail demo entry', '邮箱演示入口'],
        names: [],
        knownRoute: true,
        paths: ['/mail-example'],
      },
      {
        title: ['Mail workspace example', '邮箱工作台示例'],
        names: [],
        knownRoute: true,
        paths: ['/mail-example/workspace'],
      },
      {
        title: ['Sync log example', '同步记录示例'],
        names: [],
        knownRoute: true,
        paths: ['/mail-example/sync-logs'],
      },
    ],
    note: [
      'This example uses offline mock services. An accessible workspace does not establish a real mailbox connection.',
      '此示例使用离线模拟服务。能打开工作台不代表已经连接真实邮箱。',
    ],
  },
  'app-plugin-notification-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Send notifications for specific business changes.',
          '为明确的业务变化发送通知。',
        ],
        prompt: [
          'Use the notification example to send an in-app message when [a ticket is assigned], linking to the ticket.',
          '参考通知示例，在【工单被分配给处理人】时发送站内信，点击后打开对应工单。',
        ],
        steps: [
          [
            'Confirm the in-app channel in notification.channels and recipient rules.',
            '确认 notification.channels 中的站内信渠道以及收件人规则。',
          ],
          [
            'Send after successful business actions, linking to records the recipient may access.',
            '在业务操作成功后发送通知，链接指向收件人可访问的记录。',
          ],
          [
            'Provide an actual inbox entry; demo tasks and recipients are not application-wide defaults.',
            '提供实际收件箱入口；示例任务和收件人不作为全应用默认规则。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Task notification example interface', '任务通知示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/notification-example'],
      },
    ],
    configurations: [
      {
        title: ['Notification configuration', '通知配置'],
        fields: [
          ['Delivery channels used by the feature', '业务使用的投递渠道'],
        ],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-office-flows-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Adapt office examples to the organization’s processes.',
          '把办公示例调整为组织自己的流程。',
        ],
        prompt: [
          'Use the office flows example for [department] data requests reviewed by [the responsible manager], with a My tasks entry.',
          '参考办公流程示例，为【本部门】设置数据使用申请，按【负责人审核】的方式流转，并提供我的待办入口。',
        ],
        steps: [
          [
            'Confirm departments, participants, processing rules and working calendars.',
            '确认实际部门、参与人员、处理规则和工作日历。',
          ],
          [
            'Adapt request flows and permissions, providing request and task entries.',
            '按业务修改申请流程和访问权限，提供申请及待办入口。',
          ],
          [
            'Do not directly use example people, departments or fixed-year calendars.',
            '不要直接使用示例人员、部门和固定年份日历。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Data request example', '数据使用申请示例'],
        names: [],
        knownRoute: true,
        paths: ['/office-flows/data-requests'],
      },
      {
        title: ['Incoming document example', '收文示例'],
        names: [],
        knownRoute: true,
        paths: ['/office-flows/incoming'],
      },
      {
        title: ['My tasks example', '我的待办示例'],
        names: [],
        knownRoute: true,
        paths: ['/office-flows/tasks'],
      },
    ],
    configurations: [
      {
        title: ['Office flow configuration', '办公流程配置'],
        fields: [
          [
            'Departments, processing rules and calendar',
            '部门、处理规则与日历',
          ],
        ],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-queue-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Add processing queues for queued or delayed business work.',
          '为需要排队或延迟的业务增加处理队列。',
        ],
        prompt: [
          'Use the queue example to queue [external order synchronization] with rate limits and retries.',
          '参考队列示例，为【外部订单同步】增加队列，支持限速和失败重试。',
        ],
        steps: [
          [
            'Confirm queueExample.queue selection and its queue configuration; do not publish jobs to probe status.',
            '确认 queueExample.queue 选择和对应 queue 配置；不要通过投递任务探测状态。',
          ],
          [
            'Define business jobs and consumers with explicit retries and idempotency.',
            '定义业务任务和消费者，复用明确的重试和幂等处理方式。',
          ],
          [
            'Configure rates and delays as needed; cross-instance sharing requires a suitable adapter.',
            '按需要配置速率和延迟，多实例共享需对应适配器。',
          ],
        ],
      },
    ],
    evidence: [
      {
        title: ['Producers and consumers', '生产者与消费者'],
        description: [
          'Declarations and runtime state are not available yet; this example has no standalone management page.',
          '声明和运行状态尚待获取；本示例不提供独立管理页面。',
        ],
      },
    ],
    configurations: [
      {
        title: ['Example queue configuration', '示例队列配置'],
        fields: [['Selected queue configuration', '选用的队列配置']],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-realtime-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Reflect other users’ changes promptly in business pages.',
          '让业务页面及时反映其他用户的修改。',
        ],
        prompt: [
          'Use the realtime example to refresh [the task board] after updates and refetch current data after reconnection.',
          '参考实时更新示例，让【任务看板】在任务更新后自动刷新，并在断线恢复后重新获取最新数据。',
        ],
        steps: [
          [
            'Confirm realtime configuration and authorized business event topics.',
            '确认 realtime 配置和业务使用的授权事件主题。',
          ],
          [
            'Refetch data after events and unsubscribe when leaving the page.',
            '收到事件后重新查询数据，离开页面时取消订阅。',
          ],
          [
            'Preserve recovery after reconnection; configure cross-instance delivery separately.',
            '保留重新连接后的恢复流程，多实例分发需单独配置。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Realtime example interface', '实时更新示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/realtime-example'],
      },
    ],
    configurations: [
      {
        title: ['Realtime configuration', '实时更新配置'],
        fields: [['Adapter and namespace', '适配器与命名空间']],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-repository-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Implement queries, relations and updates for real business data.',
          '用实际业务数据实现查询、关联和修改。',
        ],
        prompt: [
          'Use the Repository example for [customers] with contact relations, filtering and profile updates under existing permissions.',
          '参考 Repository 示例，为【客户】提供联系人关联、条件查询和资料修改，按现有权限控制数据访问。',
        ],
        steps: [
          [
            'Confirm collections and their db connection; Repository is not a separate database configuration.',
            '确认业务数据集合及所选 db 连接，不把 Repository 当成另一份数据库配置。',
          ],
          [
            'Use public Repository APIs for queries, relations and updates.',
            '通过公开 Repository API 处理查询、关联和修改。',
          ],
          [
            'Retain authentication and data scopes in business APIs rather than copying demo permissions.',
            '业务接口保留鉴权和数据范围，不能直接沿用演示权限。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Customer management example interface', '客户管理示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/repository-example/crm'],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-routes-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Add page and API entries consistent with business permissions.',
          '添加与业务权限一致的页面和接口入口。',
        ],
        prompt: [
          'Use the routes example to add an [inventory lookup] page and API accessible only to users with viewing permission.',
          '参考路由示例，为【库存查询】添加页面和对应接口，只有具备查看权限的用户可以访问。',
        ],
        steps: [
          [
            'Confirm the deployment path, page route and API resource, avoiding duplicate routes.',
            '确认应用部署路径、页面路由和接口资源，避免重复路由。',
          ],
          [
            'Register pages and server APIs through public mechanisms and declare API documentation.',
            '通过公开注册方式接入页面与服务端接口，并声明接口文档。',
          ],
          [
            'Set page and API permissions separately; route existence does not grant anonymous access.',
            '分别设置页面与接口权限，路由存在不代表允许匿名访问。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Routes example interface', '路由示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/routes-example'],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-service-provider-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Provide a shared service for multiple business features.',
          '为多个业务功能提供共用服务。',
        ],
        prompt: [
          'Use the service provider example for a shared [business number generator] used by [orders and contracts].',
          '参考服务提供示例，为【订单和合同】提供共用的【业务编号生成】服务，避免各自重复实现。',
        ],
        steps: [
          [
            'Define the service contract and lifecycle using public service registration.',
            '先确定服务契约和生命周期，复用公开服务注册机制。',
          ],
          [
            'Inject through an explicit public token and manage startup and disposal as needed.',
            '通过明确的公共 Token 注入服务，按业务需要管理启动和释放。',
          ],
          [
            'Availability requires runtime evidence; a token or example heartbeat does not establish business service health.',
            '服务是否可用需运行时证据；存在 Token 或示例心跳不代表业务服务健康。',
          ],
        ],
      },
    ],
    evidence: [
      {
        title: ['Example service declarations', '示例服务声明'],
        description: [
          'Registrations and runtime state are not available yet; shared services need no standalone page.',
          '注册与运行状态尚待获取；公共服务不要求独立页面。',
        ],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-skills-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Let Agent use existing components and services to build business interfaces.',
          '让 Agent 使用已有的组件和服务完成业务界面。',
        ],
        prompt: [
          'Use the Skills example to add [notices] to [the home page], reusing existing notice components and services.',
          '参考 Skills 示例，在【首页】增加【公告】，复用已有公告组件和服务，不重新做一套。',
        ],
        steps: [
          [
            'Read the packaged Skill for public AppNotice and serviceToken usage.',
            '阅读包内 Skill，确认 AppNotice 与 serviceToken 的公开用法。',
          ],
          [
            'Embed the component on the target page with business data and existing permissions.',
            '在目标页面嵌入组件并提供业务数据，沿用实际访问权限。',
          ],
          [
            'Confirm Skill availability and component embedding separately; syncing a Skill does not generate a page.',
            '分别确认 Skill 可用与组件已嵌入；同步 Skill 不会自动生成页面。',
          ],
        ],
      },
    ],
    evidence: [
      {
        title: ['Notice component and service', '公告组件与服务'],
        description: [
          'Actual embedding and service state need confirmation and cannot be inferred from Skill availability.',
          '实际嵌入位置和服务状态尚待确认，不能根据 Skill 存在推断。',
        ],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
  'app-plugin-template-print-example': {
    actions: [
      {
        title: [
          'Build a business feature from this example',
          '基于此示例实现业务',
        ],
        description: [
          'Generate documents using real business templates.',
          '使用实际业务模板生成文档。',
        ],
        prompt: [
          'Use the document generation example to produce [company-format quotations] from [sales quotations], preserving record permissions and providing downloads.',
          '参考文档生成示例，为【销售报价】生成【公司格式的报价单】，保留记录访问权限并提供下载。',
        ],
        steps: [
          [
            'Inspect the fixed DOCX example data and mappings, replacing them with business content.',
            '确认固定 DOCX 示例的数据来源和模板映射，替换为实际业务内容。',
          ],
          [
            'Generate and download within authorized record scopes without allowing arbitrary data queries.',
            '在授权的业务记录范围生成并下载文档，不开放任意数据查询。',
          ],
          [
            'PDF conversion is separate; do not claim support without a configured converter.',
            'PDF 是独立转换能力，未配置转换服务时不能表示已经支持。',
          ],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Document generation example interface', '文档生成示例界面'],
        names: [],
        knownRoute: true,
        paths: ['/template-print-example'],
      },
    ],
    evidence: [
      {
        title: ['Templates and output formats', '模板与输出格式'],
        description: [
          'A fixed DOCX example does not establish that all business templates or PDF output are configured.',
          '固定 DOCX 示例不代表所有业务模板或 PDF 输出已配置。',
        ],
      },
    ],
    note: [
      'This is an example feature. An available demo entry does not mean the real business feature is configured.',
      '这是示例功能。示例入口可用不代表真实业务已经完成配置。',
    ],
  },
};
