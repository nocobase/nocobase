import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

import pagesJaJP from '../../shared/locales/pages.ja-JP.js';

const jaJP: LocaleResource<typeof enUS> = {
  access: pagesJaJP.access,
  errors: {
    originalNotFound:
      '元のメッセージはメールプロバイダーで利用できなくなりました。',
    originalTooLarge:
      '元のメッセージはダウンロード上限の 40 MiB を超えています。',
    operationUnsupported: 'このメール操作は利用できません。',
    connectionAuthenticationFailed:
      '{{protocol}} 認証に失敗しました。ログイン名とパスワードまたはアプリパスワードを確認してください。',
    connectionHostNotFound:
      '{{protocol}} ホストを解決できません。サーバーのホスト名を確認してください。',
    connectionConnectionRefused:
      '{{protocol}} 接続が拒否されました。ホスト、ポート、サーバーの状態を確認してください。',
    connectionConnectionTimeout:
      '{{protocol}} 接続がタイムアウトしました。サーバーとネットワーク設定を確認してください。',
    connectionCertificateInvalid:
      '{{protocol}} 証明書の検証に失敗しました。証明書とホスト名を確認してください。',
    connectionTlsFailed:
      '{{protocol}} TLS ネゴシエーションに失敗しました。SSL/STARTTLS 設定とポートを確認してください。',
    connectionConnectionFailed:
      '{{protocol}} 接続に失敗しました。サーバーとネットワーク設定を確認してください。',
    connectionConnectionLost:
      '{{protocol}} 接続が切断されました。もう一度お試しください。',

    imapMoveLocationChanged:
      '選択したフォルダーまたはコピーが変更されました。メールボックスを同期し、移動元のフォルダーを開き直してください。',
    imapMoveNotWritable:
      '選択したフォルダーではこの操作が許可されていません。メールボックスの権限を確認してください。',
    imapMoveSourceRequired:
      'このメッセージを移動または削除する前に、移動元のフォルダーを開いてください。',
    imapMoveUnsupported:
      'このサーバーではメッセージを安全に移動できません。メールクライアントで操作してください。',
    imapTrashNotFound:
      'このアカウントにはゴミ箱フォルダーがありません。メールクライアントで操作してください。',
    imapMoveOutcomeUnknown:
      '移動が未完了か、結果が不明です。再試行する前にメールボックスを確認してください。',
    invalidRecipient:
      '送信する前に、宛先のメールアドレスと表示名を修正してください。',
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
