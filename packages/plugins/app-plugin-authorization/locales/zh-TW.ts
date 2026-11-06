import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  sections: {
    pages: '頁面許可權',
    page: '頁數',
    business: '業務許可權',
    administration: '管理',
    other: '其他',
  },
  options: {
    defaultAndSharing: '使用預設資料範圍',
    actions: {
      assign: '管理作業',
      configure: '配置',
      inspect: '檢查許可權',
      read: '讀取',
      create: '建立',
      update: '更新',
      delete: '刪除',
      access: '存取',
    },
    settingsModules: {
      authorization: '授權',
    },
    pages: {
      all: '所有頁面',
      allDescription: '允許訪問每個頁面，包括後來新增的頁面。',
    },
    settings: {
      inspector: '許可權檢查員',
      'permission-sets': '許可權集',
    },
    subjectTypes: {
      authenticated: '所有登入使用者',
      authenticatedDescription: '適用於每個具有有效登入工作階段的使用者。',
      user: '使用者',
    },
    recordAccessPolicies: {
      allRecords: '所有記錄',
      recordsIOwn: '我擁有的記錄',
      recordsICreated: '我建立的記錄',
      customFilter: '客製化過濾器',
      customFilterHint: '選擇具有自訂過濾條件的記錄。',
    },
  },
};

export default zhTW;
