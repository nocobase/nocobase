import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: '認証が必要です。',
    invalidPageToken: 'pageToken はこのリストが返したトークンではありません。',
    notFound: '通知メッセージが見つかりませんでした。',
  },
  test: {
    channels: {
      inApp: 'アプリ内',
    },
    providers: {
      builtIn: '内蔵',
    },
    fields: {
      route: '内部ルート (デプロイメントプレフィックスなし)',
      url: 'フル HTTP(S) URL',
      recipientUserId: '受信者ユーザーID',
      title: 'タイトル',
      message: 'メッセージ',
    },
    placeholders: {
      currentUser: 'アプリケーションユーザーID',
    },
    defaults: {
      title: 'NocoBase 通知テスト',
      body: 'NocoBaseからのテスト通知です。',
    },
  },
};

export default jaJP;
