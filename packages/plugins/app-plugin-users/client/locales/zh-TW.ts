import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  page: {
    loading: '載入中',
  },
  notificationTemplates: {
    invitation: {
      contributor: '使用者',
      category: '帳號',
      name: '使用者邀請',
      trigger: '管理員邀請成員或重新傳送邀請，並選擇以電子郵件傳送時。',
      recipients: '被邀請的人，傳送到為其填寫的電子郵件地址。',
      businessRule:
        '每次建立或重新傳送邀請並選擇電子郵件時都會傳送，沒有單獨的開關可以關閉。',
      languagePolicy:
        '郵件只使用一種語言，在邀請時決定：預設為邀請人的介面語言，也可以另選。重新寄送沿用同一語言。如果該語言沒有郵件文案，郵件改用應用程式預設語言和英文。',
      channel: '邀請郵件寄件設定',
      variables: {
        app: '應用名稱',
        inviter: '發出邀請的人的名字',
        items: '邀請授予的角色或權限',
        date: '邀請的到期時間，依郵件語言顯示，時區為 UTC',
        url: '接受邀請的連結；預覽中使用虛構連結',
      },
    },
  },
  accept: {
    title: '接受邀請',
    language: '語言',
    description: '{{inviter}} 邀請你。',
    summary: '您還將加入：{{items}}',
    loading: '正在載入邀請...',
    email: '電子郵件',
    name: '名稱',
    username: '使用者名稱（選填）',
    usernameHint: '填寫後可使用此名稱登入。',
    password: '密碼',
    nameRequired: '輸入您的姓名。',
    passwordTooShort: '密碼至少需要{{min}}個字元。',
    submit: '建立帳戶並加入',
    join: '接受邀請',
    submitting: '加入…',
    signedIn: '您以 {{name}} 登入。退出以使用新帳戶接受此邀請。',
    signOut: '登出',
    signOutFailed: '無法登出。',
    existingAccount: '該地址已有賬戶。使用它登入以繼續。',
    alreadyHaveAccount: '已有帳號？前往登入',
    goToLogin: '前往登入',
    errors: {
      notFound: '此邀請連結無效。',
      expired: '此邀請已過期。要求換一張新的。',
      accepted: '此邀請已被接受。',
      revoked: '此邀請已撤銷。',
      password: '密碼不符合要求。',
      usernameConflict: '此名稱已被用作使用者名稱或電子郵件，請換一個。',
      accountConflict: '無法建立具有此位址的帳戶。',
      failed: '出了點問題。請再試一次。',
    },
  },
};

export default zhTW;
