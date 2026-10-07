import { describe, expect, it } from 'vitest';

import {
  ClaimResponseSchema,
  UploadTicketSchema,
  CompleteRequestSchema,
  ERROR_API_STATUS,
  ERROR_STATUS,
  readErrorBody,
  EventsRequestSchema,
  EXIT_CODES,
  exitCodeFor,
  HeartbeatRequestSchema,
  isProtocolSupported,
  isRetryable,
  MAX_EVENTS_PER_BATCH,
  MIN_PROTOCOL_VERSION,
  missingFeatures,
  MountBundleSchema,
  PROTOCOL_VERSION,
  ProtocolError,
  RegisterRequestSchema,
  routePath,
  RUNNER_ROUTES,
  RunCliSchema,
  RunMountSchema,
  RunPayloadSchema,
  SkillBundleSchema,
  WorkspaceDirSchema,
  type RunPayload,
  RepoDirSchema,
} from '../src/index.js';

const payload: RunPayload = {
  run: {
    id: 'r1',
    attempt: 1,
    maxAttempts: 3,
    priority: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    leaseExpiresAt: '2026-10-01T00:00:45.000Z',
    requires: ['input'],
    firstSeq: 1,
  },
  app: { id: 'acme', name: 'Acme' },
  subject: { key: 'PM-1', title: 'Fix it', url: '/issues/PM-1' },
  tool: {
    kind: 'claude',
    model: 'sonnet',
    policy: {
      permissionMode: 'acceptEdits',
      allowedCommands: ['^git '],
      deniedPatterns: ['rm -rf /'],
      idleTimeoutMs: 600_000,
    },
  },
  prompt: { system: 's', turn: 'Do it', session: 'fresh' },
  inputs: [
    {
      id: 'in1',
      type: 'comment',
      at: '2026-10-01T00:00:00.000Z',
      actor: { kind: 'user', id: 'u1', name: 'Alice' },
      text: 'Please fix',
    },
  ],
  workspace: {
    dirs: [
      {
        kind: 'repo',
        url: 'git@example.com:a/b.git',
        defaultBranch: 'main',
        branch: 'agent/PM-1',
        path: 'b',
        initPrompt: 'Run pnpm install.',
      },
      { kind: 'directory', path: '/srv/data', name: 'data' },
    ],
    env: [{ name: 'NPM_TOKEN', value: 'x' }],
  },
  skills: [
    {
      slug: 'pr-etiquette',
      name: 'PR etiquette',
      version: '2',
      hash: 'abc',
      description: 'How we write pull requests.',
      bundleUrl: '/api/agents/runners/runs/r1/skills/pr-etiquette',
    },
  ],
  cli: {
    name: 'acme',
    package: { kind: 'npm', package: '@acme/app-cli', version: '1.0.0' },
    credential: {
      file: '.acme/run.json',
      content: { token: 'fgr_x', runId: 'r1', expiresAt: '2026-10-02' },
    },
  },
};

