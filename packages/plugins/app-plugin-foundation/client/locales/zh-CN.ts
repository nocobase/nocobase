import type { FoundationResource } from './en-US.js';

const zhCN: FoundationResource = {
  nav: {
    plugins: '插件',
    pluginsDescription:
      '这个应用用了哪些插件、各是什么版本，以及怎样启用其他插件。',
  },
  access: {
    section: '系统',
    settings: { plugins: '插件' },
    actions: { read: '查看' },
  },
  page: {
    title: '插件',
    description:
      '这个应用用了哪些插件。启用和停用要改应用代码、重启后生效，所以这里不放开关，只给出要执行的命令。',
    deployed: '要启用插件，请在源项目中注册插件，然后重新部署应用。',
    attention_one: '{{count}} 个插件需要注意，已排在最前面。',
    attention_other: '{{count}} 个插件需要注意，已排在最前面。',
    search: '搜索名称或包名',
    loading: '正在读取插件…',
    loadFailed: '插件列表读取失败。',
    retry: '重试',
    empty: '没有符合条件的插件。',
  },
  filters: {
    label: '显示',
    all: '全部 {{count}}',
    enabled: '已启用 {{count}}',
    disabled: '未启用 {{count}}',
    attention: '需要注意 {{count}}',
  },
  columns: {
    plugin: '插件',
    version: '版本',
    status: '状态',
    actions: '操作',
  },
  groups: {
    enabled: '已启用 {{count}}',
    disabled: '未启用 {{count}}',
  },
  status: {
    enabled: '已启用',
    skillsOnly: '已启用 · 只含 Skill',
    enabledAttention: '已启用 · 需要注意',
    disabled: '未启用',
    disabledAttention: '未启用 · 需要注意',
    unknown: '无法确认 · 需重新构建',
  },
  reasons: {
    partial:
      '只启用了一部分：页面能打开，但数据加载不出来。再执行一次启用命令即可修复',
    devDependency:
      '启用了，但部署时不会带上，线上会缺这个插件。再执行一次启用命令即可修复',
    missingRequires: '「{{title}}」需要「{{names}}」，它还没启用',
    other: '在这个应用里没有装配完整。再执行一次启用命令即可修复',
    requiresFirst: '需要先启用：{{names}}（启用命令已带上）',
    unknown:
      '这个应用构建时还没有记录命令行注册了哪些插件，这里无法确认它是否已启用。重新执行 pnpm build 并部署后即可看到。',
  },
  actions: {
    commands: '命令',
    commandsFor: '{{title}} 的命令',
    enable: '启用方法',
    enableFor: '启用 {{title}} 的方法',
  },
  commands: {
    title: '{{title}} 的命令',
    description: '在应用的代码目录执行；改完重启，线上要重新构建部署。',
    fix: '修复需要注意的问题',
    update: '更新到新版本',
    unregister: '停用，数据保留',
    dependents: '依赖它的已启用插件：{{names}}。需要一起停用。',
    noDependents: '依赖它的已启用插件：无，可以直接停用。',
    optionalDependents:
      '可选地用到它的已启用插件：{{names}}。停用后它们仍能使用，只是少了依赖它的功能。',
  },
  enable: {
    title: '启用 {{title}}',
    description: '在应用的代码目录执行：',
    requires: '{{title}}依赖{{names}}，它也还没启用，命令里已经带上。',
    development:
      '本地开发：执行后重启 pnpm dev，刷新这个页面就能看到它已启用。',
    live: '线上：提交代码，pnpm build --tar 后用安装器升级。',
    data: '首次启动会创建它的数据表。之后用 plugin unregister 停用，数据保留。',
  },
  dialog: {
    copy: '复制命令',
    copied: '已复制',
    copyFailed: '复制失败，请选中命令后手动复制。',
    close: '知道了',
  },
};

export default zhCN;
