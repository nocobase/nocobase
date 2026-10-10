/**
 * The wording of run requests (`run-requests.ts`): the owner's inbox card and "Waiting for you" on the issue
 * (`client/inbox/contributions/run-requests.ts`), the requests the viewer asked on an issue
 * (`issue-run-requests.tsx`) and "Comment and run as me" in the comment box, merged into the application's locales
 * as `runRequests` (`client/locales/*.ts`).
 */
export const runRequestsEnUS = {
  label: 'Run request',
  labelDetail: 'Someone asked an agent to work on your issue',
  expiredLabel: 'Request not run',
  title: '{{name}} asks {{agent}} to work on {{identifier}}',
  sentence:
    'It runs as you once you confirm it; until then nothing runs on your runtimes.',
  expiredTitle: '{{agent}} did not run your request on {{identifier}}',
  expiredSentence: {
    timeout:
      'Nobody confirmed it in time. You can still run it as yourself, on your own runtime or a team runtime.',
    reassignment:
      'The issue’s new owner cannot run it. You can still run it as yourself, on your own runtime or a team runtime.',
  },
  open: 'Open issue',
  asked: 'What {{name}} asked',
  why: {
    comment: 'A comment',
    mention: 'A mention',
    reply: 'A reply',
    assigned: 'Given the issue',
    statusChange: 'A status change',
    stageEntered: 'A workflow stage',
    unblocked: 'A released dependency',
    subtasksFinished: 'Finished sub-issues',
    projectChanged: 'A move to another project',
    other: 'A change',
  },
  meta: '{{why}} by {{name}} · {{agent}} · expires {{expires}}',
  loadFailed: 'Could not load the request.',
  confirm: 'Confirm and run as me',
  reject: 'Reject',
  rejectTitle: 'Reject this request?',
  rejectNote: 'Why (optional, for {{name}})',
  rejectConfirm: 'Reject',
  cancel: 'Cancel',
  onlyOwner: 'Only the issue’s owner can confirm or reject it.',
  confirmed: 'Confirmed: the agent runs it as you.',
  rejected: 'Rejected.',
  outcomes: {
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    superseded: 'Handed to the new owner',
    expired: 'Expired',
  },
  statuses: {
    pending: 'Waiting for the owner',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    superseded: 'Handed to the new owner',
    expired: 'Expired',
  },
  asMe: 'Run as me',
  withdraw: 'Withdraw',
  ranAsMe: 'Running as you.',
  withdrawn: 'Withdrawn.',
  section: 'Waiting for the owner',
  sectionHint:
    'What you asked of agents here runs once {{owner}} confirms it, or now as you, on a runtime you may use.',
  waitingFor: '{{agent}} · waits for {{owner}}',
  commentMode: 'Comment and run as me',
  commentModePlaceholder:
    'Comment; the agents it wakes run as you, on a runtime you may use, without waiting for the owner',
  commentModeSend: 'Send and run',
  commentRan_one: 'The agent runs it as you.',
  commentRan_other: '{{count}} agents run it as you.',
  commentNotRun:
    'No runtime you may use can run it now, so it waits for the owner to confirm.',
};

export const runRequestsZhCN: typeof runRequestsEnUS = {
  label: '执行请求',
  labelDetail: '有人请 agent 处理你负责的任务',
  expiredLabel: '请求未执行',
  title: '{{name}} 请 {{agent}} 处理 {{identifier}}',
  sentence: '你确认后以你的身份执行；确认前不会在你的运行环境上执行。',
  expiredTitle: '{{agent}} 没有执行你在 {{identifier}} 上的请求',
  expiredSentence: {
    timeout:
      '没有人按时确认。你仍然可以以自己的身份执行，使用你自己的或团队的运行环境。',
    reassignment:
      '任务的新负责人无法执行它。你仍然可以以自己的身份执行，使用你自己的或团队的运行环境。',
  },
  open: '打开任务',
  asked: '{{name}} 的原文',
  why: {
    comment: '评论',
    mention: '提及',
    reply: '回复',
    assigned: '指派任务',
    statusChange: '修改状态',
    stageEntered: '流程阶段',
    unblocked: '解除阻塞',
    subtasksFinished: '子任务完成',
    projectChanged: '移到其他项目',
    other: '修改',
  },
  meta: '{{name}} 的{{why}} · {{agent}} · {{expires}}过期',
  loadFailed: '无法加载这个请求。',
  confirm: '确认，以我的身份执行',
  reject: '拒绝',
  rejectTitle: '拒绝这个请求？',
  rejectNote: '原因（可选，会告诉 {{name}}）',
  rejectConfirm: '拒绝',
  cancel: '取消',
  onlyOwner: '只有任务负责人可以确认或拒绝。',
  confirmed: '已确认：agent 以你的身份执行。',
  rejected: '已拒绝。',
  outcomes: {
    confirmed: '已确认',
    rejected: '已拒绝',
    withdrawn: '已撤回',
    superseded: '已转给新负责人',
    expired: '已过期',
  },
  statuses: {
    pending: '等待负责人确认',
    confirmed: '已确认',
    rejected: '已拒绝',
    withdrawn: '已撤回',
    superseded: '已转给新负责人',
    expired: '已过期',
  },
  asMe: '以我的身份执行',
  withdraw: '撤回',
  ranAsMe: '已以你的身份执行。',
  withdrawn: '已撤回。',
  section: '等待负责人确认',
  sectionHint:
    '你在这里请 agent 做的事，{{owner}} 确认后执行；也可以现在以你的身份执行，使用你能用的运行环境。',
  waitingFor: '{{agent}} · 等待 {{owner}} 确认',
  commentMode: '评论并以我的身份执行',
  commentModePlaceholder:
    '评论；它唤醒的 agent 以你的身份、在你能用的运行环境上执行，不等负责人确认',
  commentModeSend: '发送并执行',
  commentRan_one: 'agent 以你的身份执行。',
  commentRan_other: '{{count}} 个 agent 以你的身份执行。',
  commentNotRun: '现在没有你能用的运行环境，已留给负责人确认。',
};
