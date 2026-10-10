/**
 * The wording of a repository's "Deployment" (`client/releases/ci-setup`), merged into the application's locales as
 * `ciSetup` (`client/locales/*.ts`).
 */
export const ciSetupEnUS = {
  title: 'Deployment',
  description: 'How this repository’s CI builds and deploys to Studio.',
  loading: 'Loading',
  loadFailed: 'Could not load the repository’s CI.',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Could not copy',
  cancel: 'Cancel',
  lastError: 'The last configuration failed',
  states: {
    none: 'Not connected',
    pending: 'Waiting for initialization',
    'pr-open': 'Pull request to merge',
    task: 'Task in progress',
    connected: 'Connected',
  },
  configure: {
    action: 'Configure CI',
    title: 'Configure CI',
    description:
      'Each run connects one application to one trigger and environment. Run it again for the next one.',
    submit: {
      direct: 'Write workflow',
      template: 'Write workflow',
      agent: 'Create task',
      manual: 'Done',
      ownAgent: 'Done',
    },
    done: {
      prOpen: 'Proposed in pull request #{{number}}',
      pending: 'Written once the repository is initialized',
      task: 'Created task {{identifier}}',
      configured: 'The default branch already has this workflow',
    },
  },
  trigger: {
    label: 'Trigger',
    pullRequest: {
      title: 'Pull request',
      description:
        'Each pull request that changes the application gets its own App, deleted when it is merged or closed.',
    },
    branch: {
      title: 'Push to a branch',
      description: 'Every push to the branch builds and deploys the App.',
      ref: 'Branch',
      invalid: 'Enter a branch name, such as main.',
    },
    tag: {
      title: 'Tag',
      description: 'Every tag matching the pattern builds and deploys the App.',
      ref: 'Tag pattern',
      invalid: 'Enter a tag pattern, such as v* or release-*.',
    },
  },
  environment: {
    label: 'Environment',
    choose: 'Choose an environment',
    none: 'There is no environment yet. Add one in Releases › Environments.',
    protectedItem: '{{name}} (protected)',
    protectedHint:
      'Protected: every CI deployment becomes an approval request.',
    hint: {
      pullRequest: 'Pull request Apps run here.',
      branch: 'The App runs here.',
      tag: 'The App runs here.',
    },
    required: 'Choose the environment to deploy to.',
  },
  app: {
    title: 'Application',
    directory: 'Directory',
    directoryHint: 'Relative to the repository, . for its root.',
    appId: 'App ID',
    appIdHint: {
      pullRequest: 'Each pull request deploys to {{appId}}-pr-<number>.',
      deploy:
        'Deploys to this App, created in {{environment}} when missing. Enter an existing App’s ID to deploy to it.',
    },
    errors: {
      directory:
        'Enter a path relative to the repository, such as . or apps/shop.',
      appId: 'Use lowercase letters, digits, - and _.',
    },
  },
  method: {
    label: 'Method',
    studio: 'Studio writes it',
    self: 'Handle it yourself',
    autoUnavailable: 'No code host connected.',
    connect: 'Connect',
  },
  methods: {
    direct: {
      title: 'Write the standard workflow',
      description:
        'For NocoBase applications. Committed to a new repository, proposed in a pull request to an existing one.',
    },
    template: {
      title: 'Start from the template and edit',
      description:
        'Edit the standard workflow first; Studio writes your edited file.',
    },
    agent: {
      title: 'Hand it to an agent',
      description:
        'An issue in the project asks an agent to adapt the repository’s CI and open a pull request.',
    },
    manual: {
      title: 'Copy the workflow and commands',
      description:
        'Add them to the repository yourself, with the repository’s CI key shown once for you to store.',
    },
    ownAgent: {
      title: 'Copy a prompt for your own agent',
      description: 'For the coding agent on your machine.',
    },
  },
  agent: {
    label: 'Executor',
    choose: 'Choose an agent',
    hint: 'Studio creates the key and the repository secret itself; the issue never contains the key.',
    required: 'Choose the agent that sets the CI up.',
  },
  status: {
    title: 'CI status',
    description:
      'The Apps this repository’s CI reported, by the environment they run in.',
    app: 'App',
    lastBuild: 'Last build',
    lastDeploy: 'Last deploy',
    actions: 'Actions',
    actionsOf: 'Actions for {{appId}}',
    notReported: 'Not reported yet',
    builds: 'Builds',
    variables: 'Variables',
    protected: 'Protected',
    protectedHint:
      'Protected: every CI deployment becomes an approval request.',
    pullRequestApps: 'One App per pull request',
    emptyTitle: 'Waiting for the first report',
    empty: 'Configure CI; the Apps it deploys show here once CI reports them.',
    emptyReadOnly:
      'The Apps CI deploys show here once it reports them. Ask the project’s lead to configure CI.',
    prOpen: 'Waiting for pull request #{{number}} to be merged',
    pending:
      'Waiting for the repository’s initialization to write the workflow',
    task: 'Task in progress',
  },
  remove: {
    action: 'Remove',
    title: 'Remove “{{appId}}”?',
    description:
      'It disappears from this list and is no longer linked to the repository; it comes back when CI reports it again. To delete the App itself, go to',
    appsPage: 'Apps.',
    pullRequests:
      'Each pull request’s App deploys on its own and has no link to the repository to remove: this only hides their builds here. They show again when CI reports another pull request.',
    done: 'Removed “{{appId}}”',
  },
  failures: {
    rotationTitle: 'The key could not be rotated',
    unknown:
      'The configuration could not be completed. Try again, or handle it yourself.',
    details: 'Details',
    demoConnection:
      'A demo connection never writes to the repository. Choose a way to handle it yourself.',
    noConnection:
      'The repository is not reached through a Git connection. Connect one, or handle it yourself.',
    connectionMissing:
      'The repository’s Git connection is missing or incomplete. Check it in Settings › Git.',
    connectionPermission:
      'The Git connection may not write repository secrets yet. Accept the app’s new permissions on the code host, then try again.',
    secretsUnsupported:
      'This code host does not take CI secrets from Studio. Handle it yourself.',
    hostForbidden:
      'The code host refused the change. Check that the connection may write to this repository.',
    hostRateLimited:
      'The code host’s rate limit was reached. Try again after {{retryAt}}.',
    repositoryNotFound:
      'The code host could not find the repository. Check that it still exists and the connection can reach it.',
    defaultBranchMissing:
      'The default branch {{branch}} does not exist yet. Push it, then configure CI again.',
    unknownEnvironment:
      'The environment {{environmentId}} no longer exists. Choose another.',
    appInOtherEnvironment:
      '{{appId}} runs in {{actualEnvironmentId}}, not {{environmentId}}. Choose that environment, or another App ID.',
    appsNotCreatable:
      'The App does not exist yet, and you may not set Apps up. Ask someone who may, or name an existing App.',
    appNotConfigurable:
      'You may not configure {{appId}}, so its CI cannot deploy to it.',
    forbidden: 'You are not allowed to do this.',
    keyScope:
      'The key would hold permissions you do not hold yourself. Ask someone who holds them to configure CI.',
    keyMissing:
      'The repository’s API key was disabled or deleted. Configure CI again to make a new one.',
    keyRevoked:
      'The repository’s API key was {{how}} in Settings › API keys. Configure CI again to make a new one.',
    keyRevokedHow: {
      disabled: 'disabled',
      deleted: 'deleted',
    },
    rotationFailed:
      'The CI key could not be given a new secret. Rotate it from the key’s menu, or configure CI again.',
    noPublicOrigin:
      'Studio does not know its public address (app.publicOrigin), which CI signs in to. Ask an administrator to set it.',
    apiKeysUnavailable: 'API keys are not available in this workspace.',
    issuesUnavailable: 'Issues cannot be created in this workspace.',
    workingDirectoryMissing: 'The working directory no longer exists.',
    noSetUpUser: 'Nobody is recorded to set the CI up as. Configure CI again.',
  },
  preview: {
    workflow: 'Workflow file',
    toggle: 'Show or hide',
  },
  workflow: {
    editHint:
      'Studio writes the file as edited here; keep reading {{secret}} and running the nb-studio commands.',
    changed: 'Edited',
    unchanged: 'Standard, unedited',
    warningsTitle: 'The workflow may not work',
    problems: {
      secret:
        '{{path}} does not read the secret {{secret}}: CI cannot sign in to Studio.',
      studio: '{{path}} runs no nb-studio command: no build reaches Studio.',
    },
  },
  manual: {
    steps: {
      workflow:
        'Add the workflow file to the repository, or add the nb-studio commands to your existing CI.',
      key: 'Generate the repository’s CI key: it reaches only this repository’s Apps and can create them, such as each pull request’s preview App.',
      keyLater:
        'Once the project is created, generate the repository’s CI key in its settings › Deployment › Configure CI, or with nb-studio build ci setup <owner/repo> --reveal.',
      secret:
        'Store it in the repository’s CI as the secret {{secret}} (on GitHub, an Actions secret).',
    },
    generate: 'Generate the repository’s CI key',
    manageOnly: 'Only someone who manages the project can generate it.',
    revealed: {
      title: 'The repository’s CI key',
      label: 'CI key',
      store:
        'Store it now as the repository secret {{secret}}. It cannot be shown again: generate or rotate for a new one.',
    },
    presetHint:
      'A “CI deploy” key from Settings › API keys also deploys to Apps that already exist, but cannot create Apps, so pull request previews do not work with it.',
    openKeys: 'Open API keys',
    commands: 'nb-studio commands',
  },
  ownAgent: {
    title: 'Prompt for your agent',
    hint: 'Paste it into a coding agent such as Claude Code or Codex. It asks you to create the key and add the secret, never to paste the key to it.',
  },
  key: {
    title: 'Managed key',
    actions: 'Key actions',
    rotate: 'Rotate key',
    rotateReveal: 'Rotate and show the new key',
    confirmReplacement: {
      title: 'Replace the repository’s CI key?',
      description:
        'The current key will stop working immediately. CI using NB_STUDIO_API_KEY will fail to authenticate until you update it.',
      lastUsed: 'Last used: {{date}}',
      cancel: 'Cancel',
      confirm: 'Replace and show new key',
    },
    rotated: 'Key rotated',
    expires: 'Expires {{date}}',
    never: 'Never expires',
    missing: 'The key was deleted',
    secret: 'kept as {{secret}}',
    status: {
      active: 'Active',
      disabled: 'Disabled',
      expired: 'Expired',
    },
  },
  recent: {
    title: 'Recent builds and deployments',
    description: 'What this repository’s CI reported to Studio.',
    allApps: 'All Apps',
    empty: 'CI has not reported a build yet.',
    noMatch: 'No build matches the filters.',
    loadFailed: 'Could not load the builds.',
    time: 'Time',
    app: 'App',
    kind: 'Trigger',
    commit: 'Commit',
    state: 'State',
    run: 'CI run',
    open: 'Open',
    kinds: {
      pullRequest: 'Pull request',
      ref: 'Branch or tag',
    },
  },
  wizard: {
    fixRun:
      'Fill in the trigger, environment and application above to see the workflow.',
    later:
      'Connect more applications, branches or tags later in the project settings’ “Deployment”.',
  },
  prompt: {
    intro: {
      pullRequest:
        'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for pull requests: every pull request that changes the application below is built, uploaded to Studio and deployed to its own App in the environment `{{environment}}`.',
      branch:
        'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for the branch `{{branch}}`: every push to it builds the application below, uploads it to Studio and deploys it in the environment `{{environment}}`.',
      tag: 'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for tags matching `{{pattern}}`: every such tag builds the application below, uploads it to Studio and deploys it in the environment `{{environment}}`.',
    },
    appTitle: 'The application',
    directory: '- Directory: `{{directory}}`',
    appId: {
      pullRequest:
        '- Apps: `{{appId}}-pr-<number>`, one per pull request, deleted once it is merged or closed',
      branch:
        '- App: `{{appId}}`, made in `{{environment}}` when it is missing',
      tag: '- App: `{{appId}}`, made in `{{environment}}` when it is missing',
    },
    fileTitle: 'Standard workflow file',
    commandsTitle: 'nb-studio commands',
    commandsHint:
      'Use these if the repository already has CI: add them around its own build instead of a second workflow.',
    secretTask:
      'The repository secret `{{secret}}` already holds an organization API key that Studio created and rotates. Never print it, copy it or ask for it.',
    secretOwn:
      'Ask me to generate the repository’s CI key in Studio ({{studioUrl}}: the project’s settings › Deployment › Configure CI › Copy the workflow and commands, or `nb-studio build ci setup <owner/repo> --reveal`) and to store it as the repository secret `{{secret}}`. Never ask me to paste the key to you.',
    stepsTitle: 'What to do',
    steps: {
      read: 'Read the repository’s CI (`.github/workflows/`) and how the application builds (`pnpm build --tar` leaves `storage/exports/dist.tar.gz`).',
      add: 'Add the workflow file above, or add the nb-studio steps to the existing CI, adjusted to how this repository builds.',
      pullRequest:
        'Open a pull request with the change against `{{defaultBranch}}` and explain what it does.',
    },
  },
};

