import type { SchedulerResource } from './en-US.js';

const jaJP: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: 'スケジュール', read: '閲覧', manage: '管理' },
  nav: { automation: '自動化', schedules: 'スケジュール' },
  page: {
    title: 'スケジュール',
    description:
      'プラグインやアプリケーションがコードで定義し、決まった時刻に実行されるタスクです。いつ実行されるか、各実行がどう終わったかを確認し、一時停止や再開ができます。ルールはコードにあり、このページで作成や変更はできません。',
    loadFailed: 'スケジュールを読み込めませんでした。',
    retry: '再試行',
    close: '閉じる',
    copy: 'コピー',
    copied: 'コピーしました',
    loadMore: 'さらに読み込む',
    none: '—',
    tabs: { tasks: 'タスク', runs: '実行履歴', config: '設定' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} 件の対応が必要です',
      title_other: '{{count}} 件の対応が必要です',
      target:
        '「{{title}}」の実行対象 {{target}} が利用できない（{{state}}）ため、すべての起動がスキップとして記録されます。',
      waiting:
        '{{time}} に開始した「{{title}}」の実行は、まだ結果を待っています。',
      failed: '「{{title}}」の最新の実行は「{{status}}」で終了しました。',
    },
    stats: {
      total: 'スケジュール',
      running: '稼働中',
      attention: '要対応',
      next: '次回の実行',
      nextOf: '次回の実行 · {{title}}',
    },
    filters: {
      all: 'すべて',
      running: '稼働中',
      attention: '要対応',
      paused: '一時停止中',
      removed: 'コードから削除済み',
      search: '名前または key で検索',
    },
    columns: {
      task: 'タスク',
      rule: 'ルール',
      next: '次回の実行',
      last: '前回の実行',
      totals: '累計',
      state: 'ステータス',
      enabled: '有効',
    },
    totals: '実行 {{runs}} 回 · 成功 {{succeeded}} 回',
    noMatch: '条件に一致するスケジュールはありません。',
    enable: '「{{title}}」を再開',
    disable: '「{{title}}」を一時停止',
    toggleFailed: 'スケジュールを変更できませんでした。',
    readOnly: 'スケジュールの閲覧はできますが、一時停止や再開はできません。',
    notes: {
      running:
        '「稼働中」はスケジュールが有効で実行対象が存在することだけを意味します。処理が成功したかどうかは各実行の結果で確認してください。累計には失敗やスキップを含むすべての起動が数えられます。',
      pause:
        '一時停止は今後の実行にのみ影響します。コードの更新や再デプロイでもこの設定は変わりません。',
      removed:
        '「コードから削除済み」：`scheduler sync --finalize` の実行後、コードに存在しなくなったスケジュールにこの印が付きます。履歴は残り、再開はできません。',
      internal:
        '通知の再送、メール同期、ナレッジのインデックス作成、エージェント実行のクリーンアップなどの内部バックグラウンドジョブはここには表示されず、各プラグインが管理します。',
    },
  },
  state: {
    running: '稼働中',
    paused: '一時停止中',
    unavailable: '実行対象が利用不可',
    removed: 'コードから削除済み',
  },
  targetState: {
    ready: '利用可能',
    disabled: '無効',
    missing: '存在しない',
    invalid: '設定が無効',
  },
  pause: {
    title: '「{{title}}」を一時停止しますか？',
    description: '再開されるまで、決まった時刻に実行されなくなります。',
    running: 'すでに開始した実行や結果待ちの実行はキャンセルされません。',
    missed:
      '再開後は次の予定時刻から続行します。一時停止中に逃した実行は補われません。',
    redeploy: '再デプロイしても再開されません。',
    limit:
      '実行回数に上限があるスケジュールでは、これまでの実行回数がそのまま数えられます。',
    cancel: 'キャンセル',
    confirm: '一時停止',
  },
  empty: {
    title: 'スケジュールはまだありません',
    description:
      'スケジュールはプラグインやアプリケーションがコード内で `defineSchedule` を使って定義します。スケジュールを定義するプラグインをインストールするか、アプリケーションで定義して再起動すると、ここに表示されます。',
    internal:
      '通知の再送、メール同期、ナレッジのインデックス作成などの内部バックグラウンドジョブはここには表示されず、それぞれのルールで実行され続けます。',
  },
  detail: {
    back: 'スケジュール',
    notFound: 'このスケジュールは存在しません。',
    key: 'Key',
    rule: 'ルール',
    upcoming: '今後の実行',
    noUpcoming: '予定なし',
    window: '有効期間 · 実行回数の上限',
    unlimited: '無制限',
    windowFrom: '{{time}} から',
    windowTo: '{{time}} まで',
    limit_one: '{{count}} 回',
    limit_other: '{{count}} 回',
    target: '実行対象',
    totals: '累計',
    source: '定義場所',
    sourceCode:
      'コード（`defineSchedule`）。ルールや実行対象を変更するには、コードを変更して再デプロイしてください。',
    runs: '実行履歴',
    noRuns: '実行履歴はまだありません。',
    runsNote:
      '実行履歴は新しい順に表示されます。実行対象の設定は返されることも表示されることもありません。実行回数が 1 を超える場合は同じ実行が再配信されたことを意味し、1 回の実行として数えられます。',
  },
  runs: {
    allTasks: 'すべてのスケジュール',
    groups: {
      all: 'すべて',
      failed: '失敗 · タイムアウト',
      waiting: '結果待ち',
      skipped: 'スキップ',
      succeeded: '成功',
    },
    ranges: {
      day: '過去 24 時間',
      week: '過去 7 日間',
      month: '過去 30 日間',
      quarter: '過去 90 日間',
    },
    columns: {
      planned: '予定時刻',
      task: 'スケジュール',
      result: '結果',
      reason: '理由 · 関連',
      executions: '実行回数',
      duration: '所要時間',
      summary: '結果の概要',
    },
    noRuns: '条件に一致する実行はありません。',
    notes: {
      order:
        'すべてのスケジュールの実行を新しい順に表示します。失敗、タイムアウト、長時間の結果待ちは「タスク」タブの上部にも表示されます。',
      removed: 'コードから削除されたスケジュールの履歴もここに残ります。',
    },
  },
  status: {
    pending: '待機中',
    running: '実行中',
    waiting: '結果待ち',
    succeeded: '成功',
    failed: '失敗',
    skipped: 'スキップ',
    cancelled: 'キャンセル済み',
    timed_out: 'タイムアウト',
    triggered: 'トリガー済み（旧レコード）',
  },
  reason: {
    'target-missing': '実行対象が存在しません',
    'target-disabled': '実行対象が無効です',
    'target-invalid': '実行対象の設定が無効です',
    'target-not-found': '実行対象の種類が登録されていません',
    'invalid-config': '実行対象の設定が無効です',
    'dispatch-failed': '開始時に失敗しました。サーバーログを確認してください',
    'observer-failed': '実行対象の結果の確認に失敗しました',
    'observer-unavailable': '実行対象は結果を報告できません',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'タイムライン',
    started: '開始',
    accepted: '実行対象が受理',
    finished: '完了',
    notYet: 'まだ結果がありません',
    executions: '実行回数',
    target: '実行対象',
    related: '関連',
    receipt: '受領情報',
    summary: '結果の概要',
    reason: '理由',
    waitingNote:
      '実行が結果を待っている間、スケジューラーは実行対象が成功、失敗、キャンセル、タイムアウトを報告するまで状態を問い合わせます。スケジューラー自体はタイムアウトを設けず、実行対象が決めます。長く待っている場合は、関連項目を開いて進捗を確認してください。',
  },
  config: {
    memory:
      'スケジュールはこのインスタンスのメモリで実行されます。単一インスタンスにのみ適しています。',
    memoryHint:
      'インスタンスが 1 つなら変更は不要です。複数で実行するには、下の「Redis に切り替える」に従ってください。',
    shared:
      'スケジュールは {{adapter}} で実行されます。複数のインスタンスで実行できます。',
    columns: {
      setting: '設定',
      value: '現在の値',
      effect: 'スケジュールへの影響',
      source: '設定元',
    },
    sources: {
      environment: '環境変数',
      config: 'config.yml',
      default: 'デフォルト',
      backend: 'バックエンドが決定',
    },
    rows: {
      configuration: 'jobs 設定',
      backend: 'バックエンド',
      multiInstance: '複数インスタンス',
      concurrency: '同時実行数',
      attempts: '試行回数',
      connection: '接続',
    },
    builtIn: '組み込みの memory',
    selectedByScheduler:
      '`scheduler.jobs`（`SCHEDULER_JOBS`）によってスケジュール専用に選択されています。',
    selectedByDefault:
      '`scheduler.jobs` が設定されていないため、スケジュールは `jobs.default` に従います。',
    selectedByBuiltIn:
      '`scheduler.jobs` も `jobs.default` も設定されていないため、組み込みのデフォルトが適用されます。',
    memoryBackend: 'memory（このインスタンス）',
    memoryEffect:
      'ルールはこのプロセスのメモリにあり、正常に停止したときに {{path}} へ書き込まれます。',
    sharedEffect:
      'ルールは {{adapter}} にあり、すべてのインスタンスで共有されます。',
    plugin: '{{plugin}} は登録済み',
    supported: '対応',
    unsupported: '非対応',
    multiSupported:
      '各起動は 1 つのインスタンスで実行されます。インスタンスがクラッシュすると、まれに実行が再配信されることがあります。',
    multiUnsupported:
      'すべてのインスタンスがそれぞれ各スケジュールを実行するため、同じタスクが複数回実行されます。',
    concurrencyEffect_one:
      '一度に 1 つの実行のみ。遅い実行があると、予定時刻になった他の実行は待機します。',
    concurrencyEffect_other:
      '一度に最大 {{count}} 件の実行。それ以上は順番を待ちます。',
    attemptsOk: '正しい',
    attemptsWarn: '1 にしてください',
    attemptsEffect:
      '失敗した実行は失敗として記録され、スケジュールは次の予定時刻に再び実行されます。1 のままにしてください。',
    attemptsWarnEffect:
      '失敗した実行はすでに記録されているため、同じ実行を再試行しても何も起こりません。試行回数を 1 に設定してください。',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'パスワードは表示されません。',
    redis: {
      title: 'Redis に切り替える（複数インスタンス向け）',
      step1:
        '商用プラグイン `@nocobase/app-plugin-jobs-redis` をインストールし、すべてのインスタンスで登録します。',
      step2:
        '`config.yml` に Redis バックエンドを追加し、スケジュールがそれを使うよう設定します（下のスニペット参照）。',
      step3:
        'すべてのインスタンスを再デプロイしてからここに戻り、「複数インスタンス」が「対応」になっていることを確認します。',
      warning:
        '名前が間違っている、プラグインが登録されていない、または Redis に接続できない場合、アプリケーションは起動しません。memory に切り替わることはありません。',
    },
    removed: {
      title: 'コードから削除されたスケジュール',
      consistent: '整合しています。対応は不要です。',
      consistentHint:
        'スケジュールをコードから削除してデプロイすると、クリーンアップ方法とともにここに表示されます。',
      warning_one:
        '{{count}} 件のスケジュールがこのバージョンのコードにありませんが、まだクリーンアップされていません。',
      warning_other:
        '{{count}} 件のスケジュールがこのバージョンのコードにありませんが、まだクリーンアップされていません。',
      warningHint:
        '予定時刻になっても実行されません（ログに “A schedule fired that this instance has no definition for” と表示されます）が、タスク一覧では通常どおり表示されます。',
      columns: {
        task: 'スケジュール',
        last: '前回の実行',
        after: 'クリーンアップ後',
      },
      after: '「コードから削除済み」となり、二度と起動されず、履歴は残ります。',
      neverRan: '未実行',
      how: 'クリーンアップ方法',
      howHint:
        'すべてのインスタンスが新しいバージョンで動作したら、任意のサーバーで一度だけ実行します：',
      why: '自動で行わない理由：ローリングデプロイ中は新旧のバージョンが並行して動作するため、自動クリーンアップでは旧バージョンがまだ使っているスケジュールを削除してしまう可能性があります。',
      full: 'すべてのプラグインを含む完全なビルドでのみ実行してください。そうしないと、読み込まれなかったプラグインのスケジュールも削除済みとしてマークされます。',
    },
    readOnly:
      'このページは読み取り専用です。これらの設定はアプリケーションの構成にあり、再デプロイ時に反映されます。キャッシュ、キューなどのサービスは「クラスタと分散」設定で扱います。',
  },
  cron: {
    everyMinute: '毎分',
    everyMinutes: '{{count}} 分ごと',
    everyHour: '毎時 {{minute}} 分',
    everyHours: '{{count}} 時間ごと',
    daily: '毎日 {{time}}',
    weekdays: '平日の {{time}}',
    weekly: '毎週{{day}} {{time}}',
    monthly: '毎月 {{day}} 日 {{time}}',
  },
};

export default jaJP;
