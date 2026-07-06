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
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { JSBlockModel, RunJSSourceResolverRegistry } from '@nocobase/client-v2';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block',
  publicationId: 'pub_sales',
  versionPolicy: 'pinned',
};

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

describe('JS block resolver neighbor isolation', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('does not block adjacent inline JS blocks while an external source is loading', async () => {
    const deferred = createDeferred<{ code: string; version: string }>();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => deferred.promise,
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const external = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'external-js-block',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
            settings: {},
            version: 'v2',
          },
        },
      },
    });
    const inline = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'inline-js-block',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render(<span data-testid="inline-neighbor">inline neighbor</span>);',
            version: 'v2',
          },
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={external} />
            <FlowModelRenderer model={inline} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('inline-neighbor')).toHaveTextContent('inline neighbor');
    });

    deferred.resolve({
      code: 'ctx.render(<span data-testid="external-neighbor">external</span>);',
      version: 'v2',
    });

    await waitFor(() => {
      expect(screen.getByTestId('external-neighbor')).toHaveTextContent('external');
    });
  });
});
