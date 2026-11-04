// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({
  values: {} as Record<string, unknown>,
  writes: [] as [string, unknown][],
}));

vi.mock('@nocobase/app-client', () => {
  const api = {
    request: vi.fn(
      async (input: { path: string; method?: string; json?: unknown }) => {
        if (!input.method) return { data: { ...server.values } };
        const key = decodeURIComponent(input.path.split('/').at(-1) ?? '');
        const value = (input.json as { value: unknown }).value;
        server.values[key] = value;
        server.writes.push([key, value]);
        return { data: { value } };
      },
    ),
  };
  return { useApiClient: () => api, resolveAppBase: () => '/' };
});

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'ann' } } }),
}));

import {
  UserPreferenceStore,
  UserPreferencesClient,
  useUserPreference,
} from '../client/preferences.js';

const parseMode = (value: unknown) =>
  value === 'light' || value === 'dark' ? value : undefined;

describe('useUserPreference', () => {
  beforeEach(() => {
    server.values = {};
    server.writes = [];
    localStorage.clear();
  });

  it('paints from the cache, then takes the server’s value, and writes changes to the server', async () => {
    localStorage.setItem(
      'nocobase:user-preferences:/:ann',
      JSON.stringify({ 'theme.mode': 'light' }),
    );
    server.values['theme.mode'] = 'dark';
    const { result } = renderHook(() =>
      useUserPreference('theme.mode', {
        defaultValue: 'light',
        parse: parseMode,
      }),
    );
    expect(result.current[0]).toBe('light');
    await waitFor(() => expect(result.current[2].loaded).toBe(true));
    expect(result.current[0]).toBe('dark');

    act(() => result.current[1]('light'));
    expect(result.current[0]).toBe('light');
    await waitFor(() =>
      expect(server.writes).toContainEqual(['theme.mode', 'light']),
    );
    expect(
      JSON.parse(
        localStorage.getItem('nocobase:user-preferences:/:ann') ?? '{}',
      ),
    ).toEqual({ 'theme.mode': 'light' });
  });

  it('moves a value kept in the browser to the server once, when the server holds none', async () => {
    localStorage.setItem('old.chime', 'off');
    const legacy = () =>
      localStorage.getItem('old.chime') === 'off' ? false : undefined;
    const { result } = renderHook(() =>
      useUserPreference('inbox.chime', { defaultValue: true, legacy }),
    );
    await waitFor(() => expect(result.current[2].stored).toBe(true));
    expect(result.current[0]).toBe(false);
    expect(server.writes).toEqual([['inbox.chime', false]]);
  });
});

describe('preference request ordering', () => {
  it('does not let an old load replace a selection made while it was pending', async () => {
    let resolve!: (value: Record<string, unknown>) => void;
    const client = new UserPreferencesClient({} as never);
    vi.spyOn(client, 'list').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    vi.spyOn(client, 'set').mockResolvedValue();
    const store = new UserPreferenceStore(client, 'race');
    const loading = store.load();
    await store.set('i18n.locale', 'zh-CN');
    resolve({ 'i18n.locale': 'en-US' });
    await loading;
    expect(store.get('i18n.locale')).toBe('zh-CN');
  });
  it('waits for a write already pending before starting a new load', async () => {
    const client = new UserPreferencesClient({} as never);
    let release!: () => void;
    let saved = 'en-US';
    vi.spyOn(client, 'set').mockImplementation(async () => {
      await new Promise<void>((done) => {
        release = done;
      });
      saved = 'zh-CN';
    });
    const read = vi
      .spyOn(client, 'list')
      .mockImplementation(async () => ({ 'i18n.locale': saved }));
    const store = new UserPreferenceStore(client, 'pending-write');
    const writing = store.set('i18n.locale', 'zh-CN');
    const loading = store.load();
    await waitFor(() => expect(release).toBeDefined());
    expect(read).not.toHaveBeenCalled();
    release();
    await writing;
    await loading;
    expect(store.get('i18n.locale')).toBe('zh-CN');
  });
  it('serializes writes and refuses a queued write after its identity expires', async () => {
    const client = new UserPreferencesClient({} as never);
    let release!: () => void;
    const writes = vi
      .spyOn(client, 'set')
      .mockImplementationOnce(
        () =>
          new Promise<void>((done) => {
            release = done;
          }),
      )
      .mockResolvedValue(undefined);
    const store = new UserPreferenceStore(client, 'race-identity');
    let active = true;
    const first = store.set('i18n.locale', 'zh-CN');
    const second = store.set('i18n.locale', 'en-US', () => active);
    const rejected = second.catch((error: unknown) => error);
    await waitFor(() => expect(writes).toHaveBeenCalledOnce());
    active = false;
    release();
    await first;
    expect(await rejected).toMatchObject({
      message: 'The signed-in account changed.',
    });
    expect(writes).toHaveBeenCalledOnce();
  });
});
