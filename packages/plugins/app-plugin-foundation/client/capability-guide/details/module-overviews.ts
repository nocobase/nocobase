import type { ModuleOverview } from './module-overview-types.js';

export const moduleOverviews: Readonly<Record<string, ModuleOverview>> = {
  'app-plugin-knowledge': {
    configurations: [
      {
        title: ['Storage and search configuration', '存储与检索配置'],
        fields: [
          ['File storage and upload limit', '文件存储与上传限制'],
          ['Index instances and current selection', '索引实例及当前选择'],
          ['Indexing job configuration', '索引后台任务配置'],
        ],
      },
    ],
    evidence: [
      {
        title: ['Accessible knowledge spaces', '可访问的知识空间'],
        description: [
          'Only spaces you may access belong here; the directory has not been confirmed.',
          '只展示你有权访问的空间，空间目录尚待确认。',
        ],
      },
    ],
    interfaces: [
      {
        title: ['Knowledge interface', '知识库界面'],
        names: ['knowledge'],
        knownRoute: true,
      },
    ],
    actions: [
      {
        title: [
          'Configure knowledge storage and search',
          '配置知识库的存储与检索',
        ],
        description: [
          'Choose file storage and a search method.',
          '选择文件存储和检索方式。',
        ],
        prompt: [
          'Configure storage and search for [contract documents] in the knowledge base. Prefer existing storage and models and identify missing prerequisites.',
          '帮我为知识库配置【合同资料】的文件存储和检索，优先使用已有存储和模型，并告诉我还缺哪些条件。',
        ],
        steps: [
          [
            'Inspect knowledge.disk, upload limits and the selected knowledge.jobs configuration.',
            '核对 knowledge.disk、上传限制和 knowledge.jobs 所选配置。',
          ],
          [
            'Inspect named knowledge.indexing instances and the selected index settings; treat declarations and selection separately.',
            '检查 knowledge.indexing 的命名实例与实际选用的索引设置；部署声明和当前选择分别处理。',
          ],
          [
            'Confirm reindexing scope and model usage before switching indexes; omit credentials from summaries.',
            '更换索引前确认重建范围与模型用量，配置摘要不显示凭据。',
          ],
        ],
      },
      {
        title: [
          'Add a knowledge interface and spaces',
          '添加知识库界面与业务空间',
        ],
        description: [
          'Let the team find, read and maintain documents.',
          '让团队查找、阅读和维护资料。',
        ],
        prompt: [
          'Add a knowledge base for [the support team] containing [manuals and FAQs], with search, reading and editing entries and access based on team responsibilities.',
          '帮我为【售后团队】添加知识库，整理【产品手册和常见问题】，提供查找、阅读和维护入口，并按团队职责设置权限。',
        ],
        steps: [
          [
            'Define space ownership, candidate spaces and read/edit permissions.',
            '确认业务空间归属、候选空间及读取、修改权限。',
          ],
          [
            'Reuse public knowledge components and APIs in a real application route and entry.',
            '复用知识库公共组件和接口，在应用中提供真实路由与入口。',
          ],
          [
            'Confirm accessible spaces and the interface separately; document counts do not establish configuration.',
            '分别确认可访问空间和界面，不用文档数量判断是否已配置。',
          ],
        ],
      },
    ],
  },
  'app-plugin-mail': {
    configurations: [
      {
        title: ['Mailbox service configuration', '邮箱服务配置'],
        fields: [
          [
            'Service instances, types and enabled states',
            '服务实例、类型与启用状态',
          ],
          ['Sync frequency and batch size', '同步频率与每批数量'],
          ['Sync and send job configuration', '同步与发送任务配置'],
        ],
      },
    ],
    evidence: [
      {
        title: ['Connected mailbox accounts', '已连接的邮箱账号'],
        description: [
          'Read only accounts visible to the current user; a provider configuration does not prove account authorization.',
          '只读取当前用户有权查看的账号，不能由服务配置推断账号已授权。',
        ],
      },
    ],
    interfaces: [
      {
        title: ['Mailbox account management', '邮箱账号管理界面'],
        names: ['mailAccounts', 'settingsMailAccounts'],
        knownRoute: false,
      },
      {
        title: ['Mail workspace', '邮件工作台'],
        names: ['mailWorkspace'],
        knownRoute: false,
      },
    ],
    note: [
      'Provider setup, account authorization and the mail workspace are checked separately.',
      '邮箱服务、个人账号授权和邮件工作台分别确认。',
    ],
    actions: [
      {
        title: ['Configure a mailbox provider', '配置邮箱服务'],
        description: [
          'Support Gmail, Microsoft 365 or company mailboxes.',
          '连接 Gmail、Microsoft 365 或企业邮箱。',
        ],
        prompt: [
          'Configure [Microsoft 365] so users can connect their mailboxes. Preserve existing accounts and tell me which details are needed.',
          '帮我配置【Microsoft 365】邮箱服务，让用户可以连接自己的邮箱。保留已有账号，告诉我需要提供哪些信息。',
        ],
        steps: [
          [
            'Inspect mail.providers names, types and enabled states; preserve names associated with accounts.',
            '检查 mail.providers 的实例名称、类型和启用状态，保留已有账号关联的实例名。',
          ],
          [
            'Configure the provider, callbacks and mail.jobs, supplying credentials through secure configuration.',
            '配置所选服务、回调和 mail.jobs，凭据由安全配置提供。',
          ],
          [
            'Connect accounts through user authorization; a notification email channel does not authorize a mailbox.',
            '通过用户授权流程连接账号；配置通知邮件渠道不能代替邮箱账号授权。',
          ],
        ],
      },
      {
        title: [
          'Add account management and a mail workspace',
          '添加账号管理与邮件工作台',
        ],
        description: [
          'Provide account connection, reading, reply and compose entries.',
          '提供连接账号、阅读、回复和发送邮件的入口。',
        ],
        prompt: [
          'Add mailbox account management and a mail workspace where users manage their own accounts, read messages and reply or compose.',
          '帮我添加邮箱账号管理和邮件工作台，用户可以管理自己的账号、查看邮件并回复或发送邮件。',
        ],
        steps: [
          [
            'Reuse MailAccountsPage and public mail workspace components.',
            '复用 MailAccountsPage 和现有邮件工作台公共组件。',
          ],
          [
            'Register real pages and entries using existing permissions and the application API client.',
            '注册真实页面和入口，连接现有权限与 API 客户端。',
          ],
          [
            'Check account management and mail entries independently; provider setup alone does not supply an interface.',
            '分别检查账号管理和收发入口；没有界面不能只凭服务配置认定已提供。',
          ],
        ],
      },
      {
        title: ['Adjust automatic synchronization', '调整自动同步'],
        description: [
          'Adjust frequency and background execution.',
          '按业务需要调整频率和后台执行。',
        ],
        prompt: [
          'Change automatic mailbox sync to [every 10 minutes], preserving accounts and messages, and explain when it takes effect.',
          '帮我把邮箱自动同步调整为【每 10 分钟一次】，保留已有账号和邮件，并说明何时生效。',
        ],
        steps: [
          [
            'Inspect effective mail.automaticSyncIntervalMs, syncBatchSize and mail.jobs values.',
            '核对 mail.automaticSyncIntervalMs、syncBatchSize 和 mail.jobs 的生效值。',
          ],
          [
            'Adjust sync and job settings within provider limits.',
            '结合服务商限制调整同步参数和任务配置。',
          ],
          [
            'After applying configuration, check sync status; send acceptance does not prove recipient delivery.',
            '应用配置后检查同步状态，不把服务商接受发送当作收件人已收到。',
          ],
        ],
      },
    ],
  },
  'app-plugin-notification': {
    configurations: [
      {
        title: ['Notification configuration', '通知配置'],
        fields: [
          ['Configured channels and enabled states', '已配置渠道与启停状态'],
          ['Delivery job configuration', '投递任务配置'],
          ['Retry attempts and interval', '重试次数与间隔'],
        ],
      },
    ],
    interfaces: [
      {
        title: ['Notification log interface', '通知记录界面'],
        names: ['notificationLogs', 'settingsNotificationLogs'],
        knownRoute: false,
      },
      {
        title: ['Notification template directory', '通知模板目录'],
        names: ['notificationTemplates'],
        knownRoute: true,
      },
    ],
    actions: [
      {
        title: ['Adjust delivery and retries', '调整投递与重试'],
        description: [
          'Choose job configuration and retry behavior.',
          '选择任务配置，调整失败后的重试方式。',
        ],
        prompt: [
          'Adjust background delivery and retries for [business notifications], preserve existing channels and explain how possible duplicate delivery is handled.',
          '帮我调整【业务通知】的后台投递和失败重试配置，保留现有渠道，并说明可能重复投递时如何处理。',
        ],
        steps: [
          [
            'Inspect notification.jobs, notification.retry and enabled channels.',
            '核对 notification.jobs、notification.retry 和实际启用的 channels。',
          ],
          [
            'Adjust configuration for the chosen jobs implementation, separating logical sends from delivery retries.',
            '依据所选后台任务实现调整配置，区分一次逻辑发送和投递重试。',
          ],
          [
            'Inspect delivery records; an unknown outcome may already have reached its recipient.',
            '检查投递记录；未知结果可能已到达收件人，不能直接重复发送。',
          ],
        ],
      },
      {
        title: ['Add a business notification', '添加业务通知'],
        description: [
          'Choose the trigger, recipients and an existing channel.',
          '确定触发时机、接收人和已有渠道。',
        ],
        prompt: [
          'When [a purchase request is approved], notify [the requester] through [the inbox], link to the request and provide a template preview.',
          '当【采购申请通过审批】时，通过【站内信】通知【申请人】，消息能打开对应申请，并提供这个通知的模板预览。',
        ],
        steps: [
          [
            'Confirm the trigger, recipients and configured channel, then use the notification service.',
            '确认业务触发点、收件人和已配置渠道，使用通知服务发送。',
          ],
          [
            'Register the real template renderer and synthetic examples in the template directory.',
            '登记真实模板渲染器和合成示例，复用通知模板目录。',
          ],
          [
            'Template previews neither read real business records nor send notifications.',
            '模板预览不读取真实业务记录，也不执行发送。',
          ],
        ],
      },
      {
        title: ['Add notification management', '添加通知管理界面'],
        description: [
          'Browse delivery records and registered templates.',
          '查看投递记录与已登记的业务模板。',
        ],
        prompt: [
          'Add notification management where [administrators] can inspect delivery records and template previews with existing access controls.',
          '帮我添加通知管理入口，让【管理员】查看投递记录和业务模板预览，沿用现有访问权限。',
        ],
        steps: [
          [
            'Reuse public log and template APIs with their own access checks.',
            '复用通知日志和模板目录的公开接口，保持各自的权限检查。',
          ],
          [
            'Provide logs and the template directory separately; channels do not enumerate templates.',
            '分别提供记录界面和模板目录，不把渠道清单当成模板清单。',
          ],
          [
            'Register pages and entries without treating their presence as proof of delivery.',
            '注册页面与入口，不因页面存在就宣称通知已送达。',
          ],
        ],
      },
    ],
  },
  'app-plugin-notification-in-app': {
    configurations: [
      {
        title: ['Inbox channel configuration', '站内信渠道配置'],
        fields: [['Channel names and enabled states', '渠道名称与启用状态']],
      },
    ],
    interfaces: [
      {
        title: ['Personal inbox interface', '个人收件箱界面'],
        names: ['inbox'],
        knownRoute: true,
        paths: ['/inbox'],
      },
    ],
    note: [
      'Channels and the inbox interface are checked separately. A channel alone does not provide a place to read messages.',
      '渠道配置和收件箱界面分别判断。没有收件箱入口，用户仍无法在应用中查看站内信。',
    ],
    actions: [
      {
        title: ['Configure an inbox channel', '配置站内信渠道'],
        description: [
          'Deliver business notifications inside the application.',
          '为业务通知提供应用内的投递方式。',
        ],
        prompt: [
          'Add an [in-app] channel for [task assignment notifications], preserving existing channels.',
          '帮我添加【站内信】通知渠道，用于发送【任务分派提醒】，保留已有渠道。',
        ],
        steps: [
          [
            'Inspect named notification.channels entries with type in-app and the inbox plugin.',
            '检查 notification.channels 中 type 为 in-app 的命名配置及站内信插件。',
          ],
          [
            'Reuse a suitable channel or add a distinctly named one without replacing other configuration.',
            '复用已有适用渠道，或新增独立名称的渠道，不覆盖其他配置。',
          ],
          [
            'Channel configuration does not create an inbox page; integrate business sends through the notification module.',
            '渠道配置不自动创建收件箱界面；业务发送另按通知模块接入。',
          ],
        ],
      },
      {
        title: ['Add a personal inbox', '添加个人收件箱'],
        description: [
          'Provide messages, unread reminders and business links.',
          '提供消息列表、未读提醒和业务跳转。',
        ],
        prompt: [
          'Add a personal inbox under [the account menu] with unread reminders. Users can read only their own messages and open related business records.',
          '帮我添加个人收件箱，在【账号菜单】提供入口和未读提醒。用户只能查看自己的消息，并能打开相关业务记录。',
        ],
        steps: [
          [
            'Reuse NotificationInAppProvider and NotificationInAppInbox with the host API client.',
            '复用 NotificationInAppProvider 与 NotificationInAppInbox，沿用宿主 API 客户端。',
          ],
          [
            'Provide an authenticated route and entry while retaining server-side user isolation.',
            '提供登录后的真实路由和入口，保留服务端按用户隔离。',
          ],
          [
            'Realtime events only trigger refetches; HTTP responses own message content and read state.',
            '实时事件只触发重新读取，消息内容和已读状态以接口为准。',
          ],
        ],
      },
    ],
  },
  'app-plugin-notification-providers': {
    configurations: [
      {
        title: ['Built-in notification channels', '内置通知渠道'],
        fields: [
          ['Channel count, names and types', '渠道数量、名称与类型'],
          ['Enabled and disabled states', '启用与停用状态'],
          ['Mailers referenced by email channels', '邮件渠道引用的发信服务'],
        ],
      },
    ],
    actions: [
      {
        title: ['Add an email channel', '添加邮件渠道'],
        description: [
          'Prefer an existing application mailer.',
          '优先复用已有的应用发信服务。',
        ],
        prompt: [
          'Add an email notification channel using the [system] mailer for [order processing results].',
          '帮我添加业务通知邮件渠道，复用【system】发信服务，用于发送【订单处理结果】。',
        ],
        steps: [
          [
            'Inspect existing mailers and notification.channels.',
            '检查 mailers 及 notification.channels 的现有配置。',
          ],
          [
            'Prefer type: email referencing the selected mailer; preserve existing inline smtp/resend configurations as appropriate.',
            '优先添加 type: email 并引用所选 mailer；已有 smtp/resend 内联配置按其实际方式保留。',
          ],
          [
            'Apply valid configuration; mailbox account access belongs to Mail, not this channel.',
            '配置通过后应用变更；邮件账号收发属于 Mail，不由该渠道提供。',
          ],
        ],
      },
      {
        title: ['Add a Feishu or DingTalk channel', '添加飞书或钉钉渠道'],
        description: [
          'Send notifications to the team collaboration tool.',
          '向团队使用的协作工具发送通知。',
        ],
        prompt: [
          'Add a [Feishu] channel for [system incident alerts] and tell me which connection details are needed.',
          '帮我添加【飞书】通知渠道，用于【系统异常提醒】。告诉我需要提供哪些连接信息。',
        ],
        steps: [
          [
            'Choose feishu-webhook or dingtalk-webhook and a distinct channel name.',
            '选择 feishu-webhook 或 dingtalk-webhook，并确认独立渠道名称。',
          ],
          [
            'Supply webhook and signing details securely; omit full URLs and secrets from the overview.',
            '通过安全配置提供 Webhook 与签名信息，概览不显示完整地址和密钥。',
          ],
          [
            'Register the built-in channel type and configure an instance; an installed type is not a configured instance.',
            '注册内置渠道类型并配置实例；类型已安装不代表该实例已配置。',
          ],
        ],
      },
      {
        title: ['Adjust an existing channel', '调整现有渠道'],
        description: [
          'Change the mailer or enabled state.',
          '更换发信服务或调整渠道启停。',
        ],
        prompt: [
          'Change [order notifications] to use [the new mailer], preserving other channels and delivery history.',
          '帮我将【订单通知】渠道调整为使用【新的发信服务】，保留其他渠道和已有投递记录。',
        ],
        steps: [
          [
            'Identify the channel name used by the business and its notification.channels entry.',
            '确认业务使用的渠道名及对应 notification.channels 配置。',
          ],
          [
            'Change its reference or enabled state; a disabled channel is still configured.',
            '修改该渠道的引用或 enabled 状态；停用仍属于已存在的配置。',
          ],
          [
            'Explain how changes take effect; configuration changes do not recall submitted notifications.',
            '说明变更生效方式，渠道调整不撤回已提交的通知。',
          ],
        ],
      },
    ],
  },
  'app-plugin-scheduler': {
    configurations: [
      {
        title: ['Scheduled task execution', '定时任务执行配置'],
        fields: [['Selected jobs configuration', '选用的后台任务配置']],
      },
    ],
    evidence: [
      {
        title: ['Defined schedules', '已定义的定时任务'],
        description: [
          'Read schedules, timezones and enabled states from the authorized task directory.',
          '任务计划、时区与启停状态需从有权限的任务目录读取。',
        ],
      },
    ],
    interfaces: [
      {
        title: ['Scheduled task management', '定时任务管理界面'],
        names: ['schedulerSchedules', 'settingsSchedules'],
        knownRoute: false,
      },
    ],
    actions: [
      {
        title: ['Adjust schedule execution', '调整执行配置'],
        description: [
          'Choose how scheduled tasks run in the background.',
          '选择定时任务使用的后台执行方式。',
        ],
        prompt: [
          'Make scheduled tasks use [a dedicated jobs configuration], preserving existing schedules.',
          '帮我让定时任务使用【独立的后台任务配置】，保留已有任务计划。',
        ],
        steps: [
          [
            'Read scheduler.jobs; when omitted, resolve the jobs default selection.',
            '读取 scheduler.jobs，省略时按 jobs 的默认选择确认实际配置。',
          ],
          [
            'Configure the jobs implementation before changing the scheduler.jobs reference.',
            '先配置对应 jobs 实现，再调整 scheduler.jobs 引用。',
          ],
          [
            'Check target types and the execution chain; triggering does not prove business completion.',
            '检查目标类型和执行链，定时触发不等于业务已经完成。',
          ],
        ],
      },
      {
        title: ['Add a scheduled business task', '添加定时业务任务'],
        description: [
          'Specify the work, time and timezone.',
          '明确执行内容、时间和时区。',
        ],
        prompt: [
          'Add a task running [daily at 09:00 Asia/Shanghai] to summarize [yesterday’s orders] and notify [operations], with enable/disable controls and execution history.',
          '帮我添加【每天北京时间上午 9 点】执行的任务，汇总【昨日订单】并通知【运营负责人】，在管理界面中提供启停和执行记录。',
        ],
        steps: [
          [
            'Declare a stable schedule key, rule, timezone and execution target in source.',
            '在源码中声明稳定的任务标识、计划、时区及执行目标。',
          ],
          [
            'Register the target and synchronize declarations through the application workflow; there is no generic Cron-definition editor API.',
            '注册目标并按应用流程同步任务声明；没有通用 API 用于直接创建或编辑 Cron 定义。',
          ],
          [
            'Reuse schedule query and enable/disable APIs and address duplicate business effects.',
            '复用任务查询和启停接口，业务操作按自身要求避免重复执行。',
          ],
        ],
      },
      {
        title: ['Add scheduled task management', '添加任务管理界面'],
        description: [
          'Let administrators inspect schedules and each execution.',
          '让管理员查看任务计划和每次执行结果。',
        ],
        prompt: [
          'Add scheduled task management for [administrators] to view schedules, enable or disable tasks and track results.',
          '帮我添加定时任务管理界面，供【管理员】查看计划、启停任务和跟踪执行结果。',
        ],
        steps: [
          [
            'Reuse public Scheduler APIs and page:scheduler.schedules/access.',
            '复用 Scheduler 公开接口并遵守 page:scheduler.schedules/access。',
          ],
          [
            'Provide list and detail entries separating rules, enabled state and execution records.',
            '提供列表和详情入口，分别显示计划、启停与执行记录。',
          ],
          [
            'Do not treat a jobs example page as a production schedule manager.',
            '不把 jobs 的示例页面直接当成生产任务管理器。',
          ],
        ],
      },
    ],
  },
  'app-plugin-users': {
    configurations: [
      {
        title: [
          'Invitation and assignment configuration',
          '邀请与权限分配配置',
        ],
        fields: [
          ['Invitation email sender', '邀请邮件发信服务'],
          ['Permission assignment configuration', '权限分配方式'],
        ],
      },
    ],
    interfaces: [
      {
        title: ['User management interface', '用户管理界面'],
        names: ['settingsUsers'],
        knownRoute: true,
      },
      {
        title: ['Member invitation interface', '邀请成员界面'],
        names: ['settingsInvitations', 'userInvitations'],
        knownRoute: false,
        description: [
          'Invitation controls may be embedded in user management and need separate confirmation.',
          '邀请入口可能嵌在用户管理中，需单独确认。',
        ],
      },
    ],
    actions: [
      {
        title: ['Configure invitation email', '配置邀请邮件'],
        description: [
          'Send member invitations with an existing mailer.',
          '复用现有发信服务发送成员邀请。',
        ],
        prompt: [
          'Configure member invitation email using the existing [system] mailer.',
          '帮我配置成员邀请邮件，使用应用已有的【system】发信服务。',
        ],
        steps: [
          [
            'Inspect users.invitations.mailer and mailers; handle legacy emailChannel according to existing configuration.',
            '先核对 users.invitations.mailer 与 mailers；兼容 emailChannel 按现有配置处理。',
          ],
          [
            'Select and apply the mailer through normal configuration; invitations alone do not require Mail.',
            '选择发信服务并按正常配置流程应用，无需仅为邀请而安装邮箱插件。',
          ],
          [
            'Do not expose invitation tokens, links or initial administrator passwords in the overview.',
            '不在概览展示邀请令牌、链接或初始管理员密码。',
          ],
        ],
      },
      {
        title: ['Add user management', '添加用户管理界面'],
        description: [
          'Manage account states and assign existing permissions.',
          '管理账号状态并分配已有权限。',
        ],
        prompt: [
          'Add user management for [application administrators] to find users, change account status and assign existing permissions.',
          '帮我为【应用管理员】添加用户管理界面，可以查找用户、调整账号状态和分配现有权限。',
        ],
        steps: [
          [
            'Reuse public Users APIs and the application’s existing permission scopes.',
            '复用 Users 公开接口和应用已有权限范围。',
          ],
          [
            'Provide a real management route and entry, retaining operation and target-account checks.',
            '提供真实管理路由和入口，保留各项操作及目标账号的权限检查。',
          ],
          [
            'users.initialAdmin is for first initialization, not updating an existing administrator.',
            'users.initialAdmin 只用于首次初始化，不能用它修改现有管理员。',
          ],
        ],
      },
      {
        title: ['Add member invitations', '添加邀请成员入口'],
        description: [
          'Let authorized users invite members.',
          '让有权限的人员发起邀请。',
        ],
        prompt: [
          'Add [Invite members] to user management so administrators can choose existing permissions and invite new members.',
          '帮我在用户管理中添加【邀请成员】入口，让管理员选择现有权限后邀请新成员。',
        ],
        steps: [
          [
            'Reuse invitation capabilities and confirm invitation and assignment permissions.',
            '复用用户邀请能力，确认邀请和权限分配权限。',
          ],
          [
            'Add controls to user management; a token-based invitation acceptance route is not a management entry.',
            '在现有用户界面加入入口，不把接收邀请的 token 路由当成管理入口。',
          ],
          [
            'Preserve invitation validity and account creation rules without automatically changing existing users’ roles.',
            '保留邀请链接有效性和账号创建规则，不自动修改既有用户角色。',
          ],
        ],
      },
    ],
  },
  jobs: {
    configurations: [
      {
        title: ['Background job configuration', '后台任务配置'],
        fields: [
          ['Default and available configurations', '默认配置与可用配置'],
          ['Adapter and namespace', '执行方式与命名空间'],
          ['Concurrency and attempts', '并发数与尝试次数'],
        ],
      },
    ],
    note: [
      'Business features can submit jobs without a management page. Configuration counts are not job counts.',
      '后台任务可以直接由业务调用，不要求单独的管理界面。配置项数量不代表任务数量。',
    ],
    actions: [
      {
        title: ['Adjust concurrency and retries', '调整任务并发与重试'],
        description: [
          'Tune execution for task duration and external service limits.',
          '按任务耗时和外部服务限制调整执行方式。',
        ],
        prompt: [
          'Set [report generation] concurrency to [2] and allow up to [3] attempts without affecting other jobs.',
          '帮我把【报表生成】的任务并发设为【2】，失败最多尝试【3】次，避免影响其他任务。',
        ],
        steps: [
          [
            'Identify the named jobs configuration and adapter used by the feature.',
            '确认业务使用的 jobs 命名配置及其适配器。',
          ],
          [
            'Change concurrency and attempts only for that configuration; confirm operations can be retried safely.',
            '只调整对应配置的 concurrency 和 attempts；确认业务操作能够安全重试。',
          ],
          [
            'Apply changes through the application configuration lifecycle; distinguish total attempts from additional retries.',
            '按应用的配置加载方式应用变更，区分总尝试次数和额外重试次数。',
          ],
        ],
      },
      {
        title: ['Configure a separate job executor', '为业务单独配置任务执行'],
        description: [
          'Give expensive tasks their own execution configuration.',
          '让耗时任务有独立的执行配置。',
        ],
        prompt: [
          'Configure a separate background job executor for [bulk exports], preserving the current default.',
          '帮我为【批量导出】配置独立的后台任务执行方式，保留现有任务的默认配置。',
        ],
        steps: [
          [
            'Add a named jobs configuration using memory or another available adapter.',
            '在 jobs 下新增命名配置，按需选择 memory 或已提供的其他适配器。',
          ],
          [
            'Have the feature select the new configuration explicitly without unnecessarily changing jobs.default.',
            '让该业务明确选择新配置，不随意修改 jobs.default。',
          ],
          [
            'Shared execution across instances requires a shared adapter; local state files do not replace distributed job storage.',
            '多实例共享执行需要相应共享适配器；本地状态文件不能替代分布式任务存储。',
          ],
        ],
      },
    ],
  },
  queue: {
    configurations: [
      {
        title: ['Queue configuration', '队列配置'],
        fields: [
          ['Default and available configurations', '默认配置与可用配置'],
          ['Adapter and namespace', '适配器与命名空间'],
          ['Concurrency and rate limits', '并发与速率限制'],
          ['Retry and job retention policies', '重试与任务保留策略'],
        ],
      },
    ],
    note: [
      'Configuration instances host business queues; their count is not the queue count. Business features can use queues without management pages.',
      '配置实例用于承载业务队列，不等于实际队列数量。队列可以由业务直接使用，无需管理界面。',
    ],
    actions: [
      {
        title: ['Adjust queue processing speed', '调整队列处理速度'],
        description: [
          'Control parallel processing and request rates.',
          '控制同时处理的数量和调用频率。',
        ],
        prompt: [
          'Tune the [order synchronization] queue concurrency and calls per minute to fit [the external API limits].',
          '帮我调整【订单同步】队列，限制同时处理数量和每分钟调用次数，适应【外部系统的接口限额】。',
        ],
        steps: [
          [
            'Locate the named queue configuration and runtime overrides on the business queue.',
            '定位 queue 命名配置以及业务队列上的运行时覆盖设置。',
          ],
          [
            'Adjust supported concurrency, rate and retry options while preserving other queues’ policies.',
            '按适配器支持的选项调整并发、速率与重试；保留其他队列的策略。',
          ],
          [
            'Confirm failed and completed job retention requirements to avoid unbounded accumulation.',
            '确认失败任务和完成任务的保留需求，避免无限积累。',
          ],
        ],
      },
      {
        title: ['Configure a shared queue', '配置多实例共享队列'],
        description: [
          'Let multiple application instances process queued work.',
          '让多个应用实例共同处理排队任务。',
        ],
        prompt: [
          'Make the [order synchronization] queue work across application instances, preserving job formats and retry rules where possible.',
          '帮我让【订单同步】队列支持多个应用实例共同处理，优先保留现有的任务格式和重试规则。',
        ],
        steps: [
          [
            'Check the current adapter first; inMemory is process-local.',
            '先确认当前适配器；inMemory 是进程内队列。',
          ],
          [
            'Install and configure the Redis queue extension if needed, with consistent namespace and connection settings.',
            '按需安装并配置 Redis 队列扩展，使用一致的命名空间和连接配置。',
          ],
          [
            'Define how in-flight jobs will be handled before switching the configuration selected by the feature.',
            '明确迁移时在途任务的处理方式，再切换业务选用的配置。',
          ],
        ],
      },
    ],
  },
  lifecycle: {
    evidence: [
      {
        title: ['Defined business processes', '已定义的业务流程'],
        description: [
          'Inspect record states, available actions and follow-up effects; the current process catalog is not available yet.',
          '查看业务记录的状态、可执行操作和处理后动作；当前流程目录尚待获取。',
        ],
      },
      {
        title: ['Process parameters', '流程参数'],
        description: [
          'Parameters may come from code, a database or a custom provider and must be inspected per process.',
          '参数可能来自代码、数据库或自定义提供方，需要按具体流程确认。',
        ],
      },
    ],
    note: [
      'Business processes have no universal config.yml section and do not automatically provide a designer. Actions usually live on their business pages.',
      '业务流程没有统一的 config.yml 配置段，也不会自动提供流程设计器。操作入口通常位于对应的业务页面。',
    ],
    actions: [
      {
        title: ['Add a business process', '为业务添加流程'],
        description: [
          'Define states, action conditions and outcomes.',
          '把状态、操作条件和处理结果定义清楚。',
        ],
        prompt: [
          'Add a [Draft, Submitted, Completed, Cancelled] process for [purchase requests], define who may perform each action and provide actions in request details.',
          '帮我为【采购申请】添加【草稿、已提交、已完成、已取消】流程，明确谁能执行各个操作，并在申请详情中提供入口。',
        ],
        steps: [
          [
            'Define states, transitions, conditions and permissions from the business model.',
            '根据业务模型定义状态、转换、条件及操作权限。',
          ],
          [
            'Place follow-up work such as notifications in suitable post-commit effects to avoid executing it before a failed transaction.',
            '将通知等后续处理放在适当的提交后动作中，避免事务失败时提前执行。',
          ],
          [
            'Expose permitted actions in business pages; process definitions are not a generic approval system or designer.',
            '在业务页面提供允许的操作；不要把流程定义等同于通用审批或设计器。',
          ],
        ],
      },
      {
        title: ['Adjust an existing process', '调整已有流程'],
        description: [
          'Extend states, conditions or adjustable business parameters.',
          '补充状态、条件或可调整的业务参数。',
        ],
        prompt: [
          'Update [purchase requests] to require [review] above [5000], and explain the impact on existing records.',
          '帮我调整【采购申请】流程：金额超过【5000】时增加【复核】步骤，并说明对已有单据的影响。',
        ],
        steps: [
          [
            'Locate the existing process definition and parameter source; do not invent a lifecycle YAML section.',
            '定位已有流程定义和参数读取方式，不新增假定的 lifecycle YAML 配置段。',
          ],
          [
            'Define compatibility for existing records before changing states, conditions and UI actions.',
            '明确已有记录如何兼容新状态与条件，再调整定义和界面操作。',
          ],
          [
            'Add parameter management only when the business needs it, using the actual parameter storage mechanism.',
            '仅在业务确有需要时提供参数管理界面，沿用实际参数存储方式。',
          ],
        ],
      },
    ],
  },
  realtime: {
    configurations: [
      {
        title: ['Realtime configuration', '实时更新配置'],
        fields: [
          ['Event adapter', '事件适配器'],
          ['Namespace', '命名空间'],
          ['Connection and subscription limits', '连接与订阅限制'],
        ],
      },
    ],
    note: [
      'Realtime needs no standalone management page. A connected browser does not prove cross-instance event sharing; business data remains authoritative through API queries.',
      '实时更新无需独立管理界面。浏览器连接成功不能证明多个实例已经共享事件；业务数据仍以接口查询结果为准。',
    ],
    actions: [
      {
        title: ['Configure realtime across instances', '配置多实例实时更新'],
        description: [
          'Deliver business updates to users connected to different instances.',
          '让不同应用实例上的用户收到同一业务更新。',
        ],
        prompt: [
          'Share realtime updates across application instances so [task board] changes reach other users promptly.',
          '帮我让多个应用实例之间共享实时更新，让【任务看板】上的变更能及时同步给其他用户。',
        ],
        steps: [
          [
            'Inspect realtime.adapter and namespace; the in-process default cannot distribute across instances.',
            '检查 realtime.adapter 和 namespace；默认进程内方式不能跨实例分发。',
          ],
          [
            'Configure the Redis realtime extension if needed, using consistent connections and namespaces.',
            '按需配置 Redis 实时扩展，统一实例间的连接与命名空间。',
          ],
          [
            'Re-query authorized business data after an update notification; do not treat events as durable data.',
            '业务收到更新通知后重新查询授权数据，不把事件当成持久化数据源。',
          ],
        ],
      },
      {
        title: [
          'Adjust connection and subscription limits',
          '调整连接与订阅限制',
        ],
        description: [
          'Match application size and usage.',
          '匹配应用规模和使用方式。',
        ],
        prompt: [
          'Review realtime connection and subscription limits and suggest adjustments for [expected concurrent users].',
          '帮我检查当前实时更新的连接和订阅限制，按【预计同时在线人数】提出调整方案。',
        ],
        steps: [
          [
            'Read actual realtime.limits and their default resolution rules.',
            '读取实际 realtime.limits 及其默认解析规则。',
          ],
          [
            'Tune limits for per-user connections and subscriptions while retaining authentication and topic access control.',
            '结合每个用户的连接和订阅数量调整限制，保留鉴权与主题访问控制。',
          ],
          [
            'Retain data refetching after reconnection instead of relying on event replay to restore all state.',
            '保留断线后的数据重新获取流程，不依赖事件回放恢复全部状态。',
          ],
        ],
      },
    ],
  },
  'app-plugin-template-print': {
    evidence: [
      {
        title: ['Implemented document generation', '已实现的文档生成'],
        description: [
          'Templates, output formats and rendering methods used by the business need confirmation and are not available yet.',
          '需确认业务使用的模板、输出格式和渲染方式，当前尚未获取。',
        ],
      },
    ],
    interfaces: [
      {
        title: ['Business document generation entry', '业务文档生成入口'],
        names: [],
        knownRoute: false,
        description: [
          'Usually embedded in record details or action menus and cannot be determined from route names alone.',
          '通常嵌在单据详情或操作菜单中，不能仅靠路由名称判断。',
        ],
      },
    ],
    note: [
      'This plugin supplies document generation Skill guidance. Installation does not automatically add a print interface or a universal config.yml section.',
      '此插件提供文档生成的 Skill 指引；安装后不会自动增加打印界面，也没有统一的 config.yml 配置段。',
    ],
    actions: [
      {
        title: ['Add business document generation', '添加业务文档生成'],
        description: [
          'Generate downloadable documents from existing records.',
          '从已有单据生成可下载的文档。',
        ],
        prompt: [
          'Add [Generate quotation] to [sales quotation] details using the supplied template to produce a DOCX with customer details, product lines and totals.',
          '帮我在【销售报价】详情中添加【生成报价单】操作，使用指定模板生成 DOCX，包含客户信息、产品明细和合计。',
        ],
        steps: [
          [
            'Read the plugin’s document generation Skill and map template fields to business data.',
            '先阅读插件的文档生成 Skill，确定模板字段与业务数据映射。',
          ],
          [
            'Implement rendering and download in the application, preserving record read permissions.',
            '在应用中实现渲染与下载，沿用单据的读取权限。',
          ],
          [
            'Place the generation action in the business interface; configure a converter only if PDF is required.',
            '将生成操作放入业务界面；需要 PDF 时再配置相应转换服务。',
          ],
        ],
      },
      {
        title: ['Extend templates or output formats', '补充模板或输出格式'],
        description: [
          'Improve an existing document generation feature.',
          '在已有文档生成基础上完善内容。',
        ],
        prompt: [
          'Add [company letterhead and terms] to the existing [quotation], keeping data permissions. Explain prerequisites before adding PDF output.',
          '帮我给已有的【报价单】增加【公司抬头和条款】，保留原有数据权限；如果需要 PDF，先说明需要增加什么。',
        ],
        steps: [
          [
            'Inspect existing templates, rendering and file storage, reusing the current flow.',
            '确认现有模板、渲染实现与附件存储，复用已有流程。',
          ],
          [
            'Update variables and mappings without treating user input as executable template code.',
            '调整模板变量与数据映射，不把用户输入当作可执行模板代码。',
          ],
          [
            'Add template management only if ongoing maintenance requires it.',
            '仅在确有维护需求时添加模板管理界面。',
          ],
        ],
      },
    ],
  },
  'app-plugin-foundation': {
    interfaces: [
      {
        title: ['Features and extensions interface', '功能与扩展界面'],
        names: ['capabilityGuide'],
        knownRoute: true,
        paths: ['/capabilities'],
      },
    ],
    note: [
      'The catalog describes available features; its item count is not a configured feature count. This plugin has no separate config.yml section.',
      '目录说明应用可用的功能；条目数量不代表已配置数量。该插件没有独立的 config.yml 配置段。',
    ],
    actions: [
      {
        title: ['Add a features and extensions entry', '添加功能与扩展入口'],
        description: [
          'Let administrators find the catalog through system settings.',
          '让应用管理员从系统设置找到功能目录。',
        ],
        prompt: [
          'Add [Features and extensions] to system settings, reusing the existing catalog and access permissions.',
          '帮我在系统设置中添加【功能与扩展】入口，复用已有功能目录，并保持现有访问权限。',
        ],
        steps: [
          [
            'Confirm client Foundation registration and the catalog route.',
            '确认客户端已注册 Foundation 插件及目录路由。',
          ],
          [
            'Provide a system settings entry through application navigation without duplicating plugin detail pages.',
            '通过应用导航提供系统设置入口，不重复实现插件详情页。',
          ],
          [
            'Point the entry to the actual catalog path and preserve application access control.',
            '入口指向实际目录路径，并遵守应用的访问控制。',
          ],
        ],
      },
      {
        title: ['Describe an application feature', '补充应用自己的功能说明'],
        description: [
          'Give custom features clear purpose and configuration guidance.',
          '让自定义功能也有清楚的用途和配置指引。',
        ],
        prompt: [
          'Add a feature description for [contract management], showing actual configuration and entry points with Agent prompts for further improvements.',
          '帮我为应用里的【合同管理】补充功能说明，展示真实配置和使用入口，并给出后续完善的 Agent 提示词。',
        ],
        steps: [
          [
            'Use Foundation’s application-level manifest and detail extension mechanisms.',
            '使用 Foundation 的应用级清单和详情扩展方式。',
          ],
          [
            'Organize purpose, current configuration and Agent actions, marking unknown states honestly.',
            '按用途、当前配置、Agent 添加或完善组织内容，未知状态如实标记。',
          ],
          [
            'Keep application-specific content in the application instead of editing the installed base plugin.',
            '将业务特有内容留在应用内，不直接修改已安装的基础插件。',
          ],
        ],
      },
    ],
  },
};
