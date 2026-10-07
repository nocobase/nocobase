import { describe, expect, it } from 'vitest';

import {
  HeartbeatRequestSchema,
  matchesPattern,
  policyAllowsAgent,
  policyAllowsRepo,
  policyAllowsSubject,
  repoKey,
} from '../src/index.js';

describe('runner policy', () => {
  it('matches whole values, with * for any run of characters', () => {
    expect(matchesPattern('NP-*', 'NP-12')).toBe(true);
    expect(matchesPattern('NP-*', 'XNP-12')).toBe(false);
    expect(matchesPattern('a.b', 'axb')).toBe(false);
    expect(matchesPattern('*', '')).toBe(true);
  });

  it('compares repositories by host and path', () => {
    expect(repoKey('https://user:tok@GitHub.com:443/acme/app.git')).toBe(
      'github.com/acme/app',
    );
    expect(repoKey('git@github.com:acme/app.git')).toBe('github.com/acme/app');
    expect(repoKey('ssh://git@github.com/acme/app')).toBe(
      'github.com/acme/app',
    );
    expect(repoKey('/srv/repos/app.git/')).toBe('/srv/repos/app');
    const policy = { repos: ['github.com/acme/*'] };
    expect(policyAllowsRepo(policy, 'https://github.com/acme/app.git')).toBe(
      true,
    );
    expect(policyAllowsRepo(policy, 'git@github.com:acme/app.git')).toBe(true);
    expect(policyAllowsRepo(policy, 'https://github.com/other/app')).toBe(
      false,
    );
    expect(policyAllowsRepo({}, 'https://anything.example/x')).toBe(true);
  });

  it('reads an absent list as anything and an empty one as nothing', () => {
    const agent = { id: 'a1', name: 'Coder' };
    expect(policyAllowsAgent(undefined, agent)).toBe(true);
    expect(policyAllowsAgent({ agents: [] }, agent)).toBe(false);
    expect(policyAllowsAgent({ agents: ['Coder'] }, agent)).toBe(true);
    expect(policyAllowsAgent({ agents: ['a1'] }, agent)).toBe(true);
    expect(policyAllowsAgent({ agents: ['Reviewer'] }, agent)).toBe(false);
    expect(policyAllowsSubject({ subjects: ['NP-*'] }, 'NP-3')).toBe(true);
    expect(policyAllowsSubject({ subjects: ['NP-*'] }, 'OPS-3')).toBe(false);
  });

  it('travels on the heartbeat', () => {
    const parsed = HeartbeatRequestSchema.parse({
      version: '1',
      features: [],
      tools: [],
      active: [],
      load: { slots: 1, free: 1 },
      policy: { agents: ['Coder'], repos: ['github.com/acme/*'] },
    });
    expect(parsed.policy).toEqual({
      agents: ['Coder'],
      repos: ['github.com/acme/*'],
    });
  });
});
