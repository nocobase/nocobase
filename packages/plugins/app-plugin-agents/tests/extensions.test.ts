import { MountBundleSchema, RunPayloadSchema } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import type { MountContext } from '../server/tokens.js';
import { claim, createHarness, type Harness } from './harness.js';

const start = {
  workDir: '/work/s',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};

describe('brief sections and mounts', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('adds contributed sections to the context layer, in order, in claims and previews', async () => {
    h = await createHarness();
    const seen: string[] = [];
    h.services.briefs.sections.register({
      key: 'second',
      order: 20,
      // Before the claim's transaction, with the run it is for.
      prepare: (run) => Promise.resolve(`for ${run.actorUserId}`),
      section: (_conn, claim, _assembly, prepared) => {
        seen.push(`${claim.runner ? 'claim' : 'preview'} ${String(prepared)}`);
        return Promise.resolve('## Second\n\nAfter the first.');
      },
    });
    const release = h.services.briefs.sections.register({
      key: 'first',
      order: 10,
      section: () => Promise.resolve('## First'),
    });
    h.services.briefs.sections.register({
      key: 'nothing',
      section: () => Promise.resolve(null),
    });
    expect(() =>
      h.services.briefs.sections.register({
        key: 'first',
        section: () => Promise.resolve(null),
      }),
    ).toThrow(/already registered/u);

    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId, '7', { text: 'Go.' });
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.prompt.system).toContain(
      'Sample 7\n\n## First\n\n## Second\n\nAfter the first.',
    );
    const brief = await h.request('GET', `/agents/runs/${runId}/brief`, {
      user: 'owner',
    });
    expect(brief.body.data.layers.context).toBe(
      'Sample 7\n\n## First\n\n## Second\n\nAfter the first.',
    );

    const preview = await h.services.briefs.preview(agentId, 'sample', {
      id: 'owner',
      name: 'Owner',
    });
    expect(preview.platform).toContain('## First');
    expect(seen).toEqual(['claim for owner', 'preview for owner']);

    release();
    const later = await h.services.briefs.preview(agentId, 'sample', {
      id: 'owner',
      name: 'Owner',
    });
    expect(later.platform).not.toContain('## First');
  });

  it('mounts only for runners with the feature, never requires it, and serves the bundle to the holder', async () => {
    h = await createHarness();
    const offers: MountContext[] = [];
    let version = 1;
    const prepared: unknown[] = [];
    h.services.mounts.register({
      name: 'notes',
      prepare: (run) => Promise.resolve(run.subject.id),
      forRun: (_conn, context, ready) => {
        offers.push(context);
        prepared.push(ready);
        return Promise.resolve({
          hash: `h${version}`,
          target: '.nocobase-runner/notes',
          note: 'Team notes.',
          resumeNote: `Notes changed to version ${version}.`,
        });
      },
      bundle: (_conn, { runId }) =>
        Promise.resolve({
          name: 'notes',
          hash: `h${version}`,
          files: [{ path: 'INDEX.md', content: `# Notes for ${runId}` }],
        }),
    });
    expect(() =>
      h.services.mounts.register({
        name: 'Bad Name',
        forRun: () => Promise.resolve(null),
        bundle: () => Promise.resolve(null),
      }),
    ).toThrow(/Not a mount name/u);

    const agentId = await h.createAgent();
    // An older runner: the run goes ahead without the mount.
    const old = await h.registerRunner({ name: 'old' });
    const first = await h.enqueue(agentId, '1', { text: 'One.' });
    const [plain] = await claim(h, old);
    expect(plain.run.id).toBe(first);
    expect(plain).not.toHaveProperty('mounts');
    expect(plain.run.requires).not.toContain('mounts');
    expect(offers).toHaveLength(0);

    const modern = await h.registerRunner({
      name: 'modern',
      features: ['input', 'checkout', 'directories', 'skills', 'mounts'],
    });
    const second = await h.enqueue(agentId, '2', { text: 'Two.' });
    const [mounted] = await claim(h, modern);
    expect(RunPayloadSchema.parse(mounted)).toEqual(mounted);
    expect(mounted.mounts).toEqual([
      {
        name: 'notes',
        hash: 'h1',
        bundleUrl: `/api/agents/runners/runs/${second}/mounts/notes`,
        target: '.nocobase-runner/notes',
        note: 'Team notes.',
      },
    ]);
    expect(mounted.run.requires).not.toContain('mounts');
    expect(offers[0]).toMatchObject({
      session: 'fresh',
      sessionKey: `${agentId}\nsample\n2\nmain`,
    });
    expect(prepared).toEqual(['2']);
    // A fresh session is not told what changed.
    expect(mounted.prompt.turn).toBe('Two.');

    const bundle = await h.request(
      'GET',
      `/agents/runners/runs/${second}/mounts/notes`,
      { runnerKey: modern.key },
    );
    expect(bundle.status).toBe(200);
    expect(MountBundleSchema.parse(bundle.body.data).files[0]?.content).toBe(
      `# Notes for ${second}`,
    );
    expect(
      (
        await h.request('GET', `/agents/runners/runs/${second}/mounts/other`, {
          runnerKey: modern.key,
        })
      ).status,
    ).toBe(404);
    // Another runner does not hold the run.
    expect(
      (
        await h.request('GET', `/agents/runners/runs/${second}/mounts/notes`, {
          runnerKey: old.key,
        })
      ).status,
    ).not.toBe(200);

    // The session ends with an id; the next run resumes it, and hears what changed instead of a new fingerprint.
    await h.request('POST', `/agents/runners/runs/${second}/start`, {
      runnerKey: modern.key,
      body: start,
    });
    const handled = (await h.services.runs.detail(second)).inputs.map(
      (input) => input.id,
    );
    const completed = await h.request(
      'POST',
      `/agents/runners/runs/${second}/complete`,
      {
        runnerKey: modern.key,
        body: {
          summary: 'Done.',
          handledInputIds: handled,
          sessionId: 'session-2',
        },
      },
    );
    expect(completed.status).toBe(200);
    version = 2;
    await h.enqueue(agentId, '2', { text: 'Again.' });
    const [resumed] = await claim(h, modern);
    expect(resumed.prompt).toMatchObject({
      session: 'resume',
      resumeSessionId: 'session-2',
    });
    expect(resumed.mounts[0].hash).toBe('h2');
    expect(resumed.prompt.turn).toBe('Again.\n\nNotes changed to version 2.');
    expect(offers.at(-1)?.session).toBe('resume');
  });
});
