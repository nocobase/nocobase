import type { AgentView } from '../../shared/agents.js';
import type { RunnerSummary } from '../../shared/runners.js';
import type { RunDetail } from '../../shared/runs.js';
import type { Skill, SkillView } from '../../shared/skills.js';

const AT = '2026-10-01T08:00:00.000Z';

export function runner(
  id: string,
  overrides: Partial<RunnerSummary> = {},
): RunnerSummary {
  return {
    id,
    name: `runner-${id}`,
    hostname: `${id}.local`,
    os: 'darwin',
    arch: 'arm64',
    version: '0.1.0',
    product: 'nocobase-runner',
    protocolVersion: 3,
    features: ['input'],
    tools: [{ kind: 'claude', version: '2.1.0', authenticated: true }],
    enabledTools: null,
    trust: 'ownerOnly',
    ownerUserId: 'u1',
    ownerName: 'Alice',
    status: 'online',
    slots: 1,
    reportedSlots: overrides.slots ?? 1,
    capacitySource: 'online',
    toolSlots: null,
    toolLoad: overrides.toolSlots
      ? Object.fromEntries(
          Object.entries(overrides.toolSlots).map(([tool, slots]) => [
            tool,
            { slots: Math.min(slots!, overrides.slots ?? 1), free: 0 },
          ]),
        )
      : null,
    acceptJobs: false,
    policy: null,
    lastSeenAt: AT,
    createdAt: AT,
    updatedAt: AT,
    quotaRevision: 0,
    canClearQuota: false,
    recentRunsCount: 0,
    takes: [],
    activeRuns: 0,
    activeJobs: 0,
    activeByTool: {},
    canManage: false,
    canChangeTrust: false,
    canRevoke: false,
    updateVersion: null,
    requiredProtocol: { min: 3, max: 4 },
    offersJobs: false,
    ...overrides,
  };
}

export function agent(
  id: string,
  overrides: Partial<AgentView> = {},
): AgentView {
  return {
    id,
    name: `Agent ${id}`,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    source: 'runner',
    status: 'enabled',
    tool: 'claude',
    model: 'claude-sonnet-5',
    modelEntries: [{ tool: 'claude', model: 'claude-sonnet-5', effort: null }],
    instructions: null,
    actions: [],
    confirmChanges: 'larger',
    maxConcurrentRuns: 100,
    maxAttempts: 3,
    toolPolicy: null,
    lastReportedAt: AT,
    revision: 1,
    createdAt: AT,
    updatedAt: AT,
    effort: null,
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
    reported: true,
    runners: { team: 1, personal: 0, mine: 0, names: ['dev-2'] },
    personalOnly: false,
    unusable: null,
    busy: 0,
    suggestion: null,
    canEdit: true,
    ...overrides,
  };
}

export function skill(id: string, overrides: Partial<Skill> = {}): Skill {
  return {
    id,
    slug: `skill-${id}`,
    name: `skill-${id}`,
    description: 'When to use it',
    compatibility: null,
    version: 1,
    fileCount: 0,
    size: 0,
    scriptCount: 0,
    scripts: [],
    createdById: 'u1',
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

export function skillDetail(
  id: string,
  overrides: Partial<SkillView> = {},
): SkillView {
  return {
    ...skill(id),
    content: `---\nname: skill-${id}\ndescription: When to use it\n---\n\n# Heading\n\nDo it this way.`,
    files: [],
    attachments: [],
    canEdit: true,
    ...overrides,
  };
}

export function run(id: string, overrides: Partial<RunDetail> = {}): RunDetail {
  return {
    id,
    agentId: 'a1',
    agentType: 'runner',
    runnerId: 'r1',
    tool: 'claude',
    modelService: null,
    model: null,
    status: 'running',
    priority: 0,
    attempt: 1,
    maxAttempts: 3,
    retryOfRunId: null,
    subject: { kind: 'issue', id: 'i1' },
    threadScope: 'main',
    actorUserId: 'u1',
    ownerUserId: 'u1',
    requires: [],
    acceptsInput: true,
    availableAt: null,
    leaseExpiresAt: null,
    dispatchedAt: AT,
    startedAt: AT,
    finishedAt: null,
    lastActivityAt: AT,
    cancelRequestedAt: null,
    failureReason: null,
    failureDetail: null,
    summary: null,
    createdAt: AT,
    updatedAt: AT,
    inputs: [],
    repos: [],
    usage: [],
    ...overrides,
  };
}
