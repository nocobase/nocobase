export default {
  agent: {
    tab: '通过 Agent',
    manualTab: '手动配置',
    hint: '填写连接需求，将提示词交给可以操作此应用的 Agent。账号密码在执行时通过安全方式提供，不填写在这里。',
    type: '数据库类型',
    name: '连接名称',
    purpose: '用途',
    purposeHint: '例如：接入已有报表数据库，查询销售数据',
    typePlaceholder: '【数据库类型】',
    namePlaceholder: '【新的连接名称】',
    purposePlaceholder: '【连接用途】',
    generate: '更新提示词',
    generateHint: '修改需求后可更新提示词；更新会替换下方手动编辑的内容。',
    promptLabel: '可编辑的提示词',
    copy: '复制提示词',
    copied: '已复制',
    copyFailed: '复制失败，请选中上方提示词手动复制。',
    prompt:
      '请在当前 NocoBase 应用中新增一个数据库连接。\n\n数据库类型：{{databaseType}}\n连接名称：{{connectionName}}\n用途：{{purpose}}\n\n先检查应用当前的连接配置及驱动依赖，保留所有已有连接和默认连接；如果名称冲突，先与我确认新名称。确认目标数据库已准备好，并向我收集缺少的地址、端口、数据库名称和账号信息，密码通过安全渠道提供，不写入提示词或日志。\n\n确认由本应用还是外部系统维护结构，再选择 managed 或 external；不要将 external 当作只读权限。检查并按需安装兼容的数据库驱动，在应用实际读取的配置文件中添加命名连接。如使用环境变量，为该连接保留独立映射。\n\n运行 pnpm nocobase config check，并处理检查发现的问题。根据当前运行和部署方式，使配置生效；涉及正在使用的服务重启时，先说明影响并确认时机。最后在数据库概览中确认新增连接，并通过数据库浏览器验证数据表和字段可见。不要迁移现有数据或修改已有数据库结构。',
  },
  addConnection: {
    title: '如何新增数据库连接',
    prepare:
      '准备数据库地址、端口、数据库名称和账号凭据，确认应用服务器能够访问它。新增连接不会创建数据库，请先准备好目标数据库。',
    driver:
      '以 PostgreSQL 为例：确认应用的 dependencies 中已安装与当前应用版本兼容的 @nocobase/db-postgres 驱动；缺少时先在应用源码项目中安装，再重新构建和部署。官方驱动安装后会按数据库类型自动加载。',
    configure:
      '在应用当前使用的配置文件中（通常是 config.yml），向 database.connections 添加一个不重复的连接名称，例如 analytics。保留已有连接及 database.default，不要用示例替换整个配置文件。',
    exampleHint:
      '示例：接入一个已有的 PostgreSQL 数据库。将 analytics 合并到现有 database.connections 下，并替换尖括号中的占位值；TLS 等参数按数据库要求补充。',
    management:
      '已有外部数据库通常使用 schemaManagement: external，由原系统维护结构；如果需要由本应用通过迁移管理结构，使用 managed。external 不等于只读，数据读写权限仍由数据库账号和应用授权控制。',
    environment:
      "新连接不会自动读取 main 连接的 DB_* 环境变量。如需使用独立环境变量，应在 server/config/database.ts 的 env 配置中保留原有映射，再加入 connectionEnvironment('analytics', 'DB_ANALYTICS') 的映射，并重新构建部署。不要在 YAML 中直接写 ${DB_ANALYTICS_PASSWORD}，它不会自动替换。",
    validate:
      '在应用根目录运行配置检查。默认会尝试连接 PostgreSQL 等非 SQLite 数据库；检查不会执行迁移。',
    restart:
      '检查通过后，重启应用并刷新本页。确认出现 analytics，点击「查看数据表和字段」，验证能否浏览目标数据库。新增连接本身不会迁移原连接的数据。',
  },
  connections: '已配置的连接',
  connectionCount: '共配置了 {{count}} 个连接',
  runtimeNote:
    '列表反映当前应用运行时的配置，不代表连接健康检查结果。账号、密钥、服务器地址和文件路径不在这里展示。',
  effectiveConfiguration: '查看生效配置',
  sourceNote:
    '这里展示运行中的应用返回的非敏感配置。当前接口无法区分各项来自 config.yml、环境变量还是默认值；未展示的项目不代表尚未配置。',
  browse: '查看数据表和字段',
  managed: '由应用管理',
  external: '由外部管理',
  fields: {
    type: '数据库类型',
    management: '结构管理方式',
    databaseName: '数据库 / 服务名',
    schemas: 'Schema',
    driver: '驱动',
    tablePrefix: '表名前缀',
    underscored: '下划线命名',
  },
  optionsTitle: '还可以配置什么',
  optionsHint:
    '以下是常用配置项，不是待补齐的配置清单。具体可用项取决于数据库驱动。',
  options: {
    connections: {
      title: '数据库连接',
      description:
        '新增命名连接，选择数据库类型。每个连接包含数据表，每张表定义字段及其关系。使用前需要安装相应的数据库驱动。',
    },
    default: {
      title: '默认连接',
      description: '指定未明确选择连接时，应用默认使用哪个连接。',
    },
    management: {
      title: '结构管理方式',
      description:
        '由应用管理的连接会执行数据库迁移；外部连接的结构由其他系统维护。',
    },
    transport: {
      title: '连接参数',
      description:
        '根据数据库类型配置文件位置、服务器地址、数据库名称、账号凭据和 TLS。',
    },
    naming: {
      title: '命名规则',
      description:
        '配置表名前缀和下划线命名。修改规则不会自动重命名已有数据表。',
    },
  },
  configurationGuide: '配置位置与 YAML 示例',
  configurationHint:
    '在应用的 config.yml 中，通过 database.default 指定默认连接，通过 database.connections 定义各个命名连接。',
  exampleLabel: '以下仅为 SQLite 配置格式示例，不是当前应用配置的导出。',
  environmentHint:
    '模板将 DB_DIALECT、DB_FILENAME、DB_HOST、DB_PORT、DB_DATABASE、DB_USERNAME、DB_PASSWORD 和 DB_SSL 映射到 main 连接。环境变量可以覆盖文件中的值；其他连接若需通过环境变量配置，应单独声明映射。',
  restartHint:
    '此页面只读。修改连接配置后，请先校验配置，再重启应用。数据结构变更需要数据库迁移，仅修改配置不会迁移数据。',
};
