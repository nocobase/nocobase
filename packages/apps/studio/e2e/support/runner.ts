/**
 * Stands in for a runner, so that browser tests reach states only an agent's run can produce, without starting a real
 * runner or a coding agent: it registers through the runner protocol (`@nocobase/agent-protocol`), claims the run an
 * issue's agent was woken for, and calls the endpoints behind the `nb-studio` CLI with that run's token, as an agent would.
 */
import type { WorkflowDefinition } from '@nocobase/app-plugin-projects/shared/workflows';
import { Api } from './fixtures.ts';

/** `PROTOCOL_VERSION` and `HEADERS` of `@nocobase/agent-protocol` (`packages/libs/agent-protocol/src/version.ts`). */
const PROTOCOL_VERSION = 5;
const HEADERS = {
  protocol: 'x-nocobase-protocol',
  runnerKey: 'x-nocobase-runner-key',
  runToken: 'x-nocobase-run-token',
} as const;

interface ClaimedRun {
  run: { id: string };
  subject?: { key?: string };
  cli?: { credential?: { content?: { token?: string } } };
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  statusKey: string;
  revision: number;
  /** The status change waiting for approval, if any. */
  pendingApproval?: { id: string } | null;
}

export const DESIGN_PROPOSAL = [
  '## 需求理解',
  '导出大表时浏览器卡顿。',
  '',
  '## 方案',
  '改为流式导出，并显示进度。',
  '',
  '## 影响范围',
  '导出接口与导出按钮。',
  '',
  '## 风险与待定',
  '旧浏览器不支持流式下载。',
  '',
  '## 验证计划',
  '10 万行导出不超过 10 秒。',
].join('\n');

interface Workflow {
  readonly id: string;
  readonly isDefault: boolean;
  readonly revision: number;
  readonly definition: WorkflowDefinition;
}

export class FakeRunner {
  private runnerKey: string | null = null;
  private agentId: string | null = null;
  private runnerId: string | null = null;

  /** `api` is signed in as an administrator, who may register runners and create agents. */
  constructor(
    private readonly api: Api,
    private readonly name: string,
  ) {}

  private runner<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const all = { [HEADERS.protocol]: String(PROTOCOL_VERSION), ...headers };
    return method === 'GET'
      ? this.api.get<T>(path, all)
      : this.api.post<T>(path, body, all);
  }

  private async register(): Promise<string> {
    if (this.runnerKey) return this.runnerKey;
    const token = await this.api.post<{ token: string }>(
      'agents/runners/registrationTokens',
      { trust: 'team' },
    );
    const registered = await this.runner<{
      runnerKey: string;
      runnerId: string;
    }>('POST', 'agents/runners/register', {
      registrationToken: token.token,
      name: this.name,
      hostname: 'studio-e2e',
      os: 'linux',
      arch: 'x64',
      version: '0.0.0',
      protocolVersion: PROTOCOL_VERSION,
      features: ['input', 'checkout', 'directories', 'skills', 'secrets'],
      tools: [{ kind: 'claude', authenticated: true }],
      slots: 20,
    });
    this.runnerKey = registered.runnerKey;
    this.runnerId = registered.runnerId;
    return this.runnerKey;
  }

  /** An agent of this runner's own, so other tests' queued runs never hold up its work. */
  async agent(): Promise<string> {
    if (this.agentId) return this.agentId;
    await this.register();
    const agent = await this.api.post<{ id: string }>('agents', {
      name: `方案设计助手 ${this.name}`,
      modelEntries: [{ tool: 'claude' }],
      access: 'everyone',
      runnerIds: [this.runnerId!],
      maxConcurrentRuns: 20,
      description: '先分析，再提交设计方案。',
      actions: [
        'pm.projects/view',
        'pm.issues/view',
        'pm.issues/edit',
        'pm.issues/comment',
      ],
    });
    this.agentId = agent.id;
    return agent.id;
  }

  /** Claims the run the issue's agent was woken for and returns its token; the run is then held, as if working. */
  async claim(identifier: string): Promise<string> {
    const runnerKey = await this.register();
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const claimed = await this.runner<{ runs?: ClaimedRun[] }>(
        'POST',
        'agents/runners/claim',
        { free: 20 },
        { [HEADERS.runnerKey]: runnerKey },
      );
      const run = (claimed.runs ?? []).find(
        (item) => item.subject?.key === identifier,
      );
      const token = run?.cli?.credential?.content?.token;
      if (token) return token;
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
    throw new Error(`No run was queued for ${identifier}.`);
  }

  /** A private copy of the workflow routes Analysis to this test's runner-bound agent. */
  private async designProject(): Promise<string> {
    const base = (await this.api.get<Workflow[]>('projects/workflows')).find(
      (workflow) => workflow.isDefault,
    );
    if (!base) throw new Error('The default workflow is missing.');
    const agentId = await this.agent();
    const workflow = await this.api.post<Workflow>('projects/workflows', {
      name: `Design workflow ${this.name}`,
      copyFrom: base.id,
    });
    await this.api.patch(`projects/workflows/${workflow.id}`, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) => ({
          ...state,
          rules: state.rules?.map((rule) =>
            state.key === 'analysis' && rule.type === 'runAgent'
              ? { ...rule, config: { ...rule.config, agentId } }
              : rule,
          ),
        })),
      },
    });
    const project = await this.api.post<{ id: string }>('projects', {
      name: `Design project ${this.name}`,
      visibility: 'everyone',
      workflowId: workflow.id,
    });
    return project.id;
  }

  /** Creates an isolated Analysis issue and submits its design proposal through the claimed run. */
  async issueWithDesignProposal(
    title: string,
    options: { ownerUserId: string },
  ): Promise<Issue> {
    const projectId = await this.designProject();
    const issue = await this.api.post<Issue>('projects/issues', {
      title,
      statusKey: 'analysis',
      ownerUserId: options.ownerUserId,
      projectId,
      executor: { type: 'agent', id: await this.agent() },
    });
    const token = await this.claim(issue.identifier);
    // `nb-studio issue design-proposal`'s endpoint; the issue defaults to the run's.
    await this.api.post(
      'designProposals',
      { content: DESIGN_PROPOSAL },
      { [HEADERS.runToken]: token },
    );
    const after = await this.api.get<Issue>(`projects/issues/${issue.id}`);
    if (after.statusKey !== 'proposal_review')
      throw new Error(
        `${issue.identifier} is in ${after.statusKey}, not proposal_review.`,
      );
    return after;
  }
}
