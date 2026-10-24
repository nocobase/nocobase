import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'デモデータ',
    read: '表示',
    manage: '生成と消去',
    configuration: 'デモ設定',
    configure: '設定',
  },
  accounts: {
    menu: 'デモアカウント：{{name}}',
    title: 'デモアカウント',
    description:
      'いずれかのアカウントでデモに入り、それぞれの役割から見た画面を確認できます。',
    enter: '入る',
    signedInAs: '{{name}} でサインイン中 · 切り替え',
    current: '現在',
    entering: '入っています…',
    failed: 'このデモアカウントに入れませんでした。',
    unavailable: '現在入れるデモアカウントはありません。',
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
    busyHelp: '完了すると設定を再び保存できます。',
    disabled: {
      title: 'このアプリはデモではありません',
      help: 'デモモードはオフです。デプロイ時に NOCOBASE_DEMO_MODE=true でオンにします。',
    },
    cancel: 'キャンセル',
    save: '保存',
    apply: '変更を適用',
    unsaved: '未保存の変更があります',
    discardAndReload: '自分の変更を破棄して再読み込み',
    leave: {
      title: '保存せずに移動しますか？',
      description: 'このページで保存していない変更は失われます。',
      stay: '編集を続ける',
      discard: '変更を破棄',
    },
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
      title: 'デモアカウント',
      off: 'このデプロイではクイックサインインがオフです。',
      pending: 'デモデータの準備ができると、アカウントがここに表示されます。',
      noData:
        '先にデモデータを生成してください。アカウントがここに表示されます。',
      credentials: 'ユーザー名 {{username}} · パスワード {{password}}',
      copyLink: 'リンクをコピー',
      copyLinkFor: '{{name}} の入口リンクをコピー',
      openFor: '{{name}} としてデモを開く',
      copied: 'コピーしました',
      copyFailed:
        'コピーできませんでした。アドレスバーからリンクをコピーしてください。',
    },
    schedule: {
      title: '毎日のリセット',
      confirmTitle: '毎日のリセットを保存しますか？',
      confirmDescription:
        '下の時刻に、このインスタンスの業務データをすべて削除して再生成します。',
      summary: '毎日 {{time}}（{{timezone}}）、{{language}}',
      off: '未設定',
      enabled: '毎日リセット',
      enabledHelp: '最後にデモデータを生成した管理者で実行します。',
      time: '時刻',
      hour: '時',
      minute: '分',
      language: '言語',
      timezone: 'タイムゾーン',
      noTimezone: '一致するタイムゾーンがありません',
      invalidTimezone: '一覧からタイムゾーンを選んでください。',
      next: '次回のリセット：{{time}}',
    },
  },
};
export default resource;
