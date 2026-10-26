import { createApp } from '../../client/app.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { createElement, type PropsWithChildren } from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSidebarPreferenceStore,
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
  useSidebarPreference,
} from '../../client/layouts/use-sidebar-preference.js';
import {
  SidebarProvider,
  useSidebar,
} from '../../client/components/ui/sidebar.js';

const key = 'nocobase:sidebar:collapsed:app:/main';
function wrapper(store: ReturnType<typeof createSidebarPreferenceStore>) {
  return function PreferenceWrapper({ children }: PropsWithChildren) {
    return createElement(SidebarPreferenceProvider, { value: store }, children);
  };
}
function hook(scope = 'app:/main') {
  return renderHook(() => useSidebarPreference(), {
    wrapper: wrapper(createSidebarPreferenceStore(scope)),
  });
}

describe('application sidebar preference', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shares changes across layouts and restores them after remount', () => {
    const first = hook();
    const second = hook();
    expect(first.result.current[0]).toBe(false);
    act(() => first.result.current[1]((value) => !value));
    expect(second.result.current[0]).toBe(true);
    expect(localStorage.getItem(key)).toBe('true');
    first.unmount();
    second.unmount();
    const restored = hook();
    expect(restored.result.current[0]).toBe(true);
    act(() => restored.result.current[1](false));
    expect(localStorage.getItem(key)).toBe('false');
  });

  it('follows its own cross-tab events and clear, ignoring other application keys', () => {
    localStorage.setItem(key, 'true');
    const { result } = hook();
    expect(result.current[0]).toBe(true);
    act(() => {
      localStorage.removeItem(key);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'nocobase:sidebar:collapsed:app:/other',
        }),
      );
    });
    expect(result.current[0]).toBe(true);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key })));
    expect(result.current[0]).toBe(false);
    act(() => {
      localStorage.setItem(key, 'true');
      window.dispatchEvent(new StorageEvent('storage', { key }));
    });
    expect(result.current[0]).toBe(true);
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(result.current[0]).toBe(false);
  });

  it.each(['false', 'invalid'])(
    'defaults to expanded for stored %s',
    (value) => {
      localStorage.setItem(key, value);
      expect(hook().result.current[0]).toBe(false);
    },
  );

  it('does not migrate the old shared preference', () => {
    localStorage.setItem('nocobase:sidebar:collapsed', 'true');
    expect(hook().result.current[0]).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('isolates Studio and multiple applications, including an application named studio', () => {
    const scopes = ['studio', 'app:/studio', 'app:/a', 'app:/b'];
    const hooks = scopes.map((scope) => hook(scope));
    hooks.forEach((item, index) => {
      act(() => item.result.current[1](true));
      hooks.forEach((other, otherIndex) =>
        expect(other.result.current[0]).toBe(otherIndex <= index),
      );
      scopes.forEach((scope, otherIndex) =>
        expect(
          localStorage.getItem(`nocobase:sidebar:collapsed:${scope}`),
        ).toBe(otherIndex <= index ? 'true' : null),
      );
    });
    act(() => hooks[0].result.current[1](false));
    expect(hooks.map((item) => item.result.current[0])).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });

  it('isolates memory fallback when storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const store = createSidebarPreferenceStore('app:/blocked');
    const first = renderHook(() => useSidebarPreference(), {
      wrapper: wrapper(store),
    });
    const second = renderHook(() => useSidebarPreference(), {
      wrapper: wrapper(store),
    });
    const other = hook('app:/other');
    act(() => first.result.current[1](true));
    expect(second.result.current[0]).toBe(true);
    expect(other.result.current[0]).toBe(false);
    act(() => other.result.current[1](true));
    act(() => first.result.current[1](false));
    expect(second.result.current[0]).toBe(false);
    expect(other.result.current[0]).toBe(true);
  });

  it('does not write a shared cookie when the real SidebarProvider toggles', () => {
    const cookie = vi.spyOn(document, 'cookie', 'set');
    function Toggle() {
      const { toggleSidebar, state } = useSidebar();
      return <button onClick={toggleSidebar}>{state}</button>;
    }
    render(
      <SidebarProvider>
        <Toggle />
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'expanded' }));
    expect(
      screen.getByRole('button', { name: 'collapsed' }),
    ).toBeInTheDocument();
    expect(cookie).not.toHaveBeenCalled();
  });
});

describe('runtime sidebar scope', () => {
  it.each(['', '/', '///', 'a', '/a/', '/Team/Nested///'])(
    'normalizes only boundary slashes for %s',
    (basename) => {
      localStorage.clear();
      const store = createAppSidebarPreferenceStore(basename);
      store.setCollapsed(true);
      const normalized = '/' + basename.replace(/^\/+|\/+$/g, '');
      expect(
        localStorage.getItem(`nocobase:sidebar:collapsed:app:${normalized}`),
      ).toBe('true');
    },
  );

  it('provides stable, independent stores from each actual runtime basename', async () => {
    localStorage.clear();
    async function application(basename: string) {
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          serviceProviders: [],
          reactProviders: [],
          routes: [],
          plugins: defineClientPlugins([]),
        }),
        { rawConfig: { app: { basePath: basename } } },
      );
      const app = createApp(runtime);
      await app.start();
      return app;
    }
    const a = await application('/studio');
    const b = await application('/Team/Nested');
    try {
      const providerA = a.renderConfig.reactProviders![1];
      const providerB = b.renderConfig.reactProviders![1];
      const first = renderHook(() => useSidebarPreference(), {
        wrapper: providerA,
      });
      const second = renderHook(() => useSidebarPreference(), {
        wrapper: providerA,
      });
      const other = renderHook(() => useSidebarPreference(), {
        wrapper: providerB,
      });
      act(() => first.result.current[1](true));
      expect(second.result.current[0]).toBe(true);
      expect(other.result.current[0]).toBe(false);
      expect(
        localStorage.getItem('nocobase:sidebar:collapsed:app:/studio'),
      ).toBe('true');
      act(() => other.result.current[1](true));
      expect(
        localStorage.getItem('nocobase:sidebar:collapsed:app:/Team/Nested'),
      ).toBe('true');
      first.unmount();
      second.unmount();
      other.unmount();
    } finally {
      await a.shutdown();
      await b.shutdown();
    }
  });
});
