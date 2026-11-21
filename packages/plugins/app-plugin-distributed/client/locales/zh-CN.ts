import type { DistributedResource } from './en-US.js';

const zhCN: DistributedResource = {
  nav: {
    title: '集群与分布式',
    description: '本实例使用了哪些后端，以及应用能否以多实例运行。',
  },
  page: {
    description:
      '要在多台服务器或多个进程上运行，缓存、锁、后台任务、队列、实时消息和 ID 生成都必须使用共享后端。本页显示本实例实际选用的后端及每项设置的来源，并检查应用能否安全地以多实例运行。这些设置位于应用配置中，修改后需重新部署。',
    loading: '加载中…',
    loadFailed: '无法加载状态。',
    retry: '重试',
  },
  summary: {
    single: '单实例',
    singleCaption: '当前配置适合单实例运行',
    shared: '{{shared}} / {{total}}',
    sharedCaption: '项服务已共享',
    requiredCaption: '必须处理',
    recommendedCaption: '建议处理',
  },
  sections: {
    scale: '能否多实例运行',
    services: '共享服务',
    idGeneration: 'ID 生成',
    checklist: '上线前核对',
    notes: '说明',
  },
  level: {
    required: '必须处理',
    recommended: '建议处理',
    ok: '正常',
  },
  singleHint:
    '单实例运行无需任何改动。如需扩展为多实例：准备 Redis 和共享的 PostgreSQL 或 MySQL 数据库 → 安装所需的 Redis 插件 → 修改配置 → 用两个实例验证。',
  fix: '处理方法',
  table: {
    service: '服务',
    backend: '选用的后端',
    sharing: '范围',
    plugin: 'Redis 插件',
    source: '来源',
    adapter: '适配器',
  },
  services: {
    caching: {
      name: '缓存',
      usage: '登录状态、权限、配置缓存',
    },
    concurrency: {
      name: '并发锁',
      usage: '迁移、编号、幂等',
    },
    jobs: {
      name: '后台任务',
      usage: '定时任务、知识库索引',
    },
    queue: { name: '队列', usage: '通知投递' },
    realtime: { name: '实时消息', usage: '站内信、在线状态' },
  },
  sharing: {
    shared: '实例间共享',
    local: '仅本实例',
    unknown: '未声明',
  },
  source: { configured: '已配置', default: '默认值' },
  notSet: '（未设置）',
  unavailable: '本应用未使用',
  unregistered: '适配器未注册',
  selections: '按名称选用',
  selection: '{{consumer}} → {{backend}}',
  howToChange: '如何修改',
  howToChangeIntro:
    '为每项服务安装对应的 Redis 插件，注册其服务端插件，然后在配置中选用：',
  idGeneration: {
    mode: '模式',
    modeHint: '多实例运行时，请自动分配 worker ID，让每个实例各自取得一个。',
    auto: '自动 · 每个实例一个 worker ID',
    manual: '手动 · workerId {{workerId}}',
  },
  checklist: {
    intro: '以下各项本页无法自行检查，请在两个实例上实际操作确认：',
    files: '在实例 A 上传的文件可以从实例 B 下载',
    realtime: '在 A 上产生的消息能实时送达连接在 B 上的用户，且重连后不丢失',
    queue: '在 A 上入队的任务可由 B 处理，且重试不会重复产生副作用',
    secrets: '所有实例使用相同的 secrets.keys，且登录状态在各实例间通用',
    websocket: '负载均衡器转发 WebSocket 连接，且与应用的路径和域名一致',
  },
  notes: {
    current:
      '本页只显示你当前连接的实例，无法判断其他实例的配置是否相同；请用同一份配置部署所有实例。',
    noTest:
      '这里没有“测试连接”：Redis 插件在应用启动时建立连接，连接失败时应用不会启动。运行期间的连接错误会记录在日志中。',
    instances:
      '只有自动分配 worker ID 时才会显示运行中的实例列表，该功能由商业插件提供。',
  },
  checks: {
    database: {
      sqlite: {
        title: '数据库',
        detail: 'SQLite 只能服务单个实例。多实例需要使用 PostgreSQL 或 MySQL。',
        fix: '将数据迁移到 PostgreSQL 或 MySQL，并将主数据库连接指向它。',
      },
      shared: {
        title: '数据库',
        detail: '{{dialect}}：所有实例连接同一个数据库。',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} 选用了适配器“{{adapter}}”，但没有已注册的插件提供它。该服务在首次使用时会失败。',
        fix: '安装并注册提供“{{adapter}}”的插件，或选用其他后端。',
      },
      local: {
        title: '{{service}} 仍仅限本实例',
        detail:
          '每个实例各自保存状态。请安装 {{plugin}}，并将 {{configPath}} 设置为 Redis 后端。',
        fix: '安装 {{plugin}}，注册其服务端插件，然后选用它：',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          '适配器“{{adapter}}”没有声明是否在实例间共享，请向提供它的插件确认。',
      },
      selectionLocal: {
        title: '{{service}}',
        detail: '{{consumer}} 明确使用了后端“{{backend}}”，它仅限本实例。',
      },
    },
    services: {
      local: {
        title: '缓存、锁、后台任务、队列、实时消息',
        detail: '全部仅限本实例：{{services}}。',
      },
    },
    files: {
      local: {
        title: '文件存储',
        detail: '{{collections}} 中的文件存放在本机磁盘上，其他实例无法读取。',
        fix: '为这些文件表使用 S3 等共享存储，并将其现有文件迁移过去。',
      },
      defaultLocal: {
        title: '文件存储',
        detail: '默认存储将文件存放在本机磁盘上，其他实例无法读取。',
        fix: '将默认存储设置为 S3 等共享存储。',
      },
      shared: {
        title: '文件存储',
        detail: '没有文件表将文件存放在本机磁盘上。',
      },
    },
    idGeneration: {
      auto: {
        title: 'ID 生成',
        detail: '自动分配：每个实例各自取得一个 worker ID。',
      },
      manual: {
        title: 'ID 生成',
        detail:
          '手动指定的 worker ID 为 {{workerId}}。两个实例使用相同的 worker ID 时可能生成重复的 ID。',
        fix: '为每个实例设置不同的 SNOWFLAKE_WORKER_ID，或安装可自动分配 worker ID 的插件。',
      },
    },
    secrets: {
      set: {
        title: '密钥',
        detail: '已设置 secrets.keys。请确保所有实例使用相同的密钥。',
      },
      missing: {
        title: '密钥',
        detail:
          '未设置 secrets.keys。所有实例需要相同的密钥，才能读取其他实例加密的内容。',
        fix: '使用 openssl rand -hex 32 生成密钥，并在所有实例上设置。',
      },
    },
    publicOrigin: {
      set: { title: '公开地址', detail: 'app.publicOrigin = {{origin}}' },
      missing: {
        title: '公开地址',
        detail:
          '未设置 app.publicOrigin。在负载均衡器之后，链接和回调需要使用公开地址。',
        fix: '将 app.publicOrigin 设置为用户访问的地址。',
      },
    },
    checkFailed: {
      title: '有一项检查无法运行',
      detail: '检查“{{check}}”失败，请查看日志。',
    },
  },
};

export default zhCN;
