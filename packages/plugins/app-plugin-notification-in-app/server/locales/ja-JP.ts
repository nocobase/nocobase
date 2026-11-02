import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'アプリ内',
  },
  providers: {
    builtIn: '内蔵',
  },
  errors: {
    authenticationRequired: '認証が必要です。',
    invalidPageToken: 'pageToken はこのリストが返したトークンではありません。',
    notFound: '通知メッセージが見つかりませんでした。',
  },
};

export default jaJP;
