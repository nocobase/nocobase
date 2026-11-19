import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { isGitTransportSwitch, supportsGitSsh } from '../src/core/git-ssh.ts';
import { classifySshFailure } from '../src/core/ssh-command.ts';
import { buildAgentEnv } from '../src/agent/env.ts';
import { expect, it, vi } from 'vitest';

it.each([
  [
    'https://git.example.test/team/repo.git',
    'git@git.example.test:team/repo.git',
    true,
  ],
  [
    'ssh://git@ssh.example.test:2222/team/repo.git',
    'https://web.example.test/gitlab/team/repo',
    true,
  ],
  [
    'https://git.example.test/other/repo.git',
    'git@git.example.test:team/repo.git',
    false,
  ],
  [
    'https://git.example.test/team/repo.git',
    'https://other.example.test/team/repo.git',
    false,
  ],
] as const)(
  'matches HTTPS and SSH names for the same repository (%s, %s)',
  (before, after, matches) => {
    expect(isGitTransportSwitch(before, after)).toBe(matches);
  },
);

it.each([
  ['git@example.test: Permission denied (publickey).', false, 'authFailed'],
  ['remote: Repository not found.', false, 'authFailed'],
  [
    "remote: ERROR: The project you were looking for could not be found or you don't have permission to view it.",
    false,
    'authFailed',
  ],
  [
    'Gitea: Deploy Key: 1:build-key is not authorized to write to team/repo.',
    true,
    'pushRejected',
  ],
  [
    'Gitea: Deploy Key: 1:build-key is not authorized to read team/repo.',
    false,
    'authFailed',
  ],
  [
    'Access deined: You do not have permission push to this repository',
    true,
    'pushRejected',
  ],
  ['Auth error: DeployKey does not support push code', true, 'pushRejected'],
  [
    'WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!',
    false,
    'hostKeyMismatch',
  ],
  [
    'No ED25519 host key is known and you have requested strict checking.\nHost key verification failed.',
    false,
    'hostKeyMismatch',
  ],
  [
    ' ! [remote rejected] HEAD -> task (pre-receive hook declined)',
    true,
    'pushRejected',
  ],
  [
    'ERROR: The key you are authenticating with has been marked as read only.',
    true,
    'pushRejected',
  ],
  [
    'ssh: connect to host example.test port 2222: Connection refused',
    false,
    'unreachable',
  ],
  ['ssh: Could not resolve hostname example.test', true, 'unreachable'],
  ['fatal: The remote end hung up unexpectedly', false, undefined],
] as const)('classifies SSH stderr %s', (stderr, push, reason) => {
  expect(classifySshFailure(stderr, push)).toBe(reason);
});

it('places only the managed SSH command in the agent environment', () => {
  const env = buildAgentEnv({
    source: {
      SSH_AUTH_SOCK: 'host-socket',
      SSH_AGENT_PID: '1234',
      GIT_SSH_COMMAND: 'host-ssh',
    },
    passEnv: ['SSH_AUTH_SOCK', 'SSH_AGENT_PID', 'GIT_SSH_COMMAND'],
    gitSshCommand: 'runner-ssh',
    workspace: {
      env: [],
      git: {
        ssh: [
          {
            url: 'git@example.test:team/repo.git',
            privateKey: 'synthetic private key for the test',
            knownHosts: 'example.test ssh-ed25519 public-key',
          },
        ],
      },
    },
  });
  expect(env.GIT_SSH_COMMAND).toBe('runner-ssh');
  expect(env.GIT_SSH_VARIANT).toBe('ssh');
  expect(env.SSH_AUTH_SOCK).toBeUndefined();
  expect(env.SSH_AGENT_PID).toBeUndefined();
  expect(Object.values(env)).not.toContain(
    'synthetic private key for the test',
  );
});

it.runIf(process.platform === 'linux' || process.platform === 'darwin').each([
  ['Error loading key "(stdin)": invalid format', true],
  ['-: No such file or directory', false],
] as const)(
  'advertises Git SSH according to the ssh-add stdin probe (%s)',
  (diagnostic, supported) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nb-ssh-bin-'));
    try {
      writeFileSync(path.join(dir, 'ssh'), '#!/bin/sh\nexit 0\n', {
        mode: 0o700,
      });
      writeFileSync(
        path.join(dir, 'ssh-agent'),
        '#!/bin/sh\nshift 4\nexec "$@"\n',
        { mode: 0o700 },
      );
      writeFileSync(
        path.join(dir, 'ssh-add'),
        [
          '#!/bin/sh',
          '[ "$1" = "-" ] || exit 2',
          'IFS= read -r input',
          '[ "$input" = "invalid key" ] || exit 2',
          `printf '%s\\n' '${diagnostic}' >&2`,
          'exit 1',
          '',
        ].join('\n'),
        { mode: 0o700 },
      );
      vi.stubEnv('PATH', path.relative(process.cwd(), dir));
      expect(supportsGitSsh()).toBe(supported);
    } finally {
      vi.unstubAllEnvs();
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
