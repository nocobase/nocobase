import { describe, expect, it, vi } from 'vitest';
import { objectProvider } from '@nocobase/config/providers/object';
import { AppConfig, defineAppConfig, envString } from '../src/config/index.js';

describe('notification configuration aliases', () => {
  it.each([
    { type: 'in-app' },
    { provider: 'in-app' },
    { type: 'in-app', provider: 'in-app' },
  ])('exposes both aliases to application readers for %j', async (channel) => {
    const input = { notification: { channels: { inbox: channel } } };
    const config = new AppConfig().load(objectProvider(input));
    await config.loadAll();

    expect(config.get('notification.channels.inbox.type')).toBe('in-app');
    expect(config.get('notification.channels.inbox.provider')).toBe('in-app');
    const expected = {
      notification: {
        channels: { inbox: { type: 'in-app', provider: 'in-app' } },
      },
    };
    expect(config.raw()).toEqual(expected);
    expect(config.get('notification')).toEqual(expected.notification);
    expect(config.layers()).toEqual({ defaults: {}, overrides: input });
  });

  it('normalizes merged defaults without changing source layers or unrelated configuration', async () => {
    const defaults = {
      notification: {
        channels: {
          inbox: { provider: 'in-app', enabled: false },
          email: { type: 'smtp', host: 'localhost', port: 25 },
          placeholder: { enabled: false },
        },
      },
      custom: { channels: { inbox: { type: 'in-app' } } },
    };
    const overrides = {
      notification: { channels: { inbox: { enabled: true } } },
    };
    const config = new AppConfig().load(objectProvider(overrides));
    await config.loadAll();
    config.mergeDefaults(defaults);
    expect(config.get('notification.channels')).toEqual({
      inbox: { type: 'in-app', provider: 'in-app', enabled: true },
      email: { type: 'smtp', provider: 'smtp', host: 'localhost', port: 25 },
      placeholder: { enabled: false },
    });
    expect(config.get('custom')).toEqual(defaults.custom);
    expect(config.layers()).toEqual({ defaults, overrides });
  });

  it('recomputes aliases for environment changes and reload subscribers without retaining stale aliases', async () => {
    const config = new AppConfig();
    await config.loadAll();
    config.mergeDefaults({
      notification: { channels: { inbox: { type: 'in-app' } } },
    });
    const declaration = defineAppConfig({
      defaults: { channels: {} },
      env: { TEST_CHANNEL_TYPE: envString('channels.inbox.type') },
    });
    config.defineSections(new Map([['notification', declaration.rules!]]));
    const environment: Record<string, string | undefined> = {
      TEST_CHANNEL_TYPE: 'custom',
    };
    await config.loadSectionEnvironment(environment);
    expect(config.get('notification.channels.inbox')).toEqual({
      type: 'custom',
      provider: 'custom',
    });
    const listener = vi.fn();
    config.subscribe('notification', listener);
    delete environment.TEST_CHANNEL_TYPE;
    expect(await config.reload()).toEqual({
      changedNamespaces: ['notification'],
    });
    expect(listener).toHaveBeenCalledExactlyOnceWith({
      previous: { channels: { inbox: { type: 'custom', provider: 'custom' } } },
      current: { channels: { inbox: { type: 'in-app', provider: 'in-app' } } },
    });
    expect(await config.reload()).toEqual({ changedNamespaces: [] });
    expect(listener).toHaveBeenCalledOnce();
  });

  it.each([
    null,
    [],
    'invalid',
    { inbox: null },
    { inbox: { type: ' in-app ' } },
    { inbox: { provider: 1 } },
  ])(
    'preserves malformed channel input for validation: %j',
    async (channels) => {
      const source = { notification: { channels } };
      const config = new AppConfig().load(objectProvider(source));
      await config.loadAll();
      expect(config.raw()).toEqual(source);
    },
  );
});
