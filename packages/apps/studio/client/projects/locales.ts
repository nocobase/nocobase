/**
 * The wording of a project's page that is Studio's own (`client/projects`, `pages/projects`), merged into the
 * application's locales as `projectPage` (`client/locales/*.ts`). The rest is the projects plugin's, in its namespace.
 */
export const projectPageEnUS = {
  tabs: {
    label: 'Project sections',
    overview: 'Overview',
    issues: 'Issues',
    knowledge: 'Knowledge',
    members: 'Members',
    releases: 'Releases',
    settings: 'Settings',
  },
  manageMembers: 'Manage',
  memberCount: '{{count}} members',
  resourcesDescription: 'The first is the primary one, where work starts.',
  resources: {
    emptyTitle: 'No working directories yet',
    emptyDescription:
      'Add a repository or a directory on a runner, and issues work there.',
    actions: 'Actions for {{name}}',
    settings: 'Edit',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
    removeTitle: 'Remove the working directory “{{name}}”?',
    removeDescription:
      'Issues stop working in it. The repository or directory itself is not touched.',
    cancel: 'Cancel',
  },
  settings: {
    nav: 'Settings sections',
    sections: {
      general: 'General',
      directories: 'Working directories',
      ci: 'Deployment',
      git: 'Branch rules',
      variables: 'Agent run variables',
      skills: 'Default skills',
    },
    descriptions: {
      general:
        'The project’s name and description, and how its commits are attributed.',
      directories:
        'Where the project’s code is; the first is the primary one, where work starts.',
      ci: 'How a repository’s CI builds previews and deploys to Studio.',
      git: 'The branches agents work on and what wakes them.',
      variables:
        'The variables and secrets an agent gets while it works in this project; what deployed apps read, previews included, is set on their environment or on each app in Releases.',
      skills:
        'Skills every run in the project, or in one working directory, starts with.',
    },
    repository: 'Repository',
    scope: 'Applies to',
    wholeProject: 'The whole project',
    workdirScope: 'Working directory {{name}}',
    variablesDescription:
      'Every run in the project gets the project’s variables, and a run in a working directory that directory’s as well.',
    variablesOverride:
      'A working directory’s variable replaces the project’s variable of the same name; an agent’s own variables replace both.',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Saved',
    variablesNote: 'Variables are saved as soon as you change them.',
    general: {
      title: 'Project',
      description: 'Its name and description, as the project list shows them.',
      nameRequired: 'Enter a project name',
    },
    directories: {
      edit: 'Edit working directory',
      repoDescription:
        'Where the repository is and the branch issues start from.',
      directoryDescription:
        'Which runner the directory is on, its path, and its name in Studio.',
    },
  },
  nextSteps: {
    title: 'Next steps',
    description: 'What is still to set up in this project.',
    addDirectory: 'Add a working directory',
    init: 'Finish the initialization',
    ci: 'Connect preview CI: {{name}}',
  },
  codeLocation: {
    label: 'Display name',
    labelHint: 'The name the project list and agents see; the path when empty.',
    ciLater:
      'Its preview CI is connected in “Deployment”, which opens once it is added.',
    repository: 'Repository',
    cloneUrl: 'Clone URL',
    cloneUrlHint:
      'https, ssh or git@host:owner/repo. Without a Git connection Studio does not reach its host: no pull requests are opened for it.',
    defaultBranch: 'Default branch',
    defaultBranchHint:
      'Where issues branch from and where staging builds come from.',
    chooseRunner: 'Choose a runner',
    loadingRunners: 'Loading runners…',
    newRepoAdded:
      'Created through a connection when you add it; an “Initialize” issue sets it up, and its default branch is protected once ready.',
    promptAdded:
      'If filled, an agent does this first in an “Initialize” issue of its own.',
    addTitle: 'Add a working directory',
    addDescription: 'Where the code is and how it starts.',
    add: 'Add',
    added: 'Working directory added.',
    addedWithIssue: 'Working directory added; {{identifier}} initializes it.',
    ciWithApp:
      'Its preview CI is connected with it; adjust it later in the project’s Deploy settings.',
  },
  previews: {
    title: 'Previews',
    description:
      'The previews of this project’s issues, running or ready to start on a visit.',
    empty: 'No previews of this project’s issues.',
    loadFailed: 'Could not load the previews.',
    open: 'Open the preview of {{identifier}}',
  },
  newProject: {
    title: 'New project',
    description:
      'Name it, say where its code is, and how its pull requests are previewed.',
    steps: {
      label: 'Steps',
      basics: 'Basics',
      code: 'Code',
      deploy: 'Deploy',
    },
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    name: 'Project name',
    projectDescription: 'Description',
    workflow: 'Workflow template',
    initAgent: 'Initialization agent',
    initAgentHint:
      'Works on the “Initialize project” issue; who takes over later issues is up to the workflow’s status rules.',
    chooseAgent: 'Choose an agent',
    loadingAgents: 'Loading agents…',
    connection: 'Connection',
    owner: 'Owner',
    ownerFrom: '· from the connection “{{connection}}”',
    ownerHint:
      'The GitHub App’s installation decides the owner; choose another Git connection to create it elsewhere.',
    gitConnection: 'Git connection',
    gitConnectionHint:
      'Used for the new repository, its template and an existing repository alike.',
    changeOwner: 'Change owner',
    repoName: 'Repository name',
    privateRepo: 'Private repository',
    runner: 'Runner',
    path: 'Path on the runner',
    noGit: 'No code host connected.',
    noGitTemplates:
      'Connect a code host to create a repository, from a template repository too.',
    connect: 'Connect',
    loadFailed: 'Could not load the template repositories.',
    created: 'Project created; {{identifier}} initializes it.',
    createdPlain: 'Project created.',
    labels: {
      locations: {
        newRepo: {
          title: 'New GitHub repository',
          description:
            'Created through a connection and initialized as the project’s first issue; its default branch is protected once ready.',
        },
        existingRepo: {
          title: 'Existing repository',
          description:
            'A repository you already have; issues work on its branches, with pull requests and previews.',
        },
        runnerDirectory: {
          title: 'Directory on a runner',
          description:
            'Every issue runs on the chosen runner, in that directory, without Git: no branches, pull requests or previews.',
        },
        none: {
          title: 'No code',
          description:
            'A blank project; a working directory can be added later in its settings.',
        },
      },
      initMethods: {
        nocobase: {
          title: 'NocoBase app (default template)',
          description:
            'An agent on a runner creates the application with create-app’s default template and pushes it as the first commit.',
        },
        template: {
          title: 'From a template repository',
          description:
            'Generated from a template; a workflow may finish the setup.',
        },
        prompt: {
          title: 'Empty repository, optional prompt',
          description:
            'An agent makes the first commit from your prompt; without one, the repository starts with an initial commit.',
        },
      },
      templateRepos: {
        label: 'Template repository',
        search: 'Search, or type owner/repo',
        empty:
          'This connection has no template repositories; type an owner/repo instead.',
        noMatch:
          'No template repository of this connection matches; type an owner/repo instead.',
        more: 'Show more',
        private: 'Private',
        noDescription: 'No description',
        loadFailed: 'Could not load the template repositories: {reason}',
        retry: 'Retry',
        change: 'Choose another',
        useTyped: 'Use {name}',
        checking: 'Checking {name}…',
        notTemplate: '{name} is not a template repository.',
        notFound: 'The connection cannot read {name}.',
        checkFailed: 'Could not check {name}.',
        loading: 'Loading template repositories…',
        loadingMore: 'Loading more…',
      },
      nocobase: {
        runnerNeeded:
          'Needs a runner with Node.js 24 and pnpm 11, where the initialization agent runs.',
        runtimesLink: 'Runtimes',
        noRunnerOnline:
          'No runner is online: the project is created now, and its initialization waits for one.',
        ci: 'Studio also connects its preview CI: each pull request is deployed to Preview.',
      },
      workflow: {
        label: 'Initialization workflow',
        none: 'None: ready at once',
        chosenHint:
          'The project is ready once {name} succeeds on the new repository.',
        noneHint:
          'The project is ready as soon as the repository is generated.',
        empty: 'The template has no workflows.',
        loading: 'Loading the template’s workflows…',
      },
      prompt: {
        label: 'What the agent should create (optional)',
        hint: 'If filled, the initialization agent makes and pushes the first commit on the default branch. Leave it empty for a repository with just an initial commit and no initialization issue.',
        optionalLabel: 'Initialization prompt (optional)',
        optionalHint:
          'If filled, an agent does this first in an "Initialize project" issue, which the project’s other issues wait for.',
        optionalPlaceholder: 'Read the code and add an AGENTS.md.',
      },
      cancel: 'Cancel',
      create: 'Create project',
      incomplete: {
        name: 'Enter a project name',
        repoName: 'Enter a repository name',
        templateRepo: 'Choose a template repository',
        prompt: 'Describe what the agent should create',
        repository: 'Choose a repository',
        cloneUrl: 'Enter the clone URL',
        runner: 'Choose a runner',
        path: 'Enter the path on the runner',
        initAgent: 'Choose an initialization agent',
      },
    },
  },
  init: {
    title: 'Initialization',
    states: {
      pending: 'In progress',
      running: 'Running',
      failed: 'Failed',
      done: 'Ready',
    },
    executor: {
      actions: 'Run by GitHub Actions',
      githubActions: 'GitHub Actions',
      agent: 'Run by an agent',
      none: 'Generated from the template',
    },
    template: 'Template',
    appTemplate: 'NocoBase template',
    waitingForRunner:
      'Waiting for a runner: none can run the initialization agent now.',
    workflow: 'Workflow',
    waitingRun: 'Waiting for the workflow to start on {{repo}}.',
    runSucceeded: 'The agent’s run succeeded',
    runWaiting: 'The agent’s run has not succeeded yet',
    pushed: 'The first commit reached {{branch}}',
    pushWaiting: 'No commit on {{branch}} yet',
    branchProtected: 'The default branch is protected.',
    branchNotProtected:
      'The default branch could not be protected; protect it on the code host.',
    retry: 'Run again',
    retried: 'The workflow runs again.',
    issue: 'Issue',
  },
};

