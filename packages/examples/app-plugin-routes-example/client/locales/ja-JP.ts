import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  providerDescription:
    'このページは、同じクライアント プラグインによって提供されたプロバイダーを使用しています。',
  loadError: 'サーバールートをロードできません。',
  clientExample: 'クライアントルートの例',
  title: 'ルートの例',
  pageDescription:
    '遅延ロードされており、同じプラグインのサーバー ルートから応答を読み取ります。',
  loading: 'サーバーデータをロード中…',
  retry: 'リトライリクエスト',
  plugin: 'プラグイン',
  scope: 'スコープ',
  message: 'メッセージ',
};

export default jaJP;
