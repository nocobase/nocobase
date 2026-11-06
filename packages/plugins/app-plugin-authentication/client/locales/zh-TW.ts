import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    generic: '出了點問題。請再試一次。',
    network: '無法到達伺服器。檢查您的連線並重試。',
    rateLimited: '嘗試次數過多。請稍等片刻，然後重試。',
    INVALID_EMAIL_OR_PASSWORD: '電子郵件或密碼不正確。',
    INVALID_USERNAME_OR_PASSWORD: '使用者名稱或密碼不正確。',
    INVALID_PASSWORD: '密碼錯誤。',
    INVALID_EMAIL: '輸入有效的電子郵件地址。',
    INVALID_USERNAME: '使用者名稱只能包含字母、數字、下劃線和點。',
    USERNAME_TOO_SHORT: '該使用者名太短。',
    USERNAME_TOO_LONG: '該使用者名太長。',
    USERNAME_IS_ALREADY_TAKEN: '該使用者名已被佔用。',
    USER_ALREADY_EXISTS: '使用此電子郵件的帳戶已存在。',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      '使用此電子郵件的帳戶已存在。使用另一封電子郵件。',
    PASSWORD_TOO_SHORT: '該密碼太短。',
    RESET_PASSWORD_DISABLED: '自助密碼重設未啟用。請聯絡管理員重設您的密碼。',
    PASSWORD_TOO_LONG: '該密碼太長。',
    EMAIL_NOT_VERIFIED: '登入前驗證您的電子郵件地址。',
    INVALID_TOKEN: '此連結無效或已過期。',
    TOKEN_EXPIRED: '此連結已過期。',
    ACCOUNT_DISABLED: '該帳號已被停用。請聯絡您的管理員。',
    SERVICE_ACCOUNT_NO_LOGIN: '服務帳號無法登入；它只能通過 API 鍵起作用。',
    invalidOriginWithAddress:
      '此來源不受信任。將config.yml中的app.publicOrigin設定為{{origin}}，重新啟動應用程式，然後再試一次。',
    INVALID_ORIGIN:
      '此來源不受信任。檢查config.yml中的app.publicOrigin，重新啟動應用程式，然後再試一次。',
    INVALID_CSRF_ORIGIN: '此請求來自另一個站點，但被拒絕。重新載入頁面並重試。',
  },
};

export default zhTW;
