// Code host CLI wrappers and the command guard (agent/host-tools.ts): a fake `glab`/`gh` behind the wrapper, the
// run's credential through the broker's socket, and the real git behind the git wrapper.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  GitCredentialBroker,
  installCredentialHelper,
  serveGitCredentials,
  type CredentialServer,
} from '../src/agent/git-credentials.ts';
import {
  CREDENTIAL_NONCE_ENV,
  CREDENTIAL_SOCKET_ENV,
} from '../src/agent/git-credentials.ts';
import {
  installCommandGuard,
  WRAPPER_MARKER,
  writeHostTools,
} from '../src/agent/host-tools.ts';
import { gitAuthEnv } from '../src/core/git.ts';
import { ApiError, type ApiClient } from '../src/lib/http.ts';
import type { RunGitTool } from '../src/protocol/index.ts';
import { git as hostGit, removeDir, tempDir } from './helpers.ts';

const REPO = 'http://gitlab.local:8929/group/sub/app.git';
const MINUTE = 60_000;

const GLAB: RunGitTool = {
  bin: 'glab',
  url: REPO,
  env: {
    GITLAB_TOKEN: { credential: 'password' },
    GITLAB_USER: { credential: 'username' },
    GITLAB_HOST: 'gitlab.local:8929',
    API_PROTOCOL: 'http',
  },
};

/** A fake CLI that prints its arguments and the variables a wrapper sets. */
async function fakeTool(dir: string, name: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, name);
  await writeFile(
    file,
    `#!/bin/sh\necho "args=$*"\necho "token=$GITLAB_TOKEN$GH_TOKEN$GITEE_TOKEN"\necho "user=$GITLAB_USER"\necho "host=$GITLAB_HOST"\necho "protocol=$API_PROTOCOL"\n`,
  );
  await chmod(file, 0o755);
  return file;
}

function run(
  file: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile(file, args, { env }, (error, stdout, stderr) =>
      resolve({
        stdout,
        stderr,
        code: error === null ? 0 : Number(error.code ?? 1),
      }),
    );
  });
}

