import type { RuntimesLocale } from './runtimes.en-US.js';

const runtimesZhCN: RuntimesLocale = {
  runtimes: {
    title: '运行环境',
    description: '运行 Agent 的运行环境，以及各自上报的编码工具。',
    add: '添加运行环境',
    loadFailed: '无法加载运行环境',
    emptyTitle: '还没有连接运行环境',
    emptyDescription:
      '连接运行环境后，Runner Agent 可以在其中使用编码工具承接任务。',
    noneConnected: '没有已连接的运行环境。',
    revokedList_one: '{{count}} 个已吊销的运行环境',
    revokedList_other: '{{count}} 个已吊销的运行环境',
    lastSeen: '最近在线 {{time}}',
    toolUsage: {
      label: '各编码工具的运行数',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: '按编码工具限制',
      hint: '每个编码工具同时运行的上限，比如订阅会话数较少的工具可以设得小一些。留空则只受最大并发数限制。',
      none: '不限',
      invalid: '请输入 1 到 64 之间的整数，或留空。',
      inputLabel: '{{tool}} 同时运行上限',
      overTotal:
        '{{tools}} 的上限高于最大并发数（{{slots}}），实际最多同时运行 {{slots}} 个。',
      noneChecked: '先在上面勾选编码工具，再为它设置上限。',
    },
    toolTable: {
      tool: '工具',
      enabled: '启用',
      state: '状态',
      limit: '同时上限',
      active: '当前',
    },
    activity: {
      online: '在线 {{active}}/{{slots}}',
      busy: '忙碌 {{active}}/{{slots}}',
      offline: '离线 · {{time}}',
      offlineNever: '离线',
    },
    policy: {
      title: '本机策略',
      description:
        '运行环境的所有者允许它接受的工作，以它上报的为准。本机策略在那台机器上修改，不在这里。',
      none: '没有本机策略：它接受注册给它的任何工作。',
      any: '任意',
      nothing: '不接受',
      agents: 'Agent',
      subjects: '对象',
      repos: '仓库',
    },
    jobs: {
      allow: '允许执行构建作业',
      hint: '本应用配置的构建等步骤，不调用模型。这个运行环境支持：{{kinds}}。',
      unsupported: '这个运行环境的 runner 不支持作业，更新后才能打开。',
    },
    noTools: '没有发现编码工具',
    actionsFor: '{{name}} 的操作',
    columns: {
      name: '名称',
      status: '状态',
      tools: '工具',
      sharing: '共享',
      version: '版本',
      lastSeen: '最近在线',
      slots: '最大并发数',
    },
    detail: {
      general: '常规',
      tools: '工具',
      toolsDescription:
        '它上报的编码工具。关闭的工具的工作不会派到这里。开关和上限点「保存」后一起生效。',
      version: 'runner {{version}}',
      runs: '最近的运行',
      runsEmpty: '还没有运行。',
      runsFailed: '无法加载它的运行。',
      readOnly: '只有它的所有者或运行环境管理员可以修改。',
      owner: '所有者 {{name}}',
    },
    status: {
      online: '在线',
      offline: '离线',
      revoked: '已吊销',
      upgrade_required: '需要升级',
    },
    upgradeRequired: {
      title: '这个运行环境需要升级',
      older:
        '它的 runner {{version}} 使用 Agent 协议 {{protocol}}，本应用需要协议 {{required}}。它会保持连接，但在升级之前不会执行任何任务。',
      newer:
        '它的 runner {{version}} 使用 Agent 协议 {{protocol}}，比本应用（协议 {{required}}）更新。它会保持连接，但在换成本应用提供的 runner 之前不会执行任何任务。',
      latest:
        '本应用提供 runner {{latest}}。在它所在的主机上运行以下命令升级：',
      noLatest:
        '请安装使用协议 {{required}} 的 runner，或在它所在的主机上运行以下命令升级：',
      reinstall:
        '它的 runner 没有说明安装方式。请在它所在的主机上用“添加运行环境”中的命令重新安装。',
    },
    tool: {
      signedIn: '已登录',
      signedOut: '未登录',
      notInstalled: '未安装',
      off: '已关闭',
      offHint: '已关闭：这个工具的工作不会派到这个运行环境。',
      enableLabel: '在 {{name}} 上运行 {{tool}}',
      version: '版本 {{version}}',
    },
    trust: {
      label: '为谁工作',
      team: '团队',
      teamHint:
        '运行团队中任何人发起的工作，并接收他们的变量和密钥。适合团队共用的服务器或虚拟机。',
      ownerOnly: '个人',
      ownerOnlyHint: '只运行你发起的工作。你自己添加的运行环境默认如此。',
      personalOnly:
        '这个运行环境将是个人的：只运行你发起的工作。之后可以再共享给团队。',
    },
    share: {
      title: '把 {{name}} 共享给团队？',
      description:
        '其他人的运行会在这个运行环境中执行，并带上他们的变量和密钥，也能读取其中的内容。确认没有问题再共享。',
      confirm: '共享给团队',
    },
    edit: {
      button: '编辑',
      title: '编辑 {{name}}',
      name: '名称',
      nameRequired: '请输入名称。',
      slotsHint: '这个运行环境同时运行的数量。',
      slotsInvalid: '请输入 1 到 64 之间的整数。',
      saved: '已保存 {{name}}',
    },
    upgrade: {
      show: '版本 {{version}}：runner 有新版本',
      available: '有可用更新',
      badge: '可升级',
      title: '{{name}} 的 runner 有新版本',
      description: '已安装 {{version}}，本应用提供 {{latest}}。',
      hint: '没有 Agent 运行时它会自动更新。如需立即更新，在它所在的主机上运行：',
    },
    revoke: {
      title: '吊销 {{name}} 的凭证？',
      description:
        '它的 runner 会在下一次请求时停止，运行退回队列。要重新连接，请再添加一次这个运行环境。',
      confirm: '吊销',
      done: '已吊销 {{name}} 的凭证',
    },
    delete: {
      title: '删除 {{name}}？',
      description: '已吊销的运行环境将从列表中移除，历史运行记录保留。',
      confirm: '删除',
      done: '已删除 {{name}}',
    },
  },
  connect: {
    title: '添加运行环境',
    description:
      '在装有编码工具的主机（服务器、虚拟机或个人设备）上运行下面的命令。',
    createCredential: '生成安装命令',
    advanced: '高级：按编码工具限制',
    run: '在那台主机上运行以下命令。它会从本应用下载 runner（nocobase-runner）和本应用的 CLI（无需 Node.js），注册 runner 并设置为登录后自动启动：',
    installed: '已经装好 nocobase-runner？改为注册它：',
    unsupported: 'runner 暂不支持 Windows，请使用 macOS、Linux 或 WSL。',
    tokenOnce:
      '命令中带有一次性凭证，用于添加一个「{{trust}}」运行环境。只能使用一次，有效期至 {{time}}。',
    after: '几秒钟后，运行环境会出现在列表中，并列出它发现的每个编码工具…',
    tokenTools: '编码工具：{{tools}}。',
    tools: '编码工具',
    toolsHint:
      '只有勾选的工具的工作会派到这个运行环境。之后可以随时在运行环境页面修改。',
    toolsRequired: '请至少选择一个编码工具。',
    slots: '最大并发数',
    slotsHint: '这个运行环境同时运行的数量。之后可以随时在运行环境页面修改。',
    tokenSlots: '最大并发数：{{slots}}。',
    tokenToolSlots: '按编码工具：{{limits}}。',
    connected: '{{name}} 已连接。',
    done: '完成',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
};

export default runtimesZhCN;
