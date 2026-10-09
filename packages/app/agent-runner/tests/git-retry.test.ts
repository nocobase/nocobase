import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dirsStep } from '../src/agent/prepare/dirs.ts';
import {
  PrepareError,
  type PrepareContext,
} from '../src/agent/prepare/types.ts';
import {
  CheckoutError,
  checkout,
  lockWorkspace,
  updateCache,
} from '../src/core/checkout.ts';
import {
  classifyGitFailure,
  GIT_RETRY_DELAYS_MS,
  GitNetworkError,
  retryGit,
} from '../src/core/git-retry.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import type { RunPayload } from '../src/protocol/index.ts';
import { git, makeRemote, publishSeed, removeDir, tempDir } from './helpers.ts';

/** Messages as git prints them, from runs that failed for each cause. */
const TRANSIENT = [
  'git fetch --prune --quiet origin failed: error: RPC failed; curl 56 GnuTLS recv error (-110): The TLS connection was non-properly terminated.\nfatal: expected flush after ref listing',
  "fatal: unable to access 'https://github.com/nocobase/nocobase.git/': gnutls_handshake() failed: The TLS connection was non-properly terminated.",
  "fatal: unable to access 'https://github.com/a/b.git/': OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to github.com:443",
  "fatal: unable to access 'https://github.com/a/b.git/': Failed to connect to github.com port 443 after 21004 ms: Connection timed out",
  "fatal: unable to access 'https://github.com/a/b.git/': Recv failure: Connection reset by peer",
  'error: RPC failed; curl 28 Operation too slow. Less than 1024 bytes/sec transferred the last 60 seconds',
  "fatal: unable to access 'https://github.com/a/b.git/': Could not resolve host: github.com",
  'ssh: Could not resolve hostname github.com: Temporary failure in name resolution\nfatal: Could not read from remote repository.',
  "fatal: unable to access 'https://github.com/a/b.git/': The requested URL returned error: 503",
  "fatal: unable to access 'https://github.com/a/b.git/': The requested URL returned error: 429",
  'error: RPC failed; HTTP 502 curl 22 The requested URL returned error: 502\nfatal: the remote end hung up unexpectedly',
  'fetch-pack: unexpected disconnect while reading sideband packet\nfatal: early EOF',
];

const PERMANENT = [
  {
    message:
      "remote: Repository not found.\nfatal: repository 'https://github.com/a/missing.git/' not found",
    hint: /repository URL/u,
  },
  {
    message:
      "fatal: unable to access 'https://example.com/a.git/': The requested URL returned error: 404",
    hint: /repository URL/u,
  },
  {
    message: "fatal: Authentication failed for 'https://github.com/a/b.git/'",
    hint: /credentials/u,
  },
  {
    message:
      "fatal: unable to access 'https://github.com/a/b.git/': The requested URL returned error: 403",
    hint: /credentials/u,
  },
  {
    message:
      'git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.',
    hint: /credentials/u,
  },
  {
    message:
      "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
    hint: /credentials/u,
  },
  {
    message: "fatal: '/tmp/missing.git' does not appear to be a git repository",
    hint: /repository URL/u,
  },
  {
    message:
      "fatal: unable to access 'https://a/b.git/': SSL certificate problem: unable to get local issuer certificate",
    hint: /CA/u,
  },
  // Wrapped in the same `RPC failed; curl <n>` and `SSL_connect` lines as passing failures, but they do not pass.
  {
    message:
      'error: RPC failed; curl 60 SSL peer certificate or SSH remote key was not OK\nfatal: expected flush after ref listing',
    hint: /CA/u,
  },
  {
    message:
      "fatal: unable to access 'https://a/b.git/': OpenSSL SSL_connect: certificate verify failed",
    hint: /CA/u,
  },
  {
    message:
      'error: RPC failed; HTTP 413 curl 22 The requested URL returned error: 413\nfatal: the remote end hung up unexpectedly',
    hint: undefined,
  },
  { message: 'error: RPC failed; curl 92 something new', hint: undefined },
  { message: 'fatal: bad object deadbeef', hint: undefined },
];

describe('classifying git failures', () => {
  it.each(TRANSIENT)('retries %s', (message) => {
    expect(classifyGitFailure(message)).toEqual({ kind: 'transient' });
  });

  it.each(PERMANENT)('does not retry $message', ({ message, hint }) => {
    const failure = classifyGitFailure(message);
    expect(failure.kind).toBe('permanent');
    if (hint === undefined) expect(failure.hint).toBeUndefined();
    else expect(failure.hint).toMatch(hint);
  });
});

