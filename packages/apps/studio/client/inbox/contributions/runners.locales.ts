/**
 * The wording of the agents plugin's runner inbox entries, in their own namespace (`runners.ts`).
 */
export const RUNNERS_NAMESPACE = 'studio-inbox-runners';

const enUS = {
  types: {
    runner_upgrade_required: 'Runtime needs an upgrade',
    run_secrets_not_allowed: 'Run needs a team runtime',
  },
  headings: {
    runner_upgrade_required: 'A runtime of yours needs an upgrade',
    run_secrets_not_allowed: 'A run waits for a team runtime',
  },
  title: '{{name}} needs an upgrade',
  sentence:
    'Its runner {{version}} speaks protocol {{protocol}}; Studio needs protocol {{required}}. It runs nothing until it is updated.',
  newerSentence:
    'Its runner {{version}} speaks protocol {{protocol}}, newer than Studio (protocol {{required}}). It runs nothing until it runs the runner Studio serves.',
  latest:
    'Studio serves runner {{latest}}: run nocobase-runner update on its host.',
  open: 'Open runtimes',
  unknown: 'unknown',
};

const zhCN: typeof enUS = {
  types: {
    runner_upgrade_required: '运行环境需要升级',
    run_secrets_not_allowed: '任务需要团队运行环境',
  },
  headings: {
    runner_upgrade_required: '你的一个运行环境需要升级',
    run_secrets_not_allowed: '一个任务正在等待团队运行环境',
  },
  title: '{{name}} 需要升级',
  sentence:
    '它的 agent runner {{version}} 使用 Agent 协议 {{protocol}}，Studio 需要协议 {{required}}。升级之前它不会执行任何任务。',
  newerSentence:
    '它的 agent runner {{version}} 使用 Agent 协议 {{protocol}}，比 Studio（协议 {{required}}）更新。换成 Studio 提供的 agent runner 之前它不会执行任何任务。',
  latest:
    'Studio 提供 agent runner {{latest}}：在它所在的主机上运行 nocobase-runner update。',
  open: '打开运行环境',
  unknown: '未知',
};

export const runnersResources = { 'en-US': enUS, 'zh-CN': zhCN };
