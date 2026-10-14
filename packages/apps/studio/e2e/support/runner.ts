/**
 * Stands in for a runner, so that browser tests reach states only an agent's run can produce, without starting a real
 * runner or a coding agent: it registers through the runner protocol (`@nocobase/agent-protocol`), reporting Claude Code
 * with a model of its own, so the agent discovered from that report (`agent()`, enabled here as an administrator would)
 * is one no other runner takes. A person's mention wakes that agent on an issue (`wake`); the fake runner claims the run
 * and calls the endpoints behind the `nb-studio` CLI with that run's token, as an agent would.
 */
import type { FailureReason, RunEvent } from '@nocobase/agent-protocol';

import type { Api } from './fixtures.ts';

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
  executor?: { type: string; id: string } | null;
}

interface RunnerAgent {
  readonly id: string;
  readonly name: string;
  readonly tool: string | null;
  readonly model: string | null;
  readonly status: string;
  readonly revision: number;
}

export class FakeRunner {
  private runnerKey: string | null = null;
  private found: { readonly id: string; readonly name: string } | null = null;

  /** `api` is signed in as an administrator, who may register runners and enable agents. */
  constructor(
    private readonly api: Api,
    private readonly name: string,
    private readonly workspaceKey = false,
    private readonly options: {
      readonly trust?: 'team' | 'ownerOnly';
      readonly model?: string;
    } = {},
  ) {}

  /** The model this runner reports: its own, so only it has the agent discovered from it. */
  private get model(): string {
    if (this.options.model) return this.options.model;
    return `e2e-${this.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}`;
  }

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
      { trust: this.options.trust ?? 'team' },
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
        features: [
          'input',
          'checkout',
          'directories',
          'skills',
          'secrets',
          ...(this.workspaceKey ? ['workspaceKey'] : []),
        ],
        tools: [
          { kind: 'claude', authenticated: true, models: [{ id: this.model }] },
        ],
        slots: 20,
      },
    );
    this.runnerKey = registered.runnerKey;
    return this.runnerKey;
  }

  /** The agent discovered from this runner's report, enabled with what it is good at; its id. */
  async agent(): Promise<string> {
    return (await this.discovered()).id;
  }

  /** The agent's id and name, as the catalog names it (`Claude · <model>`). */
  async discovered(): Promise<{ readonly id: string; readonly name: string }> {
    if (this.found) return this.found;
    await this.register();
    const agent = (await this.api.get<RunnerAgent[]>('agents')).find(
      (item) => item.tool === 'claude' && item.model === this.model,
    );
    if (!agent) throw new Error(`No agent was discovered for ${this.model}.`);
    if (agent.status !== 'enabled')
      await this.api.patch(`agents/${agent.id}`, {
        description: `Takes the steps of the browser test ${this.name}.`,
        enabled: true,
        expectedRevision: agent.revision,
      });
    this.found = { id: agent.id, name: agent.name };
    return this.found;
  }

  /** Mentions the agent in a comment on the issue, as a person would, which wakes it there. */
  async wake(
    issue: { readonly id: string },
    author: Api = this.api,
  ): Promise<void> {
    const agent = await this.discovered();
    await author.post(`projects/issues/${issue.id}/comments`, {
      content: `[@${agent.name}](mention://agent/${agent.id}) please take a look`,
    });
  }

  /** Claims the run the issue's agent was woken for and returns its token; the run is then held, as if working. */
  async claim(identifier: string): Promise<string> {
    const claimed = await this.claimRun(identifier);
    return claimed.cli!.credential!.content!.token!;
  }

  /** A single claim poll for assertions that a runner must receive no unauthorized work. */
  async probe(): Promise<readonly string[]> {
    const runnerKey = await this.register();
    const claimed = await this.runner<{ runs?: ClaimedRun[] }>(
      'POST',
      'agents/runners/claim',
      { free: 20 },
      { [HEADERS.runnerKey]: runnerKey },
    );
    return (claimed.runs ?? []).map((run) => run.run.id);
  }

  private async claimRun(identifier: string): Promise<ClaimedRun> {
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
      if (run && token) return run;
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
    // An active issue with no executor lets the mention wake only this runner's agent.
    const issue = await author.post<Issue>('projects/issues', {
      title,
      ownerUserId,
      statusKey: 'in_progress',
      executor: null,
      start: false,
    });
    await this.wake(issue, author);
    const { run } = await this.claimRun(issue.identifier);
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
      fail: (
        reason: FailureReason = 'toolProcess',
        detail = 'The test command failed',
      ) => this.runner('POST', `${route}/fail`, { reason, detail }, headers),
    };
  }

  /** Starts real server-side work without launching a coding tool. */
  async start(identifier: string): Promise<{ runId: string; token: string }> {
    const claimed = await this.claimRun(identifier);
    await this.runner(
      'POST',
      `agents/runners/runs/${claimed.run.id}/start`,
      { workDir: '.', adapter: { kind: 'claude' }, acceptsInput: true },
      { [HEADERS.runnerKey]: await this.register() },
    );
    return {
      runId: claimed.run.id,
      token: claimed.cli!.credential!.content!.token!,
    };
  }

  /** Handles all delivered input and ends the run through the runner protocol. */
  async complete(runId: string, summary: string): Promise<void> {
    const headers = { [HEADERS.runnerKey]: await this.register() };
    const status = await this.runner<{ inputs: { id: string }[] }>(
      'GET',
      `agents/runners/runs/${runId}/status`,
      undefined,
      headers,
    );
    await this.runner(
      'POST',
      `agents/runners/runs/${runId}/complete`,
      { summary, handledInputIds: status.inputs.map((input) => input.id) },
      headers,
    );
  }
}
