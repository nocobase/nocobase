// The run's git (`workspace.git`) in the agent's environment, against a real git: commits name the person as author
// and committer and carry the run's trailers through the `prepare-commit-msg` hook, and the repository's short-lived
// credential answers git's credential requests for its URL only, without being written anywhere.
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import { buildAgentEnv } from '../src/agent/env.ts';
import { installGitHooks } from '../src/core/push-guard.ts';
import { removeDir, tempDir } from './helpers.ts';

const run = promisify(execFile);
const root = tempDir('nocobase-runner-git-identity-');
afterAll(() => removeDir(root));

describe('the run’s git identity and credentials', () => {
  it('commits as the person with the agent as co-author, and answers credentials for the repository only', async () => {
    const hooks = path.join(root, 'hooks');
    await installGitHooks(hooks);
    const repo = path.join(root, 'repo');
    const env = {
      ...buildAgentEnv({
        source: { PATH: process.env.PATH ?? '' },
        hooksDir: hooks,
        home: root,
        workspace: {
          env: [],
          git: {
            author: { name: 'Alice Liddell', email: 'alice@acme.dev' },
            trailers: ['Co-authored-by: Coder <agent+a1@acme.noreply>'],
            credentials: [
              {
                url: 'https://github.com/acme/acme.git',
                username: 'x-access-token',
                password: 'ghs_short_lived',
                expiresAt: '2026-10-04T01:00:00Z',
              },
            ],
          },
        },
      }),
      GIT_CONFIG_NOSYSTEM: '1',
    };
    const git = (args: string[], cwd = repo, input?: string) =>
      new Promise<string>((resolve, reject) => {
        const child = execFile('git', args, { cwd, env }, (error, stdout) =>
          error ? reject(error) : resolve(stdout.trim()),
        );
        if (input !== undefined) child.stdin?.end(input);
      });
    await run('git', ['init', '--quiet', repo]);
    await git(['commit', '--quiet', '--allow-empty', '-m', 'Fix login']);
    expect(await git(['log', '-1', '--format=%an <%ae>|%cn <%ce>'])).toBe(
      'Alice Liddell <alice@acme.dev>|Alice Liddell <alice@acme.dev>',
    );
    expect(await git(['log', '-1', '--format=%B'])).toBe(
      'Fix login\n\nCo-authored-by: Coder <agent+a1@acme.noreply>',
    );
    // Amending keeps one trailer.
    await git(['commit', '--quiet', '--amend', '--allow-empty', '--no-edit']);
    expect(
      (await git(['log', '-1', '--format=%B'])).match(/Co-authored-by/gu),
    ).toHaveLength(1);
    const fill = (url: string) =>
      git(['credential', 'fill'], repo, `url=${url}\n\n`).catch(() => '');
    expect(await fill('https://github.com/acme/acme.git')).toContain(
      'password=ghs_short_lived',
    );
    expect(await fill('https://github.com/acme/other.git')).not.toContain(
      'ghs_short_lived',
    );
    // Nothing the run started with was written into the repository's configuration.
    const config = await readFile(path.join(repo, '.git', 'config'), 'utf8');
    expect(config).not.toContain('ghs_short_lived');
    expect(await readdir(hooks)).toEqual(['pre-push', 'prepare-commit-msg']);
  });
});
