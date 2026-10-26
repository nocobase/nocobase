import type { NotificationResource } from './en-US.js';

const jaJP: NotificationResource = {
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

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: jaJP,
};
export default resource;
