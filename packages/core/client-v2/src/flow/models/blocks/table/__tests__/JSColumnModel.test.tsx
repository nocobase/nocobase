/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { RunJSSourceResolverRegistry } from '../../../../components/runjs-source';
import { JSColumnModel } from '../JSColumnModel';

setupRunJSTestHosts();

describe('JSColumnModel', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('declares current record metadata before rendering any row', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSColumnModel });
    const model = engine.createModel<JSColumnModel>({
      use: 'JSColumnModel',
      uid: 'js-column-record-meta',
      props: {
        width: 200,
        title: 'JS column',
      },
    });

    engine.context.dataSourceManager.getDataSource('main').addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'age', type: 'integer', interface: 'integer' },
      ],
    });

    const collection = engine.context.dataSourceManager.getCollection('main', 'users');
    model.context.defineProperty('collection', {
      value: collection,
    });

    const recordNode = model.context.getPropertyMetaTree().find((node) => node.name === 'record');
    const recordFields =
      typeof recordNode?.children === 'function' ? await recordNode.children() : recordNode?.children || [];

    expect(model.context.record).toBeUndefined();
    expect(recordNode).toMatchObject({
      name: 'record',
      title: 'Current record',
      paths: ['record'],
    });
    expect(recordFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', paths: ['record', 'id'] }),
        expect.objectContaining({ name: 'age', paths: ['record', 'age'] }),
      ]),
    );
  });

  it('changes renderer key and invalidates beforeRender cache when row content changes', () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSColumnModel });
    const model = engine.createModel<JSColumnModel>({
      use: 'JSColumnModel',
      uid: 'js-column-row-refresh',
      props: {
        width: 200,
        title: 'JS column',
      },
    });

    engine.context.dataSourceManager.getDataSource('main').addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'age', type: 'integer', interface: 'integer' },
        { name: 'workyears', type: 'float', interface: 'number' },
      ],
    });

    const collection = engine.context.dataSourceManager.getCollection('main', 'users');
    model.context.defineProperty('collection', {
      value: collection,
    });

    const column = model.getColumnProps();
    const firstRecord = { id: 1, age: 3, workyears: 39.2 };
    const first = column.render(null, firstRecord, 0) as any;
    const fork = model.getFork('1') as any;
    const invalidateFlowCache = vi.fn();
    fork.invalidateFlowCache = invalidateFlowCache;
    const second = column.render(null, { id: 1, age: 37, workyears: 39.2 }, 0) as any;

    expect(fork.context.record).toEqual({ id: 1, age: 37, workyears: 39.2 });
    expect(first.key).not.toBe(second.key);
    expect(invalidateFlowCache).toHaveBeenCalledWith('beforeRender');
  });

  it('waits for the real mounted-fork runtime chain and rejects with the first preview failure', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSColumnModel });
    const model = engine.createModel<JSColumnModel>({
      use: 'JSColumnModel',
      uid: 'js-column-preview-failure',
      props: {
        width: 200,
        title: 'JS column',
      },
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_preview',
              templateId: 'jtt_preview',
              kind: 'js-field',
            },
            version: 'v2',
          },
        },
      },
    });
    const resolvedFork = model.createFork({}, 'resolved-row');
    const rejectedFork = model.createFork({}, 'rejected-row');
    let resolvePendingSource: ((value: { code: string; version: string }) => void) | undefined;
    const pendingSource = new Promise<{ code: string; version: string }>((resolve) => {
      resolvePendingSource = resolve;
    });
    const rejection = new Error('fork preview failed');
    const resolve = vi
      .fn()
      .mockImplementationOnce(() => pendingSource)
      .mockRejectedValueOnce(rejection);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve,
    });
    resolvedFork.context.ref.current = document.createElement('div');
    rejectedFork.context.ref.current = document.createElement('div');

    const preview = {
      code: 'ctx.render("preview");',
      version: 'v2',
    };

    const masterPreview = model.applyFlow('jsSettings', { preview });
    let settled = false;
    const observedPreview = masterPreview
      .then(() => {
        settled = true;
      })
      .catch(() => {
        settled = true;
      });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    resolvePendingSource?.({ code: 'ctx.render("resolved");', version: 'v2' });
    await expect(masterPreview).rejects.toBe(rejection);
    await observedPreview;
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(rejectedFork.context.ref.current.querySelector('[data-testid="js-column-runtime-error"]')).toHaveTextContent(
      'fork preview failed',
    );
  });
});
