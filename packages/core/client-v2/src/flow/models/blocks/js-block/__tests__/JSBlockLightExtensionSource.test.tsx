/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry } from '../../../../components/runjs-source';
import { PluginFlowEngine } from '../../../../index';
import { createMockClient } from '../../../../../MockApplication';
import { JSBlockModel } from '../JSBlock';
import { JSBlockSourceModeField } from '../JSBlockSourceModeField';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block',
  publicationId: 'pub_sales',
  versionPolicy: 'pinned',
};

function renderJSBlock(stepParams: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSBlockModel });
  const model = engine.createModel<JSBlockModel>({
    use: 'JSBlockModel',
    uid: `js-block-${Math.random()}`,
    stepParams: {
      jsSettings: {
        runJs: stepParams,
      },
    },
  });

  render(
    <FlowEngineProvider engine={engine}>
      <ConfigProvider>
        <App>
          <FlowModelRenderer model={model} />
        </App>
      </ConfigProvider>
    </FlowEngineProvider>,
  );

  return model;
}

describe('JSBlockModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('registers a core fallback source field when the light extension plugin is not loaded', async () => {
    const app = createMockClient({
      ws: false,
      plugins: [
        [
          PluginFlowEngine,
          {
            name: 'flow-engine',
          },
        ],
      ],
    });

    await app.load();

    expect(app.flowEngine.flowSettings.components.JSBlockLightExtensionSourceField).toBe(JSBlockSourceModeField);
  });

  it('resolves external source through the RunJS source registry', async () => {
    const resolve = vi.fn(() => ({
      code: 'ctx.render(<span data-testid="external-js-block">{ctx.settings.title}:{ctx.runJsSource.context.lightExtension.publicationId}</span>);',
      version: 'v2',
      settings: {
        title: 'Sales KPI',
      },
      context: {
        lightExtension: {
          publicationId: 'pub_sales',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        title: 'Ignored before resolver normalization',
      },
      code: 'ctx.render(<span data-testid="inline-js-block">inline</span>);',
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('external-js-block')).toHaveTextContent('Sales KPI:pub_sales');
    });
    expect(screen.queryByTestId('inline-js-block')).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    );
  });

  it('renders resolver failures in the current block shell', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status: 404,
            data: {
              errors: [
                {
                  code: 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
                  message: 'Publication missing',
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent('Publication missing');
    });
  });

  it.each([
    [
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      409,
      'Light extension binding is outdated',
      'Refresh the block settings and choose the current active publication.',
    ],
    [
      'LIGHT_EXTENSION_SETTINGS_INVALID',
      422,
      'Light extension settings are invalid',
      'Open the block settings and fix the light extension settings.',
    ],
    [
      'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
      404,
      'Light extension publication missing',
      'Choose an available publication or publish this entry again.',
    ],
    [
      'LIGHT_EXTENSION_FORBIDDEN',
      403,
      'Light extension access denied',
      'Ask an administrator for permission to use this light extension publication.',
    ],
    [
      'LIGHT_EXTENSION_REPO_ARCHIVED',
      409,
      'Light extension repository is archived',
      'Restore the repository or choose a publication from another repository.',
    ],
  ])('renders an actionable hint for %s errors', async (code, status, title, hint) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status,
            data: {
              errors: [
                {
                  code,
                  message: code,
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(title);
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(hint);
    });
  });

  it.each([
    [403, 'Light extension access denied'],
    [404, 'Light extension publication missing'],
  ])('renders status-only %s resolver failures with light-extension hints', async (status, title) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw {
          response: {
            status,
            data: {
              errors: [
                {
                  message: 'Request failed',
                },
              ],
            },
          },
        };
      },
    });

    renderJSBlock({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {},
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent(title);
      expect(screen.getByTestId('js-block-runtime-error')).toHaveTextContent('Request failed');
    });
  });
});
