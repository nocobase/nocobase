import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: '通知ログへのアクセスが必要です。',
    logNotFound: '通知ログが見つかりません。',
  },
};

export default jaJP;