describe('retrying git', () => {
  const transient = (): Error =>
    new CheckoutError(
      'git fetch failed: Recv failure: Connection reset by peer',
    );

  it('retries three times, after 2, 5 and 15 seconds, then gives up with the last error', async () => {
    const sleep = vi.fn(async () => {});
    const onRetry = vi.fn();
    const attempt = vi.fn(async () => {
      throw transient();
    });
    const error = await retryGit('git fetch x', attempt, {
      sleep,
      onRetry,
    }).catch((caught: unknown) => caught);
    expect(GIT_RETRY_DELAYS_MS).toEqual([2_000, 5_000, 15_000]);
    expect(attempt).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toEqual([[2_000], [5_000], [15_000]]);
    expect(onRetry.mock.calls.map(([retry]) => retry.attempt)).toEqual([
      1, 2, 3,
    ]);
    expect(error).toBeInstanceOf(GitNetworkError);
    expect(error).toMatchObject({
      retries: 3,
      lastError: expect.stringContaining('Connection reset by peer'),
      message: expect.stringContaining('after 3 retries on this runner'),
    });
  });

  it('stops retrying once an attempt succeeds', async () => {
    const sleep = vi.fn(async () => {});
    let calls = 0;
    const result = await retryGit(
      'git fetch x',
      async () => {
        calls += 1;
        if (calls < 3) throw transient();
        return 'done';
      },
      { sleep },
    );
    expect(result).toBe('done');
    expect(sleep.mock.calls).toEqual([[2_000], [5_000]]);
  });

  it('does not retry a permanent error that comes wrapped like a passing one', async () => {
    const sleep = vi.fn(async () => {});
    const attempt = vi.fn(async () => {
      throw new CheckoutError(
        'git fetch failed: error: RPC failed; curl 60 SSL peer certificate or SSH remote key was not OK',
      );
    });
    const error = await retryGit('git fetch x', attempt, { sleep }).catch(
      (caught: unknown) => caught,
    );
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(error).not.toBeInstanceOf(GitNetworkError);
  });

  it('fails a permanent error at once, with a hint of what to fix', async () => {
    const sleep = vi.fn(async () => {});
    const attempt = vi.fn(async () => {
      throw new CheckoutError(
        "git fetch failed: fatal: Authentication failed for 'https://github.com/a/b.git/'",
      );
    });
    const error = await retryGit('git fetch x', attempt, { sleep }).catch(
      (caught: unknown) => caught,
    );
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(CheckoutError);
    expect((error as Error).message).toMatch(
      /Authentication failed.*\nHint: .*credentials/su,
    );
  });
});

interface Host {
  url: (name: string) => string;
  requests: () => number;
  close: () => Promise<void>;
}

/**
 * An HTTP git host that answers the `n`th request (from 1) with `status(n)`, counting them. A 200 serves the bare
 * repositories under `dir` as static files, git's dumb HTTP protocol (`git update-server-info` prepares one).
 */
