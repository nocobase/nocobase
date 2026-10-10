/**
 * Stands in for a runner, so that browser tests reach states only an agent's run can produce, without starting a real
 * runner or a coding agent: it registers through the runner protocol (`@nocobase/agent-protocol`), claims the run an
 * issue's agent was woken for, and calls the endpoints behind the `nb-studio` CLI with that run's token, as an agent would.
 */
import type { RunEvent } from '@nocobase/agent-protocol';

import { Api } from './fixtures.ts';

/** `PROTOCOL_VERSION` and `HEADERS` of `@nocobase/agent-protocol` (`packages/libs/agent-protocol/src/version.ts`). */
const PROTOCOL_VERSION = 5;
const HEADERS = {
  protocol: 'x-nocobase-protocol',
  runnerKey: 'x-nocobase-runner-key',
  runToken: 'x-nocobase-run-token',
} as const;

interface ClaimedRun {
  run: { id: string; firstSeq: number };
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

/** The built-in agent the Software development workflow runs in Analysis, whatever the issue's executor. */
const SOLUTION_DESIGNER = 'studio-solution-designer';

/** Runs of the solution designer these tests may hold at once: every claimed run stays held, as if working. */
const DESIGN_RUNS = 100;

export class FakeRunner {
  private runnerKey: string | null = null;
  private agentId: string | null = null;
  private readonly claimedRuns = new Map<string, ClaimedRun>();

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
    const registered = await this.runner<{ runnerKey: string }>(
      'POST',
      'agents/runners/register',
      {
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
      },
    );
    this.runnerKey = registered.runnerKey;
    return this.runnerKey;
  }

  /** An agent of this runner's own, so other tests' queued runs never hold up its work. */
  async agent(): Promise<string> {
    if (this.agentId) return this.agentId;
    const agent = await this.api.post<{ id: string }>('agents', {
      name: `方案设计助手 ${this.name}`,
      modelEntries: [{ tool: 'claude' }],
      access: 'everyone',
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
      if (token && run) {
        this.claimedRuns.set(identifier, run);
        return token;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
    throw new Error(`No run was queued for ${identifier}.`);
  }

  /** A real running transcript, written through the same protocol as a connected runtime. */
  async issueWithTranscript(
    title: string,
    ownerUserId: string,
    author = this.api,
  ) {
    const issue = await author.post<Issue>('projects/issues', {
      title,
      statusKey: 'in_progress',
      ownerUserId,
      executor: { type: 'agent', id: await this.agent() },
    });
    await this.claim(issue.identifier);
    const run = this.claimedRuns.get(issue.identifier)!.run;
    const headers = { [HEADERS.runnerKey]: this.runnerKey! };
    const route = `agents/runners/runs/${run.id}`;
    await this.runner(
      'POST',
      `${route}/start`,
      {
        workDir: '/tmp/studio-transcript-test',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      },
      headers,
    );
    return {
      issue,
      runId: run.id,
      firstSeq: run.firstSeq,
      append: (events: readonly RunEvent[]) =>
        this.runner('POST', `${route}/events`, { events }, headers),
      fail: () =>
        this.runner(
          'POST',
          `${route}/fail`,
          { reason: 'toolProcess', detail: 'The test command failed' },
          headers,
        ),
    };
  }

  /**
   * Lets the solution designer hold as many runs as the tests leave claimed. Its own limit is a handful, and a fake run
   * never ends, so later tests would wait for a slot. Several workers may raise it at once: a refused stale edit means
   * another one did.
   */
  private async designerCapacity(): Promise<void> {
    const designer = await this.api.get<{
      revision: number;
      maxConcurrentRuns: number;
    }>(`agents/${SOLUTION_DESIGNER}`);
    if (designer.maxConcurrentRuns >= DESIGN_RUNS) return;
    await this.api
      .patch(`agents/${SOLUTION_DESIGNER}`, {
        maxConcurrentRuns: DESIGN_RUNS,
        expectedRevision: designer.revision,
      })
      .catch(async (error: unknown) => {
        const now = await this.api.get<{ maxConcurrentRuns: number }>(
          `agents/${SOLUTION_DESIGNER}`,
        );
        if (now.maxConcurrentRuns < DESIGN_RUNS) throw error;
      });
  }

  /**
   * Creates an issue in Analysis for this runner's agent, then submits a design proposal as the solution designer, whose
   * run Analysis started, which moves the issue to Proposal review and sends its owner the decision card.
   */
  async issueWithDesignProposal(
    title: string,
    options: { ownerUserId: string; projectId?: string },
  ): Promise<Issue> {
    await this.designerCapacity();
    const issue = await this.api.post<Issue>('projects/issues', {
      title,
      statusKey: 'analysis',
      ownerUserId: options.ownerUserId,
      ...(options.projectId ? { projectId: options.projectId } : {}),
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
