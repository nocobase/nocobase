import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  'push.deviceCount': '登録済み {{total}} 台 · 有効 {{active}} 台',
  'push.active': '有効',
  'push.paused': '一時停止中',
  'push.pause': '一時停止',
  'push.resume': '再開',
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
  'push.testSent': 'プッシュサービスがテスト通知を受け付けました。',
  'push.invalid':
    'ブラウザーから無効な購読情報が返されました。再度購読してください。',
  'push.endpoint':
    'このブラウザーが利用するプッシュサービスには対応していません。',
  'push.owned':
    'このブラウザーの購読は別のアカウントに属しています。元のアカウントで削除してから再度購読してください。',
  'push.browserFailed':
    'ブラウザーでプッシュ通知を購読できませんでした。通知設定とネットワーク接続を確認してください。',
  'push.expired':
    'この端末の購読は期限切れか削除済みです。端末から再度購読してください。',
  'push.testPaused':
    'この端末のプッシュ通知を再開してからテスト通知を送信してください。',
  'push.testLimited': 'テスト通知を再送するには30秒お待ちください。',
  'push.testNetwork':
    'サーバーからプッシュサービスに接続できません。管理者にネットワークと Web Push プロキシの確認を依頼してください。',
  'push.testGatewayAuth':
    'プッシュサービスがサーバーの認証情報を拒否しました。管理者に VAPID キーの確認を依頼してください。',
  'push.testGatewayLimited':
    'プッシュサービスがリクエスト数を制限しています。時間をおいて再試行してください。',
  'push.testGateway':
    'プッシュサービスがテスト通知を受け付けられませんでした。時間をおいて再試行してください。',
  'push.failed': 'プッシュ通知を更新できません。もう一度試してください。',
  'push.loadingFailed': 'デバイスをロードできません。もう一度試してください。',
  'push.retry': '再試行',
  'channelType.title': 'ブラウザープッシュ',
  'channelType.testHint':
    'プッシュをオンにしたブラウザーにテスト通知を送ります。先に個人設定 › 通知でオンにしてください。',
};

export default jaJP;
