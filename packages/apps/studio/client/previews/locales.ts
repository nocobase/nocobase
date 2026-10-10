/**
 * The wording of pull request previews, CI builds, a repository's linked Apps and deployment marks (`client/previews`,
 * `client/releases`, `client/deploys`), merged into the application's locales as `previews` and `deploys`
 * (`client/locales/*.ts`).
 */
export const previewsEnUS = {
  entry: 'Preview',
  entryOf: 'Preview of {{app}}',
  loadFailed: 'Could not load the previews.',
  statuses: {
    waiting: 'Waiting for the build',
    deploying: 'Deploying',
    ready: 'Ready',
    blocked: 'Needs variables',
    failed: 'Failed',
    destroyed: 'Destroyed',
  },
  variables: {
    blocked:
      'This build needs variables nothing sets. Once they are saved, the preview deploys.',
    missing: 'Missing: {{names}}',
    scope: 'Save to',
    scopePreview: 'This preview only',
    scopeEnvironment: 'Preview environment (every preview)',
    save: 'Save and deploy',
    saved: 'Saved; deploying the preview.',
    empty: 'Enter at least one value.',
    added: 'New variables: {{names}}',
    removed: 'Removed variables: {{names}}',
    setOnEnvironment: 'Set on environment',
    setOnApp: 'Set on this app',
  },
  runtime: {
    running: 'Running',
    starting: 'Starting',
    stopped: 'Stopped (starts on visit)',
    dormant: 'Hibernating (prepared on visit)',
    pending: 'Starting',
    failed: 'Failed to start',
    unknown: 'Status unknown',
  },
  runtimeHint: {
    stopped:
      'It stopped after a while without visits. Opening it starts it in a few seconds.',
    dormant:
      'It went to sleep after a long time without visits; its data is kept. Opening it prepares it again, which takes a little longer.',
    starting: 'Starting because someone opened it.',
  },
  build: {
    label: 'Build',
    states: {
      none: 'Not reported yet',
      queued: 'Queued',
      building: 'Building',
      failed: 'Failed',
      succeeded: 'Built',
    },
    uploaded: 'Uploaded',
    superseded: 'Superseded by a newer commit',
    logs: 'CI log',
  },
  lastVisit: 'Last visit',
  systemLabels: {
    kind: 'Added by Studio: this App is a pull request preview.',
    pullRequest: 'Added by the preview: the pull request it belongs to.',
    app: 'Added by the preview: the App it previews.',
    build: 'Added by Studio: the CI build this release came from.',
    ensured:
      'Added by Studio: CI made this App with `nb-studio app ensure` for this repository.',
    studio: 'Added by Studio: what Studio uses this App for.',
  },
  blockers: {
    noRepository:
      'The project has no repository on a git host, so there are no previews.',
    limitReached:
      'The preview environment holds as many Apps as it allows. Destroy a preview, or raise the environment’s limit.',
  },
  open: 'Open',
  url: 'Address',
  head: 'Head',
  deployed: 'Running',
  updating: 'Updating to {{sha}} once it is built.',
  admin: 'First administrator',
  adminHint:
    'Only people who may edit an issue the pull request is linked to see this.',
  username: 'Username',
  password: 'Password',
  copy: 'Copy',
  copied: 'Copied',
  retry: 'Deploy again',
  retried: 'Deploying the preview again.',
  destroy: 'Destroy',
  destroyTitle: 'Destroy the preview of {{app}}?',
  destroyDescription:
    'Its App and everything in it are removed, on every issue the pull request is linked to. The next push to the pull request brings it back.',
  destroyed: 'The preview was destroyed.',
  appLog: 'App and deployment logs',
  inbox: {
    readyTitle: 'The {{app}} preview of {{identifier}} is ready',
    failedTitle: 'The {{app}} preview of {{identifier}} failed',
    open: 'Open issue',
    types: {
      preview_ready: 'Preview ready',
      preview_failed: 'Preview failed',
    },
  },
  appOrigin: {
    builtBy: 'Built by {{repo}} ({{project}})',
    pullRequest: 'PR #{{number}}',
    pullRequestOf: '{{repo}} #{{number}}',
  },
  deploy: {
    title: 'Deploy & previews',
    description:
      'The Apps this repository builds. Every repository sets up its own previews, staging and production; Studio creates the Apps these need, named after the repository.',
    preview: 'Preview every pull request',
    previewHint:
      'Each pull request gets its own preview App in {{environment}}, removed once it is merged or closed.',
    previewOff: 'Pull requests are not previewed.',
    noPreviewEnvironment:
      'No environment can run previews: they need one that runs uploaded archives and is not protected.',
    staging: 'Staging',
    stagingHint: 'Built and deployed from the default branch.',
    production: 'Production',
    productionHint: 'Built and deployed from tags.',
    protectedHint:
      'The environment is protected: someone confirms every release.',
    environment: 'Environment',
    chooseEnvironment: 'Choose an environment',
    creates: 'Creates the App {{app}}.',
    linked: 'Deploys {{app}}.',
    configureCi: 'Set up CI automatically',
    configureCiHint:
      'Studio writes an API key limited to these Apps as the repository secret, and commits the workflow to a new repository or proposes it in a pull request. Should it fail, the repository’s settings say how to set it up by hand.',
    ciNeedsConnection: 'Needs a repository reached through a Git connection.',
    notAllowed:
      'Only someone who may create Apps, or deploy to every App, has Studio set Apps up. Ask an administrator, or link Apps that exist under Advanced.',
    notAllowedNew:
      'Only someone who may create Apps, or deploy to every App, has Studio set Apps up. Ask an administrator; Apps can be linked later in the repository’s settings.',
    unavailable: 'Release management is not available to you.',
    advancedSummary: '{{count}} Apps',
    save: 'Save',
    saved: 'The deploy settings are saved.',
  },
  deleteImpact: {
    sentence:
      'This App is built by {{repo}} ({{project}}); deleting it stops that repository’s {{parts}}.',
    sentenceWithPreviews_one:
      'This App is built by {{repo}} ({{project}}); deleting it stops that repository’s {{parts}} and {{count}} running preview.',
    sentenceWithPreviews_other:
      'This App is built by {{repo}} ({{project}}); deleting it stops that repository’s {{parts}} and {{count}} running previews.',
    recreate:
      'CI creates it again on its next deploy that names it, without its variables.',
    parts: {
      staging: 'staging',
      production: 'production',
      previews: 'previews',
      builds: 'builds of it',
    },
  },
};

