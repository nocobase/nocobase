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
  retry: 'リクエストを再試行',
  plugin: 'プラグイン',
  scope: 'スコープ',
  message: 'メッセージ',
  settingsTitle: 'ルート例の設定',
  settingsDescription:
    'ルート例プラグインが defineSettingsRoutes() で宣言しています。',
  settingsBody:
    'この設定ページはプラグインから提供されます。defineSettingsRoutes() で宣言され、「システム」カテゴリに加わり、/settings の下に配置されます。',
};

export default jaJP;
