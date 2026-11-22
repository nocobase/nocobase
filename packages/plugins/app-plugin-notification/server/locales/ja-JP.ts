import type { NotificationServerResource } from './en-US.js';

const jaJP: NotificationServerResource = {
  errors: {
    logNotFound: '通知ログが見つかりません。',
    kindNotFound: '通知の種類が見つかりません。',
    channelNotFound: '「{{name}}」という有効な通知チャネルはありません。',
    channelTestUnsupported:
      '「{{name}}」チャネルはテストメッセージを送信できません。',
    channelNoRecipient:
      '「{{name}}」チャネルにはあなたの宛先やデバイスがありません。',
    deliveryNotFound: '配信記録が見つかりません。',
    deliveryNotRetryable:
      'この配信は再試行できません。再試行できるのは、チャネルが変更されていない失敗した配信だけです。',
    retryReasonRequired: '再試行の理由を入力してください。',
    preferenceUnknown: 'この通知にはそのチャネルがありません。',
    preferenceRequired:
      'この通知は常にこのチャネルで送信され、オフにできません。',
  },
  test: {
    title: 'テスト通知',
    body: 'これは「設定 › 通知」から「{{channel}}」チャネルに送信したテストです。',
  },
  authorization: {
    section: 'メッセージ',
    title: '通知',
    read: '表示',
    manage: '管理',
  },
};

export default jaJP;