export const previewsZhCN: typeof previewsEnUS = {
  entry: '预览',
  entryOf: '{{app}} 的预览',
  loadFailed: '无法加载预览',
  statuses: {
    waiting: '等待构建',
    deploying: '部署中',
    ready: '就绪',
    blocked: '缺少变量',
    failed: '失败',
    destroyed: '已销毁',
  },
  variables: {
    blocked: '这次构建需要的变量还没有设置。保存后预览会自动部署。',
    missing: '缺少：{{names}}',
    scope: '保存到',
    scopePreview: '仅此预览',
    scopeEnvironment: '预览环境（所有预览）',
    save: '保存并部署',
    saved: '已保存，正在部署预览。',
    empty: '至少填写一个值。',
    added: '新增变量：{{names}}',
    removed: '移除的变量：{{names}}',
    setOnEnvironment: '在环境中设置',
    setOnApp: '在此应用中设置',
  },
  runtime: {
    running: '运行中',
    starting: '启动中',
    stopped: '已停止（访问时启动）',
    dormant: '已休眠（访问时重新准备）',
    pending: '启动中',
    failed: '启动失败',
    unknown: '状态未知',
  },
  runtimeHint: {
    stopped: '一段时间无人访问后已停止。打开地址后几秒钟内自动启动。',
    dormant:
      '长时间无人访问后已休眠，数据仍保留。打开地址后会重新准备并启动，需要稍长一些时间。',
    starting: '有人打开了预览，正在启动。',
  },
  build: {
    label: '构建',
    states: {
      none: '尚未上报',
      queued: '排队中',
      building: '构建中',
      failed: '失败',
      succeeded: '已构建',
    },
    uploaded: '已上传',
    superseded: '已被更新的提交取代',
    logs: 'CI 日志',
  },
  lastVisit: '最近访问',
  systemLabels: {
    kind: '由 Studio 自动添加：这是 Pull request 的预览应用。',
    pullRequest: '由预览自动添加：它所属的 Pull request。',
    app: '由预览自动添加：它预览的应用。',
    build: '由 Studio 自动添加：这个版本来自的 CI 构建。',
    ensured:
      '由 Studio 自动添加：CI 用 `nb-studio app ensure` 为这个仓库创建了这个应用。',
    studio: '由 Studio 自动添加：Studio 用这个应用做什么。',
  },
  blockers: {
    noRepository: '项目没有托管在 git 平台上的仓库，没有预览。',
    limitReached:
      '预览环境的应用数已到上限。先销毁一个预览，或调高环境的上限。',
  },
  open: '打开',
  url: '地址',
  head: '最新提交',
  deployed: '运行中的提交',
  updating: '{{sha}} 构建完成后更新。',
  admin: '初始管理员',
  adminHint: '只有能编辑 Pull request 所关联任务的人看得到。',
  username: '用户名',
  password: '密码',
  copy: '复制',
  copied: '已复制',
  retry: '重新部署',
  retried: '正在重新部署预览。',
  destroy: '销毁',
  destroyTitle: '销毁 {{app}} 的预览？',
  destroyDescription:
    '预览应用和其中的数据都会删除，Pull request 关联的每个任务上都会消失。Pull request 有新的推送时会重新出现。',
  destroyed: '预览已销毁。',
  appLog: '应用和部署日志',
  inbox: {
    readyTitle: '{{identifier}} 的 {{app}} 预览已就绪',
    failedTitle: '{{identifier}} 的 {{app}} 预览失败',
    open: '打开任务',
    types: {
      preview_ready: '预览就绪',
      preview_failed: '预览失败',
    },
  },
  appOrigin: {
    builtBy: '由 {{repo}} 构建（{{project}}）',
    pullRequest: 'PR #{{number}}',
    pullRequestOf: '{{repo}} #{{number}}',
  },
  deploy: {
    title: '部署与预览',
    description:
      '这个仓库构建出的应用。每个仓库各自配置预览、预发布（staging）和生产（production）；Studio 会按仓库名创建所需的应用。',
    preview: '预览每个 Pull request',
    previewHint:
      '每个 Pull request 都会在 {{environment}} 中得到自己的预览应用，合并或关闭后删除。',
    previewOff: '不预览 Pull request。',
    noPreviewEnvironment:
      '没有可以运行预览的环境：预览需要一个能运行上传归档、且未受保护的环境。',
    staging: '预发布（staging）',
    stagingHint: '从默认分支构建并部署。',
    production: '生产（production）',
    productionHint: '从标签构建并部署。',
    protectedHint: '这个环境受保护：每次发布都需要有人确认。',
    environment: '环境',
    chooseEnvironment: '选择环境',
    creates: '将创建应用 {{app}}。',
    linked: '部署 {{app}}。',
    configureCi: '自动配置 CI',
    configureCiHint:
      'Studio 会把限定于这些应用的 API 密钥写为 Actions Secret，并把工作流提交到新仓库或通过 Pull request 提出。若失败，仓库设置中会说明如何手动配置。',
    ciNeedsConnection: '需要通过 Git 连接访问的仓库。',
    notAllowed:
      '只有可以创建应用、或可以部署到所有应用的人，才能让 Studio 创建应用。请联系管理员，或在“高级”中关联已有的应用。',
    notAllowedNew:
      '只有可以创建应用、或可以部署到所有应用的人，才能让 Studio 创建应用。请联系管理员；之后也可以在仓库设置中关联应用。',
    unavailable: '你无法使用发布管理。',
    advancedSummary: '{{count}} 个应用',
    save: '保存',
    saved: '部署设置已保存。',
  },
  deleteImpact: {
    sentence:
      '这个应用由 {{repo}}（{{project}}）构建；删除后，该仓库的{{parts}}将停止。',
    sentenceWithPreviews_one:
      '这个应用由 {{repo}}（{{project}}）构建；删除后，该仓库的{{parts}}将停止，{{count}} 个运行中的预览也会一并删除。',
    sentenceWithPreviews_other:
      '这个应用由 {{repo}}（{{project}}）构建；删除后，该仓库的{{parts}}将停止，{{count}} 个运行中的预览也会一并删除。',
    recreate: 'CI 下次部署到这个应用时会重新创建它，但原有变量不会恢复。',
    parts: {
      staging: '预发布',
      production: '生产',
      previews: '预览',
      builds: '构建',
    },
  },
};

