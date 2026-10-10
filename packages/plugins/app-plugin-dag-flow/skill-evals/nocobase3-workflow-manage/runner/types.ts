export type PromptRisk =
  | 'read-only'
  | 'mutation-gated'
  | 'isolated-mutation'
  | 'isolated-source-mutation'
  | 'side-effecting'
  | 'high';

export interface PromptCase {
  id: string;
  action: string;
  risk: PromptRisk;
  prompt: string;
  domain?: string;
  fixture?: string;
  preconditions?: string[];
  skillMode?: 'explicit' | 'implicit';
  expected: string[];
  forbidden: string[];
}

export interface PromptSuite {
  version: number;
  skill: string;
  suite?: string;
  cases: PromptCase[];
}

export interface AgentRunOptions {
  cwd: string;
  prompt: string;
  skillPath: string;
  injectSkill: boolean;
  model?: string;
  sandbox: 'read-only' | 'workspace-write';
  timeoutMs: number;
}

export interface AgentRunResult {
  adapter: string;
  threadId: string;
  turnId: string;
  status: string;
  finalResponse: string;
  stderr: string;
  durationMs: number;
}

export interface PromptRunRecord {
  case: PromptCase;
  suiteFile: string;
  workspace: string;
  fixtureDatabase?: string;
  startedAt: string;
  result?: AgentRunResult;
  error?: string;
}
