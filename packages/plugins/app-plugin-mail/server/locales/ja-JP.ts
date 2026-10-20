import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    accessDenied: 'メールアクセスが必要です。',
    idempotencyConflict:
      '冪等キーはすでに別のリクエストに関連付けられています。',
    invalidRequest: 'メールリクエストが無効です。',
    accountCredentialsInvalid:
      'メールボックスの認証に失敗しました。ログイン名とパスワード、または認証コードを確認し、IMAP/SMTP が有効になっていることを確認してください。 Gmail およびその他のサービスでは、アプリのパスワードが必要になる場合があります。',
    requestFailed: 'メールリクエストを完了できませんでした。',
    providerRateLimited:
      'メールサービスのリクエストが多すぎます。後でもう一度試してください。',
    providerUnavailable:
      'メールサービスに接続できませんでした。後でもう一度試してください。',
    reauthorizationRequired:
      'このメール アカウントを使用するには、再接続する必要があります。',
    syncRunNotFound: 'メール同期実行が見つかりませんでした。',
    messageNotFound: 'メールメッセージが見つかりませんでした。',
    authorizationStateRequired: 'メール認証状態が必要です。',
  },
};

export default jaJP;