export const deploysEnUS = {
  staging: 'Staging',
  production: 'Production',
  markDeployed: '{{role}} ✓ {{ref}}',
  markWithdrawn: 'Withdrawn with {{version}}',
  markTitle: '{{role}}: {{app}}, {{version}} ({{sha}}), {{at}}',
  withdrawnTitle:
    '{{role}}: now runs {{version}}, which does not contain this issue’s change',
  unreleased: {
    title: 'Merged, not released',
    description:
      'Finished issues whose change is not in production yet. They go out with the next release.',
    empty: 'Everything finished is in production.',
    noProduction: 'No repository of this project deploys to production.',
    loadFailed: 'Could not load the issues waiting for a release.',
    staging: 'On staging',
  },
  environments: {
    title: 'Environments',
    description:
      'What runs on the staging and production Apps of this project’s repositories.',
    loadFailed: 'Could not load what the environments run.',
    nothing: 'Nothing deployed yet',
    deployedBy: 'Deployed by {{name}}',
    approvedBy: 'approved by {{name}}',
    promoted: 'promoted from staging',
    pending: 'Waiting for approval: {{version}}',
  },
  inbox: {
    unreleasedTitle: '{{identifier}} is done and waits for a release',
    open: 'Open project',
    types: {
      unreleased: 'Waiting for a release',
    },
  },
  reopen: {
    type: 'Reopen suggested',
    title: 'Reopen what {{app}} rolled back?',
    withdrawTitle: 'Reopen what {{app}} no longer runs?',
    sentence_one:
      '{{app}} now runs {{version}}: {{count}} finished issue no longer runs there.',
    sentence_other:
      '{{app}} now runs {{version}}: {{count}} finished issues no longer run there.',
    hint: 'Reopening moves them back to In progress, so their change is shipped again. Keep them done if that is intended.',
    reopen_one: 'Reopen {{count}} issue',
    reopen_other: 'Reopen {{count}} issues',
    dismiss: 'Keep done',
    done: 'Reopened {{identifiers}}.',
    partly: 'Reopened {{identifiers}}; you may not move {{failed}}.',
    dismissed: 'The issues stay done.',
  },
};

