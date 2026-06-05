/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowExitAllException } from '@nocobase/flow-engine';
import { FlowPage } from '../../FlowPage';
import { openView } from '../openView';

const createCtx = (inputArgs: any = {}) => {
  const engine = {
    getModel: vi.fn(),
    context: { themeToken: { colorBgLayout: '#fff' } },
  } as any;

  const ctx: any = {
    inputArgs,
    engine,
    model: {
      uid: 'popup-action-uid',
      context: { inputArgs: {} },
      flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
    },
    layoutContentElement: {},
    view: {},
    viewer: {
      open: vi.fn(async (_opts: any) => undefined),
    },
  };

  return { ctx, engine };
};

const createPageModel = (overrides: any = {}) => {
  const modalConfirm = vi.fn();
  const dispatchEvent = vi.fn().mockResolvedValue(undefined);
  const pageModel: any = {
    uid: 'page-model-uid',
    subModels: {},
    context: {
      defineProperty: vi.fn(),
      defineMethod: vi.fn(),
      modal: { confirm: modalConfirm },
      t: vi.fn((value: string) => value),
    },
    dispatchEvent,
    invalidateFlowCache: vi.fn(),
    _rerunLastAutoRun: vi.fn(),
    ...overrides,
  };

  pageModel.context = {
    defineProperty: vi.fn(),
    defineMethod: vi.fn(),
    modal: { confirm: modalConfirm },
    t: vi.fn((value: string) => value),
    ...(overrides.context || {}),
  };

  if (overrides.dispatchEvent) {
    pageModel.dispatchEvent = overrides.dispatchEvent;
  }

  return pageModel;
};

const openAndLoad = async (pageModel: any, inputArgs: any = {}) => {
  const { ctx } = createCtx(inputArgs);

  let capturedContent: any;
  (ctx.viewer.open as any).mockImplementation(async (opts: any) => {
    capturedContent = opts.content;
    return undefined;
  });

  await openView.handler(ctx, {});

  const currentView: any = {
    destroy: vi.fn(),
    update: vi.fn(),
  };
  const element = capturedContent(currentView);

  expect(element.type).toBe(FlowPage);
  element.props.onModelLoaded(pageModel.uid, pageModel);

  return { currentView, pageModel };
};

describe('openView action - close behavior', () => {
  it('dispatches close with clean dirty state when no form was modified', async () => {
    const pageModel = createPageModel();
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ result: 'done', force: false });

    expect(allowed).toBe(true);
    expect(pageModel.context.modal.confirm).not.toHaveBeenCalled();
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        result: 'done',
        force: false,
        dirty: {
          hasDirtyForms: false,
          formModelUids: [],
        },
        controller: expect.any(Object),
      }),
    );
  });

  it('passes dirty form info into close event payload', async () => {
    const pageModel = createPageModel({
      subModels: {
        items: [
          {
            uid: 'dirty-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['title']),
          },
        ],
      },
    });
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(true);
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['dirty-form-uid'],
        },
      }),
    );
  });

  it('allows callers to ignore already confirmed dirty forms', async () => {
    const ignoredReset = vi.fn();
    const remainingReset = vi.fn();
    const pageModel = createPageModel({
      subModels: {
        items: [
          {
            uid: 'ignored-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['title']),
            resetUserModifiedFields: ignoredReset,
          },
          {
            uid: 'remaining-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['nickname']),
            resetUserModifiedFields: remainingReset,
          },
        ],
      },
    });
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({
      force: false,
      ignoredDirtyFormModelUids: ['ignored-form-uid'],
    });

    expect(allowed).toBe(true);
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['remaining-form-uid'],
        },
      }),
    );
    expect(ignoredReset).not.toHaveBeenCalled();
    expect(remainingReset).toHaveBeenCalledTimes(1);
  });

  it('allows dynamic close flows to prevent closing after confirmation', async () => {
    const resetUserModifiedFields = vi.fn();
    const dispatchEvent = vi.fn().mockImplementation(async (_eventName: string, inputArgs: any) => {
      inputArgs.controller.prevent();
    });
    const pageModel = createPageModel({
      subModels: {
        items: [
          {
            uid: 'dirty-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['title']),
            resetUserModifiedFields,
          },
        ],
      },
      dispatchEvent,
    });
    pageModel.context.modal.confirm.mockResolvedValue(true);
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['dirty-form-uid'],
        },
        controller: expect.any(Object),
      }),
    );
    expect(resetUserModifiedFields).not.toHaveBeenCalled();
  });

  it('blocks closing when a close flow exits via ctx.exit()', async () => {
    const abortedResults: any[] = [];
    Object.defineProperty(abortedResults, '__abortedByExitAll', {
      value: true,
      configurable: true,
    });
    const pageModel = createPageModel({
      dispatchEvent: vi.fn().mockResolvedValue(abortedResults),
    });
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(false);
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        controller: expect.any(Object),
      }),
    );
  });

  it('still blocks closing for direct FlowExitAllException mock results', async () => {
    const pageModel = createPageModel({
      dispatchEvent: vi.fn().mockResolvedValue([new FlowExitAllException('closeFlow', 'page-model-uid', 'exitAll')]),
    });
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(false);
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'close',
      expect.objectContaining({
        controller: expect.any(Object),
      }),
    );
  });
});
