import type { UsageQuery } from '../../shared/reports.js';

/** Query keys of this plugin's cache, all under `['agents']`. */
export const agentsKeys: {
  readonly all: readonly ['agents'];
  readonly agents: readonly ['agents', 'agents'];
  readonly agent: (agentId: string) => readonly ['agents', 'agent', string];
  readonly agentHistory: (
    agentId: string,
  ) => readonly ['agents', 'agent-history', string];
  readonly users: readonly ['agents', 'users'];
  readonly models: readonly ['agents', 'models'];
  readonly defaultModels: readonly ['agents', 'models', 'defaults'];
  readonly services: readonly ['agents', 'services'];
  readonly prices: readonly ['agents', 'prices'];
  readonly providerModels: (
    service: string,
  ) => readonly ['agents', 'provider-models', string];
  readonly vocabulary: readonly ['agents', 'vocabulary'];
  readonly usage: (
    query: UsageQuery,
  ) => readonly ['agents', 'usage', UsageQuery];
  readonly modelUsage: (
    from: string,
    to: string,
  ) => readonly ['agents', 'usage', 'models', string, string];
  readonly runners: readonly ['agents', 'runners'];
  readonly runnerRuns: (
    runnerId: string,
  ) => readonly ['agents', 'runners', 'runs', string];
  readonly variables: (
    scope: string,
    scopeId: string,
  ) => readonly ['agents', 'variables', string, string];
  readonly variableAudits: (
    scope: string,
    scopeId: string,
  ) => readonly ['agents', 'variable-audits', string, string];
  readonly skills: readonly ['agents', 'skills'];
  readonly skill: (skillId: string) => readonly ['agents', 'skill', string];
  readonly skillVersions: (
    skillId: string,
  ) => readonly ['agents', 'skill-versions', string];
  readonly scopeSkills: (
    scope: string,
    scopeId: string,
  ) => readonly ['agents', 'scope-skills', string, string];
  readonly runs: (
    subjectKind: string,
    subjectId: string,
  ) => readonly ['agents', 'runs', string, string];
  readonly run: (runId: string) => readonly ['agents', 'run', string];
  readonly runBrief: (
    runId: string,
  ) => readonly ['agents', 'run-brief', string];
  readonly job: (jobId: string) => readonly ['agents', 'job', string];
  readonly briefPreview: (
    agentId: string,
    scenario: string | null,
  ) => readonly ['agents', 'brief-preview', string, string | null];
} = {
  all: ['agents'],
  agents: ['agents', 'agents'],
  agent: (agentId) => ['agents', 'agent', agentId],
  agentHistory: (agentId) => ['agents', 'agent-history', agentId],
  users: ['agents', 'users'],
  models: ['agents', 'models'],
  defaultModels: ['agents', 'models', 'defaults'],
  services: ['agents', 'services'],
  prices: ['agents', 'prices'],
  providerModels: (service) => ['agents', 'provider-models', service],
  vocabulary: ['agents', 'vocabulary'],
  usage: (query) => ['agents', 'usage', query],
  modelUsage: (from, to) => ['agents', 'usage', 'models', from, to],
  runners: ['agents', 'runners'],
  runnerRuns: (runnerId) => ['agents', 'runners', 'runs', runnerId],
  variables: (scope, scopeId) => ['agents', 'variables', scope, scopeId],
  variableAudits: (scope, scopeId) => [
    'agents',
    'variable-audits',
    scope,
    scopeId,
  ],
  skills: ['agents', 'skills'],
  skill: (skillId) => ['agents', 'skill', skillId],
  skillVersions: (skillId) => ['agents', 'skill-versions', skillId],
  scopeSkills: (scope, scopeId) => ['agents', 'scope-skills', scope, scopeId],
  runs: (subjectKind, subjectId) => ['agents', 'runs', subjectKind, subjectId],
  run: (runId) => ['agents', 'run', runId],
  runBrief: (runId) => ['agents', 'run-brief', runId],
  job: (jobId) => ['agents', 'job', jobId],
  briefPreview: (agentId, scenario) => [
    'agents',
    'brief-preview',
    agentId,
    scenario,
  ],
};
