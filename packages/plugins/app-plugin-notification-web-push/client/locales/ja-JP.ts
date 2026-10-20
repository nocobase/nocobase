import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  'push.title': 'プッシュ通知',
  'push.description':
    'アプリを閉じている場合でも、各デバイスでリマインダーを受信します。',
  'push.subscribe': 'このデバイスを購読する',
  'push.name': 'デバイス名',
  'push.empty': '加入しているデバイスがありません',
  'push.emptyHint':
    'アプリを閉じたときにリマインダーを受け取るには、このデバイスを購読します。',
  'push.ios':
    'iOS または iPadOS 16.4 以降では、Safari の [共有] メニューを開き、[ホーム画面に追加] を選択して、アイコンからアプリを開いて購読します。',
  'push.unsupported':
    'プッシュには HTTPS と Web プッシュをサポートするブラウザが必要です。',
  'push.unavailable':
    'プッシュが設定されていません。管理者に VAPID と秘密キーの構成を依頼してください。',
  'push.denied':
    '通知がブロックされています。ブラウザのサイト設定で許可してから、もう一度お試しください。',
  'push.current': 'このデバイス',
  'push.more': 'デバイスアクション',
  'push.test': 'テスト通知を送信する',
  'push.remove': '削除',
  'push.removeTitle': 'デバイス「{{name}}」を削除しますか?',
  'push.removeHint':
    'この端末はプッシュ通知の受信を停止します。そのデバイスから再度購読できます。',
  'push.cancel': 'キャンセル',
  'push.saved': 'デバイス設定が保存されました',
  'push.saving': 'デバイス設定の保存',
  'push.testSent': 'テスト通知がキューに入れられました',
  'push.failed': 'プッシュ通知を更新できません。もう一度試してください。',
  'push.loadingFailed': 'デバイスをロードできません。もう一度試してください。',
  'push.retry': '再試行',
};

export default jaJP;
