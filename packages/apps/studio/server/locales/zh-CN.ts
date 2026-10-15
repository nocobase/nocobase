import type { AppServerResource } from './en-US.js';

const zhCN: AppServerResource = {
  knowledge: {
    manual: {
      updated: '手册：已更新 <slug>, <slug>',
      none: '手册：无影响',
    },
  },
  ci: {
    taskTitle: '接入部署：{{repo}}',
  },
  studioAgents: {
    templateMessages: {
      inReview:
        '审阅改动并合并它的 Pull request：合并后任务会变为已完成（如有必填检查项，需先勾选）。也可以附上评论，把任务退回进行中。',
    },
  },
  navigation: {
    config: '设置',
  },
  roles: {
    admin: '管理员',
    contributor: '成员',
    owner: '所有者',
    capabilities: {
      apiKeys: {
        read: '查看组织的 API 密钥',
        manage: '创建、修改、轮换和删除组织的 API 密钥，不超过自己的权限',
      },
      git: {
        read: '查看代码托管连接',
        manage: '添加、修改和移除代码托管连接',
      },
      personalApiKeys: {
        create: '创建自己的 API 密钥',
      },
      knowledgeSearch: {
        read: '查看知识库的检索方式',
        manage: '选择知识库的向量、重排和上下文模型以及阈值',
      },
    },
    items: {
      apiKeys: 'API 密钥',
      git: '代码托管连接',
      knowledgeSearch: '知识库检索',
      personalApiKeys: '个人 API 密钥',
    },
  },
};

export default zhCN;
