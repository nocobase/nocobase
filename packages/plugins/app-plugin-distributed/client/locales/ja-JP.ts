import type { DistributedResource } from './en-US.js';

const jaJP: DistributedResource = {
  nav: {
    title: 'クラスターと分散構成',
    description:
      'このインスタンスが使用しているバックエンドと、アプリケーションを複数インスタンスで実行できるかどうか。',
  },
  page: {
    description:
      '複数のサーバーやプロセスで実行するには、キャッシュ、ロック、バックグラウンドジョブ、キュー、リアルタイムメッセージ、ID 生成で共有バックエンドを使用する必要があります。このページでは、このインスタンスが実際に選択したバックエンドと各設定の出所を表示し、アプリケーションを複数インスタンスで安全に実行できるかを確認します。設定はアプリケーション構成にあり、変更後は再デプロイが必要です。',
    loading: '読み込み中…',
    loadFailed: 'ステータスを読み込めませんでした。',
    retry: '再試行',
  },
  summary: {
    single: '単一インスタンス',
    singleCaption: '現在の構成は単一インスタンス向けです',
    singleBlockedCaption: '単一インスタンスでも対応が必要な項目があります',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'サービスが共有済み',
    requiredCaption: '要対応',
    recommendedCaption: '推奨',
  },
  sections: {
    scale: '複数インスタンスで実行できるか',
    services: '共有サービス',
    idGeneration: 'ID 生成',
    checklist: '本番公開前の確認',
    notes: '注意事項',
  },
  level: {
    required: '要対応',
    recommended: '推奨',
    ok: '問題なし',
  },
  singleBlocked:
    '単一インスタンスでも、下の「要対応」の項目には対応が必要です。',
  singleHint:
    '単一インスタンスで実行する場合は変更不要です。スケールアウトするには：Redis と共有の PostgreSQL または MySQL データベースを用意 → 必要な Redis プラグインをインストール → 構成を変更 → 2 つのインスタンスで検証します。',
  fix: '対処方法',
  table: {
    service: 'サービス',
    backend: '選択されたバックエンド',
    sharing: '範囲',
    plugin: 'Redis プラグイン',
    source: '出所',
    adapter: 'アダプター',
  },
  services: {
    caching: {
      name: 'キャッシュ',
      usage: 'ログイン状態、権限、設定のキャッシュ',
    },
    concurrency: {
      name: '同時実行ロック',
      usage: 'マイグレーション、採番、冪等性',
    },
    jobs: {
      name: 'バックグラウンドジョブ',
      usage: 'スケジュールタスク、ナレッジのインデックス作成',
    },
    queue: { name: 'キュー', usage: '通知の配信' },
    realtime: {
      name: 'リアルタイムメッセージ',
      usage: '受信箱、オンライン状態',
    },
  },
  sharing: {
    shared: 'インスタンス間で共有',
    local: 'このインスタンスのみ',
    unknown: '未宣言',
  },
  source: { configured: '設定済み', default: 'デフォルト' },
  notSet: '（未設定）',
  unavailable: 'このアプリケーションでは未使用',
  unregistered: 'アダプター未登録',
  selections: '名前で選択',
  selection: '{{consumer}} → {{backend}}',
  howToChange: '変更方法',
  howToChangeIntro:
    '各サービスの Redis プラグインをインストールし、そのサーバープラグインを登録してから、構成で選択します：',
  idGeneration: {
    mode: 'モード',
    modeHint:
      '複数インスタンスでは、各インスタンスが固有の worker ID を取得できるよう自動割り当てにしてください。',
    auto: '自動 · インスタンスごとに 1 つの worker ID',
    manual: '手動 · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'これらはページ側では確認できません。2 つのインスタンスで実際に操作して確認してください：',
    files:
      'インスタンス A でアップロードしたファイルをインスタンス B からダウンロードできる',
    realtime:
      'A で発生したメッセージが B に接続中のユーザーにリアルタイムで届き、再接続後も失われない',
    queue:
      'A でキューに入れたタスクを B が処理でき、再試行で副作用が重複しない',
    secrets:
      'すべてのインスタンスが同じ secrets.keys を使用し、ログインがインスタンス間で有効である',
    websocket:
      'ロードバランサーが WebSocket 接続を転送し、アプリケーションのパスとドメインに一致している',
  },
  notes: {
    current:
      'このページには接続中のインスタンスのみが表示されます。他のインスタンスが同じ構成かどうかは判断できないため、同じ構成からデプロイしてください。',
    noTest:
      '「接続テスト」はありません。Redis プラグインはアプリケーションの起動時に接続し、接続できない場合はアプリケーションが起動しません。実行中の接続エラーはログに記録されます。',
    instances:
      '実行中のインスタンス一覧は、商用プラグインが提供する worker ID の自動割り当てを使用している場合にのみ表示されます。',
  },
  checks: {
    database: {
      sqlite: {
        title: 'データベース',
        detail:
          'SQLite は単一インスタンスにしか対応しません。複数インスタンスには PostgreSQL または MySQL が必要です。',
        fix: 'データを PostgreSQL または MySQL に移行し、メインのデータベース接続をそこに向けてください。',
      },
      shared: {
        title: 'データベース',
        detail:
          '{{dialect}} は複数のインスタンスで共有できます。本番前に、すべてのインスタンスが同じデータベースに接続していることを確認してください。',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} でアダプター「{{adapter}}」が選択されていますが、登録済みのプラグインはこれを提供していません。このサービスは初回使用時に失敗します。',
        fix: '「{{adapter}}」を提供するプラグインをインストールして登録するか、別のバックエンドを選択してください。',
      },
      local: {
        title: '{{service}} がまだこのインスタンスのみです',
        detail:
          '各インスタンスが個別に状態を保持します。{{plugin}} をインストールし、{{configPath}} を Redis バックエンドに設定してください。',
        fix: '{{plugin}} をインストールし、そのサーバープラグインを登録してから選択します：',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          'アダプター「{{adapter}}」はインスタンス間で共有されるかを宣言していません。提供しているプラグインで確認してください。',
      },
      selectionUndeclared: {
        title: '{{service}}',
        detail:
          '{{consumer}} はバックエンド「{{backend}}」を明示的に使用していますが、そのアダプターはインスタンス間で共有されるかを宣言していません。提供元のプラグインで確認してください。',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} はバックエンド「{{backend}}」を明示的に使用しており、これはこのインスタンスのみのものです。',
      },
    },
    services: {
      local: {
        title:
          'キャッシュ、ロック、バックグラウンドジョブ、キュー、リアルタイムメッセージ',
        detail: 'すべてこのインスタンスのみ：{{services}}。',
      },
    },
    files: {
      local: {
        title: 'ファイルストレージ',
        detail:
          '{{collections}} のファイルはこのホストのディスクにあり、他のインスタンスからは読み取れません。',
        fix: 'これらのファイルコレクションには S3 などの共有ストレージを使用し、既存のファイルを移動してください。',
      },
      defaultLocal: {
        title: 'ファイルストレージ',
        detail:
          'デフォルトのストレージはこのホストのディスクにファイルを保存しており、他のインスタンスからは読み取れません。',
        fix: 'デフォルトのストレージを S3 などの共有ストレージに設定してください。',
      },
      shared: {
        title: 'ファイルストレージ',
        detail:
          'このホストのディスクにファイルを保存しているファイルコレクションはありません。',
      },
      unchecked: {
        title: 'ファイルストレージ',
        detail:
          '接続 {{connections}} のファイルコレクションを読み取れなかったため、このホストのディスクにファイルがあるかどうかは不明です。',
      },
    },
    idGeneration: {
      auto: {
        title: 'ID 生成',
        detail: '自動割り当て：各インスタンスが固有の worker ID を取得します。',
      },
      manual: {
        title: 'ID 生成',
        detail:
          '手動の worker ID {{workerId}}。同じ worker ID を持つ 2 つのインスタンスは同じ ID を生成する可能性があります。',
        fix: '各インスタンスに固有の SNOWFLAKE_WORKER_ID を設定するか、worker ID を自動で割り当てるプラグインをインストールしてください。',
      },
    },
    secrets: {
      set: {
        title: 'シークレット',
        detail:
          'secrets.keys が設定されています。すべてのインスタンスで同じキーを使用していることを確認してください。',
      },
      missing: {
        title: 'シークレット',
        detail:
          'secrets.keys が設定されていません。他のインスタンスが暗号化したデータを読み取るには、すべてのインスタンスで同じキーが必要です。',
        fix: 'openssl rand -hex 32 でキーを生成し、すべてのインスタンスに設定してください。',
      },
    },
    publicOrigin: {
      invalid: {
        title: '公開アドレス',
        detail:
          'app.publicOrigin は設定されていますが、http または https のアドレスではありません。',
        fix: 'app.publicOrigin をユーザーが開くアドレス（例: https://apps.example.com）に設定してください。',
      },
      set: { title: '公開アドレス', detail: 'app.publicOrigin = {{origin}}' },
      missing: {
        title: '公開アドレス',
        detail:
          'app.publicOrigin が設定されていません。ロードバランサーの背後では、リンクやコールバックに公開アドレスが必要です。',
        fix: 'app.publicOrigin をユーザーがアクセスするアドレスに設定してください。',
      },
    },
    checkFailed: {
      title: '実行できなかったチェックがあります',
      detail: 'チェック「{{check}}」が失敗しました。ログを確認してください。',
    },
  },
};

export default jaJP;
