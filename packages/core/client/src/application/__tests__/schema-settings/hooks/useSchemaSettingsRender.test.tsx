/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, SchemaSettings, useSchemaSettingsRender } from '@nocobase/client';
import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';

describe('useSchemaSettingsRender', () => {
  async function createApp(DemoComponent: any) {
    const testSettings = new SchemaSettings({
      name: 'test',
      Component: (props) => <div {...props}>Test</div>,
      items: [],
    });

    const app = new Application({
      providers: [DemoComponent],
      schemaSettings: [testSettings],
      designable: true,
    });
    const Root = app.getRootComponent();
    render(<Root />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  }

  it('should return exists as false and render as null when name is not provided', async () => {
    const Demo = () => {
      const { exists, render } = useSchemaSettingsRender(undefined);

      return (
        <div>
          <div data-testid="exists">{JSON.stringify(exists)}</div>
          <div data-testid="render">{render()}</div>
        </div>
      );
    };
    await createApp(Demo);

    expect(screen.getByTestId('exists').textContent).toBe('false');
    expect(screen.getByTestId('render').textContent).toBe('');
  });

  it('should log an error if the initializer is not found', async () => {
    const consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    const Demo = () => {
      const { exists, render } = useSchemaSettingsRender('nonexistent');

      return (
        <div>
          <div data-testid="exists">{JSON.stringify(exists)}</div>
          <div data-testid="render">{render()}</div>
        </div>
      );
    };
    await createApp(Demo);

    expect(screen.getByTestId('exists').textContent).toBe('false');
    expect(screen.getByTestId('render').textContent).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[nocobase]: SchemaSettings "nonexistent" not found');

    consoleErrorSpy.mockRestore();
  });

  it('should render the settings component with name registered', async () => {
    const Demo = () => {
      const { exists, render } = useSchemaSettingsRender('test');

      return (
        <div>
          <div data-testid="exists">{JSON.stringify(exists)}</div>
          <div data-testid="render">{render()}</div>
        </div>
      );
    };
    await createApp(Demo);

    expect(screen.getByTestId('exists').textContent).toBe('true');
    expect(screen.getByTestId('render').textContent).toBe('Test');
  });

  it('should render custom options', async () => {
    const Demo = () => {
      const { render } = useSchemaSettingsRender('test', { componentProps: { className: 'test' } });

      return <div data-testid="render">{render()}</div>;
    };
    await createApp(Demo);

    expect(document.querySelector('.test')).toBeInTheDocument();
  });

  it('should override custom props', async () => {
    const Demo = () => {
      const { render } = useSchemaSettingsRender('test', { componentProps: { className: 'test' } });

      return <div data-testid="render">{render({ componentProps: { className: 'test2' } })}</div>;
    };
    await createApp(Demo);

    expect(document.querySelector('.test2')).toBeInTheDocument();
    expect(document.querySelector('.test')).not.toBeInTheDocument();
  });
});
