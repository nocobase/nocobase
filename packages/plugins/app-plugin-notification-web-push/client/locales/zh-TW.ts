import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
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
  'push.testSent': '測試通知已排隊',
  'push.failed': '無法更新推播通知。請再試一次。',
  'push.loadingFailed': '無法載入裝置。請再試一次。',
  'push.retry': '重試',
};

export default zhTW;
