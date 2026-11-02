import type { NotificationResource } from './en-US.js';

const zhTW: NotificationResource = {
  logs: {
    deliveryOperations: '送貨業務',
    recipeDescription: '追蹤每個通道切換和每個提供者嘗試。',
    redacted: '訊息正文、收件人和租賃代幣已被編輯。',
    providerAttempts: '提供者嘗試',
    eyebrow: '通知',
    title: '通知日誌',
    description:
      '追蹤通知傳遞和每個提供者的嘗試。訊息正文、收件人和租賃令牌均經過編輯。',
    refreshing: '清爽…',
    refresh: '重新整理',
    deliveriesShown: '顯示的交付量',
    needAttention: '需要注意',
    unavailable: '日誌不可用',
    recent: '最近通知',
    loading: '正在載入交付歷史記錄...',
    emptyTitle: '尚未出貨',
    emptyDescription: '通知發出後，此處會顯示送貨記錄。',
    expand: '展開通知',
    collapse: '折疊通知',
    noDeliveries: '沒有交付記錄。',
    noAttempts: '沒有嘗試記錄。',
    columns: {
      source: '來源',
      notificationId: '通知 ID',
      status: '狀態',
      deliveries: '交付',
      created: '已建立',
      channel: '頻道',
      provider: '提供者',
      attempts: '嘗試',
      updated: '已更新',
    },
  },
  status: {
    pending: '待定',
    processing: '加工',
    completed: '已完成',
    partial: '部分',
    failed: '失敗',
    unknown: '未知',
    preparing: '準備中',
    submitting: '提交',
    retrying: '重試',
    accepted: '已接受',
  },
  errors: {
    requestFailed: '通知請求失敗。',
    inAppRecipientNotFound: '應用程式內通知收件人不存在。',
  },
};

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: zhTW,
};
export default resource;
