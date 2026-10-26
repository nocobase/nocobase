import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    retryUnavailable:
      '待機中の入力を順番に送信してください。最後に中断した入力または次の撤回済み入力だけを再送信できます。',
    stopTargetChanged:
      '現在のターンが変わりました。更新してから停止してください。',
    promptNotFound: 'この ID を持つメッセージはセッション内に存在しません。',
    promptStarted:
      'メッセージの処理が開始されたため、取り消すことができません。',
    withdrawalUnsupported:
      'この古いメッセージは安全に取り消すことができません。コマンドラインを更新し、コンピュータ接続を再起動します。',
    bridgeReplaced:
      '別のブリッジがこのコンピュータを登録しました。この接続を再起動します。',
    submissionConflict: 'この送信IDはすでに別のリクエストで使用されています。',
    authenticationRequired:
      'エージェントセッションを使用するにはサインインしてください。',
    computerNotFound:
      'この ID を持つコンピュータはあなたのアカウントに接続されていません。',
    sessionNotFound: 'この ID のセッションはあなたのものではありません。',
    computerOffline:
      'コンピューターはオフラインです。その上でブリッジを開始してから、再試行してください。',
    agentUnavailable: 'コンピュータはこのエージェントを実行できません。',
    directoryNotAllowed:
      'このコンピュータ上のセッションは、ブリッジが許可するディレクトリの下でのみ機能します。',
    sessionArchived:
      'セッションはアーカイブされます。まずは元に戻してください。',
    permissionRequestNotFound:
      'この許可リクエストはすでに回答されているか、もう待機していません。',
    choiceNotFound: 'エージェントはこの選択肢や値を提供しません。',
    linkNotFound:
      'この ID を持つこの種のものはセッションに関連付けられていない、またはセッションの作業をここから開始することはできません。',
    invalidPageToken:
      'ページトークンはこのリストによって発行されませんでした。',
    upgradeRequired:
      'ブリッジは別のプロトコル バージョンを話します。このコンピュータのコマンド ラインを更新します。',
    computerNotAnswering:
      'コンピュータの応答が間に合いませんでした。接続が実行中であることを確認してから、再試行してください。',
    folderUnavailable: 'パソコン上でフォルダーを開けません。',
    discoveryFailed:
      'エージェント設定を読み込めませんでした。このコンピュータ上のエージェントを確認して、再試行してください。',
    projectNotFound: '該当するプロジェクトが存在しないか、ご覧いただけません。',
    referenceNotFound:
      '言及されているものは存在しないか、見ることができません。',
    imageNotFound: 'この名前の画像はセッション中に送信されませんでした。',
    computerKeyInvalid:
      'このコンピュータはもう接続されていません。削除されたか、別の場所から再度接続されました。再度接続するには、`acp start` を実行します。',
  },
};

export default jaJP;
