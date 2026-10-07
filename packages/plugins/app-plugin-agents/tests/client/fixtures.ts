import type { AgentSummary } from '../../shared/agents.js';
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
    acceptJobs: false,
    policy: null,
    lastSeenAt: AT,
    createdAt: AT,
    updatedAt: AT,
    activeRuns: 0,
    activeJobs: 0,
    canManage: false,
    canChangeTrust: false,
    updateVersion: null,
    requiredProtocol: { min: 3, max: 4 },
    offersJobs: false,
    ...overrides,
  };
}

export function agent(
  id: string,
  overrides: Partial<AgentSummary> = {},
): AgentSummary {
  return {
    id,
    name: `Agent ${id}`,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    type: 'runner',
    modelEntries: [{ tool: 'claude', model: null }],
    instructions: null,
    actions: [],
    confirmChanges: 'larger',
    access: 'everyone',
    userIds: [],
    ownerUserId: 'u1',
    runnerIds: [],
    skillIds: [],
    maxConcurrentRuns: 2,
    maxAttempts: 3,
    toolPolicy: null,
    archivedAt: null,
    revision: 1,
    createdAt: AT,
    updatedAt: AT,
    ownerName: 'Alice',
    activeRuns: 0,
    onlineRunners: 1,
    canEdit: true,
    canCopy: true,
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
    agentCount: 0,
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
