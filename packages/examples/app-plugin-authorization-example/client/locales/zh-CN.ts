export default {
  practice: {
    intro:
      '请使用下方示例账号，不要使用管理员验证权限；管理员不受这些限制。以下是销售协作中的独立练习，并非从报价到订单的完整审批流程。每组练习均从初始业务记录状态开始。',
    read: {
      title: '助理查阅项目资料',
      steps:
        '以 sales_assistant 登录：项目中可见 project-1、project-2、project-3，但不可编辑；报价和订单仍仅限本人负责的项目。',
      reason:
        '项目共享仅开放查看，不授予编辑，也不会连带开放关联记录。涉密 project-4 始终被限制规则排除。',
    },
    scopes: {
      title: '工程师编制与提交报价',
      steps:
        '以 sales_engineer 登录：修改并提交本人编制的 quote-2；quote-5 由同事编制，只能参考、不能改价或提交；quote-6 可继续编制，但所属项目不在负责区域，不能提交。',
      reason:
        '非保密报价作为内部参考资料可跨区域查阅。编制人负责内容，区域职责决定能否提交；查看不会自动授予修改权限。已有订单引用独立的已确认报价，提交练习报价不会自动创建订单。',
    },
    handover: {
      title: '工程师接手交接的报价',
      steps:
        '南区项目负责人把 quote-7 交给北区工程师 sales_proposal。以 sales_proposal 登录，修改该报价后提交。管理员重置业务记录，并在“投标报价交接”共享规则中撤回对 sales_proposal 的分配；再次登录后，该账号不能再修改或提交这份报价。',
      reason:
        '交接授权仅覆盖这份报价的修改、提交及提交所需的项目访问，不会把整个南区交出去。工程师角色提供操作能力，共享规则指定可协作的记录。进阶验证可分别撤回项目或报价范围，确认任一范围缺失都会阻止提交。',
    },
    delivery: {
      title: '交付专员安排履约',
      steps:
        '以 sales_delivery 登录，打开 order-2，分配承运商、维护检查项并填写交付单号。确认交付后，订单关系和交付状态均不可再次修改。重做前请重置业务记录。',
      reason:
        '交付人员只进入订单页面，不因订单关联了报价和项目就获得这些页面的访问权。',
    },
  },
  reset: {
    action: '重置练习记录',
    cancel: '取消',
    confirm:
      '将恢复所有示例账号共用的初始项目、报价和订单，这些记录上的修改将被覆盖。确认重置？',
    description:
      '重复练习前，管理员可在此重置业务记录。账号和权限配置保持不变；练习中修改的授权配置需手动恢复。',
    done: '练习记录已恢复，请刷新已打开的业务列表。',
  },

  access: {
    title: '当前角色',
    direct: '直接授权',
    coverage: '每个示例账号的岗位职责都直接授予。',
  },
  rules: {
    public: '排除保密项目',
    delivery: '按区域共享待交付订单',
    handover: '投标报价交接',
    projects: '共享示例项目',
  },
  accountMenus: {
    assistant: '项目、报价、订单（只读）',
    engineer: '参考非保密报价；修改本人编制的报价，提交限负责区域',
    manager: '管理本人负责的项目；报价、订单只读',
    delivery: '仅订单；可确认本区域订单交付',
    proposal: '修改并提交交接的 quote-7',
    coordinator: '管理负责区域以外的 project-8',
  },
  relations: {
    access: {
      notGranted: '只读：未授予安排交付权限。',
      outsideScope: '只读：订单不在你的交付范围内。',
      notReady: '已交付订单不可修改。',
    },
    title: '订单关系',
    description:
      '分配有效的承运商、维护检查项和协作承运商。切换交付账号与只读账号，比较操作权限。',
    order: '订单',
    carrier: '承运商',
    unassigned: '未分配',
    assign: '分配承运商',
    disconnect: '解除分配',
    checks: '交付检查项',
    done: '已完成',
    pending: '待完成',
    toggle: '切换完成状态',
    delete: '删除检查项',
    checkTitle: '检查项名称',
    add: '添加检查项',
    collaborators: '协作承运商',
    note: '协作备注',
    addProposal: '添加所选承运商',
    replace: '替换为所选承运商',
    clear: '移除所有协作承运商',
    unavailable: '无权访问这些关系。',
    loading: '正在加载关系…',
  },
  sales: {
    manageRelations: '安排订单交付',
    saveFirst: '请先保存修改，再提交报价。',
    states: {
      draft: '草稿',
      submitted: '已提交',
      accepted: '已确认',
      ready: '待交付',
      delivered: '已交付',
    },
    errors: {
      session: '登录已失效，请重新登录。',
      input: '请检查金额及必填字段。',
      conflict: '记录状态已变化，请刷新后重试。',
      request: '请求失败，请检查网络后重试。',
    },

    operation: {
      outsideScope: '不在该操作的授权范围内',
      notReady: '仅待交付订单可以确认交付',

      allowed: '满足提交范围',
      notGranted: '只读，未授予该操作权限',
      quoteScope: '不在可提交的报价范围内',
      projectScope: '所属项目不在允许范围内',
      notDraft: '仅草稿报价可以提交',
      invalidAmount: '报价金额必须大于零',
    },
    preparedBy: '报价编制人',
    parentProject: '所属项目',
    sourceQuote: '来源报价',
    relationships: '关联信息',
    relatedQuotes: '查看项目报价',
    relatedOrders: '查看项目订单',
    filtered: '当前筛选',
    clearFilter: '清除筛选',
    noPageAccess: '无页面访问权限',
    descriptions: {
      projects:
        '查看项目，再按项目进入报价或订单。关联列表只展示当前账号有权访问的记录。',
      quotes:
        '一个项目可以有多份报价。提交时分别检查项目范围和报价编制人范围；满足范围后还须符合草稿、金额等业务条件。',
      orders:
        '订单关联来源报价和所属项目。交付账号仅能进入订单页面，关联编号不会额外授予其他菜单或记录权限。',
    },

    delivery: '交付管理',
    orders: '订单',
    editProject: '编辑项目信息',
    editQuote: '编辑报价金额',
    submit: '提交报价',
    submitScopes: {
      projects: '报价所属项目',
      quotes: '允许提交的报价',
    },
    deliver: '确认交付',
    amount: '金额',
    status: '状态',
    deliveryReference: '交付单号',

    group: '销售协作',
    title: '销售权限示例',
    projects: '项目',
    quotes: '报价',
    view: '查看',
    edit: '编辑备注',
    intro:
      '体验助理查阅资料、工程师编制报价、报价交接和交付人员履约时的权限边界。',
    record: '记录',
    notes: '备注',
    save: '保存',
    refresh: '刷新',
    loading: '加载中…',
    empty: '暂无可访问记录',
    readOnly: '只读',
    saved: '已保存',
    scope: {
      prepared: '本人编制的报价',
      title: '销售数据范围',
      unrestricted: '不限制',
      region: '本区域',
      own: '所属项目由本人负责',
      public: '非保密项目',
    },
  },
  title: '销售权限示例',
  overview: '使用说明',
  actions: '操作',
  testAccounts: '示例账号',
  account: '账号',
  permissionSet: '权限集',
  password: '示例密码：AuthzExample123!',
  tryTitle: '配置与验证',
  roles: {
    assistant: '销售助理',
    engineer: '销售工程师',
    manager: '项目经理',
    delivery: '交付专员',
  },
  forbidden: '没有此操作的权限。',
  error: '加载失败，请重试。',
};
