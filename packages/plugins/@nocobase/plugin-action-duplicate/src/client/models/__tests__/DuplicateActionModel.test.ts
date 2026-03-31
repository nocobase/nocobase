/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateActionModel } from '../DuplicateActionModel';

describe('DuplicateActionModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.context.defineProperty('t', {
      value: (key: string) => `t:${key}`,
    });
    engine.registerModels({ DuplicateActionModel });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createModel = (props: Record<string, any> = {}) =>
    engine.createModel<DuplicateActionModel>({
      uid: 'duplicate-model',
      use: 'DuplicateActionModel',
      props,
    });

  it('dispatches quickCreateClick or openDuplicatePopup on click', () => {
    const model = createModel({ duplicateMode: 'quickDulicate' });
    const event = { type: 'click' } as any;

    const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);
    vi.spyOn(model, 'getInputArgs').mockReturnValue({ foo: 'bar' });

    model.onClick(event);

    expect(dispatchEvent).toHaveBeenCalledWith(
      'quickCreateClick',
      {
        event,
        foo: 'bar',
      },
      { debounce: true },
    );

    model.setProps({ duplicateMode: 'continueduplicate' });
    model.onClick(event);

    expect(dispatchEvent).toHaveBeenLastCalledWith(
      'openDuplicatePopup',
      {
        event,
        foo: 'bar',
      },
      { debounce: true },
    );
  });

  it('returns translated title while duplicating and falls back to default label', () => {
    const model = createModel({ title: 'Custom title' });

    model.duplicateLoading = true;
    expect(model.getTitle()).toBe('t:Duplicating');

    model.duplicateLoading = false;
    model.setProps({ title: '' });
    expect(model.getTitle()).toBe('t:Duplicate');
  });

  it('stores duplicate mode settings with normalized field selection', async () => {
    const model = createModel();
    const flow: any = model.getFlow('duplicateModeSettings');
    const step: any = flow.getStep('duplicateMode');
    const handler = step.serialize().handler;

    const setProps = vi.fn();
    const ctx: any = {
      model: {
        setProps,
      },
    };

    const params = {
      duplicateMode: 'continueduplicate',
      duplicateFields: { checked: ['title', 'status'] },
      collection: 'posts',
      treeData: [{ key: 'title' }],
    };

    await handler(ctx, params);

    expect(setProps).toHaveBeenCalledWith({
      duplicateMode: 'continueduplicate',
      duplicateFields: ['title', 'status'],
      duplicateCollection: 'posts',
      treeData: params.treeData,
    });
  });

  it('shows an error when duplicate fields are not configured', async () => {
    const model = createModel();
    const flow: any = model.getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;

    const ctx: any = {
      model: {
        props: {
          duplicateFields: [],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(ctx.message.error).toHaveBeenCalled();
    expect(String(ctx.message.error.mock.calls[0][0])).toContain(
      'Please configure the duplicate fields in duplicate mode configuration',
    );
  });

  it('creates a record from template data and toggles loading state', async () => {
    const flow: any = createModel({ duplicateFields: ['title', 'unknown'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;

    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };
    const blockResource = {
      create: vi.fn(async () => undefined),
    };

    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['title', 'unknown'],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      blockModel: {
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
        resource: blockResource,
      },
      record: {
        id: 100,
        __collection: 'posts',
        title: 'Origin',
      },
      collection: {
        fields: new Map([
          ['title', { name: 'title' }],
          ['status', { name: 'status' }],
        ]),
      },
      createResource: vi.fn(() => resource),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    const requestConfig = { headers: { 'x-test': '1' } };
    await handler(ctx, { requestConfig });

    expect(ctx.createResource).toHaveBeenCalled();
    expect(resource.setDataSourceKey).toHaveBeenCalledWith('main');
    expect(resource.setResourceName).toHaveBeenCalledWith('posts');
    expect(runAction).toHaveBeenCalledWith('get', {
      params: {
        filterByTk: 100,
        fields: ['title'],
        isTemplate: true,
      },
    });
    expect(blockResource.create).toHaveBeenCalledWith({ title: 'Copy' }, requestConfig);
    expect(ctx.message.success).toHaveBeenCalled();
    expect(ctx.model.duplicateLoading).toBe(false);
    expect(ctx.model.rerender).toHaveBeenCalledTimes(2);
  });

  it('delegates openView when popupTemplateUid is provided', async () => {
    const model = createModel({ duplicateFields: ['title'] });
    const flow: any = model.getFlow('popupSettings');
    const step: any = flow.getStep('openView');
    const handler = step.serialize().handler;

    vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);

    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };

    const ctx: any = {
      model,
      blockModel: {
        uid: 'view-uid',
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
      },
      record: {
        id: 100,
        __collection: 'posts',
      },
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => resource),
      runAction: vi.fn(async () => undefined),
      viewer: {
        open: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    const params = {
      popupTemplateUid: ' popup-uid ',
      uid: ' target-uid ',
      viewUid: 'custom-view',
      dataSourceKey: 'main',
      collectionName: 'posts',
    };

    await handler(ctx, params);

    expect(ctx.runAction).toHaveBeenCalledWith(
      'openView',
      expect.objectContaining({
        navigation: false,
        scene: 'new',
        formData: { title: 'Copy' },
        viewUid: 'custom-view',
        dataSourceKey: 'main',
        collectionName: 'posts',
        uid: 'target-uid',
      }),
    );
    expect(ctx.viewer.open).not.toHaveBeenCalled();
  });
});
