import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  channels: {
    inApp: '應用內',
  },
  providers: {
    builtIn: '內建',
  },
  errors: {
    authenticationRequired: '需要身份驗證。',
    invalidPageToken: 'pageToken 不是此列表返回的令牌。',
    notFound: '未找到通知訊息。',
  },
};

export default zhTW;