describe('agent protocol', () => {
  it('is version 7 and still serves versions 3 to 6', () => {
    expect(PROTOCOL_VERSION).toBe(7);
    expect(MIN_PROTOCOL_VERSION).toBe(3);
    expect(isProtocolSupported(3)).toBe(true);
    expect(isProtocolSupported(4)).toBe(true);
    expect(isProtocolSupported(5)).toBe(true);
    expect(isProtocolSupported(6)).toBe(true);
    expect(isProtocolSupported(2)).toBe(false);
    expect(isProtocolSupported(7)).toBe(true);
    expect(isProtocolSupported(8)).toBe(false);
    expect(isProtocolSupported(3.5)).toBe(false);
  });

  it('marks the one run that makes the first commit of an empty repository', () => {
    const dir = {
      kind: 'repo',
      url: 'https://github.com/acme/new.git',
      defaultBranch: 'main',
      branch: 'main',
      path: 'new',
      initial: true,
    };
    expect(RepoDirSchema.parse(dir)).toEqual(dir);
    expect(RepoDirSchema.safeParse({ ...dir, initial: false }).success).toBe(
      false,
    );
  });

  it('round-trips a run payload', () => {
    expect(ClaimResponseSchema.parse({ runs: [payload] })).toEqual({
      runs: [payload],
    });
  });

  it('carries mounts inside the work directory, and reads a payload without them', () => {
    const mount = {
      name: 'knowledge',
      hash: 'h1',
      bundleUrl: '/api/agents/runners/runs/r1/mounts/knowledge',
      target: '.nocobase-runner/knowledge',
      note: 'Team knowledge; start with INDEX.md.',
    };
    expect(
      ClaimResponseSchema.parse({ runs: [{ ...payload, mounts: [mount] }] }),
    ).toEqual({ runs: [{ ...payload, mounts: [mount] }] });
    expect(RunPayloadSchema.parse(payload).mounts).toBeUndefined();
    for (const target of ['/etc', '../x', 'a/../b', 'a//b', './a', 'C:/x'])
      expect(RunMountSchema.safeParse({ ...mount, target }).success).toBe(
        false,
      );
    expect(RunMountSchema.safeParse({ ...mount, name: 'Bad' }).success).toBe(
      false,
    );
    expect(
      MountBundleSchema.safeParse({
        name: 'knowledge',
        hash: 'h1',
        files: [{ path: '../escape.md', content: '' }],
      }).success,
    ).toBe(false);
    expect(
      MountBundleSchema.parse({
        name: 'knowledge',
        hash: 'h1',
        files: [{ path: 'project/a.md', content: '# A' }],
      }).files,
    ).toHaveLength(1);
    expect(
      routePath(RUNNER_ROUTES.mount, { runId: 'r1', name: 'knowledge' }),
    ).toBe('/api/agents/runners/runs/r1/mounts/knowledge');
  });

  it('keeps the CLI credential file inside the working directory', () => {
    for (const file of ['/etc/x', '../x', 'a/../../x', 'a//b']) {
      expect(
        RunCliSchema.safeParse({
          ...payload.cli,
          credential: { ...payload.cli.credential, file },
        }).success,
      ).toBe(false);
    }
    expect(
      RunCliSchema.safeParse({ ...payload.cli, name: 'Bad Name' }).success,
    ).toBe(false);
    expect(
      RunCliSchema.safeParse({
        ...payload.cli,
        package: { kind: 'tarball', url: 'https://x/t.tgz', sha256: 'abc' },
      }).success,
    ).toBe(false);
  });

  it('keeps working directories where they belong', () => {
    const [repo, directory] = payload.workspace.dirs;
    for (const path of ['/abs', '../x', 'a/../../x', '']) {
      expect(WorkspaceDirSchema.safeParse({ ...repo, path }).success).toBe(
        false,
      );
    }
    expect(
      WorkspaceDirSchema.safeParse({ ...directory, path: 'relative' }).success,
    ).toBe(false);
    expect(
      WorkspaceDirSchema.safeParse({ kind: 'elsewhere', path: '/x' }).success,
    ).toBe(false);
  });

  it('keeps skill files inside the skill', () => {
    const bundle = { slug: 'a', version: '1', hash: 'h' };
    expect(
      SkillBundleSchema.safeParse({
        ...bundle,
        files: [{ path: 'SKILL.md', content: '' }],
      }).success,
    ).toBe(true);
    for (const path of ['../x', '/etc/x', 'a/./b']) {
      expect(
        SkillBundleSchema.safeParse({
          ...bundle,
          files: [{ path, content: '' }],
        }).success,
      ).toBe(false);
    }
    expect(
      SkillBundleSchema.parse({
        ...bundle,
        files: [
          {
            path: 'logo.png',
            content: 'iVBORw0KGgo=',
            encoding: 'base64',
            executable: false,
          },
        ],
      }).files[0],
    ).toMatchObject({ encoding: 'base64', executable: false });
    expect(
      SkillBundleSchema.safeParse({
        ...bundle,
        files: [{ path: 'a', content: '', encoding: 'hex' }],
      }).success,
    ).toBe(false);
    expect(
      SkillBundleSchema.safeParse({ ...bundle, slug: 'Not A Slug', files: [] })
        .success,
    ).toBe(false);
  });

  it('drops fields it does not know, so additions stay compatible', () => {
    const parsed = ClaimResponseSchema.parse({
      runs: [{ ...payload, future: true }],
    });
    expect(parsed.runs[0]).not.toHaveProperty('future');
  });

  it('rejects an unknown feature and an unknown tool', () => {
    const base = {
      registrationToken: 't',
      name: 'n',
      hostname: 'h',
      os: 'darwin',
      arch: 'arm64',
      version: '0.0.1',
      protocolVersion: 1,
      features: ['input'],
      tools: [{ kind: 'claude', authenticated: true }],
    };
    expect(RegisterRequestSchema.safeParse(base).success).toBe(true);
    expect(
      RegisterRequestSchema.safeParse({ ...base, features: ['teleport'] })
        .success,
    ).toBe(false);
    expect(
      RegisterRequestSchema.safeParse({
        ...base,
        tools: [{ kind: 'vim', authenticated: true }],
      }).success,
    ).toBe(false);
  });

  it('limits an events batch', () => {
    const events = Array.from({ length: MAX_EVENTS_PER_BATCH + 1 }, (_, i) => ({
      seq: i + 1,
      at: 'now',
      type: 'text',
      content: 'x',
    }));
    expect(EventsRequestSchema.safeParse({ events }).success).toBe(false);
    expect(
      EventsRequestSchema.safeParse({ events: events.slice(1) }).success,
    ).toBe(true);
  });

  it('requires handled input ids on complete', () => {
    expect(CompleteRequestSchema.safeParse({ summary: 'done' }).success).toBe(
      false,
    );
  });

  it('describes an upload ticket', () => {
    expect(
      UploadTicketSchema.parse({
        url: '/api/builds/b1/uploadArtifact',
        method: 'POST',
        headers: { authorization: 'Bearer t' },
      }).method,
    ).toBe('POST');
    expect(
      UploadTicketSchema.safeParse({ url: '/x', method: 'GET', headers: {} })
        .success,
    ).toBe(false);
  });

  it('matches features', () => {
    expect(missingFeatures(['input', 'steer'], ['input'])).toEqual(['steer']);
    expect(missingFeatures([], [])).toEqual([]);
  });

  it('fills route parameters', () => {
    expect(routePath(RUNNER_ROUTES.complete, { runId: 'a/b' })).toBe(
      '/api/agents/runners/runs/a%2Fb/complete',
    );
  });

  it('classifies failures and errors', () => {
    expect(isRetryable('runnerOffline')).toBe(true);
    expect(isRetryable('toolAuth')).toBe(false);
    expect(ERROR_STATUS.RUN_INPUT_PENDING).toBe(400);
    expect(ERROR_API_STATUS.RUN_INPUT_PENDING).toBe('FAILED_PRECONDITION');
    expect(ERROR_STATUS.LEASE_LOST).toBe(409);
    expect(ERROR_STATUS.UPLOAD_TOO_LARGE).toBe(413);
    expect(ERROR_STATUS.NOT_IMPLEMENTED).toBe(503);
    expect(exitCodeFor('RUN_TOKEN_INVALID')).toBe(EXIT_CODES.auth);
    expect(exitCodeFor('COMMAND_UNKNOWN')).toBe(EXIT_CODES.notFound);
    expect(exitCodeFor('RUN_INPUT_PENDING')).toBe(EXIT_CODES.conflict);
    expect(exitCodeFor('INVALID_REQUEST')).toBe(EXIT_CODES.validation);
    expect(exitCodeFor('PROTOCOL_UNSUPPORTED')).toBe(EXIT_CODES.auth);
    expect(exitCodeFor('SOMETHING_NEW')).toBe(EXIT_CODES.general);
    expect(exitCodeFor('ISSUE_NOT_FOUND', 'NOT_FOUND')).toBe(
      EXIT_CODES.notFound,
    );
    expect(exitCodeFor('PLAN_REQUIRED')).toBe(EXIT_CODES.planRequired);

    const error = new ProtocolError('LEASE_LOST', 'Lost', { runId: 'r1' });
    expect(error).toMatchObject({
      code: 'LEASE_LOST',
      status: 409,
      apiStatus: 'ABORTED',
      domain: 'agents',
      details: { runId: 'r1' },
    });
    expect(
      new ProtocolError('NOT_FOUND', 'Gone', undefined, { domain: 'acme' })
        .domain,
    ).toBe('acme');

    const payload = {
      code: 409,
      status: 'ABORTED',
      reason: 'LEASE_LOST',
      domain: 'agents',
      message: 'Lost',
      requestId: 'req-1',
      metadata: { runId: 'r1' },
    };
    expect(readErrorBody({ error: payload })).toEqual(payload);
    expect(
      readErrorBody({ code: 'LEASE_LOST', message: 'Lost' }),
    ).toBeUndefined();
    expect(readErrorBody({ message: 'no code' })).toBeUndefined();
    expect(readErrorBody('Bad gateway')).toBeUndefined();
  });

  it('keeps heartbeats free of labels', () => {
    const parsed = HeartbeatRequestSchema.parse({
      version: '1',
      features: [],
      tools: [],
      active: [],
      load: { slots: 1, free: 1 },
      labels: ['x'],
    });
    expect(parsed).not.toHaveProperty('labels');
  });
});
