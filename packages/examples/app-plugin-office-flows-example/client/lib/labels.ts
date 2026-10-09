/** Display names of every lifecycle state, by lifecycle. */
export const STATE_LABELS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  dataRequests: {
    draft: '申请人填写',
    level1Review: '一级主管审批',
    level2Review: '二级主管审批',
    level3Review: '三级主管审批',
    accepting: '抽数受理分析和分派',
    completed: '已办结',
    exited: '已退出',
  },
  extractions: { pending: '抽数处理', completed: '已完成', voided: '已作废' },
  incoming: {
    draft: '收文录入',
    headReview: '办公室部门主管审批',
    leaderReview: '办公室分管领导审批',
    dispatching: '申请人派发',
    closed: '已办结',
  },
  clerkTasks: {
    signing: '办事人员会签',
    reviewing: '办事人员审批',
    accepted: '已接收',
    objected: '有异议',
    done: '已反馈',
  },
  teamTasks: { processing: '执行团队处理', done: '已反馈' },
  executorTasks: { processing: '执行人处理', done: '已反馈' },
};

export const TASK_LIFECYCLE: Readonly<Record<string, string>> = {
  clerk: 'clerkTasks',
  team: 'teamTasks',
  executor: 'executorTasks',
};

export function stateLabel(lifecycle: string, state: unknown): string {
  return STATE_LABELS[lifecycle]?.[String(state)] ?? String(state);
}