export const ciSetupZhCN: typeof ciSetupEnUS = {
  title: '部署',
  description: '这个仓库的 CI 如何构建并部署到 Studio。',
  loading: '加载中',
  loadFailed: '无法加载仓库的 CI。',
  copy: '复制',
  copied: '已复制',
  copyFailed: '无法复制',
  cancel: '取消',
  lastError: '上次配置失败',
  states: {
    none: '未接入',
    pending: '等待项目初始化',
    'pr-open': '等待合并 PR',
    task: '任务进行中',
    connected: '已接入',
  },
  configure: {
    action: '配置 CI',
    title: '配置 CI',
    description:
      '每次运行接入一个应用的一个触发方式和环境，需要更多时再运行一次。',
    submit: {
      direct: '写入 workflow',
      template: '写入 workflow',
      agent: '创建任务',
      manual: '完成',
      ownAgent: '完成',
    },
    done: {
      prOpen: '已在 PR #{{number}} 中提交',
      pending: '仓库初始化后写入',
      task: '已创建任务 {{identifier}}',
      configured: '默认分支上已有这个 workflow',
    },
  },
  trigger: {
    label: '触发方式',
    pullRequest: {
      title: 'Pull request',
      description:
        '每个改动了应用的 Pull request 部署到自己的应用，合并或关闭后删除。',
    },
    branch: {
      title: '推送到分支',
      description: '每次推送到这个分支时构建并部署应用。',
      ref: '分支',
      invalid: '请填写分支名，如 main。',
    },
    tag: {
      title: '标签',
      description: '每个匹配的标签都会构建并部署应用。',
      ref: '标签模式',
      invalid: '请填写标签模式，如 v* 或 release-*。',
    },
  },
  environment: {
    label: '环境',
    choose: '选择环境',
    none: '还没有环境，请先在 发布 › 环境 中添加。',
    protectedItem: '{{name}}（受保护）',
    protectedHint: '受保护：CI 的每次部署都会生成待审批的申请',
    hint: {
      pullRequest: 'Pull request 的应用运行在这里。',
      branch: '应用运行在这里。',
      tag: '应用运行在这里。',
    },
    required: '请选择要部署到的环境。',
  },
  app: {
    title: '应用',
    directory: '目录',
    directoryHint: '相对仓库根目录，根目录填 .。',
    appId: '应用 ID',
    appIdHint: {
      pullRequest: '每个 Pull request 部署到 {{appId}}-pr-<编号>。',
      deploy:
        '部署到这个应用，不存在时在 {{environment}} 中创建。填写已有应用的 ID 即可部署到它。',
    },
    errors: {
      directory: '请填写仓库内的相对路径，如 . 或 apps/shop。',
      appId: '只能使用小写字母、数字、- 和 _。',
    },
  },
  method: {
    label: '方式',
    studio: '由 Studio 写入',
    self: '自己处理',
    autoUnavailable: '未连接代码托管。',
    connect: '去连接',
  },
  methods: {
    direct: {
      title: '自动写入标准 workflow',
      description:
        '适用于 NocoBase 应用。新仓库直接提交，已有仓库通过 Pull request。',
    },
    template: {
      title: '从模板改',
      description: '先编辑标准 workflow，Studio 写入你修改后的文件。',
    },
    agent: {
      title: '交给 Agent',
      description:
        '在项目中创建一个任务，由 Agent 调整仓库的 CI 并提交 Pull request。',
    },
    manual: {
      title: '复制 workflow 和命令',
      description: '自己添加到仓库，仓库的 CI 密钥只显示一次，由你自己保存。',
    },
    ownAgent: {
      title: '复制提示词',
      description: '交给你本地的编码 Agent。',
    },
  },
  agent: {
    label: '执行者',
    choose: '选择 Agent',
    hint: 'Studio 自己创建密钥并写入仓库密钥，任务里不会出现密钥。',
    required: '请选择接入 CI 的 Agent。',
  },
  status: {
    title: 'CI 状态',
    description: '这个仓库的 CI 上报的应用，按它们所在的环境分组。',
    app: '应用',
    lastBuild: '最近构建',
    lastDeploy: '最近部署',
    actions: '操作',
    actionsOf: '{{appId}} 的操作',
    notReported: '尚未上报',
    builds: '构建',
    variables: '变量',
    protected: '受保护',
    protectedHint: '受保护：CI 的每次部署都会生成待审批的申请',
    pullRequestApps: '每个 Pull request 一个应用',
    emptyTitle: '等待第一次上报',
    empty: '配置 CI 后，CI 上报的应用会显示在这里。',
    emptyReadOnly: 'CI 上报的应用会显示在这里。请项目负责人配置 CI。',
    prOpen: '等待合并 PR #{{number}}',
    pending: '等待仓库初始化后写入 workflow',
    task: '任务进行中',
  },
  remove: {
    action: '移除',
    title: '移除“{{appId}}”？',
    description:
      '它会从这个列表中隐藏，并解除与仓库的关联；CI 再次上报时会重新出现。要删除应用本身，请前往',
    appsPage: '应用页面。',
    pullRequests:
      '每个 Pull request 的应用各自部署，没有与仓库的关联可以解除：这里只会隐藏它们的构建。CI 上报新的 Pull request 时会重新出现。',
    done: '已移除“{{appId}}”',
  },
  failures: {
    rotationTitle: '密钥轮换失败',
    unknown: '配置未能完成，请重试，或改用自己处理的方式。',
    details: '详情',
    demoConnection: '演示连接不会写入仓库，请改用自己处理的方式。',
    noConnection:
      '这个仓库没有通过 Git 连接访问。请先连接，或改用自己处理的方式。',
    connectionMissing:
      '仓库的 Git 连接不存在或不完整，请在 设置 › Git 中检查。',
    connectionPermission:
      'Git 连接还不能写入仓库密钥。请先在代码托管平台上接受应用的新权限，再重试。',
    secretsUnsupported:
      '这个代码托管平台不接受 Studio 写入 CI 密钥，请自己处理。',
    hostForbidden:
      '代码托管平台拒绝了这次修改，请检查连接是否有这个仓库的写权限。',
    hostRateLimited:
      '已达到代码托管平台的请求频率上限，请在 {{retryAt}} 之后重试。',
    repositoryNotFound:
      '代码托管平台上找不到这个仓库，请检查它是否还在、连接能否访问。',
    defaultBranchMissing:
      '默认分支 {{branch}} 还不存在。请先推送，再重新配置 CI。',
    unknownEnvironment: '环境 {{environmentId}} 已不存在，请选择其他环境。',
    appInOtherEnvironment:
      '{{appId}} 运行在 {{actualEnvironmentId}}，不在 {{environmentId}}。请选择该环境，或换一个应用 ID。',
    appsNotCreatable:
      '应用还不存在，而你没有创建应用的权限。请让有权限的人配置，或填写已有应用的 ID。',
    appNotConfigurable:
      '你不能配置 {{appId}}，所以它的 CI 无法部署到这个应用。',
    forbidden: '你没有权限这样做。',
    keyScope: '密钥会包含你自己没有的权限，请让拥有这些权限的人配置 CI。',
    keyMissing: '仓库的 API 密钥已被停用或删除，请重新配置 CI 以创建新密钥。',
    keyRevoked:
      '仓库的 API 密钥已在 设置 › API 密钥 中被{{how}}，请重新配置 CI 以创建新密钥。',
    keyRevokedHow: {
      disabled: '停用',
      deleted: '删除',
    },
    rotationFailed:
      'CI 密钥未能更换新密钥，请在密钥菜单中轮换，或重新配置 CI。',
    noPublicOrigin:
      'Studio 不知道自己的公开地址（app.publicOrigin），CI 无法登录。请联系管理员设置。',
    apiKeysUnavailable: '这个工作区不能使用 API 密钥。',
    issuesUnavailable: '这个工作区不能创建任务。',
    workingDirectoryMissing: '工作目录已不存在。',
    noSetUpUser: '没有记录以谁的身份配置 CI，请重新配置 CI。',
  },
  preview: {
    workflow: 'workflow 文件',
    toggle: '展开或收起',
  },
  workflow: {
    editHint:
      'Studio 会写入你在这里修改后的文件；请保留读取 {{secret}} 和运行 studio 命令的部分。',
    changed: '已修改',
    unchanged: '标准文件，未修改',
    warningsTitle: 'workflow 可能无法工作',
    problems: {
      secret: '{{path}} 没有读取密钥 {{secret}}：CI 无法登录 Studio。',
      studio: '{{path}} 没有运行 studio 命令：构建不会上报到 Studio。',
    },
  },
  manual: {
    steps: {
      workflow: '把 workflow 文件添加到仓库，或把 studio 命令加到现有 CI。',
      key: '生成仓库的 CI 密钥：它只能访问这个仓库的应用，并且可以创建它们，例如每个 Pull request 的预览应用。',
      keyLater:
        '项目创建后，在项目的 设置 › 部署 › 配置 CI 中生成仓库的 CI 密钥，或运行 nb-studio build ci setup <owner/repo> --reveal。',
      secret:
        '把它保存为仓库 CI 的密钥 {{secret}}（在 GitHub 上是 Actions 密钥）。',
    },
    generate: '生成仓库的 CI 密钥',
    manageOnly: '只有项目的管理者可以生成。',
    revealed: {
      title: '仓库的 CI 密钥',
      label: 'CI 密钥',
      store:
        '请立即把它保存为仓库密钥 {{secret}}。它不会再次显示：需要新的值时，请重新生成或轮换。',
    },
    presetHint:
      '在 设置 › API 密钥 中创建的“CI 部署”密钥也能部署到已有的应用，但不能创建应用，因此无法用于 Pull request 预览。',
    openKeys: '打开 API 密钥',
    commands: 'studio 命令',
  },
  ownAgent: {
    title: '给你的 Agent 的提示词',
    hint: '粘贴到 Claude Code、Codex 等编码 Agent。它会请你创建密钥并添加为仓库密钥，不会要你把密钥发给它。',
  },
  key: {
    title: '托管密钥',
    actions: '密钥操作',
    rotate: '轮换密钥',
    rotateReveal: '轮换并显示新密钥',
    confirmReplacement: {
      title: '替换仓库 CI 密钥？',
      description:
        '当前密钥会立即失效。在更新密钥前，使用 NB_STUDIO_API_KEY 的 CI 都会认证失败。',
      lastUsed: '最近使用时间：{{date}}',
      cancel: '取消',
      confirm: '替换并显示新密钥',
    },
    rotated: '密钥已轮换',
    expires: '{{date}} 到期',
    never: '不过期',
    missing: '密钥已被删除',
    secret: '保存在 {{secret}}',
    status: {
      active: '可用',
      disabled: '已停用',
      expired: '已过期',
    },
  },
  recent: {
    title: '最近的构建和部署',
    description: '这个仓库的 CI 上报给 Studio 的构建。',
    allApps: '全部应用',
    empty: 'CI 还没有上报构建。',
    noMatch: '没有符合筛选条件的构建。',
    loadFailed: '无法加载构建。',
    time: '时间',
    app: '应用',
    kind: '触发方式',
    commit: '提交',
    state: '状态',
    run: 'CI 运行',
    open: '打开',
    kinds: {
      pullRequest: 'Pull request',
      ref: '分支或标签',
    },
  },
  wizard: {
    fixRun: '先填好上面的触发方式、环境和应用，才能看到 workflow。',
    later: '之后可在项目设置的「部署」中接入更多应用、分支或标签。',
  },
  prompt: {
    intro: {
      pullRequest:
        '把仓库 {{repo}} 的 Pull request CI 接入 Studio（{{studioUrl}}）：每个改动了下面这个应用的 Pull request 都会被构建、上传到 Studio，并部署到它自己在环境 `{{environment}}` 中的应用。',
      branch:
        '把仓库 {{repo}} 的分支 `{{branch}}` 的 CI 接入 Studio（{{studioUrl}}）：每次推送都会构建下面这个应用、上传到 Studio，并部署到环境 `{{environment}}`。',
      tag: '把仓库 {{repo}} 中匹配 `{{pattern}}` 的标签的 CI 接入 Studio（{{studioUrl}}）：每个这样的标签都会构建下面这个应用、上传到 Studio，并部署到环境 `{{environment}}`。',
    },
    appTitle: '应用',
    directory: '- 目录：`{{directory}}`',
    appId: {
      pullRequest:
        '- 应用：`{{appId}}-pr-<编号>`，每个 Pull request 一个，合并或关闭后删除',
      branch: '- 应用：`{{appId}}`，不存在时在 `{{environment}}` 中创建',
      tag: '- 应用：`{{appId}}`，不存在时在 `{{environment}}` 中创建',
    },
    fileTitle: '标准 workflow 文件',
    commandsTitle: 'studio 命令',
    commandsHint:
      '如果仓库已经有 CI，就把这些命令加到它自己的构建前后，而不是再加一个 workflow。',
    secretTask:
      '仓库密钥 `{{secret}}` 里已经有 Studio 创建并负责轮换的组织 API 密钥。不要打印、复制或索要它。',
    secretOwn:
      '请我在 Studio（{{studioUrl}}）中生成仓库的 CI 密钥（项目的 设置 › 部署 › 配置 CI › 复制 workflow 和命令，或运行 `nb-studio build ci setup <owner/repo> --reveal`），并把它保存为仓库密钥 `{{secret}}`。不要让我把密钥贴给你。',
    stepsTitle: '要做的事',
    steps: {
      read: '阅读仓库的 CI（`.github/workflows/`）以及应用如何构建（`pnpm build --tar` 生成 `storage/exports/dist.tar.gz`）。',
      add: '添加上面的 workflow 文件，或把 studio 步骤加到现有 CI，并按这个仓库的构建方式调整。',
      pullRequest:
        '针对 `{{defaultBranch}}` 提交一个 Pull request 并说明改了什么。',
    },
  },
};
