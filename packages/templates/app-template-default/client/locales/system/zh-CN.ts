import settings from './settings-zh-CN.js';
import type { SystemResource } from './en-US.js';
import deviceApprovalZhCN from '#extensions/nocobase-device-approval/locales/zh-CN';
import inboxZhCN from '#extensions/nocobase-inbox/locales/zh-CN';

/** The Chinese copy of what the template ships; see `./en-US.ts`. */
const systemZhCN: SystemResource = {
  flowDiagram: {
    controls: '流程图控制',
    fitView: '适应画布',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    escapeHint: '按 Escape 退出',
    leavesTo: '可转到',
    arrivesFrom: '来自',
    otherRoutes: '其他流转',
    minimap: '流程缩略导航',

    configure: '配置',
    overview: '流程缩略导航',
    actualSize: '实际大小',
    states: '状态',
    transitions: '转移',
    configurable: '可配置参数',
    current: '当前',
    visited: '已经过',
    initial: '初始状态',
    final: '终止状态',
    state: '状态',
    zoomOut: '缩小',
    zoomIn: '放大',
    fit: '适应画布',

    empty: '暂无可展示的状态。',
    loading: '正在布局流程图…',
    failed: '无法布局此流程图。',
    nodeHelp: '按 Enter 或空格键选择状态。',
    edgeHelp: '按 Enter 或空格键选择转移。',
  },
  settings,
  'auth.preparingSession': '正在准备登录会话…',
  'auth.connectionFailed': '连接失败',
  'auth.connectionFailedDescription':
    '实时连接暂时无法准备就绪。请重试后进入应用，或退出登录。',

  'auth.passwordResetSuccess': '密码已重置，请用新密码登录。',
  'auth.requestNewResetLink': '重新申请重置链接',

  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalZhCN,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxZhCN,
  // Shared form wording overrides the defaults included by composed blocks.
  formFeedback: {
    field: '此字段的值未通过校验，请检查并修改后重试。',
    invalid: '请检查标记的字段后重试。',
    failed: '保存失败，已保留您的输入，请重试。',
    network: '无法连接，请检查网络后重试。已保留您的输入。',
    denied: '当前权限无法提交此表单。已保留您的输入。',
  },
  // The UI Library component of the header's inbox button.
  'inboxButton.title': '收件箱',
  'inboxButton.pending': '收件箱，{{count}} 项待处理',
  'inboxButton.unread': '收件箱，{{count}} 条未读',
  'inboxButton.pendingHint': '{{count}} 项等你处理，处理后减少。',
  'inboxButton.unreadHint': '{{count}} 条未读，阅读后减少。',
  'auth.welcome': '欢迎回来',
  'auth.loginDescription': '使用用户名或邮箱和密码登录',
  'auth.registerTitle': '创建账户',
  'auth.registerDescription': '创建账户以开始使用',
  'auth.forgotTitle': '忘记密码',
  'auth.forgotDescription': '输入邮箱，如果账户存在，我们将发送重置链接',
  'auth.passwordResetUnavailable': '未开启自助找回，请联系管理员重置密码。',
  'auth.capabilityLoadFailed': '无法检查自助找回是否已开启。',
  'auth.retry': '重试',
  'auth.loading': '加载中',
  'auth.resetDescription': '为账户设置新密码',
  'auth.resetTitle': '重置密码',
  'auth.identifier': '用户名或邮箱',
  'auth.password': '密码',
  'auth.signIn': '登录',
  'auth.signingIn': '正在登录…',
  'auth.hidePassword': '隐藏密码',
  'auth.showPassword': '显示密码',
  'auth.forgotLink': '忘记密码？',
  'auth.noAccount': '还没有账户？',
  'auth.signUp': '注册',
  'auth.createAccount': '创建账户',
  'auth.creatingAccount': '正在创建账户…',
  'auth.name': '姓名',
  'auth.username': '用户名',
  'auth.email': '邮箱',
  'auth.confirmPassword': '确认密码',
  'auth.existingAccount': '已有账户？',
  'auth.passwordMismatch': '两次输入的密码不一致。',
  'auth.resetting': '正在重置…',
  'auth.newPassword': '新密码',
  'auth.confirmNewPassword': '确认新密码',
  'auth.invalidResetLink': '此密码重置链接无效或已过期。',
  'auth.backToSignIn': '返回登录',
  'auth.sendResetLink': '发送重置链接',
  'auth.sending': '正在发送…',
  'auth.resetSent': '如果账户存在，重置链接已发送。',
  'auth.rememberPassword': '记得密码？',
  'auth.methods': '登录方式',
  'auth.or': '或使用以下方式继续',
  'auth.continueWith': '使用 {provider} 继续',
  'auth.about': '关于此应用',
  'auth.platform': 'AI 原生应用平台',
  'auth.marketingTitleFirst': '让 AI 自由构建',
  'auth.marketingTitleSecond': 'NocoBase 保障',
  'auth.marketingTitleThird': '可靠运行',
  'auth.marketingDescription':
    '让 AI 在灵活的前端框架上构建体验，由 NocoBase 保障底层数据、权限与治理',
  'auth.frontend': 'AI 原生前端',
  'auth.frontendDescription': '在灵活的框架上自由构建界面',
  'auth.foundation': 'NocoBase 基础能力',
  'auth.foundationDescription': '可靠的数据、访问控制与治理',
  'auth.marketingFooter': '自由构建，可靠支撑',
  'status.loading': '加载中',
  'status.loadingPage': '正在加载页面',
  'status.denied': '无权访问',
  'status.pageFailed': '无法加载页面',
  'status.retry': '重试',
  'navigation.brandHome': 'NocoBase 首页',
  'navigation.brandApps': 'NocoBase 应用',
  'routeOverlay.close': '关闭',
  'status.deniedDescription': '你没有访问 {{label}} 的权限。',
  'status.routeFailedDescription':
    '无法加载 {{packageName}} 的路由 {{label}}。',
  shell: {
    buildFreely: 'AI 自由构建',
    reliability: '<brand>NocoBase</brand> 保障可靠',
  },
  home: {
    platform: 'NocoBase · AI 原生应用平台',
    title: '说出需求，由 Agent 来构建',
    description:
      '这个应用通过和 Coding Agent 对话来开发。用平常的话说明业务需要什么，它会在这个项目里编写页面、数据模型、接口和业务流程。',
    steps: {
      describe: {
        title: '描述需求',
        description: '说明谁来使用、要记录哪些数据、希望发生什么。',
      },
      build: {
        title: '交给 Agent 构建',
        description: '它会阅读这个项目和内置能力，然后编写代码。',
      },
      review: {
        title: '查看并调整',
        description: '刷新页面试用，有需要再用同样的方式提出修改。',
      },
    },
    example: {
      title: '可以这样提需求',
      text: '帮我做一个采购订单应用。\n\n订单包含编号、采购事项、申请人、金额和审批状态。申请人可以创建订单，只能查看自己的订单；审批人可以查看所有待审批订单，并通过或驳回。\n审批完成后，用站内信通知申请人，点击可以打开对应订单。',
      hint: '粘贴到在这个项目中打开的 Claude Code、Codex、Cursor 或其他 Coding Agent 中即可。',
    },
    capabilitiesTitle: '内置能力',
    capabilitiesDescription:
      'Agent 会直接使用这些能力，不必从零开发。打开任意一项，获取可以修改和复制的提示词。',
    viewPrompts: '查看提示词（{{count}}）',
    prompt: {
      label: '提示词',
      hint: '复制前可以按自己的业务修改提示词。关闭弹窗后，修改不会保留。',
      copy: '复制',
      copiedShort: '已复制',
      copied: '提示词已复制',
      copyFailed: '无法复制，请选中文字后手动复制。',
      reset: '恢复默认',
    },
    capabilities: {
      auth: {
        title: '认证',
        description: '登录、注册、找回密码，以及企业统一身份登录。',
        prompts: {
          disableSignUp: {
            label: '关闭注册',
            text: '这个应用只供公司员工使用，账号由管理员统一创建。\n请关闭自助注册，登录页不再显示注册入口。\n已有员工仍能使用原账号和密码登录，保留忘记密码入口。',
          },
          companySso: {
            label: '企业账号登录',
            text: '请让员工使用公司的统一身份平台登录，采用 OIDC。\n\n保留原有账号密码登录，在登录页增加「企业账号登录」入口。\n点击后进入企业身份平台，登录成功后返回应用首页。\n\n首次登录允许创建应用账号，以身份平台的稳定用户标识识别用户。\n不要根据同名或相同邮箱自动关联已有账号，新账号沿用应用默认权限。\n\n请列出身份平台管理员需要提供的信息，以及需要登记的回调地址。',
          },
          apiKeys: {
            label: '集成密钥',
            text: '在用户菜单中增加「集成密钥」入口，接入应用已有的 API keys 能力。\n员工只能管理自己创建的 Key，创建时填写用途名称和有效天数。\n创建成功后只显示一次完整 Key，并提示立即复制保存。\n列表显示名称、可辨认的片段、状态、有效期和最近使用时间，支持撤销并二次确认。\n不要在列表、日志或详情中显示完整 Key。',
          },
        },
      },
      dataSources: {
        title: '数据源',
        description: '选择应用数据库，接入已有外部数据库中的业务数据。',
        prompts: {
          postgres: {
            label: '切换数据库',
            text: '把应用数据库从 SQLite 切换为 PostgreSQL。\n连接信息从服务端运行配置读取，不写进源码。\n说明需要安装的数据库驱动和需要填写的配置，并提醒我原有数据不会自动迁移。',
          },
          externalDatabase: {
            label: '外部数据库',
            text: '将公司已有的财务数据库作为外部数据源接入，只读取数据，不修改外部表。\n通过供应商编号匹配，在供应商详情增加「结算资料」，展示结算周期、信用额度和结算状态，并标明数据来源。\n供应商联系信息仍从应用数据库读取，结算资料直接从外部数据库读取，不导入应用数据库。\n连接凭据从服务端运行配置读取。',
          },
        },
      },
      authorization: {
        title: '权限',
        description: '控制谁能进入哪些页面、执行哪些操作、查看哪些数据。',
        prompts: {
          jobs: {
            label: '岗位权限',
            text: '请为应用设置「采购申请人」和「订单审批人」两个岗位。\n采购申请人可以进入订单页面，查看本人申请的订单。\n订单审批人可以进入订单页面，查看订单，并批准或驳回待审批订单。\n只有应用管理员可以调整岗位权限和人员分配。\n请接入应用已有的权限能力，让管理员以后可以调整权限和分配人员。',
          },
          dataScopes: {
            label: '数据范围',
            text: '采购申请人只查看自己申请的订单，以订单的申请人字段判断归属。\n订单审批人可以查看所有订单，处理待审批订单。\n管理员可以在权限集中分别调整两个岗位的订单查看范围。',
          },
          restrictions: {
            label: '限制规则',
            text: 'Bob 临时协助核对采购订单，只允许他查看金额不超过 2,000 元的订单。\n为他的「查看订单」操作增加金额上限，保留已有岗位和数据范围。\n限制同时作用于他本人的订单和共享给他的订单。\n管理员可以调整金额或移除规则；移除前说明可见范围可能扩大。',
          },
        },
      },
      workflow: {
        title: '工作流',
        description:
          '让业务单据按阶段推进，处理等待、超时、失败重试和处理记录。',
        prompts: {
          stages: {
            label: '流程阶段',
            text: '为采购订单增加处理流程：待审批→待采购→已到货→已完成。\n审批人可以批准或驳回，驳回必须填写原因，订单退回申请人修改后重新提交。\n采购员下单后进入待采购，确认到货并上传签收单后进入已到货，申请人确认后完成。\n订单详情只提供当前阶段的操作，普通编辑不能直接修改流程阶段。\n在服务端检查阶段和必填信息，多人同时处理时不要覆盖别人已提交的结果。',
          },
          backgroundExport: {
            label: '后台导出',
            text: '增加订单报表页面，将现有订单导出为 CSV。\n提交后进入等待处理，由后台生成，成功后自动完成并提供下载入口。\n显示当前阶段、文件名、导出订单数，以及提交和系统处理的记录。\n生成失败时按规则重试，最终失败保留结果供负责人处理；重复执行不要生成重复的报表文件。\n刷新页面后仍可查看进度与结果，只有获得授权的人员可以导出订单。',
          },
          history: {
            label: '处理记录',
            text: '在订单详情展示当前流程阶段和处理历史。\n每条记录显示操作人、时间、操作名称、前后阶段，以及驳回原因或签收单。\n系统自动执行的动作标明由系统执行。\n刷新页面后仍保留进度和记录，完成后可以回看整个处理过程。',
          },
        },
      },
      scheduler: {
        title: '定时任务',
        description: '按时间自动执行业务处理，查看下次执行时间和执行结果。',
        prompts: {
          reminder: {
            label: '每日提醒',
            text: '为现有订单应用添加“待审批订单提醒”。\n\n每个工作日北京时间上午 9 点，查找仍待审批的订单，按审批人汇总，并向对应审批人发送一条站内通知。\n通知显示待审批订单数量，点击后打开待审批订单列表；没有待审批订单时不发送。\n管理员可以查看任务的运行时间和执行记录，并暂停或恢复提醒。',
          },
          weeklyReport: {
            label: '每周报表',
            text: '每周一北京时间上午 8 点生成上周的销售汇总报表，并通知销售负责人查看。\n报表包含销售额、订单数量和各区域汇总。管理员可以查看任务及执行记录。',
          },
        },
      },
      notification: {
        title: '通知',
        description: '在业务事件发生时，通过站内信、邮件或群机器人发送消息。',
        prompts: {
          inApp: {
            label: '站内信',
            text: '我要在当前应用中做订单审批，并用站内信通知申请人审批结果。\n\n订单包含编号、名称、申请人、金额和审批状态。\n申请人可以查看自己的订单，审批人可以查看待审批订单并通过或驳回。如果已有订单和审批功能，请直接复用。\n\n审批完成后，只给该订单的申请人发送一条站内信。\n消息标题说明通过或驳回，正文包含订单编号、名称和审批结果。\n点击消息可以打开对应订单详情。\n待审批时不发送，同一次审批结果只通知一次。\n通知发送失败不影响已保存的审批结果。',
          },
          email: {
            label: '邮件通知',
            text: '请在现有订单审批通知中增加邮件，使用应用已配置的邮件渠道。\n\n订单审批通过或驳回后，向申请人账号中的邮箱发送审批结果。\n主题包含订单编号，正文包含订单名称和审批结果。\n保留已有站内信；申请人未填写邮箱时，只发送站内信。\n邮件发送失败不影响审批结果和站内信。',
          },
        },
      },
      mail: {
        title: '邮件',
        description: '关联个人邮箱，阅读、回复和发送业务邮件。',
        prompts: {
          providers: {
            label: '配置邮箱服务商',
            text: '为应用配置 mailbox.org 邮箱接入，写入服务端配置的 mail.providers：\n- IMAP 收信服务器：imap.mailbox.org，端口 993，使用 SSL/TLS。\n- SMTP 发信服务器：smtp.mailbox.org，端口 465，使用 SSL/TLS。\n用户在邮箱账号页填写自己的邮箱地址、用户名和密码，并选择首次同步的起始日期；邮箱密码不写进配置或源码。',
          },
          mailCenter: {
            label: '邮件中心',
            text: '应用已内置邮件能力，请直接复用，不要重新开发或另装插件。\n在导航中增加「邮件中心」和「邮箱账号」两个页面，分别使用邮件能力提供的邮件工作台和邮箱账号页面。\n用户可以关联自己的邮箱，同步来信，阅读正文和附件，并回复邮件；回复时保留原邮件主题和上下文，收件人使用原发件人。\n每位用户只处理自己关联的邮箱。',
          },
          correspondence: {
            label: '客户往来邮件',
            text: '在客户详情页添加往来邮件区，复用应用内置的邮件阅读和编辑组件。\n展示发件人或收件人与当前客户联系人邮箱匹配的邮件。销售人员可以在这里阅读正文、查看附件和回复，使用自己关联的邮箱。',
          },
        },
      },
      file: {
        title: '文件',
        description: '上传文件并关联业务记录，支持预览和下载。',
        prompts: {
          attachments: {
            label: '订单附件',
            text: '给现有订单管理应用增加采购附件功能。\n\n在订单详情中添加附件区域，每个订单可以上传多个文件，支持 PDF、图片和 DOCX。\n显示附件的文件名和大小，支持预览、下载和移除。\n上传后点击保存，将附件关联到当前订单；重新打开订单时仍能看到这些附件。\n有权查看订单的人员可以查看和下载附件，申请人和审批人员可以添加或移除附件。\n移除附件只解除它与当前订单的关联，保留文件。',
          },
          avatar: {
            label: '员工头像',
            text: '给员工增加头像，每名员工最多一张。\n支持上传和更换头像，在员工列表和详情中显示。\n更换后使用新头像，刷新页面后仍能正常显示。',
          },
        },
      },
      i18n: {
        title: '多语言',
        description: '切换界面语言，添加新语言，设置默认语言。',
        prompts: {
          addLanguage: {
            label: '新增语言',
            text: '为应用增加西班牙语，界面和服务端提示都使用对应的翻译，并在语言菜单中提供西班牙语选项。',
          },
          defaultLanguage: {
            label: '默认语言',
            text: '把应用的默认语言设为简体中文，没有选过语言的用户第一次打开时看到中文。语言菜单中继续保留英文。',
          },
        },
      },
      theme: {
        title: '主题',
        description: '调整配色、字体和布局密度，切换浅色和深色模式。',
        prompts: {
          changeTheme: {
            label: '修改主题',
            text: '修改「紧凑」主题：将主色改为蓝色，略微增大圆角。保留当前字体、字号和紧凑间距。',
          },
          newTheme: {
            label: '新增主题',
            text: '新建一个“森林”主题，以绿色为主色，背景柔和，圆角适中，阴影轻一些。',
          },
        },
      },
    },
  },

  appearance: {
    title: '外观',
    mode: '颜色模式',
    preset: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    themes: { default: '宽松', compact: '紧凑' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: '关闭',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    language: '语言',
  },
  notices: {
    serverLocaleFallback: '服务端不支持该语言，服务端内容已回落为英文。',
    languageChangeFailed: '未能完成语言切换，请重试。',
  },
  account: {
    signOutFailed: '退出登录失败，请重试。',
    openMenu: '打开账户菜单',
    fallback: '账户',
    signOut: '退出登录',
    signingOut: '正在退出…',
  },
  navigation: {
    home: '首页',
    open: '打开导航',
    close: '关闭导航',
    expand: '展开导航',
    collapse: '收起导航',
    toggle: '展开或收起导航',
    label: '应用导航',
    description: '前往本应用的页面。',
    breadcrumb: '面包屑',
    breadcrumbMore: '显示中间层级',
    back: '返回',
  },
  dataTable: {
    noResults: '暂无数据。',
    sortAscending: '升序',
    sortDescending: '降序',
    hideColumn: '隐藏',
    view: '视图',
    toggleColumns: '显示列',
    selectedCount: '已选择 {{selected}} / {{total}} 行。',
    rowsPerPage: '每页行数',
    pageOf: '第 {{page}} 页，共 {{pageCount}} 页',
    firstPage: '第一页',
    previousPage: '上一页',
    nextPage: '下一页',
    lastPage: '最后一页',
  },
  datePicker: {
    placeholder: '选择日期',
    rangePlaceholder: '选择日期范围',
  },
};

export default systemZhCN;
