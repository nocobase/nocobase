import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      '最も高度な推論：提案、アーキテクチャ、難しい問題の調査、重要な変更のコードレビュー。通常の実装、パッケージ間の変更、提案書の作成にも対応。',
    large:
      '大規模な実装、パッケージ間の変更、リファクタリング、通常の実装。提案、コードレビュー、小さな変更にも対応。',
    review: 'コードレビューと CI 失敗の分析。提案や難しい問題の調査にも対応。',
    routine:
      '通常の実装、小さな修正、テスト、文言の変更。CI 失敗の分析にも対応。',
    small:
      '小さな変更、機械的な編集、テストを低コストで迅速に実行。CI 失敗の分析にも対応。',
    explanation: '要件の理解、解説、提案書の作成。',
  },
  goodAtTemplates: {
    fill: 'テンプレートから入力',
    design: '設計とレビュー',
    large: '大規模な実装',
    review: 'コードレビューと CI',
    routine: '通常の実装',
    small: '小さな変更',
    explanation: '解説と提案',
    undo: '元に戻す',
  },
  actions: {
    back: '戻る',
    cancel: 'キャンセル',
    close: '閉じる',
    delete: '削除',
    edit: '編集',
    save: '保存',
  },
  common: {
    refresh: '更新',
    cancel: 'キャンセル',
    copy: 'コピー',
    copied: 'コピーしました',
    save: '保存',
    close: '閉じる',
    create: '作成',
    createNamed: '「{{name}}」を作成',
    creating: '作成中…',
    noOptions: 'オプションなし',
    forbidden: 'これは許可されていません。',
    loading: '読み込み中',
    notFound: '現在は存在しません。',
    requestFailed: 'リクエストに失敗しました。もう一度お試しください。',
    retry: '再試行',
    secretKept: '設定 — 空のままにしておきます',
  },
  status: {
    loading: '読み込み中',
  },
  unsavedChanges: {
    description: '入力した内容は送信されていないため、失われます。',
    discard: '廃棄',
    keepEditing: '編集を続ける',
    title: '保存されていない変更を破棄しますか?',
  },
  errors: {
    boundRunnerIncompatible:
      'この実行環境では選択した Agent を実行できません。実行環境を切り替えて続行してください。',
    CONFLICT: 'そのうちに変わりました。リロードして再試行してください。',
    REVISION_CONFLICT:
      'そのうちに変わりました。リロードして再試行してください。',
    FORBIDDEN: 'これは許可されていません。',
    AGENT_NOT_FOUND: '現在は存在しません。',
    RUN_NOT_FOUND: '現在は存在しません。',
    SKILL_NOT_FOUND: '現在は存在しません。',
    SKILL_VERSION_NOT_FOUND: '現在は存在しません。',
    CONVERSATION_NOT_FOUND: '現在は存在しません。',
    RUNNER_NOT_FOUND: '現在は存在しません。',
    VARIABLE_NOT_FOUND: '現在は存在しません。',
    MODEL_SERVICE_NOT_FOUND: '現在は存在しません。',
    SCOPE_NOT_FOUND: '現在は存在しません。',
    INVALID_INPUT: '一部の値が無効です。',
    SECRETS_KEY_MISSING:
      '変数を保存または表示できません。サーバーには秘密キーがありません。管理者にアプリケーション構成で Secrets.keys を設定するように依頼してください。',
  },
  command: {
    copy: 'コピーコマンド',
    copied: 'コピーしました',
    copyFailed:
      'コピーできませんでした。コマンドを選択して自分でコピーします。',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
    gemini: 'Gemini CLI',
    copilot: 'GitHub Copilot',
    cursor: 'Cursor',
    qwen: 'Qwen Code',
    kimi: 'Kimi CLI',
    codebuddy: 'CodeBuddy Code',
    qoder: 'Qoder CLI',
    goose: 'Goose',
    auggie: 'Auggie',
    droid: 'Factory Droid',
    kilo: 'Kilo Code',
    cline: 'Cline',
    amp: 'Amp',
    vibe: 'Mistral Vibe',
    dsh: 'DeepSeek Harness',
  },
  agents: {
    unavailableNow: '現在利用不可',
    title: 'エージェント',
    description:
      '実行環境が報告したモデルから Agent を追加します。Lead Agent はタスクの各ステップを、説明が最も合う Agent に任せます。',
    fromRunners: '実行環境からのエージェント',
    display: {
      search: 'モデルまたはプロバイダーの検索',
      select: '{{name}}を選択してください',
      showDisabled: '無効を表示',
      hideDisabled: '無効を隠す',
    },
    filterLabel: 'ショーエージェント',
    filters: {
      all: 'すべての{{count}}',
      enabled: '{{count}}を有効にしました',
      unreported: '実行環境なし {{count}}',
    },
    loadFailed: 'エージェントをロードできませんでした',
    loadMore: 'もっと読み込む',
    emptyTitle: 'まだエージェントがいません',
    emptyDescription:
      'コーディングツールにサインイン済みの実行環境を接続し、「利用可能なモデル」からエージェントを追加してください。',
    noneInFilter: 'ここにはエージェントがいません。',
    howToAdd:
      'Agent を追加するには、実行環境にコーディングツールをインストールし、利用できるモデルにサインインします。実行環境が報告したら、得意なことを書いて「利用可能なモデル」から追加します。個人用の実行環境にしかない Agent は、その所有者が開始したタスクだけを担当します。',
    goodAtMissing: 'まだ書かれていません',
    columns: {
      agent: 'エージェント',
      goodAt: '得意',
      where: 'どこで動作するか',
      effort: '推論努力',
      state: '状態',
    },
    where: {
      none: '実行環境なし',
      team_one: '{{count}} チーム実行環境',
      team_other: '{{count}} チーム実行環境',
      personal_one: '{{count}} 個人実行環境 オンライン',
      personal_other: '{{count}} 個人実行環境 オンライン',
      both: '{{team}}チーム・{{personal}}個人',
      names: '{{names}}',
      noneOnline: '現在オンラインの実行環境はいません',
      personalOnly: '個人実行環境限定',
      lastReported: '最後に報告されたのは {{when}}',
    },
    state: {
      enabled: '有効',
      disabled: '無効',
      unreported: '実行環境なし',
    },
    effort: {
      default: 'ツールのデフォルト',
      off: 'オフ',
      minimal: 'ミニマル',
      low: '低',
      medium: '中',
      high: '高',
      xhigh: 'エクストラハイ',
      max: 'マックス',
      ultra: 'ウルトラ',
    },
    enable: {
      reportedBy_one:
        'オンラインの {{count}} 実行環境によって報告されました: {{names}}。',
      reportedBy_other:
        'オンラインの {{count}} 実行環境によって報告されました: {{names}}。',
      noRunnerNow: '現在オンラインにこれ​​を持っている実行環境はいません。',
      goodAtHint:
        'Lead Agentはこの言葉によってこのエージェントに何を渡すかを決定します。何が合うのか、何が合わないのかを言います。',
      goodAtRequired: '有効にする前に、何が得意かを書いてください。',
      effortHint:
        'Lead Agentは、作業を引き継ぐときに変更することはできません。',
      personalOnly:
        '個人用の実行環境にしかありません：Lead Agent は、その所有者が開始したタスクだけを任せます。',
    },
    edit: {
      button: '編集',
      buttonFor: '{{name}}を編集',
      title: '{{name}}を編集',
      enabled: '有効',
      done: '{{name}} が保存されました',
    },
    available: {
      open: 'エージェントを追加',
      title: '利用可能なモデル',
      description:
        '実行環境でチェックされたツールのみが検出され、ここに表示されます。アプリケーションの推奨組み合わせは、実行環境が報告すると自動的に作成・有効化されます。その他のものはここから選んで追加してください。',
      recommended: '報告されると自動的に有効化されます',
      added: '追加済み',
      add: '追加',
      status: {
        available: '利用可能',
        needsSetup: '設定が必要',
        versionTooOld: 'バージョンが古い',
        failed: '検出失敗',
      },
      details: 'ツールの詳細',
      setupCommand: '実行環境で {{command}} を実行してください。',
      setupUnknown: 'このツールには設定が必要ですが、コマンドが分かりません。',
      upgradeAdvice:
        '実行環境でツールと ACP アダプターを最新版に更新し、検出を更新してください。',
      minimumVersionUnknown:
        '対応するツールの最小リリースは不明です。互換性のドキュメントを確認してください。',
      noDetail: 'ツールから追加の詳細はありませんでした。',
      showMore: 'もっと見る',
      showLess: '閉じる',
      groupSearchPlaceholder: 'このツールのモデルを検索',
      group_one: '{{tool}} · {{count}} モデル · {{runners}}',
      group_other: '{{tool}} · {{count}} モデル · {{runners}}',
      runners_one: '{{count}} 台の実行環境',
      runners_other: '{{count}} 台の実行環境',
      noModels: 'ここにはモデルがありません。',
      selectedCount_one: '{{count}} 件選択中',
      selectedCount_other: '{{count}} 件選択中',
      addSelected: '{{count}} 件を追加',
      confirmTitle_one: '{{count}} 件のエージェントを追加',
      confirmTitle_other: '{{count}} 件のエージェントを追加',
      confirmAction_one: '{{count}} 件を追加',
      confirmAction_other: '{{count}} 件を追加',
      goodAtNeeded: '得意なことは？',
      addedCount_one: '{{count}} 件のエージェントを追加しました。',
      addedCount_other: '{{count}} 件のエージェントを追加しました。',
      addedPartial:
        '{{succeeded}} 件を追加しました。{{failed}} 件は追加できませんでした。理由は各項目の下に表示されています。',
      addFailed:
        '{{failed}} 件を追加できませんでした。理由は各項目の下に表示されています。もう一度お試しください。',
    },
  },
  agentTypes: {
    label: 'エージェントの種類',
    question: 'エージェントは何ですか？',
    online: 'オンライン',
    runner: '実行環境',
    onlineHint:
      'モデル サービスを通じてサーバー上で数秒で応答します。実行環境は必要ありません。コードには触れられません。',
    runnerHint:
      '実行環境上でコーディング ツールを駆動し、作業ディレクトリ内で動作します: コード、ファイル、コマンド。',
    immutable:
      'エージェントはそのタイプを保持します。他の種類の別のエージェントを作成します。',
    onServer: 'サーバー上',
    filterAll: '全種類',
    noneOfType: 'このタイプのエージェントは存在しません。',
  },
  agentSkills: {
    title: 'スキル',
    description:
      'タスクが説明と一致する場合にエージェントが読むマニュアル。毎回の実行前に作業ディレクトリに配置されます。',
    manage: 'スキルを管理する',
    placeholder: 'スキル選択',
    empty: 'まだスキルがありません。',
    save: 'スキルを保存',
    descriptionOnline:
      'サーバー上の読み取り専用サンドボックスで、タスクがその説明に一致したときにエージェントが読むマニュアル。',
    onlineScripts:
      'オンライン エージェントに対してスクリプトは実行されません。エージェントはスクリプトを読み取ることができますが、実行することはできません。',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'プロンプト全体をプレビューする',
    previewTitle: 'プロンプト全体をプレビューする',
    previewDescription:
      'でっちあげの件名で、このエージェントの実行内容が今送信されることになるでしょう。何もキューに入れられていません。',
    scenario: 'シナリオ',
    sample:
      'でっちあげの話題について: {{subject}}。 [sample]とマークされた値は作成されます。',
    previewFailed: 'プロンプト全体をレンダリングできませんでした。',
    system: 'システムプロンプト',
    showAs: 'として表示',
    rendered: 'レンダリング済み',
    raw: '生',
    platform: 'プラットフォームのルールとタスク・{{size}} 文字について (英語)',
    platformNote:
      'プラットフォーム ルールは英語で送信されます。エージェントは引き続きあなたの言語で応答します。',
    agentPrompt: 'エージェント プロンプト (あなたが作成した)',
    noAgentPrompt: 'このエージェントには独自のプロンプトがありません。',
    firstMessage: '最初のメッセージ',
    empty: '空',
    previewPlaceholders:
      '実行環境に関する括弧で囲まれたメモは、実行環境を実行する実行環境によって記入されます。作業ディレクトリと、準備したばかりのディレクトリの初期化プロンプトです。',
    placeholders:
      '{{runner.…}} プレースホルダーは、実行環境を実行する実行環境によって埋められます。実行環境の作業ディレクトリと、準備したばかりのディレクトリの初期化プロンプトです。',
    layers: {
      system: 'ルール',
      task: 'タスク',
      context: 'コンテキスト',
      agent: 'エージェントプロンプト',
      turn: '最初のターン',
    },
  },
  envVars: {
    title: '環境変数',
    description:
      '実行ごとにコーディング ツールに渡され、実行レコードでマスクされます。値は保存後に再度表示されません。共有エージェントを使用する可能性のある人は誰でも、自分のコンピュータでこれらの値を受け取ることができます。高リスクのシークレットには「チーム 実行環境のみ」のマークを付けます。',
    add: '変数の追加',
    addTitle: '環境変数を追加する',
    editTitle: '{{name}}を置き換えます',
    writeOnly: '値は暗号化されて保存され、前の値と置き換えられます。',
    name: '名前',
    nameHint: '大文字、数字、アンダースコア。',
    value: '値',
    valueTooLong: '値が8KBを超えています。',
    keepValueHint: '現在の値を保持するには、空のままにしておきます。',
    teamRunnersOnly: 'チーム実行環境のみ',
    teamRunnersOnlyHint:
      'これがないと、実行は、エージェントを使用する可能性のある人の個人実行環境を含む、値を受け取る実行環境に値を送信します。これを使用すると、チーム 実行環境のみがこの変数を取得する実行を実行します。',
    teamRunnersOnlyBadge: 'チーム実行環境のみ',
    fromRunner: '実行環境から取得',
    fromRunnerHint:
      'ここには値は保持されません。実行を受ける実行環境は、それ自体のマシンから値を提供し、{{command}} で設定するか、`--pass-env` で渡します。これを提供しない実行環境は、開始前に実行に失敗します。',
    fromRunnerBadge: '実行環境から',
    valueRequired: '値を入力するか、実行環境から値を取得し続けます。',
    empty: '環境変数はありません。',
    scope: 'スコープ',
    updated: '更新しました',
    actionsHead: '操作',
    edit: '値を置き換える',
    actions: '{{name}}のアクション',
    accessLog: 'アクセスログ',
    accessLogAll: '完全なアクセスログを表示する',
    accessLogOf: '{{name}}のアクセスログ',
    accessLogDescription:
      '変数を参照、設定、または削除した人、いつ、どの実行が変数を受信したか。',
    delete: '削除',
    deleteTitle: '{{name}}を削除しますか？',
    deleteDescription: 'これ以降の実行では変数を受け取らなくなりました。',
    deleteConfirm: '削除',
    deleted: '{{name}}を削除しました。',
    saved: '{{name}}を保存しました。',
    updatedBy: '{{name}}・{{time}}',
    reveal: '値を明らかにする',
    revealTitle: '値を公開しますか?',
    revealAudit: '公開すると名前と時刻がアクセスログに記録されます。',
    revealedTitle: '変数の値',
    revealedNote: 'この暴露は記録されました。完了したら閉じてください。',
    runner: '実行環境 {{id}}',
    auditsEmpty: 'まだ何も記録されていません。',
    auditAction: {
      reveal: '明らかになった',
      set: 'セット',
      delete: '削除されました',
      deliver: '実行用に受信',
    },
    nameProblems: {
      required: '名前を入力します。',
      pattern:
        '大文字、数字、アンダースコアのみを使用し、数字で始めることはできません。',
      reserved: 'この名前は予約されています。',
      duplicate: 'この名前の変数が存在します。代わりに編集してください。',
    },
  },
  scopeVariables: {
    title: '変数とシークレット',
    description:
      'ここで働くすべてのエージェントに与えられます。より具体的な変数 (作業ディレクトリ、次にエージェント) がこれらよりも優先されます。',
  },
  scopes: {
    workdir: '作業ディレクトリ',
  },
  subjects: {
    conversation: '会話',
    consultation: '相談',
  },
  usage: {
    otherUse: {
      title: '他機種用',
      description:
        'モデルは、知識ベースのインデックス作成や検索など、エージェント実行の外部で呼び出します。',
      purpose: '使用',
      source: '質問者',
      model: 'モデル',
      calls: '通話',
      units: 'アイテム',
      purposes: {
        embedding: '埋め込み',
        rerank: 'リランキング',
        text: 'ユーティリティテキスト',
      },
    },
    title: '利用状況',
    description:
      'どのエージェントが中古で動作するか、および現在のモデルの価格でいくらかかるか。',
    loadFailed: '使用状況を読み込めませんでした',
    groupBy: 'グループ化',
    groupByValue: '{{group}} ごとにグループ化',
    empty: 'この期間は走行なし。',
    total: '合計',
    noGroup: 'なし',
    unknown: '不明',
    onlineTool: 'オンライン（モデルサービス）',
    setPrices: '価格を設定',
    chart: {
      title: '日々のトレンド',
      metric: 'ショー',
      cost: 'コスト',
      tokens: 'トークン',
      total: '合計',
      other: 'その他',
    },
    pricedNote:
      'コストは、{{total}} 回の {{priced}} 回の実行をカバーします。これらのモデルにはまだ価格がありません: {{models}}。',
    filters: {
      allGroups: '全員：{{group}}',
      agent: 'エージェント',
      allAgents: 'すべてのエージェント',
      person: '目覚めたのは',
      allPeople: 'みんな',
      range: '日付範囲',
      presets: 'クイックレンジ',
    },
    presets: {
      last7: '過去 7 日間',
      last30: '過去 30 日間',
      thisMonth: '今月',
      lastMonth: '先月',
      last90: '過去 90 日間',
    },
    groups: {
      agent: 'エージェント',
      person: '目覚めたのは',
      group: 'グループ',
      subject: '件名',
      day: '日',
      model: 'モデル',
      tool: 'コーディングツール',
      type: 'エージェントの種類',
    },
    columns: {
      runs: '実行履歴',
      duration: '持続時間',
      input: '入力',
      output: '出力',
      cacheRead: 'キャッシュ読み取り',
      cacheWrite: 'キャッシュ書き込み',
      cost: '推定コスト',
    },
  },
  defaultSkills: {
    title: 'デフォルトスキル',
    description: 'ここで働くすべてのエージェントもこれらのスキルを取得します。',
    save: 'スキルを保存',
    saved: 'デフォルトスキルが保存されました。',
  },
  runs: {
    title: '実行ログ',
    empty: 'まだ実行はありません。',
    loadFailed: '実行ログを読み込めません',
    unknownAgent: 'エージェント',
    attempt: '{{attempt}} の {{max}} を試みます',
    viewTranscript: 'トランスクリプトを表示',
    transcriptTitle: '実行の記録',
    viewAll: '全 {{count}} 件を表示',
    allTitle: 'すべての実行 ({{count}})',
    filters: {
      agent: 'エージェント',
      status: '状態',
      allAgents: 'すべてのエージェント',
      allStatuses: '全ステータス',
    },
    noMatch: '条件に一致する実行はありません。',
    cancel: '停止',
    stopping: '止まっています…',
    cancelTitle: 'この実行を停止しますか?',
    cancelDescription:
      '{{name}}は停止されます。すでに変更されたものは残ります。',
    cancelRequested: '停止要求',
    retry: '再試行',
    retried: '実行が再びキューに追加されました',
    viewBrief: 'プロンプト全体を表示',
    briefTitle: '完全なプロンプト',
    briefDescription:
      'この実行が最後に請求されたときにエージェントに告げられた内容。',
    briefOf: '{{attempt}}を試み、{{time}}を主張',
    briefUnavailable: 'この実行では完全なプロンプトは利用できません。',
    processDataCleared:
      '実行プロセスデータは保持ポリシーに基づいて消去されました。',
    briefFailed: 'プロンプト全体をロードできませんでした',
    workspaceReset: {
      button: '作業ディレクトリをクリーンアップする',
      title: '作業ディレクトリをクリーンアップしますか?',
      description:
        '次回の実行は新しいチェックアウトから開始され、再び初期化プロンプトが表示されます。プッシュされなかった変更は、その実行環境では失われます。適切に使用されているディレクトリは削除されません。',
      confirm: 'クリーン',
      done: '次の実行は新しいチェックアウトから始まります。',
    },
    stateChanged: '実行の状態が変更されました。ログが更新されました。',
    status: {
      queued: 'キューに登録されました',
      dispatched: '派遣されました',
      running: '実行中',
      completed: 'ターン終了',
      failed: '失敗しました',
      cancelled: 'キャンセル済み',
      cancelling: '停止中',
    },
    trigger: {
      retry: '再試行',
      message: 'メッセージ',
      consultation: '相談',
    },
    activity: {
      queued: '{{name}} がキューに登録されました',
      dispatched: '{{name}} が起動中です',
      running: '{{name}} が動作開始しました',
      completed: '{{name}}はターン終了しました',
      failed: '{{name}} が失敗しました',
      cancelled: '{{name}} が停止されました',
    },
    live: {
      working: '{{name}} は動作しています',
      workingFor: '{{name}} は動作しています · {{minutes}} 分',
      queued: '{{name}} はキューに登録されています',
    },
  },
  transcript: {
    title: '実行の記録',
    notFound: 'このランは存在しません。',
    waiting: 'エージェントの起動を待っています…',
    empty: 'この走行ではイベントは記録されませんでした。',
    fetchFailed: '新しいイベントを取得できません。再試行中…',
    expand: '全て表示',
    truncated: '短く切り上げます。全文は長すぎて保持できませんでした。',
    summary_one: '{{created}}・{{count}}イベントを作成しました',
    summary_other: '{{created}}・{{count}}イベントを作成しました',
    took: '{{duration}} を取りました',
    pendingInputs_one: '{{count}} コメントがエージェントを待っています',
    pendingInputs_other: '{{count}} のコメントがエージェントを待っています',
    inputDelivered_one: '代理店に納品',
    inputDelivered_other: '{{count}} 入力がエージェントに配信されました',
    tokens: '{{input}} トークン入力、{{output}} 出力',
    kinds: {
      text: 'エージェント',
      thinking: '思考',
      toolUse: 'ツール',
      toolResult: '結果',
      allowed: '許可される',
      denied: '拒否されました',
      input: '入力',
      checkout: 'チェックアウト',
      status: '状態',
      error: 'エラー',
      usage: '使い方',
    },
  },
  failures: {
    runnerUpgrade:
      '実行マシンの更新のために中断されました。走行は続行されます。',
    runnerDiskFull: '実行マシンのディスク容量が不足しました。',
    runnerOfflineBeforeStart:
      '実行を開始する前に実行環境がオフラインになりました。',
    runnerOffline: '実行環境がオフラインになりました。',
    leaseExpired: '実行環境がレポートを停止しました。',
    startTimeout: '実行環境が時間内に実行を開始しませんでした。',
    cancelled: 'キャンセルされました。',
    idleTimeout: 'エージェントの進行が停止しました。',
    setupFailed: '実行を準備できませんでした。',
    cliUnavailable:
      '実行環境はアプリケーション CLI をインストールできませんでした。',
    workspaceBusy: '作業ディレクトリがビジー状態です。別の試みを待っています。',
    checkoutFailed: 'リポジトリのチェックアウトに失敗しました。',
    toolAuth: 'コーディング ツールが実行環境にサインインしていません。',
    toolQuota: 'コーディングツールがクォータを使い果たしました。',
    sessionUnavailable:
      '元のコーディングツールのセッションを再開できませんでした。',
    toolRateLimit: 'コーディングツールにはレート制限がありました。',
    toolNetwork: 'コーディング ツールがサービスに到達できませんでした。',
    toolProcess: 'コーディングツールが予期せず終了しました。',
    contextOverflow: 'モデルにとって会話が長すぎました。',
    delegatedQueueTimeout: '委任キューのタイムアウト。撤回された',
    queuedExpired: '実行環境が間に合わなかった。',
    modelUnavailable: 'エージェントのモデルが利用できません。',
    stepLimit: 'エージェントが応答せずにツールを何度も呼び出しました。',
    policyRefused: 'この作業を許可する実行環境のポリシーはありません。',
    prepareNetwork:
      '実行環境は実行の準備中にリポジトリ ホストに到達できませんでした。',
    repoAccessUnavailable: 'リポジトリに一時的にアクセスできません。',
    repoAccessDenied:
      'アプリケーションは、実行のリポジトリの 1 つに対して認証情報を発行しません。',
    unknown: '実行に失敗しました。',
  },
  runtimes: {
    pathHint:
      'runner は自身の PATH でコーディングツールを探します。which codex / which claude が動作するターミナルで nocobase-runner service install を再実行してサービスを再起動（または nocobase-runner start を再実行）し、正しい PATH を取得させてください。',
    quota: {
      workspaceStatus: {
        active: '仕事は続く',
        ended: '終了しました · クリーンアップは許可されました',
        checks: '終了・チェック保留中',
        inUse: '保持：使用中',
        changed: '保持：再利用',
        trackedChanges: '保持: コミットされていないファイル',
        unpushed: '保持: プッシュされていない作業',
        missingEvidence: '保持: 検証が必要です',
        gitFailed: '保持: Git チェックに失敗しました',
        runNotFound: '保持: 実行が見つかりません',
        ownershipUnknown: '保持: 所有者未確認',
        ambiguousSubject: '保持: あいまいなタスク',
        bindingUnavailable: '保持: バインディングは利用できません',
        subjectUnknown: '保持: タスク不明',
        unknown: '保持: 未検証',
      },
      usageLimit: '利用制限',
      shortReset: '{{time}} をリセットします',
      shortUnknown: 'リセット不明',
      automatic: 'リセット時に自動的にクリアされます。',
      since: '{{time}} 以降',
      marks_one: '{{count}} クォータマーク',
      marks_other: '{{count}} クォータ マーク',
      queueHint:
        'クォータに達したエージェントは引き続き選択できます。作業は既存の待機期限に従ってキューに追加されます。',
      partial: '{{available}}・{{blocked}}でクォータで実行',
      workspaceSize: 'ワークスペースのサイズ: {{value}}',
      providers_one: '{{count}} プロバイダーがクォータに達しました',
      providers_other: '{{count}} プロバイダーがクォータに達しています',
      runColumns: {
        issue: 'タスク / 会話',
        agent: 'エージェント',
        status: '状態',
        started: '開始しました',
        duration: '持続時間',
      },
      filter: {
        all: 'すべて',
        active: 'アクティブ',
        retained: '保持',
        ended: '終了しました',
      },
      columns: {
        directory: 'ディレクトリ/タスク',
        type: '種類',
        size: 'サイズ',
        push: 'プッシュ状態',
        status: '状態',
        lastUsed: '最後に使用した',
      },
      previous: '前へ',
      next: '次へ',
      working: '働く',
      readOnly: '読み取り専用コピー',
      clean: 'クリーン',
      unpushed: 'アンプッシュ',
      overview: '概要',
      workspaces: 'ワークスペース',
      runs: '実行履歴',
      title: 'クォータ',
      reached: 'クォータに達しました',
      unknown: 'リセット時間不明',
      resets: '{{time}}をリセットします',
      near: '限界に近い',
      clear: 'クリア',
      clearMark: 'マークをクリア',
      confirmTitle: '{{target}} のクォータマークをクリアしますか？',
      confirm:
        'クォータが回復したことを確認してからクリアしてください。{{target}} はすぐに仕事を受け取ります。クォータがまだ尽きている場合は、次の実行で再びマークされます。',
      observed: '最後に報告されたのは {{time}}',
      usedPercent: '{{percent}}% 使用',
      ok: 'わかりました',
      hint: 'マークは既知のリセット時刻、またはツールがクォータの残りを再び報告したときに自動的に解除されます。手動でクリアするのはクォータの回復を確認してからにしてください。マークをクリアできるのは、実行環境の所有者と管理者だけです。',
    },
    workspaces: {
      paused:
        'ディスク容量が回復するまで、新しい作業は一時停止されます。既存の実行は継続されます。',
      working: 'タイプ: 作業ディレクトリ',
      readOnly: 'タイプ: 読み取り専用コピー',
      size: 'サイズ:{{value}}',
      pushed: 'プッシュ状態: クリーン、プッシュされていない作業はありません',
      unpushed: 'プッシュ状態: 未コミット、未プッシュ、または未検証の作業',
      notApplicable: 'プッシュ状態: 該当なし',
      title: 'ワークスペース診断',
      low: 'ディスク容量不足',
      previousLow: '最新レポート: ディスク容量不足',
      notReported: 'ワークスペースレポートはまだ受信していません',
      diskUnknown: 'ディスク容量を測定できませんでした',
      thresholdOff: '最小空き容量の警告が設定されていません',
      free: '空き領域: {{value}}',
      threshold: '最小空き容量: {{value}}',
      reportedAt: '最終レポート: {{time}}',
      stale:
        'これらは以前の測定値です。現在のディスク容量は確認されていません。',
      empty: '最新のレポートには作業ディレクトリがありません',
      ended: '終了しました',
      active: '仕事は続く',
      unknown: '作業が終了したかどうかが確認できない',
      oldRunner: 'この実行環境は診断理由を提供していません',
      noCleanup: 'ローカルクリーンアップ結果を受信していません',
      discardsUntracked:
        'クリーンアップでは追跡されていないファイルが破棄されます',
      decision: {
        settled:
          '作業は終了しました。ローカルのクリーンアップチェックが必要です',
        active: '仕事は続く',
        runNotFound: '確認できません: 実行が見つかりません',
        ownershipUnknown:
          '確認できません: 実行環境の所有権を確認できませんでした',
        ambiguousSubject: '確認できません: 件名キーがあいまいです',
        bindingUnavailable:
          '確認できません: アプリケーションにワークスペース バインディングがありません',
        subjectUnknown:
          '確認できません: アプリケーションは件名を解決できませんでした',
      },
      cleanup: {
        allowed: '終了しました。クリーンアップは許可されています',
        inUse: '保持: ディレクトリは使用中です',
        changed: '保持: ディレクトリは再利用されました',
        trackedChanges:
          '保持: 追跡されたファイルにはコミットされていない変更が含まれています',
        unpushed:
          '保持: プッシュされていないコミットまたは不十分なローカル コミット オブジェクト',
        missingEvidence: '保持: コミットの証拠が不十分です',
        gitFailed: '保持: Git チェックに失敗しました',
      },
    },
    title: '実行環境',
    description:
      'エージェントを実行する実行環境とコーディング ツールがそれぞれ報告されました。',
    add: '実行環境の追加',
    loadFailed: '実行環境をロードできませんでした',
    emptyTitle: '実行環境がまだ接続されていません',
    emptyDescription:
      '実行環境が接続されると、実行環境 エージェントはコーディング ツールを使用してそこで作業を引き受けます。',
    noneConnected: '実行環境が接続されていません。',
    revokedList_one: '{{count}} は実行環境を取り消しました',
    revokedList_other: '{{count}} は実行環境を取り消しました',
    lastSeen: '最後に見た {{time}}',
    activity: {
      online: 'オンライン {{active}}/{{slots}}',
      busy: '忙しい {{active}}/{{slots}}',
      low_disk: 'ディスク容量不足 {{active}}/{{slots}}',
      offline: 'オフライン · {{time}}',
      offlineNever: 'オフライン',
    },
    toolUsage: {
      label: 'コーディングツールで実行',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'コーディングツールごとの制限',
      hint: '各コーディング ツールを一度に実行する回数。たとえば、サブスクリプションにより許可されるセッションが少ないツールでは実行回数が少なくなります。同時実行のみで制限するには、1 つを空のままにしておきます。',
      none: '制限なし',
      invalid: '1 ～ 64 の整数を入力するか、空のままにします。',
      inputLabel: '{{tool}}を一度に実行',
      overTotal:
        '{{tools}} の制限は最大同時実行数 ({{slots}}) を超えています。一度に実行できるのは最大 {{slots}} です。',
      noneChecked:
        '制限するには、上記のコーディング ツールを確認してください。',
    },
    toolTable: {
      tool: 'ツール',
      enabled: 'オン',
      state: '状態',
      limit: 'すぐに',
      active: '実行中',
    },
    policy: {
      title: '地域政策',
      description:
        '報告されているように、実行環境の所有者が許可しているもの。ここではなく、マシン上で変更されます。',
      none: 'ローカル ポリシーはありません。登録されているすべての作業が必要です。',
      any: '任意',
      nothing: 'なし',
      agents: 'エージェント',
      subjects: '被験者',
      repos: 'リポジトリ',
    },
    variables: {
      title: 'このマシンからの変数',
      description:
        '実行環境から名前を取得して実行に提供する変数。値はマシン上に残ります。 `nocobase-runner env set NAME` でそこに設定するか、`--pass-env NAME` で渡します。',
      none: 'なし: 実行環境から変数を取得する実行は、開始する前にここで失敗します。',
      unknown:
        '未報告: その実行環境はこの機能よりも古いです。実行環境を更新して表示します。',
    },
    jobs: {
      allow: 'ビルドジョブを許可する',
      hint: 'このアプリケーションが構成するビルドおよびその他のステップは、モデルなしで実行されます。この実行環境は次のようにレポートします: {{kinds}}。',
      unsupported:
        'この実行環境の実行環境はジョブを受け取りません。これをオンにするには、実行環境を更新します。',
    },
    noTools: 'コーディングツールが見つかりませんでした',
    actionsFor: '{{name}}のアクション',
    columns: {
      name: '名前',
      status: '状態',
      tools: 'ツール',
      sharing: '共有',
      version: '実行環境',
      lastSeen: '最後に見た',
      slots: '最大同時実行',
    },
    detail: {
      general: '一般',
      tools: 'ツール',
      toolsDescription:
        '報告されたコーディングツール。オフになっているツール、またはクォータが使い果たされているツールの作業は、ここには送信されません。スイッチとリミットは「保存」で保存されます。',
      version: '実行環境 {{version}}',
      runs: '最近の走行',
      runsEmpty: 'まだ実行はありません。',
      runsTotal: '全 {{count}} 件',
      runsPagination: '実行履歴のページ切り替え',
      runsPrevious: '前へ',
      runsNext: '次へ',
      runsPage: '{{page}} / {{pageCount}} ページ',
      runsFailed: '実行をロードできませんでした。',
      readOnly: '所有者のみが変更できます。',
      owner: 'オーナー {{name}}',
    },
    status: {
      updatePending: 'アップデートを待っている実行環境',
      pruning: '実行環境クリーニング共用店舗',
      online: 'オンライン',
      offline: 'オフライン',
      revoked: '取り消されました',
      upgrade_required: 'アップグレードが必要です',
    },
    upgradeRequired: {
      title: 'この実行環境にはアップグレードが必要です',
      older:
        'その実行環境 {{version}} はエージェント プロトコル {{protocol}} を話します。このアプリケーションにはプロトコル {{required}} が必要です。接続されたままですが、更新されるまで何も実行されません。',
      newer:
        'その実行環境 {{version}} は、このアプリケーション (プロトコル {{required}}) よりも新しいエージェント プロトコル {{protocol}} を話します。接続は維持されますが、このアプリケーションが提供する実行環境を実行するまでは何も実行されません。',
      latest:
        'このアプリケーションは実行環境 {{latest}} にサービスを提供します。ホスト上でこれを実行して更新します。',
      noLatest:
        'プロトコル {{required}} を話す実行環境をインストールするか、これをホスト上で実行して更新します。',
      reinstall:
        'その実行環境には、どのように設置されたかが記載されていません。 「実行環境の追加」のコマンドを使用して、ホストに再度インストールします。',
    },
    tool: {
      checking: '検出待ち',
      failed: '検出失敗',
      redetect: '再検出',
      notProvided: '提供なし',
      signedIn: 'サインインしました',
      signedOut: 'サインインしていません',
      notInstalled: 'インストールされていません',
      off: 'オフ',
      offHint: 'オフ: このツールの作業はこの実行環境に送信されません。',
      enableLabel: '{{name}}で{{tool}}を実行',
      version: 'バージョン {{version}}',
    },
    trust: {
      isolationHint:
        '個人用・共有の実行環境のどちらでも、runner は VM または隔離された環境で実行してください。Agent はフルアクセスを持ち、runner はサンドボックスではありません。',
      label: '誰に効果があるか',
      team: 'チーム',
      teamHint:
        'チームの誰もが開始した作業を、変数とシークレットを使用して実行します。共有サーバーと VM の場合。',
      ownerOnly: '個人',
      ownerOnlyHint:
        '開始した作業のみを実行します。追加する実行環境のデフォルト。',
      personalOnly:
        'この実行環境は個人用です。ユーザーが開始した作業のみが実行されます。後でチームと共有できます。',
    },
    share: {
      title: '{{name}} をチームと共有しますか?',
      description:
        '他の人の実行は、変数とシークレットを使用してこの実行環境上で実行され、そこにあるものを読み取ることができます。それでもいい場合のみ共有してください。',
      confirm: 'チームで共有',
    },
    edit: {
      button: '編集',
      title: '{{name}}を編集',
      name: '名前',
      nameRequired: '名前を入力します。',
      slotsHint: '実行環境が一度に実行する回数。',
      slotsInvalid: '1 ～ 64 の整数を入力します。',
      saved: '{{name}}を保存しました',
    },
    upgrade: {
      show: 'バージョン {{version}}: 新しい実行環境が利用可能です',
      available: 'アップデートが利用可能',
      badge: 'アップグレード可能',
      title: '{{name}} の新しい実行環境',
      description:
        '{{version}} がインストールされており、このアプリケーションは {{latest}} を提供します。',
      hint: 'エージェントが実行されなくなると、自動的に更新されます。今すぐ更新するには、ホスト上でこれを実行します。',
    },
    revoke: {
      title: '{{name}} の資格情報を取り消しますか?',
      description:
        'その実行環境は次のリクエストで停止し、その実行はキューに戻ります。再度接続するには、実行環境を再度追加します。',
      confirm: '取り消し',
      done: '{{name}} の資格情報を取り消しました',
    },
    delete: {
      title: '{{name}}を削除しますか？',
      description:
        '取り消された実行環境はリストから削除されます。過去の実績はそのまま残ります。',
      confirm: '削除',
      done: '{{name}}を削除しました',
    },
  },
  connect: {
    manual: 'または自分でインストール',
    promptTitle: 'Agent に設定を任せる',
    promptCopy: 'Agent 用のプロンプトをコピー',
    promptShow: 'プロンプトを表示',
    promptHide: 'プロンプトを隠す',
    promptHint:
      'このプロンプトを対象マシン上の Agent（Claude Code、Codex など）にコピーすると、以下の手順を代わりに実行します。一回限りの認証情報が含まれるため、その Agent にだけ渡してください。',
    windowsPowerShell:
      '1. WSL をインストール：PowerShell で実行し、Windows を再起動します：',
    windowsUbuntu:
      '2. Ubuntu を開き、下の Linux 用コマンドを実行します。Node.js とコーディングツールは WSL Ubuntu 内にインストールしてください。',
    windowsNetwork:
      'WSL からインターネットに接続できない場合は、WSL のミラーモード ネットワークを有効にしてください。',
    promptWindows:
      'まず、WSL Ubuntu 内で実行しているかを確認してください。WSL Ubuntu でない場合は停止し、インストールや登録のコマンドは一切実行しないでください。ユーザーに、PowerShell で wsl --install を実行して Windows を再起動し、WSL Ubuntu 内で Agent を開いてこのプロンプトを再実行するよう伝えてください。以下の手順は WSL Ubuntu 内でのみ進めてください。Node.js とコーディングツールはどちらも WSL 内にインストールしてください。WSL からインターネットに接続できない場合は、ミラーモード ネットワークを有効にしてください。\n\n',
    promptBody:
      'このマシンを NocoBase の実行環境として設定してください。VM または隔離された環境を使ってください：Agent はフルアクセスを持ち、runner はサンドボックスではありません。\n\nNode.js 24 以降があること、次のコーディングツールがインストール済みでサインイン済みであることを確認してください：{{tools}}。snap パッケージではなく公式のインストール方法を使ってください。\n\n次の一回限りの登録コマンドを実行して、runner とアプリケーション CLI をインストールし、登録し、バックグラウンドサービスをインストールしてください：\n{{command}}\n\nよくある設定の問題を解決してください：サービスの PATH にコーディングツールが含まれるようにする（インストールしたターミナルで which codex / which claude を確認し、nocobase-runner service install を再実行してサービスを再起動する）；ダウンロードとサービスに必要なプロキシを設定する；npm のグローバルインストール権限の問題は sudo npm install を使わず、ユーザー所有の prefix か Node のバージョンマネージャーで解決する。\n\n最後に nocobase-runner status を実行し、接続とコーディングツールを確認してください。私が行う必要のあるサインインやネットワークの手順が残っていれば報告してください。登録用の認証情報は秘密として扱い、報告に含めないでください。',
    title: '実行環境の追加',
    description:
      'コーディング ツールがインストールされているホスト (サーバー、VM、または独自のデバイス) で以下のコマンドを実行します。エージェントは、実行環境を実行するユーザーとして完全なアクセス権で実行され、SSH キーやその他の資格情報を含め、ユーザーができることはすべて読み取りおよび変更できます。実行環境はセキュリティ境界ではありません。コンテナまたは VM 内で専用ユーザーとして実行します。',
    createCredential: 'インストールコマンドを生成する',
    advanced: '詳細: コーディング ツールごとの制限',
    run: 'そのホスト上でこれを実行します。このアプリケーションから実行環境 (nocobase-runner) とこのアプリケーションの CLI をダウンロードし、実行環境を登録してログイン時に開始します。',
    nodeRequired:
      'ホストには Node.js 24 以降が必要です (node --version で確認してください)。コマンドが停止し、コマンドが見つからない場合はインストール方法が表示されます。',
    installed:
      'nocobase-runner はすでにインストールされていますか?代わりに登録してください:',
    tokenOnce:
      'このコマンドには、「{{trust}}」実行環境のワンタイム認証情報が含まれています。 {{time}} までは 1 回だけ動作します。',
    after:
      '数秒以内に、見つかった各コーディング ツールとともに実行環境がリストに表示されます…',
    tokenTools: 'コーディングツール: {{tools}}。',
    tools: 'コーディングツール',
    toolsHint:
      'この実行環境は、チェックされたツールに対してのみ動作を提供されます。 [実行環境] ページでいつでも変更できます。',
    toolsRequired: '少なくとも 1 つのコーディング ツールを選択してください。',
    slots: '最大同時実行',
    slotsHint:
      '実行環境が一度に実行する回数。 [実行環境] ページでいつでも変更できます。',
    tokenSlots: '最大同時実行数: {{slots}}。',
    tokenToolSlots: 'コーディング ツールごと: {{limits}}。',
    connected: '{{name}} が接続されました。',
    done: '完了',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    // Keep new guidance available in English until this locale is translated.
    executionFailed:
      '実行に失敗しました。再試行する前に保存された会話を確認してください。',
    fileInputFailures: {
      imageCapability:
        'このモデルには画像入力が設定されていません。画像対応が確認済みのモデルに切り替えてください。',
      unsupportedFormat:
        '選択したモデルにはこの添付形式の入力が設定されておらず、対応するローカルのテキスト抽出機能もありません。対応する文書形式か、ファイル対応が確認済みのモデルを使用してください。',
      formatMismatch:
        '添付ファイルのファイル名とメディアタイプが異なる文書形式を示しています。ファイル形式を確認して再アップロードしてください。',
      invalidInline:
        '添付ファイルのデータが無効か大きすぎます。再アップロードするか、より小さいファイルを使用してください。',
      fileTooLarge:
        '添付ファイルがサイズ上限を超えています。より小さいファイルを使用してください。',
      inputTooLarge:
        '会話の添付ファイルが入力サイズの上限を超えています。より小さいファイルを使うか、新しい会話を始めてください。',
      documentTooLarge:
        '添付ファイルが抽出テキストの上限を超えています。より小さいファイルを使用してください。',
      contextTooLarge:
        '会話の添付ファイルが抽出テキストの上限を超えています。より小さいファイルを使うか、新しい会話を始めてください。',
      fileCount:
        '会話のファイル入力が上限の 100 件を超えました。新しい会話を始めてください。',
      nativeFileCount:
        '会話が設定されたネイティブファイルの上限を超えました。添付を減らすか、対応するテキスト文書に変換してください。',
      unreadable:
        '添付ファイルに読み取れるテキストがありません。スキャン文書には OCR が必要です。',
      extractionFailed:
        '添付ファイルのテキストを抽出できませんでした。文書が読み取れることを確認して再アップロードしてください。',
      extractionTimeout:
        '添付ファイルのテキスト抽出がタイムアウトしました。より小さいファイルを使うか、もう一度お試しください。',
      preparationFailed:
        '添付ファイルを準備できませんでした。アクセス権とファイル形式を確認して再試行してください。',
    },
    untitled: 'タイトルのない会話',
    renamed: '名前変更',
    archivedNamed: 'アーカイブ「{{title}}」',
    unarchived: '会話が復元されました',
    undo: '元に戻す',
    sendFailed:
      'メッセージは送信されませんでした。もう一度やり直してください。',
    availability: {
      online: 'オンライン',
      agentMissing: '削除されました',
      agentArchived: '有効ではありません',
      forbidden: 'あなたは利用できません',
      noModel: '最初にチャットモデルを設定します',
      noRunner: 'オンラインの実行環境がいないため、選択できません',
      othersPersonal: '他人の個人実行環境のみが所持',
      modelUnavailable: 'モデルが利用できません',
    },
    offline: {
      fallbackDone: 'この会話では別のエージェントが使用されています',
      restoreDone: 'スイッチバックしました',
      newSession:
        'エージェントは新しいセッションを開始し、この会話を読み取ります。',
    },
    notice: {
      switchedToDefault:
        '{{own}} が戻るまで、システムのデフォルトである {{name}} に切り替えました。',
      switchedToOnline:
        '{{own}} には現在あなたの実行環境がいないため、{{own}} が戻ってくるまで {{name}} が応答します。',
      onlineFallbackUnavailable:
        'オンライン フォールバック エージェントが応答できません ({{reason}})。この会話は、実行環境を待つ間、{{own}} に残ります。',
      switchedAgent: '会話の履歴を保持して {{name}} に切り替えました。',
      switchedBack: '{{name}} で戻ります。',
      runFailed: 'エージェントは応答する前に停止しました。',
      runFailedReason: 'エージェントは応答する前に停止しました: {{reason}}',
      runCancelled: 'キャンセルが要求されました。',
    },
    consultation: {
      unavailableTitle: '相談したエージェントが不在です',
      snapshotTitle: '当時{{name}}をリクエストしました',
      title: '{{name}}に相談しました',
    },
    steps: {
      thinking: '考え中…',
      reading: '{{subject}}を見て',
      working: '{{subject}}作業中',
    },
    agents: {
      personalOnly: '個人実行環境限定',
      hint: '有効なエージェントをリストし、現在応答できない理由を示します。回答は実行環境上で実行されます。最初の回答は、実行環境が回答するまで待機します (通常は数秒)。',
      chooseFor: 'エージェントを選択してください',
      empty: '選択できるエージェントはありません',
      none: 'エージェントなし',
      unknown: '不明なエージェント',
      placeholder: 'エージェントを選択してください',
      myDefault: '私のデフォルト',
      systemDefault: 'システムデフォルト',
    },
  },
  chatProfile: {
    loadFailed: 'エージェント設定をロードできませんでした',
    defaultAgent: '私のデフォルトのチャットエージェント',
    systemDefault: 'システムデフォルト',
    systemDefaultNamed: 'システムデフォルト ({{name}})',
    noDefault: 'システムデフォルトは設定されていません。',
    saved: 'デフォルトのチャットエージェントが保存されました',
  },
  models: {
    title: 'モデル',
    description:
      'オンライン エージェントが呼び出すモデル サービス、および各エージェントが提供するモデル: エージェント用のチャット モデル、検索用の埋め込みおよび再ランク付けモデル。',
  },
  defaultModel: {
    title: 'デフォルトのチャットモデル',
    description:
      '新しいエージェントやアプリケーションに付属のエージェントなど、独自の応答モデルを持たないオンライン エージェント。',
    none: 'チャット モデルはまだオンになっていません。モデル サービスを追加し、チャット モデルをオンにします。最初のモデルがデフォルトになります。',
    saved: 'デフォルトのチャットモデルは{{model}}になりました。',
  },
  services: {
    list: 'モデルサービス',
    columns: {
      name: '名前',
      provider: 'プロバイダーの種類',
      status: '状態',
    },
    loadFailed: 'モデルサービスをロードできませんでした',
    empty: {
      title: 'モデルサービスはまだありません',
      description:
        'モデル サービスを追加すると、オンライン エージェントはそれを通じて応答できるようになります。',
      readOnly: '管理者にモデル サービスの追加を依頼します。',
    },
    add: {
      open: 'サービスの追加',
      title: 'モデルサービスの追加',
      provider: 'プロバイダーの種類',
      created: '{{title}} を追加しました。',
    },
    status: {
      on: 'オン',
      off: 'オフ',
      noKey: 'APIキーなし',
      noModels: 'モデルなし',
    },
    service: {
      edit: '{{title}}を編集',
      defaultHost: 'プロバイダーのデフォルト',
      actions: '{{title}} のその他のアクション',
      turnOn: 'オンにする',
      turnOff: 'オフにする',
      turnedOn: '{{title}} がオンです。',
      turnedOff: '{{title}} がオフです。',
      name: '名前',
      enabled: '有効',
      enabledHint:
        'オンラインエージェントは、そのモデルがオンになっている間のみ使用できます。',
      saved: '{{title}} が保存されました。',
      delete: '削除',
      deleteTitle: '{{title}}を削除しますか？',
      deleteDescription:
        'そのモデルを使用するエージェントは、別のモデルが与えられるまで応答を停止し、そのモデルの価格は削除されます。',
      deleted: '{{title}}を削除しました。',
    },
    connection: {
      apiKey: 'APIキー',
      keyPlaceholder: 'APIキーを貼り付けます',
      baseUrl: 'ベース URL',
      baseUrlHint: 'Empty はプロバイダーのデフォルトの {{url}} を使用します。',
      baseUrlRequired: 'プロバイダーのアドレス API。',
      baseUrlInvalid: 'ベースの URL は http:// または https://. で始まります',
      test: 'テスト接続',
      testing: 'テスト中…',
      testOk: '接続しました: {{model}} が応答しました。',
      testFailed: '{{model}} は応答しませんでした: {{message}}',
      testNeedsModel: '接続をテストするにはモデルを確認してください。',
      openCodeHint:
        'OpenCode は、リクエストごとに x-opencode-session を送信します（会話ごとに 1 つのセッション ID）。モデルの種類に応じて API が異なります。DeepSeek、GLM、Kimi、MiMo は DeepSeek または OpenAI 互換 API、Claude、MiniMax、Qwen は Anthropic API、GPT、Grok は OpenAI API を使用します。必要な API の種類ごとにサービスを追加し、すべてにこのベース URL を設定してください。',
    },
    models: {
      title: 'モデル',
      description:
        'このサービスが提供するモデルを確認し、それぞれの目的を説明します。チャット モデルはエージェントに応答し、埋め込みモデルは検索用のテキストにインデックスを付け、再ランク付けモデルは検索結果を並べ替えます。埋め込みモデルは、あるサイズのベクトルを要求する場合があります。',
      fetching: 'プロバイダーのモデルを取得しています…',
      fetchFailed: 'プロバイダーはモデルをリストしません: {{message}}',
      fetch: 'モデルのフェッチ',
      search: 'モデルの検索',
      noMatch: '一致するモデルはありません。',
      empty:
        'モデルはまだありません。プロバイダーからそれらを取得するか、その ID によって追加します。',
      add: 'モデルの追加',
      addPlaceholder: 'モデルID',
      kind: '{{model}} の目的',
      kinds: {
        chat: 'チャット',
        embedding: '埋め込み',
        rerank: 'リランク',
      },
      test: 'テスト {{model}}',
      testOk: '{{kind}}と回答しました。',
      testFailed: '回答しませんでした: {{message}}',
      notKind: {
        chat: 'このモデルはチャットモデルのようには見えません',
        embedding: 'このモデルは埋め込みモデルのように見えません',
        rerank: 'このモデルはリランクモデルとは思えません',
      },
      looksLike: '{{notKind}}: {{kind}}と応答します。',
      kindNouns: {
        chat: 'チャットモデル',
        embedding: '埋め込みモデル',
        rerank: 'リランクモデル',
      },
      dimensions: '{{model}}のベクトルサイズ',
      dimensionsPlaceholder: 'デフォルト',
      counts: {
        chat: '{{count}} チャット',
        embedding: '{{count}}埋め込み',
        rerank: '{{count}} リランク',
      },
    },
  },
  prices: {
    loadFailed: 'モデル価格をロードできませんでした',
    section: {
      title: 'モデルの価格',
      description:
        '100 万トークンあたり、入力/出力。レポートではそれらからコストが計算されます。',
      online: 'オンライン（モデルサービス）',
      noOnline:
        'まだ価格が設定されていないモデル。まず、モデル サービスとそのモデルをオンにします。',
      runner: '実行環境 (コーディングツール)',
    },
    price: {
      model: 'モデル',
      state: '価格ソースとアクション',
      input: '入力 / 1M',
      output: '出力 / 1M',
      inputOf: '{{model}}の入力価格、100万トークンあたり',
      outputOf: '{{model}} の出力価格、100 万トークンあたり',
      save: '{{model}} の価格を保存',
      saved: '{{model}}の価格が保存されました。',
      remove: '{{model}}の価格を削除',
      removed: '{{model}}の価格が削除されました。',
      unpriced: '価格なし',
      unpricedHint:
        '価格が確定するまで、レポートではコストが「—」と表示されます。',
      via: '{{pattern}} による',
      viaHint:
        'ルール {{pattern}} に従って価格が設定されます。ここで保存すると、このモデルに独自の価格が与えられます。',
      invalid: '価格は0以上の数値です。',
      readOnly: 'モデルの価格を管理する人のみが変更できます。',
    },
    tool: {
      description:
        '{{tool}} の実行コスト。各実行レポートのモデルごとに価格が設定されます。',
      subscription: 'サブスクリプション (課金されません)',
      subscriptionTag: '定期購入',
      subscriptionHint:
        '月額プランで支払い: レポートには実行費用はかかりません。',
      subscribed: '{{tool}} はサブスクリプションによって請求されます。',
      unsubscribed: '{{tool}} は価格によって請求されます。',
      seen: '走行中に見られるモデル',
      noneSeen: '{{tool}} の実行モデルはまだ報告されていません。',
      rules: '価格ルール ({{count}})',
      rulesHint:
        'ルールはモデル ID または claude-sonnet-4* などのパターンです。最も具体的な一致が勝ちます。',
      ruleModel: 'モデルまたはパターン',
      addRule: '価格を追加',
      ruleAdded: '{{model}}の価格を追加しました。',
    },
  },
  skills: {
    attachments: 'アタッチメント',
    globalMount: 'グローバルアタッチメント',
    globalMountDescription:
      'すぐに保存されます。今後のすべての実行にはこのスキルが適用されます。',
    mountSaved: 'アタッチメントの設定が保存されました。',
    mountRetry: '設定を読み込めませんでした。再試行',
    unavailableTarget: 'ターゲットが利用できません',
    noAttachments: 'どこにも付いていません。',
    title: 'スキル',
    description:
      'サポートファイルを含む再利用可能な指示。チームのデフォルトをグローバルに、またはプロジェクトまたは作業ディレクトリにアタッチします。',
    new: '新スキル',
    newTitle: '新スキル',
    newDescription:
      'SKILL.md と書きます: 前付の名前とスキルの説明。ファイルを今すぐ追加するか、後で追加します。',
    breadcrumb: 'スキル',
    loadFailed: 'スキルをロードできませんでした',
    backToList: 'スキルに戻る',
    emptyTitle: 'まだスキルがありません',
    emptyDescription:
      'スキルを追加すると、タスクでそのスキルが呼び出されるたびに、エージェントはその SKILL.md を読み取ります。',
    emptyReadOnly: '管理者にスキルの追加を依頼してください。',
    content: 'SKILL.md',
    contentHint:
      '前付の名前はスキルのフォルダー名です。これを変更するとスキルの名前が変更されます。説明はエージェントにいつ読むべきかを伝えます。',
    contentTooLarge: 'SKILL.mdは{{max}}より大きいです。',
    emptyContent: 'このスキルにはまだコンテンツがありません。',
    created: 'スキル「{{name}}」を作成しました',
    saved: 'バージョン {{version}} として保存されました。',
    saveVersion: '新しいバージョンを保存',
    editing: '編集',
    note: 'メモ',
    notePlaceholder: 'このバージョンでの変更点（オプション）',
    deleted: 'スキル「{{name}}」を削除しました。',
    edit: '編集',
    delete: 'スキル削除',
    deleteTitle: 'スキル「{{name}}」を削除しますか？',
    deleteDescription:
      'このスキルをデフォルトとして使用しているすべてのエージェントとすべての場所は、それを失います。',
    readOnly:
      'このスキルを変更できるのは、スキルの作成者とワークスペース管理者だけです。',
    conflict:
      '他の人がこのスキルを変更しました。最新バージョンがロードされています。もう一度やり直してください。',
    conflictTitle: '他の人がこのスキルを変更しました',
    conflictDraft:
      '編集を開始した後に誰かが新しいバージョンを保存したため、変更は保存されませんでした。残しておきたいものをコピーし、最新バージョンをロードして再度編集します。',
    loadLatest: '最新バージョンをロードする',
    mountedAgents: '付属エージェント',
    noAgents: 'まだエージェントに所属していません。',
    defaults: 'デフォルトスキル: {{places}}。',
    defaultsSeparator: ', ',
    files: 'ファイル',
    usage: '{{files}}/{{maxFiles}} ファイル · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} は {{max}} より大きいです。',
    uploadInvalidName:
      '{{name}} をここに追加することはできません。まず名前を変更します。',
    skillTooLarge: 'スキルは合計で最大 {{max}} を保持します。',
    tooManyFiles: 'スキルは最大でも {{max}} ファイルを保持します。',
    filesTooLarge: '{{max}} より大きい: {{paths}}。',
    binaryFile: 'バイナリ ファイル、{{size}}。ここでは編集できません。',
    executable: '実行可能ファイル',
    scriptBadge: 'スクリプト',
    scriptsNote:
      'スクリプトがあります: オンライン エージェントはスクリプトを読み取ることはできますが、実行することはできません',
    compatibility: '互換性: {{value}}',
    fileContent: '{{path}}の内容',
    export: '輸出',
    exportVersion: 'バージョン {{version}} を zip としてエクスポート',
    import: '輸入',
    importVersion: '新しいバージョンをインポートする',
    imported: 'スキル「{{name}}」をインポートしました。',
    importInvalid: 'アーカイブの SKILL.md は使用できません: {{problem}}',
    tree: {
      label: 'スキルファイル',
      newFile: '新しいファイル',
      newFolder: '新しいフォルダー',
      upload: 'ファイルをアップロードする',
      actionsFor: '{{name}}のアクション',
      rename: '名前を変更する',
      delete: '削除',
      download: 'ダウンロード',
      replace: '交換',
      markExecutable: '実行可能としてマーク',
      unmarkExecutable: '実行不可能としてマークする',
      dropHint:
        'ファイルをフォルダーにドロップして、そこにアップロードします。',
    },
    entry: {
      description: '名前は既存のファイルと照合されます。',
      folderHint:
        '空のフォルダーは保存されません。保存する前にファイルを追加してください。',
      location: '所在地',
      root: 'スキルフォルダ(/)',
      name: '名前',
      renameTitle: '「{{name}}」の名前を変更',
      conventional: {
        scripts:
          'コードエージェントを実行できます。オンライン エージェントは読むだけです。',
        references: '文書エージェントは必要なときに読みます。',
        assets: 'テンプレート、画像、その他のリソース。',
      },
      problems: {
        required: '名前を入力します。',
        invalid:
          '「.」以外の「/」を含まない名前を使用してください。そして ".."。',
        taken: 'この名前のファイルまたはフォルダーはすでに存在します。',
        reserved: 'SKILL.md はスキルそのものです。別の名前を選択してください。',
      },
      deleteFileTitle: 'ファイル「{{name}}」を削除しますか?',
      deleteFolderTitle:
        'フォルダー「{{name}}」とその中のすべてを削除しますか?',
      deleteDescription:
        'この草案からは削除されました。保存されたバージョンではそれが保持されます。',
    },
    editor: {
      write: '書き込み',
      preview: 'プレビュー',
      nothingToPreview: 'プレビューするものはまだありません。',
      noPreview: 'この種類のファイルにはプレビューがありません。',
    },
    frontMatter: {
      title: 'SKILL.mdの前付を修正',
      reasons: {
        missing:
          'SKILL.md を 2 つの「---」行の間に前付けで、名前と説明を付けて開始します。',
        yaml: '前付が有効な YAML ではありません。',
        notMapping:
          '前付は「name: my-skill」のようにキーと値でなければなりません。',
        required: '{{field}}を追加します。',
        empty: '{{field}} を空にすることはできません。',
        type: '{{field}}の型が間違っています。',
        tooLong: '{{field}} は {{max}} 文字よりも長いです。',
        pattern:
          '名前には小文字、数字、単一のハイフンが使用されており、ハイフンで開始または終了しません。',
        mismatch:
          'name は、SKILL.md を含むフォルダーの名前である必要があります。',
        taken: '別のスキルにもこの名前があります。別のものを選択してください。',
      },
    },
    template: {
      description: 'このスキルの機能とエージェントがいつ使用する必要があるか。',
      title: '新スキル',
      whenToUse: '使用する場合',
      whenToUseHint: 'このスキルが必要なタスクについて説明します。',
      steps: 'ステップ',
      stepsHint: '1. 最初にすること。\n2. 次にすること。',
      examples: '例',
      examplesHint: '入力と良好な結果がどのようなものかを示します。',
    },
    columns: {
      name: '名前',
      description: '説明',
      files: 'ファイル',
      version: 'バージョン',
      agents: 'エージェント',
      updated: '更新しました',
    },
    versions: {
      title: 'バージョン',
      description:
        '保存するたびに新しいバージョンが作成され、エージェントには常に最新のバージョンが渡されます。',
      current: '現在',
      compare: '比較する',
      compareTitle: 'バージョン{{version}} → バージョン{{current}}',
      compareDescription: 'それ以降削除された行は赤、追加された行は緑です。',
      unchanged: '変更なし',
      restore: '復元',
      restoreTitle: 'バージョン {{version}} を復元しますか?',
      restoreDescription:
        '最新バージョンとして再保存されます。エージェントは次回の実行時にそれを取得します。何も失われません。現在のバージョンが履歴に残ります。',
      restored:
        'バージョン{{version}}をバージョン{{current}}として復元しました。',
    },
  },
  runWait: {
    capacity:
      'ここで使用されるスロット {{used}}/{{limit}}; {{detail}};アプリ全体で無料と報告されています {{reportedFree}}',
    reasons: {
      updatePending: '更新を待っている実行環境;新作は一時停止中です',
      pruning: '実行環境クリーニング共用店舗。新作は一時停止中です',
      toolNotInstalled:
        'このツールがインストールされている接続された実行環境はありません',
      incompatible:
        '接続された実行環境はこのワークロードをサポートしません。アップグレードが必要です',
      restricted: '実行環境ポリシー、ディレクトリ、または変数の制限',
      unknown: 'ワークロードの適格性が確立されていません',
      agentArchived: 'エージェントはアーカイブされています',
      delayed: '{{until}}予定',
      noRunnerOnline: 'オンラインでは実行環境がありません',
      runnersOffline: '実行環境がオフラインです',
      toolQuota: 'ツールの利用枠を使い切りました；リセット時刻：{{until}}',
      toolUnavailable:
        'ツールがサインインしていないか、無効になっているか、要求されたモデルが利用できません ({{tool}})',
      noSharedRunner: '他人の個人実行環境のみがオンラインです',
      missingFeatures: '{{features}} に対応する実行環境はありません',
      secretsNotAllowed:
        'チーム 実行環境が必要: {{variables}} はチーム 実行環境専用です',
      sameWorkActive: 'すでに実行した後',
      concurrencyFull: '同時実行フル ({{active}}/{{limit}})',
      runnersBusy: '互換実行環境がいっぱいです',
      toolSlotsFull: '{{tool}} スロットがいっぱいです ({{used}}/{{limit}})',
      setupRetrying: '準備に失敗しました。再試行中: {{detail}}',
      next: '次は無料実行環境へ',
    },
    unknown: 'キューに登録されました ({{reason}})',
    quotaResetUnknown: '不明',
    unknownValue: '—',
  },
  access: {
    section: 'エージェントチーム',
    businessSection: 'エージェントチーム',
    businesses: {
      agents: {
        title: 'エージェントとスキル',
        description: 'チームのエージェントと彼らが使用するスキル。',
        actions: {
          edit: {
            title: 'エージェントとスキルの変更',
            description:
              'エージェントの設定、スキル、変数の変更、アーカイブ、復元、削除、スキルの編集を行います。エージェントには編集者以上の権限は与えられません',
            related:
              'エージェントとスキルの変更（所有するエージェントと作成したスキル）',
            relatedLabel: '私が所有するエージェントと私が作成したスキル',
            relatedHint: '私がオーナーであるエージェントと私が作成したスキル',
            all: 'チェンジエージェントとスキル(全て)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'エージェント',
        runners: '実行環境',
        prices: 'モデルの価格',
        services: 'モデルサービス',
      },
    },
    actions: {
      read: '表示',
      manage: '管理する',
    },
    keyScopes: {
      agents: {
        title: 'エージェント',
        description:
          'エージェント、スキル、ランを参照。エージェントとスキルを変更し、実行をキャンセルして再試行します。',
      },
      runners: {
        title: '実行環境',
        description: '実行環境と登録トークンを参照。実行環境を管理します。',
      },
      prices: {
        title: 'モデルの価格',
        description:
          'モデルの価格を参照してください。コストは以下から推定されます。それらを変更してください。',
      },
      services: {
        title: 'モデルサービス',
        description:
          'モデル サービスとそれらが提供するモデルを参照し、そのキーを参照しないでください。',
      },
    },
  },
};

export default jaJP;
