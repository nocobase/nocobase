import { render, screen } from '@testing-library/react';
import {
  createContext,
  createElement,
  useContext,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { describe, expect, it } from 'vitest';

import { ClientApplicationContext } from '../src/application-context.js';
import type { ClientApplication } from '../src/application.js';
import { createAppClientConfig } from '../src/config.js';
import {
  AppAsideOutlet,
  AppLayoutProviders,
  defineLayoutExtensions,
} from '../src/layout-extensions.js';
import { defineClientPlugin, defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const PanelContext = createContext('closed');

function PanelProvider({ children }: PropsWithChildren): ReactElement {
  return createElement(PanelContext.Provider, { value: 'open' }, children);
}
function PanelAside(): ReactElement {
  return createElement('aside', null, `panel ${useContext(PanelContext)}`);
}
function Page(): ReactElement {
  return createElement('main', null, `page sees ${useContext(PanelContext)}`);
}

const assistant = defineClientPlugin({
  packageName: '@example/assistant',
  layoutExtensions: [
    { name: 'assistant', provider: PanelProvider, aside: PanelAside },
  ],
});

async function runtimeOf(plugins = [assistant()]) {
  return resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      plugins: defineClientPlugins(plugins),
    }),
    { rawConfig: {} },
  );
}

describe('layout extensions', () => {
  it('wraps the layout in the plugin providers and renders their asides beside the content', async () => {
    const runtime = await runtimeOf();
    expect(
      runtime.layoutExtensions?.map(({ name, packageName }) => ({
        name,
        packageName,
      })),
    ).toEqual([{ name: 'assistant', packageName: '@example/assistant' }]);
    render(
      createElement(
        ClientApplicationContext.Provider,
        { value: { runtime } as unknown as ClientApplication },
        createElement(
          AppLayoutProviders,
          null,
          createElement(Page),
          createElement(AppAsideOutlet),
        ),
      ),
    );
    expect(screen.getByRole('main').textContent).toBe('page sees open');
    expect(screen.getByRole('complementary').textContent).toBe('panel open');
  });

  it('renders the layout alone without extensions or outside an application', () => {
    render(
      createElement(
        AppLayoutProviders,
        null,
        createElement(Page),
        createElement(AppAsideOutlet),
      ),
    );
    expect(screen.getByRole('main').textContent).toBe('page sees closed');
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('refuses an unnamed, empty or duplicate extension', async () => {
    expect(() =>
      defineLayoutExtensions([{ name: ' ', aside: Page }]),
    ).toThrow();
    expect(() => defineLayoutExtensions([{ name: 'empty' }])).toThrow(
      /provider, an aside or both/u,
    );
    const again = defineClientPlugin({
      packageName: '@example/again',
      layoutExtensions: [{ name: 'assistant', aside: Page }],
    });
    await expect(runtimeOf([assistant(), again()])).rejects.toThrow(
      /already registered by "@example\/assistant"/u,
    );
  });
});
