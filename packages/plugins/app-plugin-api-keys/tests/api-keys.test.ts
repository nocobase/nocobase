// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { apiKey } from '../server/api-keys.js';

type Plugin = ReturnType<typeof apiKey>;
type BeforeHook = NonNullable<NonNullable<Plugin['hooks']>['before']>[number];
type MatcherContext = Parameters<BeforeHook['matcher']>[0];

/**
 * The plugin does not expose its resolved options, but its `before` hook only
 * matches a key-bearing request when `enableSessionForAPIKeys` is on — which
 * is also the behaviour that matters: no match, no session, 401.
 */
function resolvesKeys(plugin: Plugin): boolean {
  const hook = plugin.hooks?.before?.[0];
  if (!hook) throw new Error('The plugin declares no before hook.');
  return hook.matcher({
    path: '/get-session',
    headers: new Headers({ 'x-api-key': 'a-key' }),
  } as unknown as MatcherContext);
}

describe('apiKey', () => {
  it('defaults every configuration to 100-character names and preserves application overrides', () => {
    expect(apiKey().options.configurations[0]?.maximumNameLength).toBe(100);
    expect(
      apiKey([
        { configId: 'default' },
        { configId: 'short', maximumNameLength: 12 },
      ]).options.configurations.map((item) => item.maximumNameLength),
    ).toEqual([100, 12]);
    expect(
      apiKey({ maximumNameLength: 150 }).options.configurations[0]
        ?.maximumNameLength,
    ).toBe(150);
  });

  it('accepts isolated configurations while retaining the default user-key behavior', () => {
    expect(
      resolvesKeys(
        apiKey([
          { configId: 'default' },
          { configId: 'integration', enableSessionForAPIKeys: false },
        ]),
      ),
    ).toBe(true);
    expect(
      resolvesKeys(
        apiKey([{ configId: 'integration', enableSessionForAPIKeys: false }]),
      ),
    ).toBe(false);
    expect(() =>
      apiKey([{ configId: 'same' }, { configId: 'same' }]),
    ).toThrow();
  });

  it('turns a key into a session, which Better Auth does not do by default', () => {
    expect(resolvesKeys(apiKey())).toBe(true);
  });

  it('lets an application take that back', () => {
    expect(resolvesKeys(apiKey({ enableSessionForAPIKeys: false }))).toBe(
      false,
    );
  });

  it('leaves rate limiting off, and forwards a quota that is asked for', () => {
    const fields = apiKey({
      rateLimit: { enabled: true, maxRequests: 500, timeWindow: 60_000 },
    }).schema?.apikey?.fields;

    expect(fields?.rateLimitMax?.defaultValue).toBe(500);
    expect(fields?.rateLimitTimeWindow?.defaultValue).toBe(60_000);
  });

  it('mounts the endpoints Better Auth mounts, under its id', () => {
    expect(apiKey().id).toBe('api-key');
    expect(Object.keys(apiKey().endpoints ?? {})).toEqual(
      expect.arrayContaining([
        'createApiKey',
        'listApiKeys',
        'deleteApiKey',
        'updateApiKey',
      ]),
    );
  });
});
