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
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSColumnModel } from '../../blocks/table/JSColumnModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_fields',
  entryId: 'entry_phone',
  entryPath: 'src/client/js-fields/phone-link/index.tsx',
  kind: 'js-field',
};

function createColumnModel() {
  const engine = new FlowEngine();
  engine.registerModels({ JSColumnModel });
  const model = new JSColumnModel({
    uid: 'js-column-light-extension',
    flowEngine: engine,
    props: {
      width: 200,
      title: 'Phone',
    },
    stepParams: {
      jsSettings: {
        runJs: {
          sourceMode: 'light-extension',
          sourceBinding: SOURCE_BINDING,
          settings: {
            prefix: 'tel:',
          },
          code: 'ctx.render("inline");',
          version: 'v2',
        },
      },
    },
  } as never);

  engine.context.dataSourceManager.getDataSource('main').addCollection({
    name: 'contacts',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'phone', type: 'string', interface: 'input' },
    ],
  });
  model.context.defineProperty('collection', {
    value: engine.context.dataSourceManager.getCollection('main', 'contacts'),
  });
  model.context.defineProperty('collectionField', {
    value: {
      name: 'phone',
    },
  });

  return { engine, model };
}

describe('JSColumnModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('uses JS Field source binding fields in the column settings flow', () => {
    const { model } = createColumnModel();
    const flow = model.getFlow('jsSettings');

    expect(flow?.steps?.sourceMode?.useRawParams).toBe(true);
    expect(flow?.steps?.sourceMode?.uiSchema?.sourceMode?.['x-component']).toBe('JSFieldLightExtensionFullSourceField');
    expect(flow?.steps?.sourceMode?.uiSchema?.sourceMode?.['x-component-props']).toMatchObject({
      kind: 'js-field',
    });
    expect(flow?.steps?.sourceMode?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(flow?.steps?.sourceMode?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(flow?.steps?.sourceBinding?.hideInSettings).toBe(true);
    expect(flow?.steps?.sourceBinding?.uiSchema?.sourceBinding?.['x-component']).toBe(
      'JSFieldLightExtensionFullSourceField',
    );
    expect(flow?.steps?.sourceBinding?.uiSchema?.sourceBinding?.['x-component-props']).toMatchObject({
      kind: 'js-field',
    });
    expect(flow?.steps?.runJs?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
  });

  it('resolves JS Field entries with the current row value and record', async () => {
    const getSettingsDescriptor = vi.fn(async () => {
      throw new Error('settings descriptor should not be loaded during cell render');
    });
    const resolve = vi.fn((input) => ({
      code: `
ctx.render(
  <a data-testid={'phone-' + ctx.record.id} href={ctx.settings.prefix + ctx.value}>
    {ctx.record.name}:{ctx.value}:{ctx.collectionField.name}
  </a>
);
      `,
      version: 'v2',
      settings: {
        prefix: 'tel:',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor,
      resolve,
    });
    const { engine, model } = createColumnModel();
    const column = model.getColumnProps();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <div>
              {column.render('5551000', { id: 1, name: 'Ada', phone: '5551000' }, 0)}
              {column.render('5552000', { id: 2, name: 'Grace', phone: '5552000' }, 1)}
            </div>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('phone-1')).toHaveTextContent('Ada:5551000:phone');
      expect(screen.getByTestId('phone-2')).toHaveAttribute('href', 'tel:5552000');
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    );
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(getSettingsDescriptor).not.toHaveBeenCalled();
  });

  it('renders runtime errors in the failing cell without replacing neighboring cells', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({
        code: `
if (ctx.value === 'bad') {
  throw new Error('bad phone');
}
ctx.render(<span data-testid={'ok-' + ctx.record.id}>{ctx.value}</span>);
        `,
        version: 'v2',
      }),
    });
    const { engine, model } = createColumnModel();
    const column = model.getColumnProps();

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <div>
              {column.render('bad', { id: 1, name: 'Ada', phone: 'bad' }, 0)}
              {column.render('5552000', { id: 2, name: 'Grace', phone: '5552000' }, 1)}
            </div>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('js-column-runtime-error')).toHaveTextContent('bad phone');
      expect(screen.getByTestId('ok-2')).toHaveTextContent('5552000');
    });
  });
});
