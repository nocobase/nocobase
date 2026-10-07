import { describe, expect, it } from 'vitest';

import {
  BuildJobSpecSchema,
  ClaimResponseSchema,
  HeartbeatRequestSchema,
  HeartbeatResponseSchema,
  isRetryableJobFailure,
  JOB_KINDS,
  JOB_SPEC_SCHEMAS,
  JobCompleteRequestSchema,
  JobEventsRequestSchema,
  JobFailRequestSchema,
  jobFeature,
  JobPayloadSchema,
  RegisterRequestSchema,
  routePath,
  RUNNER_FEATURES,
  RUNNER_ROUTES,
  type BuildJobSpec,
  type JobPayload,
} from '../src/index.js';

const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

const build: BuildJobSpec = {
  repo: { url: 'https://example.com/a/b.git', ref: 'main', sha: SHA },
  workdir: 'acme',
  command: { argv: ['pnpm', 'build', '--target', 'linux-x64'] },
  env: [
    { name: 'NODE_ENV', value: 'production' },
    { name: 'NPM_TOKEN', value: 'npm_x', secret: true },
  ],
  outputs: [
    {
      path: 'storage/exports/dist.tar.gz',
      upload: {
        url: '/api/releases/apps/fg-12/releases',
        method: 'POST',
        headers: { authorization: 'Bearer rel_ticket_x' },
        contentType: 'application/gzip',
      },
      maxBytes: 256 * 1024 * 1024,
    },
  ],
  timeoutSec: 1800,
};

const payload: JobPayload = {
  job: {
    id: 'j1',
    kind: 'build',
    spec: build,
    attempt: 1,
    maxAttempts: 2,
    createdAt: '2026-10-02T00:00:00.000Z',
    leaseExpiresAt: '2026-10-02T00:00:45.000Z',
    firstSeq: 1,
    requires: ['jobs.build'],
  },
  app: { id: 'acme', name: 'Acme' },
  title: 'Build FG-12',
};

describe('jobs', () => {
  it('announces each kind as a feature', () => {
    for (const kind of JOB_KINDS) {
      expect(RUNNER_FEATURES).toContain(jobFeature(kind));
      expect(JOB_SPEC_SCHEMAS[kind]).toBeDefined();
    }
    expect(jobFeature('build')).toBe('jobs.build');
    const register = {
      registrationToken: 't',
      name: 'n',
      hostname: 'h',
      os: 'linux',
      arch: 'x64',
      version: '1',
      protocolVersion: 4,
      features: ['checkout', 'jobs.build'],
      tools: [],
    };
    expect(RegisterRequestSchema.safeParse(register).success).toBe(true);
  });

  it('round-trips a job payload in a claim beside runs', () => {
    const parsed = ClaimResponseSchema.parse({ runs: [], jobs: [payload] });
    expect(parsed).toEqual({ runs: [], jobs: [payload] });
    expect(JobPayloadSchema.parse(payload)).toEqual(payload);
    // A claim of protocol 3 has no jobs, and stays readable.
    expect(ClaimResponseSchema.parse({ runs: [] })).toEqual({ runs: [] });
  });

  it('knows only the build kind', () => {
    expect(JOB_KINDS).toEqual(['build']);
    // A kind that is not one is refused, whatever its spec.
    expect(
      JobPayloadSchema.safeParse({
        ...payload,
        job: { ...payload.job, kind: 'git.check' },
      }).success,
    ).toBe(false);
  });

  it('keeps a build inside its checkout and bounded', () => {
    for (const path of ['/etc', '../x', 'a/../../x', 'C:/x', '']) {
      expect(
        BuildJobSpecSchema.safeParse({ ...build, workdir: path }).success,
      ).toBe(false);
      expect(
        BuildJobSpecSchema.safeParse({
          ...build,
          outputs: [{ ...build.outputs[0], path }],
        }).success,
      ).toBe(false);
    }
    expect(
      BuildJobSpecSchema.safeParse({ ...build, repo: { url: 'x' } }).success,
    ).toBe(false);
    expect(
      BuildJobSpecSchema.safeParse({ ...build, timeoutSec: 7 * 60 * 60 })
        .success,
    ).toBe(false);
    expect(
      BuildJobSpecSchema.safeParse({ ...build, command: { argv: [] } }).success,
    ).toBe(false);
    expect(
      BuildJobSpecSchema.safeParse({
        ...build,
        command: { shell: 'pnpm build && tar czf out.tgz dist' },
      }).success,
    ).toBe(true);
    expect(
      BuildJobSpecSchema.safeParse({
        ...build,
        env: [{ name: 'BAD-NAME', value: 'x' }],
      }).success,
    ).toBe(false);
  });

  it('reports events, a result and a failure', () => {
    expect(
      JobEventsRequestSchema.safeParse({
        events: [
          { seq: 1, at: 'now', type: 'phase', phase: 'checkout' },
          { seq: 2, at: 'now', type: 'log', stream: 'stdout', content: 'ok' },
        ],
      }).success,
    ).toBe(true);
    expect(
      JobEventsRequestSchema.safeParse({
        events: [{ seq: 1, at: 'now', type: 'text' }],
      }).success,
    ).toBe(false);
    const result = {
      kind: 'build',
      sha: SHA,
      exitCode: 0,
      durationMs: 1200,
      outputs: [
        {
          path: 'dist.tgz',
          sha256: 'f'.repeat(64),
          size: 10,
          upload: { status: 201, body: { id: 'rel1' } },
        },
      ],
    };
    expect(JobCompleteRequestSchema.parse({ result })).toEqual({ result });
    expect(
      JobCompleteRequestSchema.safeParse({
        result: {
          kind: 'git.check',
          target: 'main',
          targetSha: SHA,
          commits: [{ sha: SHA, exists: true, ancestor: false }],
        },
      }).success,
    ).toBe(false);
    expect(
      JobFailRequestSchema.safeParse({ reason: 'commandFailed', exitCode: 2 })
        .success,
    ).toBe(true);
    expect(
      JobFailRequestSchema.safeParse({ reason: 'leaseExpired' }).success,
    ).toBe(true);
    expect(isRetryableJobFailure('runnerOffline')).toBe(true);
    expect(isRetryableJobFailure('commandFailed')).toBe(false);
    expect(isRetryableJobFailure('jobTimeout')).toBe(false);
  });

  it('reports held jobs in the heartbeat, compatibly', () => {
    const base = {
      version: '1',
      features: [],
      tools: [],
      active: [],
      load: { slots: 2, free: 1 },
    };
    expect(HeartbeatRequestSchema.parse(base)).not.toHaveProperty('jobs');
    expect(
      HeartbeatRequestSchema.parse({ ...base, jobs: [{ jobId: 'j1' }] }).jobs,
    ).toEqual([{ jobId: 'j1' }]);
    const answer = {
      ok: true,
      serverTime: 'now',
      cancelRequested: [],
      release: [],
    };
    expect(HeartbeatResponseSchema.parse(answer)).not.toHaveProperty('jobs');
    expect(
      HeartbeatResponseSchema.parse({
        ...answer,
        jobs: { cancelRequested: ['j1'], release: [] },
      }).jobs,
    ).toEqual({ cancelRequested: ['j1'], release: [] });
  });

  it('has its own endpoints', () => {
    expect(routePath(RUNNER_ROUTES.jobComplete, { jobId: 'j/1' })).toBe(
      '/api/agents/runners/jobs/j%2F1/complete',
    );
  });
});
