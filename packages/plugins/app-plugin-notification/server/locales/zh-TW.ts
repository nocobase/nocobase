import type { NotificationServerResource } from './en-US.js';

const zhTW: NotificationServerResource = {
  errors: {
    logNotFound: '找不到通知日誌。',
    kindNotFound: '找不到通知類型。',
    channelNotFound: '沒有名為「{{name}}」的已啟用通知管道。',
    channelTestUnsupported: '「{{name}}」管道無法傳送測試訊息。',
    channelNoRecipient: '「{{name}}」管道沒有你的收件地址或裝置。',
    deliveryNotFound: '找不到投遞記錄。',
    deliveryNotRetryable:
      '這筆投遞無法重試：只有失敗且管道未變動的投遞可以重試。',
    retryReasonRequired: '請填寫重試原因。',
    preferenceUnknown: '這種通知沒有這個管道。',
    preferenceRequired: '這種通知一律透過這個管道傳送，無法關閉。',
  },
  test: {
    title: '測試通知',
    body: '這是從「設定 › 通知」為「{{channel}}」管道傳送的測試。',
  },
  authorization: {
    section: '訊息',
    title: '通知',
    read: '檢視',
    manage: '管理',
  },
};

export default zhTW;
