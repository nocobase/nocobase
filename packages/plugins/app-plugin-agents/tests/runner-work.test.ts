/**
 * Agent runs on runners, end to end: a run and a job share a runner's slots, a job opens the stored variables it names
 * through this plugin's variables, a run gets the CLI this plugin serves, and a runner's owner's local policy keeps it off agents, subjects and repositories.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const root = mkdtempSync(path.join(os.tmpdir(), 'agents-work-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const sha = (bytes: Buffer | string) =>
  createHash('sha256').update(bytes).digest('hex');

/** A distribution directory holding one `acme` CLI tarball. */
function writeCli(dir: string): void {
  const name = 'acme-v0.3.0-darwin-arm64.tar.gz';
  const content = 'acme 0.3.0 darwin-arm64';
  mkdirSync(path.join(dir, 'stable', 'acme', '0.3.0'), { recursive: true });
  writeFileSync(path.join(dir, 'stable', 'acme', '0.3.0', name), content);
  writeFileSync(
    path.join(dir, 'stable', 'acme', 'manifest.json'),
    JSON.stringify({
      schema: 1,
      product: 'acme',
      bin: 'acme',
      versions: {
        '0.3.0': {
          targets: {
            'darwin-arm64': {
              file: `0.3.0/${name}`,
              sha256: sha(content),
              size: content.length,
            },
          },
        },
      },
    }),
  );
}

const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const buildSpec = {
  repo: { url: 'https://example.com/acme/app.git', ref: 'main', sha: SHA },
  command: { argv: ['pnpm', 'build'] },
  outputs: [],
  timeoutSec: 600,
};

describe('agent runs on the runners', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const jobRunner = async (slots = 2): Promise<RegisteredRunner> => {
    const runner = await h.registerRunner({
      features: ['input', 'checkout', 'secrets', 'jobs.build'],
      slots,
    });
    await h.runners.runners.update(runner.runnerId, { acceptJobs: true });
    return runner;
  };

  it('shares a runner slot between a run and a job, the job first', async () => {
    h = await createHarness();
    h.runners.jobs.register('build', {});
    const agentId = await h.createAgent();
    await h.enqueue(agentId, '1');
    await h.runners.jobs.enqueue({
      kind: 'build',
      spec: buildSpec,
      actorUserId: 'owner',
    });
    const runner = await jobRunner(1);
    const response = await h.request('POST', '/agents/runners/claim', {
      runnerKey: runner.key,
      body: { free: 1 },
    });
    expect(response.body.data).toMatchObject({
      runs: [],
      jobs: [{ job: { kind: 'build' } }],
    });
    expect(await claim(h, runner, 1)).toEqual([]);
    const listed = await h.request(
      'GET',
      `/agents/runners/${runner.runnerId}`,
      { user: 'owner' },
    );
    expect(listed.body.data).toMatchObject({ activeRuns: 0, activeJobs: 1 });
  });

  it("opens the agents plugin's stored variables for the job that names them, and audits the delivery", async () => {
    h = await createHarness();
    h.runners.jobs.register('build', {});
    await h.services.variables.set(
      { scope: 'workdir', scopeId: 'repo1' },
      'NPM_TOKEN',
      'npm_secret',
      'owner',
    );
    const job = await h.runners.jobs.enqueue({
      kind: 'build',
      spec: {
        ...buildSpec,
        env: [
          {
            name: 'NPM_TOKEN',
            secret: { scope: 'workdir', scopeId: 'repo1', name: 'NPM_TOKEN' },
          },
        ],
      },
      actorUserId: 'owner',
    });
    const runner = await jobRunner();
    const response = await h.request('POST', '/agents/runners/claim', {
      runnerKey: runner.key,
      body: { free: 1 },
    });
    expect(response.body.data.jobs[0].job.spec.env).toEqual([
      { name: 'NPM_TOKEN', value: 'npm_secret', secret: true },
    ]);
    const audits = await h.services.variables.audits({
      scope: 'workdir',
      scopeId: 'repo1',
    });
    expect(audits[0]).toMatchObject({
      action: 'deliver',
      jobId: job.id,
      runId: null,
      runnerId: runner.runnerId,
      names: ['NPM_TOKEN'],
    });
  });

  it("keeps a runner to the agents, subjects and repositories its owner's policy allows", async () => {
    h = await createHarness();
    const coder = await h.createAgent({ name: 'Coder' });
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    const runner = await h.registerRunner({
      policy: { agents: ['Coder'], subjects: ['SMP-1', 'SMP-3'] },
    });
    const reviewRun = await h.enqueue(reviewer, '1');
    const otherSubject = await h.enqueue(coder, '2');
    expect(await claim(h, runner, 2)).toEqual([]);
    const allowed = await h.enqueue(coder, '1');
    const [taken] = await claim(h, runner, 2);
    expect(taken.run.id).toBe(allowed);
    expect(taken.agent).toEqual({ id: coder, name: 'Coder' });
    for (const runId of [reviewRun, otherSubject])
      expect((await h.services.runs.get(runId)).status).toBe('queued');
    // A repository outside the policy keeps the run off this runner too.
    h.dirs = [
      {
        kind: 'repo',
        url: 'https://github.com/other/app.git',
        defaultBranch: 'main',
        branch: 'agent/x',
        path: 'app',
      } as Harness['dirs'][number],
    ];
    const limited = await h.registerRunner({
      name: 'limited',
      policy: { repos: ['github.com/acme/*'] },
    });
    await h.enqueue(coder, '3');
    expect(await claim(h, limited, 1)).toEqual([]);
    // The agents list counts only the runners whose policy lets them run the agent.
    const availability = await h.services.availability(h.runners.tx.read(), [
      await h.services.agents.get(reviewer),
    ]);
    expect(availability.get(reviewer)?.online).toBe(true);
  });
});

describe('the served CLI', () => {
  let harness: Harness;
  afterEach(async () => {
    await harness?.close();
  });

  it('hands a run the served CLI for the runner’s platform, or the npm package to a runner that cannot take it', async () => {
    const dir = path.join(root, 'cli');
    writeCli(dir);
    harness = await createHarness({ dist: { dir } });
    const agentId = await harness.createAgent();
    const archives = await harness.registerRunner({
      features: ['input', 'archives'],
    });
    await harness.enqueue(agentId, '1');
    const claimed = await harness.request('POST', '/agents/runners/claim', {
      runnerKey: archives.key,
      body: { free: 1 },
    });
    expect(claimed.body.data.runs[0].cli.package).toEqual({
      kind: 'archive',
      version: '0.3.0',
      url: '/api/agents/dist/products/acme/versions/0.3.0/files/acme-v0.3.0-darwin-arm64.tar.gz',
      sha256: sha('acme 0.3.0 darwin-arm64'),
    });

    const older = await harness.registerRunner({ features: ['input'] });
    await harness.enqueue(agentId, '2');
    const fallback = await harness.request('POST', '/agents/runners/claim', {
      runnerKey: older.key,
      body: { free: 1 },
    });
    expect(fallback.body.data.runs[0].cli.package).toEqual({
      kind: 'preinstalled',
    });
  });
});
