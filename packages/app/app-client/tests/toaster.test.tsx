import { ServiceProvider } from '@nocobase/service-provider';
import { renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClientApplication } from '../src/application.js';
import { ClientApplicationContext } from '../src/application-context.js';
import {
  createAppClientConfig,
  defineAppClientRenderConfig,
} from '../src/config.js';
import {
  resolveToaster,
  toasterToken,
  useToaster,
  type Toaster,
} from '../src/index.js';
import { defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const applications: ClientApplication[] = [];

async function startApplication(toaster?: Toaster): Promise<ClientApplication> {
  class ToasterProvider extends ServiceProvider<ClientApplication> {
    public readonly name: string = '@example/toaster';

    public override register(): void {
      if (toaster) this.app.container.instance(toasterToken, toaster);
    }
  }

  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      serviceProviders: [ToasterProvider],
      plugins: defineClientPlugins([]),
    }),
    { rawConfig: { api: { baseURL: '/api' } } },
  );
  const app = new ClientApplication({
    runtime,
    createRenderConfig: () => defineAppClientRenderConfig({ routes: null }),
  });
  await app.start();
  applications.push(app);
  return app;
}

function inside(app: ClientApplication) {
  return function Wrapper({
    children,
  }: {
    readonly children: ReactNode;
  }): ReactElement {
    return (
      <ClientApplicationContext.Provider value={app}>
        {children}
      </ClientApplicationContext.Provider>
    );
  };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(applications.splice(0).map((app) => app.shutdown()));
});

describe('toaster', () => {
  it('returns the toaster the application registered, the same one on every render', async () => {
    const toaster: Toaster = { show: vi.fn(() => 'shown'), close: vi.fn() };
    const app = await startApplication(toaster);

    const { result, rerender } = renderHook(() => useToaster(), {
      wrapper: inside(app),
    });
    const first = result.current;
    rerender();

    expect(first).toBe(toaster);
    expect(result.current).toBe(first);
    expect(resolveToaster(app.services)).toBe(toaster);
  });

  // The only test here that shows a toast without a registered toaster, so the explanation is its own.
  it('shows nothing and logs each toast, rather than throwing, when no toaster is registered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const app = await startApplication();

    const inApplication = renderHook(() => useToaster(), {
      wrapper: inside(app),
    }).result.current;
    const outsideApplication = renderHook(() => useToaster()).result.current;

    expect(outsideApplication).toBe(inApplication);
    expect(resolveToaster(app.services)).toBe(inApplication);
    expect(
      inApplication.show({ id: 'saved', type: 'success', title: 'Saved' }),
    ).toBe('saved');
    const first = inApplication.show({
      title: 'Saved',
      description: 'All changes are stored.',
    });
    const second = outsideApplication.show({
      type: 'error',
      title: 'Unable to save',
    });
    expect(first).not.toBe(second);
    expect(() => inApplication.close(first)).not.toThrow();

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('toasterToken'),
      'Saved',
    );
    expect(warn).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining('toasterToken'),
      'Saved',
      'All changes are stored.',
    );
    expect(error).toHaveBeenCalledExactlyOnceWith(
      expect.not.stringContaining('toasterToken'),
      'Unable to save',
    );
  });
});
