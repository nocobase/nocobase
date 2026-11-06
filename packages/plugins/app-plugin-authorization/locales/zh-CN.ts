import type { AuthorizationServerResource } from './en-US.js';

const zhCN: AuthorizationServerResource = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: '页面访问',
    page: '页面',
    business: '业务操作',
    administration: '系统与工具',
    other: '其他',
  },
  options: {
    defaultAndSharing: '沿用默认数据范围',
    actions: {
      assign: '管理授权',
      configure: '配置',
      inspect: '检查权限',

      read: '查看',
      create: '新建',
      update: '编辑',
      delete: '删除',
      access: '访问',
    },
    settingsModules: { authorization: '权限管理' },
    pages: {
      all: '所有页面',
      allDescription: '允许访问所有页面，包括之后新增的页面。',
    },
    settings: {
      inspector: '权限检查器',
      'permission-sets': '权限集',
    },
    subjectTypes: {
      authenticated: '所有已登录用户',
      authenticatedDescription: '适用于所有已登录用户。',
      user: '用户',
    },
    recordAccessPolicies: {
      allRecords: '全部记录',
      recordsIOwn: '本人拥有的记录',
      recordsICreated: '本人创建的记录',
      customFilter: '自定义筛选',
      customFilterHint: '使用自定义筛选条件选择记录。',
    },
  },
};

export default zhCN;