async function gitHost(
  status: (request: number) => number,
  dir?: string,
): Promise<Host> {
  let requests = 0;
  const server: Server = createServer((request, response) => {
    requests += 1;
    const code = status(requests);
    if (code === 200 && dir !== undefined) {
      const file = path.join(
        dir,
        new URL(request.url ?? '/', 'http://x').pathname,
      );
      if (file.startsWith(dir) && existsSync(file) && statSync(file).isFile()) {
        response.writeHead(200, { 'content-type': 'application/octet-stream' });
        response.end(readFileSync(file));
        return;
      }
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(code, { 'content-type': 'text/plain' });
    response.end('unavailable');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: (name) => `http://127.0.0.1:${port}/${name}.git`,
    requests: () => requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

/** A host that answers every request with `status`. */
const failingHost = (status: number): Promise<Host> => gitHost(() => status);

const noWait = { delaysMs: [1, 1, 1], sleep: async () => {} };

describe('git network operations', () => {
  let root: string;
  let paths: RunnerPaths;

  beforeEach(() => {
    root = tempDir('nocobase-runner-git-retry-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    removeDir(root);
  });

  it('retries a clone the host answers 503, then fails with how often it tried', async () => {
    const host = await failingHost(503);
    try {
      const error = await updateCache(paths, host.url('busy'), {
        retry: noWait,
      }).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(GitNetworkError);
      expect(error).toMatchObject({
        retries: 3,
        lastError: expect.stringContaining('503'),
      });
      expect(host.requests()).toBe(4);
    } finally {
      await host.close();
    }
  });

  it('does not retry a repository the host does not have', async () => {
    const host = await failingHost(404);
    try {
      const error = await updateCache(paths, host.url('missing'), {
        retry: noWait,
      }).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(CheckoutError);
      expect(error).not.toBeInstanceOf(GitNetworkError);
      expect((error as Error).message).toMatch(
        /not found.*\nHint: Check that the repository URL/su,
      );
      expect(host.requests()).toBe(1);
    } finally {
      await host.close();
    }
  });

  it('retries a submodule the host answers 503', async () => {
    const host = await failingHost(503);
    try {
      // Git refuses file:// submodules unless told otherwise; the parent is local, the submodule is on the host.
      vi.stubEnv('GIT_CONFIG_COUNT', '1');
      vi.stubEnv('GIT_CONFIG_KEY_0', 'protocol.file.allow');
      vi.stubEnv('GIT_CONFIG_VALUE_0', 'always');
      const remote = makeRemote(root);
      const sub = makeRemote(root, 'sub-repo');
      const seed = path.join(root, 'origin-repo-seed');
      git(['submodule', 'add', '--quiet', sub, 'vendor/sub'], seed);
      git(
        [
          'config',
          '--file',
          '.gitmodules',
          'submodule.vendor/sub.url',
          host.url('sub'),
        ],
        seed,
      );
      git(['add', '.gitmodules'], seed);
      git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'sub'], seed);
      publishSeed(root);
      const error = await checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-1',
        dirs: [
          {
            kind: 'repo',
            url: remote,
            defaultBranch: 'main',
            branch: 'agent/PM-1',
            path: 'app',
          },
        ],
        retry: noWait,
      }).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(GitNetworkError);
      expect(error).toMatchObject({ retries: 3 });
      expect((error as Error).message).toContain('git submodule update');
      // Four updates; git itself tries a submodule's clone again within each.
      expect(host.requests()).toBeGreaterThanOrEqual(4);
    } finally {
      await host.close();
    }
  });
});

describe('submodules an earlier preparation left unfinished', () => {
  let root: string;
  let paths: RunnerPaths;

  beforeEach(() => {
    root = tempDir('nocobase-runner-git-retry-nested-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    // Git refuses file:// submodules unless told otherwise; the nested one is on the HTTP host.
    vi.stubEnv('GIT_CONFIG_COUNT', '1');
    vi.stubEnv('GIT_CONFIG_KEY_0', 'protocol.file.allow');
    vi.stubEnv('GIT_CONFIG_VALUE_0', 'always');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    removeDir(root);
  });

  it('finishes a nested submodule whose fetch ran out of retries once the network is back, on the same worktree', async () => {
    let down = true;
    const host = await gitHost(() => (down ? 503 : 200), root);
    try {
      // origin-repo -> vendor/mid (local) -> nested (on the host).
      makeRemote(root, 'nested');
      git(['update-server-info'], path.join(root, 'nested.git'));
      const mid = makeRemote(root, 'mid');
      const midSeed = path.join(root, 'mid-seed');
      git(
        [
          'submodule',
          'add',
          '--quiet',
          `file://${path.join(root, 'nested.git')}`,
          'nested',
        ],
        midSeed,
      );
      git(
        [
          'config',
          '--file',
          '.gitmodules',
          'submodule.nested.url',
          host.url('nested'),
        ],
        midSeed,
      );
      git(['add', '.gitmodules'], midSeed);
      git(
        ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'nested'],
        midSeed,
      );
      publishSeed(root, 'mid');
      const remote = makeRemote(root);
      const seed = path.join(root, 'origin-repo-seed');
      git(['submodule', 'add', '--quiet', mid, 'vendor/mid'], seed);
      git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'mid'], seed);
      publishSeed(root);
      const prepare = () =>
        checkout({
          paths,
          appKey: 'app',
          subjectKey: 'PM-1',
          dirs: [
            {
              kind: 'repo',
              url: remote,
              defaultBranch: 'main',
              branch: 'agent/PM-1',
              path: 'app',
            },
          ],
          retry: noWait,
        });

      const failed = await prepare().catch((caught: unknown) => caught);
      expect(failed).toBeInstanceOf(GitNetworkError);
      const nested = path.join(
        paths.workRoot,
        'app',
        'PM-1',
        'app',
        'vendor/mid/nested/README.md',
      );
      expect(
        existsSync(path.join(path.dirname(path.dirname(nested)), 'README.md')),
      ).toBe(true);
      expect(existsSync(nested)).toBe(false);

      down = false;
      const work = await prepare();
      expect(existsSync(nested)).toBe(true);
      await work.release();

      // Done: a later preparation leaves the submodules, and the host, alone.
      const before = host.requests();
      const again = await prepare();
      expect(host.requests()).toBe(before);
      await again.release();
    } finally {
      await host.close();
    }
  });
});