describe('code host CLI wrappers', () => {
  let root: string;
  let server: CredentialServer | undefined;
  let answers: ((count: number) => unknown)[];
  let asked: number;

  const client = {
    post: async () => {
      asked += 1;
      const answer = answers[Math.min(asked, answers.length) - 1]!(asked);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  } as unknown as ApiClient;

  beforeEach(() => {
    root = tempDir('nocobase-runner-host-tools-');
    asked = 0;
    answers = [];
  });
  afterEach(async () => {
    await server?.close();
    server = undefined;
    removeDir(root);
  });

  async function setUp(tools: RunGitTool[] = [GLAB]) {
    const realDir = path.join(root, 'real');
    await fakeTool(realDir, 'glab');
    await fakeTool(realDir, 'gh');
    await fakeTool(realDir, 'gitee');
    const broker = new GitCredentialBroker({
      client,
      runId: 'r1',
      attempt: 1,
      onDemand: [REPO],
      onSecret: () => undefined,
      onLost: () => undefined,
    });
    server = await serveGitCredentials(broker, path.join(root, 'home'));
    const helper = await installCredentialHelper(path.join(root, 'helpers'));
    const binDir = path.join(root, 'bin');
    const result = await writeHostTools({
      binDir,
      helpersDir: path.join(root, 'helpers'),
      helper,
      urls: broker.urls,
      tools,
      searchPath: `${binDir}${path.delimiter}${realDir}`,
    });
    const env = {
      PATH: `${binDir}${path.delimiter}${realDir}${path.delimiter}${process.env.PATH ?? ''}`,
      [CREDENTIAL_SOCKET_ENV]: server.socket,
      [CREDENTIAL_NONCE_ENV]: server.nonce,
    };
    return { binDir, realDir, env, result };
  }

  it('reports how to install a missing official Gitee CLI', async () => {
    const messages: string[] = [];
    const result = await writeHostTools({
      binDir: path.join(root, 'bin'),
      helpersDir: path.join(root, 'helpers'),
      searchPath: path.join(root, 'empty'),
      tools: [
        {
          bin: 'gitee',
          url: REPO,
          env: { GITEE_TOKEN: { credential: 'password' } },
        },
      ],
      log: (message) => messages.push(message),
    });
    expect(result.wrapped).not.toContain('gitee');
    expect(messages.join(' ')).toContain('npm install -g @gitee/gitee-cli');
  });

  it('injects the Gitee credential, denies fallback and blocks credential persistence with global flags', async () => {
    answers = [
      () => ({
        username: 'oauth2',
        password: 'gitee-fixture',
        expiresAt: new Date(Date.now() + 60 * MINUTE).toISOString(),
      }),
    ];
    const { binDir, env } = await setUp([
      {
        bin: 'gitee',
        url: REPO,
        env: { GITEE_TOKEN: { credential: 'password' } },
      },
    ]);
    const result = await run(
      path.join(binDir, 'gitee'),
      ['pr', 'create', '--json', '--no-tui'],
      env,
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('token=gitee-fixture');
    expect(result.stdout).toContain(
      'args=--hostname gitee.com pr create --json --no-tui',
    );
    for (const args of [
      ['auth', 'token'],
      ['auth', '--no-tui', 'token'],
      ['config', '--no-tui', 'set', 'tui', 'false'],
      ['--json', 'auth', 'login'],
      ['config', 'set', 'ai.token', 'fixture'],
      ['--no-tui', 'config', 'set', 'tui', 'false'],
      ['--hostname', 'elsewhere.test', 'pr', 'list'],
    ]) {
      const denied = await run(path.join(binDir, 'gitee'), args, env);
      expect(denied.code).toBe(1);
      expect(denied.stdout).not.toContain('gitee-fixture');
    }
  });

  it('pins effective Gitee API destinations over inherited and saved settings', async () => {
    answers = [
      () => ({
        username: 'oauth2',
        password: 'gitee-fixture',
        expiresAt: new Date(Date.now() + 60 * MINUTE).toISOString(),
      }),
    ];
    const { binDir, realDir, env } = await setUp([
      {
        bin: 'gitee',
        url: REPO,
        env: { GITEE_TOKEN: { credential: 'password' } },
      },
    ]);
    const configDir = path.join(root, 'gitee-config');
    await mkdir(configDir);
    // No credentials: mirror official config.APIPrefix/GoAPIHost precedence.
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        api_prefix: 'https://saved.invalid/api/v5',
        go_api_host: 'saved.invalid',
      }),
    );
    await writeFile(
      path.join(realDir, 'gitee'),
      `#!${process.execPath}
const fs = require('node:fs');
const config = JSON.parse(fs.readFileSync(process.env.GITEE_CONFIG_DIR + '/config.json', 'utf8'));
console.log(JSON.stringify({api: process.env.GITEE_API_PREFIX || config.api_prefix, go: process.env.GITEE_GO_API_HOST || config.go_api_host}));
`,
    );
    for (const inherited of [
      {},
      {
        GITEE_API_PREFIX: 'http://inherited.invalid/api/v5',
        GITEE_GO_API_HOST: 'inherited.invalid',
      },
    ]) {
      const result = await run(
        path.join(binDir, 'gitee'),
        ['api', '/user', '--no-tui'],
        {
          ...env,
          ...inherited,
          GITEE_CONFIG_DIR: configDir,
        },
      );
      expect(result.stderr).toBe('');
      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        api: 'https://gitee.com/api/v5',
        go: 'go-api.gitee.com',
      });
    }
    const bodyURL = await run(
      path.join(binDir, 'gitee'),
      ['pr', 'create', '--body', 'https://ci.example/build/1'],
      { ...env, GITEE_CONFIG_DIR: configDir },
    );
    expect(bodyURL.code).toBe(0);
    const pipeline = await run(
      path.join(binDir, 'gitee'),
      ['pipeline', 'request', 'https://elsewhere.test/log'],
      env,
    );
    expect(pipeline.code).toBe(1);
    for (const endpoint of [
      'http://127.0.0.1/user',
      'https://elsewhere.test/user',
      'https://gitee.com.elsewhere.test/user',
      'https://gitee.com@elsewhere.test/user',
      'https://gitee.com:8443/user',
    ]) {
      const result = await run(
        path.join(binDir, 'gitee'),
        ['api', endpoint, '--no-tui'],
        env,
      );
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('only public Gitee API URLs');
    }
  });

  it('runs the real tool with the run’s current credential and the literal variables, asking anew as it expires', async () => {
    answers = [
      () => ({
        username: 'oauth2',
        password: 'glpat-first',
        expiresAt: new Date(Date.now() + 4 * MINUTE).toISOString(),
      }),
      () => ({
        username: 'oauth2',
        password: 'glpat-second',
        expiresAt: new Date(Date.now() + 60 * MINUTE).toISOString(),
      }),
    ];
    const { binDir, env, result } = await setUp();
    expect(result.credentialed).toEqual(['glab']);
    const wrapper = await readFile(path.join(binDir, 'glab'), 'utf8');
    expect(wrapper).not.toContain('glpat');

    const first = await run(
      path.join(binDir, 'glab'),
      ['mr', 'create', '--title', "it's done"],
      env,
    );
    expect(first.code).toBe(0);
    expect(first.stdout).toContain("args=mr create --title it's done");
    expect(first.stdout).toContain('token=glpat-first');
    expect(first.stdout).toContain('user=oauth2');
    expect(first.stdout).toContain('host=gitlab.local:8929');
    expect(first.stdout).toContain('protocol=http');
    // The first credential had less than the refresh margin left, so the next call gets a fresh one.
    const second = await run(path.join(binDir, 'glab'), ['mr', 'list'], env);
    expect(second.stdout).toContain('token=glpat-second');
  });

  it('runs the real tool as it is outside a run, and fails with the reason when the runner gives no credential', async () => {
    answers = [
      () =>
        new ApiError(
          403,
          'REPO_ACCESS_DENIED',
          'The task owner has not authorized GitLab.',
        ),
    ];
    const { binDir, env } = await setUp();
    const outside = await run(path.join(binDir, 'glab'), ['mr', 'list'], {
      PATH: env.PATH,
    });
    expect(outside.code).toBe(0);
    expect(outside.stdout).toContain('token=\n');
    expect(outside.stdout).toContain('host=\n');

    const denied = await run(path.join(binDir, 'glab'), ['mr', 'list'], env);
    expect(denied.code).toBe(1);
    expect(denied.stdout).not.toContain('args=');
    expect(denied.stderr).toContain('nocobase-runner:');
    expect(denied.stderr).toContain('has not authorized GitLab');
  });

  it('refuses logins that would change this machine’s, and wraps an installed tool the run names no credential for', async () => {
    const { binDir, env, result } = await setUp();
    expect(result.wrapped).toEqual(expect.arrayContaining(['gh', 'glab']));
    expect(result.credentialed).toEqual(['glab']);
    for (const [bin, sub] of [
      ['glab', 'login'],
      ['gh', 'login'],
      ['gh', 'setup-git'],
      ['gh', 'token'],
    ] as const) {
      const refused = await run(path.join(binDir, bin), ['auth', sub], env);
      expect(refused.code).toBe(1);
      expect(refused.stdout).toBe('');
      expect(refused.stderr).toContain(`'${bin} auth ${sub}' would change`);
    }
    for (const bin of ['gh', 'glab']) {
      const shown = await run(
        path.join(binDir, bin),
        ['auth', 'status', '--show-token'],
        env,
      );
      expect(shown.code).toBe(1);
      expect(shown.stderr).toContain('would show the run');
    }
    const status = await run(path.join(binDir, 'gh'), ['auth', 'status'], env);
    expect(status.code).toBe(0);
    expect(status.stdout).toContain('args=auth status');
    expect(status.stdout).toContain('token=\n');
  });

  it('writes no wrapper for a tool that is not installed, and replaces an earlier run’s wrappers', async () => {
    const binDir = path.join(root, 'bin');
    await mkdir(binDir, { recursive: true });
    await writeFile(
      path.join(binDir, 'tea'),
      `#!/bin/sh\n${WRAPPER_MARKER}\nexec /nowhere "$@"\n`,
    );
    await writeFile(path.join(binDir, 'appcli'), '#!/bin/sh\nexit 0\n');
    const result = await writeHostTools({
      binDir,
      helpersDir: path.join(root, 'helpers'),
      tools: [{ bin: 'tea', url: REPO, env: {} }],
      searchPath: path.join(root, 'empty'),
    });
    expect(result.wrapped).toEqual([]);
    expect(existsSync(path.join(binDir, 'tea'))).toBe(false);
    expect(existsSync(path.join(binDir, 'appcli'))).toBe(true);
  });
});

