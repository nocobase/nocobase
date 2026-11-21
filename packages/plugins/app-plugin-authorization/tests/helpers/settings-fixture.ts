import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
} from '@nocobase/app-client/plugins';

/** The namespace a test application's own routes translate in. */
export const APP_NAMESPACE = '@nocobase/app-testing';

/** The copy of the application's own routes below, as an application's locale files hold it. */
export const appWords = {
  'en-US': {
    navigation: { home: 'Home', resources: 'Resources' },
    settings: {
      users: 'Users',
      usersDescription: 'Manage users.',
      categories: {
        account: 'Accounts and permissions',
        automation: 'Workflows and automation',
        messages: 'Messages',
        ai: 'AI',
        data: 'Data and files',
        system: 'System',
        other: 'Other',
      },
    },
  },
  'zh-CN': {
    navigation: { home: '首页', resources: '资源' },
    settings: {
      users: '用户',
      usersDescription: '管理用户。',
      categories: {
        account: '账号与权限',
        automation: '流程与自动化',
        messages: '消息',
        ai: 'AI',
        data: '数据与文件',
        system: '系统',
        other: '其他',
      },
    },
  },
} as const;

export const appNamespaces = {
  [APP_NAMESPACE]: {
    'en-US': async () => ({ default: appWords['en-US'] }),
    'zh-CN': async () => ({ default: appWords['zh-CN'] }),
  },
};

/** The System settings home and the Users page, as an application with user management registers them. */
export const settingsRoutes = [
  defineSystemSettingsRoutes([
    {
      name: 'settingsHome',
      path: '/',
      authz: 'skip',
      componentLoader: async () => ({ default: () => null }),
    },
  ]),
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'settingsUsers',
      path: '/users',
      auth: 'required',
      authz: { resource: { type: 'user', id: '*' }, action: 'read' },
      navigation: {
        title: 'settings.users',
        description: 'settings.usersDescription',
      },
      componentLoader: async () => ({ default: () => null }),
    },
  ]),
];
