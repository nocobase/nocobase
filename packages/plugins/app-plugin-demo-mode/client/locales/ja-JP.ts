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
    switch: {
      on: 'オン',
      off: 'オフ',
    },
    status: {
      enabled: 'デモ有効',
      help: '訪問者はすべてのページを開けますが、下の例外で許可しない限り変更は保存されません。',
    },
    tabs: {
      overview: '概要',
      schedule: '毎日のリセット',
      writes: '訪問者の書き込み',
      simulation: 'シミュレーションと AI',
    },
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
      description:
        '1 日 1 回、訪問者の変更を削除してデモデータを再生成します。',
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
    writes: {
      intro:
        'デモを有効にすると、書き込みはデフォルトで拒否されます。訪問者が書き込む必要のあるコレクションを選択してください。操作とレコードへのアクセスはアプリの権限で制御されます。',
      allow: '許可',
      revoke: '再び拒否',
      confirmTitle: '訪問者が書き込める内容を変更しますか？',
      confirmDescription:
        'これらへの訪問者の変更は実際に保存され、次のリセットまで残ります。',
      collections: {
        title: 'コレクション',
        description:
          'アプリで許可されたリクエストは、これらのコレクションに書き込めます。',
        label: '訪問者が書き込めるコレクション',
        placeholder: 'コレクションを検索',
        noMatch: '一致するコレクションがありません',
        fixed: '常に書き込み可能',
        fixedHelp:
          'サインインセッションとデプロイ自身の例外（NOCOBASE_DEMO_WRITABLE_COLLECTIONS）です。ここでは変更できません。',
      },
    },
    simulation: {
      kind: {
        model: 'モデル',
        tool: 'ツール',
        runner: 'Runner',
      },
      mocks: {
        title: 'シミュレーション',
        description: 'このデモで外部サービスの代わりに応答するものです。',
        confirmTitle: 'シミュレーションを変更しますか？',
        confirmDescription:
          'オフにしたシミュレーションの作業は失敗し、実際のサービスには送られません。',
        empty: '登録されたシミュレーションはありません',
        emptyHelp: 'このアプリはシミュレーションを登録していません。',
        onHelp: 'シミュレーション結果で応答します。',
        offHelp: 'オフ：作業は拒否されます。',
      },
      chat: {
        title: 'オンラインチャット',
        description: '訪問者がアプリの AI と会話できるようにします。',
        confirmTitle: 'オンラインチャットの設定を保存しますか？',
        confirmDescription:
          '訪問者の会話は次のメッセージからこの設定に従います。',
        confirmLive:
          '実際のモデルが訪問者に応答し、会話ごとにそのモデルサービスの料金がかかります。',
        enabled: '訪問者のチャットを許可',
        enabledHelp: 'オフにすると訪問者のメッセージを拒否します。',
        model: '応答元',
        simulated: 'シミュレーションモデル',
        live: '実際のモデル',
        simulatedHelp: 'スクリプトで応答し、料金はかかりません。',
        liveHelp: '既存のモデルサービスが応答し、認証情報はそこに残ります。',
        service: 'モデルサービス',
        modelId: 'モデル',
        connection: {
          new: 'デモ用モデルサービスを新規作成',
          createHelp:
            'OpenAI 互換サービスを作成します。接続を保存してからチャット設定を保存してください。',
          shared:
            'この接続の変更は、同じモデルサービスを使う他のエージェントにも適用されます。',
          endpoint: 'エンドポイント（ベース URL）',
          apiKey: 'API キー',
          keepKey: '設定済み。空欄で現在のキーを保持',
          enterKey: '必要に応じて API キーを入力',
          clearKey: '保存済み API キーを削除',
          save: '接続を保存',
          saved:
            '接続を保存しました。モデルを変更した場合はチャット設定も保存してください。',
        },
        cost: '訪問者の会話ごとにこのサービスのトークンを消費します。',
        tools: 'ツール',
        noTools: 'このアプリはチャットツールを宣言していません。',
        policy: {
          deny: '拒否',
          read: 'データを読む',
          mock: 'シミュレート',
        },
      },
    },
  },
};
export default resource;
