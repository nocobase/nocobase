import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  logs: {
    deliveryOperations: '配送業務',
    recipeDescription:
      '各チャネルのハンドオフとすべてのプロバイダーの試行をトレースします。',
    redacted: 'メッセージ本文、受信者、リーストークンは編集されます。',
    providerAttempts: 'プロバイダーの試行',
    eyebrow: '通知',
    title: '通知ログ',
    description:
      '通知配信とすべてのプロバイダーの試行を追跡します。メッセージ本文、受信者、およびリース トークンは編集されます。',
    refreshing: '爽やか…',
    refresh: '更新',
    sendTest: 'テスト通知を送信する',
    deliveriesShown: '配送状況を表示',
    needAttention: '注意が必要です',
    unavailable: 'ログが利用できません',
    recent: '最近のお知らせ',
    loading: '配信履歴を読み込み中…',
    emptyTitle: 'まだ納品されていません',
    emptyDescription: '通知が送信された後、配信記録がここに表示されます。',
    expand: '拡張通知',
    collapse: '通知を折りたたむ',
    noDeliveries: '配達記録はありません。',
    noAttempts: '試みは記録されていない。',
    columns: {
      source: 'ソース',
      notificationId: '通知ID',
      status: '状態',
      deliveries: '配送',
      created: '作成しました',
      channel: 'チャンネル',
      provider: 'プロバイダー',
      attempts: '試み',
      updated: '更新しました',
    },
  },
  test: {
    title: 'テスト通知を送信する',
    description:
      '配送方法を選択し、「送信」をクリックします。メッセージは指定した受信者に送信され、以下に記録されます。',
    close: 'テスト通知ダイアログを閉じる',
    loadingProviders: '設定されたプロバイダーを読み込み中…',
    noProviders: '有効なプロバイダーが設定されていません。',
    channelProvider: '配送方法',
    selectProvider: '配送方法を選択してください',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: '受信者',
    userIdPlaceholder: 'ユーザーID',
    emailHelp: 'このテストを受信する電子メール アドレス。',
    userHelp: 'このアプリ内メッセージを受信するユーザー ID。',
    messageTitle: 'タイトル',
    message: 'メッセージ',
    cancel: 'キャンセル',
    sending: '送信中…',
    send: '送信',
    defaultTitle: 'NocoBase 通知テスト',
    defaultBody: 'NocoBaseからのテスト通知です。',
    accepted: 'テスト通知 {{id}} が受理されました。',
  },
  status: {
    pending: '保留中',
    processing: '加工',
    completed: '完了しました',
    partial: '部分的',
    failed: '失敗しました',
    unknown: '不明',
    preparing: '準備中',
    submitting: '送信中',
    retrying: '再試行中',
    accepted: '承認されました',
  },
  errors: {
    requestFailed: '通知リクエストが失敗しました。',
    inAppRecipientNotFound: 'アプリ内通知の受信者が存在しません。',
  },
};

export default jaJP;
