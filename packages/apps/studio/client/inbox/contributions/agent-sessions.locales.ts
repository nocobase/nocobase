/**
 * The wording of the agent sessions' inbox entries, in their own namespace (`agent-sessions.ts`).
 */
export const AGENT_SESSIONS_NAMESPACE = 'studio-inbox-agent-sessions';

const enUS = {
  types: {
    permissionRequested: 'Waiting for your permission',
    turnEnded: 'Agent replied',
    turnFailed: 'Agent stopped',
  },
  headings: {
    permissionRequested: 'Your agent is waiting for your permission',
    turnEnded: 'Your agent replied',
    turnFailed: 'Your agent stopped with an error',
  },
  titles: {
    permissionRequested: '{{agent}} is waiting for your permission',
    turnEnded: '{{agent}} replied',
    turnFailed: '{{agent}} stopped with an error',
  },
  sentence: 'In “{{session}}”',
  sentenceDetail: 'In “{{session}}”: {{detail}}',
  outcomes: {
    seen: 'Seen',
    answered: 'Answered',
    archived: 'Archived',
  },
  open: 'Open the session',
  agent: 'Your agent',
};

const zhCN: typeof enUS = {
  types: {
    permissionRequested: '等你确认',
    turnEnded: 'Agent 回复了',
    turnFailed: 'Agent 出错了',
  },
  headings: {
    permissionRequested: '你的 Agent 在等你确认',
    turnEnded: '你的 Agent 回复了',
    turnFailed: '你的 Agent 出错停下了',
  },
  titles: {
    permissionRequested: '{{agent}} 在等你确认',
    turnEnded: '{{agent}} 回复了',
    turnFailed: '{{agent}} 出错停下了',
  },
  sentence: '会话「{{session}}」',
  sentenceDetail: '会话「{{session}}」：{{detail}}',
  outcomes: {
    seen: '已查看',
    answered: '已回答',
    archived: '已归档',
  },
  open: '打开会话',
  agent: '你的 Agent',
};

export const agentSessionsResources = { 'en-US': enUS, 'zh-CN': zhCN };
