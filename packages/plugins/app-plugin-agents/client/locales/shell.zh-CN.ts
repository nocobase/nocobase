import type shellEnUS from './shell.en-US.js';

const shellZhCN: typeof shellEnUS = {
  agents: {
    filters: { disabled: '已停用', enabledOnly: '已启用' },
    columns: { chatRoles: '谁可以对话' },
    chatRoles: {
      label: '谁可以对话',
      everyone: '所有成员',
      roles: '指定角色',
      placeholder: '选择角色',
      hint: '不在这些角色里的成员在会话面板里看不到这个 Agent，也不能和它开始会话。管理 Agent 的权限不改变谁可以对话，只有 root 能和所有 Agent 对话。',
      required: '至少选择一个角色。',
    },
    detail: {
      view: '查看',
      viewFor: '查看 {{name}}',
      readOnly: '你可以查看这个 Agent，只有能管理 Agent 的人可以修改。',
      tabs: {
        settings: '设置',
        actions: '业务操作',
        skills: '默认技能',
        runs: '运行记录',
      },
      actionsHint:
        '应用允许这个 Agent 在业务数据里做的事。只有唤起它的人也有权限时，它才会执行。',
      actionsNone: '这个 Agent 没有业务操作。',
      optionalActions: '可选操作',
      optionalActionsHint:
        '默认对所有 Agent 关闭，需要为这个 Agent 单独开启。开启后，它仍只能在唤起它的人也有权限时执行。',
      optionalActionsFailed: '无法修改可选操作。',
      skillsHint:
        '每个 Agent 的每次运行都会带上的团队默认技能，在「技能」页修改。',
      skillsNone: '还没有团队默认技能。',
      skillsUnavailable: '需要查看技能的权限才能看到。',
    },
    teamDefault: {
      label: '团队默认 Agent',
      none: '不设置',
      hint: '成员没有选择自己的默认 Agent 时，新会话交给它。只有已启用、所有成员都能对话的 Agent 可以作为团队默认。',
      saved: '已保存团队默认 Agent',
    },
  },
  usage: { tabs: { usage: '用量', prices: '价格' } },
  me: {
    navigation: 'Agent',
    title: 'Agent',
    description:
      '你自己的 Agent 设置：新会话交给谁、你添加的运行环境，以及你的运行用量。',
    defaultAgent: { title: '我的默认 Agent' },
    effort: {
      title: '思考程度',
      description:
        '你发起的会话里 Agent 的思考程度，会话里另选的除外。编码工具不支持该程度的 Agent 使用它自己的默认值。',
      label: '我的思考程度',
      default: '各 Agent 的默认',
      saved: '已保存思考程度',
    },
    runtimes: {
      title: '我添加的运行环境',
      description:
        '个人运行环境只运行你自己的工作。可在系统设置的「运行环境」页添加，或请管理员添加。',
      none: '你还没有添加运行环境。',
      loadFailed: '无法加载你的运行环境',
      status: { online: '在线', offline: '离线', revoked: '已撤销' },
    },
    usage: {
      title: '我的用量',
      description: '你的运行在最近 30 天的用量。',
      runs: '运行次数',
      tokens: 'Token',
      cost: '估算费用',
      loadFailed: '无法加载你的用量',
    },
  },
};

export default shellZhCN;
