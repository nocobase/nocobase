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
  return { useApiClient: () => api };
});

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'ann' } } }),
}));

import { useUserPreference } from '../client/preferences.js';

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
      'nocobase:user-preferences:ann',
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
      JSON.parse(localStorage.getItem('nocobase:user-preferences:ann') ?? '{}'),
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
