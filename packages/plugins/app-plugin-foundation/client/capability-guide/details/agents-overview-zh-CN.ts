import type enUS from './agents-overview-en-US.js';

const agentsOverview: typeof enUS = {
  statusTitle: '当前应用',
  connected: '已配置',
  pending: '未配置',
  partial: '配置待完善',
  unknown: '暂时无法确认',
  loading: '正在检查…',
  refresh: '刷新状态',
  connectedHint:
    '已配置 Agent 插件，具体可用能力取决于模型服务、业务入口和机器连接的配置。',
  pendingHint:
    '当前应用尚未配置 Agent 能力。选择下方的使用场景，把需求交给开发 Agent，即可开始配置。',
  partialHint:
    '当前应用的 Agent 配置尚未完成。请让开发 Agent 按下方选择的场景完善配置。',
  unknownHint: '暂时无法读取当前配置状态，仍可查看下方的能力介绍和使用指引。',
  forbidden: '当前账号无法查看配置状态。',
  expired: '请重新登录后查看配置状态。',
  failed: '配置状态读取失败，可以刷新重试。',
  signIn: '重新登录',
  capabilitiesTitle: '可以提供哪些能力',
  capabilities: {
    models: {
      title: '模型服务',
      description: '接入模型服务，选择对话模型，并测试连接是否可用。',
    },
    chat: {
      title: 'AI 对话',
      description: '逐步查看回复、停止生成，并在之后继续已有会话。',
    },
    skills: {
      title: '业务 Skills',
      description: '复用团队规范、参考资料和示例，并维护它们的版本。',
    },
    tools: {
      title: '业务工具',
      description: '通过已接入且获得授权的操作，让 Agent 查询或处理业务数据。',
    },
    machines: {
      title: '机器 Agent',
      description: '连接机器上的编码工具，委派任务并查看执行过程和结果。',
    },
    usage: {
      title: '用量与价格',
      description: '查看模型用量，维护费用统计所使用的模型价格。',
    },
  },
  goalsTitle: '选择一个使用场景',
  preparation: '需要准备',
  business: {
    title: '给业务页面增加 AI 对话',
    description: '在处理业务时，整理客户沟通内容、起草文案或提问。',
    preparation:
      '模型服务和可用的对话模型。查询或修改业务记录时，还需接入对应业务工具和权限。',
    boundary:
      '模型对话不会直接读取应用源码，也不能直接执行项目构建和测试；处理项目代码应使用机器 Agent。',
    setup: '如何接入 AI 对话',
    steps: {
      entry:
        '让开发 Agent 为应用加入聊天入口和模型管理页面，明确哪些人可以使用，以及 Agent 可以访问哪些业务信息。',
      models:
        '在模型管理中添加服务，在专用字段填写密钥，获取可用模型并启用对话模型，测试连接后保存。向量和重排序模型不能用于聊天。',
      chat: '打开聊天入口，选择模型，先用自己提供的材料发起一个小请求，检查能否回复、停止生成，以及重新打开会话后继续交流。',
      verify:
        '需要业务数据时，再接入相关工具和访问规则。检查真实工具结果，并验证切换账号后不会看到其他人的聊天记录。',
    },
    prompt:
      '请在【业务页面】为【使用人群】增加 AI 对话入口，用于【提问或内容整理任务】。支持选择模型、停止回复和继续历史会话，每个人只能看到自己的记录。\n\n先阅读已安装的 nocobase-app-plugin-agents Skill，检查现有接入，复用或补充模型管理页面和聊天入口。通过模型管理配置对话模型，密钥只填写在专用字段，不写入需求或源码。\n\n若需要业务记录，只接入必要的工具，并校验当前用户的权限。验证真实回复、停止生成、继续历史记录和账号隔离，说明仍需补充的配置。',
  },
  skills: {
    title: '让 AI 按团队规范完成工作',
    description:
      '把重复使用的指引整理成业务 Skill，例如按固定格式整理周报、起草客户回复。',
    preparation: '可用的模型对话、团队规范，以及相关参考资料。',
    boundary:
      '导入 Skill 后，还需要为会话明确选用它。Skill 用来指导工作，不会自动授予业务数据权限。',
    setup: '如何使用业务 Skill',
    steps: {
      prepare:
        '整理任务的输入、输出格式和信息缺失时的处理规则，准备 Skill 指引及示例、参考资料。',
      import:
        '让应用提供技能管理入口，导入 Skill 后检查指引正文、支持文件和版本。',
      select:
        '增加一个专用业务入口，或让相应会话明确选用这个 Skill。普通聊天不会自动使用所有已导入的 Skill。',
      verify:
        '用真实材料试运行，在工具记录中确认已读取指引及参考文件，再核对草稿是否符合团队规范；缺少的事实应明确标注。',
    },
    prompt:
      '请为【团队】建立一个用于【重复任务，例如整理周报】的业务 Skill，遵循【格式与规则】，参考【资料】。缺少的事实要标注，不编造内容，只生成草稿，不直接发布。\n\n先阅读已安装的 nocobase-app-plugin-agents Skill，复用已有模型服务和技能管理，准备 Skill 及支持文件，并增加一个明确为会话选用该 Skill 的业务入口，保留当前用户的业务权限。\n\n用真实材料验证，检查工具记录能证明已读取 Skill 和支持文件，输出符合规范，并且入口在失败时给出清晰提示。',
  },
  runner: {
    title: '让机器上的 Agent 处理项目任务',
    description:
      '连接电脑或服务器上的编程 Agent，检查项目、修改代码、执行验证，并查看处理结果。',
    preparation:
      '目标机器上已安装并登录的编码工具、Runner 连接，以及已启用的工具与模型组合。',
    boundary:
      '机器 Agent 使用编码工具自己的登录凭据。普通会话有独立的工作目录，不会自动进入应用源码项目。',
    setup: '如何连接机器 Agent',
    steps: {
      prepare:
        '确定目标机器和编码工具，完成安装与登录。让开发 Agent 准备应用中的机器连接和 Agent 管理入口，以及所需的 Runner 分发包。',
      connect:
        '创建个人或共享的机器连接，选择允许使用的工具，按页面指引连接，等待机器上报工具、登录状态和可用模型。',
      enable:
        '在机器 Agent 管理中添加或选择可用的工具与模型组合，并启用它。机器在线不代表已经有可用的 Agent。',
      verify:
        '在聊天中选择机器 Agent，先只读检查当前工作目录。需要修改业务项目时，配置经过授权的项目目录，并核对实际命令输出、代码差异和验证结果。',
    },
    prompt:
      '请连接【目标机器】上的编程 Agent，让使用者能在应用中选择可用的机器 Agent、发送【任务类型】，并查看执行进度和结果。\n\n先阅读已安装的 nocobase-app-plugin-agents Skill 并检查现有接入。准备所需管理入口及 Runner 分发包，连接机器，检查编码工具自身的登录状态和上报模型，启用选定的工具与模型组合，不要与普通对话的模型服务密钥混淆。\n\n先在会话工作目录中验证一个只读任务。若需处理【项目】，请提供经过授权的项目目录，不要直接信任聊天中输入的路径。核对真实命令和输出；涉及修改时，报告代码差异和检查结果。',
  },
  agentTab: '开发提示词',
  manualTab: '使用步骤',
  promptHint:
    '替换括号中的需求，交给负责开发应用的 Agent。这不是发给业务 Agent 的对话内容。',
  promptLabel: '可编辑的需求',
  copy: '复制需求',
  copied: '已复制',
  copyFailed: '复制失败，请选中上面的需求手动复制。',
  management: '模型、技能和用量在哪里管理？',
  managementHint:
    '应用可以按需提供这些管理页面和业务入口。以下介绍它们的用途，不代表当前应用已完成配置。',
  managementItems: {
    models: {
      title: '模型服务',
      description:
        '在模型管理中添加服务、获取模型、测试连接和管理密钥。模型服务不配置在 config.yml 的 agents 下。',
    },
    skills: {
      title: '技能管理',
      description:
        '导入团队指引和支持文件、维护版本，并为业务会话或任务明确选用相应 Skill。',
    },
    machines: {
      title: '机器连接与 Agent ',
      description:
        '分别管理连接的机器及允许使用的编码工具，以及已启用的工具与模型组合。无法开始任务时，需要同时检查。',
    },
    usage: {
      title: '用量与价格',
      description:
        '在用量管理中查看消耗并维护模型价格，应用需要时再加入这个管理入口。',
    },
  },
};

export default agentsOverview;
