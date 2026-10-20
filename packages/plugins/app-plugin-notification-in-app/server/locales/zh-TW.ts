import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: '需要身份驗證。',
    invalidPageToken: 'pageToken 不是此列表返回的令牌。',
    notFound: '未找到通知訊息。',
  },
  test: {
    channels: {
      inApp: '應用內',
    },
    providers: {
      builtIn: '內建',
    },
    fields: {
      route: '內部路由（無部署字首）',
      url: '全 HTTP(S) URL',
      recipientUserId: '收件者使用者 ID',
      title: '標題',
      message: '留言',
    },
    placeholders: {
      currentUser: '應用程式使用者 ID',
    },
    defaults: {
      title: 'NocoBase 通知測試',
      body: '這是 NocoBase 的測試通知。',
    },
  },
};

export default zhTW;
