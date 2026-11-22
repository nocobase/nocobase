// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  classifyPluginRegistration,
  type PluginRegistrationFacts,
} from '../src/plugins/index.js';

const both = { client: true, server: true, cli: false };
const none = { client: false, server: false, cli: false };

const facts = (
  overrides: Partial<PluginRegistrationFacts>,
): PluginRegistrationFacts => ({
  dependencyField: 'dependencies',
  installed: true,
  entries: both,
  registered: both,
  ...overrides,
});

describe('classifyPluginRegistration', () => {
  it.each([
    ['registered', facts({}), 'registered', []],
    ['unregistered', facts({ registered: none }), 'unregistered', []],
    [
      'preinstalled',
      facts({ dependencyField: 'devDependencies', registered: none }),
      'preinstalled',
      [],
    ],
    [
      'registered from devDependencies',
      facts({ dependencyField: 'devDependencies' }),
      'inconsistent',
      ['REGISTERED_DEV_DEPENDENCY'],
    ],
    [
      'registered on the server only',
      facts({ registered: { client: false, server: true, cli: false } }),
      'inconsistent',
      ['PARTIALLY_REGISTERED'],
    ],
    [
      'registered on the client only',
      facts({ registered: { client: true, server: false, cli: false } }),
      'inconsistent',
      ['PARTIALLY_REGISTERED'],
    ],
    [
      'a client-only plugin',
      facts({
        entries: { client: true, server: false, cli: false },
        registered: { client: true, server: false, cli: false },
      }),
      'registered',
      [],
    ],
    [
      'a registration without its entry',
      facts({
        entries: { client: false, server: true, cli: false },
        registered: { client: false, server: true, cli: true },
      }),
      'inconsistent',
      ['CLI_ENTRY_UNEXPECTED'],
    ],
    [
      'not installed',
      facts({ installed: false, registered: none }),
      'inconsistent',
      ['PLUGIN_NOT_INSTALLED'],
    ],
    [
      'absent',
      facts({ installed: false, dependencyField: undefined, registered: none }),
      'absent',
      ['PLUGIN_NOT_INSTALLED', 'DEPENDENCY_MISSING'],
    ],
  ] as const)('classifies %s', (_name, input, state, codes) => {
    const result = classifyPluginRegistration(input);
    expect(result.state).toBe(state);
    expect(result.issues.map(({ code }) => code)).toEqual(codes);
    expect(result.skillsOnly).toBe(false);
  });

  it('treats a Skills-only plugin in dependencies as registered', () => {
    const result = classifyPluginRegistration(
      facts({ entries: none, registered: none }),
    );
    expect(result).toMatchObject({
      state: 'registered',
      enabled: false,
      skillsOnly: true,
      issues: [],
    });
  });

  it('keeps a Skills-only plugin in devDependencies preinstalled', () => {
    const result = classifyPluginRegistration(
      facts({
        dependencyField: 'devDependencies',
        entries: none,
        registered: none,
      }),
    );
    expect(result).toMatchObject({ state: 'preinstalled', skillsOnly: true });
  });
});
