import { classifySshFailure } from '../src/core/ssh-command.ts';
import { buildAgentEnv } from '../src/agent/env.ts';
import { expect, it } from 'vitest';

it.each([
  ['git@example.test: Permission denied (publickey).', false, 'authFailed'],
  ['remote: Repository not found.', false, 'authFailed'],
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