export const deploysZhCN: typeof deploysEnUS = {
  staging: '预发布（staging）',
  production: '生产（production）',
  markDeployed: '{{role}} ✓ {{ref}}',
  markWithdrawn: '已随 {{version}} 撤下',
  markTitle: '{{role}}：{{app}}，{{version}}（{{sha}}），{{at}}',
  withdrawnTitle: '{{role}}：现在运行 {{version}}，其中不含这个任务的改动',
  unreleased: {
    title: '已合并未发布',
    description:
      '已完成但改动还没上生产（production）的任务，会随下一次发布上线。',
    empty: '已完成的任务都已上生产（production）。',
    noProduction: '这个项目的仓库没有关联生产（production）环境。',
    loadFailed: '无法加载等待发布的任务',
    staging: '已到预发布（staging）',
  },
  environments: {
    title: '环境',
    description:
      '这个项目的仓库关联的预发布（staging）和生产（production）应用正在运行什么。',
    loadFailed: '无法加载各环境运行的版本',
    nothing: '尚未部署',
    deployedBy: '由 {{name}} 部署',
    approvedBy: '{{name}} 批准',
    promoted: '由预发布（staging）版本晋升',
    pending: '等待审批：{{version}}',
  },
  inbox: {
    unreleasedTitle: '{{identifier}} 已完成，等待发布',
    open: '打开项目',
    types: {
      unreleased: '等待发布',
    },
  },
  reopen: {
    type: '建议重新打开',
    title: '重新打开 {{app}} 回滚撤下的任务？',
    withdrawTitle: '重新打开 {{app}} 撤下的任务？',
    sentence_one:
      '{{app}} 现在运行 {{version}}：{{count}} 个已完成任务的改动不再在其中。',
    sentence_other:
      '{{app}} 现在运行 {{version}}：{{count}} 个已完成任务的改动不再在其中。',
    hint: '重新打开会把它们移回进行中，改动需要重新发布。如果这是预期的，可以保持已完成。',
    reopen_one: '重新打开 {{count}} 个任务',
    reopen_other: '重新打开 {{count}} 个任务',
    dismiss: '保持已完成',
    done: '已重新打开 {{identifiers}}。',
    partly: '已重新打开 {{identifiers}}；你无权移动 {{failed}}。',
    dismissed: '这些任务保持已完成。',
  },
};
