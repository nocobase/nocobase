import type { AppServerResource } from './en-US.js';

const zhCN: AppServerResource = {
  'keyScopes.members.title': '成员与角色',
  'keyScopes.members.description':
    '只读：查看成员和角色。读写：还可邀请成员、分配角色。管理：还可定义角色。',
  'keyScopes.reports.title': '报表',
  'keyScopes.reports.description': '查看团队仪表盘、指标和 Agent 运行用量。',
  'keyScopes.knowledge.title': '知识库',
  'keyScopes.knowledge.description':
    '阅读知识库；提议修改；编辑知识并打开系统知识页面。',
  'keyScopes.presets.readOnly.title': '只读',
  'keyScopes.presets.readOnly.description': '可读取你能读取的全部内容。',

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
    related: {
      knowledgeSeen: '系统和我能查看的项目的',
      knowledgeSeenHint: '系统知识，以及我能查看的项目的知识空间',
      knowledgeLed: '我负责的项目的',
      knowledgeLedHint: '我负责的项目的知识空间；系统知识需要“全部”',
      appsSeen: '我创建的或我能查看的项目里的',
      appsSeenHint:
        '我创建的应用、关联到我能查看的项目的应用，以及我能查看的任务的预览应用',
      appsLed: '我创建的或我负责的项目里的',
      appsLedHint:
        '我创建的应用、关联到我负责的项目的应用，以及我能编辑的任务的预览应用',
    },
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
