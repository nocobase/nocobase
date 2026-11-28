import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  'push.deviceCount': '已登記 {{total}} 台 · 已啟用 {{active}} 台',
  'push.active': '已啟用',
  'push.paused': '已暫停',
  'push.pause': '暫停',
  'push.resume': '恢復',
  'push.title': '推播通知',
  'push.description': '在每臺裝置上接收提醒，即使應用程式關閉時也是如此。',
  'push.subscribe': '訂閱該裝置',
  'push.name': '裝置名稱',
  'push.empty': '沒有訂閱的裝置',
  'push.emptyHint': '訂閱此裝置以在應用程式關閉時接收提醒。',
  'push.ios':
    '在 iOS 或 iPadOS 16.4 或更高版本上，開啟 Safari 的共享選單，選擇“新增至主畫面”，然後從其圖示開啟應用程式進行訂閱。',
  'push.unsupported': '推送需要 HTTPS 和支援 Web Push 的瀏覽器。',
  'push.unavailable': '未配置推送。請求管理員配置 VAPID 和金鑰。',
  'push.denied': '通知被阻止。在瀏覽器的網站設定中允許它們，然後重試。',
  'push.current': '該裝置',
  'push.more': '裝置操作',
  'push.test': '傳送測試通知',
  'push.remove': '刪除',
  'push.removeTitle': '刪除裝置「{{name}}」？',
  'push.removeHint': '此裝置將停止接收推播通知。您可以從該裝置再次訂閱。',
  'push.cancel': '取消',
  'push.saved': '已儲存裝置設定',
  'push.saving': '儲存裝置設定',
  'push.testSent': '推播服務已接受測試通知。',
  'push.invalid': '瀏覽器傳回的訂閱資訊無效，請重新訂閱。',
  'push.endpoint': '伺服器暫不支援此瀏覽器使用的推播服務。',
  'push.owned': '此瀏覽器的訂閱屬於另一個帳號。請先從原帳號移除，再重新訂閱。',
  'push.browserFailed':
    '瀏覽器無法建立推播訂閱。請檢查瀏覽器的通知設定和網路連線。',
  'push.expired': '此裝置訂閱已過期或已被移除，請在該裝置上重新訂閱。',
  'push.testPaused': '請先恢復此裝置的推播，再傳送測試通知。',
  'push.testLimited': '兩次測試通知之間請間隔 30 秒。',
  'push.testNetwork':
    '伺服器無法連線至推播服務。請聯絡管理員檢查網路和 Web Push 代理。',
  'push.testGatewayAuth':
    '推播服務拒絕了伺服器的憑證。請聯絡管理員檢查 VAPID 金鑰。',
  'push.testGatewayLimited': '推播服務限制了請求頻率，請稍後再試。',
  'push.testGateway': '推播服務目前無法接受測試通知，請稍後再試。',
  'push.failed': '無法更新推播通知。請再試一次。',
  'push.loadingFailed': '無法載入裝置。請再試一次。',
  'push.retry': '重試',
  'channelType.title': '瀏覽器推播',
  'channelType.testHint':
    '傳一則測試通知到你開啟推播的瀏覽器。請先在個人設定 › 通知中開啟。',
};

export default zhTW;