describe('the dirs step', () => {
  let root: string;
  let paths: RunnerPaths;

  beforeEach(() => {
    root = tempDir('nocobase-runner-dirs-step-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
  });
  afterEach(() => removeDir(root));

  /** Runs the step for a repository at `url`; returns its error and the events it recorded. */
  async function runStep(
    url: string,
    acceptedFailures?: readonly string[],
  ): Promise<{
    error: unknown;
    events: { content?: string; meta?: Record<string, unknown> }[];
  }> {
    const workspace = await lockWorkspace({
      paths,
      appKey: 'app',
      subjectKey: 'PM-1',
    });
    const events: { content?: string; meta?: Record<string, unknown> }[] = [];
    const payload = {
      run: {
        id: 'r1',
        attempt: 1,
        maxAttempts: 3,
        priority: 0,
        createdAt: '2026-10-09T00:00:00.000Z',
        leaseExpiresAt: '2026-10-09T00:10:00.000Z',
        requires: [],
        firstSeq: 1,
        ...(acceptedFailures === undefined ? {} : { acceptedFailures }),
      },
      subject: { key: 'PM-1' },
      workspace: {
        dirs: [
          {
            kind: 'repo',
            url,
            defaultBranch: 'main',
            branch: 'agent/PM-1',
            path: 'app',
          },
        ],
        env: [],
      },
    } as unknown as RunPayload;
    const context = {
      payload,
      paths,
      registration: { key: 'app' },
      log: () => {},
      event: (event: { content?: string; meta?: Record<string, unknown> }) =>
        events.push(event),
      onRelease: () => {},
      gitRetry: noWait,
      workspace,
      dirs: [],
    } as unknown as PrepareContext;
    try {
      const error = await dirsStep
        .run(context)
        .catch((caught: unknown) => caught);
      return { error, events };
    } finally {
      await workspace.release();
    }
  }

  it('fails prepareNetwork, recording each retry and the last error, when the application accepts it', async () => {
    const host = await failingHost(503);
    try {
      const { error, events } = await runStep(host.url('busy'), [
        'prepareNetwork',
      ]);
      expect(error).toBeInstanceOf(PrepareError);
      expect(error).toMatchObject({
        reason: 'prepareNetwork',
        meta: { retries: 3, lastError: expect.stringContaining('503') },
        message: expect.stringContaining('after 3 retries'),
      });
      expect(events.map((event) => event.meta?.retry)).toEqual([1, 2, 3]);
    } finally {
      await host.close();
    }
  });

  it('falls back to checkoutFailed for an application that does not announce prepareNetwork', async () => {
    const host = await failingHost(503);
    try {
      const { error } = await runStep(host.url('busy'));
      expect(error).toMatchObject({
        reason: 'checkoutFailed',
        meta: { retries: 3 },
      });
    } finally {
      await host.close();
    }
  });

  it('does not queue a request the host refuses for good, such as 413', async () => {
    const host = await failingHost(413);
    try {
      const { error, events } = await runStep(host.url('big'), [
        'prepareNetwork',
      ]);
      expect(error).not.toBeInstanceOf(PrepareError);
      expect(events).toEqual([]);
      expect(host.requests()).toBe(1);
    } finally {
      await host.close();
    }
  });

  it('records the retries made before a failure that turned permanent, and keeps its hint', async () => {
    // Busy first, then refusing the credentials.
    const host = await gitHost((request) => (request === 1 ? 503 : 401));
    try {
      const { error, events } = await runStep(host.url('private'), [
        'prepareNetwork',
      ]);
      expect(error).toBeInstanceOf(PrepareError);
      expect(error).toMatchObject({
        reason: 'checkoutFailed',
        meta: { retries: 1, lastError: expect.stringMatching(/Hint:/u) },
        message: expect.stringMatching(
          /Hint:.*\n\(after 1 retry on this runner\)/su,
        ),
      });
      expect(events.map((event) => event.meta?.retry)).toEqual([1]);
    } finally {
      await host.close();
    }
  });

  it('leaves a repository that does not exist to the step’s own checkoutFailed', async () => {
    const host = await failingHost(404);
    try {
      const { error, events } = await runStep(host.url('missing'), [
        'prepareNetwork',
      ]);
      expect(error).not.toBeInstanceOf(PrepareError);
      expect(dirsStep.failure).toBe('checkoutFailed');
      expect((error as Error).message).toMatch(/Hint:/u);
      expect(events).toEqual([]);
    } finally {
      await host.close();
    }
  });
});
