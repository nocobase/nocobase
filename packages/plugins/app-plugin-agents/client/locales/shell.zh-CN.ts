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
      hint: '不在这些角色里的成员在会话面板里看不到这个 Agent，也不能和它开始会话。能管理 Agent 的人始终可以。',
      required: '至少选择一个角色。',
    },
    teamDefault: {
      label: '团队默认 Agent',
      none: '不设置',
      hint: '成员没有选择自己的默认 Agent 时，新会话交给它。只有已启用、所有成员都能对话的 Agent 可以作为团队默认。',
      saved: '已保存团队默认 Agent',
    },
  },
  me: {
    navigation: 'Agent',
    title: 'Agent',
    description:
      '你自己的 Agent 设置：新会话交给谁、你添加的运行环境，以及你的运行用量。',
    defaultAgent: { title: '我的默认 Agent' },
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
