import type { SchedulerResource } from './en-US.js';

const zhCN: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: '定时任务', read: '查看', manage: '管理' },
  nav: { automation: '自动化', schedules: '定时任务' },
  page: {
    title: '定时任务',
    description:
      '由插件和应用代码定义、按时间自动运行的任务。这里查看它们什么时候运行、每次运行的结果，并可以暂停或恢复。任务的规则写在代码里，页面上不能新建或修改。',
    loadFailed: '定时任务加载失败。',
    retry: '重试',
    close: '关闭',
    copy: '复制',
    copied: '已复制',
    loadMore: '加载更多',
    none: '—',
    tabs: { tasks: '任务', runs: '运行记录', config: '运行配置' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} 项需要处理',
      title_other: '{{count}} 项需要处理',
      target:
        '「{{title}}」的执行目标 {{target}} 不可用（{{state}}），每次到点都会记为「跳过」。',
      waiting: '「{{title}}」{{time}} 的运行还在等待结果。',
      failed: '「{{title}}」最近一次运行的结果是「{{status}}」。',
    },
    stats: {
      total: '定时任务',
      running: '运行中',
      attention: '需要处理',
      next: '下一次运行',
      nextOf: '下一次运行 · {{title}}',
    },
    filters: {
      all: '全部',
      running: '运行中',
      attention: '需要处理',
      paused: '已暂停',
      removed: '已从代码移除',
      search: '搜索名称或 key',
    },
    columns: {
      task: '任务',
      rule: '运行规则',
      next: '下次运行',
      last: '上次运行',
      totals: '累计',
      state: '状态',
      enabled: '启用',
    },
    totals: '运行 {{runs}} 次 · 成功 {{succeeded}} 次',
    noMatch: '没有符合条件的任务。',
    enable: '恢复「{{title}}」',
    disable: '暂停「{{title}}」',
    toggleFailed: '无法修改这个任务。',
    readOnly: '你可以查看定时任务，但不能暂停或恢复。',
    notes: {
      running:
        '「运行中」只说明任务已启用、执行目标存在，不代表业务一定成功；以每次运行的结果为准。「累计运行」按次数统计，包括失败和跳过。',
      pause: '暂停只影响以后的运行。代码更新、重新部署不会改变这里的启用设置。',
      removed:
        '「已从代码移除」：部署时执行 `scheduler sync --finalize` 后，代码里已经删除的任务会标成这样，保留历史记录，不能再启用。',
      internal:
        '系统内部的后台作业（例如通知重发、邮件同步、知识库索引、Agent 运行清理）不在这里显示，它们由各自的插件管理。',
    },
  },
  state: {
    running: '运行中',
    paused: '已暂停',
    unavailable: '执行目标不可用',
    removed: '已从代码移除',
  },
  targetState: {
    ready: '可用',
    disabled: '已停用',
    missing: '不存在',
    invalid: '配置无效',
  },
  pause: {
    title: '暂停「{{title}}」？',
    description: '暂停后它不再按时运行，直到有人恢复。',
    running: '已经开始或正在等待结果的运行不会取消。',
    missed: '恢复后从下一个计划时间继续，暂停期间错过的运行不补跑。',
    redeploy: '重新部署不会自动恢复。',
    limit: '有次数上限的任务，已运行的次数继续累计。',
    cancel: '取消',
    confirm: '暂停',
  },
  empty: {
    title: '还没有定时任务',
    description:
      '定时任务由插件或应用在代码里用 `defineSchedule` 定义。装上带定时任务的插件，或在应用里定义一个并重启，它们就会自动出现在这里。',
    internal:
      '系统内部的后台作业（例如通知重发、邮件同步、知识库索引）不在这里显示，它们按各自的规则运行。',
  },
  detail: {
    back: '定时任务',
    notFound: '这个定时任务不存在。',
    key: 'Key',
    rule: '运行规则',
    upcoming: '接下来三次运行',
    noUpcoming: '没有计划中的运行',
    window: '有效期 · 次数上限',
    unlimited: '不限',
    windowFrom: '从 {{time}} 开始',
    windowTo: '到 {{time}} 为止',
    limit_one: '最多 {{count}} 次',
    limit_other: '最多 {{count}} 次',
    target: '执行目标',
    totals: '累计',
    source: '定义位置',
    sourceCode:
      '代码（`defineSchedule`）。要修改规则或执行目标，请修改代码并重新部署。',
    runs: '运行记录',
    noRuns: '还没有运行记录。',
    runsNote:
      '运行记录按时间倒序排列。运行的执行目标配置不会返回，也不会显示。执行次数大于 1 表示同一次运行被重复投递，仍算一次运行。',
  },
  runs: {
    allTasks: '全部任务',
    groups: {
      all: '全部',
      failed: '失败 · 超时',
      waiting: '等待结果',
      skipped: '跳过',
      succeeded: '成功',
    },
    ranges: {
      day: '最近 24 小时',
      week: '最近 7 天',
      month: '最近 30 天',
      quarter: '最近 90 天',
    },
    columns: {
      planned: '计划时间',
      task: '任务',
      result: '结果',
      reason: '原因 · 关联',
      executions: '执行次数',
      duration: '耗时',
      summary: '结果摘要',
    },
    noRuns: '没有符合条件的运行记录。',
    notes: {
      order:
        '所有任务的运行记录按计划时间倒序。失败、超时和长时间等待结果的运行也会在「任务」标签顶部提示。',
      removed: '已从代码移除的任务，历史记录仍然在这里。',
    },
  },
  status: {
    pending: '排队中',
    running: '执行中',
    waiting: '等待结果',
    succeeded: '成功',
    failed: '失败',
    skipped: '跳过',
    cancelled: '已取消',
    timed_out: '超时',
    triggered: '已触发（旧记录）',
  },
  reason: {
    'target-missing': '执行目标不存在',
    'target-disabled': '执行目标已停用',
    'target-invalid': '执行目标的配置无效',
    'target-not-found': '执行目标的类型没有注册',
    'invalid-config': '执行目标的配置无效',
    'dispatch-failed': '启动时失败，请查看服务端日志',
    'observer-failed': '查询执行目标的结果失败',
    'observer-unavailable': '执行目标无法报告结果',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: '时间线',
    started: '开始',
    accepted: '执行目标已接收',
    finished: '完成',
    notYet: '还没有结果',
    executions: '执行次数',
    target: '执行目标',
    related: '关联对象',
    receipt: '回执',
    summary: '结果摘要',
    reason: '原因',
    waitingNote:
      '「等待结果」时，定时任务会定期向执行目标查询状态，直到它报告成功、失败、取消或超时。定时任务本身不设超时，超时由执行目标决定。长时间等待时，请打开关联对象查看实际进度。',
  },
  config: {
    memory: '定时任务使用本机内存，只适合单实例运行。',
    memoryHint:
      '只运行一个实例时不用改；要多实例部署，按下方「改用 Redis」操作。',
    shared: '定时任务使用 {{adapter}}，可以多实例运行。',
    columns: {
      setting: '设置',
      value: '当前值',
      effect: '对定时任务的影响',
      source: '来源',
    },
    sources: {
      environment: '环境变量',
      config: 'config.yml',
      default: '默认值',
      backend: '由后端决定',
    },
    rows: {
      configuration: '使用的 jobs 配置',
      backend: '后端',
      multiInstance: '多实例',
      concurrency: '并发',
      attempts: '重试次数',
      connection: '连接',
    },
    builtIn: '内置 memory',
    selectedByScheduler:
      '由 `scheduler.jobs`（`SCHEDULER_JOBS`）单独为定时任务选择。',
    selectedByDefault: '没有设置 `scheduler.jobs`，跟随 `jobs.default`。',
    selectedByBuiltIn:
      '`scheduler.jobs` 和 `jobs.default` 都没有设置，用内置默认值。',
    memoryBackend: 'memory（本机内存）',
    memoryEffect: '任务规则在本进程内存里，正常停止时写到 {{path}}。',
    sharedEffect: '任务规则保存在 {{adapter}}，所有实例共用。',
    plugin: '{{plugin}} 已注册',
    supported: '支持',
    unsupported: '不支持',
    multiSupported:
      '每次到点只在一个实例上运行；实例崩溃时，偶尔会重复投递一次。',
    multiUnsupported: '每个实例会各自运行一次，同一个任务被执行多次。',
    concurrencyEffect_one:
      '同时只执行 1 次运行；一个任务很慢，其他到点的会排队。',
    concurrencyEffect_other: '同时最多执行 {{count}} 次运行；更多的会排队。',
    attemptsOk: '正确',
    attemptsWarn: '应为 1',
    attemptsEffect: '失败就记为「失败」，下次到点再运行；不要改大。',
    attemptsWarnEffect:
      '运行失败后已经记录，对同一次运行的重试不会再执行；请把重试次数设为 1。',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: '不显示密码。',
    redis: {
      title: '改用 Redis（多实例部署时）',
      step1:
        '安装商业插件 `@nocobase/app-plugin-jobs-redis`，并在每个实例上注册。',
      step2:
        '在 `config.yml` 里加一个 Redis 后端，并让定时任务使用它（见下方片段）。',
      step3: '重新部署所有实例，再回到这里确认「多实例」显示为「支持」。',
      warning:
        '配置名写错、插件没注册或 Redis 连不上时，应用不会启动，也不会退回 memory。',
    },
    removed: {
      title: '代码里删掉的任务',
      consistent: '一致，不需要处理。',
      consistentHint:
        '从代码里删除一个任务并部署后，它会出现在这里，并说明怎么清理。',
      warning_one: '{{count}} 个任务在当前代码里已经没有了，但还没清理。',
      warning_other: '{{count}} 个任务在当前代码里已经没有了，但还没清理。',
      warningHint:
        '它们到点不会运行（日志会出现 “A schedule fired that this instance has no definition for” 警告），列表里仍显示为正常。',
      columns: { task: '任务', last: '上次运行', after: '清理后' },
      after: '标为「已从代码移除」，不再触发，历史记录保留。',
      neverRan: '从未运行',
      how: '怎么清理',
      howHint:
        '确认所有实例都已更新到新版本后，在服务器上执行一次（任一实例即可）：',
      why: '为什么不自动清理：滚动部署时新旧版本同时在跑，自动清理可能误删旧版本还在用的任务。',
      full: '只在包含全部插件的完整版本上执行，否则未加载的插件的任务也会被标为移除。',
    },
    readOnly:
      '本页只读：设置写在应用配置里，重新部署生效。缓存、队列等其他服务见「集群与分布式」。',
  },
  cron: {
    everyMinute: '每分钟',
    everyMinutes: '每 {{count}} 分钟',
    everyHour: '每小时第 {{minute}} 分',
    everyHours: '每 {{count}} 小时',
    daily: '每天 {{time}}',
    weekdays: '工作日 {{time}}',
    weekly: '每{{day}} {{time}}',
    monthly: '每月 {{day}} 日 {{time}}',
  },
};

export default zhCN;
