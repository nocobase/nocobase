import type { AccessLocale } from './access.en-US.js';

const accessZhCN: AccessLocale = {
  access: {
    section: 'Agent 团队',
    businessSection: 'Agent 团队',
    businesses: {
      agents: {
        title: 'Agent 和技能',
        description: '团队的 Agent 以及它们使用的技能。',
        actions: {
          edit: {
            title: '修改 Agent 和技能',
            description:
              '修改 Agent 的设置、技能和环境变量，归档、恢复和删除 Agent，编辑技能。授予 Agent 的能力不能超出自己的权限',
            related: '修改 Agent 和技能（自己负责的 Agent 和自己创建的技能）',
            relatedLabel: '我负责的 Agent 和我创建的技能',
            relatedHint: '我是负责人的 Agent，以及我创建的技能',
            all: '修改 Agent 和技能（全部）',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agent',
        runners: '运行环境',
        prices: '模型价格',
        services: '模型服务',
      },
    },
    actions: { read: '查看', manage: '管理' },
    keyScopes: {
      agents: {
        title: 'Agent',
        description:
          '查看 Agent、技能和运行；修改 Agent 和技能，取消和重试运行。',
      },
      runners: {
        title: '运行环境',
        description: '查看运行环境和注册令牌；管理运行环境。',
      },
      prices: {
        title: '模型价格',
        description: '查看用于估算成本的模型价格；修改它们。',
      },
      services: {
        title: '模型服务',
        description: '查看模型服务及其提供的模型，不含密钥。',
      },
    },
  },
};

export default accessZhCN;
