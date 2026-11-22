import type { MailPagesResource } from './pages.en-US.js';

const pagesJaJP: MailPagesResource = {
  navigation: {
    mail: 'メール',
    mailTeam: 'チームメール',
    mailAccounts: 'メールアカウント',
    mailAccountsDescription:
      'メールボックスを接続し、署名、テンプレート、ラベルを管理します。',
    mailSettings: 'メール',
    mailSettingsDescription:
      'メールプロバイダー、各アカウントの状態、同期ログと送信ログ。',
  },
  access: {
    section: 'メール',
    team: {
      title: 'チームメール',
      description: 'メンバーが同期したメール（閲覧のみ）。',
      actions: {
        view: '表示',
        process: '処理（既読にする、スター、アーカイブ）',
      },
    },
    settings: {
      title: 'メール',
      actions: {
        read: '表示',
        manage: '管理（メンバーの同期と送信の再試行・キャンセル）',
      },
    },
  },
  pages: {
    loading: '読み込み中…',
    empty: '表示する項目はありません。',
    member: 'メンバー',
    allMembers: 'すべてのメンバー',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} を再接続する必要があります。再接続するまで同期も送信も行われません。',
      reauthorize: 'メールアカウントで再接続',
      needsReauthorization: '再認証が必要',
    },
    accounts: {
      title: 'メールアカウント',
      description:
        'メールボックスを接続すると、メールで送受信できます。あなたのメールはあなただけが見られます。チームメールの権限を持つ人は変更せずに閲覧できます。',
      reauthorizationNotice:
        '{{addresses}} の認証は受け付けられなくなりました。同じプロバイダーで再接続するまで、同期も送信も行われません。',
      reauthorize: '再接続',
      tabs: {
        accounts: 'アカウント',
        signatures: '署名',
        templates: 'テンプレート',
        labels: 'ラベル',
        activity: 'アクティビティ',
      },
    },
    activity: {
      sends: '送信',
      syncs: '同期',
    },
    logs: {
      started: '開始日時',
      time: '日時',
      account: 'アカウント',
      accountMember: 'アカウント · メンバー',
      mode: 'モード',
      initial: '初回同期',
      incremental: '差分同期',
      result: '結果',
      allResults: 'すべての結果',
      detail: '詳細',
      reason: '理由',
      processed: '{{count}} 件のメッセージ',
      subject: '件名',
      recipients: '宛先',
      recipientCount: '宛先',
      bulk: '一括送信',
      bulkCount: '{{count}}（一括）',
      showRecipients: '受信者を表示',
      hideRecipients: '受信者を隠す',
      scheduled: '予約送信',
      retry: '再試行',
      cancel: 'キャンセル',
      window: '期間',
      windows: {
        day: '過去 24 時間',
        week: '過去 7 日間',
        month: '過去 30 日間',
        all: '全期間',
      },
    },
    team: {
      title: 'チームメール',
      description:
        'メンバーが同期したメールを、引き継ぎやコンプライアンス確認のために閲覧します。メッセージを開いても既読にはならず、返信もできません。',
      account: 'アカウント',
      allAccounts: 'すべてのアカウント',
      participant: 'アドレスまたは @ドメイン',
      keyword: '件名のキーワード',
      memberAccount: 'メンバー · アカウント',
      counterpart: '相手',
      view: '表示',
      selectAll: 'このページをすべて選択',
      empty: '一致する同期済みメールはありません。',
      readOnly: '閲覧のみ。開いても既読にはなりません。',
      applied: '{{succeeded}} 件を更新、{{failed}} 件が失敗しました。',
      actions: {
        markRead: '既読にする',
        star: 'スター',
        archive: 'アーカイブ',
      },
    },
    settings: {
      title: 'メール',
      description:
        'メンバーが接続できるメールプロバイダーと、各アカウントの接続・同期・送信の状態です。メッセージの内容はここには表示されません。システム通知メールは「通知」で設定します。',
      tabs: {
        providers: 'プロバイダー',
        accounts: 'アカウント',
        syncRuns: '同期ログ',
        submissions: '送信ログ',
        runtime: '実行時設定',
      },
      sources: {
        environment: '環境変数',
        config: 'config.yml',
        default: 'デフォルト',
        code: 'コード',
        unknown: '不明',
      },
      providers: {
        name: '名前',
        type: '種類',
        capabilities: '機能',
        accounts: 'アカウント',
        source: 'ソース',
        attention: '{{count}} 件が再認証を必要としています',
        howTo: 'プロバイダーの追加方法',
        howToDescription:
          'アプリケーション設定の mail.providers にエントリを追加し、シークレットは環境変数に保存します。アプリケーションを再起動すると反映されます。',
        callbackHint:
          'この OAuth リダイレクト URL を Google または Microsoft に登録してください：',
      },
      accounts: {
        filter: {
          all: 'すべて',
          attention: '再認証が必要',
          suspended: '無効化済み',
        },
        provider: 'プロバイダー',
        allProviders: 'すべてのプロバイダー',
        search: 'メンバーまたはアドレス',
        lastSynced: '最終同期',
        status: '状態',
        showRuns: '同期履歴',
        note: '管理者はメンバーのアカウントを認証したり削除したりできません。メンバーは「個人設定 › メールアカウント」で自分のアカウントを再接続します。',
      },
      runtime: {
        setting: '設定',
        value: '現在の値',
        effect: '影響',
        automaticSyncInterval: '自動同期の間隔',
        automaticSyncIntervalEffect:
          'プッシュ通知のないアカウントで新着メールを確認する頻度です。',
        syncBatchSize: '同期バッチあたりのメッセージ数',
        syncBatchSizeEffect:
          'バッチを大きくすると初回同期は早く終わりますが、プロバイダーのレート制限に達しやすくなります。',
        oauthCallbackUrl: 'OAuth リダイレクト URL',
        oauthCallbackUrlEffect:
          'Google または Microsoft の開発者コンソールに登録してください。',
        oauthReturnUrl: '認証後のページ',
        oauthReturnUrlEffect: 'OAuth アカウントを接続した後に戻るページです。',
        pushWebhook: 'プッシュ Webhook',
        pushWebhookEffect:
          '未設定の場合、Gmail と Microsoft 365 も同期間隔で確認されます。',
        jobs: 'バックグラウンドジョブ',
        jobsEffect: '複数インスタンスでのデプロイには共有キューが必要です。',
        logRetention: 'ログの保持期間',
        logRetentionEffect:
          'これより古い完了済みの同期履歴と送信は自動的に削除されます。',
        credentialVault: '認証情報の保存先',
        credentialVaultEffect:
          '接続済みアカウントの OAuth トークンとパスワードの保存場所です。',
        minutes: '{{count}} 分',
        days: '{{count}} 日',
        keepForever: '無期限に保持',
        notConfigured: '未設定',
        secretConfigured: 'シークレット設定済み',
        secretMissing: 'シークレット未設定',
        jobsDefault: 'jobs.default に従う',
        vaultBuiltin: '組み込み（アプリケーションのデータベース内）',
        vaultApplication: 'アプリケーションが登録',
        copy: 'コピー',
        copied: 'コピーしました',
        readOnly:
          '閲覧のみ：これらの設定は config.yml と MAIL_* 環境変数から読み込まれ、再起動後に反映されます。',
      },
    },
  },
};

export default pagesJaJP;
