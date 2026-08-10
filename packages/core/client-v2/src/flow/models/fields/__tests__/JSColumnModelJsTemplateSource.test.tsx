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
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSColumnModel } from '../../blocks/table/JSColumnModel';

const SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_fields',
  templateId: 'jtt_phone',
  kind: 'js-field',
};

function createColumnModel() {
  const engine = new FlowEngine();
  engine.registerModels({ JSColumnModel });
  const model = new JSColumnModel({
    uid: 'js-column-js-template',
    flowEngine: engine,
    props: {
      width: 200,
      title: 'Phone',
    },
    stepParams: {
      jsSettings: {
        runJs: {
          sourceMode: 'js-template',
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

setupRunJSTestHosts();

describe('JSColumnModel JS Template source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
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
      sourceMode: 'js-template',
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
        sourceMode: 'js-template',
        sourceBinding: SOURCE_BINDING,
      }),
    );
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(getSettingsDescriptor).not.toHaveBeenCalled();
  });

  it('renders runtime errors in the failing cell without replacing neighboring cells', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
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
