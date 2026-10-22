import type { FoundationResource } from './en-US.js';

const jaJP: FoundationResource = {
  nav: {
    settings: 'システム設定',
    foundation: 'アプリ基盤',
  },
  page: {
    title: 'アプリ基盤',
    description:
      'アプリは業務に集中できます。データ、権限、ワークフローは、NocoBase が継続的に開発・テスト・保守し、公式リリースで更新する NocoBase Core の共通機能が支えます。',
    bandTitle: 'NocoBase Core',
    bandDescription:
      '使用中の機能が順番に点灯します。選択すると用途を確認できます。',
    score: '{{active}} / {{total}}',
    scoreCaption: '件の基盤機能がアプリを支えています',
    refresh: '更新',
    refreshing: '収集中…',
    updatedAt: '収集日時 {{time}}',
    loading: '機能情報を収集中…',
    refreshFailed:
      '更新に失敗しました。最後に正常に取得した結果を表示しています。',
    loadFailed: '概要を読み込めませんでした。',
    forbidden: '無制限のアクセス権を持つ管理者のみ閲覧できます。',
    retry: '再試行',
    undetermined_one: '{{count}} 件の機能を確認できません',
    undetermined_other: '{{count}} 件の機能を確認できません',
    highlightsLabel: '主要な数値',
    unavailable: '取得不可',
    lowerBound: '一部を読み取れないため下限値です。',
  },
  matrix: {
    collections: '関連コレクション：{{names}}',
    title: '業務モジュールと基盤機能',
    description:
      '各モジュールを支える基盤機能を確認できます。チェックを選ぶと、関連の根拠と独自実装で必要になる作業を確認できます。',
    modules: '業務モジュール',
    summary: '{{count}} 機能 · {{pages}} ページ',
    inspect: '{{module}} と {{capability}} の関連を確認',
    unknown: '未識別',
    empty:
      '業務モジュールはまだ見つかりません。ページとメニューを追加すると自動的に表示されます。',
    legend:
      '✓ は確認できた連携、· は未識別を示します。コード参照は依存関係であり、実行回数ではありません。',
    partial:
      '一部のページ依存関係を読み取れません。確認済みの関連は表示されます。',
    evidence: {
      page: 'アプリのページとして登録',
      authentication: 'ログインが必要なページ',
      authorization: 'ページのアクセス権限を設定',
      provider: 'このプロバイダーが提供するページ',
      source: 'ページコードが参照するプロバイダー',
      apiSource: '対応する API 処理コードが参照するプロバイダー',
    },
  },
  inventory: {
    recognitionNotes: '識別について',
    title: '機能と提供元',
    description:
      '現在のアプリに接続されたコア、公式・Pro プラグインとアプリ拡張の能力を表示します。',
    discovered: '検出した提供パッケージ',
    mapped: '分類済み提供パッケージ',
    unmapped: '未分類の提供パッケージ',
    partial: '検出は不完全です。読み取り不可：{{sources}}。',
    selectedCategory: '{{category}} の提供元',
    usageBoundary:
      '上の状態は分類全体を表し、各パッケージの有効化、設定、使用を意味しません。',
    noCategoryProviders: '現在のカタログで識別できる提供元はありません。',
    extensionsTitle: '追加の提供元 · 識別待ち',
    extensionsDescription:
      '未分類の提供元も表示します。外部連携や未使用には自動分類しません。',
    noExtensions: '現在の検出範囲に追加の提供元はありません。',
    discoveryBoundary:
      '対象はアプリの直接依存、既知の提供元、公開された DB・転送 API の構成情報、ブラウザーで確認できるクライアント構成です。全実行時構成、間接拡張、アプリ内モジュールは網羅しません。出自と Pro 区分は信頼できるカタログで確認し、名前やライセンスだけでは判定しません。',
    versionUnknown: 'バージョン不明',
    origin: '出自',
    officialCatalog: 'NocoBase カタログ',
    unverifiedOrigin: '出自未確認',
    installation: 'インストール',
    installed: 'マニフェスト確認済み',
    manifestUnavailable: 'マニフェスト取得不可',
    registration: '登録',
    observed: '現在の実行時構成を確認済み',
    registrationUnknown: '未確認 · 無効とは限りません',
    evidence: '根拠',
    noEvidence: '確認できた根拠なし',
    categories: '分類',
    awaitingRecognition: '分類待ち',
    evidenceLabels: {
      manifest: 'インストール済みマニフェスト',
      databaseContribution: 'DB タスク構成',
      apiContribution: '転送 API 構成',
      foundationRuntime: '基盤サービス実行中',
      clientContribution: 'ブラウザーで確認したクライアント構成',
      serverRegistration: 'サーバープラグイン登録',
    },
  },
  status: {
    active: '使用中',
    needsSetup: '利用可能・設定待ち',
    unused: '未使用',
    undetermined: '未確認',
    legendActive: '使用中 {{count}}',
    legendNeedsSetup: '設定待ち {{count}}',
    legendUnused: '未使用 {{count}}',
  },
  detail: {
    collectionCount: 'データテーブル {{count}} 件',
    collectionPreview: 'データテーブルのプレビュー',
    collectionsTitle: 'データテーブル',
    noCollectionMatches: '一致するテーブルがありません',
    noCollectionMatchesHint: '別の名前を試すか、検索をクリアしてください。',
    collectionRange: '{{total}} 件中 {{from}}–{{to}} 件',
    closeCollections: 'テーブル一覧を閉じる',
    viewCollections: 'すべてのコレクションを表示',
    searchCollections: 'コレクションを検索',
    collectionResults: '一致するコレクション：{{count}}',
    previousPage: '前へ',
    nextPage: '次へ',
    countRecords: '業務レコード数を集計',
    recordsOnDemand:
      '業務レコード数は必要時に集計します。大規模なデータベースでは時間がかかる場合があります。',
    recordsCountedAt: 'レコード集計日時：{{time}}',

    businessModules: '関連する業務モジュール',
    inThisApp: 'このアプリでの用途',
    withoutFoundation: '基盤がない場合',
    onceInUse: '使用すると',
    whyNot: '未使用の理由',
    liveData: '実際のデータ',
    parts: '構成要素',
    packages: 'NocoBase 提供パッケージ',
    noPackages: '該当パッケージは未インストールです。',
    noFacts: '確認済みの情報はありません。',
    partial: '一部の根拠を読み取れません。下限表示は読み取れた値のみです。',
    failed: '今回は確認できず状態は不明です。更新して再試行してください。',
    unreadable: '読み取り不可：{{sources}}',
    timeout: '確認がタイムアウトしました。',
  },
  capabilities: {
    dataModeling: {
      name: 'データモデリング',
      tagline: 'コレクション、フィールド、関連、マイグレーション',
      without:
        '構造変更、クエリ、絞り込み、ページ分割、注入対策、DB 互換性を独自に実装する必要があります。',
      onceInUse:
        'マイグレーションで定義し、共通のクエリで対応 DB を利用できます。',
    },
    files: {
      name: 'ファイル管理',
      tagline: 'アップロード、保存、添付',
      without:
        'アップロード、保存先、サイズ・形式検査、ダウンロードを独自に実装する必要があります。',
      onceInUse: '共通のファイル構造と保存設定で添付を扱えます。',
    },
    usersAndOrganizations: {
      name: 'ユーザーと組織',
      tagline: 'アカウント、ログイン、招待',
      without:
        '登録、ログイン、セッション、パスワード再設定、アカウント保護を独自に実装する必要があります。',
      onceInUse: 'アカウント、ログイン、招待を集中管理できます。',
    },
    permissions: {
      name: '権限制御',
      tagline: '権限セット、共有・制限ルール',
      without:
        '各 API で権限検査を実装し、変更も個別に管理する必要があります。',
      onceInUse:
        '権限セットでページ、データ、操作を許可し、サーバーで毎回検査します。',
    },
    workflows: {
      name: 'ワークフローと承認',
      tagline: 'ライフサイクル、状態遷移、スケジュール',
      without:
        '状態遷移、履歴、再試行、タイムアウトを独自に実装する必要があります。',
      onceInUse:
        'ライフサイクルで遷移条件、履歴、自動再試行を備えた業務フローを定義できます。',
    },
    aiAgents: {
      name: 'AI とエージェント',
      tagline: 'モデルサービス、エージェント、ランナー',
      without:
        'モデル接続、鍵管理、使用記録、安全な実行を独自に実装する必要があります。',
      onceInUse:
        'モデルサービスを有効にして OnlineAgent とモデルゲートウェイを利用するか、ランナーを登録してエージェントを実行します。',
    },
    knowledge: {
      name: 'ナレッジベース',
      tagline: 'スペース、文書、検索',
      without:
        '文書保存、バージョン、アクセス制御、検索を独自に構築する必要があります。',
      onceInUse:
        '文書のバージョンとアクセスを管理し、人やエージェントが検索できます。',
    },
    mail: {
      name: 'メール',
      tagline: 'メールボックス、同期、送信',
      without:
        '各サービスの接続、同期、認可、再送を独自に実装する必要があります。',
      onceInUse: 'アプリ内でメールを閲覧、同期、送信できます。',
    },
    notifications: {
      name: '通知',
      tagline: 'チャネル、配信、アプリ内メッセージ',
      without: 'チャネルごとの送信、再試行、重複排除、配信履歴が必要です。',
      onceInUse:
        '設定済みチャネルを通じて再試行・重複排除・履歴付きで送信できます。',
    },
    integrations: {
      name: '外部連携',
      tagline: 'API キーと外部アクセス',
      without: '外部システムごとの認証情報発行と検査が必要です。',
      onceInUse: '所有者の権限を引き継ぐ API キーで外部から呼び出せます。',
    },
    interface: {
      name: '画面と設定',
      tagline: 'ページ、ナビゲーション、言語、テーマ',
      without:
        'ルーティング、メニュー、翻訳、テーマを独自に構築する必要があります。',
      onceInUse:
        'NocoBase のクライアント基盤が画面、メニュー、言語、テーマを提供します。',
    },
    audit: {
      name: '操作監査',
      tagline: '重要な操作の記録',
      without: '重要な変更を誰が実行したか各所で記録する必要があります。',
      onceInUse: 'アプリ全体の重要な操作履歴を一元管理できます。',
    },
    operations: {
      name: '基盤運用',
      tagline: 'マイグレーション、ジョブ、キュー、シークレット',
      without:
        'DB 更新、バックグラウンド処理、キュー、機密情報管理を独自に実装する必要があります。',
      onceInUse:
        '履歴付きマイグレーションとサーバーのジョブ、キュー、機密情報管理を利用できます。',
    },
  },
  reasons: {
    installedNotUsed:
      'インストール済みですが、現在の有効化または使用を示す根拠は確認されていません。',
    noRecognizedAudit:
      '現在のカタログでは監査提供元を識別できません。別の拡張が提供している可能性があります。',
    noDatabase: 'DB を使用していません。',
    notRegistered: '提供するプラグインはアプリに登録されていません。',
    notProvided: 'NocoBase Core はまだ提供していません。',
    noFileCollection: 'ファイル用コレクションはありません。',
    noDrive: 'ファイル用コレクションはありますが保存先が未設定です。',
    noAccounts: 'アカウントはありません。',
    onlyUnrestrictedAccess:
      '無制限管理者のみアクセスでき、他のユーザーへの権限付与はありません。',
    noWorkflows: '永続化したライフサイクルも有効なスケジュールもありません。',
    noSchedules: '有効なスケジュールはありません。',
    noModelOrRunner: '有効なモデルサービスも登録済みランナーもありません。',
    noModelService: '有効なモデルサービスはありません。',
    noAgent: 'エージェントは未定義です。',
    noDocuments: 'ナレッジスペースに文書はありません。',
    noConnectedMailbox: '接続済みメールボックスはありません。',
    noChannel: '通知チャネルは未設定です。',
    noApiKey: 'API キーはありません。',
    noUsedApiKey: 'API キーはありますが呼び出しに未使用です。',
    noClient: 'NocoBase クライアントを提供していません。',
    notConfigured: '未設定です。',
  },
  facts: {
    collectionOwnershipUnknown:
      '未分類の実行時拡張があるためコレクションの所有元が不明です。業務統計は表示しません。',
    noApplicationCollections:
      'データ基盤は稼働中ですがアプリ固有のコレクションはまだありません。',
    applicationCollectionsPreview:
      'このアプリには {{count}} 個のコレクションがあります。例：{{names}}。',
    applicationCollections:
      'アプリ固有のコレクション {{count}} 件：{{names}}。',
    relations: '関連 {{count}} 件。',
    fileCollections: 'ファイル用コレクション {{count}} 件：{{names}}。',
    accounts: 'NocoBase 認証でログインするアカウント {{count}} 件。',
    permissionSets: '無制限以外の権限セット {{count}} 件：{{names}}。',
    accessRules: '共有・制限・既定アクセスのルール {{count}} 件。',
    lifecyclesWithoutTransitions:
      'ライフサイクル保存は構成済みですが遷移履歴はありません。',
    lifecycles:
      '{{count}} 件のライフサイクルで {{transitions}} 回遷移：{{names}}。',
    schedules: '有効なスケジュール {{count}} 件。',
    modelServices:
      '{{count}} 件の有効なモデルサービスが OnlineAgent とモデルゲートウェイを支えています。',
    runners: '{{count}} 件の登録済みランナーがエージェントを実行します。',
    agents: 'エージェント {{count}} 件、実行 {{runs}} 回。',
    documents: 'ナレッジ文書 {{count}} 件。',
    mailboxes: '接続済みメールボックス {{count}} 件。',
    mailboxesNeedAttention:
      '同期再開に対応が必要なメールボックス {{count}} 件。',
    channels: '通知チャネル {{count}} 件：{{names}}。',
    usedApiKeys: '呼び出しに使用した API キー {{count}} 件。',
    locales: '対応言語 {{count}} 種：{{names}}。',
    migrations:
      'マイグレーション {{count}} 件実行済み、アプリ固有 {{own}} 件。',
    latestMigration: '最終実行：{{at}}。',
    registeredExtension: 'この拡張はアプリに登録されています。',
  },
  parts: {
    accounts: 'アカウント',
    organizations: '組織',
    permissionSets: '権限セット',
    sharingRules: '共有ルール',
    restrictionRules: '制限ルール',
    defaultAccess: '既定アクセス',
    lifecycles: 'ライフサイクル',
    schedules: 'スケジュール',
    modelServices: 'モデルサービス',
    agents: 'エージェント',
    runners: 'ランナー',
    migrations: 'マイグレーション',
    jobs: 'ジョブ',
    queue: 'キュー',
    secrets: 'シークレット',
    caching: 'キャッシュ',
  },
  metrics: {
    businessRecords: '業務レコード',
    businessCollections: '業務コレクション',
    views: 'ビュー',
    fields: 'フィールド',
    relations: '関連',
    systemCollections: 'NocoBase システムコレクション',
    files: 'ファイル',
    storedBytes: '記録済み保存容量',
    fileCollections: 'ファイル用コレクション',
    accounts: 'アカウント',
    disabledAccounts: '無効なアカウント',
    invitations: '招待',
    grants: '権限付与',
    permissionSets: '権限セット',
    assignments: '割り当て',
    sharingRules: '共有ルール',
    restrictionRules: '制限ルール',
    defaultAccess: '既定アクセスルール',
    transitions: '状態遷移',
    lifecycles: '遷移のあるライフサイクル',
    effectsSucceeded: '成功した効果',
    effectsFailed: '失敗した効果',
    effectsPending: '待機中の効果',
    schedules: '有効なスケジュール',
    scheduleOccurrences: 'スケジュール実行',
    agents: 'エージェント',
    modelServices: '有効なモデルサービス',
    runners: 'ランナー',
    runs: '実行',
    modelCalls: '実行外のモデル呼び出し',
    tokens: 'トークン',
    documents: '文書',
    spaces: 'ナレッジスペース',
    chunks: 'チャンク',
    connectedMailboxes: '接続済みメールボックス',
    mailboxesNeedAttention: '対応待ちメールボックス',
    messages: 'メール',
    submissions: '送信要求',
    failedSubmissions: '送信失敗',
    acceptedDeliveries: '提供元が受理した配信',
    notifications: '通知',
    deliveries: '配信',
    failedDeliveries: '配信失敗',
    pendingDeliveries: '配信中',
    deliveryAttempts: '配信試行',
    inAppMessages: 'アプリ内メッセージ',
    inAppMessagesRead: '既読のアプリ内メッセージ',
    channels: 'チャネル',
    usedApiKeys: '使用済み API キー',
    apiKeys: '有効な API キー',
    locales: '言語',
    migrations: '実行済みマイグレーション',
    applicationMigrations: 'アプリ固有のマイグレーション',
    seeds: '実行済みシード',
  },
  dynamic: {
    pending: '識別待ち',
    pendingDescription:
      'このプラグインは登録済みです。設定と実際の使用状況は未確認です。',
  },
};

export default jaJP;
