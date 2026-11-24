import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

import pagesZhTW from '../../shared/locales/pages.zh-TW.js';

const zhTW: LocaleResource<typeof enUS> = {
  access: pagesZhTW.access,
  errors: {
    originalNotFound: '郵件服務供應商已無法提供該原始郵件。',
    originalTooLarge: '原始郵件超出 40 MiB 的下載上限。',
    operationUnsupported: '此郵件操作無法使用。',
    connectionAuthenticationFailed:
      '{{protocol}} 驗證失敗，請檢查登入名稱和密碼或應用程式專用密碼。',
    connectionHostNotFound:
      '無法解析 {{protocol}} 主機，請檢查伺服器主機名稱。',
    connectionConnectionRefused:
      '{{protocol}} 連線遭拒，請檢查主機、連接埠和伺服器狀態。',
    connectionConnectionTimeout:
      '{{protocol}} 連線逾時，請檢查伺服器和網路設定。',
    connectionCertificateInvalid:
      '{{protocol}} 憑證驗證失敗，請檢查憑證和主機名稱。',
    connectionTlsFailed:
      '{{protocol}} TLS 協商失敗，請檢查 SSL/STARTTLS 設定和連接埠。',
    connectionConnectionFailed:
      '{{protocol}} 連線失敗，請檢查伺服器和網路設定。',
    connectionConnectionLost: '{{protocol}} 連線已中斷，請重試。',

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
