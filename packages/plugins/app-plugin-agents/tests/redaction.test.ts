/**
 * The server redacts what runners report before it stores it: the secrets a claim handed out (the run's variables and
 * token, a job's opened variables and repository token) and the common secret patterns, whatever the runner did.
 */
import { REDACTED, type RunnerFeature } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const GITHUB = `ghp_${'Ab1'.repeat(12)}`;
const SECRET = 'variable-secret-value-42';
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('redaction', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const post = (runner: RegisteredRunner, path: string, body: unknown = {}) =>
    h.request('POST', `/agents/runners/${path}`, {
      runnerKey: runner.key,
      body,
    });

  async function claimedRun(): Promise<{
    runner: RegisteredRunner;
    runId: string;
    token: string;
    inputIds: string[];
  }> {
    const agentId = await h.createAgent();
    await h.services.variables.set(
      { scope: 'agent', scopeId: agentId },
      'SERVICE_KEY',
      SECRET,
      'owner',
    );
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.workspace.env).toEqual([
      { name: 'SERVICE_KEY', value: SECRET },
    ]);
    await post(runner, `runs/${payload.run.id}/start`, {
      workDir: '/work/SMP-1',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    return {
      runner,
      runId: payload.run.id,
      token: payload.cli.credential.content.token,
      inputIds: payload.inputs.map((input: { id: string }) => input.id),
    };
  }

  it("redacts a run's events and summary of its secrets and the common patterns", async () => {
    h = await createHarness();
    const { runner, runId, token, inputIds } = await claimedRun();
    const events = [
      {
        seq: 1,
        at: '2026-10-01T00:00:01.000Z',
        type: 'text',
        content: `The key is ${SECRET}, commit ${SHA}, run ${UUID}.`,
      },
      {
        seq: 2,
        at: '2026-10-01T00:00:02.000Z',
        type: 'toolUse',
        tool: 'Bash',
        input: {
          command: `curl -H "Authorization: Bearer ${token}" -d '${SECRET}'`,
          args: [GITHUB, 3, null],
        },
        meta: { env: { SERVICE_KEY: SECRET } },
      },
      {
        seq: 3,
        at: '2026-10-01T00:00:03.000Z',
        type: 'toolResult',
        output: `run.json: {"token":"${token}"}\n${'x'.repeat(70_000)}`,
      },
    ];
    expect(
      (await post(runner, `runs/${runId}/events`, { events })).status,
    ).toBe(200);
    const page = await h.services.runs.events(runId, 0, 100);
    const stored = JSON.stringify(page.events);
    expect(stored).not.toContain(SECRET);
    expect(stored).not.toContain(token);
    expect(stored).not.toContain(GITHUB);
    expect(page.events[0]?.content).toBe(
      `The key is ${REDACTED}, commit ${SHA}, run ${UUID}.`,
    );
    expect(page.events[1]).toMatchObject({
      input: {
        command: `curl -H "Authorization: Bearer ${REDACTED}" -d '${REDACTED}'`,
        args: [REDACTED, 3, null],
      },
      meta: { env: { SERVICE_KEY: REDACTED } },
    });
    expect(page.events[2]).toMatchObject({ truncated: true });
    expect(page.events[2]?.output).toContain(`{"token":"${REDACTED}"}`);

    const done = await post(runner, `runs/${runId}/complete`, {
      summary: `Rotated ${SECRET} and pushed with ${GITHUB}.`,
      handledInputIds: inputIds,
      usage: [],
    });
    expect(done.status).toBe(200);
    expect((await h.services.runs.detail(runId)).summary).toBe(
      `Rotated ${REDACTED} and pushed with ${REDACTED}.`,
    );
  });

  it("redacts a failed run's detail", async () => {
    h = await createHarness();
    const { runner, runId, inputIds } = await claimedRun();
    const failed = await post(runner, `runs/${runId}/fail`, {
      reason: 'toolAuth',
      detail: `401 for ${SECRET} at https://bot:hunter2pass@example.com/x`,
      handledInputIds: inputIds,
    });
    expect(failed.status).toBe(200);
    expect((await h.services.runs.detail(runId)).failureDetail).toBe(
      `401 for ${REDACTED} at https://${REDACTED}@example.com/x`,
    );
  });

  it("redacts a job's log and failure detail of the secrets it was handed", async () => {
    h = await createHarness();
    h.services.jobs.register('build', {});
    await h.services.variables.set(
      { scope: 'workdir', scopeId: 'repo1' },
      'REPO_TOKEN',
      'repository-token-value',
      'owner',
    );
    const job = await h.services.jobs.enqueue({
      kind: 'build',
      spec: {
        repo: {
          url: 'https://example.com/acme/app.git',
          ref: 'main',
          credentials: {
            scope: 'workdir',
            scopeId: 'repo1',
            name: 'REPO_TOKEN',
          },
        },
        command: { argv: ['pnpm', 'build'] },
        env: [],
        outputs: [],
        timeoutSec: 600,
      },
      actorUserId: 'owner',
    });
    const features: RunnerFeature[] = ['checkout', 'secrets', 'jobs.build'];
    const runner = await h.registerRunner({ features });
    await h.services.runners.update(runner.runnerId, {
      acceptJobs: true,
    });
    const claimed = await post(runner, 'claim', { free: 1 });
    expect(claimed.body.data.jobs).toHaveLength(1);
    await post(runner, `jobs/${job.id}/start`, { workDir: '/jobs/1' });
    await post(runner, `jobs/${job.id}/events`, {
      events: [
        {
          seq: 1,
          at: '2026-10-01T00:00:01.000Z',
          type: 'log',
          stream: 'stdout',
          content: `fetch with repository-token-value and ${GITHUB}`,
        },
      ],
    });
    const failed = await post(runner, `jobs/${job.id}/fail`, {
      reason: 'commandFailed',
      detail: 'exit 1: repository-token-value rejected',
      exitCode: 1,
    });
    expect(failed.status).toBe(200);
    const log = await h.services.jobs.events(job.id);
    expect(log[0]?.content).toBe(`fetch with ${REDACTED} and ${REDACTED}`);
    const ended = await h.services.jobs.get(job.id);
    expect(ended.failureDetail).toBe(`exit 1: ${REDACTED} rejected`);
  });
});
