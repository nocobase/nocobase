import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: '需要存取通知日誌。',
    logNotFound: '未找到通知日誌。',
  },
};

export default zhTW;