describe('the git guard', () => {
  let root: string;
  beforeEach(() => {
    root = tempDir('nocobase-runner-git-guard-');
  });
  afterEach(() => removeDir(root));

  it('refuses credentials in URLs and global credential settings, and lets everything else through', async () => {
    const guard = await installCommandGuard(path.join(root, 'helpers'));
    const { refusal } = (await import(pathToFileURL(guard).href)) as {
      refusal: (args: string[]) => string | null;
    };
    const refused = [
      ['config', 'http.extraHeader', 'Authorization: Basic x'],
      ['config', '--add', 'http.https://h/.extraheader', 'x'],
      ['config', 'set', '--local', 'http.extraHeader', 'x'],
      ['config', '--global', '--edit'],
      ['config', '--system', '-e'],
      ['config', 'edit', '--global'],
      ['-c', 'credential.helper=store', 'push'],
      ['-C', 'repo', '-c', 'Credential.https://h.helper=store', 'fetch'],
      ['--config-env=credential.helper=HELPER', 'push'],
      ['--config-env', 'credential.helper=HELPER', 'push'],
      ['push', 'https://glpat-x@gitlab.local/g/app.git'],
      ['remote', 'add', 'origin', 'http://token@host:8929/x.git'],
      ['config', '--file', '/tmp/x', 'credential.helper', 'store'],
      ['config', '-f', 'cfg', '--add', 'credential.helper', 'store'],
      ['config', '--file=../.gitconfig', 'credential.helper', 'store'],
      [
        'remote',
        'add',
        'origin',
        'https://oauth2:glpat-x@gitlab.local/g/app.git',
      ],
      [
        'remote',
        'set-url',
        'origin',
        'https://x-access-token:ghs_x@github.com/a/b.git',
      ],
      ['clone', 'https://u:p@host/x.git'],
      ['config', 'remote.origin.url', 'http://u:p@host:8929/x.git'],
      ['config', '--global', 'credential.helper', 'store'],
      ['config', '--system', '--add', 'credential.https://host.helper', 'x'],
      ['-C', 'repo', 'config', '--global', 'Credential.UseHttpPath', 'true'],
      ['config', 'set', '--global', 'credential.helper', 'store'],
      ['credential', 'approve'],
    ];
    expect(refused.filter((args) => refusal(args) === null)).toEqual([]);
    const allowed = [
      ['remote', 'add', 'origin', 'https://gitlab.local/g/app.git'],
      ['remote', 'add', 'origin', 'git@gitlab.local:g/app.git'],
      ['clone', 'ssh://git@host/x.git'],
      ['config', 'credential.helper', 'x'],
      ['config', '--global', 'user.name', 'A'],
      ['config', '--global', '--get', 'credential.helper'],
      ['config', 'get', '--global', 'credential.helper'],
      ['config', '--global', '--list'],
      ['credential', 'fill'],
      ['commit', '-m', 'config'],
      ['commit', '-m', 'see https://x@y.example/z'],
      ['-c', 'user.name=A', 'commit'],
      ['config', '--local', 'credential.helper', 'cache'],
      ['config', '--file', 'credential.cfg', 'user.name', 'A'],
      ['config', '--edit'],
      ['config', '--get', 'http.extraheader'],
      ['config', 'http.postBuffer', '524288000'],
      ['config', '--unset', 'http.extraheader'],
    ];
    expect(allowed.filter((args) => refusal(args) !== null)).toEqual([]);
  });

  it('stops a refused call before git runs, through the wrapper', async () => {
    const binDir = path.join(root, 'bin');
    const result = await writeHostTools({
      binDir,
      helpersDir: path.join(root, 'helpers'),
    });
    expect(result.wrapped).toContain('git');
    const home = path.join(root, 'home');
    await mkdir(home);
    const repo = path.join(root, 'repo');
    hostGit(['init', '--quiet', repo]);
    const env = {
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
      HOME: home,
      GIT_CONFIG_NOSYSTEM: '1',
    };
    const git = (args: string[]) =>
      new Promise<{ code: number; stdout: string; stderr: string }>((resolve) =>
        execFile(
          path.join(binDir, 'git'),
          args,
          { cwd: repo, env },
          (error, stdout, stderr) =>
            resolve({
              code: error === null ? 0 : Number(error.code),
              stdout,
              stderr,
            }),
        ),
      );

    const stored = await git([
      'config',
      '--global',
      'credential.helper',
      'store',
    ]);
    expect(stored.code).toBe(1);
    expect(stored.stderr).toContain('nocobase-runner: refused');
    expect(existsSync(path.join(home, '.gitconfig'))).toBe(false);

    const embedded = await git([
      'remote',
      'add',
      'origin',
      'https://oauth2:glpat-x@gitlab.local/g/app.git',
    ]);
    expect(embedded.code).toBe(1);
    expect(embedded.stderr).toContain(
      'do not put a user or a credential in a git URL',
    );

    expect(
      (await git(['remote', 'add', 'origin', 'https://gitlab.local/g/app.git']))
        .code,
    ).toBe(0);
    expect((await git(['config', 'credential.helper', 'cache'])).code).toBe(0);
    expect((await git(['remote', 'get-url', 'origin'])).stdout.trim()).toBe(
      'https://gitlab.local/g/app.git',
    );
  });
});

describe('the runner’s own git', () => {
  it('sends the username the credential came with', () => {
    const env = gitAuthEnv({ username: 'oauth2', token: 'glpat-x' });
    expect(env.GIT_CONFIG_VALUE_0).toBe(
      `Authorization: Basic ${Buffer.from('oauth2:glpat-x').toString('base64')}`,
    );
  });
});
