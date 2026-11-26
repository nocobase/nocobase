import type { SchedulerResource } from './en-US.js';

const zhTW: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: '排程任務', read: '檢視', manage: '管理' },
  nav: { automation: '自動化', schedules: '排程任務' },
  page: {
    title: '排程任務',
    description:
      '由外掛和應用程式在程式碼中定義、依時間表自動執行的任務。在這裡查看它們何時執行、每次執行的結果，並可暫停或恢復。任務規則寫在程式碼中，此頁面無法新增或修改。',
    loadFailed: '無法載入排程任務。',
    retry: '重試',
    close: '關閉',
    copy: '複製',
    copied: '已複製',
    loadMore: '載入更多',
    none: '—',
    tabs: { tasks: '任務', runs: '執行紀錄', config: '執行設定' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} 項需要處理',
      title_other: '{{count}} 項需要處理',
      target:
        '「{{title}}」的執行目標 {{target}} 無法使用（{{state}}），每次到點都會記為「略過」。',
      waiting: '「{{title}}」於 {{time}} 開始的執行仍在等待結果。',
      failed: '「{{title}}」最近一次執行的結果為「{{status}}」。',
    },
    stats: {
      total: '排程任務',
      running: '執行中',
      attention: '需要處理',
      next: '下次執行',
      nextOf: '下次執行 · {{title}}',
    },
    filters: {
      all: '全部',
      running: '執行中',
      attention: '需要處理',
      paused: '已暫停',
      removed: '已從程式碼移除',
      search: '搜尋名稱或 key',
    },
    columns: {
      task: '任務',
      rule: '執行規則',
      next: '下次執行',
      last: '上次執行',
      totals: '累計',
      state: '狀態',
      enabled: '啟用',
    },
    totals: '執行 {{runs}} 次 · 成功 {{succeeded}} 次',
    noMatch: '沒有符合條件的任務。',
    enable: '恢復「{{title}}」',
    disable: '暫停「{{title}}」',
    toggleFailed: '無法變更此任務。',
    readOnly: '你可以檢視排程任務，但無法暫停或恢復。',
    notes: {
      running:
        '「執行中」只表示任務已啟用且執行目標存在，不代表業務一定成功；請以每次執行的結果為準。累計次數包含每次觸發，包括失敗和略過。',
      pause:
        '暫停只影響之後的執行。程式碼更新和重新部署不會改變這裡的啟用設定。',
      removed:
        '「已從程式碼移除」：執行 `scheduler sync --finalize` 後，程式碼中已刪除的任務會標記為此狀態，保留歷史紀錄，且無法再恢復。',
      internal:
        '系統內部的背景作業（例如通知重送、郵件同步、知識庫索引、Agent 執行清理）不在此顯示，由各自的外掛管理。',
    },
  },
  state: {
    running: '執行中',
    paused: '已暫停',
    unavailable: '執行目標無法使用',
    removed: '已從程式碼移除',
  },
  targetState: {
    ready: '可用',
    disabled: '已停用',
    missing: '不存在',
    invalid: '設定無效',
  },
  pause: {
    title: '暫停「{{title}}」？',
    description: '暫停後將不再按時執行，直到有人恢復。',
    running: '已開始或正在等待結果的執行不會被取消。',
    missed: '恢復後從下一個排定時間繼續，暫停期間錯過的執行不會補跑。',
    redeploy: '重新部署不會自動恢復。',
    limit: '有次數上限的任務，已執行的次數會繼續累計。',
    cancel: '取消',
    confirm: '暫停',
  },
  empty: {
    title: '尚無排程任務',
    description:
      '排程任務由外掛或應用程式在程式碼中以 `defineSchedule` 定義。安裝帶有排程任務的外掛，或在應用程式中定義一個並重新啟動，它們就會出現在這裡。',
    internal:
      '系統內部的背景作業（例如通知重送、郵件同步、知識庫索引）不在此顯示，它們依各自的規則持續執行。',
  },
  detail: {
    back: '排程任務',
    notFound: '此排程任務不存在。',
    key: 'Key',
    rule: '執行規則',
    upcoming: '接下來的執行',
    noUpcoming: '沒有排定的執行',
    window: '有效期間 · 次數上限',
    unlimited: '不限',
    windowFrom: '自 {{time}} 起',
    windowTo: '至 {{time}} 止',
    limit_one: '最多 {{count}} 次',
    limit_other: '最多 {{count}} 次',
    target: '執行目標',
    totals: '累計',
    source: '定義位置',
    sourceCode:
      '程式碼（`defineSchedule`）。若要修改規則或執行目標，請修改程式碼並重新部署。',
    runs: '執行紀錄',
    noRuns: '尚無執行紀錄。',
    runsNote:
      '執行紀錄依時間由新到舊排列。執行目標的設定不會回傳也不會顯示。執行次數大於 1 表示同一次執行被重複投遞，仍只算一次執行。',
  },
  runs: {
    allTasks: '全部任務',
    groups: {
      all: '全部',
      failed: '失敗 · 逾時',
      waiting: '等待結果',
      skipped: '略過',
      succeeded: '成功',
    },
    ranges: {
      day: '最近 24 小時',
      week: '最近 7 天',
      month: '最近 30 天',
      quarter: '最近 90 天',
    },
    columns: {
      planned: '排定時間',
      task: '任務',
      result: '結果',
      reason: '原因 · 關聯',
      executions: '執行次數',
      duration: '耗時',
      summary: '結果摘要',
    },
    noRuns: '沒有符合條件的執行紀錄。',
    notes: {
      order:
        '所有任務的執行紀錄，由新到舊排列。失敗、逾時和長時間等待結果的執行也會顯示在「任務」分頁頂端。',
      removed: '已從程式碼移除的任務，其歷史紀錄仍保留在這裡。',
    },
  },
  status: {
    pending: '排隊中',
    running: '執行中',
    waiting: '等待結果',
    succeeded: '成功',
    failed: '失敗',
    skipped: '略過',
    cancelled: '已取消',
    timed_out: '逾時',
    triggered: '已觸發（舊紀錄）',
  },
  reason: {
    'target-missing': '執行目標不存在',
    'target-disabled': '執行目標已停用',
    'target-invalid': '執行目標的設定無效',
    'target-not-found': '執行目標的類型未註冊',
    'invalid-config': '執行目標的設定無效',
    'dispatch-failed': '啟動時失敗，請查看伺服器日誌',
    'observer-failed': '查詢執行目標的結果失敗',
    'observer-unavailable': '執行目標無法回報結果',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: '時間軸',
    started: '開始',
    accepted: '執行目標已接收',
    finished: '完成',
    notYet: '尚無結果',
    executions: '執行次數',
    target: '執行目標',
    related: '關聯對象',
    receipt: '回執',
    summary: '結果摘要',
    reason: '原因',
    waitingNote:
      '執行等待結果時，排程器會定期向執行目標查詢狀態，直到它回報成功、失敗、取消或逾時。排程器本身不設逾時，由執行目標決定。若長時間等待，請開啟關聯對象查看實際進度。',
  },
  config: {
    memory: '排程任務在本實例的記憶體中執行，只適合單一實例。',
    memoryHint:
      '只執行一個實例時無需變更；若要執行多個實例，請依照下方「改用 Redis」操作。',
    shared: '排程任務在 {{adapter}} 上執行，可由多個實例執行。',
    columns: {
      setting: '設定',
      value: '目前值',
      effect: '對排程任務的影響',
      source: '來源',
    },
    sources: {
      environment: '環境變數',
      config: 'config.yml',
      default: '預設值',
      backend: '由後端決定',
    },
    rows: {
      configuration: 'jobs 設定',
      backend: '後端',
      multiInstance: '多實例',
      concurrency: '並行數',
      attempts: '嘗試次數',
      connection: '連線',
    },
    builtIn: '內建 memory',
    selectedByScheduler:
      '由 `scheduler.jobs`（`SCHEDULER_JOBS`）單獨為排程任務選擇。',
    selectedByDefault:
      '未設定 `scheduler.jobs`，因此排程任務沿用 `jobs.default`。',
    selectedByBuiltIn:
      '`scheduler.jobs` 與 `jobs.default` 都未設定，因此使用內建預設值。',
    memoryBackend: 'memory（本實例）',
    memoryEffect: '任務規則存放在本程序的記憶體中，正常停止時會寫入 {{path}}。',
    sharedEffect: '任務規則存放在 {{adapter}}，所有實例共用。',
    plugin: '{{plugin}} 已註冊',
    supported: '支援',
    unsupported: '不支援',
    multiSupported:
      '每次觸發只在一個實例上執行；實例當機時，偶爾可能重複投遞一次。',
    multiUnsupported: '每個實例都會各自執行每個排程，同一個任務會被執行多次。',
    concurrencyEffect_one:
      '同時只執行一次；某次執行較慢時，其他到點的執行會等待。',
    concurrencyEffect_other: '同時最多執行 {{count}} 次；超出的會排隊等待。',
    attemptsOk: '正確',
    attemptsWarn: '應為 1',
    attemptsEffect:
      '失敗的執行會記為「失敗」，排程會在下次排定時間再執行；請維持為 1。',
    attemptsWarnEffect:
      '失敗的執行已被記錄，對同一次執行的重試不會有任何作用；請將嘗試次數設為 1。',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: '密碼永遠不會顯示。',
    redis: {
      title: '改用 Redis（多實例部署）',
      step1:
        '安裝商業外掛 `@nocobase/app-plugin-jobs-redis`，並在每個實例上註冊。',
      step2:
        '在 `config.yml` 中新增一個 Redis 後端，並讓排程任務使用它（見下方片段）。',
      step3: '重新部署所有實例，然後回到這裡確認「多實例」顯示為「支援」。',
      warning:
        '若名稱錯誤、外掛未註冊或無法連線 Redis，應用程式將無法啟動，且不會退回使用 memory。',
    },
    removed: {
      title: '已從程式碼移除的任務',
      consistent: '一致，無需處理。',
      consistentHint:
        '從程式碼中刪除任務並部署後，它會列在這裡，並說明如何清理。',
      warning_one: '{{count}} 個任務已不在此版本的程式碼中，但尚未清理。',
      warning_other: '{{count}} 個任務已不在此版本的程式碼中，但尚未清理。',
      warningHint:
        '它們到點時不會執行（日誌會顯示 “A schedule fired that this instance has no definition for”），但任務清單仍照常顯示。',
      columns: { task: '任務', last: '上次執行', after: '清理後' },
      after: '標記為「已從程式碼移除」，不再觸發，保留歷史紀錄。',
      neverRan: '從未執行',
      how: '如何清理',
      howHint: '確認所有實例都已執行新版本後，在任一伺服器上執行一次：',
      why: '為何不自動清理：滾動部署期間新舊版本同時執行，自動清理可能誤刪舊版本仍在使用的任務。',
      full: '只在包含所有外掛的完整版本上執行，否則未載入外掛的任務也會被標記為已移除。',
    },
    readOnly: '此頁面為唯讀：這些設定寫在應用程式的設定中，重新部署後生效。',
  },
  cron: {
    everyMinute: '每分鐘',
    everyMinutes: '每 {{count}} 分鐘',
    everyHour: '每小時第 {{minute}} 分',
    everyHours: '每 {{count}} 小時',
    daily: '每天 {{time}}',
    weekdays: '每個工作日 {{time}}',
    weekly: '每{{day}} {{time}}',
    monthly: '每月 {{day}} 日 {{time}}',
  },
};

export default zhTW;
