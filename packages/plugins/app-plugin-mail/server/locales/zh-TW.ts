import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    imapMoveLocationChanged:
      '所選資料夾或副本已變更，請同步信箱後重新開啟來源資料夾。',
    imapMoveNotWritable: '所選資料夾不允許此操作，請檢查信箱權限。',
    imapMoveSourceRequired: '請開啟來源資料夾後再移動或刪除這封郵件。',
    imapMoveUnsupported: '此信箱不支援安全移動，請到郵件用戶端中操作。',
    imapTrashNotFound: '此信箱沒有垃圾桶資料夾，請到郵件用戶端中操作。',
    imapMoveOutcomeUnknown:
      '移動尚未完成或結果未知，請先核對遠端信箱，勿盲目重試。',
    invalidRecipient: '請修正收件人電子郵件地址和顯示名稱後再傳送。',
    accessDenied: '需要郵件存取許可權。',
    idempotencyConflict: '冪等金鑰已與另一個請求關聯。',
    invalidRequest: '郵件請求無效。',
    accountCredentialsInvalid:
      '信箱認證失敗。檢查您的登入名稱和密碼或授權碼，並確認IMAP/SMTP已啟用。 Gmail和其他服務可能需要應用程式密碼。',
    requestFailed: '郵件請求無法完成。',
    providerRateLimited: '郵件服務收到太多請求。稍後再試。',
    providerUnavailable: '無法存取郵件服務。稍後再試。',
    reauthorizationRequired: '該郵件帳號必須重新連線才能使用。',
    syncRunNotFound: '未找到郵件同步執行。',
    messageNotFound: '未找到郵件訊息。',
    authorizationStateRequired: '需要郵件授權狀態。',
  },
};

export default zhTW;
