import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings,
  permissionSets: {
    builtIn: {
      root: 'システム管理者',
      member: 'メンバー',
    },
  },
  sections: {
    pages: 'ページ権限',
    page: 'ページ',
    business: '営業許可',
    administration: '管理',
    other: 'その他',
  },
  options: {
    defaultAndSharing: 'デフォルトのデータスコープを使用する',
    actions: {
      assign: '割り当ての管理',
      configure: '設定する',
      read: '読み取り',
      create: '作成',
      update: '更新',
      delete: '削除',
      access: 'アクセス',
    },
    settingsModules: {
      authorization: '認可',
    },
    pages: {
      all: '全ページ',
      allDescription:
        '後で追加されたページも含め、すべてのページへのアクセスを許可します。',
    },
    settings: {
      'permission-sets': '権限セット',
      'authentication-settings': 'サインインと認証',
    },
    subjectTypes: {
      authenticated: 'サインインしているすべてのユーザー',
      authenticatedDescription:
        '有効なサインイン セッションを持つすべてのユーザーに適用されます。',
      user: 'ユーザー',
    },
    recordAccessPolicies: {
      allRecords: '全記録',
      recordsIOwn: '私が所有するレコード',
      recordsICreated: '私が作った記録',
      customFilter: 'カスタムフィルター',
      customFilterHint: 'カスタムフィルター条件でレコードを選択します。',
    },
  },
};

export default jaJP;
