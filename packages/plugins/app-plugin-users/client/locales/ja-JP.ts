import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  page: {
    loading: '読み込み中',
  },
  accept: {
    title: '招待を受ける',
    description: '{{inviter}} さんがあなたを招待しました。',
    summary: 'あなたも参加します: {{items}}',
    loading: '招待状を読み込んでいます…',
    email: 'メール',
    name: '名前',
    password: 'パスワード',
    nameRequired: 'あなたの名前を入力してください。',
    passwordTooShort: 'パスワードには少なくとも {{min}} 文字が必要です。',
    submit: 'アカウントを作成して参加する',
    join: '招待を受ける',
    submitting: '参加中…',
    signedIn:
      '{{name}} としてサインインしています。新しいアカウントでサインアウトしてこの招待を受け入れます。',
    signOut: 'サインアウト',
    signOutFailed: 'サインアウトできませんでした。',
    existingAccount:
      'このアドレスにはすでにアカウントがあります。続行するには、サインインしてください。',
    goToLogin: 'サインインに移動',
    errors: {
      notFound: 'この招待リンクは無効です。',
      expired:
        'この招待状の有効期限は切れています。新しいものを求めてください。',
      accepted: 'この招待はすでに承諾されています。',
      revoked: 'この招待は取り消されました。',
      password: 'パスワードが要件を満たしていません。',
      accountConflict: 'このアドレスではアカウントを作成できません。',
      failed: '問題が発生しました。もう一度試してください。',
    },
  },
};

export default jaJP;
