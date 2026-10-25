import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'デモデータ',
    read: '表示',
    manage: '生成と消去',
    configuration: 'デモ設定',
    configure: '設定',
  },
  menu: {
    label: 'デモモード',
    switchAccount: 'アカウントを切り替え',
    title: 'これはデモ環境です',
    description: 'データは毎日自動的にリセットされ、変更は保存されません。',
    accountsDescription:
      '以下のアカウントに切り替えて、各ロールで表示される内容を確認できます。',
    loading: 'アカウントを読み込み中…',
  },
  accounts: {
    title: 'アカウント',
    description:
      'いずれかのアカウントでデモに入り、それぞれの役割から見た画面を確認できます。',
    enter: '入る',
    current: '現在',
    entering: '入っています…',
    failed: 'このアカウントにログインできませんでした。',
    unavailable: '現在ログインできるアカウントはありません。',
    password: 'パスワードでサインイン',
  },
  refused: {
    title: 'デモのため変更を保存できません。',
    description: 'その他の機能は通常どおり利用できます。',
  },
  settings: {
    title: 'デモ環境',
    refresh: '更新',
    retry: '再試行',
    busy: 'デモデータを生成またはクリアしています',
    busyHelp: '現在のデータ操作が完了してから、次の操作を開始してください。',
    disabled: {
      title: 'このアプリはデモではありません',
      help: 'デモモードはオフです。デプロイ時に NOCOBASE_DEMO_MODE=true でオンにします。',
    },
    cancel: 'キャンセル',
    errors: {
      failed: 'リクエストが完了しませんでした。もう一度お試しください。',
      conflict: '別の管理者が先にこの設定を保存しました。',
      busy: 'デモデータを生成またはクリアしています。完了してからお試しください。',
      exists: 'デモデータは生成済みです。リセットを使ってください。',
      demoModeRequired: 'デモモードがオンのときだけ実行できます。',
      accountConflict:
        'デモのユーザー名が、デモの所有でないアカウントに使われています。',
      unavailable: 'このアプリにはデモデータがありません。',
      signedOut: 'セッションが終了しました。もう一度サインインしてください。',
      denied: 'デモを管理する権限がありません。',
    },
    data: {
      title: 'デモデータ',
      state: {
        importing: '生成中',
        clearing: 'クリア中',
        resetting: 'リセット中',
        failed: '失敗',
        ready: '準備完了',
        none: '未生成',
      },
      presentSummary: '{{language}} · {{time}} に生成',
      resettingSummary:
        '現在のデータをクリアし、{{language}}で再生成しています。',
      phase: {
        clearing: 'クリア中',
        generating: '再生成中',
      },
      absentSummary:
        'デモデータを生成すると、訪問者が一連の業務シナリオでアプリを試せます。',
      language: '言語',
      clear: 'クリア',
      reset: 'リセット',
      generate: '生成',
      failed: '前回の実行が完了しませんでした',
      readOnly:
        'デモデータは閲覧できます。生成・リセット・クリアには管理権限が必要です。',
      unavailable: 'デモデータなし',
      unavailableHelp: 'このアプリはデモデータセットを登録していません。',
      cleared: 'デモデータをクリアしました',
      resetStarted: 'デモデータをリセットしています',
      importStarted: 'デモデータを生成しています',
      confirm: {
        import: {
          title: 'デモデータを生成しますか？',
          description:
            '{{language}}でデモデータを生成し、そのデモアカウントを有効にします。',
        },
        reset: {
          title: 'デモデータをリセットしますか？',
          description:
            'このインスタンスの業務データ（訪問者が追加したものを含む）をすべて削除し、{{language}}でデモデータを再生成します。',
        },
        clear: {
          title: 'デモデータをクリアしますか？',
          description:
            'このインスタンスの業務データ（訪問者が追加したものを含む）をすべて削除し、デモアカウントを無効にします。設定と管理者は残ります。',
        },
      },
    },
    visitors: {
      unavailable: '現在ログインできるアカウントはありません。',
      title: 'アカウント',
      username: 'ユーザー名 {{username}}',
      copyLink: 'リンクをコピー',
      copyLinkFor: '{{name}} の入口リンクをコピー',
      openFor: '{{name}} としてデモを開く',
      copied: 'コピーしました',
      copyFailed:
        'コピーできませんでした。アドレスバーからリンクをコピーしてください。',
    },
    schedule: {
      title: '毎日のリセット',
      description:
        'デモデータは毎日自動的にリセットされます。スケジュールは環境変数で設定します。',
      time: '時刻',
      language: '言語',
      timezone: 'タイムゾーン',
      next: '次回のリセット：{{time}}',
    },
  },
};
export default resource;
