import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  page: {
    loading: '読み込み中',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'ユーザー',
      category: 'アカウント',
      name: 'ユーザー招待',
      trigger:
        '管理者がメールを選択してユーザーを招待したとき、または招待を再送信したとき。',
      recipients:
        '招待された人。その人用に入力されたメールアドレスに送信されます。',
      businessRule:
        'メールを選択して招待を作成または再送信するたびに送信されます。個別にオフにする設定はありません。',
      languagePolicy:
        'メール本文にはすべての言語が順に記載されます。件名は英語です。',
      channel: '招待メールの送信設定',
      variables: {
        app: 'アプリケーション名',
        inviter: '招待を送った人の名前',
        items: '招待で付与されるロールまたはアクセス権',
        date: '招待の有効期限',
        url: '招待を承諾するためのリンク（プレビューでは架空のリンクを使用）',
      },
    },
  },
  accept: {
    title: '招待を受ける',
    description: '{{inviter}} さんがあなたを招待しました。',
    summary: 'あなたも参加します: {{items}}',
    loading: '招待状を読み込んでいます…',
    email: 'メール',
    name: '名前',
    username: 'ユーザー名（任意）',
    usernameHint: 'このユーザー名でログインできます。',
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
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？ログイン',
    goToLogin: 'サインインに移動',
    errors: {
      notFound: 'この招待リンクは無効です。',
      expired:
        'この招待状の有効期限は切れています。新しいものを求めてください。',
      accepted: 'この招待はすでに承諾されています。',
      revoked: 'この招待は取り消されました。',
      password: 'パスワードが要件を満たしていません。',
      usernameConflict:
        'このユーザー名はユーザー名またはメールアドレスとして使用されています。別の名前を選んでください。',
      accountConflict: 'このアドレスではアカウントを作成できません。',
      failed: '問題が発生しました。もう一度試してください。',
    },
  },
};

export default jaJP;