export const projectPageZhCN: typeof projectPageEnUS = {
  tabs: {
    label: '项目分区',
    overview: '概览',
    issues: '任务',
    knowledge: '知识库',
    members: '成员',
    releases: '发布',
    settings: '设置',
  },
  manageMembers: '管理',
  memberCount: '{{count}} 位成员',
  resourcesDescription: '第一个是主目录，工作从这里开始。',
  resources: {
    emptyTitle: '还没有工作目录',
    emptyDescription: '添加一个仓库或运行器上的目录，任务就在那里进行。',
    actions: '{{name}} 的操作',
    settings: '编辑',
    moveUp: '上移',
    moveDown: '下移',
    remove: '移除',
    removeTitle: '移除工作目录“{{name}}”？',
    removeDescription: '任务不再在这里进行。仓库或目录本身不受影响。',
    cancel: '取消',
  },
  settings: {
    nav: '设置分区',
    sections: {
      general: '常规',
      directories: '工作目录',
      ci: '部署',
      git: '分支规则',
      variables: 'Agent 运行变量',
      skills: '默认技能',
    },
    descriptions: {
      general: '项目的名称和描述，以及提交的署名方式。',
      directories: '项目的代码在哪里；第一个是主目录，工作从这里开始。',
      ci: '仓库的 CI 如何构建预览并部署到 Studio。',
      git: 'Agent 在哪些分支上工作，以及什么会唤醒它们。',
      variables:
        'Agent 在这个项目里工作时拿到的变量与密钥；部署出来的应用（包括预览应用）读取的变量，在发布管理中按环境或按应用设置。',
      skills: '项目或某个工作目录中每次运行默认带上的技能。',
    },
    repository: '仓库',
    scope: '应用于',
    wholeProject: '整个项目',
    workdirScope: '工作目录 {{name}}',
    variablesDescription:
      '项目中的每次运行都会拿到整个项目的变量；在某个工作目录中运行时，还会拿到这个工作目录的变量。',
    variablesOverride:
      '工作目录的变量会覆盖整个项目中的同名变量；Agent 自己的变量又会覆盖两者。',
    save: '保存',
    cancel: '取消',
    saved: '已保存',
    variablesNote: '变量的修改会立即保存。',
    general: {
      title: '项目',
      description: '项目列表中显示的名称和描述。',
      nameRequired: '请输入项目名称',
    },
    directories: {
      edit: '编辑工作目录',
      repoDescription: '仓库的地址和任务的起始分支。',
      directoryDescription:
        '目录所在的运行器、路径，以及它在 Studio 中的名字。',
    },
  },
  nextSteps: {
    title: '接下来',
    description: '这个项目还需要完成的设置。',
    addDirectory: '添加工作目录',
    init: '完成项目初始化',
    ci: '接入预览 CI：{{name}}',
  },
  codeLocation: {
    label: '显示名称',
    labelHint: '项目列表和 Agent 看到的名字，留空则用路径。',
    ciLater: '添加后会打开「部署」，在那里接入它的预览 CI。',
    repository: '仓库',
    cloneUrl: '克隆地址',
    cloneUrlHint:
      'https、ssh 或 git@host:owner/repo。没有 Git 连接时 Studio 无法访问它的托管平台，也不会为它创建 Pull request。',
    defaultBranch: '默认分支',
    defaultBranchHint: '任务从这里创建分支，预发布（staging）构建也来自这里。',
    chooseRunner: '选择运行器',
    loadingRunners: '正在加载运行器…',
    newRepoAdded:
      '添加时通过连接创建；由一个“初始化”任务完成初始化，就绪后保护默认分支。',
    promptAdded: '如果填写，Agent 会先在一个单独的“初始化”任务中完成它。',
    addTitle: '添加工作目录',
    addDescription: '代码在哪里，以及如何初始化。',
    add: '添加',
    added: '工作目录已添加。',
    addedWithIssue: '工作目录已添加，{{identifier}} 负责初始化。',
    ciWithApp: '会同时接入它的预览 CI，之后可在项目设置的「部署」中调整。',
  },
  previews: {
    title: '预览',
    description: '这个项目的任务的预览，运行中或访问时启动。',
    empty: '这个项目的任务还没有预览。',
    loadFailed: '无法加载预览',
    open: '打开 {{identifier}} 的预览',
  },
  newProject: {
    title: '新建项目',
    description: '填写名称，说明代码在哪里，以及如何预览 Pull request。',
    steps: {
      label: '步骤',
      basics: '基本信息',
      code: '代码',
      deploy: '部署',
    },
    back: '上一步',
    next: '下一步',
    skip: '跳过',
    name: '项目名称',
    projectDescription: '描述',
    workflow: '流程模板',
    initAgent: '初始化 Agent',
    initAgentHint:
      '负责“初始化项目”任务；之后的任务由谁接手，取决于流程的状态规则。',
    chooseAgent: '选择 Agent',
    loadingAgents: '正在加载 Agent…',
    connection: '连接',
    owner: '所有者',
    ownerFrom: '· 来自连接「{{connection}}」',
    ownerHint:
      '所有者由 GitHub App 的安装决定；要创建到别处，请选择其他 Git 连接。',
    gitConnection: 'Git 连接',
    gitConnectionHint: '新建仓库、模板仓库和已有仓库都通过它访问。',
    changeOwner: '更改所有者',
    repoName: '仓库名称',
    privateRepo: '私有仓库',
    runner: '运行器',
    path: '运行器上的路径',
    noGit: '未连接代码托管',
    noGitTemplates: '连接代码托管后可新建仓库，也可从模板仓库创建。',
    connect: '去连接',
    loadFailed: '无法加载模板仓库',
    created: '项目已创建，{{identifier}} 负责初始化。',
    createdPlain: '项目已创建。',
    labels: {
      locations: {
        newRepo: {
          title: '新建 GitHub 仓库',
          description:
            '通过连接创建，并作为项目的第一个任务完成初始化；就绪后保护默认分支。',
        },
        existingRepo: {
          title: '已有仓库',
          description:
            '你已经有的仓库；任务在它的分支上进行，带有 Pull request 和预览。',
        },
        runnerDirectory: {
          title: '运行器上的目录',
          description:
            '每个任务都在所选运行器的这个目录中运行，不使用 Git：没有分支、Pull request 和预览。',
        },
        none: {
          title: '暂无代码',
          description:
            '没有工作目录的空白项目；之后可以在项目设置中添加工作目录。',
        },
      },
      initMethods: {
        nocobase: {
          title: 'NocoBase 应用默认模板',
          description:
            '由运行环境上的 Agent 用 create-app 的默认模板创建应用，并作为首次提交推送。',
        },
        template: {
          title: '从模板仓库生成',
          description: '从模板生成；可由某个工作流完成初始化。',
        },
        prompt: {
          title: '空仓库，提示词可选',
          description:
            '由 Agent 根据你的提示词完成首次提交；不填则仓库只有一个初始提交。',
        },
      },
      templateRepos: {
        label: '模板仓库',
        search: '搜索，或输入 owner/repo',
        empty: '这个连接下没有模板仓库，可以直接输入 owner/repo',
        noMatch: '这个连接下没有匹配的模板仓库，可以直接输入 owner/repo',
        more: '显示更多',
        private: '私有',
        noDescription: '暂无描述',
        loadFailed: '无法加载模板仓库：{reason}',
        retry: '重试',
        change: '重新选择',
        useTyped: '使用 {name}',
        checking: '正在检查 {name}…',
        notTemplate: '{name} 不是模板仓库。',
        notFound: '这个连接无法读取 {name}。',
        checkFailed: '无法检查 {name}。',
        loading: '正在加载模板仓库…',
        loadingMore: '正在加载更多…',
      },
      nocobase: {
        runnerNeeded:
          '需要一个运行环境（Node.js 24、pnpm 11），初始化 Agent 在那里运行。',
        runtimesLink: '运行环境',
        noRunnerOnline:
          '当前没有在线的运行环境：项目会先创建，初始化会等待运行环境上线。',
        ci: 'Studio 会同时接入它的预览 CI：每个 Pull request 部署到 Preview 环境。',
      },
      workflow: {
        label: '初始化工作流',
        none: '无：立即就绪',
        chosenHint: '{name} 在新仓库上成功运行后，项目即就绪。',
        noneHint: '仓库生成后项目立即就绪。',
        empty: '这个模板没有工作流。',
        loading: '正在加载模板的工作流…',
      },
      prompt: {
        label: '希望 Agent 创建什么（可选）',
        hint: '填写后，初始化 Agent 会在默认分支上完成并推送首次提交。不填则仓库只有一个初始提交，也不会创建初始化任务。',
        optionalLabel: '初始化提示词（可选）',
        optionalHint:
          '填写后，会创建“初始化项目”任务，由 Agent 先完成这件事；项目的其他任务会等它完成。',
        optionalPlaceholder: '阅读代码并添加 AGENTS.md。',
      },
      cancel: '取消',
      create: '创建项目',
      incomplete: {
        name: '请输入项目名称',
        repoName: '请输入仓库名称',
        templateRepo: '请选择模板仓库',
        prompt: '请描述希望 Agent 创建什么',
        repository: '请选择仓库',
        cloneUrl: '请填写克隆地址',
        runner: '请选择运行器',
        path: '请输入运行器上的路径',
        initAgent: '请选择初始化 Agent',
      },
    },
  },
  init: {
    title: '初始化',
    states: {
      pending: '进行中',
      running: '运行中',
      failed: '失败',
      done: '已就绪',
    },
    executor: {
      actions: '由 GitHub Actions 运行',
      githubActions: 'GitHub Actions',
      agent: '由 Agent 运行',
      none: '从模板生成',
    },
    template: '模板',
    appTemplate: 'NocoBase 模板',
    waitingForRunner: '等待运行环境：当前没有可以运行初始化 Agent 的运行环境。',
    workflow: '工作流',
    waitingRun: '等待工作流在 {{repo}} 上启动。',
    runSucceeded: 'Agent 的运行已成功',
    runWaiting: 'Agent 的运行尚未成功',
    pushed: '首次提交已到达 {{branch}}',
    pushWaiting: '{{branch}} 上还没有提交',
    branchProtected: '默认分支已受保护。',
    branchNotProtected: '无法保护默认分支，请在代码托管平台上设置。',
    retry: '重新运行',
    retried: '工作流已重新运行。',
    issue: '任务',
  },
};
