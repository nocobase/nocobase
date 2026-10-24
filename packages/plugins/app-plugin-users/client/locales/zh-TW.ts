import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  page: {
    loading: '載入中',
  },
  accept: {
    title: '接受邀請',
    description: '{{inviter}} 邀請你。',
    summary: '您還將加入：{{items}}',
    loading: '正在載入邀請...',
    email: '電子郵件',
    name: '名稱',
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
    goToLogin: '前往登入',
    errors: {
      notFound: '此邀請連結無效。',
      expired: '此邀請已過期。要求換一張新的。',
      accepted: '此邀請已被接受。',
      revoked: '此邀請已撤銷。',
      password: '密碼不符合要求。',
      accountConflict: '無法建立具有此位址的帳戶。',
      failed: '出了點問題。請再試一次。',
    },
  },
};

export default zhTW;
