import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    generic: '問題が発生しました。もう一度試してください。',
    network:
      'サーバーに接続できませんでした。接続を確認して、もう一度試してください。',
    rateLimited:
      '試行回数が多すぎます。しばらく待ってから、もう一度試してください。',
    INVALID_EMAIL_OR_PASSWORD:
      'メールアドレスまたはパスワードが間違っています。',
    INVALID_USERNAME_OR_PASSWORD:
      'ユーザー名またはパスワードが正しくありません。',
    INVALID_PASSWORD: 'パスワードが正しくありません。',
    INVALID_EMAIL: '有効なメールアドレスを入力してください。',
    INVALID_USERNAME:
      'ユーザー名には文字、数字、アンダースコア、ドットのみを含めることができます。',
    USERNAME_TOO_SHORT: 'このユーザー名は短すぎます。',
    USERNAME_TOO_LONG: 'このユーザー名は長すぎます。',
    USERNAME_IS_ALREADY_TAKEN: 'このユーザー名はすでに使用されています。',
    USER_ALREADY_EXISTS: 'このメールアドレスのアカウントはすでに存在します。',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'このメールアドレスのアカウントはすでに存在します。別のメールアドレスを使用してください。',
    PASSWORD_TOO_SHORT: 'このパスワードは短すぎます。',
    RESET_PASSWORD_DISABLED:
      'セルフサービスによるパスワードのリセットが有効になっていません。管理者に連絡してパスワードをリセットしてください。',
    PASSWORD_TOO_LONG: 'このパスワードは長すぎます。',
    EMAIL_NOT_VERIFIED: 'サインインする前にメールアドレスを確認してください。',
    INVALID_TOKEN: 'このリンクは無効であるか、有効期限が切れています。',
    TOKEN_EXPIRED: 'このリンクの有効期限は切れています。',
    ACCOUNT_DISABLED:
      'このアカウントは無効になっています。管理者に連絡してください。',
    SERVICE_ACCOUNT_NO_LOGIN:
      'サービス アカウントはサインインできません。 API キーを通じてのみ機能します。',
    invalidOriginWithAddress:
      'この発信元は信頼できません。 config.yml の app.publicOrigin を {{origin}} に設定し、アプリケーションを再起動して、再試行してください。',
    INVALID_ORIGIN:
      'この発信元は信頼できません。 config.yml の app.publicOrigin を確認し、アプリケーションを再起動して、再試行してください。',
    INVALID_CSRF_ORIGIN:
      'このリクエストは別のサイトから来たもので拒否されました。ページをリロードして、もう一度お試しください。',
  },
};

export default jaJP;
