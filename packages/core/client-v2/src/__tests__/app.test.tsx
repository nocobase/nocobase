/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, createMockClient, Plugin } from '@nocobase/client-v2';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

const renderApp = async (app: Application) => {
  const Root = app.getRootComponent();
  render(<Root />);
  expect(screen.getByText('Loading')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument());
  return Root;
};

describe('app', () => {
  it('should mount the app and display "Not Found"', async () => {
    const app = createMockClient();
    const element = document.createElement('div');
    act(() => app.mount(element));
    expect(element.textContent).toBe('Loading');
    await waitFor(() => expect(element.textContent).not.toBe('Loading'));
    expect(element.textContent).toBe('Not Found');
  });

  it('should render default "Not Found" view', async () => {
    const app = createMockClient();
    await renderApp(app);
    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });

  it('should render custom "Not Found" component', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({
      plugins: [PluginHelloClient],
      components: { AppNotFound: () => <div>Not Found2</div> },
    });
    await renderApp(app);
    expect(screen.getByText('Not Found2')).toBeInTheDocument();
  });

  it('should support app provider functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.app.use(() => <div>Hello Provider</div>);
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('Hello Provider')).toBeInTheDocument();
  });

  it('should support router functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', { path: '/', Component: () => <div>Hello Route</div> });
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('Hello Route')).toBeInTheDocument();
  });

  it('should show maintaining state', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({ plugins: [PluginHelloClient] });
    app.maintained = false;
    app.maintaining = true;
    await renderApp(app);
    expect(screen.getByText('Maintaining')).toBeInTheDocument();
  });

  it('should show maintained dialog state', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({ plugins: [PluginHelloClient] });
    app.maintained = true;
    app.maintaining = true;
    await renderApp(app);
    expect(screen.getByText('Maintaining Dialog')).toBeInTheDocument();
  });

  it('should handle long loading state gracefully', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
  });

  it('should handle WebSocket maintaining and running states', async () => {
    const originalLocation = window.location;
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload: reloadMock } });

    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', { path: '/', Component: () => <div>Hello</div> });
        this.app.ws.emit('message', {
          type: 'maintaining',
          payload: { code: 'APP_ERROR', message: 'maintaining error message' },
        });
      }
    }

    const app = createMockClient({
      plugins: [PluginHelloClient],
      ws: { url: 'ws://localhost:3000/ws' },
    });

    await renderApp(app);
    expect(screen.getByText('Maintaining')).toBeInTheDocument();

    app.ws.emit('message', {
      type: 'maintaining',
      payload: { code: 'APP_RUNNING', message: 'app running message' },
    });
    await waitFor(() => expect(screen.queryByText('Maintaining')).not.toBeInTheDocument());
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(reloadMock).toHaveBeenCalled();
  });

  it('should handle plugin load error gracefully', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        throw new Error('plugin load error');
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('plugin load error')).toBeInTheDocument();
  });
});
